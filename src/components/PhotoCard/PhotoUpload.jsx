import React, { useState, useRef, useEffect } from 'react';

// ─── Content that REACTS to user state ─────────────────────────────────────
const CONTENT = {
    before: {
        topTag:    'MARCH 8 · WOMEN\'S DAY 2025',
        headline1: 'One photo.',
        headline2: 'One card that says',
        headline3: 'everything',
        sub:       'Upload a photo of the woman who\nmoves your world — or yourself.',
        circleTop:    'Who are you\ncelebrating today?',
        circleBottom: '↓  tap to add her photo  ↓',
        cta:       '📷  Add the Photo',
        pulse:     true,
    },
    after: {
        topTag:    '✦  SHE\'S GOING TO LOVE THIS  ✦',
        headline1: 'There she is.',
        headline2: 'Now let\'s turn this into',
        headline3: 'something she keeps. 💛',
        sub:       'A card made by you, for her —\ncarrying NIAT\'s love forward.',
        circleTop:    'Perfect. 🌸',
        circleBottom: 'tap to change',
        cta:       '✨  Create Her Card',
        pulse:     false,
    },
};

// ─── Loading messages ───────────────────────────────────────────────────────
const LOADING_SEQUENCE = [
    { text: 'Picking the perfect design...',  emoji: '🎨' },
    { text: 'Framing her beautifully...',      emoji: '🖼️' },
    { text: 'Adding a little NIAT magic...',   emoji: '✨' },
    { text: 'Almost ready to amaze her...',    emoji: '🌸' },
];

