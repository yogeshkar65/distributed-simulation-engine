import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ fallbackRoute = "/dashboard", label = "Back" }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        // If we have history beyond the current page, go back
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallbackRoute);
        }
    };

    return (
        <button
            onClick={handleBack}
            className="btn btn-ghost"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                transition: 'color 0.2s ease',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            {label}
        </button>
    );
};

export default BackButton;
