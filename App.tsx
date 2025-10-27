import React, { useState, useMemo } from 'react';
import { Arena } from './components/Arena';
import { Controls } from './components/Controls';
import { NeuralViz } from './components/NeuralViz';
import { Stats } from './components/Stats';
import { useSimulation } from './hooks/useSimulation';
import type { Agent } from './types';
import { ARENA_HEIGHT, ARENA_WIDTH } from './constants';

const App: React.FC = () => {
    const { simulationState, isRunning, stats, togglePause, resetSimulation } = useSimulation();
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>('predator-0');

    const selectedAgent = useMemo((): Agent | undefined => {
        return simulationState.agents.find(a => a.id === selectedAgentId);
    }, [selectedAgentId, simulationState.agents]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 font-mono">
            <header className="w-full max-w-7xl mb-4 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-cyan-300 tracking-wider">Predator–Prey Neural Playground</h1>
                <p className="text-gray-400 mt-1">An emergent behavior simulation with layered neural control.</p>
                <p className="text-gray-400 mt-4 max-w-4xl mx-auto text-sm leading-relaxed">
                    This is a simulation of three prey mice and a predator learning to survive and hunt in a walled arena. Each agent uses a combination of simple reflexes, an anti-wall-hugging drive, and a reinforcement learning system to make decisions. You can inspect any agent's "brain" in real-time by clicking on it, viewing its sensory inputs and the neural activity that drives its actions. Watch as complex chase and evasion strategies emerge from these simple, biologically-inspired rules.
                </p>
            </header>

            <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4">
                {/* Left Column: Controls & Stats */}
                <aside className="flex flex-col gap-4">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-grow flex flex-col">
                        <h2 className="text-lg font-bold text-cyan-300 border-b border-gray-600/70 pb-2 mb-4">Controls</h2>
                        <Controls
                            isRunning={isRunning}
                            onTogglePause={togglePause}
                            onReset={resetSimulation}
                        />
                    </div>
                     <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-grow flex flex-col">
                        <h2 className="text-lg font-bold text-cyan-300 border-b border-gray-600/70 pb-2 mb-4">Statistics</h2>
                        <Stats stats={stats} />
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-cyan-300 border-b border-gray-600/70 pb-2 mb-3">About this Simulation</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            This simulation showcases emergent behaviors from layered neural mechanisms. Agents use reflexes, homeostatic drives, and reinforcement learning to navigate, forage, and evade, offering a transparent look into biologically plausible AI.
                        </p>
                    </div>
                </aside>

                {/* Center Column: Simulation Arena */}
                <div 
                    className="relative w-full bg-black border-2 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10"
                    style={{ aspectRatio: `${ARENA_WIDTH} / ${ARENA_HEIGHT}` }}
                >
                    <Arena 
                        agents={simulationState.agents} 
                        food={simulationState.food} 
                        obstacles={simulationState.obstacles}
                        onAgentClick={setSelectedAgentId}
                        selectedAgentId={selectedAgentId}
                    />
                </div>

                {/* Right Column: Neural Viz */}
                <aside className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-grow flex flex-col">
                    <h2 className="text-lg font-bold text-cyan-300 border-b border-gray-600/70 pb-2 mb-4">Neural Activity</h2>
                    {selectedAgent ? (
                        <NeuralViz agent={selectedAgent} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select an agent to view its neural state.</p>
                        </div>
                    )}
                </aside>
            </main>

            <footer className="w-full max-w-7xl mt-4 text-center text-gray-500 text-sm">
                <p>Click on an agent in the arena to inspect its neural activity.</p>
            </footer>
        </div>
    );
};

export default App;