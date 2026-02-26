import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { notify } from "../utils/notify";
import Logo from "../components/common/Logo";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { ProjectSkeleton } from "../components/common/Skeleton";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [confirmDeleteProject, setConfirmDeleteProject] = useState(null); // stores projectId

    const fetchProjects = async () => {
        try {
            const res = await api.get("/projects");
            setProjects(res.data);
        } catch (err) {
            setError("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        setCreating(true);
        try {
            const res = await api.post("/projects", { name, description });
            setProjects([res.data, ...projects]);
            setName("");
            setDescription("");
            setShowForm(false);
            notify.success(`Project "${res.data.name}" created.`);
        } catch (err) {
            notify.error(err.response?.data?.message || "Failed to create project");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        const id = confirmDeleteProject;
        setConfirmDeleteProject(null);
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter((p) => p._id !== id));
            notify.success("Project deleted.");
        } catch (err) {
            notify.error("Failed to delete project");
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <Logo size={28} />
                </div>
                <div className="navbar-user">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '1rem' }}>
                        <span className="user-greeting">Hello, {user?.name}</span>
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            background: user?.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            color: user?.role === 'admin' ? '#a78bfa' : '#94a3b8',
                            border: `1px solid ${user?.role === 'admin' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                        }}>
                            {user?.role || 'user'}
                        </span>
                    </div>
                    {user?.role === "admin" && (
                        <Link to="/admin" className="btn btn-ghost" style={{ color: "var(--accent)", fontWeight: "bold" }}>
                            🛡️ Admin Panel
                        </Link>
                    )}
                    <button onClick={logout} className="btn btn-ghost">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <div>
                        <h1>Your Projects</h1>
                        <p className="subtitle">
                            {projects.length} project{projects.length !== 1 ? "s" : ""} total
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "Cancel" : "+ New Project"}
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Create Project Form */}
                {showForm && (
                    <div className="card create-form-card">
                        <h2>Create New Project</h2>
                        <form onSubmit={handleCreate} className="create-form">
                            <div className="form-group">
                                <label htmlFor="project-name">Project Name</label>
                                <input
                                    id="project-name"
                                    type="text"
                                    placeholder="My Simulation Project"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="project-desc">Description (optional)</label>
                                <textarea
                                    id="project-desc"
                                    placeholder="Describe your simulation project..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={creating}
                            >
                                {creating ? "Creating..." : "Create Project"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Project List */}
                {loading ? (
                    <ProjectSkeleton />
                ) : projects.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect
                                    x="8"
                                    y="12"
                                    width="48"
                                    height="40"
                                    rx="4"
                                    stroke="#4b5563"
                                    strokeWidth="2"
                                    fill="none"
                                />
                                <path
                                    d="M8 20H56"
                                    stroke="#4b5563"
                                    strokeWidth="2"
                                />
                                <circle cx="16" cy="16" r="2" fill="#6366f1" />
                                <circle cx="22" cy="16" r="2" fill="#a78bfa" />
                                <circle cx="28" cy="16" r="2" fill="#c4b5fd" />
                            </svg>
                        </div>
                        <h2>No projects yet</h2>
                        <p>Create your first simulation project to get started.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowForm(true)}
                        >
                            + Create Project
                        </button>
                    </div>
                ) : (
                    <div className="project-grid">
                        {projects.map((project) => (
                            <div
                                key={project._id}
                                className="card project-card"
                                onClick={() => navigate(`/projects/${project._id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="project-card-header">
                                    <h3>{project.name}</h3>
                                    <button
                                        className="btn btn-icon btn-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDeleteProject(project._id);
                                        }}
                                        title="Delete project"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path
                                                d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <p className="project-description">
                                    {project.description || "No description provided"}
                                </p>
                                <div className="project-meta">
                                    <span className="project-date">
                                        Created {formatDate(project.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmationModal
                    isOpen={!!confirmDeleteProject}
                    title="Delete Project"
                    description="Are you sure you want to delete this project? All associated graph data, simulation history, and nodes will be permanently removed."
                    confirmText="Delete Project"
                    danger={true}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteProject(null)}
                />
            </main>
        </div>
    );
};

export default Dashboard;
