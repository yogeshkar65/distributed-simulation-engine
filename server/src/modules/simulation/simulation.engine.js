const Node = require("../graph/node.model");
const Edge = require("../graph/edge.model");
const SimulationHistory = require("../simulationHistory/simulationHistory.model");
const { getRedis } = require("../../config/redis");
const { getIO } = require("../../config/socket");
const { getSimulationQueue } = require("../../queues/simulation.queue");

/**
 * Build initial graph state and store in Redis
 */
const startSimulation = async (projectId) => {
    const redis = getRedis();
    const lockKey = `lock:simulation:${projectId}`;
    const stateKey = `simulation:${projectId}`;

    // 1. Acquire Distributed Lock (NX = Only if not exists, EX 5 = Expires in 5s)
    const acquired = await redis.set(lockKey, "true", "NX", "EX", 10);
    if (!acquired) {
        throw new Error("Simulation already running on another instance");
    }

    // 2. Fetch data from DB
    const nodes = await Node.find({ projectId });
    const edges = await Edge.find({ projectId });

    const nodesState = {};
    const adjacencyList = {};

    nodes.forEach(node => {
        nodesState[node._id.toString()] = {
            name: node.name,
            resourceValue: node.resourceValue,
            maxCapacity: node.maxCapacity,
            failureThreshold: node.failureThreshold,
            failed: false
        };
        adjacencyList[node._id.toString()] = [];
    });

    edges.forEach(edge => {
        const source = edge.sourceNodeId.toString();
        if (adjacencyList[source]) {
            adjacencyList[source].push({
                targetId: edge.targetNodeId.toString(),
                weight: edge.weight
            });
        }
    });

    // 3. Initialize Shared State in Redis
    const initialState = {
        projectId,
        nodesState,
        adjacencyList,
        newlyFailed: [],
        tickCount: 0,
        isRunning: true,
        version: 0, // 🔒 Distributed atomic version control
        analytics: {
            failedPercentage: 0,
            cascadeDepth: 0,
            mostImpactedNode: null,
            systemHealthScore: 100,
            failedNodeIds: []
        }
    };

    await redis.set(stateKey, JSON.stringify(initialState));

    // 4. Enqueue first tick job
    const queue = getSimulationQueue();
    await queue.add(`tick_${projectId}`, { projectId }, { jobId: `tick_${projectId}` });

    return initialState;
};

/**
 * Process a single simulation tick (called by BullMQ worker)
 * Hardened for distributed safety (locks, atomicity, idempotency)
 */
const processSimulationTick = async (projectId) => {
    const redis = getRedis();
    const stateKey = `simulation:${projectId}`;
    const lockKey = `lock:simulation:${projectId}`;

    // 1. Validate Lock Presence (Heartbeat)
    // If lock is gone, the simulation was either stopped or another instance might take over
    const isLocked = await redis.get(lockKey);
    if (!isLocked) {
        console.log(`[Engine] Aborting tick for ${projectId}: Lock not held.`);
        return;
    }

    // Refresh lock expiry (Keep-alive)
    await redis.expire(lockKey, 15);

    // 2. Fetch State
    const data = await redis.get(stateKey);
    if (!data) return;

    const simulation = JSON.parse(data);
    if (!simulation.isRunning) return;

    // 3. Run Logic
    evaluateFailures(simulation);
    propagateFailures(simulation);
    calculateAnalytics(simulation);

    // 4. 🔒 Distributed Optimistic Atomic Update
    let updated = false;

    while (!updated) {
        await redis.watch(stateKey);

        const currentData = await redis.get(stateKey);
        if (!currentData) {
            await redis.unwatch();
            return;
        }

        const currentState = JSON.parse(currentData);

        // If simulation was stopped
        if (!currentState.isRunning) {
            await redis.unwatch();
            return;
        }

        // If version mismatch → another worker already processed this tick
        if (currentState.version !== simulation.version) {
            await redis.unwatch();
            return;
        }

        // 🔒 Derive atomic next state from latest Redis state
        simulation.tickCount = currentState.tickCount + 1;
        simulation.version = currentState.version + 1;

        const multi = redis.multi();
        multi.set(stateKey, JSON.stringify(simulation));

        const execResult = await multi.exec();

        if (execResult !== null) {
            updated = true;
        }
    }

    // Persist Snapshot (Non-blocking)
    const snapshotTick = simulation.tickCount;
    const snapshotProjectId = simulation.projectId.toString();
    const snapshotNodes = JSON.parse(JSON.stringify(simulation.nodesState));
    const snapshotAnalytics = JSON.parse(JSON.stringify(simulation.analytics));

    setImmediate(async () => {
        try {
            await SimulationHistory.create({
                projectId: snapshotProjectId,
                tick: snapshotTick,
                nodesState: snapshotNodes,
                analytics: snapshotAnalytics
            });
        } catch (err) {
            console.error("Snapshot save failed:", err.message);
        }
    });

    // 6. Emit live update
    const io = getIO();
    io.to(`project_${snapshotProjectId}`).emit("simulation_update", {
        tickCount: simulation.tickCount,
        nodesState: simulation.nodesState,
        analytics: simulation.analytics
    });

    // 7. Schedule next tick (Idempotent jobId ensures only one 'next' job exists)
    const queue = getSimulationQueue();
    await queue.add(`tick_${projectId}`, { projectId }, {
        jobId: `tick_${projectId}`, // Same ID prevents duplicate overlapping ticks
        delay: 1000
    });
};

