/**
 * Deterministic Heuristic Engine for CascadeX
 * Uses graph theory and structural metrics to predict and explain failures.
 */

/**
 * Calculates a risk score for a single node based on topology and thresholds.
 */
const calculateNodeRisk = (node, edges) => {
    const outEdges = edges.filter(e => e.sourceNodeId.toString() === node._id.toString());
    const inEdges = edges.filter(e => e.targetNodeId.toString() === node._id.toString());

    const outDegree = outEdges.length;
    const inDegree = inEdges.length;
    const edgeWeightSum = outEdges.reduce((sum, e) => sum + e.weight, 0);

    const thresholdProximity = node.maxCapacity > 0 ? (node.failureThreshold / node.maxCapacity) * 10 : 0;

    // Algorithm: (outDegree * 2) + (inDegree * 1.5) + (edgeWeightSum / 10) + (thresholdProximity)
    const riskScore = (outDegree * 2) + (inDegree * 1.5) + (edgeWeightSum / 10) + thresholdProximity;

    return Math.min(Math.round(riskScore * 10) / 10, 100);
};

/**
 * Detects Single Points of Failure (SPOFs).
 * A node is critical if it has high out-degree or high load weight.
 */
const detectCriticalNodes = (nodes, edges) => {
    return nodes.filter(node => {
        const outEdges = edges.filter(e => e.sourceNodeId.toString() === node._id.toString());
        const totalWeight = outEdges.reduce((sum, e) => sum + e.weight, 0);

        // Critical if outDegree > 2 or high weight relative to average
        return outEdges.length > 2 || totalWeight > 50;
    }).map(n => ({ id: n._id, name: n.name, reason: "High dependency output" }));
};

/**
 * Computes maximum dependency depth using DFS.
 */
const findMaxDepth = (nodes, edges) => {
    const adj = {};
    nodes.forEach(n => adj[n._id.toString()] = []);
    edges.forEach(e => adj[e.sourceNodeId.toString()]?.push(e.targetNodeId.toString()));

    let maxDepth = 0;
    const visited = new Set();

    const dfs = (nodeId, depth) => {
        maxDepth = Math.max(maxDepth, depth);
        if (depth > nodes.length) return; // Cycle detection safety

        (adj[nodeId] || []).forEach(neighbor => {
            dfs(neighbor, depth + 1);
        });
    };

    nodes.forEach(node => {
        dfs(node._id.toString(), 1);
    });

    return maxDepth;
};

/**
 * Detects bottlenecks: high in-degree and low failure threshold.
 */
const detectBottlenecks = (nodes, edges) => {
    return nodes.filter(node => {
        const inEdges = edges.filter(e => e.targetNodeId.toString() === node._id.toString());
        const isFragile = node.failureThreshold < (node.maxCapacity * 0.3);
        return inEdges.length >= 2 && isFragile;
    }).map(n => ({ id: n._id, name: n.name, reason: "Critical convergence point" }));
};

/**
 * Main prediction logic for pre-simulation.
 */
const predictRisk = (nodes, edges) => {
    const nodeRisks = nodes.map(node => ({
        id: node._id,
        name: node.name,
        score: calculateNodeRisk(node, edges)
    }));

    const criticalNodes = detectCriticalNodes(nodes, edges);
    const maxDepth = findMaxDepth(nodes, edges);
    const bottlenecks = detectBottlenecks(nodes, edges);

    const avgScore = nodeRisks.length > 0
        ? nodeRisks.reduce((sum, r) => sum + r.score, 0) / nodeRisks.length
        : 0;

    // System risk classification
    let classification = "LOW";
    if (avgScore > 7 || maxDepth > 4) classification = "HIGH";
    else if (avgScore > 4 || maxDepth > 2) classification = "MEDIUM";

    return {
        nodeRisks,
        criticalNodes,
        bottlenecks,
        maxDependencyDepth: maxDepth,
        systemRiskScore: Math.round(avgScore * 10),
        classification
    };
};

/**
 * Post-simulation forensics.
 */
const analyzeSimulation = (nodes, edges, failedNodeIds, cascadeDepth) => {
    const failedNodesInfo = nodes.filter(n => failedNodeIds.includes(n._id.toString()));

    // Heuristic: The first failed node is likely the root cause if only one was primary
    const rootCause = failedNodesInfo[0]?.name || "Unknown";

    const structuralWeakness = cascadeDepth > 2
        ? "High cross-dependency prevents isolation of faults."
        : "System correctly isolated the failure to local clusters.";

    const recommendations = [];
    if (cascadeDepth > 3) recommendations.push("Introduce circuit breakers in primary dependency chains.");
    if (failedNodesInfo.length > nodes.length / 2) recommendations.push("Increase failure thresholds on critical hub nodes.");

    const bottlenecks = detectBottlenecks(nodes, edges);
    bottlenecks.forEach(b => {
        recommendations.push(`Add redundancy for ${b.name} to distribute convergence load.`);
    });

    return {
        summary: `Cascade reached depth ${cascadeDepth} affecting ${failedNodeIds.length} nodes.`,
        rootCause,
        cascadeDepth,
        structuralWeakness,
        riskLevel: cascadeDepth > 2 ? "HIGH" : "MEDIUM",
        recommendations
    };
};

module.exports = {
    predictRisk,
    analyzeSimulation
};
