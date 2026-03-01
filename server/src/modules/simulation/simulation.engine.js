const Node = require("../graph/node.model");
const Edge = require("../graph/edge.model");
const SimulationHistory = require("../simulationHistory/simulationHistory.model");
const { getRedis } = require("../../config/redis");
const { getIO } = require("../../config/socket");
const { getSimulationQueue } = require("../../queues/simulation.queue");

/* ======================================================
   START SIMULATION
====================================================== */

const startSimulation = async (projectId, mode = "deterministic") => {
    const redis = getRedis();
    const lockKey = `lock:simulation:${projectId}`;
    const stateKey = `simulation:${projectId}`;

    const acquired = await redis.set(lockKey, "true", "NX", "EX", 10);
    if (!acquired) {
        throw new Error("Simulation already running");
    }

    const nodes = await Node.find({ projectId });
    const edges = await Edge.find({ projectId });

    const nodesState = {};
    const adjacencyList = {};

    nodes.forEach(node => {
        const id = node._id.toString();
        nodesState[id] = {
            name: node.name,
            resourceValue: node.resourceValue,
            maxCapacity: node.maxCapacity,
            failureThreshold: node.failureThreshold,
            failed: false
        };
        adjacencyList[id] = [];
    });

    edges.forEach(edge => {
        const source = edge.sourceNodeId.toString();
        adjacencyList[source]?.push({
            targetId: edge.targetNodeId.toString(),
            weight: edge.weight
        });
    });

    const simulation = {
        projectId,
        tickCount: 0,
        version: 0,
        isRunning: true,
        mode,
        nodesState,
        adjacencyList,
        newlyFailed: [],
        analytics: {
            failedPercentage: 0,
            cascadeDepth: 0,
            systemHealthScore: 100,
            mostImpactedNode: null,
            failedNodeIds: [],
            mode,
            initialFailureNode: null
        }
    };

    /* ---------- CHAOS MODE ---------- */
    if (mode === "chaos") {
        const candidates = nodes.filter(
            n => n.resourceValue > n.failureThreshold
        );

        if (candidates.length > 0) {
            const selected = candidates[Math.floor(Math.random() * candidates.length)];
            const selectedId = selected._id.toString();

            simulation.nodesState[selectedId].resourceValue = 0;
            simulation.nodesState[selectedId].failed = true;
            simulation.newlyFailed.push(selectedId);

            simulation.analytics.initialFailureNode = {
                id: selectedId,
                name: selected.name
            };
        }
    }

    calculateAnalytics(simulation);

    await redis.set(stateKey, JSON.stringify(simulation));

    const queue = getSimulationQueue();
    await queue.add(`tick_${projectId}`, { projectId }, { jobId: `tick_${projectId}` });

    return simulation;
};

/* ======================================================
   PROCESS TICK
====================================================== */

const processSimulationTick = async (projectId) => {
    const redis = getRedis();
    const stateKey = `simulation:${projectId}`;
    const lockKey = `lock:simulation:${projectId}`;

    const isLocked = await redis.get(lockKey);
    if (!isLocked) return;

    await redis.expire(lockKey, 15);

    const data = await redis.get(stateKey);
    if (!data) return;

    const simulation = JSON.parse(data);
    if (!simulation.isRunning) return;

    evaluateFailures(simulation);
    const cascadeOccurred = propagateFailures(simulation);
    calculateAnalytics(simulation);

    /* -------- STOP CONDITION -------- */
    if (!cascadeOccurred) {
        simulation.isRunning = false;
    }

    simulation.tickCount += 1;
    simulation.version += 1;

    await redis.set(stateKey, JSON.stringify(simulation));

    const io = getIO();
    io.to(`project_${projectId}`).emit("simulation_update", {
        tickCount: simulation.tickCount,
        nodesState: simulation.nodesState,
        analytics: simulation.analytics,
        isRunning: simulation.isRunning
    });

    /* -------- SAVE SNAPSHOT -------- */
    await SimulationHistory.create({
        projectId,
        tick: simulation.tickCount,
        mode: simulation.mode,
        nodesState: simulation.nodesState,
        analytics: simulation.analytics
    });

    /* -------- NEXT TICK -------- */
    if (simulation.isRunning) {
        const queue = getSimulationQueue();
        await queue.add(
            `tick_${projectId}`,
            { projectId },
            { jobId: `tick_${projectId}`, delay: 1000 }
        );
    }
};

/* ======================================================
   STOP SIMULATION
====================================================== */

const stopSimulation = async (projectId) => {
    const redis = getRedis();
    await redis.del(`simulation:${projectId}`);
    await redis.del(`lock:simulation:${projectId}`);

    const queue = getSimulationQueue();
    const job = await queue.getJob(`tick_${projectId}`);
    if (job) await job.remove();
};

/* ======================================================
   STATUS
====================================================== */

const getSimulationStatus = async (projectId) => {
    const redis = getRedis();
    const data = await redis.get(`simulation:${projectId}`);
    if (!data) return { isRunning: false, tickCount: 0 };

    const sim = JSON.parse(data);
    return {
        isRunning: sim.isRunning,
        tickCount: sim.tickCount
    };
};

/* ======================================================
   INTERNAL LOGIC
====================================================== */

const evaluateFailures = (simulation) => {
    Object.entries(simulation.nodesState).forEach(([id, node]) => {
        if (!node.failed && node.resourceValue <= node.failureThreshold) {
            node.failed = true;
            simulation.newlyFailed.push(id);
        }
    });
};

const propagateFailures = (simulation) => {
    if (simulation.newlyFailed.length === 0) return false;

    const queue = [...simulation.newlyFailed];
    simulation.newlyFailed = [];

    let cascadeOccurred = false;

    while (queue.length > 0) {
        const uId = queue.shift();
        const neighbors = simulation.adjacencyList[uId] || [];

        neighbors.forEach(neighbor => {
            const vId = neighbor.targetId;
            const node = simulation.nodesState[vId];

            if (node && !node.failed) {
                node.resourceValue -= neighbor.weight;

                if (node.resourceValue <= node.failureThreshold) {
                    node.failed = true;
                    queue.push(vId);
                    cascadeOccurred = true;
                }
            }
        });
    }

    if (cascadeOccurred) {
        simulation.analytics.cascadeDepth += 1;
    }

    return cascadeOccurred;
};

const calculateAnalytics = (simulation) => {
    const nodes = Object.entries(simulation.nodesState);
    const total = nodes.length;
    const failed = nodes.filter(([_, n]) => n.failed).length;

    simulation.analytics.failedPercentage =
        total === 0 ? 0 : (failed / total) * 100;

    simulation.analytics.systemHealthScore =
        Math.max(0, 100 - simulation.analytics.failedPercentage);

    simulation.analytics.failedNodeIds =
        nodes.filter(([_, n]) => n.failed).map(([id]) => id);

    let maxImpact = -Infinity;
    let impacted = null;

    nodes.forEach(([id, node]) => {
        const impact = node.maxCapacity - node.resourceValue;
        if (impact > maxImpact) {
            maxImpact = impact;
            impacted = {
                nodeId: id,
                name: node.name,
                impactValue: impact
            };
        }
    });

    simulation.analytics.mostImpactedNode = impacted;
};

module.exports = {
    startSimulation,
    processSimulationTick,
    stopSimulation,
    getSimulationStatus
};