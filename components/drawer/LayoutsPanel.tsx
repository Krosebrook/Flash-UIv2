
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
    return (
        <div className="sexy-grid">
            {layouts.map((lo, i) => {
                const baseHtml = focusedArtifact ? (focusedArtifact.originalHtml || focusedArtifact.html) : lo.previewHtml;
                const previewHtml = lo.name === "Standard" ? baseHtml : `<style>${lo.css}</style><div class="layout-container">${baseHtml}</div>`;
                return (
                    <div key={i} className="sexy-card" onClick={() => onApply(lo)}>
                        <button className="expand-btn" onClick={(e) => onPreview(e, lo)}><ExpandIcon /></button>
                        <div className="sexy-preview">
                            <iframe srcDoc={previewHtml} title={lo.name} loading="lazy" />
                        </div>
                        <div className="sexy-label">{lo.name}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default LayoutsPanel;
