
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CityGraph, CameraState } from '../types';
import { ThinkingIcon, SparklesIcon, UndoIcon } from './Icons';

interface GameUIProps {
    city: CityGraph;
    tickCount: number;
    aiInput: string;
    setAiInput: (val: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    onResetCamera: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
    city,
    tickCount,
    aiInput,
    setAiInput,
    onGenerate,
    isGenerating,
    onResetCamera
}) => {
    const totalPop = city.districts.reduce((a, b) => a + b.stats.population, 0);

    return (
        <>
            {/* Top HUD */}
            <div className="ui-overlay top-bar">
                <div className="city-header">
                    <h1>{city.name}</h1>
                    <div className="city-meta">
                        <span className="meta-item">
                            <span className="label">POPULATION</span>
                            <span className="value">{totalPop.toLocaleString()}</span>
                        </span>
                        <span className="divider"></span>
                        <span className="meta-item">
                            <span className="label">DAY</span>
                            <span className="value">{tickCount}</span>
                        </span>
                    </div>
                </div>
                
                <button className="icon-btn reset-cam-btn" onClick={onResetCamera} title="Reset Camera">
                    <UndoIcon />
                </button>
            </div>

            {/* Bottom HUD */}
            <div className="ui-overlay bottom-bar">
                 <div className="generator-input">
                    <input 
                        type="text" 
                        placeholder="Describe a new district (e.g. 'Cyberpunk slums')" 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
                        disabled={isGenerating}
                    />
                    <button onClick={onGenerate} disabled={isGenerating || !aiInput}>
                        {isGenerating ? <ThinkingIcon /> : <SparklesIcon />}
                        <span>Build</span>
                    </button>
                 </div>
            </div>
        </>
    );
};

export default GameUI;
