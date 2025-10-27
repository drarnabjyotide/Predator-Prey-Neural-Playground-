import React from 'react';
import type { Agent } from '../types';

interface NeuralVizProps {
    agent: Agent;
}

const NeuronRing: React.FC<{ activations: number[], label: string, size: number }> = ({ activations, label, size }) => {
    const radius = size / 2 - 10;
    const center = size / 2;

    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                {activations.map((activation, i) => {
                    const angle = (i / activations.length) * 2 * Math.PI - Math.PI / 2;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    const glowClass = activation > 0.8 ? 'neuron-glow-high' : activation > 0.4 ? 'neuron-glow-medium' : '';

                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={3}
                            fill={`rgba(250, 204, 21, ${activation})`} // yellow-400
                            className={glowClass}
                        />
                    );
                })}
            </svg>
            <p className="text-xs text-gray-400 -mt-2">{label}</p>
        </div>
    );
};

const SensoryInputDisplay: React.FC<{ agent: Agent; size: number }> = ({ agent, size }) => {
    const center = size / 2;
    const displayRadius = size / 2 - 15;
    const { predatorSensor, preySensors, foodSensors, obstacleSensors } = agent.neuralState;

    const getIndicatorPosition = (angle: number, activation: number) => {
        const renderAngle = angle - Math.PI / 2;
        const x = center + Math.cos(renderAngle) * displayRadius;
        const y = center + Math.sin(renderAngle) * displayRadius;
        const scale = 0.6 + activation * 0.7;
        return { x, y, scale, angle: angle * 180 / Math.PI };
    };

    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={center} cy={center} r={displayRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <circle cx={center} cy={center} r={displayRadius * 0.66} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <circle cx={center} cy={center} r={displayRadius * 0.33} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                <polygon
                    points={`${center},${center - 6} ${center - 5},${center + 4} ${center + 5},${center + 4}`}
                    fill={agent.color}
                />
                
                {obstacleSensors?.map((s, i) => {
                    if (s.activation <= 0.05) return null;
                    const { x, y, scale } = getIndicatorPosition(s.angle, s.activation);
                    return (
                        <rect
                            key={`obs-${i}`}
                            x={x - 4} y={y - 4} width={8} height={8}
                            fill="#a855f7" // purple-600
                            opacity={0.5 + s.activation * 0.5}
                            style={{
                                transform: `scale(${scale})`,
                                transformOrigin: `${x}px ${y}px`,
                                transition: 'transform 0.15s ease-out, opacity 0.15s ease-out'
                            }}
                        />
                    );
                })}

                {foodSensors?.map((s, i) => {
                     if (s.activation <= 0.05) return null;
                    const { x, y, scale } = getIndicatorPosition(s.angle, s.activation);
                    return (
                       <circle
                            key={`food-${i}`}
                            cx={x} cy={y} r={4}
                            fill="#facc15"
                            opacity={0.6 + s.activation * 0.4}
                            style={{
                                filter: `drop-shadow(0 0 3px #facc15)`, 
                                transform: `scale(${scale})`,
                                transformOrigin: `${x}px ${y}px`,
                                transition: 'transform 0.15s ease-out, opacity 0.15s ease-out'
                            }}
                        />
                    );
                })}

                {preySensors?.map((s, i) => {
                    if (s.activation <= 0.05) return null;
                    const { x, y, scale } = getIndicatorPosition(s.angle, s.activation);
                    return (
                        <g key={`prey-${i}`} style={{
                            transform: `scale(${scale})`,
                            transformOrigin: `${x}px ${y}px`,
                            transition: 'transform 0.15s ease-out'
                        }}>
                            {s.signal && (
                                <circle 
                                    cx={x} cy={y}
                                    fill="none"
                                    stroke={s.signal === 'danger' ? '#f87171' : '#facc15'}
                                    strokeWidth="2"
                                    className="animate-pulse-signal"
                                />
                            )}
                            <circle
                                cx={x} cy={y} r={4}
                                fill="#67e8f9" // cyan-300
                                opacity={0.6 + s.activation * 0.4}
                            />
                        </g>
                    );
                })}
                
                {agent.type === 'prey' && predatorSensor.activation > 0.05 && (() => {
                    const { x, y, scale, angle } = getIndicatorPosition(predatorSensor.angle, predatorSensor.activation);
                    return (
                       <path
                            d="M-5,5 L0,-5 L5,5 Z"
                            fill="#ef4444"
                            className="animate-pulse-danger"
                            style={{
                                filter: `drop-shadow(0 0 4px #ef4444)`,
                                transform: `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scale})`,
                                transition: 'transform 0.15s ease-out'
                            }}
                        />
                    );
                })()}

            </svg>
            <p className="text-xs text-gray-400 -mt-2">Live Sensory Input</p>
        </div>
    );
};


