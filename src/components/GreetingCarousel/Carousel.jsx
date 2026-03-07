import React, { useState } from 'react';
import CarouselCard from './CarouselCard';
import MentionOverlay from './MentionOverlay';
import Button from '../shared/Button';
import CelebrationBurst from '../shared/CelebrationBurst';
import cards from '../../data/cards';
import { captureCard, shareToWhatsAppStatus, downloadBlob } from '../../hooks/useShareCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

export default function Carousel({ onBack }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Drag states
    const [dragStart, setDragStart] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    // Multi-select
    const [multiSelected, setMultiSelected] = useState([]);

    const [showMention, setShowMention] = useState(false);
    const [mentionData, setMentionData] = useState({ recipientName: '', senderName: '' });

    const [isLoading, setIsLoading] = useState(false);
    const [hasShared, setHasShared] = useState(false);

    // FIX 3: use opacity:0 + pointerEvents:none instead of visibility:hidden
    // html2canvas cannot capture visibility:hidden elements
    const hiddenCaptureStyle = {
        position: 'fixed',
        left: '-9999px',
        top: '0px',
        opacity: 0,             // ← use opacity instead of visibility
        pointerEvents: 'none',
        zIndex: -1,
    };

    const filteredCards = cards;

    // ── Swipe logic ────────────────────────────────────────────────────────
    const handleTouchStart = (e) => {
        setDragStart(e.touches[0].clientX);
        setIsDragging(true);
    };
    const handleMouseDown = (e) => {
        setDragStart(e.clientX);
        setIsDragging(true);
    };
    const handleMove = (clientX) => {
        if (!isDragging) return;
        setDragOffset(clientX - dragStart);
    };
    const handleEnd = () => {
        if (!isDragging) return;
        const N = filteredCards.length;
        if (N === 0) { setIsDragging(false); setDragOffset(0); return; }
        if (Math.abs(dragOffset) > 60) {
            if (dragOffset < 0) setCurrentIndex(prev => (prev + 1) % N);
            else setCurrentIndex(prev => (prev - 1 + N) % N);
        }
        setIsDragging(false);
        setDragOffset(0);
    };

    // ── Card positioning ───────────────────────────────────────────────────
    const getCardStyle = (index) => {
        const N = filteredCards.length;
        let offset = index - currentIndex;
        if (N > 0) {
            if (offset > N / 2) offset -= N;
            if (offset < -N / 2) offset += N;
        }
        return {
            position: 'absolute',
            width: 'min(340px, 85vw)',
            height: 'min(460px, 62vh)',
            transform: `translateX(${offset * 88 + (isDragging ? dragOffset * 0.3 : 0)}vw) scale(${offset === 0 ? 1 : 0.88})`,
            opacity: Math.abs(offset) > 1 ? 0 : offset === 0 ? 1 : 0.55,
            transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: offset === 0 ? 2 : 1,
            pointerEvents: offset === 0 ? 'auto' : 'none',
        };
    };

    const currentCard = filteredCards[currentIndex];
    const currentCardId = currentCard?.id;

    // ── Share / Download current card ──────────────────────────────────────
    const startShare = () => {
        setShowMention(true);
    };

    const executeShare = async () => {
        setShowMention(false);
        setIsLoading(true);
        try {
            // FIX: capture from the HIDDEN clone (no transform), not the carousel card
            const blob = await captureCard(`capture-card-${currentCardId}`);

            let msg = 'Wishing you a beautiful Women\'s Day! 🌸';
            if (mentionData.recipientName) {
                msg = `Happy Women's Day, ${mentionData.recipientName}! 🌸\n\nI picked this card just for you.\n${mentionData.senderName ? `- ${mentionData.senderName}` : ''}`;
            }

            await shareToWhatsAppStatus(blob, `womens-day-card-${currentCardId}.png`, msg);
            setHasShared(true);
        } catch (e) {
            console.error('Share error:', e);
            alert('Could not share. Try downloading instead.');
        } finally {
            setIsLoading(false);
        }
    };

    const executeDownload = async () => {
        if (multiSelected.length > 0) { await downloadAllSelected(); return; }
        setIsLoading(true);
        try {
            // FIX: capture from the HIDDEN clone (no transform)
            const blob = await captureCard(`capture-card-${currentCardId}`);
            downloadBlob(blob, `womens-day-card-${currentCardId}.png`);
            setHasShared(true);
        } catch (e) {
            console.error('Download error:', e);
            alert('Could not save card. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Multi select ───────────────────────────────────────────────────────
    const toggleMultiSelect = (id) => {
        setMultiSelected(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleCardClick = () => {
        if (!isDragging && currentCardId != null) toggleMultiSelect(currentCardId);
    };

    const downloadAllSelected = async () => {
        if (multiSelected.length === 0) return;
        setIsLoading(true);
        try {
            for (const id of multiSelected) {
                const blob = await captureCard(`capture-card-${id}`);
                downloadBlob(blob, `womens-day-card-${id}.png`);
                await new Promise(r => setTimeout(r, 300)); // stagger downloads
            }
            setHasShared(true);
        } catch (e) {
            console.error('Download all error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const shareAllSelected = async () => {
        setShowMention(false);
        if (multiSelected.length === 0) return;
        setIsLoading(true);
        try {
            const blobs = [];
            for (const id of multiSelected) {
                const blob = await captureCard(`capture-card-${id}`);
                blobs.push({ blob, filename: `womens-day-card-${id}.png` });
            }

            const shareText = mentionData.recipientName
                ? `Happy Women's Day, ${mentionData.recipientName}! 🌸\n\nI picked these cards just for you.\n${mentionData.senderName ? `- ${mentionData.senderName}` : ''}`
                : 'Wishing you a beautiful Women\'s Day! 🌸';

            // Try to copy text to clipboard as a fallback
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(shareText);
                }
            } catch (e) { }

            if (navigator.share) {
                const files = blobs.map(b => new File([b.blob], b.filename, { type: 'image/png' }));
                try {
                    await navigator.share({
                        files,
                        title: 'Cards for you 🌸',
                        text: shareText,
                    });
                    setHasShared(true);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        blobs.forEach(b => downloadBlob(b.blob, b.filename));
                        alert("Images downloaded! Your message has been copied to your clipboard. You can paste it when sharing.");
                    }
                }
            } else {
                blobs.forEach(b => downloadBlob(b.blob, b.filename));
                alert("Images downloaded! Your message has been copied to your clipboard. You can paste it when sharing.");
                setHasShared(true);
            }
        } catch (e) {
            console.error('Share all error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            width: '100vw', minHeight: '100vh',
            background: 'var(--off-white)',
            display: 'flex', flexDirection: 'column',
            paddingTop: '16px',
        }}>
            {hasShared && <CelebrationBurst onComplete={() => setHasShared(false)} />}

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px', marginBottom: '16px',
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-muted)', fontSize: '15px',
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
                >
                    ← Back
                </button>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px', color: 'var(--purple-deep)', fontWeight: 'bold',
                }}>
                    Send Wishes
                </div>
                <div style={{ width: '60px' }} />
            </div>

            {/* ── Hidden capture clones ─────────────────────────
                These are the cards html2canvas actually captures.
                They have NO transform/translate applied — so they always
                render correctly. opacity:0 instead of visibility:hidden
                so html2canvas can still read them.
            ─────────────────────────────────────────────────────────── */}
            <div style={hiddenCaptureStyle}>
                {filteredCards.map((card) => (
                    <div
                        key={card.id}
                        style={{ width: '400px', height: '500px', marginBottom: '8px' }}
                    >
                        <CarouselCard
                            id={`capture-card-${card.id}`}
                            card={card}
                            mentionData={mentionData}
                            customStyle={{ width: '400px', height: '500px' }}
                        />
                    </div>
                ))}
            </div>

            {/* ── Carousel ───────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    style={{
                        position: 'relative', width: '100%',
                        flex: 1, minHeight: '65vh',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', overflow: 'hidden',
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                    onTouchEnd={handleEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={(e) => { if (isDragging) handleMove(e.clientX); }}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                >
                    {filteredCards.map((card, index) => {
                        const isCurrent = index === currentIndex;
                        const isSelected = multiSelected.includes(card.id);
                        return (
                            <div
                                key={card.id}
                                style={{
                                    ...getCardStyle(index),
                                    cursor: isCurrent ? 'pointer' : 'default',
                                }}
                                onClick={isCurrent ? handleCardClick : undefined}
                            >
                                {/* Visual carousel card — has transforms, NOT captured */}
                                <CarouselCard
                                    id={`carousel-card-${card.id}`}
                                    card={card}
                                    mentionData={mentionData}
                                    customStyle={{ width: '100%', height: '100%' }}
                                />
                                {/* Selection badge */}
                                {isCurrent && isSelected && (
                                    <div style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'var(--rose-mid)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        zIndex: 10, fontWeight: 'bold', fontSize: '14px',
                                    }}>
                                        ✓
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Dot indicators */}
                <div style={{ display: 'flex', gap: '8px', margin: '20px 0' }}>
                    {filteredCards.map((_, i) => (
                        <div key={i} style={{
                            width: i === currentIndex ? '12px' : '8px',
                            height: '8px', borderRadius: '999px',
                            background: i === currentIndex
                                ? 'var(--rose-mid)'
                                : 'rgba(194,24,91,0.2)',
                            transition: 'all 0.3s',
                        }} />
                    ))}
                </div>

                {/* Bottom action bar */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%', padding: '0 20px 32px', gap: '12px',
                }}>
                    <span style={{
                        fontSize: '14px', color: 'var(--text-muted)', minWidth: '80px',
                        fontFamily: 'var(--font-body)',
                    }}>
                        {multiSelected.length > 0
                            ? `${multiSelected.length} selected`
                            : 'Tap card to select'}
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="outline" onClick={executeDownload} disabled={isLoading}>
                            <FontAwesomeIcon icon={faDownload} /> Save
                        </Button>
                        <Button variant="solid" onClick={startShare} disabled={isLoading}>
                            <FontAwesomeIcon icon={faWhatsapp} style={{ color: "rgb(25, 175, 86)", fontSize: '18px' }} /> Share
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mention overlay */}
            {showMention && (
                <MentionOverlay
                    recipientName={mentionData.recipientName}
                    setRecipientName={(v) => setMentionData(prev => ({ ...prev, recipientName: v }))}
                    senderName={mentionData.senderName}
                    setSenderName={(v) => setMentionData(prev => ({ ...prev, senderName: v }))}
                    onShare={() => {
                        if (multiSelected.length > 0) shareAllSelected();
                        else executeShare();
                    }}
                    onSkip={() => {
                        setMentionData({ recipientName: '', senderName: '' });
                        if (multiSelected.length > 0) shareAllSelected();
                        else executeShare();
                    }}
                />
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 999,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', gap: '12px',
                }}>
                    <div style={{ animation: 'spin 1s linear infinite' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                            stroke="var(--rose-mid)" strokeWidth="3" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" strokeDasharray="30" />
                        </svg>
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px',
                        color: 'var(--text-muted)',
                    }}>
                        Preparing your card...
                    </div>
                </div>
            )}
        </div>
    );
}