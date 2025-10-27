import type { Obstacle } from './types';

// Arena
export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 600;

// Obstacles
export const OBSTACLES: Obstacle[] = [
    { position: { x: 200, y: 150 }, radius: 40 },
    { position: { x: 600, y: 450 }, radius: 40 },
    { position: { x: 400, y: 300 }, radius: 50 },
    { position: { x: 250, y: 450 }, radius: 30 },
    { position: { x: 550, y: 150 }, radius: 30 },
];

// Agents
export const PREY_COUNT = 3;
export const PREDATOR_COUNT = 1;
export const PREY_RADIUS = 8;
export const PREDATOR_RADIUS = 12;
export const PREY_SPEED = 1.5;
export const PREDATOR_SPEED = 1.6;
export const PREY_TURN_SPEED = 0.1;
export const PREDATOR_TURN_SPEED = 0.08;

// Food
export const FOOD_COUNT = 15;
export const FOOD_RADIUS = 4;

// Physics
export const WALL_BOUNCE_FACTOR = -0.5;
export const ANTI_THIGMOTAXIS_STRENGTH = 0.005; // "edge pressure"
export const MAX_WALL_PRESSURE = 100;

// AI & Neural
export const SENSOR_RANGE = 150;
export const BVC_NEURONS = 36; // Boundary Vector Cells
export const HEADING_NEURONS = 36;
export const ACTIONS = 3; // Turn Left, Turn Right, Move Forward

// Social / Communication
export const SIGNAL_DURATION = 50; // ticks
export const DANGER_SIGNAL_RADIUS = 60;
export const REWARD_FOLLOW_FOOD_SIGNAL = 0.1;
export const PENALTY_NEAR_DANGER_SIGNAL = -0.2;


// Reinforcement Learning
export const RL_ALPHA = 0.1; // Learning rate
export const RL_GAMMA = 0.9; // Discount factor
export const RL_LAMBDA = 0.9; // Eligibility trace decay
export const RL_EPSILON = 0.1; // Exploration factor (softmax temperature)
export const REWARD_FOOD = 50;
export const REWARD_CATCH_PREY = 100;
export const PENALTY_BEING_CAUGHT = -100;
export const PENALTY_OBSTACLE_COLLISION = -5;
export const PENALTY_PREDATOR_PROXIMITY_FACTOR = -0.1;
export const REWARD_PREY_PROXIMITY_FACTOR = 0.05;

// Simulation
export const SIMULATION_SPEED = 1; // Multiplier for delta time
export const RESET_INTERVAL_MS = 30000; // Reset every 30 seconds
