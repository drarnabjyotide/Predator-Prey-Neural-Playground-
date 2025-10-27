import { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent, SimulationState, Stats, Vector2D } from '../types';
import { AgentType, Action } from '../types';
import {
    ARENA_WIDTH, ARENA_HEIGHT, PREY_COUNT, PREDATOR_COUNT, PREY_RADIUS, PREDATOR_RADIUS, PREY_SPEED, PREDATOR_SPEED,
    PREY_TURN_SPEED, PREDATOR_TURN_SPEED, FOOD_COUNT, FOOD_RADIUS, SENSOR_RANGE, BVC_NEURONS, HEADING_NEURONS, ACTIONS,
    RL_ALPHA, RL_GAMMA, RL_LAMBDA, RL_EPSILON, REWARD_FOOD, PENALTY_BEING_CAUGHT, REWARD_CATCH_PREY, 
    PENALTY_PREDATOR_PROXIMITY_FACTOR, REWARD_PREY_PROXIMITY_FACTOR, MAX_WALL_PRESSURE, ANTI_THIGMOTAXIS_STRENGTH, RESET_INTERVAL_MS,
    SIGNAL_DURATION, DANGER_SIGNAL_RADIUS, REWARD_FOLLOW_FOOD_SIGNAL, PENALTY_NEAR_DANGER_SIGNAL, OBSTACLES, PENALTY_OBSTACLE_COLLISION
} from '../constants';
import { V } from '../utils/vector';

const createInitialState = (): SimulationState => {
    const agents: Agent[] = [];
    const createAgentTemplate = (type: AgentType, index: number) => ({
        velocity: { x: 0, y: 0 },
        angle: Math.random() * Math.PI * 2,
        isAlive: true,
        wallPressure: 0,
        neuralState: {
            bvcActivations: Array(BVC_NEURONS).fill(0),
            headingActivations: Array(HEADING_NEURONS).fill(0),
            predatorSensor: { angle: 0, distance: Infinity, activation: 0 },
            preySensors: [],
            foodSensors: [],
            obstacleSensors: [],
        },
        signal: null,
        signalCooldown: 0,
        qTable: new Map(),
        eligibilityTraces: new Map(),
        lastStateKey: null,
        lastAction: null,
    });
    
    for (let i = 0; i < PREDATOR_COUNT; i++) {
        agents.push({
            ...createAgentTemplate(AgentType.PREDATOR, i),
            id: `predator-${i}`,
            type: AgentType.PREDATOR,
            position: { x: ARENA_WIDTH / 4, y: ARENA_HEIGHT / 2 },
            speed: PREDATOR_SPEED,
            turnSpeed: PREDATOR_TURN_SPEED,
            radius: PREDATOR_RADIUS,
            color: '#f87171', // red-400
        });
    }
    for (let i = 0; i < PREY_COUNT; i++) {
        agents.push({
            ...createAgentTemplate(AgentType.PREY, i),
            id: `prey-${i}`,
            type: AgentType.PREY,
            position: { x: ARENA_WIDTH * 3 / 4, y: ARENA_HEIGHT / 2 + (i - 1.5) * 50 },
            speed: PREY_SPEED,
            turnSpeed: PREY_TURN_SPEED,
            radius: PREY_RADIUS,
            color: '#67e8f9', // cyan-300
        });
    }

    const food: Vector2D[] = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
        food.push({
            x: Math.random() * (ARENA_WIDTH - 20) + 10,
            y: Math.random() * (ARENA_HEIGHT - 20) + 10,
        });
    }

    return { agents, food, obstacles: OBSTACLES };
};

