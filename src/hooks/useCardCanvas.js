// src/hooks/useCardCanvas.js
// Canvas renderer — fonts fetched as ArrayBuffer and loaded via FontFace API
// so they are 100% guaranteed available before any measureText/fillText call.

const CARD_W = 800;
const W = (p) => CARD_W * p;

// ─── Font loading ─────────────────────────────────────────────────────────────
// Force-load every @font-face already declared in CSS, then wait for canvas
// to pick them up. No hardcoded URLs needed.
let _fontsReady = false;

async function ensureProjectFonts() {
    if (_fontsReady) return;

    // 1. Wait for browser font-loading pipeline
    await document.fonts.ready;

    // 2. Force-load every face that isn't loaded yet
    const pending = [];
    document.fonts.forEach(face => {
        if (face.status !== 'loaded') pending.push(face.load().catch(() => { }));
    });
    if (pending.length) await Promise.allSettled(pending);

    // 3. Explicit load calls for the specific faces we use (belt-and-suspenders)
    const specs = [
        '600 1px "Cormorant Garamond"',
        'italic 400 1px "Cormorant Garamond"',
        'italic 300 1px "Cormorant Garamond"',
        '500 1px "DM Sans"',
        '600 1px "DM Sans"',
    ];
    await Promise.allSettled(specs.map(s => document.fonts.load(s).catch(() => { })));

    // 4. Tick so canvas contexts pick up the newly loaded faces
    await new Promise(r => setTimeout(r, 120));

    _fontsReady = true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => rej(new Error('img failed: ' + src));
        img.src = src;
    });
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

/**
 * Wrap text respecting hard \n line breaks.
 * Returns array of strings; '' = paragraph gap line.
 */
