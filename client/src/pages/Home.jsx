import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/common/Logo";
import LiveDemo from "../components/common/LiveDemo";

const Home = () => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="home-page dashboard hero-gradient">
            <nav className="navbar">
                <div className="navbar-brand">
                    <Logo size={28} />
                </div>
                <div className="navbar-user">
                    <Link to="/login" className="btn btn-ghost">Login</Link>
                    <Link to="/register" className="btn btn-primary">Get Started</Link>
                </div>
            </nav>

            <main className="dashboard-main" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <section className="hero" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: 'var(--accent)',
                        marginBottom: '1.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Reliability Engineering Platform
                    </div>
                    <h1 style={{
                        fontSize: '4.5rem',
                        fontWeight: '900',
                        lineHeight: '1',
                        marginBottom: '1.5rem',
                        color: '#f8fafc',
                        letterSpacing: '-0.03em'
                    }}>
                        Model Cascading Failures in Distributed Systems
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '3rem',
                        maxWidth: '650px',
                        margin: '0 auto 3rem',
                        lineHeight: '1.6'
                    }}>
                        Simulate weighted dependency graphs with real-time propagation and replayable state history. Engineer failure before it happens.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }}>
                            Launch Simulation
                        </Link>
                        <Link to="/login" className="btn btn-ghost" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }}>
                            View Demo
                        </Link>
                    </div>
                </section>

                {/* Mockup Section */}
                <section style={{ marginTop: '8rem', position: 'relative' }}>
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1rem',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            minHeight: '400px',
                            background: '#020617',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: 'var(--text-muted)',
                            padding: '2rem'
                        }}>
                            <LiveDemo />
                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <p style={{ maxWidth: '450px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    This interactive demo represents weighted failure propagation across dependent systems. Trigger a fault to see the cascade effect.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '120%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
                        zIndex: -1
                    }}></div>
                </section>

                {/* Feature Grid */}
                <section style={{ marginTop: '10rem' }}>
                    <div className="project-grid">
                        {[
                            { title: "Real-time Simulation", desc: "Live propagation updates powered by Redis and BullMQ distributed workers.", icon: "⚡" },
                            { title: "Distributed Execution", desc: "Atomic state progression across clustered simulation environments.", icon: "🌐" },
                            { title: "Replay History", desc: "Minute-by-minute snapshot persistence for deep failure forensics.", icon: "⏮️" },
                            { title: "Dependency Modeling", desc: "Intuitive graph creation with weighted propagation and capacity logic.", icon: "🕸️" }
                        ].map((feature, i) => (
                            <div key={i} className="card feature-card" style={{ textAlign: 'left', padding: '2rem' }}>
                                <div className="feature-icon" style={{ fontSize: '1.5rem' }}>{feature.icon}</div>
                                <h3 style={{ marginBottom: '0.75rem' }}>{feature.title}</h3>
                                <p className="project-description" style={{ fontSize: '0.94rem' }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Architecture Highlights */}
                <section style={{ marginTop: '12rem', textAlign: 'left', maxWidth: '1000px', margin: '12rem auto 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Built for Distributed Reliability</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                CascadeX is architected to handle high-concurrency failure modeling with sub-millisecond state updates.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {[
                                { title: "Redis-backed State Engine", desc: "Optimistic locking and atomic updates for distributed correctness." },
                                { title: "BullMQ Distributed Execution", desc: "Asynchronous worker architecture for horizontal simulation scaling." },
                                { title: "Snapshot Replay System", desc: "Deterministic re-execution of failure cascades from point-in-time snapshots." }
                            ].map((pillar, i) => (
                                <div key={i}>
                                    <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{pillar.title}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{pillar.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Block */}
                <section style={{
                    marginTop: '12rem',
                    padding: '6rem 2rem',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    borderRadius: '24px',
                    border: '1px solid rgba(56, 189, 248, 0.1)'
                }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Start Modeling Complex Systems Today</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Engineering resilience requires rigorous failure simulation.</p>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                        Create Free Project
                    </Link>
                </section>
            </main>

            <footer style={{
                marginTop: '6rem',
                padding: '4rem 2rem',
                borderTop: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <Logo size={20} />
                        <p style={{ marginTop: '0.5rem' }}>Distributed Simulation Platform for Reliability Engineering</p>
                        <p style={{ marginTop: '1rem' }}>&copy; 2026 CascadeX Systems</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <a href="#">Privacy</a>
                        <a href="#">GitHub</a>
                        <a href="#">Docs</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
