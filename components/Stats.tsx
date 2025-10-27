import React from 'react';
import type { Stats as StatsType } from '../types';

interface StatsProps {
    stats: StatsType;
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-sm text-cyan-300 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
    </div>
);

export const Stats: React.FC<StatsProps> = ({ stats }) => {
    return (
        <div className="flex flex-col justify-around h-full space-y-3">
            <StatItem label="Generation" value={stats.generation} />
            <StatItem label="Time" value={`${stats.time.toFixed(1)}s`} />
            <StatItem label="Prey Caught" value={stats.preyCaught} />
            <StatItem label="Food Eaten" value={stats.foodEaten} />
        </div>
    );
};
