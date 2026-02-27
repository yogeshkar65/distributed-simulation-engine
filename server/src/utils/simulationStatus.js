const SimulationStatus = Object.freeze({
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
});

const VALID_TRANSITIONS = {
    [SimulationStatus.IDLE]: [SimulationStatus.RUNNING],
    [SimulationStatus.RUNNING]: [SimulationStatus.PAUSED, SimulationStatus.COMPLETED, SimulationStatus.FAILED],
    [SimulationStatus.PAUSED]: [SimulationStatus.RUNNING, SimulationStatus.IDLE],
    [SimulationStatus.COMPLETED]: [SimulationStatus.IDLE],
    [SimulationStatus.FAILED]: [SimulationStatus.IDLE],
};

const isValidTransition = (from, to) => (VALID_TRANSITIONS[from] || []).includes(to);

module.exports = { SimulationStatus, isValidTransition, VALID_TRANSITIONS };
