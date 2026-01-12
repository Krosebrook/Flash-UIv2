
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, LayoutOption, GenerationSettings } from './types';
import { INITIAL_PLACEHOLDERS, LAYOUT_OPTIONS } from './constants';
import { generateId } from './utils';
import { useHistory } from './hooks/useHistory';
import { loadSessions, saveSessions, clearSessions } from './utils/storage';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import CodeEditor from './components/CodeEditor';
import { 
    ThinkingIcon, 
    CodeIcon, 
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    ArrowUpIcon, 
    GridIcon,
    LayoutIcon,
    DownloadIcon,
    ExpandIcon,
    CloseIcon,
    UndoIcon,
    RedoIcon,
    SettingsIcon,
    WandIcon,
    CopyIcon,
    HistoryIcon,
    TrashIcon
} from './components/Icons';

const parseJsonStream = async function* (responseStream: AsyncGenerator<{ text: string }>) {
    let buffer = '';
    for await (const chunk of responseStream) {
        const text = chunk.text;
        if (typeof text !== 'string') continue;
        buffer += text;
        let braceCount = 0;
        let start = buffer.indexOf('{');
        while (start !== -1) {
            braceCount = 0;
            let end = -1;
            for (let i = start; i < buffer.length; i++) {
                if (buffer[i] === '{') braceCount++;
                else if (buffer[i] === '}') braceCount--;
                if (braceCount === 0 && i > start) {
                    end = i;
                    break;
                }
            }
            if (end !== -1) {
                const jsonString = buffer.substring(start, end + 1);
                try {
                    yield JSON.parse(jsonString);
                    buffer = buffer.substring(end + 1);
                    start = buffer.indexOf('{');
                } catch (e) {
                    start = buffer.indexOf('{', start + 1);
                }
            } else {
                break; 
            }
        }
    }
};

