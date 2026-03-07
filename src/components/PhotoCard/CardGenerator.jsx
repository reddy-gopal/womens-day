import React, { useState, useEffect } from 'react';
import CelebrationBurst from '../shared/CelebrationBurst';
import { drawCardToBlob, shareToWhatsAppStatus, downloadBlob } from '../../hooks/useCardCanvas';
import { trackEvent } from '../../lib/analytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const CARD_QUOTES = [
    "Behind every strong person is a woman who never stopped believing.",
    "She taught the world what strength really looks like.",
    "Some people light up every room they've ever walked into.",
    "Not all heroes announce themselves. Some just show up — every single day.",
    "The roots of who you are were watered by a woman's love.",
    "Here's to the ones who rose when the world said sit down.",
    "Grace. Grit. And an unshakeable heart.",
    "Today we celebrate the women who make us better.",
];

const OCCASION_LINES = [
    "Celebrating her, today and always 🌸",
    "In celebration of every incredible woman",
    "She deserves every beautiful thing 🌸",
    "March 8 · A day to honour greatness",
];

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
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasShared, setHasShared] = useState(false);
    const [actionDone, setActionDone] = useState(null);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [cardScale, setCardScale] = useState(1);

    const [quoteIndex] = useState(() => Math.floor(Math.random() * CARD_QUOTES.length));
    const [occasionIndex] = useState(() => Math.floor(Math.random() * OCCASION_LINES.length));
    const currentQuote = CARD_QUOTES[quoteIndex];
    const currentOccasion = OCCASION_LINES[occasionIndex];

    useEffect(() => {
        if (!userData.photo) return;
        if (userData.photo.startsWith('data:')) { setPhotoBase64(userData.photo); return; }
        blobUrlToBase64(userData.photo).then(setPhotoBase64);
    }, [userData.photo]);

    useEffect(() => {
        const toDataUrl = (blob) =>
            new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result);
                r.onerror = rej;
                r.readAsDataURL(blob);
            });
        fetch('/niat.png')
            .then(r => (r.ok ? r.blob() : Promise.reject()))
            .then(toDataUrl)
            .then(setLogoBase64)
            .catch(() =>
                fetch('/niat1.png')
                    .then(r => (r.ok ? r.blob() : Promise.reject()))
                    .then(toDataUrl)
                    .then(setLogoBase64)
                    .catch(() => setLogoBase64(null))
            );
    }, []);

    useEffect(() => {
        const calc = () => {
            const avail = window.innerWidth - 64;
            setCardScale(avail < 380 ? avail / 380 : 1);
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const blob = await drawCardToBlob({ photoBase64, logoBase64, quote: currentQuote, occasionLine: currentOccasion });
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
            const blob = await drawCardToBlob({ photoBase64, logoBase64, quote: currentQuote, occasionLine: currentOccasion });
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
                width: '100vw', minHeight: '100vh',
                background: '#FFF1CC',
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

    const cardDisplayW = 380;
    const cardDisplayH = 480;

    return (
        <div style={{
            width: '100vw', minHeight: '100vh',
            background: '#FFF1CC',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 12px 40px',
            boxSizing: 'border-box',
            position: 'relative',
            overflowX: 'hidden',
        }}>
            {hasShared && <CelebrationBurst />}

            {/* ── Floating emoji decorations — like NxtWave ────────── */}
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
                    pointerEvents: 'none', zIndex: 0,
                    userSelect: 'none',
                }}>
                    {d.emoji}
                </div>
            ))}

            {/* ── Page headline ─────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '14px', zIndex: 1 }}>
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px', fontWeight: '700',
                    color: '#991B1C',
                    letterSpacing: '0.20em', textTransform: 'uppercase',
                    marginBottom: '8px',
                    animation: 'fadeIn 0.7s ease both',
                }}>
                    ✦  MARCH 8 · WOMEN'S DAY 2026  ✦
                </div>
                <div style={{
                    fontFamily: 'var(--font-script, cursive)',
                    fontSize: 'clamp(32px, 8vw, 42px)',
                    color: '#991B1C',
                    lineHeight: 1.15,
                    animation: 'fadeInUp 0.7s ease 0.1s both',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <span>She's going to</span>
                    <span>love this. 💛</span>
                </div>
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px', color: '#7a3030',
                    marginTop: '6px', opacity: 0.8,
                    animation: 'fadeInUp 0.7s ease 0.2s both',
                }}>
                    Send it before she starts her day. 🌸
                </div>
            </div>

            {/* ── Card container ────────────────────────────────────── */}
            <div style={{
                zIndex: 1,
                animation: 'cardBloom 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.2s both',
                marginBottom: '18px',
                // Card shadow matching NxtWave reference — warm, deep
                filter: 'drop-shadow(0 8px 32px rgba(153,27,28,0.30)) drop-shadow(0 2px 8px rgba(153,27,28,0.15))',
            }}>
                <div style={{
                    transform: `scale(${cardScale})`,
                    transformOrigin: 'top center',
                    width: `${cardDisplayW}px`,
                    height: `${cardDisplayH}px`,
                }}>
                    {/* ── THE CARD ─────────────────────────────────── */}
                    <div style={{
                        width: `${cardDisplayW}px`,
                        height: `${cardDisplayH}px`,
                        borderRadius: '20px',
                        background: 'linear-gradient(155deg, #7f1415 0%, #991B1C 45%, #a82020 100%)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0 0 14px',
                        boxSizing: 'border-box',
                    }}>
                        {/* Vignette */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.22) 100%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Top gold accent */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            background: 'linear-gradient(90deg, transparent, #f9a825, transparent)',
                        }} />

                        {/* Logo — top-left corner */}
                        {logoBase64 && (
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                left: '14px',
                                zIndex: 3,
                                width: '48px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                            }}>
                                <img
                                    src={logoBase64}
                                    alt="NIAT"
                                    style={{
                                        height: '24px',
                                        width: 'auto',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            </div>
                        )}

                        {/* Decorative corner emojis — right side only so left has logo */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '16px', opacity: 0.6 }}>🌸</div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '14px', opacity: 0.5 }}>💛</div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '14px', opacity: 0.5 }}>✨</div>

                        {/* Centred content block */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            padding: '8px 0',
                            zIndex: 2,
                            boxSizing: 'border-box',
                        }}>
                            {/* Title — "Women's Day 2026" */}
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: '600',
                                fontSize: '24px',
                                color: '#ffffff',
                                marginBottom: '6px',
                                textAlign: 'center',
                                letterSpacing: '0.01em',
                            }}>
                                Women's Day 2026
                            </div>

                            {/* Photo circle */}
                            <div style={{
                                width: '100px', height: '100px',
                                borderRadius: '50%',
                                border: '3px solid #f9a825',
                                overflow: 'hidden',
                                boxShadow: '0 0 0 5px rgba(249,168,37,0.18), 0 4px 20px rgba(0,0,0,0.3)',
                                flexShrink: 0,
                                background: 'rgba(0,0,0,0.3)',
                                marginBottom: '6px',
                            }}>
                                {photoBase64 && (
                                    <img src={photoBase64} alt="" style={{
                                        width: '100%', height: '100%',
                                        objectFit: 'cover', display: 'block',
                                    }} />
                                )}
                            </div>

                            {/* Quote */}
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontStyle: 'italic', fontWeight: '400',
                                fontSize: '17px',
                                color: 'rgba(255,255,255,0.92)',
                                textAlign: 'center',
                                lineHeight: 1.55,
                                padding: '0 20px',
                                marginBottom: '4px',
                            }}>
                                "{currentQuote}"
                            </div>

                            {/* Occasion line */}
                            <div style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px', fontWeight: '500',
                                color: '#f9a825',
                                textAlign: 'center',
                                letterSpacing: '0.04em',
                                marginBottom: '2px',
                            }}>
                                {currentOccasion}
                            </div>

                            {/* Sign-off */}
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontStyle: 'italic',
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.5)',
                            }}>
                                — with love, Team NIAT
                            </div>
                        </div>

                        {/* Watermark */}
                        <div style={{
                            position: 'absolute', bottom: '8px', right: '12px',
                            fontFamily: 'var(--font-body)', fontSize: '10px',
                            color: 'rgba(255,255,255,0.18)',
                            letterSpacing: '0.14em', textTransform: 'uppercase', zIndex: 2,
                        }}>
                            niat.com
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Buttons ───────────── */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                width: 'min(380px, calc(100vw - 24px))',
                zIndex: 1,
                animation: 'fadeInUp 0.7s ease 0.4s both',
            }}>
                {/* Download — orange like NxtWave's "Save" button */}
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    style={{
                        width: '100%', height: '54px',
                        borderRadius: '999px', border: 'none',
                        background: actionDone === 'download'
                            ? '#6d9e3f'
                            : 'linear-gradient(135deg, #e07b00, #f9a825)',
                        color: 'white',
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px', fontWeight: '700',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 18px rgba(249,168,37,0.40)',
                        transition: 'all 0.3s ease',
                        opacity: isGenerating ? 0.7 : 1,
                        letterSpacing: '0.02em',
                    }}
                    onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {actionDone === 'download' ? (
                        <><FontAwesomeIcon icon={faCheck} /> Card Saved!</>
                    ) : (
                        <><FontAwesomeIcon icon={faDownload} /> Save My Card</>
                    )}
                </button>

                {/* Share — green like NxtWave's "Share" button */}
                <button
                    onClick={handleShare}
                    disabled={isGenerating}
                    style={{
                        width: '100%', height: '54px',
                        borderRadius: '999px', border: 'none',
                        background: actionDone === 'share'
                            ? '#4a7d2e'
                            : 'linear-gradient(135deg, #2e7d32, #43a047)',
                        color: 'white',
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px', fontWeight: '700',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 18px rgba(67,160,71,0.35)',
                        transition: 'all 0.3s ease',
                        opacity: isGenerating ? 0.7 : 1,
                        letterSpacing: '0.02em',
                    }}
                    onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {isGenerating ? (
                        <><FontAwesomeIcon icon={faSpinner} spin /> Preparing...</>
                    ) : actionDone === 'share' ? (
                        <><FontAwesomeIcon icon={faCheck} /> Shared!</>
                    ) : (
                        <><FontAwesomeIcon icon={faWhatsapp} style={{ fontSize: '18px' }} /> Share with Someone Special</>
                    )}
                </button>
            </div>

            {/* ── Explore more cards link (highlighted) ─────── */}
            <button
                onClick={onBrowseCards}
                style={{
                    marginTop: '14px',
                    padding: '10px 20px',
                    background: 'rgba(153,27,28,0.12)',
                    border: '1.5px solid #991B1C',
                    borderRadius: '999px',
                    color: '#991B1C',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(153,27,28,0.15)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(153,27,28,0.18)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(153,27,28,0.22)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(153,27,28,0.12)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(153,27,28,0.15)';
                }}
            >
                💌  Pick a card to send
            </button>

            {/* ── Loading overlay ───────────────────────────────────── */}
            {isGenerating && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(255,241,204,0.85)',
                    backdropFilter: 'blur(6px)',
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