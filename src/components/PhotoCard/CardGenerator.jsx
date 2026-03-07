import React, { useState, useEffect } from 'react';
const THEMES = [
    {
        name: 'Rose Gold',
        bg: 'linear-gradient(145deg, #9d1b5e 0%, #c2185b 40%, #e91e8c 70%, #f48fb1 100%)',
        textColor: '#ffffff',
        accentColor: '#f9a825',
        nameColor: '#ffffff',
        roleColor: 'rgba(255,255,255,0.8)',
        wordColor: '#f9a825',
        overlay: 'radial-gradient(circle at 70% 30%, rgba(249,168,37,0.15), transparent 60%)',
        isDark: true,
    }
];
import CelebrationBurst from '../shared/CelebrationBurst';
import { captureCard, shareToWhatsAppStatus, downloadBlob } from '../../hooks/useShareCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

// ─── Quotes (random, no user control) ───────────────────────────────────────
const CARD_QUOTES = [
    "Behind every strong person\nis a woman who never stopped believing.",
    "She taught the world\nwhat strength really looks like.",
    "Some people light up every room\nthey've ever walked into.",
    "Not all heroes announce themselves.\nSome just show up — every single day.",
    "The roots of who you are\nwere watered by a woman's love.",
    "Here's to the ones who rose\nwhen the world said sit down.",
    "Grace. Grit.\nAnd an unshakeable heart.",
    "Today we celebrate\nthe women who make us better.",
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
    } catch (e) {
        console.warn('blobUrlToBase64 failed:', e);
        return blobUrl;
    }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CardGenerator({ userData, onBrowseCards }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasShared, setHasShared] = useState(false);
    const [cardScale, setCardScale] = useState(1);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [actionDone, setActionDone] = useState(null); // 'download' | 'share'
    const [logoBase64, setLogoBase64] = useState(null); // pre-converted logo

    // Pick quote + theme once on mount — no user control, no friction
    const [quoteIndex] = useState(() => Math.floor(Math.random() * CARD_QUOTES.length));
    const [occasionIndex] = useState(() => Math.floor(Math.random() * OCCASION_LINES.length));
    const [themeIndex] = useState(0); // always Rose Gold — best looking

    const theme = THEMES[themeIndex];
    const currentQuote = CARD_QUOTES[quoteIndex];
    const currentOccasion = OCCASION_LINES[occasionIndex];

    // ── Convert user photo blob → base64 ────────────────────────────────────
    useEffect(() => {
        if (!userData.photo) return;
        if (userData.photo.startsWith('data:')) {
            setPhotoBase64(userData.photo);
            return;
        }
        blobUrlToBase64(userData.photo).then(setPhotoBase64);
    }, [userData.photo]);

    // ── Pre-convert NIAT logo → base64 so html2canvas captures it ───────────
    useEffect(() => {
        const convertLogo = async () => {
            try {
                const res = await fetch('/niat.png');
                const blob = await res.blob();
                const b64 = await new Promise((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result);
                    r.onerror = reject;
                    r.readAsDataURL(blob);
                });
                setLogoBase64(b64);
            } catch (e) {
                console.warn('Logo conversion failed:', e);
                setLogoBase64('/niat.png'); // fallback
            }
        };
        convertLogo();
    }, []);

    // ── Responsive card scale ────────────────────────────────────────────────
    useEffect(() => {
        const calc = () => {
            const avail = window.innerWidth - 48;
            setCardScale(avail < 400 ? avail / 400 : 1);
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const blob = await captureCard('portfolio-card-capture');
            downloadBlob(blob, 'womens-day-card.png');
            setHasShared(true);
            setActionDone('download');
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        setIsGenerating(true);
        try {
            const blob = await captureCard('portfolio-card-capture');
            await shareToWhatsAppStatus(blob, 'womens-day-card.png');
            setHasShared(true);
            setActionDone('share');
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Loading until photo + logo are both ready ────────────────────────────
    if ((userData.photo && !photoBase64) || !logoBase64) {
        return (
            <div style={{
                width: '100vw', minHeight: '100vh',
                background: 'linear-gradient(160deg, #0d0020 0%, #4a0040 35%, #9b1060 65%, #e91e8c 100%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '20px',
            }}>
                <div style={{ fontSize: '48px', animation: 'spin 3s linear infinite' }}>🌸</div>
                <div style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontSize: '20px', color: 'white',
                }}>
                    Preparing your card...
                </div>
            </div>
        );
    }

    const cardH = 500 * cardScale;

    return (
        <div style={{
            width: '100vw', minHeight: '100vh',
            background: 'linear-gradient(160deg, #0d0020 0%, #4a0040 35%, #9b1060 65%, #e91e8c 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 16px 56px',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            position: 'relative',
        }}>
            {hasShared && <CelebrationBurst />}

            {/* ── Background orbs ───────────────────────────────────── */}
            {[
                { s: 200, t: '2%', l: '-6%', c: '#f9a825', d: '0s', dr: '9s' },
                { s: 150, t: '55%', l: '78%', c: '#ce93d8', d: '2s', dr: '11s' },
                { s: 100, t: '80%', l: '5%', c: '#ff80ab', d: '1s', dr: '8s' },
                { s: 120, t: '15%', l: '85%', c: '#e91e8c', d: '0.5s', dr: '12s' },
            ].map((o, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: o.s, height: o.s, borderRadius: '50%',
                    background: o.c, opacity: 0.08, filter: 'blur(55px)',
                    top: o.t, left: o.l,
                    animation: `orbFloat ${o.dr} ease-in-out ${o.d} infinite`,
                    pointerEvents: 'none', zIndex: 0,
                }} />
            ))}

            {/* ── Floating petals ───────────────────────────────────── */}
            {[
                { t: '6%', l: '4%', s: 14, d: '0s' },
                { t: '20%', l: '90%', s: 18, d: '1.5s' },
                { t: '72%', l: '88%', s: 14, d: '2s' },
                { t: '88%', l: '8%', s: 16, d: '0.8s' },
            ].map((p, i) => (
                <div key={i} style={{
                    position: 'absolute', top: p.t, left: p.l,
                    fontSize: p.s, opacity: 0.15,
                    animation: `petalFloat 8s ease-in-out ${p.d} infinite`,
                    pointerEvents: 'none', zIndex: 0,
                }}>🌸</div>
            ))}

            {/* ── Top label ─────────────────────────────────────────── */}
            <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px', color: '#f9a825',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                fontWeight: '600', marginBottom: '12px', zIndex: 1,
                animation: 'fadeIn 0.8s ease both',
                textAlign: 'center',
            }}>
                ✦  YOUR CARD IS READY  ✦
            </div>

            {/* ── Headline ──────────────────────────────────────────── */}
            <div style={{
                textAlign: 'center', marginBottom: '24px', zIndex: 1,
                animation: 'fadeInUp 0.7s ease 0.1s both',
            }}>
                <div style={{
                    fontFamily: 'var(--font-script, cursive)',
                    fontSize: 'clamp(28px, 7vw, 40px)',
                    color: 'white', lineHeight: 1.2,
                    textShadow: '0 0 30px rgba(249,168,37,0.3)',
                }}>
                    Now share the love 💛
                </div>
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                    marginTop: '6px', letterSpacing: '0.03em',
                }}>
                    Download it or share directly to WhatsApp Status
                </div>
            </div>

            {/* ── Card scale container ──────────────────────────────── */}
            <div style={{
                width: '100%', height: `${cardH}px`,
                display: 'flex', justifyContent: 'center',
                alignItems: 'flex-start', marginBottom: '32px', zIndex: 1,
                animation: 'cardBloom 0.9s cubic-bezier(0.2,0.8,0.2,1) 0.2s both',
            }}>
                <div style={{
                    transform: `scale(${cardScale})`,
                    transformOrigin: 'top center', flexShrink: 0,
                    filter: 'drop-shadow(0 20px 60px rgba(233,30,140,0.4)) drop-shadow(0 0 30px rgba(249,168,37,0.2))',
                }}>

                    {/* ── THE CARD — fixed 400×500 for html2canvas ──── */}
                    <div
                        id="portfolio-card-capture"
                        style={{
                            width: '400px', height: '500px',
                            borderRadius: '24px',
                            background: theme.bg,
                            position: 'relative', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '40px 32px', boxSizing: 'border-box',
                        }}
                    >
                        {/* Overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: theme.overlay, pointerEvents: 'none',
                        }} />

                        {/* Top accent line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            height: '4px',
                            background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
                        }} />

                        {/* NIAT logo — top left — uses base64 so html2canvas captures it */}
                        <div style={{
                            position: 'absolute', top: '16px', left: '20px', zIndex: 3,
                        }}>
                            {logoBase64 && (
                                <img
                                    src={logoBase64}
                                    alt="NIAT"
                                    style={{
                                        height: '26px', width: 'auto',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            )}
                        </div>

                        {/* Date — top right */}
                        <div style={{
                            position: 'absolute', top: '22px', right: '20px',
                            fontFamily: 'var(--font-body)', fontSize: '10px',
                            color: theme.textColor, opacity: 0.45,
                            letterSpacing: '0.08em', zIndex: 3,
                        }}>
                            March 8, 2025
                        </div>

                        {/* Decorative petals */}
                        <div style={{
                            position: 'absolute', bottom: '48px', left: '14px',
                            fontSize: '38px', opacity: 0.07, pointerEvents: 'none',
                        }}>🌸</div>
                        <div style={{
                            position: 'absolute', top: '58px', right: '16px',
                            fontSize: '26px', opacity: 0.06, pointerEvents: 'none',
                        }}>🌸</div>

                        {/* Photo */}
                        <div style={{
                            width: '110px', height: '110px', borderRadius: '50%',
                            border: `3px solid ${theme.accentColor}`,
                            overflow: 'hidden',
                            boxShadow: `0 0 0 5px rgba(255,255,255,0.12)`,
                            marginBottom: '16px', zIndex: 2,
                            flexShrink: 0, background: '#2a0030',
                        }}>
                            {photoBase64 && (
                                <img src={photoBase64} alt="Your photo" style={{
                                    width: '100%', height: '100%',
                                    objectFit: 'cover', display: 'block',
                                }} />
                            )}
                        </div>


                        {/* Quote */}
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic', fontSize: '14px',
                            color: theme.textColor, opacity: 0.88,
                            textAlign: 'center', lineHeight: 1.7,
                            marginBottom: '10px', zIndex: 2,
                            whiteSpace: 'pre-line', padding: '0 4px',
                        }}>
                            "{currentQuote}"
                        </div>

                        {/* Occasion line */}
                        <div style={{
                            fontFamily: 'var(--font-body)', fontSize: '11px',
                            color: theme.accentColor, opacity: 0.82,
                            textAlign: 'center', letterSpacing: '0.05em', zIndex: 2,
                        }}>
                            {currentOccasion}
                        </div>


                    </div>
                    {/* ── End card ── */}

                </div>
            </div>

            {/* ── Action buttons — clean, no friction ──────────────── */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                width: 'min(360px, calc(100vw - 32px))',
                zIndex: 1,
                animation: 'panelSlideUp 0.8s ease 0.4s both',
            }}>
                {/* Download */}
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    style={{
                        width: '100%', height: '52px',
                        borderRadius: '999px',
                        border: '1.5px solid rgba(255,255,255,0.22)',
                        background: actionDone === 'download'
                            ? 'rgba(249,168,37,0.18)'
                            : 'rgba(255,255,255,0.08)',
                        color: actionDone === 'download'
                            ? '#f9a825'
                            : 'rgba(255,255,255,0.85)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px', fontWeight: '500',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                        transition: 'all 0.3s ease',
                        opacity: isGenerating ? 0.6 : 1,
                        backdropFilter: 'blur(12px)',
                        letterSpacing: '0.02em',
                    }}
                >
                    {actionDone === 'download'
                        ? '✅  Downloaded!'
                        : <><FontAwesomeIcon icon={faDownload} /> Download</>}
                </button>

                {/* Share — primary CTA */}
                <button
                    onClick={handleShare}
                    disabled={isGenerating}
                    style={{
                        width: '100%', height: '56px',
                        borderRadius: '999px', border: 'none',
                        background: actionDone === 'share'
                            ? 'linear-gradient(135deg, #43a047, #1b5e20)'
                            : 'linear-gradient(135deg, #f9a825 0%, #e91e8c 55%, #9b1060 100%)',
                        color: 'white',
                        fontFamily: 'var(--font-body)',
                        fontSize: '16px', fontWeight: '700',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                        boxShadow: actionDone === 'share'
                            ? '0 6px 24px rgba(67,160,71,0.4)'
                            : '0 8px 32px rgba(249,168,37,0.45)',
                        transition: 'all 0.4s ease',
                        opacity: isGenerating ? 0.7 : 1,
                        animation: actionDone ? 'none' : 'ctaPulse 2.5s ease infinite',
                        letterSpacing: '0.02em',
                    }}
                >
                    {isGenerating
                        ? <span style={{ animation: 'pulse 1s infinite' }}>Opening WhatsApp...</span>
                        : actionDone === 'share'
                            ? '✅  Shared Successfully!'
                            : <><FontAwesomeIcon icon={faWhatsapp} style={{ color: "rgb(25, 175, 86)", fontSize: '18px' }} /> WhatsApp</>}
                </button>
            </div>

            {/* ── Browse cards — subtle link ────────────────────────── */}
            <button
                onClick={onBrowseCards}
                style={{
                    marginTop: '24px', background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.38)',
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    cursor: 'pointer', letterSpacing: '0.03em', zIndex: 1,
                    textDecoration: 'underline', textUnderlineOffset: '4px',
                    transition: 'color 0.2s ease', padding: '8px 16px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
            >
                Send Greetings to Yours →
            </button>

            {/* ── Loading overlay ────────────────────────────────────── */}
            {isGenerating && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(13,0,32,0.75)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 999,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '16px',
                }}>
                    <div style={{ fontSize: '44px', animation: 'spin 2s linear infinite' }}>🌸</div>
                    <div style={{
                        fontFamily: 'var(--font-display)', fontStyle: 'italic',
                        fontSize: '20px', color: 'white',
                    }}>
                        Getting your card ready...
                    </div>
                </div>
            )}
        </div>
    );
}