export const useSimulation = () => {
    const [simulationState, setSimulationState] = useState<SimulationState>(createInitialState);
    const [stats, setStats] = useState<Stats>({ time: 0, preyCaught: 0, foodEaten: 0, generation: 1 });
    const [isRunning, setIsRunning] = useState<boolean>(true);
    const simulationStateRef = useRef(simulationState);
    simulationStateRef.current = simulationState;
    const qTablesRef = useRef<Map<string, Map<string, number[]>>>(new Map());

    const resetSimulation = useCallback((fullReset = true) => {
        if(fullReset) {
            qTablesRef.current.clear();
            setStats({ time: 0, preyCaught: 0, foodEaten: 0, generation: 1 });
        } else {
            setStats(prev => ({...prev, generation: prev.generation + 1, time: 0, foodEaten: 0, preyCaught: 0}));
        }

        const newState = createInitialState();
        newState.agents.forEach(agent => {
            if (qTablesRef.current.has(agent.id)) {
                agent.qTable = qTablesRef.current.get(agent.id)!;
                agent.eligibilityTraces = new Map();
            } else {
                qTablesRef.current.set(agent.id, agent.qTable);
            }
        });
        setSimulationState(newState);
    }, []);
    
    useEffect(() => {
        const timer = setInterval(() => {
            if (isRunning) {
                setStats(prev => {
                    if (prev.time > RESET_INTERVAL_MS / 1000) {
                        resetSimulation(false);
                        return prev;
                    }
                    return {...prev, time: prev.time + 0.1};
                });
            }
        }, 100);
        return () => clearInterval(timer);
    }, [isRunning, resetSimulation]);


    const updateSimulation = useCallback(() => {
        const { agents, food, obstacles } = simulationStateRef.current;
        const newAgents: Agent[] = JSON.parse(JSON.stringify(agents));
        agents.forEach((originalAgent, index) => {
            const newAgent = newAgents[index];
            if (newAgent) {
                newAgent.qTable = originalAgent.qTable;
                newAgent.eligibilityTraces = originalAgent.eligibilityTraces;
            }
        });
        
        let newFood = [...food];

        const allPrey = newAgents.filter(a => a.type === AgentType.PREY);
        const livingPrey = allPrey.filter(a => a.isAlive);
        const predator = newAgents.find(a => a.type === AgentType.PREDATOR);
        
        newAgents.forEach(agent => {
            if (!agent.isAlive) return;
            
            agent.signalCooldown = Math.max(0, agent.signalCooldown - 1);
            if (agent.signalCooldown === 0) agent.signal = null;

            // 1. SENSING
            // BVCs (Walls)
            for (let i = 0; i < BVC_NEURONS; i++) {
                const angle = (i / BVC_NEURONS) * 2 * Math.PI;
                const rayDir = V.fromAngle(agent.angle + angle);
                let dist = Infinity;
                if (rayDir.x !== 0) {
                    const t_x0 = (0 - agent.position.x) / rayDir.x;
                    const t_x1 = (ARENA_WIDTH - agent.position.x) / rayDir.x;
                    if(t_x0 > 0) dist = Math.min(dist, t_x0);
                    if(t_x1 > 0) dist = Math.min(dist, t_x1);
                }
                if (rayDir.y !== 0) {
                    const t_y0 = (0 - agent.position.y) / rayDir.y;
                    const t_y1 = (ARENA_HEIGHT - agent.position.y) / rayDir.y;
                     if(t_y0 > 0) dist = Math.min(dist, t_y0);
                    if(t_y1 > 0) dist = Math.min(dist, t_y1);
                }
                agent.neuralState.bvcActivations[i] = Math.exp(-dist / SENSOR_RANGE);
            }

            // Heading
            for(let i=0; i < HEADING_NEURONS; i++) {
                const targetAngle = (i / HEADING_NEURONS) * 2 * Math.PI;
                let angleDiff = Math.abs(targetAngle - (agent.angle % (2 * Math.PI)));
                angleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
                agent.neuralState.headingActivations[i] = Math.exp(- (angleDiff * angleDiff) * 5);
            }
            
            const createSensorReading = (targetPos: Vector2D) => {
                const dist = V.distance(agent.position, targetPos);
                const angle = V.angle(V.sub(targetPos, agent.position)) - agent.angle;
                const activation = dist < SENSOR_RANGE ? 1 - dist / SENSOR_RANGE : 0;
                return { angle, distance: dist, activation };
            };

            // Obstacles
            agent.neuralState.obstacleSensors = obstacles.map(obs => createSensorReading(obs.position))
                .sort((a,b) => a.distance - b.distance).slice(0, 3);

            if (agent.type === AgentType.PREY) {
                if(predator){
                    agent.neuralState.predatorSensor = createSensorReading(predator.position);
                }
                agent.neuralState.foodSensors = newFood.map(f => createSensorReading(f))
                    .sort((a,b) => a.distance - b.distance).slice(0, 3);
                
                agent.neuralState.preySensors = livingPrey.filter(p => p.id !== agent.id).map(p => ({
                    ...createSensorReading(p.position), signal: p.signal
                })).sort((a,b) => a.distance - b.distance).slice(0, 2);

            } else { // PREDATOR
                agent.neuralState.preySensors = livingPrey.map(p => ({
                    ...createSensorReading(p.position), signal: p.signal
                })).sort((a,b) => a.distance - b.distance).slice(0, 3);
            }

            // 2. STATE & ACTION
            const stateKey = createStateKey(agent);
            const qValues = agent.qTable.get(stateKey) || Array(ACTIONS).fill(0);
            if(!agent.qTable.has(stateKey)) agent.qTable.set(stateKey, qValues);

            const action = chooseAction(qValues);

            // 3. REINFORCEMENT LEARNING UPDATE
            let reward = 0;
            if(agent.type === AgentType.PREY) {
                 if (predator) reward += agent.neuralState.predatorSensor.distance * PENALTY_PREDATOR_PROXIMITY_FACTOR;
                 const nearestSignal = agent.neuralState.preySensors.find(p => p.signal !== null && p.distance < SENSOR_RANGE);
                 if (nearestSignal) {
                     if (nearestSignal.signal === 'danger') reward += PENALTY_NEAR_DANGER_SIGNAL;
                     else if (nearestSignal.signal === 'food') reward += REWARD_FOLLOW_FOOD_SIGNAL;
                 }
            } else if (agent.type === AgentType.PREDATOR && agent.neuralState.preySensors.length > 0) {
                const nearestPrey = agent.neuralState.preySensors[0];
                if(nearestPrey) reward += (SENSOR_RANGE - nearestPrey.distance) * REWARD_PREY_PROXIMITY_FACTOR;
            }
            updateRL(agent, stateKey, qValues, action, reward);

            // 4. MOVEMENT
            switch (action) {
                case Action.TURN_LEFT: agent.angle -= agent.turnSpeed; break;
                case Action.TURN_RIGHT: agent.angle += agent.turnSpeed; break;
                case Action.MOVE_FORWARD:
                    agent.velocity = V.add(agent.velocity, V.fromAngle(agent.angle, agent.speed));
                    break;
            }
            agent.velocity = V.limit(agent.velocity, agent.speed);
            agent.position = V.add(agent.position, agent.velocity);
            agent.velocity = V.mult(agent.velocity, 0.9); // friction

            // 5. REFLEXES and DRIVES
            // Wall avoidance
            if (agent.position.x < agent.radius) { agent.position.x = agent.radius; agent.velocity.x *= -1; }
            if (agent.position.x > ARENA_WIDTH - agent.radius) { agent.position.x = ARENA_WIDTH - agent.radius; agent.velocity.x *= -1; }
            if (agent.position.y < agent.radius) { agent.position.y = agent.radius; agent.velocity.y *= -1; }
            if (agent.position.y > ARENA_HEIGHT - agent.radius) { agent.position.y = ARENA_HEIGHT - agent.radius; agent.velocity.y *= -1; }

            // Obstacle collision
            obstacles.forEach(obs => {
                const dist = V.distance(agent.position, obs.position);
                if (dist < agent.radius + obs.radius) {
                    const overlap = agent.radius + obs.radius - dist;
                    const normal = V.normalize(V.sub(agent.position, obs.position));
                    agent.position = V.add(agent.position, V.mult(normal, overlap));
                    // Reflect velocity
                    const dot = V.dot(agent.velocity, normal);
                    agent.velocity = V.sub(agent.velocity, V.mult(normal, 2 * dot));
                    updateRLonEvent(agent, PENALTY_OBSTACLE_COLLISION);
                }
            });

            // Anti-thigmotaxis (drive)
            const isNearWall = agent.position.x < 50 || agent.position.x > ARENA_WIDTH - 50 || agent.position.y < 50 || agent.position.y > ARENA_HEIGHT - 50;
            if(isNearWall) agent.wallPressure = Math.min(MAX_WALL_PRESSURE, agent.wallPressure + 1);
            else agent.wallPressure = Math.max(0, agent.wallPressure - 0.5);
            
            if(agent.wallPressure > 0){
                const toCenter = V.sub(V.create(ARENA_WIDTH/2, ARENA_HEIGHT/2), agent.position);
                const pressureForce = V.mult(V.normalize(toCenter), agent.wallPressure * ANTI_THIGMOTAXIS_STRENGTH);
                agent.position = V.add(agent.position, pressureForce);
            }
        });

        // 6. INTERACTIONS
        livingPrey.forEach(p => {
            if(predator) {
                const distToPredator = V.distance(p.position, predator.position);
                if(distToPredator < p.radius + predator.radius) {
                    p.isAlive = false;
                    setStats(s => ({...s, preyCaught: s.preyCaught + 1}));
                    updateRLonEvent(p, PENALTY_BEING_CAUGHT);
                    updateRLonEvent(predator, REWARD_CATCH_PREY);
                }
                else if (distToPredator < DANGER_SIGNAL_RADIUS) {
                    p.signal = 'danger';
                    p.signalCooldown = SIGNAL_DURATION;
                }
            }
            newFood = newFood.filter(f => {
                if(V.distance(p.position, f) < p.radius + FOOD_RADIUS) {
                    setStats(s => ({...s, foodEaten: s.foodEaten + 1}));
                    updateRLonEvent(p, REWARD_FOOD);
                    p.signal = 'food';
                    p.signalCooldown = SIGNAL_DURATION;
                    return false;
                }
                return true;
            });
        });
        
        while(newFood.length < FOOD_COUNT) {
            newFood.push({ x: Math.random() * (ARENA_WIDTH - 20) + 10, y: Math.random() * (ARENA_HEIGHT - 20) + 10 });
        }

        setSimulationState({ agents: newAgents, food: newFood, obstacles });

    }, []);
    
     const updateRL = (agent: Agent, stateKey: string, qValues: number[], action: Action, reward: number) => {
        if(agent.lastStateKey && agent.lastAction !== null) {
            const lastQValues = agent.qTable.get(agent.lastStateKey) || Array(ACTIONS).fill(0);
            const lastQ = lastQValues[agent.lastAction];
            const maxCurrentQ = Math.max(...qValues);
            const tdError = reward + RL_GAMMA * maxCurrentQ - lastQ;
            
            // Update eligibility traces
            agent.eligibilityTraces.forEach((trace, key) => {
                 for(let i=0; i<trace.length; i++) trace[i] *= RL_GAMMA * RL_LAMBDA;
                 agent.eligibilityTraces.set(key, trace);
            });
            const currentTrace = agent.eligibilityTraces.get(agent.lastStateKey) || Array(ACTIONS).fill(0);
            currentTrace[agent.lastAction] += 1;
            agent.eligibilityTraces.set(agent.lastStateKey, currentTrace);

            // Update all Q-values based on traces
            agent.qTable.forEach((qVals, sKey) => {
                const traces = agent.eligibilityTraces.get(sKey);
                if (traces) {
                    const newQVals = qVals.map((q, aIndex) => q + RL_ALPHA * tdError * traces[aIndex]);
                    agent.qTable.set(sKey, newQVals);
                }
            });
        }
        agent.lastStateKey = stateKey;
        agent.lastAction = action;
    };
    
    const updateRLonEvent = (agent: Agent, reward: number) => {
        if(!agent.lastStateKey || agent.lastAction === null) return;
        const lastQValues = agent.qTable.get(agent.lastStateKey) || Array(ACTIONS).fill(0);
        const lastQ = lastQValues[agent.lastAction];
        const tdError = reward - lastQ; // No future state, so maxQ is 0
        lastQValues[agent.lastAction] += RL_ALPHA * tdError;
        agent.qTable.set(agent.lastStateKey, lastQValues);
    };

    const createSensorKey = (sensor: {activation: number, angle: number} | undefined) => {
        if (!sensor || sensor.activation <= 0) return '00';
        const act = Math.round(sensor.activation * 4);
        const ang = Math.round((sensor.angle / (2 * Math.PI)) * 8 + 8) % 8;
        return `${act}${ang}`;
    };

    const createStateKey = (agent: Agent): string => {
        const { predatorSensor, preySensors, foodSensors, obstacleSensors, bvcActivations } = agent.neuralState;
        
        const bvcKey = bvcActivations.map(a => Math.round(a * 4)).join('');

        if(agent.type === AgentType.PREY) {
            const predKey = createSensorKey(predatorSensor);
            const foodKey = createSensorKey(foodSensors[0]);
            const obsKey = createSensorKey(obstacleSensors[0]);
            
            const nearestSignal = preySensors.find(p => p.signal !== null && p.activation > 0);
            let signalKey = '00';
            if (nearestSignal) {
                const signalType = nearestSignal.signal === 'danger' ? '1' : '2';
                const signalAngle = Math.round((nearestSignal.angle / (2 * Math.PI)) * 8 + 8) % 8;
                signalKey = `${signalType}${signalAngle}`;
            }

            return `P:${predKey}-F:${foodKey}-O:${obsKey}-S:${signalKey}-B:${bvcKey}`;
        } else { // PREDATOR
            const preyKey = createSensorKey(preySensors[0]);
            const obsKey = createSensorKey(obstacleSensors[0]);
            return `p:${preyKey}-O:${obsKey}-B:${bvcKey}`;
        }
    }

    const chooseAction = (qValues: number[]): Action => {
        const expValues = qValues.map(q => Math.exp(q / RL_EPSILON));
        const sumExpValues = expValues.reduce((a, b) => a + b, 0);
        if (sumExpValues === 0) return Math.floor(Math.random() * ACTIONS) as Action;
        const probs = expValues.map(e => e / sumExpValues);

        const rand = Math.random();
        let cumulativeProb = 0;
        for (let i = 0; i < probs.length; i++) {
            cumulativeProb += probs[i];
            if (rand < cumulativeProb) return i as Action;
        }
        return (probs.length - 1) as Action;
    };

    useEffect(() => {
        if (!isRunning) return;
        let animationFrameId: number;
        const gameLoop = () => {
            updateSimulation();
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isRunning, updateSimulation]);

    const togglePause = () => setIsRunning(prev => !prev);

    return { simulationState, isRunning, stats, togglePause, resetSimulation };
};
