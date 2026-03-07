import React from 'react';

export default function Button({ children, onClick, variant = 'primary', style = {}, disabled = false, icon }) {
    const baseStyle = {
        minHeight: '48px',
        padding: '0 24px',
        borderRadius: '999px',
        fontSize: 'var(--text-base)',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
    };

    const variants = {
        primary: {
            background: 'white',
            color: 'var(--rose-mid)',
            boxShadow: 'var(--shadow-soft)',
        },
        solid: {
            background: 'linear-gradient(135deg, var(--rose-mid), var(--purple-mid))',
            color: 'white',
            boxShadow: 'var(--shadow-soft)',
        },
        whatsapp: {
            background: 'var(--whatsapp)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
        },
        outline: {
            background: 'transparent',
            border: '1.5px solid var(--purple-mid)',
            color: 'var(--purple-mid)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--rose-mid)',
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant], ...style }}
        >
            {icon && <span style={{ fontSize: '1.2em' }}>{icon}</span>}
            {children}
        </button>
    );
}
