import React, { useState, useEffect } from 'react';

const LiveDemo = () => {
    const [nodes, setNodes] = useState([
        { id: 1, x: 50, y: 50, status: 'healthy', label: 'Auth Service' },
        { id: 2, x: 200, y: 50, status: 'healthy', label: 'User API' },
        { id: 3, x: 125, y: 150, status: 'healthy', label: 'Main Database' },
        { id: 4, x: 250, y: 150, status: 'healthy', label: 'Cache Layer' },
    ]);

    const [edges, setEdges] = useState([
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 4, to: 3 },
    ]);

    const [active, setActive] = useState(false);

    useEffect(() => {
        let timeout;
        if (active) {
            // Step 1: Auth Service fails
            timeout = setTimeout(() => {
                setNodes(prev => prev.map(n => n.id === 1 ? { ...n, status: 'failed' } : n));

                // Step 2: Propagation to User API
                setTimeout(() => {
                    setNodes(prev => prev.map(n => n.id === 2 ? { ...n, status: 'failed' } : n));

                    // Step 3: Propagation to Database
                    setTimeout(() => {
                        setNodes(prev => prev.map(n => n.id === 3 ? { ...n, status: 'failed' } : n));
                    }, 1000);
                }, 1000);
            }, 1000);
        } else {
            setNodes(prev => prev.map(n => ({ ...n, status: 'healthy' })));
        }

        return () => clearTimeout(timeout);
    }, [active]);

    return (
        <div className="live-demo-container" style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '250px'
        }}>
            <svg width="100%" height="250" viewBox="0 0 350 250">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orientation="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.2)" />
                    </marker>
                </defs>

                {/* Edges */}
                {edges.map((edge, i) => {
                    const from = nodes.find(n => n.id === edge.from);
                    const to = nodes.find(n => n.id === edge.to);
                    const isFailing = from.status === 'failed' && to.status === 'healthy';

                    return (
                        <line
                            key={i}
                            x1={from.x} y1={from.y}
                            x2={to.x} y2={to.y}
                            stroke={isFailing ? 'var(--danger)' : 'rgba(255,255,255,0.1)'}
                            strokeWidth="2"
                            strokeDasharray={isFailing ? "5,5" : "0"}
                            className={isFailing ? "demo-edge-failing" : ""}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map(node => (
                    <g key={node.id}>
                        <circle
                            cx={node.x} cy={node.y} r="15"
                            fill={node.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.1)'}
                            stroke={node.status === 'failed' ? 'var(--danger)' : 'var(--accent)'}
                            strokeWidth="2"
                            className={node.status === 'failed' ? 'demo-node-failed' : ''}
                        />
                        <text
                            x={node.x} y={node.y + 35}
                            textAnchor="middle"
                            fill="var(--text-secondary)"
                            fontSize="10"
                            fontWeight="bold"
                        >
                            {node.label}
                        </text>
                    </g>
                ))}
            </svg>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                    onClick={() => setActive(!active)}
                    className={`btn ${active ? 'btn-danger' : 'btn-primary'}`}
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                    {active ? 'Reset Simulation' : 'Trigger Fault Injection'}
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {active ? 'Failure propagating through system dependencies...' : 'System operating at optimal capacity.'}
                </p>
            </div>

            <style>{`
                @keyframes pulse-danger {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .demo-node-failed {
                    animation: pulse-danger 2s infinite;
                }
                .demo-edge-failing {
                    stroke-dashoffset: 10;
                    animation: dash 1s linear infinite;
                }
                @keyframes dash {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
};

export default LiveDemo;
