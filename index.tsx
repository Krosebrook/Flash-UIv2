
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
    WandIcon
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
  // Initialize with loaded sessions or empty array
  const { 
      state: sessions, 
      set: setSessions, 
      undo, 
      redo, 
      canUndo, 
      canRedo 
  } = useHistory<Session[]>(loadSessions());

  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(() => {
      // If we loaded sessions, start at the last one
      const loaded = loadSessions();
      return loaded.length > 0 ? loaded.length - 1 : -1;
  });
  
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  
  const [settings, setSettings] = useState<GenerationSettings>({
      framework: 'vanilla',
      dataContext: '',
      autoA11y: false
  });

  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'layouts' | 'settings' | 'enhance' | null;
      title: string;
      data: any;
      error?: string | null;
  }>({ isOpen: false, mode: null, title: '', data: null, error: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [previewItem, setPreviewItem] = useState<{html: string, name: string} | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Persistence Effect
  useEffect(() => {
      const handler = setTimeout(() => {
          saveSessions(sessions);
      }, 1000); // Debounce save by 1s to avoid thrashing during streaming
      return () => clearTimeout(handler);
  }, [sessions]);

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  useEffect(() => {
      // Setup keyboard shortcuts for undo/redo
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) {
                 if (canRedo) redo();
              } else {
                 if (canUndo) undo();
              }
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
        if (gridScrollRef.current) {
            gridScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }
  }, [focusedArtifactIndex]);

  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
      const fetchDynamicPlaceholders = async () => {
          try {
              const apiKey = process.env.API_KEY;
              if (!apiKey) return;
              const ai = new GoogleGenAI({ apiKey });
              const response = await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: { 
                      role: 'user', 
                      parts: [{ 
                          text: 'Generate 20 creative, short, diverse UI component prompts (e.g. "bioluminescent task list"). Return ONLY a raw JSON array of strings.' 
                      }] 
                  }
              });
              const text = response.text || '[]';
              const jsonMatch = text.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                  const newPlaceholders = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                      const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                      setPlaceholders(prev => [...prev, ...shuffled]);
                  }
              }
          } catch (e) {
              console.warn("Silently failed to fetch dynamic placeholders", e);
          }
      };
      setTimeout(fetchDynamicPlaceholders, 1000);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleGenerateVariations = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setComponentVariations([]);
    setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id, error: null });

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        let frameworkInstruction = '';
        if (settings.framework === 'tailwind') frameworkInstruction = 'Use Tailwind CSS via CDN.';
        else if (settings.framework === 'react-mui') frameworkInstruction = 'Use React and Material UI via CDN. Return a complete HTML file.';

        const prompt = `
You are a master UI/UX designer. Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${currentSession.prompt}".
${frameworkInstruction}
For EACH variation, invent a unique design persona name and generate high-fidelity HTML/CSS.
Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
        `.trim();

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
             contents: [{ parts: [{ text: prompt }], role: 'user' }],
             config: { temperature: 1.2 }
        });

        for await (const variation of parseJsonStream(responseStream)) {
            if (variation.name && variation.html) {
                setComponentVariations(prev => [...prev, variation]);
            }
        }
    } catch (e: any) {
        console.error("Error generating variations:", e);
        setDrawerState(prev => ({ 
            ...prev, 
            error: "We encountered an error while designing variations. Please try again." 
        }));
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, settings.framework]);

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
      
      // Don't close drawer immediately to allow continuous editing, 
      // but maybe show a success toast in a real app.
  };

  const handleEnhance = async (type: 'a11y' | 'format' | 'dummy') => {
    if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
    
    setIsLoading(true);
    setDrawerState(s => ({ ...s, isOpen: false })); // Close enhance menu
    
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY missing");
        const ai = new GoogleGenAI({ apiKey });
        
        const currentSession = sessions[currentSessionIndex];
        const artifact = currentSession.artifacts[focusedArtifactIndex];
        
        let enhancementPrompt = '';
        if (type === 'a11y') enhancementPrompt = 'Analyze the following HTML and fix any accessibility issues (ARIA labels, contrast, semantic tags). Return only the corrected HTML.';
        if (type === 'format') enhancementPrompt = 'Format the following code to be clean, indented, and compliant with Prettier standards. Fix linting errors. Return only the code.';
        if (type === 'dummy') enhancementPrompt = 'Inject realistic dummy data into this component to make it look used and populated. Return only the HTML.';

        const fullPrompt = `${enhancementPrompt}\n\nCode:\n${artifact.html}`;

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

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to delete all history? This cannot be undone.")) {
        clearSessions();
        setSessions([]);
        setCurrentSessionIndex(-1);
        setFocusedArtifactIndex(null);
        setDrawerState(s => ({...s, isOpen: false}));
    }
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

  const handleDownload = () => {
    if (focusedArtifactIndex === null || currentSessionIndex === -1) return;
    const currentSession = sessions[currentSessionIndex];
    const artifact = currentSession.artifacts[focusedArtifactIndex];
    if (!artifact) return;

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
    setCurrentSessionIndex(prev => prev + 1); // Move to the new session
    setFocusedArtifactIndex(null); 

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        let frameworkContext = "";
        if (settings.framework === 'tailwind') {
            frameworkContext = " Use Tailwind CSS via CDN for styling. Ensure all classes are valid.";
        } else if (settings.framework === 'react-mui') {
            frameworkContext = " Generate a single-file React component using Material UI (MUI) via CDN. Output complete HTML with Babel script to render it.";
        } else {
            frameworkContext = " Use vanilla CSS.";
        }

        let dataContext = "";
        if (settings.dataContext) {
            dataContext = ` Use this data context for content: ${settings.dataContext}`;
        }

        const stylePrompt = `
Generate 3 distinct design directions for: "${trimmedInput}". 
Return ONLY a raw JSON array of 3 creative names (e.g. ["Neo-Brutalist Grid", "Glassmorphic Flux", "Minimal Paper Press"]).
        `.trim();

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
                const prompt = `Create a stunning UI component for: "${trimmedInput}". Style: ${styleInstruction}.${frameworkContext}${dataContext} Return ONLY raw HTML. No markdown.`.trim();
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
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [inputValue, isLoading, settings]);

  const handleSurpriseMe = () => {
      const currentPrompt = placeholders[placeholderIndex];
      setInputValue(currentPrompt);
      handleSendMessage(currentPrompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Tab' && !inputValue && !isLoading) {
        event.preventDefault();
        setInputValue(placeholders[placeholderIndex]);
    }
  };

  const nextItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1);
      } else if (currentSessionIndex < sessions.length - 1) {
          setCurrentSessionIndex(currentSessionIndex + 1);
      }
  }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
      } else if (currentSessionIndex > 0) {
          setCurrentSessionIndex(currentSessionIndex - 1);
      }
  }, [currentSessionIndex, focusedArtifactIndex]);

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];

  let canGoBack = (focusedArtifactIndex !== null ? focusedArtifactIndex > 0 : currentSessionIndex > 0);
  let canGoForward = (focusedArtifactIndex !== null ? focusedArtifactIndex < 2 : currentSessionIndex < sessions.length - 1);

  return (
    <>
        {previewItem && (
            <div className="preview-overlay">
                <div className="preview-modal">
                    <div className="preview-header">
                        <h3>{previewItem.name}</h3>
                        <button onClick={() => setPreviewItem(null)} className="close-preview-button">
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="preview-content">
                        <iframe srcDoc={previewItem.html} title="Preview" />
                    </div>
                </div>
            </div>
        )}

        <div className="global-controls">
            <button className="icon-btn" disabled={!canUndo} onClick={undo} title="Undo"><UndoIcon /></button>
            <button className="icon-btn" disabled={!canRedo} onClick={redo} title="Redo"><RedoIcon /></button>
            <div className="divider"></div>
            <button className="icon-btn" onClick={handleShowSettings} title="Settings"><SettingsIcon /></button>
        </div>

        <SideDrawer 
            isOpen={drawerState.isOpen} 
            onClose={() => setDrawerState(s => ({...s, isOpen: false}))} 
            title={drawerState.title}
        >
            {drawerState.error && (
                <div className="drawer-error">
                   {drawerState.error}
                </div>
            )}
            
            {isLoading && drawerState.mode === 'variations' && !drawerState.error && (
                <div className="loading-state"><ThinkingIcon /> Designing...</div>
            )}
            
            {drawerState.mode === 'settings' && (
                <div className="settings-panel">
                    <div className="setting-group">
                        <label>CSS Framework</label>
                        <select 
                            value={settings.framework} 
                            onChange={(e) => setSettings(s => ({...s, framework: e.target.value as any}))}
                        >
                            <option value="vanilla">Vanilla CSS</option>
                            <option value="tailwind">Tailwind CSS (CDN)</option>
                            <option value="react-mui">React + Material UI (CDN)</option>
                        </select>
                        <p className="setting-desc">Determines the tech stack for generated components.</p>
                    </div>
                    <div className="setting-group">
                        <label>Dynamic Data Context</label>
                        <textarea 
                            value={settings.dataContext} 
                            onChange={(e) => setSettings(s => ({...s, dataContext: e.target.value}))}
                            placeholder='e.g. { "users": ["Alice", "Bob"], "status": "active" }'
                            rows={4}
                        />
                        <p className="setting-desc">Provide JSON or a description to populate components with specific data.</p>
                    </div>
                    <div className="setting-group" style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px'}}>
                        <label style={{color: '#fca5a5'}}>Danger Zone</label>
                        <button 
                            onClick={handleClearHistory}
                            style={{
                                background: 'rgba(220, 38, 38, 0.1)',
                                color: '#fca5a5',
                                border: '1px solid rgba(220, 38, 38, 0.3)',
                                padding: '10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '8px'
                            }}
                        >
                            Clear All History
                        </button>
                    </div>
                </div>
            )}

            {drawerState.mode === 'enhance' && (
                <div className="enhance-panel">
                    <button className="enhance-option" onClick={() => handleEnhance('a11y')}>
                        <span className="icon">♿</span>
                        <div className="text">
                            <strong>Accessibility Fix</strong>
                            <span>Auto-correct ARIA labels, contrast, and semantics.</span>
                        </div>
                    </button>
                    <button className="enhance-option" onClick={() => handleEnhance('format')}>
                        <span className="icon">📝</span>
                        <div className="text">
                            <strong>Format & Lint</strong>
                            <span>Clean up code using Prettier standards.</span>
                        </div>
                    </button>
                    <button className="enhance-option" onClick={() => handleEnhance('dummy')}>
                        <span className="icon">🎲</span>
                        <div className="text">
                            <strong>Inject Dummy Data</strong>
                            <span>Populate with realistic placeholder content.</span>
                        </div>
                    </button>
                </div>
            )}
            
            {drawerState.mode === 'code' && (
                <CodeEditor 
                    initialValue={drawerState.data} 
                    onSave={updateArtifactCode} 
                />
            )}
            
            {drawerState.mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                             <button 
                                className="expand-btn" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewItem(v);
                                }}
                                title="Expand Preview"
                             >
                                 <ExpandIcon />
                             </button>
                             <div className="sexy-preview"><iframe srcDoc={v.html} title={v.name} /></div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                </div>
            )}
            
            {drawerState.mode === 'layouts' && (
                <div className="sexy-grid">
                    {LAYOUT_OPTIONS.map((lo, i) => (
                        <div key={i} className="sexy-card" onClick={() => applyLayout(lo)}>
                            <div className="sexy-preview">
                                <div className="preview-container-inner" dangerouslySetInnerHTML={{ __html: lo.previewHtml }} />
                            </div>
                            <div className="sexy-label">{lo.name}</div>
                        </div>
                    ))}
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
                 <div className="active-prompt-label">{currentSession?.prompt}</div>
                 <div className="action-buttons">
                    <button onClick={() => setFocusedArtifactIndex(null)}><GridIcon /> Grid</button>
                    <button onClick={handleShowEnhance}><WandIcon /> Enhance</button>
                    <button onClick={handleGenerateVariations} disabled={isLoading} title="Generate design variations"><SparklesIcon /> Variations</button>
                    <button onClick={handleShowLayouts}><LayoutIcon /> Layouts</button>
                    <button onClick={handleShowCode}><CodeIcon /> Code</button>
                    <button onClick={handleDownload}><DownloadIcon /> Save</button>
                 </div>
            </div>
            <div className="floating-input-container">
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
