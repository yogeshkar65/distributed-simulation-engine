import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notify";
import ConfirmationModal from "../components/common/ConfirmationModal";
import Logo from "../components/common/Logo";
import BackButton from "../components/common/BackButton";
import AIInsightsPanel from "../components/common/AIInsightsPanel";
import NodeCard from "../components/common/NodeCard";
import { NodeSkeleton } from "../components/common/Skeleton";

const ProjectPage = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [graph, setGraph] = useState({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [simStatus, setSimStatus] = useState({ isRunning: false, tickCount: 0 });
    const [analytics, setAnalytics] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Replay state
    const [history, setHistory] = useState([]);
    const [replayTick, setReplayTick] = useState(null);
    const [isReplayMode, setIsReplayMode] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);

    // Socket ref
    const socketRef = useRef(null);

    // Node form state
    const [showNodeForm, setShowNodeForm] = useState(false);
    const [nodeData, setNodeData] = useState({
        name: "",
        type: "generic",

        resourceValue: 100,
        maxCapacity: 100,
        failureThreshold: 20
    });
    const [creatingNode, setCreatingNode] = useState(false);

    // Edge form state
    const [showEdgeForm, setShowEdgeForm] = useState(false);
    const [editingNode, setEditingNode] = useState(null); // Node currently being edited
    const [updatingNode, setUpdatingNode] = useState(false);
    const [edgeData, setEdgeData] = useState({
        sourceNodeId: "",
        targetNodeId: "",
        weight: 1
    });
    const [creatingEdge, setCreatingEdge] = useState(false);

    // Modern Modal States
    const [confirmDeleteNode, setConfirmDeleteNode] = useState(null); // stores nodeId
    const [confirmDeleteEdge, setConfirmDeleteEdge] = useState(null); // stores edgeId
    const [confirmClearHistory, setConfirmClearHistory] = useState(false);

    // Popover state for failures
    const [failurePopover, setFailurePopover] = useState(null); // stores node details

    const fetchData = async () => {
        try {
            const [projectRes, graphRes, statusRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/graph/${projectId}`),
                api.get(`/simulation/status/${projectId}`)
            ]);
            setProject(projectRes.data);
            setGraph(graphRes.data);
            setSimStatus(statusRes.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load project data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Socket Implementation
        socketRef.current = io("http://localhost:5000");

        socketRef.current.on("connect", () => {
            console.log("Connected to simulation server");
            console.log("Socket connected:", socketRef.current.id);
            socketRef.current.emit("joinProjectRoom", projectId);
        });

        const handleSimulationStopped = (data) => {
            console.log("STOP EVENT RECEIVED", data);
            console.log("Simulation reset triggered");

            if (data.projectId === projectId) {
                setSimStatus({ isRunning: false, tickCount: 0 });

                // Reset ALL simulation-related UI state
                setAnalytics(null);
                setAiAnalysis(null); // Clear AI insights too for a clean reset

                // Clear node failure visuals
                setGraph(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(node => ({
                        ...node,
                        failed: false
                    }))
                }));
            }
        };

        socketRef.current.on("simulation:stopped", handleSimulationStopped);

        socketRef.current.on("simulation_update", (data) => {
            // Ignore live updates in replay mode
            if (isReplayMode) return;

            setSimStatus(prev => ({ ...prev, isRunning: true, tickCount: data.tickCount }));
            if (data.analytics) {
                setAnalytics(data.analytics);
            }

            setGraph(prev => ({
                ...prev,
                nodes: prev.nodes.map(node => {
                    const nodeUpdate = data.nodesState[node._id];
                    if (nodeUpdate) {
                        return {
                            ...node,
                            resourceValue: nodeUpdate.resourceValue,
                            failed: nodeUpdate.failed
                        };
                    }
                    return node;
                })
            }));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off("simulation:stopped", handleSimulationStopped);
                socketRef.current.disconnect();
            }
        };
    }, [projectId, isReplayMode]);

    const handleStartSimulation = async () => {
        try {
            setError("");
            await api.post(`/simulation/start/${projectId}`);
            setSimStatus(prev => ({ ...prev, isRunning: true }));
            setIsReplayMode(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to start simulation");
        }
    };

    const handleStopSimulation = async () => {
        try {
            setError("");
            const response = await api.post(`/simulation/stop/${projectId}`);
            console.log("Stop Simulation Response:", response.data);

            if (response.data.success) {
                setSimStatus({ isRunning: false, tickCount: 0 });
                notify.success("Simulation stopped successfully.");

                // If we have failures, trigger AI analysis automatically
                const failedIds = analytics?.failedNodeIds || [];
                if (failedIds.length > 0) {
                    try {
                        await handleAnalyzeSimulation(failedIds, analytics?.cascadeDepth || 0);
                    } catch (aiErr) {
                        console.error("Auto-analysis failed after stop:", aiErr);
                    }
                }

                // Refresh graph to see final state
                try {
                    const graphRes = await api.get(`/graph/${projectId}`);
                    setGraph(graphRes.data);
                } catch (graphErr) {
                    console.error("Failed to refresh graph after stop:", graphErr);
                }
            } else {
                notify.error("Failed to stop simulation: unexpected response.");
            }
        } catch (err) {
            console.error("Stop Simulation Error:", err);
            const msg = err.response?.data?.message || "Failed to stop simulation";
            setError(msg);
            notify.error(msg);
        }
    };

    const handleViewHistory = async () => {
        setFetchingHistory(true);
        setError("");
        try {
            const res = await api.get(`/simulation-history/${projectId}`);
            if (res.data.length === 0) {
                setError("No simulation history found for this project.");
                setFetchingHistory(false);
                return;
            }
            setHistory(res.data);
            setIsReplayMode(true);
            // Set initial replay to the last tick
            const lastSnapshot = res.data[res.data.length - 1];
            applySnapshot(lastSnapshot);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch simulation history");
        } finally {
            setFetchingHistory(false);
        }
    };

    const handleExitReplay = () => {
        setIsReplayMode(false);
        setReplayTick(null);
        setHistory([]);
        fetchData(); // Reset to live state
    };

    const handleClearHistory = async () => {
        setConfirmClearHistory(false);
        try {
            await api.delete(`/simulation-history/${projectId}`);
            setHistory([]);
            if (isReplayMode) handleExitReplay();
            notify.success("Simulation history cleared.");
        } catch (err) {
            notify.error("Failed to clear history");
        }
    };

    const applySnapshot = (snapshot) => {
        setReplayTick(snapshot.tick);
        setGraph(prev => ({
            ...prev,
            nodes: prev.nodes.map(node => {
                const updated = snapshot.nodesState[node._id];
                if (!updated) return node;
                return {
                    ...node,
                    resourceValue: updated.resourceValue,
                    failed: updated.failed
                };
            })
        }));
        setAnalytics(snapshot.analytics);
    };

    const handleSliderChange = (e) => {
        const tickIndex = Number(e.target.value) - 1;
        const snapshot = history[tickIndex];
        if (snapshot) {
            applySnapshot(snapshot);
        }
    };

    const handleCreateNode = async (e) => {
        e.preventDefault();
        setCreatingNode(true);
        setError("");
        try {
            const res = await api.post("/graph/nodes", {
                ...nodeData,
                projectId
            });
            setGraph(prev => ({
                ...prev,
                nodes: [...prev.nodes, res.data]
            }));
            setNodeData({
                name: "",
                type: "generic",
                resourceValue: 100,
                maxCapacity: 100,
                failureThreshold: 20
            });
            setShowNodeForm(false);
            notify.success(`Node "${res.data.name}" created.`);
        } catch (err) {
            notify.error(err.response?.data?.message || "Failed to create node");
        } finally {
            setCreatingNode(false);
        }
    };

    const handleCreateEdge = async (e) => {
        e.preventDefault();
        if (!edgeData.sourceNodeId || !edgeData.targetNodeId) {
            setError("Please select both source and target nodes.");
            return;
        }
        if (edgeData.sourceNodeId === edgeData.targetNodeId) {
            setError("Source and target nodes cannot be the same.");
            return;
        }
        if (edgeData.weight < 1) {
            setError("Weight must be at least 1.");
            return;
        }

        setCreatingEdge(true);
        setError("");
        try {
            const res = await api.post("/graph/edges", {
                ...edgeData,
                projectId
            });
            setGraph(prev => ({
                ...prev,
                edges: [...prev.edges, res.data]
            }));
            setEdgeData({
                sourceNodeId: "",
                targetNodeId: "",
                weight: 1
            });
            setShowEdgeForm(false);
            notify.success("Dependency established.");
        } catch (err) {
            notify.error(err.response?.data?.message || "Failed to create edge");
        } finally {
            setCreatingEdge(false);
        }
    };

    const handleUpdateNode = async (e) => {
        e.preventDefault();
        if (!editingNode.name) {
            setError("Node name is required.");
            return;
        }
        if (editingNode.resourceValue < 0 || editingNode.failureThreshold < 0) {
            setError("Values cannot be negative.");
            return;
        }
        if (editingNode.maxCapacity < editingNode.failureThreshold) {
            setError("Max capacity cannot be less than failure threshold.");
            return;
        }

        if (simStatus.isRunning) {
            notify.warning("Cannot edit nodes while simulation is running.");
            return;
        }

        setUpdatingNode(true);
        setError("");
        try {
            const res = await api.put(`/graph/nodes/${editingNode._id}`, {
                name: editingNode.name,
                resourceValue: editingNode.resourceValue,
                maxCapacity: editingNode.maxCapacity,
                failureThreshold: editingNode.failureThreshold
            });
            setGraph(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => n._id === res.data._id ? res.data : n)
            }));
            setEditingNode(null);
            notify.success(`Node "${res.data.name}" updated.`);
        } catch (err) {
            notify.error(err.response?.data?.message || "Failed to update node");
        } finally {
            setUpdatingNode(false);
        }
    };

    const handleDeleteNode = async () => {
        const nodeId = confirmDeleteNode;
        setConfirmDeleteNode(null);
        try {
            await api.delete(`/graph/nodes/${nodeId}`);
            // Refresh graph to reflect cascade delete of edges
            const res = await api.get(`/graph/${projectId}`);
            setGraph(res.data);
            notify.success("Node and associated dependencies removed.");
        } catch (err) {
            notify.error("Failed to delete node");
        }
    };

    const getHealthColor = (score) => {
        if (score > 70) return "#10b981"; // Green
        if (score > 40) return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    const findFailureSource = (node) => {
        if (!node.failed) return null;
        // In this engine, failures propagate through incoming edges
        const incomingEdges = graph.edges.filter(e => e.targetNodeId === node._id);
        const sourceEdge = incomingEdges.find(e => {
            const sourceNode = graph.nodes.find(n => n._id === e.sourceNodeId);
            return sourceNode && sourceNode.failed;
        });

        if (sourceEdge) {
            const sourceNode = graph.nodes.find(n => n._id === sourceEdge.sourceNodeId);
            return {
                name: sourceNode.name,
                weight: sourceEdge.weight
            };
        }
        return { name: "Direct System Overload", weight: "N/A" };
    };

    const handlePredictRisk = async () => {
        setAiLoading(true);
        try {
            const res = await api.post("/ai/predict-risk", { projectId });
            setAiAnalysis(res.data);
            notify.success("Graph Intelligence: Risk prediction complete.");
        } catch (err) {
            notify.error("AI Engine failed to analyze topology");
        } finally {
            setAiLoading(false);
        }
    };

    const handleAnalyzeSimulation = async (failedNodeIds, depth) => {
        setAiLoading(true);
        try {
            const res = await api.post("/ai/analyze-simulation", {
                projectId,
                failedNodeIds,
                cascadeDepth: depth
            });
            setAiAnalysis(res.data);
            notify.success("Forensics: Cascade analysis generated.");
        } catch (err) {
            console.error("AI Analysis failed:", err);
        } finally {
            setAiLoading(false);
        }
    };

    if (loading && !project) return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Logo size={24} showText={false} />
                        <span>CascadeX Dashboard</span>
                    </div>
                </div>
            </nav>
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <div style={{ width: '300px' }}>
                        <div className="skeleton" style={{ height: '2rem', width: '200px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '1rem', width: '150px' }}></div>
                    </div>
                </div>
                <NodeSkeleton />
            </main>
        </div>
    );
    if (!project) return <div className="dashboard-main"><div className="alert alert-error">Project not found</div></div>;

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Logo size={24} showText={false} />
                        <span>CascadeX Dashboard</span>
                    </Link>
                </div>
                <div className="navbar-user">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '1rem' }}>
                        <span className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {project.name}
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
                        </span>
                        {isReplayMode ? (
                            <span className="replay-badge">REPLAY MODE: Tick {replayTick}</span>
                        ) : (
                            simStatus.isRunning && <span className="tick-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>LIVE: Tick {simStatus.tickCount}</span>
                        )}
                    </div>
                </div>
            </nav>

            <main className="dashboard-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <BackButton fallbackRoute="/dashboard" label="Exit to Dashboard" />
                    {user?.role === 'admin' && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                            🛡️ ADMINISTRATIVE VIEW
                        </div>
                    )}
                </div>
                <div className="dashboard-header">
                    <div>
                        <h1>{isReplayMode ? "Simulation Replay" : "Simulation Control"}</h1>
                        <p className="subtitle">{graph.nodes.length} nodes | {graph.edges.length} edges</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!isReplayMode ? (
                            <>
                                {!simStatus.isRunning ? (
                                    <button className="btn btn-primary" onClick={handleStartSimulation} style={{ backgroundColor: '#10b981' }}>
                                        ▶ Start Simulation
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" onClick={handleStopSimulation} style={{ backgroundColor: '#ef4444' }}>
                                        ⏹ Stop Simulation
                                    </button>
                                )}
                                <button className="btn btn-ghost" onClick={handleViewHistory} disabled={fetchingHistory}>
                                    {fetchingHistory ? "Loading..." : "View History"}
                                </button>
                                <button className="btn btn-ghost" onClick={() => setShowNodeForm(!showNodeForm)}>
                                    {showNodeForm ? "Cancel Node" : "+ Add Node"}
                                </button>
                                <button className="btn btn-ghost" onClick={() => setShowEdgeForm(!showEdgeForm)}>
                                    {showEdgeForm ? "Cancel Dependency" : "+ Add Dependency"}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-primary" onClick={handleExitReplay}>
                                    Exit Replay
                                </button>
                                <button className="btn btn-danger" onClick={() => setConfirmClearHistory(true)} style={{ backgroundColor: 'transparent', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                    Clear History
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Replay Slider */}
                {isReplayMode && history.length > 0 && (
                    <div className="card replay-card" style={{ marginBottom: '1.5rem', background: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <span style={{ minWidth: '80px', fontWeight: 'bold' }}>Tick {replayTick}</span>
                            <input
                                type="range"
                                min="1"
                                max={history.length}
                                value={history.findIndex(h => h.tick === replayTick) + 1}
                                onChange={handleSliderChange}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <span style={{ minWidth: '80px', textAlign: 'right' }}>Total: {history.length}</span>
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: '2.5rem',
                    alignItems: 'start'
                }}>
                    <div className="main-simulation-area">
                        {/* Analytics Panel */}
                        {(simStatus.isRunning || isReplayMode) && analytics && (
                            <div className="card analytics-panel" style={{ marginBottom: '2rem', borderTop: `4px solid ${getHealthColor(analytics.systemHealthScore)}` }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div className="analytics-stat">
                                        <label>System Health</label>
                                        <div className="stat-value" style={{ color: getHealthColor(analytics.systemHealthScore), fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {analytics.systemHealthScore.toFixed(1)}%
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${analytics.systemHealthScore}%`, backgroundColor: getHealthColor(analytics.systemHealthScore) }}></div>
                                        </div>
                                    </div>
                                    <div className="analytics-stat">
                                        <label>Failed Nodes</label>
                                        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {analytics.failedPercentage.toFixed(1)}%
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${analytics.failedPercentage}%`, backgroundColor: '#ef4444' }}></div>
                                        </div>
                                    </div>
                                    <div className="analytics-stat">
                                        <label style={{ display: 'flex', alignItems: 'center' }}>
                                            Cascade Depth
                                            <span className="tooltip-trigger">?
                                                <span className="tooltip">
                                                    Cascade depth represents the maximum number of propagation layers triggered from an initial node failure.
                                                </span>
                                            </span>
                                        </label>
                                        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {analytics.cascadeDepth}
                                        </div>
                                        <p className="subtitle">Max Propagation Depth</p>
                                    </div>
                                    <div className="analytics-stat">
                                        <label>Most Impacted</label>
                                        {analytics.mostImpactedNode ? (
                                            <>
                                                <div className="stat-value" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                                    {analytics.mostImpactedNode.name}
                                                </div>
                                                <p className="subtitle">Impact: {analytics.mostImpactedNode.impactValue.toFixed(0)} units</p>
                                            </>
                                        ) : (
                                            <div className="stat-value" style={{ fontSize: '1.2rem', color: '#6b7280' }}>N/A</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showNodeForm && !isReplayMode && (
                            <div className="card create-form-card">
                                <h2>Add New Node</h2>
                                <form onSubmit={handleCreateNode} className="create-form">
                                    <div className="form-group">
                                        <label>Node Name</label>
                                        <input
                                            type="text"
                                            value={nodeData.name}
                                            onChange={e => setNodeData({ ...nodeData, name: e.target.value })}
                                            required
                                            placeholder="e.g. Server Alpha"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Type</label>
                                            <input
                                                type="text"
                                                value={nodeData.type}
                                                onChange={e => setNodeData({ ...nodeData, type: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Initial Resource</label>
                                            <input
                                                type="number"
                                                value={nodeData.resourceValue}
                                                onChange={e => setNodeData({ ...nodeData, resourceValue: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Max Capacity</label>
                                            <input
                                                type="number"
                                                value={nodeData.maxCapacity}
                                                onChange={e => setNodeData({ ...nodeData, maxCapacity: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Failure Threshold</label>
                                            <input
                                                type="number"
                                                value={nodeData.failureThreshold}
                                                onChange={e => setNodeData({ ...nodeData, failureThreshold: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={creatingNode}>
                                        {creatingNode ? "Creating..." : "Create Node"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {showEdgeForm && !isReplayMode && (
                            <div className="card create-form-card">
                                <h2>Add New Dependency</h2>
                                <form onSubmit={handleCreateEdge} className="create-form">
                                    <div className="form-group">
                                        <label>Source Node</label>
                                        <select
                                            value={edgeData.sourceNodeId}
                                            onChange={e => setEdgeData({ ...edgeData, sourceNodeId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Source Node</option>
                                            {graph.nodes.map(node => (
                                                <option key={node._id} value={node._id}>{node.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Target Node</label>
                                        <select
                                            value={edgeData.targetNodeId}
                                            onChange={e => setEdgeData({ ...edgeData, targetNodeId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Target Node</option>
                                            {graph.nodes.filter(node => node._id !== edgeData.sourceNodeId).map(node => (
                                                <option key={node._id} value={node._id}>{node.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Weight (Load/Propagation Force)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={edgeData.weight}
                                            onChange={e => setEdgeData({ ...edgeData, weight: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={creatingEdge || !edgeData.sourceNodeId || !edgeData.targetNodeId}>
                                        {creatingEdge ? "Creating..." : "Create Dependency"}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="project-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {graph.nodes.map(node => (
                                <NodeCard
                                    key={node._id}
                                    node={node}
                                    onEdit={setEditingNode}
                                    onDelete={setConfirmDeleteNode}
                                    onFailureInfo={setFailurePopover}
                                    isReplayMode={isReplayMode}
                                    isRunning={simStatus.isRunning}
                                    findFailureSource={findFailureSource}
                                />
                            ))}
                        </div>

                        {graph.nodes.length === 0 && !showNodeForm && (
                            <div className="empty-state">
                                <h2>No nodes defined</h2>
                                <p>Start by adding nodes to your simulation graph.</p>
                            </div>
                        )}
                    </div>

                    <div className="sidebar" style={{ position: 'sticky', top: '100px' }}>
                        <AIInsightsPanel
                            analysis={aiAnalysis}
                            isLoading={aiLoading}
                            onPredict={handlePredictRisk}
                            onAnalyze={() => handleAnalyzeSimulation(analytics?.failedNodeIds || [], analytics?.cascadeDepth || 0)}
                            isPostSim={!!analytics}
                        />
                    </div>
                </div>
                {/* Edit Node Modal */}
                {editingNode && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '2rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Edit Node: {editingNode.name}</h2>
                                <button className="btn btn-ghost" onClick={() => setEditingNode(null)}>✕</button>
                            </div>

                            {simStatus.isRunning && (
                                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                                    Warning: Editing nodes during active simulation may affect behavior.
                                </div>
                            )}

                            <form onSubmit={handleUpdateNode} className="create-form">
                                <div className="form-group">
                                    <label>Node Name</label>
                                    <input
                                        type="text"
                                        value={editingNode.name}
                                        onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Resource Value</label>
                                        <input
                                            type="number"
                                            value={editingNode.resourceValue}
                                            onChange={(e) => setEditingNode({ ...editingNode, resourceValue: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Capacity</label>
                                        <input
                                            type="number"
                                            value={editingNode.maxCapacity}
                                            onChange={(e) => setEditingNode({ ...editingNode, maxCapacity: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Failure Threshold</label>
                                    <input
                                        type="number"
                                        value={editingNode.failureThreshold}
                                        onChange={(e) => setEditingNode({ ...editingNode, failureThreshold: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                        disabled={updatingNode || simStatus.isRunning}
                                    >
                                        {updatingNode ? "Updating..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        style={{ flex: 1 }}
                                        onClick={() => setEditingNode(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirmations */}
                <ConfirmationModal
                    isOpen={!!confirmDeleteNode}
                    title="Delete Node"
                    description="Are you sure you want to delete this node? This will also remove all associated dependencies and may break the simulation graph."
                    confirmText="Delete Node"
                    danger={true}
                    onConfirm={handleDeleteNode}
                    onCancel={() => setConfirmDeleteNode(null)}
                />

                <ConfirmationModal
                    isOpen={confirmClearHistory}
                    title="Clear Simulation History"
                    description="This will permanently delete all recorded simulation ticks and replay data for this project. This action cannot be undone."
                    confirmText="Clear History"
                    danger={true}
                    onConfirm={handleClearHistory}
                    onCancel={() => setConfirmClearHistory(false)}
                />

                {/* Failure Explanation Popover */}
                {failurePopover && (
                    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setFailurePopover(null)}>
                        <div
                            className="card"
                            style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Failure Analysis: {failurePopover.name}</h3>
                                <button className="btn btn-icon" onClick={() => setFailurePopover(null)}>✕</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(() => {
                                    const source = findFailureSource(failurePopover);
                                    return (
                                        <>
                                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px' }}>
                                                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Primary Cause</p>
                                                <p style={{ fontWeight: 'bold' }}>{source.name}</p>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Propagation Force</p>
                                                    <p style={{ fontWeight: '600' }}>{source.weight}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Health Threshold</p>
                                                    <p style={{ fontWeight: '600' }}>{failurePopover.failureThreshold}%</p>
                                                </div>
                                            </div>
                                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    This node's resource level dropped below its failure threshold due to state propagation from upstream dependencies.
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .analytics-panel {
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.03);
                }
                .analytics-stat label {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                .progress-bar-bg {
                    width: 100%;
                    height: 8px;
                    background: #334155;
                    border-radius: 4px;
                    margin-top: 0.75rem;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    transition: width 0.5s ease-out, background-color 0.5s ease;
                }
                .replay-badge {
                    margin-left: 12px;
                    background: #f59e0b;
                    color: #0f172a;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .replay-card input[type=range] {
                    accent-color: #f59e0b;
                }
                .modal-overlay {
                    backdrop-filter: blur(4px);
                }
            `}</style>
        </div>
    );
};

export default ProjectPage;