export default function PhotoUpload({ userData, setUserData, onNext }) {
    const [localPhoto, setLocalPhoto]     = useState(null);
    const [localPhotoFile, setLocalPhotoFile] = useState(null);
    const [loadingStep, setLoadingStep]   = useState(false);
    const [loadingIdx, setLoadingIdx]     = useState(0);
    const [progress, setProgress]         = useState(0);
    const [justUploaded, setJustUploaded] = useState(false); // for reveal animation
    const fileInputRef = useRef(null);

    const content = localPhoto ? CONTENT.after : CONTENT.before;

    // ── Photo upload ────────────────────────────────────────────────────────
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (localPhoto?.startsWith('blob:')) URL.revokeObjectURL(localPhoto);
        const url = URL.createObjectURL(file);
        setLocalPhoto(url);
        setLocalPhotoFile(file);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 800);
        e.target.value = '';
    };

    // ── Create card ─────────────────────────────────────────────────────────
    const handleCreate = () => {
        setUserData(prev => ({ ...prev, photo: localPhoto, photoFile: localPhotoFile }));
        setLoadingStep(true);
    };

    // ── Loading sequence ────────────────────────────────────────────────────
    useEffect(() => {
        if (!loadingStep) return;
        let p = 0;
        const pInterval = setInterval(() => {
            p += 1.6;
            setProgress(Math.min(p, 100));
            const idx = Math.floor((p / 100) * LOADING_SEQUENCE.length);
            setLoadingIdx(Math.min(idx, LOADING_SEQUENCE.length - 1));
            if (p >= 100) {
                clearInterval(pInterval);
                setTimeout(() => onNext(), 300);
            }
        }, 25);
        return () => clearInterval(pInterval);
    }, [loadingStep]);

    // ── Loading screen ──────────────────────────────────────────────────────
    if (loadingStep) {
        const msg = LOADING_SEQUENCE[loadingIdx];
        return (
            <div style={{
                width: '100vw', minHeight: '100vh',
                background: 'linear-gradient(160deg, #0d0020 0%, #4a0040 35%, #9b1060 65%, #e91e8c 100%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '28px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Background shimmer orbs */}
                {['#f9a825','#ce93d8','#ff6b9d'].map((c, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: 160, height: 160,
                        borderRadius: '50%',
                        background: c, opacity: 0.08,
                        filter: 'blur(50px)',
                        top: `${20 + i * 28}%`,
                        left: `${10 + i * 35}%`,
                        animation: `orbFloat ${7 + i}s ease-in-out ${i}s infinite`,
                    }} />
                ))}

                {/* Photo preview in glowing ring */}
                {localPhoto && (
                    <div style={{
                        width: '110px', height: '110px',
                        borderRadius: '50%',
                        border: '3px solid #f9a825',
                        overflow: 'hidden',
                        boxShadow: '0 0 0 8px rgba(249,168,37,0.15), 0 0 40px rgba(249,168,37,0.3)',
                        animation: 'scaleIn 0.5s ease',
                        flexShrink: 0,
                    }}>
                        <img src={localPhoto} alt="" style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', display: 'block',
                        }} />
                    </div>
                )}

                {/* Emoji */}
                <div style={{
                    fontSize: '44px',
                    animation: 'fadeIn 0.4s ease',
                    key: loadingIdx,
                }}>
                    {msg.emoji}
                </div>

                {/* Text */}
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '22px',
                    color: 'white',
                    textAlign: 'center',
                    padding: '0 32px',
                    lineHeight: 1.4,
                    animation: 'fadeInUp 0.4s ease',
                }}>
                    {msg.text}
                </div>

                {/* Progress bar */}
                <div style={{
                    width: '220px', height: '4px',
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: '999px', overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: 'linear-gradient(90deg, #f9a825, #e91e8c)',
                        borderRadius: '999px',
                        transition: 'width 0.025s linear',
                        boxShadow: '0 0 10px rgba(249,168,37,0.7)',
                    }} />
                </div>

                {/* NIAT logo */}
                <img src="/niat.png" alt="NIAT" style={{
                    height: '28px', width: 'auto',
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.5,
                }} />
            </div>
        );
    }

    // ── Main screen ─────────────────────────────────────────────────────────
    return (
        <div style={{
            width: '100vw', minHeight: '100vh',
            background: 'linear-gradient(160deg, #0d0020 0%, #4a0040 35%, #9b1060 65%, #e91e8c 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 16px 40px',
            boxSizing: 'border-box',
            position: 'relative', overflow: 'hidden',
            animation: 'fadeIn 0.6s ease',
        }}>

            {/* ── Background orbs ──────────────────────────────────── */}
            {[
                { s: 200, t: '2%',  l: '-8%',  c: '#f9a825', d: '0s',   dr: '9s'  },
                { s: 140, t: '60%', l: '78%',  c: '#ce93d8', d: '2s',   dr: '11s' },
                { s: 100, t: '38%', l: '-4%',  c: '#ff80ab', d: '1s',   dr: '8s'  },
                { s: 80,  t: '82%', l: '18%',  c: '#f9a825', d: '3.5s', dr: '10s' },
                { s: 120, t: '12%', l: '82%',  c: '#e91e8c', d: '0.5s', dr: '12s' },
            ].map((o, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: o.s, height: o.s,
                    borderRadius: '50%',
                    background: o.c, opacity: 0.09,
                    filter: 'blur(55px)',
                    top: o.t, left: o.l,
                    animation: `orbFloat ${o.dr} ease-in-out ${o.d} infinite`,
                    pointerEvents: 'none', zIndex: 0,
                }} />
            ))}

            {/* ── Floating petals ───────────────────────────────────── */}
            {[
                { t: '8%',  l: '6%',  s: 14, d: '0s',   dr: '7s'  },
                { t: '22%', l: '88%', s: 18, d: '1.5s', dr: '9s'  },
                { t: '55%', l: '4%',  s: 12, d: '0.8s', dr: '8s'  },
                { t: '75%', l: '90%', s: 16, d: '2.5s', dr: '6s'  },
                { t: '90%', l: '45%', s: 20, d: '1s',   dr: '10s' },
            ].map((p, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: p.t, left: p.l,
                    fontSize: p.s, opacity: 0.18,
                    animation: `petalFloat ${p.dr} ease-in-out ${p.d} infinite`,
                    pointerEvents: 'none', zIndex: 0,
                }}>🌸</div>
            ))}

            {/* ── TOP TAG ───────────────────────────────────────────── */}
            <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                color: '#f9a825',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: '600',
                marginBottom: '20px',
                zIndex: 1,
                animation: 'fadeIn 0.8s ease 0.1s both',
                transition: 'all 0.5s ease',
                textAlign: 'center',
            }}>
                {content.topTag}
            </div>

            {/* ── HEADLINE — reacts to photo state ─────────────────── */}
            <div style={{
                textAlign: 'center',
                marginBottom: '28px',
                zIndex: 1,
                animation: 'fadeInUp 0.7s ease 0.2s both',
            }}>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 8vw, 48px)',
                    fontWeight: '300',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.15,
                    transition: 'all 0.5s ease',
                }}>
                    {content.headline1}
                </div>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 8vw, 48px)',
                    fontWeight: '400',
                    color: 'white',
                    lineHeight: 1.15,
                    transition: 'all 0.5s ease',
                }}>
                    {content.headline2}
                </div>
                <div style={{
                    fontFamily: 'var(--font-script, cursive)',
                    fontSize: 'clamp(36px, 9vw, 54px)',
                    color: '#f9a825',
                    lineHeight: 1.2,
                    textShadow: '0 0 30px rgba(249,168,37,0.4)',
                    transition: 'all 0.5s ease',
                }}>
                    {content.headline3}
                </div>
            </div>

            {/* ── UPLOAD ZONE — the star of the screen ─────────────── */}
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', zIndex: 1,
                animation: 'panelSlideUp 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.3s both',
            }}>
                {/* Text ABOVE circle — reacts */}
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.55)',
                    textAlign: 'center',
                    marginBottom: '16px',
                    letterSpacing: '0.04em',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.6,
                    transition: 'all 0.4s ease',
                    minHeight: '42px',
                }}>
                    {content.circleTop}
                </div>

                {/* Upload circle */}
                <label htmlFor="photo-input" style={{ cursor: 'pointer', position: 'relative', display: 'block' }}>

                    {/* Outer glow ring — pulses when no photo */}
                    <div style={{
                        position: 'absolute', inset: '-12px',
                        borderRadius: '50%',
                        animation: localPhoto ? 'none' : 'ringPulse 2.2s ease-out infinite',
                        background: 'transparent',
                        border: '2px solid rgba(249,168,37,0.25)',
                        pointerEvents: 'none',
                    }} />

                    {/* Rotating dashed ring — only before upload */}
                    {!localPhoto && (
                        <div style={{
                            position: 'absolute', inset: '-4px',
                            borderRadius: '50%',
                            border: '2px dashed rgba(249,168,37,0.6)',
                            animation: 'spinSlow 10s linear infinite',
                            pointerEvents: 'none',
                        }} />
                    )}

                    {/* Gold solid ring — after upload */}
                    {localPhoto && (
                        <div style={{
                            position: 'absolute', inset: '-5px',
                            borderRadius: '50%',
                            border: '3px solid #f9a825',
                            boxShadow: '0 0 24px rgba(249,168,37,0.55), 0 0 48px rgba(249,168,37,0.2)',
                            animation: 'scaleIn 0.4s cubic-bezier(0.2,0.8,0.2,1)',
                            pointerEvents: 'none',
                        }} />
                    )}

                    {/* Main circle */}
                    <div style={{
                        width: '156px', height: '156px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: localPhoto
                            ? 'transparent'
                            : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.4s ease',
                        animation: justUploaded ? 'scaleIn 0.5s cubic-bezier(0.2,0.8,0.2,1)' : 'none',
                    }}>
                        {localPhoto ? (
                            <img
                                key={localPhoto}
                                src={localPhoto}
                                alt="Preview"
                                onLoad={e => e.target.style.opacity = '1'}
                                style={{
                                    width: '100%', height: '100%',
                                    objectFit: 'cover', display: 'block',
                                    opacity: 0, transition: 'opacity 0.4s ease',
                                }}
                            />
                        ) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '8px',
                            }}>
                                {/* Camera icon */}
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                                    stroke="rgba(249,168,37,0.8)" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                <span style={{
                                    fontSize: '10px',
                                    color: 'rgba(255,255,255,0.4)',
                                    fontFamily: 'var(--font-body)',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                }}>her photo</span>
                            </div>
                        )}
                    </div>

                    {/* Gold checkmark badge */}
                    {localPhoto && (
                        <div style={{
                            position: 'absolute', bottom: '4px', right: '4px',
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f9a825, #ffca28)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: 'bold', color: 'white',
                            boxShadow: '0 4px 14px rgba(249,168,37,0.6)',
                            animation: 'scaleIn 0.3s cubic-bezier(0.2,0.8,0.2,1)',
                            zIndex: 2,
                        }}>✓</div>
                    )}
                </label>

                {/* Text BELOW circle — reacts */}
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: localPhoto ? '#f9a825' : 'rgba(255,255,255,0.35)',
                    textAlign: 'center',
                    marginTop: '18px',
                    letterSpacing: '0.06em',
                    transition: 'all 0.4s ease',
                    fontStyle: localPhoto ? 'italic' : 'normal',
                }}>
                    {content.circleBottom}
                </div>

                <input
                    type="file"
                    id="photo-input"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                />
            </div>

            {/* ── SUBTEXT — reacts ─────────────────────────────────── */}
            <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
                margin: '24px 0 28px',
                padding: '0 8px',
                zIndex: 1,
                transition: 'all 0.5s ease',
                maxWidth: '300px',
            }}>
                {content.sub}
            </div>

            {/* ── CTA BUTTON ────────────────────────────────────────── */}
            <button
                onClick={localPhoto ? handleCreate : () => fileInputRef.current?.click()}
                style={{
                    width: 'min(340px, calc(100vw - 48px))',
                    height: '56px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '17px',
                    fontWeight: '700',
                    letterSpacing: '0.02em',
                    zIndex: 1,
                    transition: 'all 0.4s ease',
                    ...(localPhoto ? {
                        background: 'linear-gradient(135deg, #f9a825 0%, #e91e8c 60%, #9b1060 100%)',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(249,168,37,0.45), 0 0 0 1px rgba(255,255,255,0.1)',
                        animation: 'ctaPulse 2s ease infinite',
                    } : {
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.15)',
                    }),
                }}
            >
                {content.cta}
            </button>

            {/* Privacy note */}
            <div style={{
                marginTop: '16px',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '0.04em',
                zIndex: 1,
                textAlign: 'center',
            }}>
                🔒  Photo stays on your device · Never stored
            </div>

            {/* ── Step indicator ────────────────────────────────────── */}
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '8px',
                marginTop: '32px', zIndex: 1,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Step 1 done */}
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#f9a825',
                        boxShadow: '0 0 8px rgba(249,168,37,0.7)',
                    }} />
                    <div style={{ width: '28px', height: '2px', background: 'rgba(255,255,255,0.25)', borderRadius: '999px' }} />
                    {/* Step 2 current */}
                    <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 0 0 3px rgba(255,255,255,0.2)',
                    }} />
                    <div style={{ width: '28px', height: '2px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px' }} />
                    {/* Step 3 upcoming */}
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.25)',
                    }} />
                </div>
                <div style={{ display: 'flex', gap: '52px' }}>
                    {['Wish', 'Card', 'Share'].map((l, i) => (
                        <span key={l} style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px',
                            color: i === 1 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: i === 1 ? '600' : '400',
                        }}>{l}</span>
                    ))}
                </div>
            </div>

        </div>
    );
}