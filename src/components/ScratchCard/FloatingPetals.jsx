import React from 'react';

const PetalSVG = ({ color = '#e91e8c', size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
        <ellipse cx="20" cy="20" rx="8" ry="18" fill={color} opacity="0.6" transform="rotate(30 20 20)" />
    </svg>
);

export default function FloatingPetals() {
    const petals = [
        { top: '5%', left: '8%', size: 40, delay: '0s', duration: '18s', opacity: 0.12, color: '#e91e8c' },
        { top: '15%', left: '88%', size: 28, delay: '3s', duration: '22s', opacity: 0.08, color: '#c2185b' },
        { top: '40%', left: '3%', size: 52, delay: '1s', duration: '25s', opacity: 0.07, color: '#f9a825' },
        { top: '70%', left: '92%', size: 36, delay: '5s', duration: '20s', opacity: 0.10, color: '#e91e8c' },
        { top: '85%', left: '15%', size: 44, delay: '2s', duration: '28s', opacity: 0.06, color: '#7b1fa2' },
        { top: '25%', left: '50%', size: 32, delay: '6s', duration: '24s', opacity: 0.09, color: '#c2185b' },
        { top: '60%', left: '30%', size: 48, delay: '4s', duration: '26s', opacity: 0.08, color: '#e91e8c' },
        { top: '80%', left: '60%', size: 30, delay: '7s', duration: '19s', opacity: 0.11, color: '#f9a825' },
        { top: '10%', left: '70%', size: 50, delay: '2.5s', duration: '27s', opacity: 0.07, color: '#7b1fa2' },
        { top: '55%', left: '80%', size: 38, delay: '8s', duration: '21s', opacity: 0.10, color: '#c2185b' },
        { top: '95%', left: '40%', size: 42, delay: '1.5s', duration: '23s', opacity: 0.08, color: '#e91e8c' },
        { top: '35%', left: '15%', size: 26, delay: '9s', duration: '17s', opacity: 0.13, color: '#f9a825' },
        { top: '45%', left: '65%', size: 54, delay: '3.5s', duration: '29s', opacity: 0.06, color: '#7b1fa2' },
        { top: '75%', left: '10%', size: 34, delay: '0.5s', duration: '20s', opacity: 0.09, color: '#c2185b' },
        { top: '20%', left: '35%', size: 46, delay: '5.5s', duration: '25s', opacity: 0.07, color: '#e91e8c' },
    ];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            {petals.map((p, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: p.top,
                        left: p.left,
                        opacity: p.opacity,
                        animation: `petalFloat ${p.duration} linear infinite`,
                        animationDelay: p.delay,
                    }}
                >
                    <PetalSVG color={p.color} size={p.size} />
                </div>
            ))}
        </div>
    );
}
