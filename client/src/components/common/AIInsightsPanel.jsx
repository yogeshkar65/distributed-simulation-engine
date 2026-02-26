import React, { useState } from 'react';
import { AIInsightsSkeleton } from './Skeleton';

const AIInsightsPanel = ({
    analysis,
    onPredict,
    onAnalyze,
    isLoading,
    isPostSim = false
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const getRiskColor = (score) => {
        if (score > 70) return '#ef4444'; // Red
        if (score > 40) return '#f59e0b'; // Orange
        return '#10b981'; // Green
    };

    if (!analysis && !isLoading) return (
        <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px dashed var(--accent)',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            animation: 'fadeIn 0.5s ease'
        }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Architecture Intelligence Engine is idle. Run analysis to identify vulnerabilities.
            </p>
            <button
                className="btn btn-primary"
                onClick={isPostSim ? onAnalyze : onPredict}
                disabled={isLoading}
                style={{ padding: '0.75rem 1.5rem' }}
            >
                {isLoading ? 'Processing Neural Graph...' : (isPostSim ? '🧠 Analyze Cascade' : '🧠 Predict Risk')}
            </button>
        </div>
    );

    const riskScore = analysis?.systemRiskScore || (analysis?.riskLevel === 'HIGH' ? 85 : analysis?.riskLevel === 'MEDIUM' ? 50 : 20);
    const riskColor = getRiskColor(riskScore);

    return (
        <div className="card ai-panel" style={{
            border: `1px solid ${riskScore > 40 ? riskColor + '55' : 'rgba(139, 92, 246, 0.3)'}`,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            padding: 0,
            overflow: 'hidden',
            boxShadow: `0 8px 32px ${riskScore > 70 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.4)'}`,
            animation: 'fadeIn 0.6s ease',
            backdropFilter: 'blur(10px)'
        }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'all 0.3s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 8px var(--accent))' }}>🧠</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>Architecture Intelligence</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {analysis && (
                        <span className="badge" style={{
                            backgroundColor: riskColor + '22',
                            color: riskColor,
                            border: `1px solid ${riskColor}44`,
                            fontWeight: 'bold',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase'
                        }}>
                            {analysis.classification || analysis.riskLevel} RISK
                        </span>
                    )}
                    <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{isExpanded ? '▼' : '▲'}</span>
                </div>
            </div>

            {isExpanded && (
                <div style={{ padding: '2rem 1.5rem' }}>
                    {isLoading ? (
                        <AIInsightsSkeleton />
                    ) : (
                        <div className="ai-content" style={{ animation: 'fadeIn 0.4s ease' }}>
                            {/* System Risk Score Card (Pre-Sim) */}
                            {analysis.systemRiskScore !== undefined && (
                                <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Structural Fragility Index</div>
                                    <div style={{ fontSize: '3.5rem', fontWeight: '800', color: riskColor, lineHeight: 1, textShadow: `0 0 20px ${riskColor}33` }}>
                                        {analysis.systemRiskScore}%
                                    </div>
                                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                        Deepest Dependency Chain: <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{analysis.maxDependencyDepth} layers</span>
                                    </div>
                                </div>
                            )}

                            {/* Summary / Root Cause (Post-Sim) */}
                            {analysis.summary && (
                                <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Post-Mortem Executive Summary</div>
                                    <p style={{ margin: 0, fontSize: '0.94rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{analysis.summary}</p>

                                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Failure Origin</div>
                                            <div style={{ fontWeight: '600', color: 'var(--danger)' }}>{analysis.rootCause}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Identified Vulnerability</div>
                                            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{analysis.structuralWeakness}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Critical Nodes */}
                                {analysis.criticalNodes && analysis.criticalNodes.length > 0 && (
                                    <div className="ai-insight-group">
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                            SINGLE POINTS OF FAILURE
                                        </h4>
                                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {analysis.criticalNodes.map(node => (
                                                <li key={node.id} style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '6px', borderLeft: '3px solid var(--danger)' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>{node.name}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{node.reason}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Bottlenecks */}
                                {analysis.bottlenecks && analysis.bottlenecks.length > 0 && (
                                    <div className="ai-insight-group">
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                            IDENTIFIED BOTTLENECKS
                                        </h4>
                                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {analysis.bottlenecks.map(node => (
                                                <li key={node.id} style={{ padding: '10px 12px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>{node.name}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{node.reason}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Recommendations */}
                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                                <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Resilience Recommendations</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {analysis.recommendations.map((rec, i) => (
                                            <div key={i} style={{
                                                padding: '12px 14px',
                                                background: 'rgba(16, 185, 129, 0.04)',
                                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                                fontSize: '0.88rem',
                                                borderRadius: '8px',
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                lineHeight: '1.4'
                                            }}>
                                                • {rec}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.85rem' }} onClick={isPostSim ? onAnalyze : onPredict}>
                                    🔄 Refresh Neural Model
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem', background: 'var(--accent)' }} onClick={() => window.print()}>
                                    📄 Intelligence Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIInsightsPanel;
