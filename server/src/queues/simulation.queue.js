const { Queue } = require("bullmq");
const { getRedis } = require("../config/redis");

let simulationQueue;

const initSimulationQueue = () => {
    if (simulationQueue) return simulationQueue;

    const { connection } = require("../config/redis");

    // Note: In BullMQ 5+, QueueScheduler functionality is integrated into Queue and Worker.
    // Separate QueueScheduler instance is no longer required or exported.
    simulationQueue = new Queue("simulationQueue", {
        connection,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 1000,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        }
    });

    console.log("✅ Simulation Queue initialized (BullMQ 5 optimized)");

    return simulationQueue;
};

const getSimulationQueue = () => {
    if (!simulationQueue) {
        return initSimulationQueue();
    }
    return simulationQueue;
};

module.exports = {
    initSimulationQueue,
    getSimulationQueue
};
