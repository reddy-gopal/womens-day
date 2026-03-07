import React, { useEffect, useState } from 'react';

export default function CelebrationBurst({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        delay: `${Math.random() * 0.5}s`,
        color: ['#c2185b', '#7b1fa2', '#f9a825', '#f48fb1', '#ce93d8'][i % 5],
        size: `${8 + Math.random() * 8}px`,
        type: Math.random() > 0.5 ? 'circle' : 'square',
    }));

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {pieces.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        top: '-20px',
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.type === 'circle' ? '50%' : '2px',
                        animation: `confettiFall ${p.duration} linear forwards ${p.delay}`,
                    }}
                />
            ))}
        </div>
    );
}
