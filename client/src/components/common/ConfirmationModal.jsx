import React from 'react';

const ConfirmationModal = ({
    isOpen,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    danger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{ maxWidth: '450px', width: '90%', padding: '2rem', borderTop: danger ? '4px solid #ef4444' : '4px solid var(--accent)' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>{description}</p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-ghost"
                        style={{ flex: 1 }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn"
                        style={{
                            flex: 1,
                            backgroundColor: danger ? '#ef4444' : 'var(--accent)',
                            color: 'white'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
