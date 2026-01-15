
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Miniature City Builder - Vibe Coded

import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { CityGraph, District, GameState, CameraState } from './types';
import { runSimulationTick } from './utils/simulation';
import CityCanvas from './components/CityCanvas';
import GameUI from './components/GameUI';
import SideDrawer from './components/SideDrawer';

// 3. Prompt template for generating miniature‑looking districts
const GENERATION_PROMPT_TEMPLATE = `
You are a city planner AI. Generate a single new city district based on the user request.
Current City Context: {CONTEXT_SUMMARY}
Request: "{USER_REQUEST}"

Return STRICT JSON matching this schema:
{
  "name": "string (creative name)",
  "type": "residential" | "commercial" | "industrial" | "park" | "civic",
  "stats": {
    "population": number (0-5000),
    "trafficFlow": number (0-100),
    "pollution": number (0-100),
    "happiness": number (0-100),
    "economy": number (0-100),
    "transitScore": number (0-100)
  },
  "visuals": {
    "buildings": [
       { "type": "highrise"|"house"|"factory"|"shop", "count": number (1-5), "color": "hex string" }
    ],
    "greenery": number (0.0-1.0),
    "water": boolean
  },
  "description": "Short flavor text (max 20 words)"
}
`;

// Initial Mock Data
const INITIAL_CITY: CityGraph = {
    name: "Neo-Miniatura",
    districts: [
        {
            id: 'd1',
            name: 'Old Town',
            type: 'residential',
            gridX: 0,
            gridY: 0,
            stats: { population: 1200, trafficFlow: 20, pollution: 10, happiness: 85, economy: 40, transitScore: 60 },
            visuals: { buildings: [{ type: 'house', count: 4, color: '#e2e8f0' }], greenery: 0.8, water: false },
            description: "The historic center."
        }
    ],
    edges: []
};

