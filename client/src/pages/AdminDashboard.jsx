import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notify";
import Logo from "../components/common/Logo";
import BackButton from "../components/common/BackButton";
import ConfirmationModal from "../components/common/ConfirmationModal";
import Skeleton, { ProjectSkeleton } from "../components/common/Skeleton";

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("stats");
    const [confirmDeleteProject, setConfirmDeleteProject] = useState(null); // stores projectId
    const [confirmRoleChange, setConfirmRoleChange] = useState(null); // stores { userId, targetRole }
    const [updatingRole, setUpdatingRole] = useState(false);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [statsRes, usersRes, projectsRes] = await Promise.all([
                    api.get("/admin/stats"),
                    api.get("/admin/users"),
                    api.get("/admin/projects")
                ]);
                setStats(statsRes.data);
                setUsers(usersRes.data);
                setProjects(projectsRes.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load admin data");
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const handleDeleteProject = async () => {
        const projectId = confirmDeleteProject;
        setConfirmDeleteProject(null);
        try {
            await api.delete(`/projects/${projectId}`);
            setProjects(prev => prev.filter(p => p._id !== projectId));
            // Refresh stats
            const statsRes = await api.get("/admin/stats");
            setStats(statsRes.data);
            notify.success("Project permanently removed by administrator.");
        } catch (err) {
            notify.error("Failed to delete project");
        }
    };

    const handleRoleChange = async () => {
        const { userId, targetRole } = confirmRoleChange;
        setConfirmRoleChange(null);
        setUpdatingRole(true);
        try {
            await api.put(`/admin/promote/${userId}`, { role: targetRole });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: targetRole } : u));
            notify.success(`User role updated to ${targetRole}.`);
        } catch (err) {
            notify.error(err.response?.data?.message || "Failed to update role");
        } finally {
            setUpdatingRole(false);
        }
    };

    if (loading) return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Logo size={24} showText={false} />
                        <span>CascadeX Control Center</span>
                    </div>
                </div>
            </nav>
            <main className="dashboard-main">
                <div className="skeleton" style={{ height: '1.5rem', width: '150px', marginBottom: '2rem' }}></div>
                <div className="dashboard-header">
                    <div>
                        <div className="skeleton" style={{ height: '2.5rem', width: '300px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '1rem', width: '250px' }}></div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                        <Skeleton height="4rem" />
                        <Skeleton height="4rem" />
                        <Skeleton height="4rem" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <Skeleton width="150px" height="2.5rem" />
                    <Skeleton width="150px" height="2.5rem" />
                </div>

                <ProjectSkeleton />
            </main>
        </div>
    );

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Logo size={24} showText={false} />
                        <span>CascadeX Control Center</span>
                    </Link>
                </div>
                <div className="navbar-user">
                    <span className="user-greeting">Welcome, Administrator {currentUser.name}</span>
                </div>
            </nav>

            <main className="dashboard-main">
                <BackButton fallbackRoute="/dashboard" label="Exit to User Dashboard" />
                <div className="dashboard-header">
                    <div>
                        <h1>Platform Administration</h1>
                        <p className="subtitle">System-wide monitoring and management</p>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* System Stats Section */}
                {stats && (
                    <div className="card analytics-panel" style={{ marginBottom: '2rem', borderTop: '4px solid var(--accent)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="analytics-stat">
                                <label>Total Users</label>
                                <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {stats.totalUsers}
                                </div>
                            </div>
                            <div className="analytics-stat">
                                <label>Total Projects</label>
                                <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {stats.totalProjects}
                                </div>
                            </div>
                            <div className="analytics-stat">
                                <label>Active Simulations</label>
                                <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                    {stats.activeSimulationsCount}
                                </div>
                                <p className="subtitle">Across all projects</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <button
                        className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users Management
                    </button>
                    <button
                        className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('projects')}
                    >
                        Project History
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="card">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>Role</th>
                                    <th style={{ padding: '1rem' }}>Joined</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {u.name}
                                            {u._id === currentUser._id && <span style={{ marginLeft: '8px', opacity: 0.6 }}>(You)</span>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{u.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                                                color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)'
                                            }}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {u._id !== currentUser._id && (
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                    onClick={() => setConfirmRoleChange({
                                                        userId: u._id,
                                                        targetRole: u.role === 'admin' ? 'user' : 'admin'
                                                    })}
                                                >
                                                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="project-grid">
                        {projects.map(p => (
                            <div key={p._id} className="card project-card">
                                <div className="project-card-header">
                                    <h3>{p.name}</h3>
                                    <button
                                        className="btn btn-icon btn-danger"
                                        onClick={() => setConfirmDeleteProject(p._id)}
                                        title="System Delete"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="project-description">{p.description || "No description provided."}</p>
                                <div className="project-meta">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="project-date">Owner: {p.createdBy?.name || "Unknown"}</span>
                                        <Link to={`/projects/${p._id}`} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Inspect</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmationModal
                    isOpen={!!confirmDeleteProject}
                    title="Administrative Delete"
                    description="As an administrator, you are about to permanently delete this project and all its associated data. This action is irreversible."
                    confirmText="Force Delete"
                    danger={true}
                    onConfirm={handleDeleteProject}
                    onCancel={() => setConfirmDeleteProject(null)}
                />

                <ConfirmationModal
                    isOpen={!!confirmRoleChange}
                    title={confirmRoleChange?.targetRole === 'admin' ? "Promote User" : "Demote User"}
                    description={`Are you sure you want to change this user's role to ${confirmRoleChange?.targetRole}? This will grant or revoke full administrative access to the platform.`}
                    confirmText="Apply Change"
                    danger={confirmRoleChange?.targetRole === 'user'}
                    onConfirm={handleRoleChange}
                    onCancel={() => setConfirmRoleChange(null)}
                />
            </main>
        </div>
    );
};

export default AdminDashboard;
