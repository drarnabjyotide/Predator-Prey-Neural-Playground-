export type Vector2D = {
    x: number;
    y: number;
};

export type Obstacle = {
    position: Vector2D;
    radius: number;
};

export enum AgentType {
    PREY = 'prey',
    PREDATOR = 'predator',
}

export enum Action {
    TURN_LEFT,
    TURN_RIGHT,
    MOVE_FORWARD,
}

export type SignalType = 'danger' | 'food' | null;

export type SensorReading = {
    angle: number;
    distance: number;
    activation: number;
};

export type PreySensorReading = SensorReading & {
    signal: SignalType;
};

export type NeuralState = {
    bvcActivations: number[]; // Boundary Vector Cells
    headingActivations: number[];
    predatorSensor: SensorReading;
    preySensors: PreySensorReading[];
    foodSensors: SensorReading[];
    obstacleSensors: SensorReading[];
};

export type Agent = {
    id: string;
    type: AgentType;
    position: Vector2D;
    velocity: Vector2D;
    angle: number; // in radians
    speed: number;
    turnSpeed: number;
    radius: number;
    color: string;
    isAlive: boolean;
    wallPressure: number;
    neuralState: NeuralState;
    // Communication
    signal: SignalType;
    signalCooldown: number;
    // Reinforcement Learning state
    qTable: Map<string, number[]>;
    eligibilityTraces: Map<string, number[]>;
    lastStateKey: string | null;
    lastAction: Action | null;
};

export type SimulationState = {
    agents: Agent[];
    food: Vector2D[];
    obstacles: Obstacle[];
};

export type Stats = {
    time: number;
    preyCaught: number;
    foodEaten: number;
    generation: number;
};