function App() {
  const { 
      state: sessions, 
      set: setSessions, 
      undo, 
      redo, 
      canUndo, 
      canRedo 
  } = useHistory<Session[]>(loadSessions());

  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(() => {
      const loaded = loadSessions();
      return loaded.length > 0 ? loaded.length - 1 : -1;
  });
  
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [iterationInput, setIterationInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
  const [settings, setSettings] = useState<GenerationSettings>({
      framework: 'vanilla',
      dataContext: '',
      autoA11y: false
  });

  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'layouts' | 'settings' | 'enhance' | 'history' | null;
      title: string;
      data: any;
      error?: string | null;
  }>({ isOpen: false, mode: null, title: '', data: null, error: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [previewItem, setPreviewItem] = useState<{html: string, name: string} | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy Code');

  const inputRef = useRef<HTMLInputElement>(null);
  const iterationInputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handler = setTimeout(() => {
          saveSessions(sessions);
      }, 1000); 
      return () => clearTimeout(handler);
  }, [sessions]);

  useEffect(() => {
      if (!isLoading) {
          inputRef.current?.focus();
      }
  }, [isLoading]);

  useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) { if (canRedo) redo(); } else { if (canUndo) undo(); }
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
  }, [placeholders.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleIterationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIterationInput(event.target.value);
  };

  const fetchVariations = useCallback(async (append: boolean) => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    
    if (append && componentVariations.length >= 6) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setDrawerState(prev => ({ ...prev, error: null }));

    if (!append) {
        setComponentVariations([]);
        setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id, error: null });
    }

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        let frameworkInstruction = '';
        if (settings.framework === 'tailwind') frameworkInstruction = 'Use Tailwind CSS via CDN.';
        else if (settings.framework === 'react-mui') frameworkInstruction = 'Use React and Material UI via CDN. Return a complete HTML file.';
        else if (settings.framework === 'bootstrap') frameworkInstruction = 'Use Bootstrap 5 via CDN. Ensure responsive classes.';
        else if (settings.framework === 'foundation') frameworkInstruction = 'Use Foundation 6 via CDN. Ensure correct class names.';

        const currentCount = append ? componentVariations.length : 0;
        const limit = 6;
        const countToFetch = Math.min(3, limit - currentCount);
        
        if (countToFetch <= 0) return;

        const prompt = `
You are a master UI/UX designer. I have an existing component and I want ${countToFetch} RADICAL CONCEPTUAL VARIATIONS of it.
Original Prompt: "${currentSession.prompt}"
Existing Code: ${currentArtifact.html}

${frameworkInstruction}
For EACH variation, invent a unique design persona name (e.g. "Hyper-Minimalism", "Retro-Futuristic", "Neo-Glass") and generate high-fidelity HTML/CSS.
Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
        `.trim();

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
             contents: [{ parts: [{ text: prompt }], role: 'user' }],
             config: { temperature: 1.1 }
        });

        for await (const variation of parseJsonStream(responseStream)) {
            if (variation.name && variation.html) {
                setComponentVariations(prev => [...prev, variation]);
            }
        }
    } catch (e: any) {
        setDrawerState(prev => ({ 
            ...prev, 
            error: "We encountered an error while designing variations. Please try again." 
        }));
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, settings.framework, componentVariations.length]);

  const handleGenerateVariations = useCallback(() => {
      fetchVariations(false);
  }, [fetchVariations]);

  const handleLoadMoreVariations = useCallback(() => {
      fetchVariations(true);
  }, [fetchVariations]);

  const applyVariation = (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                j === focusedArtifactIndex ? { ...art, html, originalHtml: html, status: 'complete' } : art
              )
          } : sess
      ));
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const applyLayout = (layout: LayoutOption) => {
    if (focusedArtifactIndex === null) return;
    setSessions(prev => prev.map((sess, i) => 
        i === currentSessionIndex ? {
            ...sess,
            artifacts: sess.artifacts.map((art, j) => {
                if (j === focusedArtifactIndex) {
                    const baseHtml = art.originalHtml || art.html;
                    if (layout.name === "Standard") return { ...art, html: baseHtml, status: 'complete' };
                    const wrappedHtml = `
                        <style>${layout.css}</style>
                        <div class="layout-container">${baseHtml}</div>
                    `.trim();
                    return { ...art, html: wrappedHtml, originalHtml: baseHtml, status: 'complete' };
                }
                return art;
            })
        } : sess
    ));
    setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handlePreviewLayout = (e: React.MouseEvent, layout: LayoutOption) => {
    e.stopPropagation();
    if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
    const currentSession = sessions[currentSessionIndex];
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];
    const baseHtml = currentArtifact.originalHtml || currentArtifact.html;
    
    let htmlToPreview = baseHtml;
    if (layout.name !== "Standard") {
         htmlToPreview = `
            <style>${layout.css}</style>
            <div class="layout-container">${baseHtml}</div>
        `.trim();
    }
    
    setPreviewItem({
        name: `Preview: ${layout.name}`,
        html: htmlToPreview
    });
  };

  const updateArtifactCode = (newCode: string) => {
      if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                  j === focusedArtifactIndex ? { ...art, html: newCode, originalHtml: newCode } : art
              )
          } : sess
      ));
  };

  const handleEnhance = async (type: 'a11y' | 'format' | 'dummy' | 'responsive' | 'tailwind') => {
    if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
    setIsLoading(true);
    setDrawerState(s => ({ ...s, isOpen: false }));
    
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY missing");
        const ai = new GoogleGenAI({ apiKey });
        
        const currentSession = sessions[currentSessionIndex];
        const artifact = currentSession.artifacts[focusedArtifactIndex];
        
        let enhancementPrompt = '';
        if (type === 'a11y') enhancementPrompt = 'Analyze the following HTML and fix any accessibility issues (ARIA labels, contrast, semantic tags). Ensure it meets WCAG standards for high accessibility. Return only the corrected HTML.';
        if (type === 'format') enhancementPrompt = 'Format the following code to be clean, indented, and compliant with Prettier standards. Return only the code.';
        if (type === 'dummy') enhancementPrompt = 'Inject realistic, high-quality placeholder data (real names, detailed descriptions, high-quality images from Unsplash, etc.) into this component. Make it look like a real production app. Return only the HTML.';
        if (type === 'responsive') enhancementPrompt = 'Make this component perfectly responsive across mobile, tablet, and desktop. Add media queries or responsive classes if missing. Return only the HTML.';
        if (type === 'tailwind') enhancementPrompt = 'Refactor this component to use Tailwind CSS utility classes exclusively for all styling. Replace existing CSS. Return only the HTML.';

        const fullPrompt = `${enhancementPrompt}\n\nExisting Code:\n${artifact.html}`;

        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
        });
        
        const newHtml = response.text?.replace(/```html|```/g, '').trim() || artifact.html;
        
        setSessions(prev => prev.map((sess, i) => 
            i === currentSessionIndex ? {
                ...sess,
                artifacts: sess.artifacts.map((art, j) => 
                    j === focusedArtifactIndex ? { ...art, html: newHtml, originalHtml: newHtml, status: 'complete' } : art
                )
            } : sess
        ));
    } catch (e) {
        console.error("Enhance failed", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleIterate = async () => {
      if (focusedArtifactIndex === null || currentSessionIndex === -1 || !iterationInput.trim() || isLoading) return;
      const instruction = iterationInput.trim();
      setIterationInput('');
      setIsLoading(true);

      try {
          const apiKey = process.env.API_KEY;
          if (!apiKey) throw new Error("API_KEY missing");
          const ai = new GoogleGenAI({ apiKey });
          const currentSession = sessions[currentSessionIndex];
          const artifact = currentSession.artifacts[focusedArtifactIndex];

          const prompt = `
You are a senior frontend engineer. Modify the existing UI component based on the request.
Existing Code:
${artifact.html}

User Request: "${instruction}"

Instructions:
1. Maintain the overall style and framework (if any).
2. Apply the requested changes precisely.
3. Return ONLY the complete updated HTML/CSS. No markdown.
          `.trim();

          const responseStream = await ai.models.generateContentStream({
              model: 'gemini-3-pro-preview',
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });

          let accumulatedHtml = '';
          for await (const chunk of responseStream) {
              if (typeof chunk.text === 'string') {
                  accumulatedHtml += chunk.text;
                  setSessions(prev => prev.map((sess, i) => 
                      i === currentSessionIndex ? {
                          ...sess,
                          artifacts: sess.artifacts.map((art, j) => 
                              j === focusedArtifactIndex ? { ...art, html: accumulatedHtml, status: 'streaming' } : art
                          )
                      } : sess
                  ));
              }
          }
          
          let finalHtml = accumulatedHtml.replace(/```html|```/g, '').trim();
          setSessions(prev => prev.map((sess, i) => 
              i === currentSessionIndex ? {
                  ...sess,
                  artifacts: sess.artifacts.map((art, j) => 
                      j === focusedArtifactIndex ? { ...art, html: finalHtml, originalHtml: finalHtml, status: 'complete' } : art
                  )
              } : sess
          ));
      } catch (e) {
          console.error("Iteration failed", e);
      } finally {
          setIsLoading(false);
      }
  };

  const confirmClearHistory = () => {
      clearSessions();
      setSessions([]);
      setCurrentSessionIndex(-1);
      setFocusedArtifactIndex(null);
      setDrawerState(s => ({...s, isOpen: false}));
      setIsConfirmingClear(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessions(prev => {
          const newSessions = prev.filter(s => s.id !== id);
          if (newSessions.length === 0) setCurrentSessionIndex(-1);
          else if (currentSessionIndex >= newSessions.length) setCurrentSessionIndex(newSessions.length - 1);
          return newSessions;
      });
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'code', title: 'Edit Source Code', data: artifact.originalHtml || artifact.html, error: null });
      }
  };

  const handleShowLayouts = () => {
    setDrawerState({ isOpen: true, mode: 'layouts', title: 'Layout Options', data: null, error: null });
  };
  
  const handleShowSettings = () => {
      setDrawerState({ isOpen: true, mode: 'settings', title: 'Configuration', data: null, error: null });
  };
  
  const handleShowEnhance = () => {
      setDrawerState({ isOpen: true, mode: 'enhance', title: 'Enhance Code', data: null, error: null });
  };

  const handleShowHistory = () => {
      setDrawerState({ isOpen: true, mode: 'history', title: 'Recent Generations', data: null, error: null });
  };

  const handleDownload = () => {
    if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
    const currentSession = sessions[currentSessionIndex];
    const artifact = currentSession.artifacts[focusedArtifactIndex];
    const blob = new Blob([artifact.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flash-ui-${artifact.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
      if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
      const currentSession = sessions[currentSessionIndex];
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      navigator.clipboard.writeText(artifact.html).then(() => {
          setCopyButtonText('Copied!');
          setTimeout(() => setCopyButtonText('Copy Code'), 2000);
      });
  };

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();
    if (!trimmedInput || isLoading) return;
    if (!manualPrompt) setInputValue('');

    setIsLoading(true);
    const sessionId = generateId();
    const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
        id: `${sessionId}_${i}`,
        styleName: 'Designing...',
        html: '',
        status: 'streaming',
    }));

    const newSession: Session = {
        id: sessionId,
        prompt: trimmedInput,
        timestamp: Date.now(),
        artifacts: placeholderArtifacts
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(prev => prev + 1); 
    setFocusedArtifactIndex(null); 

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY missing");
        const ai = new GoogleGenAI({ apiKey });

        let frameworkContext = "";
        if (settings.framework === 'tailwind') frameworkContext = " Use Tailwind CSS via CDN.";
        else if (settings.framework === 'react-mui') frameworkContext = " Use React and MUI via CDN.";
        else if (settings.framework === 'bootstrap') frameworkContext = " Use Bootstrap 5.";
        else if (settings.framework === 'foundation') frameworkContext = " Use Foundation 6.";
        else frameworkContext = " Use vanilla CSS.";

        const stylePrompt = `Generate 3 distinct creative names for design directions for: "${trimmedInput}". Return raw JSON array of 3 strings.`.trim();
        const styleResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { role: 'user', parts: [{ text: stylePrompt }] }
        });

        let generatedStyles: string[] = JSON.parse(styleResponse.text?.match(/\[[\s\S]*\]/)?.[0] || '["Dir A", "Dir B", "Dir C"]');
        generatedStyles = generatedStyles.slice(0, 3);

        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            artifacts: s.artifacts.map((art, i) => ({ ...art, styleName: generatedStyles[i] }))
        } : s));

        const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
            try {
                const prompt = `Create a stunning UI component for: "${trimmedInput}". Style: ${styleInstruction}.${frameworkContext} Return ONLY raw HTML. No markdown.`.trim();
                const responseStream = await ai.models.generateContentStream({
                    model: 'gemini-3-flash-preview',
                    contents: [{ parts: [{ text: prompt }], role: "user" }],
                });

                let accumulatedHtml = '';
                for await (const chunk of responseStream) {
                    if (typeof chunk.text === 'string') {
                        accumulatedHtml += chunk.text;
                        setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: accumulatedHtml } : art)
                        } : sess));
                    }
                }
                
                let finalHtml = accumulatedHtml.replace(/```html|```/g, '').trim();
                setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: finalHtml, originalHtml: finalHtml, status: 'complete' } : art)
                } : sess));
            } catch (e: any) {
                setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: `Error: ${e.message}`, status: 'error' } : art)
                } : sess));
            }
        };

        await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [inputValue, isLoading, settings]);

  const handleSurpriseMe = () => {
      const currentPrompt = placeholders[placeholderIndex];
      setInputValue(currentPrompt);
      handleSendMessage(currentPrompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) { event.preventDefault(); handleSendMessage(); }
    else if (event.key === 'Tab' && !inputValue && !isLoading) { event.preventDefault(); setInputValue(placeholders[placeholderIndex]); }
  };

  const handleIterationKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !isLoading) { event.preventDefault(); handleIterate(); }
  };

  const nextItem = useCallback(() => {
      if (focusedArtifactIndex !== null) { if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1); }
      else if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
  }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
      if (focusedArtifactIndex !== null) { if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1); }
      else if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
  }, [currentSessionIndex, focusedArtifactIndex]);

  const jumpToSession = (index: number) => {
      setCurrentSessionIndex(index);
      setFocusedArtifactIndex(null);
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];
  const focusedArtifact = (currentSession && focusedArtifactIndex !== null) ? currentSession.artifacts[focusedArtifactIndex] : null;

  let canGoBack = (focusedArtifactIndex !== null ? focusedArtifactIndex > 0 : currentSessionIndex > 0);
  let canGoForward = (focusedArtifactIndex !== null ? focusedArtifactIndex < 2 : currentSessionIndex < sessions.length - 1);

  return (
    <>
        {isConfirmingClear && (
            <div className="confirmation-modal-overlay">
                <div className="confirmation-modal">
                    <h3>Clear All History?</h3>
                    <p>This will permanently delete all your generated sessions and artifacts. This action cannot be undone.</p>
                    <div className="confirmation-actions">
                        <button className="confirm-cancel" onClick={() => setIsConfirmingClear(false)}>Cancel</button>
                        <button className="confirm-destructive" onClick={confirmClearHistory}>Delete Everything</button>
                    </div>
                </div>
            </div>
        )}

        {previewItem && (
            <div className="preview-overlay">
                <div className="preview-modal">
                    <div className="preview-header">
                        <h3>{previewItem.name}</h3>
                        <button onClick={() => setPreviewItem(null)} className="close-preview-button"><CloseIcon /></button>
                    </div>
                    <div className="preview-content">
                        <iframe srcDoc={previewItem.html} title="Preview" />
                    </div>
                </div>
            </div>
        )}

        <div className="global-controls">
            <button className="icon-btn" onClick={handleShowHistory} title="History"><HistoryIcon /></button>
            <div className="divider"></div>
            <button className="icon-btn" disabled={!canUndo} onClick={undo} title="Undo"><UndoIcon /></button>
            <button className="icon-btn" disabled={!canRedo} onClick={redo} title="Redo"><RedoIcon /></button>
            <div className="divider"></div>
            <button className="icon-btn" onClick={handleShowSettings} title="Settings"><SettingsIcon /></button>
        </div>

        <SideDrawer 
            isOpen={drawerState.isOpen} 
            onClose={() => setDrawerState(s => ({...s, isOpen: false}))} 
            title={drawerState.title}
            position={drawerState.mode === 'history' ? 'left' : 'right'}
        >
            {drawerState.error && <div className="drawer-error">{drawerState.error}</div>}
            
            {isLoading && drawerState.mode === 'variations' && !drawerState.error && componentVariations.length === 0 && (
                <div className="loading-state"><ThinkingIcon /> Designing...</div>
            )}

            {drawerState.mode === 'history' && (
                <div className="history-panel">
                    {sessions.length === 0 ? (
                        <div className="empty-history">No history yet. Start creating!</div>
                    ) : (
                        <div className="history-list">
                            {sessions.slice().reverse().map((sess, i) => {
                                const originalIndex = sessions.length - 1 - i;
                                return (
                                    <div key={sess.id} className={`history-item ${originalIndex === currentSessionIndex ? 'active' : ''}`} onClick={() => jumpToSession(originalIndex)}>
                                        <div className="history-item-content">
                                            <div className="history-prompt">{sess.prompt}</div>
                                            <div className="history-meta">{new Date(sess.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                        <button className="delete-session-btn" onClick={(e) => handleDeleteSession(sess.id, e)}><TrashIcon /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            
            {drawerState.mode === 'settings' && (
                <div className="settings-panel">
                    <div className="setting-group">
                        <label>CSS Framework</label>
                        <select value={settings.framework} onChange={(e) => setSettings(s => ({...s, framework: e.target.value as any}))}>
                            <option value="vanilla">Vanilla CSS</option>
                            <option value="tailwind">Tailwind CSS (CDN)</option>
                            <option value="react-mui">React + Material UI (CDN)</option>
                            <option value="bootstrap">Bootstrap 5 (CDN)</option>
                            <option value="foundation">Foundation 6 (CDN)</option>
                        </select>
                    </div>
                    <div className="setting-group">
                        <label>Data Context</label>
                        <textarea value={settings.dataContext} onChange={(e) => setSettings(s => ({...s, dataContext: e.target.value}))} placeholder='e.g. JSON data description' rows={4} />
                    </div>
                    <div className="setting-group danger-zone">
                        <label>Danger Zone</label>
                        <button onClick={() => setIsConfirmingClear(true)} className="clear-history-btn">Clear All History</button>
                    </div>
                </div>
            )}

            {drawerState.mode === 'enhance' && (
                <div className="enhance-panel">
                    <button className="enhance-option" onClick={() => handleEnhance('a11y')}>
                        <span className="icon">♿</span>
                        <div className="text"><strong>Fix Accessibility</strong><span>ARIA labels, contrast & semantic tags.</span></div>
                    </button>
                    <button className="enhance-option" onClick={() => handleEnhance('responsive')}>
                        <span className="icon">📱</span>
                        <div className="text"><strong>Responsive Fix</strong><span>Media queries & layout flex.</span></div>
                    </button>
                    <button className="enhance-option" onClick={() => handleEnhance('dummy')}>
                        <span className="icon">🎲</span>
                        <div className="text"><strong>Inject Dummy Data</strong><span>Realistic names, text, & images.</span></div>
                    </button>
                    <button className="enhance-option" onClick={() => handleEnhance('tailwind')}>
                        <span className="icon">🌊</span>
                        <div className="text"><strong>Convert to Tailwind</strong><span>Clean utility classes.</span></div>
                    </button>
                    <button className="enhance-option" onClick={() => handleEnhance('format')}>
                        <span className="icon">📝</span>
                        <div className="text"><strong>Format Code</strong><span>Clean formatting & indentation.</span></div>
                    </button>
                </div>
            )}
            
            {drawerState.mode === 'code' && <CodeEditor initialValue={drawerState.data} onSave={updateArtifactCode} />}
            
            {drawerState.mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                             <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setPreviewItem(v); }}><ExpandIcon /></button>
                             <div className="sexy-preview"><iframe srcDoc={v.html} title={v.name} loading="lazy" /></div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                    {componentVariations.length > 0 && (
                        <button className="load-more-btn" onClick={handleLoadMoreVariations} disabled={isLoading || componentVariations.length >= 6}>
                            {isLoading ? <ThinkingIcon /> : <SparklesIcon />} {isLoading ? "Generating..." : "Generate More"}
                        </button>
                    )}
                </div>
            )}
            
            {drawerState.mode === 'layouts' && (
                <div className="sexy-grid">
                    {LAYOUT_OPTIONS.map((lo, i) => {
                        const baseHtml = focusedArtifact ? (focusedArtifact.originalHtml || focusedArtifact.html) : lo.previewHtml;
                        const previewHtml = lo.name === "Standard" ? baseHtml : `<style>${lo.css}</style><div class="layout-container">${baseHtml}</div>`;
                        return (
                            <div key={i} className="sexy-card" onClick={() => applyLayout(lo)}>
                                <button className="expand-btn" onClick={(e) => handlePreviewLayout(e, lo)}><ExpandIcon /></button>
                                <div className="sexy-preview">
                                    <iframe srcDoc={previewHtml} title={lo.name} loading="lazy" />
                                </div>
                                <div className="sexy-label">{lo.name}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </SideDrawer>

        <div className="immersive-app">
            <DottedGlowBackground gap={24} speedScale={0.5} />
            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                 {!hasStarted && (
                     <div className="empty-state">
                         <div className="empty-content">
                             <h1>Flash UI</h1>
                             <p>Creative UI generation in a flash</p>
                             <button className="surprise-button" onClick={handleSurpriseMe} disabled={isLoading}><SparklesIcon /> Surprise Me</button>
                         </div>
                     </div>
                 )}
                {sessions.map((session, sIndex) => (
                    <div key={session.id} className={`session-group ${sIndex === currentSessionIndex ? 'active-session' : (sIndex < currentSessionIndex ? 'past-session' : 'future-session')}`}>
                        <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                            {session.artifacts.map((artifact, aIndex) => (
                                <ArtifactCard key={artifact.id} artifact={artifact} isFocused={focusedArtifactIndex === aIndex} onClick={() => setFocusedArtifactIndex(aIndex)} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             {canGoBack && <button className="nav-handle left" onClick={prevItem}><ArrowLeftIcon /></button>}
             {canGoForward && <button className="nav-handle right" onClick={nextItem}><ArrowRightIcon /></button>}
            
            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="iteration-chat-container">
                    <div className={`iteration-wrapper ${isLoading ? 'loading' : ''}`}>
                        <input ref={iterationInputRef} type="text" placeholder="Refine this component..." value={iterationInput} onChange={handleIterationInputChange} onKeyDown={handleIterationKeyDown} disabled={isLoading} />
                        <button className="iteration-send-btn" onClick={handleIterate} disabled={isLoading || !iterationInput.trim()}>
                            {isLoading ? <ThinkingIcon /> : <ArrowUpIcon />}
                        </button>
                    </div>
                 </div>
                 <div className="active-prompt-label">{currentSession?.prompt}</div>
                 <div className="action-buttons">
                    <button onClick={() => setFocusedArtifactIndex(null)}><GridIcon /> Grid</button>
                    <button onClick={handleShowEnhance}><WandIcon /> Enhance</button>
                    <button className="variations-btn-pulse" onClick={handleGenerateVariations} disabled={isLoading} title="Generate design variations of this focused component"><SparklesIcon /> Variations</button>
                    <button onClick={handleShowLayouts}><LayoutIcon /> Layouts</button>
                    <button onClick={handleShowCode}><CodeIcon /> Code</button>
                    <button onClick={handleCopyCode}><CopyIcon /> {copyButtonText}</button>
                    <button onClick={handleDownload}><DownloadIcon /> Save</button>
                 </div>
            </div>

            <div className={`floating-input-container ${focusedArtifactIndex !== null ? 'hidden' : ''}`}>
                <div className={`input-wrapper ${isLoading ? 'loading' : ''}`}>
                    {!inputValue && !isLoading && (
                        <div className="animated-placeholder" key={placeholderIndex}>
                            <span className="placeholder-text">{placeholders[placeholderIndex]}</span>
                            <span className="tab-hint">Tab</span>
                        </div>
                    )}
                    {!isLoading ? (
                        <input ref={inputRef} type="text" value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} />
                    ) : (
                        <div className="input-generating-label">
                            <span className="generating-prompt-text">{currentSession?.prompt}</span>
                            <ThinkingIcon />
                        </div>
                    )}
                    <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()}><ArrowUpIcon /></button>
                </div>
            </div>
        </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
