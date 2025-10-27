import React from 'react';
import type { Agent, Vector2D, Obstacle } from '../types';
import { ARENA_WIDTH, ARENA_HEIGHT, FOOD_RADIUS } from '../constants';

interface ArenaProps {
    agents: Agent[];
    food: Vector2D[];
    obstacles: Obstacle[];
    onAgentClick: (id: string) => void;
    selectedAgentId: string | null;
}

const AgentShape: React.FC<{ agent: Agent; isSelected: boolean; onClick: () => void }> = ({ agent, isSelected, onClick }) => {
    const transform = `translate(${agent.position.x}, ${agent.position.y}) rotate(${agent.angle * 180 / Math.PI})`;
    const strokeColor = isSelected ? 'white' : agent.color;

    return (
        <g 
            transform={transform} 
            onClick={onClick} 
            className="cursor-pointer transition-opacity duration-300"
            style={{ opacity: agent.isAlive ? 1 : 0.2 }}
        >
            {agent.signal && agent.isAlive && (
                 <circle
                    r={agent.radius + 4}
                    fill="none"
                    stroke={agent.signal === 'danger' ? '#f87171' : '#facc15'}
                    strokeWidth="2"
                >
                    <animate
                        attributeName="stroke-opacity"
                        values="0.8;0.2;0.8"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                     <animate
                        attributeName="r"
                        values={`${agent.radius + 2};${agent.radius + 6};${agent.radius + 2}`}
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </circle>
            )}
            <circle 
                r={agent.radius} 
                fill={agent.color} 
                stroke={strokeColor} 
                strokeWidth={isSelected ? 2 : 1.5}
                className="transition-all"
            />
            {/* Pointer to indicate direction */}
            <polygon 
                points={`${agent.radius},0 ${agent.radius*0.5},-${agent.radius*0.5} ${agent.radius*0.5},${agent.radius*0.5}`}
                fill={isSelected ? 'white' : 'rgba(0,0,0,0.5)'}
            />
        </g>
    );
};


export const Arena: React.FC<ArenaProps> = React.memo(({ agents, food, obstacles, onAgentClick, selectedAgentId }) => {
    return (
        <svg
            viewBox={`0 0 ${ARENA_WIDTH} ${ARENA_HEIGHT}`}
            className="w-full h-full"
        >
            <rect width={ARENA_WIDTH} height={ARENA_HEIGHT} fill="black" />

            {/* Render Obstacles */}
            {obstacles.map((obs, i) => (
                <circle key={`obstacle-${i}`} cx={obs.position.x} cy={obs.position.y} r={obs.radius} fill="#3730a3" opacity="0.6" stroke="#4f46e5" strokeWidth="2" />
            ))}

            {/* Render Food */}
            {food.map((f, i) => (
                <circle key={`food-${i}`} cx={f.x} cy={f.y} r={FOOD_RADIUS} fill="#facc15" /> // yellow-400
            ))}

            {/* Render Agents */}
            {agents.map((agent) => (
                <AgentShape 
                    key={agent.id} 
                    agent={agent} 
                    isSelected={agent.id === selectedAgentId} 
                    onClick={() => onAgentClick(agent.id)}
                />
            ))}
        </svg>
    );
});
