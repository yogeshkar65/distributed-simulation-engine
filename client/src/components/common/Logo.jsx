import React from 'react';

const Logo = ({ size = 24, showText = true }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
                {/* Node X Shape */}
                <circle cx="6" cy="6" r="2.5" fill="url(#logo-gradient)" />
                <circle cx="18" cy="18" r="2.5" fill="url(#logo-gradient)" />
                <circle cx="18" cy="6" r="2.5" fill="url(#logo-gradient)" />
                <circle cx="6" cy="18" r="2.5" fill="url(#logo-gradient)" />
                <circle cx="12" cy="12" r="3" fill="url(#logo-gradient)" />

                {/* Connections */}
                <line x1="6" y1="6" x2="18" y2="18" stroke="url(#logo-gradient)" strokeWidth="1.5" />
                <line x1="18" y1="6" x2="6" y2="18" stroke="url(#logo-gradient)" strokeWidth="1.5" />
            </svg>
            {showText && (
                <span style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    CascadeX
                </span>
            )}
        </div>
    );
};

export default Logo;
