
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { District } from '../types';

interface DistrictNodeProps {
    district: District;
    onClick: () => void;
    isSelected: boolean;
}

const COLORS = {
    residential: '#4ade80', // Green-ish
    commercial: '#60a5fa', // Blue
    industrial: '#fbbf24', // Amber
    park: '#166534',       // Dark Green
    civic: '#f472b6',      // Pink
};

const BASE_SIZE = 120; // Size of the tile

export const DistrictNode: React.FC<DistrictNodeProps> = ({ district, onClick, isSelected }) => {
    
    // Deterministic random generation for visuals based on ID
    const visualElements = useMemo(() => {
        const seed = district.id.charCodeAt(0) + district.id.length;
        const elements = [];
        
        // Base ground (Rhombus)
        // Center is roughly 60, 30
        elements.push(
            <path 
                key="base" 
                d={`M0,${BASE_SIZE/4} L${BASE_SIZE/2},0 L${BASE_SIZE},${BASE_SIZE/4} L${BASE_SIZE/2},${BASE_SIZE/2} Z`} 
                fill={COLORS[district.type]}
                stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isSelected ? 4 : 1}
                className="district-base"
                style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))' }}
            />
        );

        // Buildings
        // Simple isometric blocks: Face top, Face Left, Face Right
        const { buildings } = district.visuals;
        
        buildings.forEach((b, i) => {
            // Pseudo-random position within the rhombus
            const offset = (seed + i * 15) % 40; 
            const x = 30 + offset; 
            const y = 10 + offset/2; 
            const h = b.type === 'highrise' ? 60 : (b.type === 'factory' ? 30 : 20);
            const w = 15;

            // Draw a simple 3D block
            // Top
            elements.push(
                <path 
                    key={`b-${i}-top`}
                    d={`M${x},${y} L${x+w},${y+w/2} L${x},${y+w} L${x-w},${y+w/2} Z`}
                    fill={b.color}
                    filter="brightness(1.2)"
                />
            );
            // Right Side
            elements.push(
                <path 
                    key={`b-${i}-right`}
                    d={`M${x+w},${y+w/2} L${x+w},${y+w/2+h} L${x},${y+w+h} L${x},${y+w} Z`}
                    fill={b.color}
                    filter="brightness(0.8)"
                />
            );
            // Left Side
            elements.push(
                <path 
                    key={`b-${i}-left`}
                    d={`M${x},${y+w} L${x},${y+w+h} L${x-w},${y+w/2+h} L${x-w},${y+w/2} Z`}
                    fill={b.color}
                    filter="brightness(0.6)"
                />
            );
        });

        // Trees
        if (district.visuals.greenery > 0) {
             const treeCount = Math.floor(district.visuals.greenery * 5);
             for(let t=0; t<treeCount; t++) {
                 const tx = 20 + ((seed * t * 7) % 80);
                 const ty = 20 + ((seed * t * 3) % 20);
                 elements.push(
                     <circle key={`tree-${t}`} cx={tx} cy={ty} r={6} fill="#14532d" />
                 );
             }
        }

        return elements;
    }, [district, isSelected]);

    return (
        <g 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            className="district-group"
        >
            {visualElements}
            
            {/* Stats Indicators (floating above) */}
            {district.stats.pollution > 70 && (
                <text x={60} y={-20} textAnchor="middle" fontSize="20">☁️</text>
            )}
            {district.stats.happiness < 30 && (
                <text x={60} y={-40} textAnchor="middle" fontSize="20">😠</text>
            )}
             {district.stats.trafficFlow > 80 && (
                <text x={20} y={0} textAnchor="middle" fontSize="20">🚗</text>
            )}
        </g>
    );
};
