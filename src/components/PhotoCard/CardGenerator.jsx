import React, { useState, useEffect, useRef } from 'react';
import CelebrationBurst from '../shared/CelebrationBurst';
import { drawCardToBlob, shareToWhatsAppStatus, downloadBlob } from '../../hooks/useCardCanvas';
import { trackEvent } from '../../lib/analytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const CARD_QUOTE =
    "She is writing the future. She is breaking ceilings no one admitted existed. " +
    "She is the reason the next generation believes it's possible.\n\n" +
    "And you are part of her story. You stood with her. You built with her. " +
    "You believed in her.\n\n" +
    "That makes you a Her Champion too.";

const OCCASION_LINE = "Happy Women's Day. 🌸";

async function blobUrlToBase64(blobUrl) {
    if (!blobUrl || !blobUrl.startsWith('blob:')) return blobUrl;
    try {
        const res = await fetch(blobUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(blob);
        });
    } catch { return blobUrl; }
}

export default function CardGenerator({ userData, onBrowseCards }) {
    // ── ref attached to the CARD div (not the scale wrapper) ─────────────────
    const cardRef = useRef(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [hasShared, setHasShared] = useState(false);
    const [actionDone, setActionDone] = useState(null);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [cardScale, setCardScale] = useState(1);
    const [cardHeight, setCardHeight] = useState(0);

    useEffect(() => {
        if (!cardRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) setCardHeight(entries[0].target.offsetHeight);
        });
        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [photoBase64, logoBase64]);

    useEffect(() => {
        if (!userData.photo) return;
        if (userData.photo.startsWith('data:')) { setPhotoBase64(userData.photo); return; }
        blobUrlToBase64(userData.photo).then(setPhotoBase64);
    }, [userData.photo]);

    useEffect(() => {
        const toDataUrl = blob => new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result); r.onerror = rej;
            r.readAsDataURL(blob);
        });
        fetch('/niat.png')
            .then(r => r.ok ? r.blob() : Promise.reject())
            .then(toDataUrl).then(setLogoBase64)
            .catch(() =>
                fetch('/niat1.png')
                    .then(r => r.ok ? r.blob() : Promise.reject())
                    .then(toDataUrl).then(setLogoBase64)
                    .catch(() => setLogoBase64(null))
            );
    }, []);

    useEffect(() => {
        const calc = () => {
            const avail = window.innerWidth - 32; // padding 16px each side
            setCardScale(avail < 380 ? avail / 380 : 1);
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    // ── Capture the real rendered card ────────────────────────────────────────
    const captureCard = async () => {
        return await drawCardToBlob({
            photoBase64,
            logoBase64,
            quote: CARD_QUOTE,
            occasionLine: OCCASION_LINE,
        });
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const blob = await captureCard();
            downloadBlob(blob, 'womens-day-card.png');
            await trackEvent('card_download');
            setHasShared(true);
            setActionDone('download');
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally { setIsGenerating(false); }
    };

    const handleShare = async () => {
        setIsGenerating(true);
        try {
            const blob = await captureCard();
            await shareToWhatsAppStatus(blob, 'womens-day-card.png');
            await trackEvent('card_share');
            setHasShared(true);
            setActionDone('share');
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally { setIsGenerating(false); }
    };

    if ((userData.photo && !photoBase64) || logoBase64 === undefined) {
        return (
            <div style={{
                width: '100vw', minHeight: '100vh', background: '#FFF1CC',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}>
                <div style={{ fontSize: '40px', animation: 'spin 3s linear infinite' }}>🌸</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#991B1C', fontWeight: '500' }}>
                    Preparing your card...
                </div>
            </div>
        );
    }

    const PREVIEW_W = 380;

    return (
        <div style={{
            width: '100vw', minHeight: '100vh', background: '#FFF1CC',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '16px 12px 40px', boxSizing: 'border-box',
            position: 'relative', overflowX: 'hidden',
        }}>
            <style>{`
                @keyframes cardGradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes cardShimmer {
                    0% { transform: translateX(-150%) skewX(-15deg); }
                    30% { transform: translateX(250%) skewX(-15deg); }
                    100% { transform: translateX(250%) skewX(-15deg); }
                }
                @keyframes goldPulse {
                    0% { opacity: 0.8; filter: drop-shadow(0 0 2px rgba(249,168,37,0.3)); }
                    50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(249,168,37,0.8)); }
                    100% { opacity: 0.8; filter: drop-shadow(0 0 2px rgba(249,168,37,0.3)); }
                }
                @keyframes floatOrb {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    50% { transform: translateY(-20px) scale(1.2); opacity: 0.4; }
                    100% { transform: translateY(-40px) scale(1); opacity: 0; }
                }
            `}</style>
            {hasShared && <CelebrationBurst />}

            {/* Floating decorations */}
            {[
                { emoji: '✨', t: '3%', l: '4%', size: 24, d: '0s' },
                { emoji: '🌸', t: '8%', l: '88%', size: 20, d: '1s' },
                { emoji: '💛', t: '55%', l: '3%', size: 18, d: '2s' },
                { emoji: '✨', t: '60%', l: '91%', size: 22, d: '0.5s' },
                { emoji: '🌸', t: '85%', l: '6%', size: 16, d: '1.5s' },
                { emoji: '💛', t: '90%', l: '85%', size: 20, d: '2.5s' },
            ].map((d, i) => (
                <div key={i} style={{
                    position: 'absolute', top: d.t, left: d.l,
                    fontSize: d.size, opacity: 0.55,
                    animation: `petalFloat 6s ease-in-out ${d.d} infinite`,
                    pointerEvents: 'none', zIndex: 0, userSelect: 'none',
                }}>{d.emoji}</div>
            ))}

            {/* Headline */}
            <div style={{ textAlign: 'center', marginBottom: '14px', zIndex: 1 }}>
                <div style={{
                    fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: '700',
                    color: '#991B1C', letterSpacing: '0.20em', textTransform: 'uppercase',
                    marginBottom: '8px', animation: 'fadeIn 0.7s ease both',
                }}>
                    ✦  NIAT · Women's Day · March 8, 2026  ✦
                </div>
                <div style={{
                    fontFamily: 'var(--font-script, cursive)',
                    fontSize: 'clamp(32px, 8vw, 42px)', color: '#991B1C',
                    lineHeight: 1.15, animation: 'fadeInUp 0.7s ease 0.1s both',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <span>From all of us at NIAT,</span>
                    <span>thank you for being in her corner.</span>
                </div>
                <div style={{
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: '#7a3030', marginTop: '6px', opacity: 0.8,
                    animation: 'fadeInUp 0.7s ease 0.2s both',
                }}>
                    Send it before she starts her day. 🌸
                </div>
            </div>

            {/* ── Outer wrapper to fix document height for scaled card ───────────────────── */}
            <div style={{
                zIndex: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                height: cardHeight ? `${cardHeight * cardScale}px` : 'auto',
                marginBottom: '24px',
                transition: 'height 0.3s ease',
            }}>
                {/* ── Scale wrapper — only for visual scaling ───────────────────── */}
                <div style={{
                    animation: 'cardBloom 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.2s both',
                    filter: 'drop-shadow(0 8px 32px rgba(153,27,28,0.30)) drop-shadow(0 2px 8px rgba(153,27,28,0.15))',
                    transform: `scale(${cardScale})`,
                    transformOrigin: 'top center',
                    width: `${PREVIEW_W}px`,      // keep layout width fixed
                    height: cardHeight ? `${cardHeight}px` : 'auto',
                }}>

                    {/* ── THE CARD — ref is HERE ─────────────────────────────────── */}
                    <div
                        ref={cardRef}
                        style={{
                            width: `${PREVIEW_W}px`,
                            // No fixed height — always grows to fit all content
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #7f1415, #991B1C, #c12a2a, #991B1C, #7f1415)',
                            backgroundSize: '300% 300%',
                            animation: 'cardGradientMove 9s ease infinite',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '0 0 20px',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Vignette */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.22) 100%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Subtle floating orbs in background */}
                        <div style={{ position: 'absolute', top: '20%', left: '15%', width: '30px', height: '30px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,168,37,0.4) 0%, transparent 70%)', animation: 'floatOrb 4s ease-in-out infinite', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '60%', right: '15%', width: '40px', height: '40px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,168,37,0.3) 0%, transparent 70%)', animation: 'floatOrb 5s ease-in-out infinite 2s', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '80%', left: '25%', width: '20px', height: '20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)', animation: 'floatOrb 3.5s ease-in-out infinite 1s', pointerEvents: 'none' }} />

                        {/* Animated Shimmer Overlay */}
                        <div style={{
                            position: 'absolute', top: 0, left: '-50%', width: '60%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), rgba(255,255,255,0.12), rgba(255,255,255,0.03), transparent)',
                            pointerEvents: 'none',
                            animation: 'cardShimmer 7s infinite cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />

                        {/* Top gold bar */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            background: 'linear-gradient(90deg, transparent, #f9a825, transparent)',
                            animation: 'goldPulse 3s ease-in-out infinite',
                        }} />

                        {/* Logo top-left */}
                        {logoBase64 && (
                            <div style={{ position: 'absolute', top: '12px', left: '14px', zIndex: 3 }}>
                                <img src={logoBase64} alt="NIAT"
                                    style={{ height: '22px', width: 'auto', objectFit: 'contain', display: 'block' }} />
                            </div>
                        )}

                        {/* Date top-right */}
                        <div style={{
                            position: 'absolute', top: '14px', right: '14px', zIndex: 3,
                            fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: '600',
                            color: 'rgba(255,255,255,0.42)',
                        }}>
                            March 8, 2026
                        </div>

                        {/* Corner emoji — right only (left has logo) */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '15px', opacity: 0.55 }}>🌸</div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '13px', opacity: 0.45 }}>💛</div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '13px', opacity: 0.45 }}>✨</div>

                        {/* ── Content ─────────────────────────────────────────── */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            width: '100%', padding: '36px 0 8px',
                            zIndex: 2, boxSizing: 'border-box',
                        }}>
                            {/* Title */}
                            <div style={{
                                fontFamily: 'var(--font-display)', fontWeight: '600',
                                fontSize: '22px', color: '#ffffff',
                                marginBottom: '10px', textAlign: 'center', letterSpacing: '0.01em',
                            }}>
                                HER CHAMPION 2026
                            </div>

                            {/* Photo circle */}
                            <div style={{
                                width: '108px', height: '108px', borderRadius: '50%',
                                border: '3px solid #f9a825', overflow: 'hidden',
                                boxShadow: '0 0 0 6px rgba(249,168,37,0.15), 0 4px 18px rgba(0,0,0,0.30)',
                                flexShrink: 0, background: 'rgba(0,0,0,0.28)', marginBottom: '12px',
                            }}>
                                {photoBase64 && (
                                    <img src={photoBase64} alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                )}
                            </div>

                            {/* Gold divider */}
                            <div style={{
                                width: '36px', height: '2px',
                                background: 'rgba(249,168,37,0.80)', marginBottom: '14px',
                            }} />

                            {/* Quote — pre-line preserves \n\n paragraph breaks */}
                            <div style={{
                                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: '400',
                                fontSize: '14px', color: 'rgba(255,255,255,0.92)',
                                textAlign: 'center', lineHeight: 1.65,
                                padding: '0 20px', marginBottom: '12px',
                                whiteSpace: 'pre-line',
                            }}>
                                {`\u201C${CARD_QUOTE}\u201D`}
                            </div>

                            {/* Occasion */}
                            <div style={{
                                fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: '500',
                                color: '#f9a825', textAlign: 'center',
                                letterSpacing: '0.04em', marginBottom: '5px',
                            }}>
                                {OCCASION_LINE}
                            </div>

                            {/* Hashtags */}
                            <div style={{
                                fontFamily: 'var(--font-body)', fontSize: '12px',
                                color: 'rgba(255,255,255,0.72)', textAlign: 'center',
                            }}>
                                #HerChampion2026  #BuildsNIAT
                            </div>
                        </div>
                    </div>{/* end cardRef div */}
                </div>{/* end scale visual wrapper */}
            </div>{/* end scale layout container */}

            {/* ── Buttons ──────────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                width: 'min(380px, calc(100vw - 24px))', zIndex: 1,
                animation: 'fadeInUp 0.7s ease 0.4s both',
            }}>
                <button onClick={handleDownload} disabled={isGenerating} style={{
                    width: '100%', height: '54px', borderRadius: '999px', border: 'none',
                    background: actionDone === 'download' ? '#6d9e3f' : 'linear-gradient(135deg, #e07b00, #f9a825)',
                    color: 'white', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: '700',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 18px rgba(249,168,37,0.40)',
                    transition: 'all 0.3s ease', opacity: isGenerating ? 0.7 : 1, letterSpacing: '0.02em',
                }}
                    onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {actionDone === 'download'
                        ? <><FontAwesomeIcon icon={faCheck} /> Card Saved!</>
                        : <><FontAwesomeIcon icon={faDownload} /> Save My Card</>}
                </button>

                <button onClick={handleShare} disabled={isGenerating} style={{
                    width: '100%', height: '54px', borderRadius: '999px', border: 'none',
                    background: actionDone === 'share' ? '#4a7d2e' : 'linear-gradient(135deg, #2e7d32, #43a047)',
                    color: 'white', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: '700',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 18px rgba(67,160,71,0.35)',
                    transition: 'all 0.3s ease', opacity: isGenerating ? 0.7 : 1, letterSpacing: '0.02em',
                }}
                    onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {isGenerating
                        ? <><FontAwesomeIcon icon={faSpinner} spin /> Preparing...</>
                        : actionDone === 'share'
                            ? <><FontAwesomeIcon icon={faCheck} /> Shared!</>
                            : <><FontAwesomeIcon icon={faWhatsapp} style={{ fontSize: '18px' }} /> Share with Someone Special</>}
                </button>
            </div>

            <button onClick={onBrowseCards} style={{
                marginTop: '14px', padding: '10px 20px',
                background: 'rgba(153,27,28,0.12)', border: '1.5px solid #991B1C',
                borderRadius: '999px', color: '#991B1C',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', letterSpacing: '0.03em', zIndex: 1,
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(153,27,28,0.15)',
            }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(153,27,28,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(153,27,28,0.12)'; }}
            >
                💌  Pick a card to send
            </button>

            {/* Loading overlay */}
            {isGenerating && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(255,241,204,0.85)', backdropFilter: 'blur(6px)',
                    zIndex: 999,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '16px',
                }}>
                    <div style={{ fontSize: '44px', animation: 'spin 2s linear infinite' }}>🌸</div>
                    <div style={{
                        fontFamily: 'var(--font-display)', fontStyle: 'italic',
                        fontSize: '20px', color: '#991B1C',
                    }}>
                        Getting your card ready...
                    </div>
                </div>
            )}
        </div>
    );
}