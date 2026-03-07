// src/hooks/setupFonts.js
// Call this ONCE at app startup (in main.jsx or App.jsx).
// It reads every @font-face already declared in your CSS,
// force-loads them, and caches them so canvas can use them instantly.

export async function preloadAllFonts() {
    await document.fonts.ready;

    const toLoad = [];
    document.fonts.forEach(face => {
        if (face.status !== 'loaded') toLoad.push(face.load());
    });

    if (toLoad.length > 0) {
        await Promise.allSettled(toLoad);
        // Extra tick for canvas to pick them up
        await new Promise(r => setTimeout(r, 100));
    }
}