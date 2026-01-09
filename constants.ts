
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { LayoutOption } from './types';

export const INITIAL_PLACEHOLDERS = [
    "Design a minimalist weather card",
    "Show me a live stock ticker",
    "Create a futuristic login form",
    "Build a stock portfolio dashboard",
    "Make a brutalist music player",
    "Generate a sleek pricing table",
    "Ask for anything"
];

export const LAYOUT_OPTIONS: LayoutOption[] = [
    {
        name: "Standard",
        css: "",
        previewHtml: `<div class="preview-box standard"><span>Standard</span></div>`
    },
    {
        name: "Hero Display",
        css: `
            body { 
                margin: 0; display: flex; align-items: center; justify-content: center; 
                min-height: 100vh; background: #09090b; color: #fff; padding: 40px; box-sizing: border-box; 
            }
            .layout-container { width: 100%; max-width: 800px; animation: floatUp 0.8s ease-out; }
            @keyframes floatUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `,
        previewHtml: `<div class="preview-box hero"><div></div></div>`
    },
    {
        name: "Glassmorphism",
        css: `
            body {
                margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh;
                background: linear-gradient(45deg, #1e293b, #334155, #0f172a);
                background-size: 400% 400%; animation: gradient 15s ease infinite; padding: 20px;
            }
            @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .layout-container {
                background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
            }
        `,
        previewHtml: `<div class="preview-box glass"><div></div></div>`
    },
    {
        name: "Mobile Portrait",
        css: `
            body {
                margin: 0; display: flex; align-items: center; justify-content: center;
                min-height: 100vh; background: #121212; padding: 20px;
            }
            .layout-container {
                width: 360px; height: 740px; background: #fff; border-radius: 36px;
                border: 12px solid #282828; overflow-y: auto; position: relative;
                box-shadow: 0 24px 48px rgba(0,0,0,0.5);
            }
            .layout-container::-webkit-scrollbar { display: none; }
        `,
        previewHtml: `<div class="preview-box mobile"><div></div></div>`
    },
    {
        name: "Bento Dashboard",
        css: `
            body { margin: 0; background: #f4f4f5; padding: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; min-height: 100vh; }
            .layout-container { grid-column: span 2; background: #fff; border-radius: 24px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .side-bento { background: #fff; border-radius: 24px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; color: #888; font-weight: 500; }
        `,
        previewHtml: `<div class="preview-box bento"><div class="b1"></div><div class="b2"></div></div>`
    },
    {
        name: "SaaS Sidebar",
        css: `
            body { margin: 0; display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; background: #fff; }
            .sidebar { background: #18181b; color: #fff; padding: 40px; display: flex; flex-direction: column; gap: 20px; }
            .sidebar .nav-item { height: 10px; background: rgba(255,255,255,0.1); border-radius: 99px; }
            .main-content { padding: 60px; background: #fafafa; display: flex; flex-direction: column; align-items: flex-start; }
            .layout-container { width: 100%; max-width: 900px; background: #fff; border-radius: 12px; border: 1px solid #eee; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        `,
        previewHtml: `<div class="preview-box saas"><div class="side"></div><div class="main"></div></div>`
    },
    {
        name: "Neo-Brutalist",
        css: `
            body { margin: 0; background: #fff200; padding: 40px; font-family: 'Arial Black', sans-serif; }
            .layout-container {
                background: #fff; border: 4px solid #000; padding: 30px;
                box-shadow: 12px 12px 0px #000;
            }
        `,
        previewHtml: `<div class="preview-box brutal"><div></div></div>`
    },
    {
        name: "Split Vertical",
        css: `
            body { margin: 0; display: flex; min-height: 100vh; }
            .visual-side { flex: 1; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-family: serif; font-size: 4rem; opacity: 0.9; }
            .content-side { flex: 1.2; padding: 80px; display: flex; align-items: center; justify-content: center; background: #fff; }
            .layout-container { width: 100%; max-width: 500px; }
        `,
        previewHtml: `<div class="preview-box split"><div class="v1"></div><div class="v2"></div></div>`
    },
    {
        name: "Art Gallery",
        css: `
            body { margin: 0; background: #f8f8f8; padding: 80px; display: flex; justify-content: center; }
            .layout-container {
                background: #fff; padding: 40px; border: 20px solid #fff;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.1), 0 30px 60px rgba(0,0,0,0.1);
                position: relative;
            }
            .layout-container::after {
                content: "Exhibition 2025"; position: absolute; bottom: -60px; left: 0;
                font-family: serif; color: #888; font-size: 14px; font-style: italic;
            }
        `,
        previewHtml: `<div class="preview-box gallery"><div></div></div>`
    }
];
