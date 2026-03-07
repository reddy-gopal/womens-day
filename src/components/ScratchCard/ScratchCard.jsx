import React, { useRef, useEffect, useState } from 'react';
import FloatingPetals from './FloatingPetals';
import Button from '../shared/Button';
import CelebrationBurst from '../shared/CelebrationBurst';
import { trackEvent } from '../../lib/analytics';

// ─── Rotating teasers above card — pure curiosity ────────────────────────────
const TEASERS = [
    'Someone thought of you today 🌸',
    'A message was left here for you...',
    'Go on. You deserve to see this.',
    'This one was made just for you.',
];

// ─── 3 random message sets ────────────────────────────────────────────────────
const REVEAL_SETS = [
    [
        { text: '🌸', isBig: true },
        { text: '"You don\'t just inspire —', isQuote: true },
        { text: 'you transform.', isHighlight: true },
        { text: 'Every life you\'ve touched', isQuote: true },
        { text: 'carries your light forward."', isQuote: true },
        { text: '── Happy Women\'s Day ──', isTag: true },
        { text: 'with love, from NIAT 💛', isSub: true },
    ],
    [
        { text: '✨', isBig: true },
        { text: '"Not all heroes announce themselves.', isQuote: true },
        { text: 'Some just show up —', isHighlight: true },
        { text: 'every single day —', isQuote: true },
        { text: 'and change everything."', isQuote: true },
        { text: '── Happy Women\'s Day ──', isTag: true },
        { text: 'with love, from NIAT 💛', isSub: true },
    ],
    [
        { text: '💛', isBig: true },
        { text: '"The world is kinder,', isQuote: true },
        { text: 'brighter, and braver', isHighlight: true },
        { text: 'because of women', isQuote: true },
        { text: 'who refuse to shrink."', isQuote: true },
        { text: '── Happy Women\'s Day ──', isTag: true },
        { text: 'with love, from NIAT 💛', isSub: true },
    ],
];

const SCRATCH_THRESHOLD = 50;      // auto-complete triggers at 50% real scratch
const DISPLAY_MAX = 70;            // displayed % is scaled: 50% real → 70% shown
const toDisplayPercent = (real) => Math.min((real / SCRATCH_THRESHOLD) * DISPLAY_MAX, DISPLAY_MAX);

function lineStyle(line) {
    if (line.isBig) return {
        fontSize: '32px', margin: '0 0 10px', lineHeight: 1,
    };
    if (line.isHighlight) return {
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic', fontWeight: '700',
        fontSize: 'clamp(22px, 5.5vw, 26px)',
        color: 'var(--rose-mid)',
        margin: '2px 0 6px', lineHeight: 1.25,
    };
    if (line.isQuote) return {
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic', fontWeight: '300',
        fontSize: 'clamp(17px, 4.5vw, 20px)',
        color: 'var(--text-dark)',
        margin: '1px 0', lineHeight: 1.5,
    };
    if (line.isTag) return {
        fontSize: '10px', fontFamily: 'var(--font-body)',
        fontWeight: '600', color: 'var(--rose-deep)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        margin: '14px 0 4px',
    };
    if (line.isSub) return {
        fontSize: '11px', fontFamily: 'var(--font-body)',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em', margin: 0,
    };
    return {};
}

