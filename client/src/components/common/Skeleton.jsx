import React from 'react';

const Skeleton = ({ width, height, borderRadius, className = "" }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: width || '100%',
                height: height || '1rem',
                borderRadius: borderRadius || 'var(--radius-sm)'
            }}
        />
    );
};

export const ProjectSkeleton = () => (
    <div className="project-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card project-card" style={{ pointerEvents: 'none' }}>
                <div className="project-card-header">
                    <Skeleton width="60%" height="1.2rem" />
                    <Skeleton width="24px" height="24px" borderRadius="4px" />
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                    <Skeleton width="90%" height="0.8rem" className="mb-2" style={{ marginBottom: '8px' }} />
                    <Skeleton width="70%" height="0.8rem" />
                </div>
                <div className="project-meta" style={{ marginTop: '1.25rem', paddingTop: '1rem' }}>
                    <Skeleton width="40%" height="0.7rem" />
                </div>
            </div>
        ))}
    </div>
);

export const NodeSkeleton = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%'
    }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ minHeight: '180px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <Skeleton width="50%" height="1rem" />
                    <Skeleton width="20%" height="0.8rem" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <Skeleton width="100%" height="0.6rem" style={{ marginBottom: '8px' }} />
                    <Skeleton width="80%" height="0.6rem" />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Skeleton width="32px" height="32px" borderRadius="4px" />
                    <Skeleton width="32px" height="32px" borderRadius="4px" />
                </div>
            </div>
        ))}
    </div>
);

export const AIInsightsSkeleton = () => (
    <div className="card" style={{ minHeight: '200px' }}>
        <Skeleton width="40%" height="1rem" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton width="100%" height="0.8rem" />
            <Skeleton width="95%" height="0.8rem" />
            <Skeleton width="90%" height="0.8rem" />
            <Skeleton width="100%" height="0.8rem" />
            <Skeleton width="40%" height="0.8rem" style={{ marginTop: '8px' }} />
        </div>
        <div style={{ marginTop: '2rem' }}>
            <Skeleton width="100%" height="2.5rem" borderRadius="var(--radius-sm)" />
        </div>
    </div>
);

export default Skeleton;
