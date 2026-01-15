
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Full JSON schema including tilt‑shift parameters

export type DistrictType = 'residential' | 'commercial' | 'industrial' | 'park' | 'civic';

export interface DistrictStats {
    population: number;
    trafficFlow: number; // 0-100
    pollution: number;   // 0-100
    happiness: number;   // 0-100
    economy: number;     // 0-100
    transitScore: number; // 0-100 (affects traffic sharing)
}

export interface DistrictFeatures {
    buildings: { type: 'highrise' | 'house' | 'factory' | 'shop'; count: number; color: string }[];
    greenery: number; // 0-1 density
    water: boolean;
}

export interface District {
    id: string;
    name: string;
    type: DistrictType;
    gridX: number; // Layout coordinate X
    gridY: number; // Layout coordinate Y
    stats: DistrictStats;
    visuals: DistrictFeatures;
    description: string;
}

export interface Edge {
    sourceId: string;
    targetId: string;
    capacity: number; // Affects how much stats bleed across
}

export interface CityGraph {
    districts: District[];
    edges: Edge[];
    name: string;
}

export interface TiltShiftParams {
    blurStrength: number; // px
    saturation: number; // multiplier (e.g. 1.5)
    vignette: number; // opacity 0-1
}

export interface CameraState {
    x: number;
    y: number;
    zoom: number;
}

export interface GameState {
    city: CityGraph;
    selectedDistrictId: string | null;
    isSimulating: boolean;
    tickCount: number;
    tiltShift: TiltShiftParams;
    camera: CameraState;
}

// UI Builder Types (Legacy support)

export interface Artifact {
    id: string;
    html: string;
    originalHtml?: string;
    styleName?: string;
    status: 'idle' | 'streaming' | 'complete' | 'error';
    name?: string;
}

export interface LayoutOption {
    name: string;
    css: string;
    previewHtml: string;
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts?: Artifact[];
}

export interface GenerationSettings {
    framework: 'vanilla' | 'tailwind' | 'react-mui' | 'bootstrap' | 'foundation';
    dataContext: string;
}

export interface ComponentVariation {
    name: string;
    html: string;
}
