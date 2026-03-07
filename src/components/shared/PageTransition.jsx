import React, { useEffect, useState } from 'react';

export default function PageTransition({ children, transitionKey }) {
    const [displayChildren, setDisplayChildren] = useState(children);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (transitionKey !== displayChildren.key) {
            setIsAnimating(true);
            const timeout = setTimeout(() => {
                setDisplayChildren(children);
                setIsAnimating(false);
            }, 300); // 300ms unmount fade duration
            return () => clearTimeout(timeout);
        }
    }, [children, transitionKey, displayChildren.key]);

    return (
        <div
            style={{
                width: '100vw',
                minHeight: '100vh',
                opacity: isAnimating ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
                animation: !isAnimating ? 'fadeIn 0.5s ease-out' : 'none',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {displayChildren}
        </div>
    );
}