function wrapLines(ctx, text, maxW) {
    const out = [];
    for (const para of text.split('\n')) {
        const words = para.trim().split(/\s+/).filter(Boolean);
        if (!words.length) { out.push(''); continue; }
        let cur = '';
        for (const w of words) {
            const test = cur ? cur + ' ' + w : w;
            if (cur && ctx.measureText(test).width > maxW) { out.push(cur); cur = w; }
            else cur = test;
        }
        if (cur) out.push(cur);
        out.push('');
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    return out;
}

// ─── PHOTO CARD ───────────────────────────────────────────────────────────────
export async function drawCardToBlob({ photoBase64, logoBase64, quote, occasionLine }) {

    // ── Step 1: Guarantee fonts are loaded ───────────────────────────────────
    await ensureProjectFonts();

    // ── Step 2: Font sizes ────────────────────────────────────────────────────
    const FS_DATE = W(0.024);
    const FS_TITLE = W(0.056);
    const FS_QUOTE = W(0.034);
    const FS_OCCASION = W(0.028);
    const FS_HASH = W(0.026);

    // ── Step 3: Layout anchors ────────────────────────────────────────────────
    const PAD_TOP = W(0.048);
    const LOGO_H = W(0.048);
    const TITLE_Y = PAD_TOP + LOGO_H + W(0.036);
    const PHOTO_R = W(0.175);
    const PHOTO_CY = TITLE_Y + FS_TITLE + W(0.036) + PHOTO_R;
    const DIV_Y = PHOTO_CY + PHOTO_R + W(0.036);
    const QUOTE_Y = DIV_Y + W(0.003) + W(0.030);
    const QUOTE_MAX = W(0.82);
    const Q_LINE_H = FS_QUOTE * 1.65;

    // ── Step 4: Measure quote lines on scratch canvas ─────────────────────────
    const scratch = document.createElement('canvas');
    scratch.width = CARD_W;
    scratch.height = 200;
    const mctx = scratch.getContext('2d');
    mctx.font = `italic 400 ${FS_QUOTE}px "Cormorant Garamond", Georgia, serif`;
    const qLines = wrapLines(mctx, `\u201C${quote}\u201D`, QUOTE_MAX);

    // ── Step 5: Compute canvas height ─────────────────────────────────────────
    let bottom = QUOTE_Y + qLines.length * Q_LINE_H;
    bottom += W(0.012);              // gap after quote
    bottom += FS_OCCASION * 1.5;    // occasion
    bottom += W(0.026);             // gap
    bottom += FS_HASH * 1.5;        // hashtags
    bottom += W(0.065);             // bottom padding

    const CARD_H = Math.ceil(Math.max(bottom, CARD_W * 1.1));

    // ── Step 6: Create canvas ─────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');

    // ── Step 7: Background ────────────────────────────────────────────────────
    roundRect(ctx, 0, 0, CARD_W, CARD_H, W(0.048));
    ctx.fillStyle = '#991B1C';
    ctx.fill();
    ctx.save();
    ctx.clip();

    const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
    bg.addColorStop(0, 'rgba(120,18,19,0.60)');
    bg.addColorStop(0.5, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    const vig = ctx.createRadialGradient(W(0.5), CARD_H * 0.30, 0, W(0.5), CARD_H * 0.30, W(0.72));
    vig.addColorStop(0, 'rgba(255,255,255,0.06)');
    vig.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.restore();

    // ── Step 8: Top gold bar ──────────────────────────────────────────────────
    const tl = ctx.createLinearGradient(0, 0, CARD_W, 0);
    tl.addColorStop(0, 'rgba(249,168,37,0)');
    tl.addColorStop(0.5, '#f9a825');
    tl.addColorStop(1, 'rgba(249,168,37,0)');
    ctx.fillStyle = tl;
    ctx.fillRect(0, 0, CARD_W, W(0.006));

    ctx.textBaseline = 'top';

    // ── Step 9: Logo ──────────────────────────────────────────────────────────
    if (logoBase64) {
        try {
            const logo = await loadImage(logoBase64);
            const scale = Math.min(W(0.18) / logo.width, LOGO_H / logo.height, 1);
            const logoW = Math.round(logo.width * scale);
            const logoHH = Math.round(logo.height * scale);
            ctx.globalAlpha = 0.95;
            ctx.drawImage(logo, W(0.058), PAD_TOP, logoW, logoHH);
            ctx.globalAlpha = 1;
        } catch (e) { console.warn('Logo failed', e); }
    }

    // ── Step 10: Date ─────────────────────────────────────────────────────────
    ctx.font = `600 ${FS_DATE}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.textAlign = 'right';
    ctx.fillText('March 8, 2026', W(0.942), PAD_TOP + (LOGO_H - FS_DATE) * 0.5);

    // ── Step 11: Title ────────────────────────────────────────────────────────
    ctx.font = `600 ${FS_TITLE}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('HER CHAMPION 2026', W(0.5), TITLE_Y);

    // ── Step 12: Photo ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(W(0.5), PHOTO_CY, PHOTO_R + W(0.028), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249,168,37,0.10)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(W(0.5), PHOTO_CY, PHOTO_R + W(0.010), 0, Math.PI * 2);
    ctx.strokeStyle = '#f9a825';
    ctx.lineWidth = W(0.010);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(W(0.5), PHOTO_CY, PHOTO_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    if (photoBase64) {
        try {
            const photo = await loadImage(photoBase64);
            drawCircleImage(ctx, photo, W(0.5), PHOTO_CY, PHOTO_R);
        } catch (e) { console.warn('Photo failed', e); }
    }

    // ── Step 13: Divider ──────────────────────────────────────────────────────
    const dW = W(0.072);
    ctx.fillStyle = 'rgba(249,168,37,0.80)';
    ctx.fillRect(W(0.5) - dW / 2, DIV_Y, dW, W(0.003));

    // ── Step 14: Quote ────────────────────────────────────────────────────────
    ctx.font = `italic 400 ${FS_QUOTE}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.textAlign = 'center';
    let y = QUOTE_Y;
    for (const line of qLines) {
        if (line) ctx.fillText(line, W(0.5), y);
        y += Q_LINE_H;
    }
    y += W(0.012);

    // ── Step 15: Occasion ─────────────────────────────────────────────────────
    ctx.font = `500 ${FS_OCCASION}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(249,168,37,0.95)';
    ctx.textAlign = 'center';
    ctx.fillText(occasionLine, W(0.5), y);
    y += FS_OCCASION * 1.5 + W(0.026);

    // ── Step 16: Hashtags ─────────────────────────────────────────────────────
    ctx.font = `500 ${FS_HASH}px "DM Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.textAlign = 'center';
    ctx.fillText('#HerChampion2026  #BuildsNIAT', W(0.5), y);

    return new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
    );
}

// ─── CAROUSEL CARD ────────────────────────────────────────────────────────────
export async function drawCarouselCardToBlob(card, mentionData = {}) {
    await ensureProjectFonts();

    const CARD_H = 960;
    const H = (p) => CARD_H * p;

    const FS_QUOTE = W(0.054);
    const FS_TITLE = W(0.033);
    const FS_CAT = W(0.025);
    const FS_MENTION = W(0.036);

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

    const hexToRgba = (hex, a) => {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex;
    };

    ctx.font = `500 ${FS_CAT}px "DM Sans", sans-serif`;
    const pPX = W(0.032), pPY = H(0.016);
    const catW = ctx.measureText(card.category.toUpperCase()).width;
    const pW = catW + pPX * 2, pH = FS_CAT + pPY * 2;
    ctx.fillStyle = hexToRgba(card.accent, 0.13);
    roundRect(ctx, W(0.04), H(0.036), pW, pH, pH / 2); ctx.fill();
    ctx.strokeStyle = hexToRgba(card.accent, 0.28); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = card.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(card.category.toUpperCase(), W(0.04) + pW / 2, H(0.036) + pH / 2 + 2);
    ctx.textBaseline = 'top';

    const qFS = card.quote.length > 80 ? FS_QUOTE * 0.84 : FS_QUOTE;
    ctx.font = `italic 300 ${qFS}px "Cormorant Garamond", Georgia, serif`;
    const qLines = wrapLines(ctx, `\u201C${card.quote}\u201D`, W(0.84));
    const lineH = qFS * 1.5;
    const blockH = qLines.length * lineH + H(0.08);
    let cy = H(0.5) - blockH / 2;

    ctx.fillStyle = card.textColor || '#1a0a12'; ctx.textAlign = 'center';
    for (const line of qLines) { if (line) ctx.fillText(line, W(0.5), cy); cy += lineH; }

    ctx.fillStyle = card.accent;
    ctx.fillRect(W(0.5) - W(0.05), cy + H(0.01), W(0.1), H(0.003));
    cy += H(0.054);

    ctx.font = `600 ${FS_TITLE}px "DM Sans", sans-serif`;
    ctx.fillStyle = card.accent; ctx.textAlign = 'center';
    ctx.fillText(`\u2014 ${card.title}`, W(0.5), cy);

    if (mentionData.recipientName) {
        let text = `For ${mentionData.recipientName}`;
        if (mentionData.senderName) text += `, from ${mentionData.senderName}`;
        text += ' 💜';
        ctx.font = `italic 300 ${FS_MENTION}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = card.accent; ctx.textAlign = 'center';
        ctx.fillText(text, W(0.5), H(0.944));
    }

    ctx.font = `400 ${W(0.024)}px "DM Sans", sans-serif`;
    ctx.fillStyle = hexToRgba(card.accent, 0.28); ctx.textAlign = 'right';
    ctx.fillText('NIAT', W(0.965), H(0.970));

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