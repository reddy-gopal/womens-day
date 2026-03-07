import React from 'react';

export default function CarouselCard({ card, mentionData = {}, customStyle = {}, id }) {
    // SVG Petal
    const PetalSVG = () => (
        <svg viewBox="0 0 24 24" style={{
            position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px',
            fill: card.accent, opacity: 0.12, transform: 'rotate(45deg)'
        }}>
            <path d="M12 2C8 6 4 12 12 22C20 12 16 6 12 2Z" />
        </svg>
    );

    return (
        <div id={id} style={{
            ...customStyle,
            width: '100%',
            height: '100%',
            borderRadius: '24px',
            background: card.bg,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 28px',
            boxShadow: '0 16px 56px rgba(0,0,0,0.18)',
            boxSizing: 'border-box',
        }}>

            {/* Top accent line */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '4px',
                background: card.accent,
            }} />

            {/* Category pill */}
            <div style={{
                position: 'absolute', top: '16px', left: '16px',
                padding: '4px 12px',
                background: `${card.accent}22`,
                border: `1px solid ${card.accent}44`,
                borderRadius: '999px',
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: '500',
                color: card.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
            }}>
                {card.category}
            </div>

            <PetalSVG />

            {/* Quote */}
            <div style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(20px, 4vw, 24px)',
                color: card.textColor || '#1a0a12',
                textAlign: 'center',
                lineHeight: 1.6,
                marginBottom: '20px',
                zIndex: 2,
            }}>
                "{card.quote}"
            </div>

            {/* Divider */}
            <div style={{
                width: '40px', height: '1px',
                background: card.accent,
                marginBottom: '16px',
                zIndex: 2,
            }} />

            {/* Title */}
            <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: '600',
                color: card.accent,
                letterSpacing: '0.06em',
                zIndex: 2,
            }}>
                — {card.title}
            </div>

            {/* Recipient name overlay */}
            {mentionData.recipientName && (
                <div style={{
                    position: 'absolute', bottom: '24px',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    color: card.accent,
                    zIndex: 2,
                }}>
                    For {mentionData.recipientName}{mentionData.senderName ? `, from ${mentionData.senderName}` : ''} 💜
                </div>
            )}

            {/* NIAT watermark */}
            <div style={{
                position: 'absolute', bottom: '12px', right: '14px',
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                color: card.accent,
                opacity: 0.35,
                letterSpacing: '0.12em',
            }}>
                NIAT
            </div>
        </div>
    );
}