const QValueViz: React.FC<{ agent: Agent }> = ({ agent }) => {
    const qValues = agent.lastStateKey ? (agent.qTable.get(agent.lastStateKey) || [0, 0, 0]) : [0, 0, 0];
    const actionNames = ['Left', 'Forward', 'Right'];

    const getActionIcon = (actionIndex: number) => {
        switch (actionIndex) {
            case 0: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5 5-5m6 10l-5-5 5-5" /></svg>;
            case 1: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" /></svg>;
            case 2: return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M7 7l5 5-5 5" /></svg>;
            default: return null;
        }
    };
    
    const minQ = Math.min(...qValues, -0.1);
    const maxQ = Math.max(...qValues, 0.1);

    const getBackgroundColor = (q: number) => {
        if (q > 0.01) return `rgba(16, 185, 129, ${Math.min(1, 0.1 + (q / maxQ) * 0.8)})`; // Green
        if (q < -0.01) return `rgba(239, 68, 68, ${Math.min(1, 0.1 + (q / minQ) * 0.8)})`; // Red
        return 'rgba(55, 65, 81, 0.5)'; // gray-700/50
    };

    return (
        <div className="w-full px-2">
            <div className="flex justify-between items-center space-x-2">
                {qValues.map((q, i) => {
                    const isSelected = agent.lastAction === i;
                    return (
                        <div 
                            key={i} 
                            className={`flex flex-col items-center justify-center p-2 rounded-lg w-1/3 h-24 transition-all duration-200 ${isSelected ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-500/30' : 'border border-gray-700'}`}
                            style={{ backgroundColor: getBackgroundColor(q) }}
                        >
                            {getActionIcon(i)}
                            <span className="text-xs font-semibold mt-1">{actionNames[i]}</span>
                            <span className="text-sm font-mono font-bold mt-1">{q.toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Action Q-Values (Decision Weights)</p>
        </div>
    );
};


export const NeuralViz: React.FC<NeuralVizProps> = React.memo(({ agent }) => {
    return (
        <div className="flex flex-col gap-3 items-center h-full">
            <div className="w-full text-center">
                <p className="text-md font-bold" style={{color: agent.color}}>{agent.id}</p>
                <p className="text-sm text-gray-400">{agent.isAlive ? 'Status: Active' : 'Status: Inactive'}</p>
            </div>
            
            <SensoryInputDisplay agent={agent} size={150} />
            <QValueViz agent={agent} />
            
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
                <NeuronRing activations={agent.neuralState.bvcActivations} label="Boundary" size={120} />
                <NeuronRing activations={agent.neuralState.headingActivations} label="Heading" size={120} />
            </div>
            
            <div className="text-xs w-full mt-auto text-gray-400 space-y-1 border-t border-gray-700/70 pt-2">
                 <p>Wall Pressure: <span className="text-yellow-300 font-mono">{agent.wallPressure.toFixed(1)}</span></p>
                 <p>Q-Table States: <span className="text-yellow-300 font-mono">{agent.qTable.size}</span></p>
            </div>
        </div>
    );
});