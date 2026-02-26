import React from 'react';

const NodeCard = ({
    node,
    onEdit,
    onDelete,
    onFailureInfo,
    isReplayMode,
    isRunning,
    findFailureSource
}) => {
    return (
        <div
            key={node._id}
            className={`card node-card ${node.failed ? 'failed-node' : ''}`}
            style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                border: node.failed ? '2px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: node.failed ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none',
                animation: node.failed ? 'node-pulse 2s infinite' : ' fadeInUp 0.4s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: node.failed ? '#ef4444' : 'var(--text-primary)',
                    letterSpacing: '-0.01em'
                }}>
                    {node.name}
                    {node.failed && <span style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '8px', opacity: 0.8 }}>(FAILED)</span>}
                </h3>

                {!isReplayMode && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            className="btn btn-icon"
                            style={{ padding: '4px', opacity: 0.6, hover: { opacity: 1 } }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(node);
                            }}
                            title="Edit Node"
                        >
                            <span style={{ fontSize: '0.9rem' }}>✏️</span>
                        </button>
                        <button
                            className="btn btn-icon btn-danger"
                            style={{ padding: '4px', opacity: 0.6, hover: { opacity: 1 } }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(node._id);
                            }}
                            disabled={isRunning}
                            title="Delete Node"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{node.type}</span>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resource</span>
                    <span style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: node.failed ? '#ef4444' : 'var(--accent)'
                    }}>
                        {Math.round(node.resourceValue)}
                    </span>
                </div>
            </div>

            {node.failed && (
                <div
                    style={{
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: 'var(--danger)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'help',
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        borderRadius: '6px'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onFailureInfo(node);
                    }}
                >
                    <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '1px solid var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px'
                    }}>i</span>
                    <span>Cascade Details</span>
                </div>
            )}

            <div style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
            }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacity</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{node.maxCapacity}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Threshold</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fca5a5' }}>{node.failureThreshold}</div>
                </div>
            </div>

            <style>{`
                .node-card:hover {
                    border-color: rgba(139, 92, 246, 0.5) !important;
                    transform: scale(1.02) translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
                    z-index: 10;
                }
                @keyframes node-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
};

export default NodeCard;