function App() {
    const [gameState, setGameState] = useState<GameState>({
        city: INITIAL_CITY,
        selectedDistrictId: null,
        isSimulating: true,
        tickCount: 0,
        tiltShift: { blurStrength: 6, saturation: 1.4, vignette: 0.4 },
        camera: { x: 0, y: 0, zoom: 1 }
    });

    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Simulation Loop
    useEffect(() => {
        if (!gameState.isSimulating) return;
        const interval = setInterval(() => {
            setGameState(prev => {
                const updatedCity = runSimulationTick(prev.city);
                return { ...prev, city: updatedCity, tickCount: prev.tickCount + 1 };
            });
        }, 2000); // Tick every 2s
        return () => clearInterval(interval);
    }, [gameState.isSimulating]);

    const handleSelectDistrict = (id: string) => {
        setGameState(prev => ({ ...prev, selectedDistrictId: id }));
        setDrawerOpen(true);
    };

    const handleCameraChange = (newCam: CameraState) => {
        setGameState(prev => ({ ...prev, camera: newCam }));
    };

    const handleResetCamera = () => {
        setGameState(prev => ({ ...prev, camera: { x: 0, y: 0, zoom: 1 } }));
    };

    const getAiClient = () => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY not set");
        return new GoogleGenAI({ apiKey });
    };

    const findFreeNeighbor = (city: CityGraph, startDistrict: District | undefined): { x: number, y: number } => {
        if (!startDistrict) return { x: 0, y: 0 }; 
        const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        const shuffled = directions.sort(() => 0.5 - Math.random());
        
        for (const dir of shuffled) {
            const checkX = startDistrict.gridX + dir.dx;
            const checkY = startDistrict.gridY + dir.dy;
            const occupied = city.districts.some(d => d.gridX === checkX && d.gridY === checkY);
            if (!occupied) return { x: checkX, y: checkY };
        }
        return { x: startDistrict.gridX + (Math.random() > 0.5 ? 1 : -1), y: startDistrict.gridY + (Math.random() > 0.5 ? 1 : -1) };
    };

    const handleGenerateDistrict = async () => {
        if (!aiInput.trim()) return;
        setIsGenerating(true);

        try {
            const ai = getAiClient();
            const context = `City has ${gameState.city.districts.length} districts. Last district was ${gameState.city.districts[gameState.city.districts.length-1].name}.`;
            const fullPrompt = GENERATION_PROMPT_TEMPLATE
                .replace('{CONTEXT_SUMMARY}', context)
                .replace('{USER_REQUEST}', aiInput);

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { role: 'user', parts: [{ text: fullPrompt }] },
                config: { responseMimeType: 'application/json' }
            });

            const rawJson = response.text || "{}";
            const newDistrictData = JSON.parse(rawJson);
            const parent = gameState.selectedDistrictId 
                ? gameState.city.districts.find(d => d.id === gameState.selectedDistrictId)
                : gameState.city.districts[gameState.city.districts.length - 1];
            
            const { x: newX, y: newY } = findFreeNeighbor(gameState.city, parent);
            const newDistrict: District = {
                ...newDistrictData,
                id: `d-${Date.now()}`,
                gridX: newX,
                gridY: newY
            };

            setGameState(prev => ({
                ...prev,
                city: {
                    ...prev.city,
                    districts: [...prev.city.districts, newDistrict],
                    edges: parent ? [...prev.city.edges, { sourceId: parent.id, targetId: newDistrict.id, capacity: 10 }] : prev.city.edges
                }
            }));
            setAiInput('');
            setDrawerOpen(false); 

        } catch (e) {
            console.error("AI Generation failed", e);
            alert("Failed to build district. Try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedDistrict = gameState.city.districts.find(d => d.id === gameState.selectedDistrictId);

    return (
        <div className="miniature-builder-app">
            <CityCanvas 
                city={gameState.city} 
                tiltShift={gameState.tiltShift} 
                camera={gameState.camera}
                onCameraChange={handleCameraChange}
                onDistrictSelect={handleSelectDistrict}
                selectedId={gameState.selectedDistrictId}
            />

            <GameUI 
                city={gameState.city}
                tickCount={gameState.tickCount}
                aiInput={aiInput}
                setAiInput={setAiInput}
                onGenerate={handleGenerateDistrict}
                isGenerating={isGenerating}
                onResetCamera={handleResetCamera}
            />

            <SideDrawer 
                isOpen={drawerOpen} 
                onClose={() => setDrawerOpen(false)} 
                title={selectedDistrict?.name || 'District Info'}
            >
                {selectedDistrict ? (
                    <div className="district-detail">
                        <div className={`badge type ${selectedDistrict.type}`}>{selectedDistrict.type.toUpperCase()}</div>
                        <p className="desc">{selectedDistrict.description}</p>
                        
                        <div className="stat-grid">
                            <StatBar label="Happiness" value={selectedDistrict.stats.happiness} color="#fbbf24" icon="😊" />
                            <StatBar label="Pollution" value={selectedDistrict.stats.pollution} color="#71717a" icon="☁️" />
                            <StatBar label="Traffic" value={selectedDistrict.stats.trafficFlow} color="#ef4444" icon="🚗" />
                            <StatBar label="Economy" value={selectedDistrict.stats.economy} color="#10b981" icon="💰" />
                        </div>

                        <div className="coords-meta">
                            Grid: {selectedDistrict.gridX}, {selectedDistrict.gridY}
                        </div>
                    </div>
                ) : (
                    <p>Select a district to see details.</p>
                )}
            </SideDrawer>
        </div>
    );
}

// Simple internal component for the drawer stats
const StatBar = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) => (
    <div className="stat-row">
        <span className="stat-icon">{icon}</span>
        <label>{label}</label>
        <div className="bar-container">
            <div className="bar-fill" style={{ width: `${value}%`, backgroundColor: color }}></div>
        </div>
        <span className="stat-value">{Math.round(value)}</span>
    </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
