import React from 'react';
import Button from '../shared/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

export default function MentionOverlay({ recipientName, setRecipientName, senderName, setSenderName, onShare, onSkip }) {
    const inputStyle = {
        width: '100%',
        padding: '16px',
        border: '1.5px solid var(--rose-soft)',
        borderRadius: '12px',
        fontFamily: 'var(--font-body)',
        fontSize: '15px',
        color: 'var(--text-dark)',
        background: 'white',
        outline: 'none',
        transition: 'border-color 0.2s',
        marginBottom: '20px',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(26,10,18,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 0.2s ease',
        }}>
            <div style={{
                width: '100%',
                background: 'white',
                borderRadius: '24px 24px 0 0',
                padding: '32px 24px 48px',
                animation: 'slideUp 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                display: 'flex',
                flexDirection: 'column',
            }}>

                {/* Handle bar */}
                <div style={{
                    width: '40px', height: '4px',
                    background: 'var(--rose-soft)',
                    borderRadius: '999px',
                    margin: '0 auto 24px',
                }} />

                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    color: 'var(--rose-deep)',
                    textAlign: 'center',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                }}>
                    Personalize this card
                </div>

                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: '24px',
                }}>
                    Optional — leave blank to share as-is
                </div>

                {/* Her Name */}
                <label style={{ display: 'block', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '8px' }}>
                    Her name
                </label>
                <input
                    style={inputStyle}
                    placeholder="e.g. Priya"
                    value={recipientName || ''}
                    onChange={(e) => setRecipientName(e.target.value)}
                />

                {/* Your Name */}
                <label style={{ display: 'block', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '8px' }}>
                    Your name
                </label>
                <input
                    style={inputStyle}
                    placeholder="e.g. Rahul"
                    value={senderName || ''}
                    onChange={(e) => setSenderName(e.target.value)}
                />

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <Button variant="solid" onClick={() => onShare(true)} style={{ width: '100%' }}>
                        <FontAwesomeIcon icon={faWhatsapp} style={{ color: "rgb(25, 175, 86)", fontSize: '18px' }} /> Share to WhatsApp
                    </Button>

                    <Button variant="ghost" onClick={onSkip} style={{ width: '100%' }}>
                        Share without names
                    </Button>
                </div>
            </div>
        </div>
    );
}
