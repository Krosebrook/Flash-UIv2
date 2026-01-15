
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutOption, Artifact } from '../../types';
import { ExpandIcon } from '../Icons';

interface LayoutsPanelProps {
    layouts: LayoutOption[];
    focusedArtifact: Artifact | null;
    onApply: (layout: LayoutOption) => void;
    onPreview: (e: React.MouseEvent, layout: LayoutOption) => void;
}

const LayoutsPanel: React.FC<LayoutsPanelProps> = ({ layouts, focusedArtifact, onApply, onPreview }) => {

    const getPreviewHtml = (layout: LayoutOption) => {
        // Use the focused artifact's code if available, otherwise fall back to the layout's static skeleton
        const baseHtml = focusedArtifact ? (focusedArtifact.originalHtml || focusedArtifact.html) : layout.previewHtml;
        
        if (layout.name === "Standard") {
            return baseHtml;
        }

        // Construct a full HTML document.
        // This is crucial because many layouts use 'body' selectors for background/centering.
        // We also add overflow:hidden to the body to prevent scrollbars in the tiny preview.
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    ${layout.css}
                    body {
                        overflow: hidden; 
                        transform-origin: top left;
                    }
                </style>
            </head>
            <body>
                <div class="layout-container">
                    ${baseHtml}
                </div>
            </body>
            </html>
        `;
    };

    return (
        <div className="sexy-grid">
            {layouts.map((lo, i) => (
                <div key={i} className="sexy-card" onClick={() => onApply(lo)}>
                    <button className="expand-btn" onClick={(e) => onPreview(e, lo)} title="Full Preview">
                        <ExpandIcon />
                    </button>
                    <div className="sexy-preview">
                        <iframe 
                            srcDoc={getPreviewHtml(lo)} 
                            title={lo.name} 
                            loading="lazy" 
                            sandbox="allow-scripts allow-same-origin"
                        />
                        {/* Overlay to prevent iframe interaction so the click event bubbles to the card */}
                        <div className="preview-overlay-click"></div>
                    </div>
                    <div className="sexy-label">
                        {lo.name}
                        {focusedArtifact && <span className="live-badge">Live</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LayoutsPanel;
