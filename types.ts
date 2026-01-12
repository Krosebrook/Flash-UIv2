
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  originalHtml?: string; // Stores the raw generated HTML before any layout wrapping
  status: 'streaming' | 'complete' | 'error';
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts: Artifact[];
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }

export type Framework = 'vanilla' | 'tailwind' | 'react-mui' | 'bootstrap' | 'foundation';

export interface GenerationSettings {
    framework: Framework;
    dataContext: string; // JSON or text description of data
    autoA11y: boolean;   // Automatically enhance accessibility
}
