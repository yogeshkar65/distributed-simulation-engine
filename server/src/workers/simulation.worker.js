const { Worker } = require("bullmq");
const { getRedis } = require("../config/redis");
const { processSimulationTick } = require("../modules/simulation/simulation.engine");

let worker;

const initSimulationWorker = () => {
    if (worker) return worker;

    const { connection } = require("../config/redis");

    worker = new Worker(
        "simulationQueue",
        async (job) => {
            const { projectId } = job.data;

            try {
                await processSimulationTick(projectId);
            } catch (err) {
                console.error(`[Worker] Tick failed for ${projectId}:`, err.message);
                throw err; // Required for retry logic
            }
        },
        {
            connection,
            concurrency: 50,
            lockDuration: 30000,       // 30 seconds lock safety
            stalledInterval: 30000,    // detect stalled jobs
            autorun: true
        }
    );

    worker.on("completed", (job) => {
        // Optional logging
        // console.log(`[Worker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    worker.on("error", (err) => {
        console.error("❌ Worker error:", err);
    });

    console.log("✅ Simulation Worker started");

    return worker;
};

module.exports = { initSimulationWorker };
