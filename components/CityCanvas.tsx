
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { CityGraph, TiltShiftParams, CameraState } from '../types';
import { DistrictNode } from './DistrictNode';

interface CityCanvasProps {
    city: CityGraph;
    tiltShift: TiltShiftParams;
    camera: CameraState;
    onCameraChange: (cam: CameraState) => void;
    onDistrictSelect: (id: string) => void;
    selectedId: string | null;
}

const CityCanvas: React.FC<CityCanvasProps> = ({ 
    city, 
    tiltShift, 
    camera,
    onCameraChange,
    onDistrictSelect, 
    selectedId 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const dragThresholdMet = useRef(false);

    // Simple isometric projection helpers
    const TILE_W = 140;
    const TILE_H = 80;

    // Sort districts by depth (x + y) so closer ones render on top (Painter's Algorithm)
    const sortedDistricts = useMemo(() => {
        return [...city.districts].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
    }, [city.districts]);

    // --- Interaction Handlers ---

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // e.preventDefault(); // React synthetic events can't prevent default on wheel sometimes, handled in CSS/native if needed
        const zoomSensitivity = 0.001;
        const newZoom = Math.min(Math.max(camera.zoom - e.deltaY * zoomSensitivity, 0.4), 3.0);
        onCameraChange({ ...camera, zoom: newZoom });
    }, [camera, onCameraChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        dragThresholdMet.current = false;
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragThresholdMet.current = true;
        }

        onCameraChange({
            ...camera,
            x: camera.x + dx,
            y: camera.y + dy
        });

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }, [isDragging, camera, onCameraChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDistrictClick = (id: string) => {
        if (!dragThresholdMet.current) {
            onDistrictSelect(id);
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`city-canvas-wrapper ${isDragging ? 'grabbing' : 'grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            style={{ 
                position: 'absolute', 
                inset: 0, 
                overflow: 'hidden',
                backgroundColor: '#88ccff', // Sky blue base
                backgroundImage: 'radial-gradient(circle at center, #aaddff 0%, #88ccff 100%)',
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
        >
            {/* Camera Rig - Handles 2D Pan/Zoom */}
            <div 
                className="camera-rig"
                style={{
                    transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
                    transformOrigin: 'center',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    pointerEvents: 'none' // Let events bubble to wrapper, but SVG needs pointer-events: auto
                }}
            >
                {/* Tabletop - Handles 3D Iso Rotation */}
                <div 
                    className="city-tabletop"
                    style={{
                        transform: 'rotateX(60deg) rotateZ(-45deg)',
                        transformStyle: 'preserve-3d',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '0px', // Center origin
                        height: '0px',
                        overflow: 'visible'
                    }}
                >
                    <svg 
                        width="0" 
                        height="0" 
                        style={{ overflow: 'visible', pointerEvents: 'auto' }}
                    >
                        {/* Render Edges (Roads) */}
                        {city.edges.map((edge, i) => {
                            const src = city.districts.find(d => d.id === edge.sourceId);
                            const tgt = city.districts.find(d => d.id === edge.targetId);
                            if (!src || !tgt) return null;

                            const x1 = (src.gridX - src.gridY) * TILE_W / 2;
                            const y1 = (src.gridX + src.gridY) * TILE_H / 2;
                            const x2 = (tgt.gridX - tgt.gridY) * TILE_W / 2;
                            const y2 = (tgt.gridX + tgt.gridY) * TILE_H / 2;

                            return (
                                <line 
                                    key={`edge-${i}`} 
                                    x1={x1 + 60} y1={y1 + 30} 
                                    x2={x2 + 60} y2={y2 + 30} 
                                    stroke="#555" 
                                    strokeWidth="8" 
                                    strokeLinecap="round"
                                    style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}
                                />
                            );
                        })}

                        {/* Render Districts in Depth Order */}
                        {sortedDistricts.map(district => {
                            const screenX = (district.gridX - district.gridY) * TILE_W / 2;
                            const screenY = (district.gridX + district.gridY) * TILE_H / 2;

                            return (
                                <g key={district.id} transform={`translate(${screenX}, ${screenY})`}>
                                    <DistrictNode 
                                        district={district} 
                                        isSelected={selectedId === district.id}
                                        onClick={() => handleDistrictClick(district.id)}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* TILT SHIFT OVERLAYS - Fixed to Screen */}
            <div 
                className="tilt-shift-layer top"
                style={{
                    backdropFilter: `blur(${tiltShift.blurStrength}px)`,
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                }}
            />
            <div 
                className="tilt-shift-layer bottom"
                style={{
                    backdropFilter: `blur(${tiltShift.blurStrength}px)`,
                    maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
                }}
            />
            <div 
                className="vignette-layer"
                style={{
                    opacity: tiltShift.vignette,
                }}
            />
            <div 
                className="lens-layer"
                style={{
                    backdropFilter: `saturate(${tiltShift.saturation}) contrast(1.1)`,
                }} 
            />
        </div>
    );
};

export default CityCanvas;
