import React from 'react';

interface ControlsProps {
    isRunning: boolean;
    onTogglePause: () => void;
    onReset: () => void;
}

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.65-4.65l1.35 1.35M20 15a9 9 0 01-14.65 4.65l-1.35-1.35" />
    </svg>
);

export const Controls: React.FC<ControlsProps> = ({ isRunning, onTogglePause, onReset }) => {
    return (
        <div className="flex justify-around items-center h-full">
            <button
                onClick={onTogglePause}
                className="flex items-center justify-center w-32 gap-2 px-4 py-2 rounded-md bg-cyan-500 text-gray-900 font-bold hover:bg-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300"
                aria-label={isRunning ? 'Pause Simulation' : 'Play Simulation'}
            >
                {isRunning ? <PauseIcon /> : <PlayIcon />}
                <span>{isRunning ? 'Pause' : 'Play'}</span>
            </button>
            <button
                onClick={() => onReset()}
                className="flex items-center justify-center w-32 gap-2 px-4 py-2 rounded-md bg-red-500 text-gray-900 font-bold hover:bg-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="Reset Simulation"
            >
                <ResetIcon />
                <span>Reset</span>
            </button>
        </div>
    );
};
