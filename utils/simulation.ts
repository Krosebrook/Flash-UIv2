
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CityGraph, District, Edge } from '../types';

// 4. Simulation model tuned for district‑to‑district interactions

const TRAFFIC_COUPLING = 0.15;
const POLLUTION_SPREAD = 0.08;
const ECONOMY_SYNERGY = 0.05;

/**
 * Runs one tick of the simulation.
 * Updates stats based on neighbors and internal logic.
 */
export const runSimulationTick = (city: CityGraph): CityGraph => {
    const newDistricts = city.districts.map(d => {
        // 1. Clone stats to avoid mutation during calculation
        const nextStats = { ...d.stats };

        // 2. Identify neighbors via edges
        const neighborIds = city.edges
            .filter(e => e.sourceId === d.id || e.targetId === d.id)
            .map(e => e.sourceId === d.id ? e.targetId : e.sourceId);
        
        const neighbors = city.districts.filter(n => neighborIds.includes(n.id));

        // 3. Calculate Deltas
        let trafficInflux = 0;
        let pollutionInflux = 0;
        let economyBoost = 0;
        let happinessBoost = 0;

        neighbors.forEach(n => {
            // Traffic Sharing: High transit score reduces local traffic but might export it
            trafficInflux += n.stats.trafficFlow * TRAFFIC_COUPLING;
            
            // Pollution Spread
            pollutionInflux += n.stats.pollution * POLLUTION_SPREAD;

            // Economy Complementarity
            // If I am Res and Neighbor is Comm/Ind, we both benefit
            const isComplementary = 
                (d.type === 'residential' && (n.type === 'commercial' || n.type === 'industrial')) ||
                ((d.type === 'commercial' || d.type === 'industrial') && n.type === 'residential');
            
            if (isComplementary) {
                economyBoost += n.stats.economy * ECONOMY_SYNERGY;
                happinessBoost += 2; // Commute to work is available
            }
        });

        // 4. Apply Logic
        
        // Traffic decay (road improvements) vs Influx
        nextStats.trafficFlow = Math.max(0, Math.min(100, 
            (d.stats.trafficFlow * 0.95) + trafficInflux + (d.stats.population * 0.01)
        ));

        // Pollution decay vs Influx
        nextStats.pollution = Math.max(0, Math.min(100, 
            (d.stats.pollution * 0.98) + pollutionInflux + (d.type === 'industrial' ? 2 : 0) - (d.visuals.greenery * 5)
        ));

        // Economy fluctuations
        nextStats.economy = Math.max(0, Math.min(100, 
            d.stats.economy + economyBoost + (Math.random() * 2 - 1)
        ));

        // Happiness: -(Traffic + Pollution) + Economy + Greenery
        const baseHappiness = 50;
        const penalties = (nextStats.trafficFlow * 0.2) + (nextStats.pollution * 0.4);
        const bonuses = (nextStats.economy * 0.3) + (d.visuals.greenery * 20) + happinessBoost;
        
        nextStats.happiness = Math.max(0, Math.min(100, 
            baseHappiness - penalties + bonuses
        ));

        return {
            ...d,
            stats: nextStats
        };
    });

    return {
        ...city,
        districts: newDistricts
    };
};
