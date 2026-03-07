// src/hooks/useCardCanvas.js
// Fully proportional — every value is a % of canvas size.

const CARD_W = 800;
const CARD_H = 960;  // cropped to reduce bottom space

const W = (p) => CARD_W * p;
const H = (p) => CARD_H * p;
const S = (p) => CARD_W * p;  // font size scaled to width

async function waitForFont(spec) {
    await document.fonts.ready;
    try { await document.fonts.load(spec); } catch { /* ignore */ }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawCircleImage(ctx, img, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
    const iw = img.width * scale, ih = img.height * scale;
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
    ctx.restore();
}

function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => rej(new Error('Image failed'));
        img.src = src;
    });
}

function hexToRgba(hex, a) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})` : hex;
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
        else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
}

// ─── PHOTO CARD ───────────────────────────────────────────────────────────────
export async function drawCardToBlob({ photoBase64, logoBase64, quote, occasionLine }) {
    // All font sizes as % of card width — slightly larger for readability
    const FS_TITLE = S(0.058);   // "Women's Day 2025" title
    const FS_QUOTE = S(0.038);  // quote text
    const FS_OCCASION = S(0.030);
    const FS_DATE = S(0.024);
    const FS_SIGNOFF = S(0.028);
    const FS_WATER = S(0.021);

    await waitForFont(`600 ${FS_TITLE}px "Cormorant Garamond"`);
    await waitForFont(`400italic ${FS_QUOTE}px "Cormorant Garamond"`);
    await waitForFont(`500 ${FS_OCCASION}px "DM Sans"`);

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');

    // ── Background #991B1C ───────────────────────────────────────────────────
    roundRect(ctx, 0, 0, CARD_W, CARD_H, W(0.05));
    ctx.fillStyle = '#991B1C';
    ctx.fill();
    ctx.clip();

    // Subtle radial vignette
    const vig = ctx.createRadialGradient(W(0.5), H(0.35), 0, W(0.5), H(0.35), W(0.75));
    vig.addColorStop(0, 'rgba(255,255,255,0.06)');
    vig.addColorStop(0.5, 'rgba(0,0,0,0.0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.textBaseline = 'top'; // Fix rendering top-to-bottom!

    // ── Top gold accent line ─────────────────────────────────────────────────
    const tl = ctx.createLinearGradient(0, 0, CARD_W, 0);
    tl.addColorStop(0, 'transparent');
    tl.addColorStop(0.5, '#f9a825');
    tl.addColorStop(1, 'transparent');
    ctx.fillStyle = tl;
    ctx.fillRect(0, 0, CARD_W, H(0.006));

    // ── Date — top right ──────────────────────────────────────────────────────
    ctx.font = `600 ${FS_DATE}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('March 8, 2025', W(0.94), H(0.045));

    // ── NIAT Logo — top-left ──────────────────────────────────────────────────
    const logoLeft = W(0.06);
    const logoTop = H(0.045);
    const logoMaxH = H(0.05); // 48px
    const logoMaxW = W(0.20);
    if (logoBase64) {
        try {
            const logo = await loadImage(logoBase64);
            const scale = Math.min(logoMaxW / logo.width, logoMaxH / logo.height, 1);
            const drawW = Math.max(1, Math.round(logo.width * scale));
            const drawH = Math.max(1, Math.round(logo.height * scale));
            ctx.globalAlpha = 0.98;
            ctx.drawImage(logo, logoLeft, logoTop, drawW, drawH);
            ctx.globalAlpha = 1;
        } catch { /* ignore */ }
    }

    // ── Title — "Women's Day 2025" ───────────────────────────────────────────
    const titleY = logoTop + logoMaxH + H(0.04);
    ctx.font = `600 ${FS_TITLE}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText("Women's Day 2025", W(0.5), titleY);

    // ── Photo circle ─────────────────────────────────────────────────────────
    const photoR = W(0.18);
    const photoCY = titleY + FS_TITLE + H(0.04) + photoR;

    // Outer halo
    ctx.beginPath();
    ctx.arc(W(0.5), photoCY, photoR + W(0.024), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249,168,37,0.12)';
    ctx.fill();

    // Gold ring
    ctx.beginPath();
    ctx.arc(W(0.5), photoCY, photoR + W(0.009), 0, Math.PI * 2);
    ctx.strokeStyle = '#f9a825';
    ctx.lineWidth = W(0.008);
    ctx.stroke();

    // Photo background
    ctx.beginPath();
    ctx.arc(W(0.5), photoCY, photoR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();

    if (photoBase64) {
        try {
            const photo = await loadImage(photoBase64);
            drawCircleImage(ctx, photo, W(0.5), photoCY, photoR);
        } catch { /* ignore */ }
    }

    // ── Content below photo ───────────────────────────────────────────────────
    let y = photoCY + photoR + H(0.045);

    // Gold divider
    const dW = W(0.08);
    ctx.fillStyle = 'rgba(249,168,37,0.75)';
    ctx.fillRect(W(0.5) - dW / 2, y, dW, H(0.003));
    y += H(0.035);

    // Quote
    const QFONT = `400italic ${FS_QUOTE}px "Cormorant Garamond", Georgia, serif`;
    const QMAX_W = W(0.80);
    const QLINE_H = FS_QUOTE * 1.5;

    ctx.font = QFONT;
    const qLines = wrapText(ctx, `"${quote}"`, QMAX_W);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    for (const line of qLines) {
        ctx.fillText(line, W(0.5), y);
        y += QLINE_H;
    }
    y += H(0.015);

    // Occasion line
    ctx.font = `500 ${FS_OCCASION}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(249,168,37,0.92)';
    ctx.textAlign = 'center';
    ctx.fillText(occasionLine, W(0.5), y);
    y += H(0.035);

    // Sign-off 
    ctx.font = `300italic ${FS_SIGNOFF}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.textAlign = 'center';
    ctx.fillText('— with love, Team NIAT', W(0.5), y);



    return new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
    );
}

// ─── CAROUSEL CARD ────────────────────────────────────────────────────────────
export async function drawCarouselCardToBlob(card, mentionData = {}) {
    const FS_QUOTE = S(0.056);
    const FS_TITLE = S(0.034);
    const FS_CAT = S(0.026);
    const FS_MENTION = S(0.038);

    await waitForFont(`300italic ${FS_QUOTE}px "Cormorant Garamond"`);
    await waitForFont(`600 ${FS_TITLE}px "DM Sans"`);

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');

    roundRect(ctx, 0, 0, CARD_W, CARD_H, W(0.05));
    ctx.fillStyle = card.bg;
    ctx.fill();
    ctx.clip();

    ctx.fillStyle = card.accent;
    ctx.fillRect(0, 0, CARD_W, H(0.007));

    // Petal decoration
    ctx.save();
    ctx.fillStyle = card.accent; ctx.globalAlpha = 0.10;
    ctx.translate(W(0.96), -H(0.03)); ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(60, 10); ctx.bezierCurveTo(40, 30, 20, 60, 60, 110);
    ctx.bezierCurveTo(100, 60, 80, 30, 60, 10); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Category pill
    ctx.font = `500 ${FS_CAT}px "DM Sans", sans-serif`;
    const pPX = W(0.032), pPY = H(0.016);
    const catW = ctx.measureText(card.category.toUpperCase()).width;
    const pW = catW + pPX * 2, pH = FS_CAT + pPY * 2;
    ctx.fillStyle = hexToRgba(card.accent, 0.13);
    roundRect(ctx, W(0.04), H(0.036), pW, pH, pH / 2); ctx.fill();
    ctx.strokeStyle = hexToRgba(card.accent, 0.28); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = card.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(card.category.toUpperCase(), W(0.04) + pW / 2, H(0.036) + pH / 2 + 2);
    ctx.textBaseline = 'alphabetic';

    // Quote centered
    const qFS = card.quote.length > 80 ? FS_QUOTE * 0.84 : FS_QUOTE;
    const qSpec = `300italic ${qFS}px "Cormorant Garamond", Georgia, serif`;
    ctx.font = qSpec;
    const qLines = wrapText(ctx, `"${card.quote}"`, W(0.84));
    const lineH = qFS * 1.5;
    const blockH = qLines.length * lineH + H(0.08);
    let cy = H(0.5) - blockH / 2;

    ctx.fillStyle = card.textColor || '#1a0a12'; ctx.textAlign = 'center';
    for (const line of qLines) { ctx.fillText(line, W(0.5), cy); cy += lineH; }

    ctx.fillStyle = card.accent;
    ctx.fillRect(W(0.5) - W(0.05), cy + H(0.01), W(0.1), H(0.003));
    cy += H(0.054);

    ctx.font = `600 ${FS_TITLE}px "DM Sans", sans-serif`;
    ctx.fillStyle = card.accent; ctx.textAlign = 'center';
    ctx.fillText(`— ${card.title}`, W(0.5), cy);

    if (mentionData.recipientName) {
        let text = `For ${mentionData.recipientName}`;
        if (mentionData.senderName) text += `, from ${mentionData.senderName}`;
        text += ' 💜';
        ctx.font = `300italic ${FS_MENTION}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = card.accent; ctx.textAlign = 'center';
        ctx.fillText(text, W(0.5), H(0.944));
    }

    ctx.font = `400 ${S(0.025)}px "DM Sans", sans-serif`;
    ctx.fillStyle = hexToRgba(card.accent, 0.30); ctx.textAlign = 'right';
    ctx.fillText('NIAT', W(0.965), H(0.972));

    return new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
    );
}

// ─── Share & Download ─────────────────────────────────────────────────────────
export async function shareToWhatsAppStatus(blob, filename = 'womens-day-card.png', text = 'Wishing you a beautiful day — from NIAT 🌸') {
    const file = new File([blob], filename, { type: 'image/png' });
    try {
        if (navigator.clipboard && window.isSecureContext)
            await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'A card for you 🌸', text }); return true; }
        catch (err) {
            if (err.name !== 'AbortError') { downloadBlob(blob, filename); alert('Image downloaded! Caption copied to clipboard.'); }
            return false;
        }
    } else {
        downloadBlob(blob, filename);
        alert('Image downloaded! Caption copied to clipboard.');
        return true;
    }
}

export function downloadBlob(blob, filename = 'womens-day-card.png') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}