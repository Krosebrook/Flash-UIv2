
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GenerationSettings } from '../../types';

interface SettingsPanelProps {
    settings: GenerationSettings;
    onSettingsChange: (newSettings: GenerationSettings) => void;
    onClearHistoryRequest: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onClearHistoryRequest }) => {
    return (
        <div className="settings-panel">
            <div className="setting-group">
                <label>CSS Framework</label>
                <select 
                    value={settings.framework} 
                    onChange={(e) => onSettingsChange({ ...settings, framework: e.target.value as any })}
                >
                    <option value="vanilla">Vanilla CSS</option>
                    <option value="tailwind">Tailwind CSS (CDN)</option>
                    <option value="react-mui">React + Material UI (CDN)</option>
                    <option value="bootstrap">Bootstrap 5 (CDN)</option>
                    <option value="foundation">Foundation 6 (CDN)</option>
                </select>
            </div>
            <div className="setting-group">
                <label>Data Context</label>
                <textarea 
                    value={settings.dataContext} 
                    onChange={(e) => onSettingsChange({ ...settings, dataContext: e.target.value })} 
                    placeholder='e.g. JSON data description' 
                    rows={4} 
                />
            </div>
            <div className="setting-group danger-zone">
                <label>Danger Zone</label>
                <button onClick={onClearHistoryRequest} className="clear-history-btn">Clear All History</button>
            </div>
        </div>
    );
};

export default SettingsPanel;
