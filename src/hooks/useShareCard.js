import html2canvas from 'html2canvas';


export async function captureCard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element #${elementId} not found`);

    // Wait for fonts
    await document.fonts.ready;

    // Wait for all images inside element to load
    const images = element.querySelectorAll('img');
    await Promise.all(
        Array.from(images).map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        })
    );

    // Small paint flush delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',   // ← FIX 1: never null, always white fallback
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (node) => node.classList?.contains('no-capture'),
        onclone: (_doc, clonedEl) => {
            // FIX 2: strip all transforms so carousel position doesn't affect capture
            clonedEl.style.transform = 'none';
            clonedEl.style.position = 'relative';
            clonedEl.style.top = 'auto';
            clonedEl.style.left = 'auto';
            clonedEl.style.opacity = '1';
            clonedEl.style.visibility = 'visible';
            clonedEl.style.display = 'flex';
            clonedEl.style.zIndex = 'auto';
        },
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('canvas.toBlob returned null'));
            },
            'image/png',
            1.0
        );
    });
}

/**
 * Share via Web Share API — falls back to download on desktop
 */
export async function shareToWhatsAppStatus(
    blob,
    filename = 'womens-day-card.png',
    text = 'Wishing you a beautiful day — from NIAT 🌸'
) {
    const file = new File([blob], filename, { type: 'image/png' });

    // ALWAYS try to copy the caption to clipboard, because WhatsApp and Desktop often drop the text payload
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        }
    } catch (e) {
        console.warn('Clipboard write failed:', e);
    }

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'A card for you 🌸',
                text,
            });
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed, falling back to download', err);
                downloadBlob(blob, filename);
                alert("Image downloaded! The message caption has been copied to your clipboard — you can paste it when sharing the image.");
            }
            return false;
        }
    } else {
        downloadBlob(blob, filename);
        alert("Image downloaded! The message caption has been copied to your clipboard — you can paste it when sharing the image.");
        return true;
    }
}

/**
 * Download blob as file
 */
export function downloadBlob(blob, filename = 'womens-day-card.png') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}