const stopSimulation = async (projectId) => {
    const redis = getRedis();
    const stateKey = `simulation:${projectId}`;
    const lockKey = `lock:simulation:${projectId}`;

    await redis.del(stateKey);
    await redis.del(lockKey);

    const queue = getSimulationQueue();
    const job = await queue.getJob(`tick_${projectId}`);
    if (job) await job.remove();
};

const getSimulationStatus = async (projectId) => {
    const redis = getRedis();
    const data = await redis.get(`simulation:${projectId}`);
    if (!data) return { isRunning: false, tickCount: 0 };

    const sim = JSON.parse(data);
    return { isRunning: sim.isRunning, tickCount: sim.tickCount };
};

// Helper logic functions (internal to worker)
const evaluateFailures = (simulation) => {
    Object.keys(simulation.nodesState).forEach(nodeId => {
        const node = simulation.nodesState[nodeId];
        if (node.resourceValue <= node.failureThreshold && !node.failed) {
            node.failed = true;
            simulation.newlyFailed.push(nodeId);
        }
    });
};

const propagateFailures = (simulation) => {
    if (simulation.newlyFailed.length === 0) return;

    const queue = simulation.newlyFailed.map(id => ({ id, depth: 0 }));
    const visited = new Set([...simulation.newlyFailed]);
    let maxDepth = 0;

    simulation.newlyFailed = [];

    while (queue.length > 0) {
        const { id: uId, depth } = queue.shift();
        maxDepth = Math.max(maxDepth, depth);

        const neighbors = simulation.adjacencyList[uId] || [];
        neighbors.forEach(neighbor => {
            const vId = neighbor.targetId;
            const neighborNode = simulation.nodesState[vId];

            if (neighborNode && !neighborNode.failed) {
                neighborNode.resourceValue -= neighbor.weight;
                if (neighborNode.resourceValue <= neighborNode.failureThreshold) {
                    neighborNode.failed = true;
                    if (!visited.has(vId)) {
                        visited.add(vId);
                        queue.push({ id: vId, depth: depth + 1 });
                    }
                }
            }
        });
    }

    simulation.analytics.cascadeDepth = Math.max(simulation.analytics.cascadeDepth, maxDepth);
};

const calculateAnalytics = (simulation) => {
    const totalNodes = Object.keys(simulation.nodesState).length;
    const nodesArray = Object.entries(simulation.nodesState);
    const failedNodesCount = nodesArray.filter(([_, n]) => n.failed).length;

    simulation.analytics.failedPercentage = totalNodes === 0 ? 0 : (failedNodesCount / totalNodes) * 100;
    simulation.analytics.systemHealthScore = Math.max(0, 100 - simulation.analytics.failedPercentage);
    simulation.analytics.failedNodeIds = nodesArray.filter(([_, n]) => n.failed).map(([id, _]) => id);

    let mostImpacted = null;
    let maxImpact = -Infinity;

    nodesArray.forEach(([id, node]) => {
        const impact = (node.maxCapacity || 100) - node.resourceValue;
        if (impact > maxImpact) {
            maxImpact = impact;
            mostImpacted = { nodeId: id, name: node.name, impactValue: impact };
        }
    });
    simulation.analytics.mostImpactedNode = mostImpacted;
};

module.exports = {
    startSimulation,
    stopSimulation,
    getSimulationStatus,
    processSimulationTick
};