export default function ScratchCard({ onComplete }) {
    const canvasRef = useRef(null);
    const isAutoCompletingRef = useRef(false); // ref avoids stale closure in scratch()
    const [isScratching, setIsScratching] = useState(false);
    const [scratchPercent, setScratchPercent] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isAutoCompleting, setIsAutoCompleting] = useState(false);
    const [showBurst, setShowBurst] = useState(false);
    const [teaserIdx, setTeaserIdx] = useState(0);
    const [teaserVisible, setTeaserVisible] = useState(true);
    const [cardIn, setCardIn] = useState(false);

    const [lines] = useState(
        () => REVEAL_SETS[Math.floor(Math.random() * REVEAL_SETS.length)]
    );

    // Card entrance
    useEffect(() => {
        const t = setTimeout(() => setCardIn(true), 300);
        return () => clearTimeout(t);
    }, []);

    // Rotating teasers with crossfade
    useEffect(() => {
        const t = setInterval(() => {
            setTeaserVisible(false);
            setTimeout(() => {
                setTeaserIdx(p => (p + 1) % TEASERS.length);
                setTeaserVisible(true);
            }, 380);
        }, 3000);
        return () => clearInterval(t);
    }, []);

    // Draw gold canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        g.addColorStop(0, '#c8960c');
        g.addColorStop(0.25, '#f5d76e');
        g.addColorStop(0.5, '#fceaa0');
        g.addColorStop(0.75, '#f0c040');
        g.addColorStop(1, '#b8860b');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shimmer dots
        for (let i = 0; i < 80; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 2.5 + 0.5,
                0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.fill();
        }

        // Hint text
        ctx.fillStyle = 'rgba(120,60,0,0.55)';
        ctx.font = '600 13px DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨  scratch here  ✨', canvas.width / 2, canvas.height / 2);
    }, []);

    const autoCompleteReveal = (canvas, ctx, onDone) => {
        let alpha = 1.0;
        const step = () => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            alpha -= 0.08;
            if (alpha > 0) {
                requestAnimationFrame(step);
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onDone();
            }
        };
        requestAnimationFrame(step);
    };

    const scratch = (x, y) => {
        // Use ref here — React state is stale inside event callbacks
        if (isAutoCompletingRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        // Count every pixel's alpha for accurate percentage
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparent = 0;
        const total = pixels.length / 4;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) transparent++;
        }
        const percent = +((transparent / total) * 100).toFixed(2);
        setScratchPercent(percent);

        // ── KEY FIX: was hardcoded `98`, now uses SCRATCH_THRESHOLD (50)
        if (percent >= SCRATCH_THRESHOLD && !isAutoCompletingRef.current) {
            isAutoCompletingRef.current = true;
            setIsAutoCompleting(true);
            autoCompleteReveal(canvas, ctx, () => {
                trackEvent('scratch_revealed');
                setIsRevealed(true);
                setShowBurst(true);
                setIsAutoCompleting(false);
                canvas.style.transition = 'opacity 0.9s ease';
                canvas.style.opacity = '0';
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isAutoCompletingRef.current || isRevealed) return;
        if (!isScratching) return;
        const rect = canvasRef.current.getBoundingClientRect();
        scratch(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (isAutoCompletingRef.current || isRevealed) return;
        if (!isScratching) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    return (
        <div style={{
            width: '100vw', minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--purple-deep) 0%, var(--rose-deep) 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 16px 48px', boxSizing: 'border-box',
            position: 'relative', overflow: 'hidden',
        }}>
            <FloatingPetals />
            {showBurst && <CelebrationBurst />}

            <div style={{
                position: 'relative', zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', width: '100%',
            }}>

                {/* ── NIAT logo ─────────────────────────────────────── */}
                <img src="/niat.png" alt="NIAT" style={{
                    height: '30px', width: 'auto', objectFit: 'contain',
                    opacity: 0.75, marginBottom: '28px',
                    animation: 'fadeIn 0.8s ease both',
                }} />

                {!isRevealed && (
                    <div style={{
                        textAlign: 'center', marginBottom: '28px',
                        animation: 'fadeInUp 0.7s ease 0.15s both',
                    }}>
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(249,168,37,0.12)',
                            border: '1px solid rgba(249,168,37,0.3)',
                            borderRadius: '999px',
                            padding: '4px 14px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px', fontWeight: '600',
                            color: '#f9a825',
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            marginBottom: '20px',
                        }}>
                            ✦  March 8 · Women's Day 2026  ✦
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(26px, 6.5vw, 38px)',
                            fontWeight: '300', color: 'white',
                            lineHeight: 1.2,
                        }}>
                            Someone left a message
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-script, cursive)',
                            fontSize: 'clamp(30px, 7.5vw, 46px)',
                            color: '#f9a825', lineHeight: 1.15,
                            textShadow: '0 0 30px rgba(249,168,37,0.4)',
                            marginBottom: '16px',
                        }}>
                            just for you. ✨
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.03em',
                            minHeight: '20px',
                            opacity: teaserVisible ? 1 : 0,
                            transition: 'opacity 0.38s ease',
                        }}>
                            {TEASERS[teaserIdx]}
                        </div>
                    </div>
                )}

                {isRevealed && (
                    <div style={{
                        textAlign: 'center', marginBottom: '20px',
                        animation: 'fadeInUp 0.6s ease both',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px', fontWeight: '600',
                            color: '#f9a825',
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            marginBottom: '10px',
                        }}>
                            ✦  This was made for you  ✦
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-script, cursive)',
                            fontSize: 'clamp(24px, 6vw, 34px)',
                            color: 'white', lineHeight: 1.25,
                            marginBottom: '6px',
                        }}>
                            Read it slowly. 🌸
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.4)',
                        }}>
                            Every word here is true.
                        </div>
                    </div>
                )}

                {/* ── THE SCRATCH CARD ──────────────────────────────── */}
                <div style={{
                    width: 'min(360px, 90vw)',
                    opacity: cardIn ? 1 : 0,
                    transform: cardIn ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.95)',
                    transition: 'all 0.75s cubic-bezier(0.2,0.8,0.2,1)',
                }}>
                    <div style={{
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: isRevealed
                            ? '0 0 0 2px rgba(249,168,37,0.5), 0 20px 60px rgba(249,168,37,0.25), 0 0 80px rgba(157,27,94,0.2)'
                            : '0 20px 60px rgba(0,0,0,0.35)',
                        transition: 'box-shadow 1s ease',
                    }}>
                        <div style={{
                            width: '100%', height: '340px',
                            background: 'var(--white)',
                            borderRadius: 'var(--radius-lg)',
                            position: 'relative',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '32px 24px', boxSizing: 'border-box',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', textAlign: 'center',
                            }}>
                                {lines.map((line, idx) => (
                                    <div key={idx} style={{
                                        ...lineStyle(line),
                                        opacity: 0,
                                        animation: isRevealed
                                            ? `lineReveal 0.65s cubic-bezier(0.2,0.8,0.2,1) forwards ${idx * 0.17}s`
                                            : 'none',
                                    }}>
                                        {line.text}
                                    </div>
                                ))}
                            </div>

                            {!isRevealed && (
                                <div style={{
                                    position: 'absolute', top: '20px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px', fontWeight: '500',
                                    color: 'rgba(180,80,120,0.65)',
                                    letterSpacing: '0.06em',
                                    animation: 'pulse 2.5s ease infinite',
                                }}>
                                    🎁  Something special is hiding here
                                </div>
                            )}

                            <canvas
                                ref={canvasRef}
                                width={360}
                                height={340}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    cursor: isAutoCompleting ? 'default' : 'crosshair',
                                    touchAction: 'none',
                                    pointerEvents: isAutoCompleting ? 'none' : 'auto',
                                    zIndex: 5,
                                    borderRadius: 'var(--radius-lg)',
                                }}
                                onMouseDown={() => !isAutoCompletingRef.current && !isRevealed && setIsScratching(true)}
                                onMouseUp={() => setIsScratching(false)}
                                onMouseMove={handleMouseMove}
                                onTouchStart={() => !isAutoCompletingRef.current && !isRevealed && setIsScratching(true)}
                                onTouchEnd={() => setIsScratching(false)}
                                onTouchMove={handleTouchMove}
                                onMouseLeave={() => setIsScratching(false)}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Below card ────────────────────────────────────── */}
                <div style={{
                    minHeight: '64px', marginTop: '20px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '10px',
                }}>
                    {!isRevealed ? (
                        <>
                            {scratchPercent > 2 && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: '8px', width: '100%',
                                }}>
                                    <div style={{
                                        width: '180px', height: '6px',
                                        background: 'rgba(255,255,255,0.15)',
                                        borderRadius: '999px', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${toDisplayPercent(scratchPercent)}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #f9a825, #fff)',
                                            borderRadius: '999px',
                                            transition: 'width 0.1s linear',
                                            boxShadow: isAutoCompleting ? '0 0 12px rgba(249,168,37,0.8)' : '0 0 6px rgba(249,168,37,0.6)',
                                            animation: isAutoCompleting ? 'pulse 1s ease infinite' : 'none',
                                        }} />
                                    </div>
                                    <span style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '14px', fontWeight: '600',
                                        color: '#f9a825', letterSpacing: '0.05em',
                                        minWidth: '44px',
                                    }}>
                                        {Math.round(toDisplayPercent(scratchPercent))}%
                                    </span>
                                </div>
                            )}
                            <span style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                                color: scratchPercent > 4 ? '#f9a825' : 'rgba(255,255,255,0.6)',
                                letterSpacing: '0.04em', textAlign: 'center',
                                transition: 'color 0.4s ease',
                                animation: scratchPercent < 5 && !isAutoCompleting ? 'pulse 2.5s ease infinite' : 'none',
                            }}>
                                {isAutoCompleting && '✨ Revealing...'}
                                {!isAutoCompleting && scratchPercent < 5 && '👆  Use your finger to scratch'}
                                {!isAutoCompleting && scratchPercent >= 5 && scratchPercent < 25 && "Keep going, it's worth it..."}
                                {!isAutoCompleting && scratchPercent >= 25 && scratchPercent < SCRATCH_THRESHOLD && "Don't stop — you're almost there 🔥"}
                            </span>
                        </>
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '10px',
                            opacity: 0,
                            animation: 'fadeInUp 0.7s ease forwards 1.6s',
                        }}>
                            <span style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                                color: 'rgba(255,255,255,0.45)',
                                letterSpacing: '0.03em', textAlign: 'center',
                            }}>
                                Someone at NIAT created something for you this Women's Day.We can't tell you what it is.

                            </span>
                            <Button variant="primary" onClick={() => {
                                trackEvent('scratch_continued');
                                onComplete();
                            }}>
                        👇click to find out. 
                  </Button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}