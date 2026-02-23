"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@remotion/player";
import { AIComposition, Scene } from "@/remotion/AIComposition";
import { ReelComposition } from "@/remotion/reels/ReelComposition";
import { Download, Edit3, Loader2, Play, Wand2, Plus, MoveUp, MoveDown, Trash2, RefreshCcw, Sparkles } from "lucide-react";

type GenerationStage =
  | "input"
  | "generating_scenes"
  | "editor"
  | "generating_media"
  | "rendering"
  | "ready"
  | "error";

interface ProgressState {
  scenes: number;
  visuals: number;
  audio: number;
  rendering: boolean;
  totalVisuals: number;
}

const EXAMPLE_PROMPTS = [
  "✨ A magical forest with glowing fireflies at night",
  "🎓 A 3D animated explainer about how solar panels work",
  "🚀 Epic cinematic intro for a tech startup",
  "🌊 Underwater ocean scene with colorful coral reef",
  "🎵 Music visualizer with neon geometric shapes",
  "📚 Animated whiteboard explaining quantum physics",
];

export default function Home() {
  // Stage State
  const [stage, setStage] = useState<GenerationStage>("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Form State
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState("Educational");
  const [animationLevel, setAnimationLevel] = useState("Medium");
  const [voice, setVoice] = useState("male-deep");
  const [videoMode, setVideoMode] = useState<"normal" | "reels">("normal");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");

  // Data State
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [title, setTitle] = useState("Generated Video");
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({ scenes: 0, visuals: 0, audio: 0, rendering: false, totalVisuals: 0 });
  const [history, setHistory] = useState<any[]>([]);

  // AI Editor State
  const [aiInstruction, setAiInstruction] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);

  const handleExampleClick = (example: string) => {
    const cleaned = example.replace(/^[^\w\s]+\s*/, "").replace(/^\s+/, "");
    setPrompt(cleaned);
  };

  const handleGenerateScenes = async () => {
    if (!prompt) return;
    setStage("generating_scenes");
    setErrorMessage("");

    try {
      if (videoMode === "reels") {
        const res = await fetch("/api/generate-reel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, duration }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate reel");

        setTitle(data.plan.title || prompt);
        // Map ReelSegment objects into our generic local state array
        // We add IDs so React keys work
        const adaptedSegments = (data.plan.segments || []).map((seg: any, i: number) => ({
          ...seg,
          id: i
        }));
        setScenes(adaptedSegments);
      } else {
        const res = await fetch("/api/scenes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, duration, style, animationLevel }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate scenes");

        setTitle(data.data.title || prompt);
        setScenes(data.data.scenes || []);
      }
      setStage("editor");
    } catch (e: any) {
      setErrorMessage(e.message);
      setStage("error");
    }
  };

  const handleGenerateMedia = async () => {
    setStage("generating_media");
    setProgress({ scenes: scenes.length, visuals: 0, audio: 0, rendering: false, totalVisuals: scenes.length });
    setErrorMessage("");

    const updatedScenes = [...scenes];

    try {
      // Process Each Scene/Segment incrementally
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];

        if (videoMode === "reels") {
          // --- REELS MODE DATA FETCHING ---

          if (scene.type === "avatar") {
            // 1. Avatar Segment: Generate Voiceover TTS
            if (scene.script) {
              const ttsRes = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: scene.script, voice }),
              });
              if (ttsRes.ok) {
                const ttsData = await ttsRes.json();
                updatedScenes[i].ttsAudioUrl = ttsData.audioUrl;
              }
              setProgress(p => ({ ...p, audio: p.audio + 1 }));
            }
            // Mock avatar video for now
            updatedScenes[i].avatarVideoUrl = "/videos/avatar-fallback.mp4";

          } else if (scene.type === "visual") {
            // 2. Visual Segment: Generate Unified Visual Background (Veo -> Imagen fallback)
            if (scene.visualPrompt) {
              const visualRes = await fetch("/api/generate-visual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: scene.visualPrompt, sceneId: i, isVertical: true }),
              });
              if (visualRes.ok) {
                const visualData = await visualRes.json();
                if (visualData.type === "video") {
                  updatedScenes[i].videoUrl = visualData.url;
                } else if (visualData.type === "image") {
                  updatedScenes[i].imageUrls = visualData.urls;
                }
              }
              setProgress(p => ({ ...p, visuals: p.visuals + 1 }));
            }
          }

        } else {
          // --- NORMAL VIDEO MODE DATA FETCHING ---

          // 1. Generate Voiceover TTS
          if (scene.script) {
            const ttsRes = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: scene.script, voice }),
            });
            if (ttsRes.ok) {
              const ttsData = await ttsRes.json();
              updatedScenes[i].ttsAudioUrl = ttsData.audioUrl;
            }
            setProgress(p => ({ ...p, audio: p.audio + 1 }));
          }

          // 2. Generate Unified Visual Background (Veo -> Imagen fallback)
          if (scene.visualPrompt) {
            const visualRes = await fetch("/api/generate-visual", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: scene.visualPrompt, sceneId: i, isVertical: aspectRatio === '9:16' }),
            });
            if (visualRes.ok) {
              const visualData = await visualRes.json();
              if (visualData.type === "video") {
                updatedScenes[i].videoUrl = visualData.url;
              } else if (visualData.type === "image") {
                updatedScenes[i].imageUrls = visualData.urls;
              }
            }
            setProgress(p => ({ ...p, visuals: p.visuals + 1 }));
          }
        }

        setScenes([...updatedScenes]);
      }

      // 3. Render Final Video
      setStage("rendering");
      setProgress(p => ({ ...p, rendering: true }));

      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          videoMode === "reels"
            ? { isReel: true, title, duration, segments: updatedScenes }
            : { title, duration, style, scenes: updatedScenes }
        )
      });
      const renderData = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderData.error || "Failed to render video");

      setFinalVideoUrl(renderData.videoUrl);

      // Add to history
      setHistory(prev => [{
        id: Date.now(),
        prompt,
        generatedAt: new Date().toISOString(),
        videoUrl: renderData.videoUrl
      }, ...prev]);

      setStage("ready");

    } catch (e: any) {
      setErrorMessage(e.message);
      setStage("error");
    }
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim()) return;
    setIsAILoading(true);
    try {
      const res = await fetch("/api/edit-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentScenes: scenes, instructions: aiInstruction, duration, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit scenes");
      setScenes(data.scenes);
      setAiInstruction("");
    } catch (e: any) {
      alert("AI Edit Failed: " + e.message);
    } finally {
      setIsAILoading(false);
    }
  };

  // Editor Handlers
  const updateScene = (index: number, field: keyof Scene, value: any) => {
    const newScenes = [...scenes];
    newScenes[index] = { ...newScenes[index], [field]: value };
    setScenes(newScenes);
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === scenes.length - 1) return;

    const newScenes = [...scenes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];
    setScenes(newScenes);
  };

  const deleteScene = (index: number) => {
    const newScenes = scenes.filter((_, i) => i !== index);
    setScenes(newScenes);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => { setStage("input"); setPrompt(""); setScenes([]); setErrorMessage(""); }} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">🎬</div>
          <span className="logo-text">Dextora</span>
          <span className="logo-badge">Studio</span>
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}>
              <section className="hero">
                <h1 className="hero-title">
                  Create Videos with <span className="hero-title-gradient">Dextora</span>
                </h1>
                <p className="hero-subtitle">
                  Describe any video you can imagine — educational, cinematic, intro, explainer — and Dextora will bring it to life with stunning visuals and audio.
                </p>
              </section>

              <div className="search-container">
                <div className="search-wrapper">
                  <div className="search-inner">
                    <span className="search-icon">✨</span>
                    <input
                      className="search-input"
                      type="text"
                      placeholder="Describe the video you want to create..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && prompt && handleGenerateScenes()}
                    />
                    <button className="search-submit" onClick={handleGenerateScenes} disabled={!prompt.trim()}>
                      🎬 Generate Outline
                    </button>
                  </div>
                </div>

                <div className="prompt-examples" style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {EXAMPLE_PROMPTS.map((example, i) => (
                    <button key={i} className="prompt-chip" onClick={() => handleExampleClick(example)} style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '8px 16px', fontSize: '13px', color: '#9d9daf', cursor: 'pointer', transition: '0.2s'
                    }}>
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-panel">
                <button className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
                  ⚙️ {showSettings ? "Hide" : "Show"} Settings
                </button>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div className="settings-content" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <div className="setting-group">
                        <label className="setting-label">Duration</label>
                        <select className="setting-select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                          <option value={30}>30 Seconds</option>
                          <option value={60}>60 Seconds</option>
                          <option value={120}>2 Minutes</option>
                        </select>
                      </div>
                      <div className="setting-group">
                        <label className="setting-label">Video Mode</label>
                        <select className="setting-select" value={videoMode} onChange={(e) => setVideoMode(e.target.value as "normal" | "reels")}>
                          <option value="normal">Normal Video (16:9 Landscape)</option>
                          <option value="reels">Reels / Shorts Mode (9:16 Vertical Avatar)</option>
                        </select>
                      </div>
                      <div className="setting-group">
                        <label className="setting-label">Style</label>
                        <select className="setting-select" value={style} onChange={(e) => setStyle(e.target.value)}>
                          <option value="Educational">Educational</option>
                          <option value="Cinematic">Cinematic</option>
                          <option value="YouTube Automation">YouTube Auto</option>
                          <option value="Storytelling">Storytelling</option>
                        </select>
                      </div>
                      <div className="setting-group">
                        <label className="setting-label">Voice</label>
                        <select className="setting-select" value={voice} onChange={(e) => setVoice(e.target.value)}>
                          <option value="male-deep">Deep Male Voice</option>
                          <option value="male-casual">Casual Male Voice</option>
                          <option value="female-warm">Warm Female Voice</option>
                          <option value="female-energetic">Energetic Female Voice</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* History */}
              {history.length > 0 && (
                <section className="history-section">
                  <div className="section-header">
                    <h2 className="section-title">Recent Generations</h2>
                  </div>
                  <div className="history-grid">
                    {history.map((item) => (
                      <motion.div key={item.id} className="history-item" layout>
                        <div className="history-thumbnail" style={{ position: 'relative' }}>
                          <img src="/next.svg" style={{ opacity: 0.1, width: '50%' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-glow)' }}>
                            🎬
                          </div>
                        </div>
                        <div style={{ padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.prompt}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            {new Date(item.generatedAt).toLocaleString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {stage === "generating_scenes" && (
            <motion.div key="generating_scenes" className="status-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="status-card">
                <div className="status-header">
                  <span className="status-title">Dextora Video Architect</span>
                  <span className="status-badge generating">In Progress</span>
                </div>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Loader2 className="animate-spin text-purple-500 mx-auto mb-4" size={48} />
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Scripting your video...</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Writing scenes, generating narration, and designing precise visual prompts.</p>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "editor" && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>Scene Editor</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Dextora has generated the outline. Fine-tune your clips before rendering.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStage("input")} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>Back</button>
                  <button onClick={handleGenerateMedia} className="btn-download" style={{ fontSize: '14px' }}>🎬 Render Final Video</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {scenes.map((scene, i) => (
                  <div key={scene.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '24px', display: 'flex', gap: '24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-glass)', paddingRight: '20px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: 'rgba(139, 92, 246, 0.2)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                        <button onClick={() => moveScene(i, 'up')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoveUp size={16} /></button>
                        <button onClick={() => moveScene(i, 'down')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoveDown size={16} /></button>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="setting-group">
                          <label className="setting-label">Narration Script</label>
                          <textarea value={scene.script} onChange={(e) => updateScene(i, 'script', e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', height: '100px', resize: 'none', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div className="setting-group" style={{ flex: 1 }}>
                            <label className="setting-label">Duration (sec)</label>
                            <input type="number" value={scene.duration} onChange={(e) => updateScene(i, 'duration', Number(e.target.value))} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)' }} />
                          </div>
                          <div className="setting-group" style={{ flex: 2 }}>
                            <label className="setting-label">Animation Layer</label>
                            <input type="text" value={scene.animation} onChange={(e) => updateScene(i, 'animation', e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="setting-group">
                          <label className="setting-label" style={{ color: 'var(--accent-cyan)' }}>Visual Generation Prompt</label>
                          <textarea value={scene.visualPrompt} onChange={(e) => updateScene(i, 'visualPrompt', e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', height: '120px', resize: 'none', fontFamily: 'inherit' }} />
                        </div>
                      </div>
                    </div>

                    <button onClick={() => deleteScene(i)} style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer', alignSelf: 'flex-start' }}><Trash2 size={20} /></button>
                  </div>
                ))}

                <button onClick={() => setScenes([...scenes, { id: Date.now(), title: "New Scene", duration: 5, script: "New narration", visualPrompt: "Cinematic shot", animation: "fade", transition: "cut", brollPrompt: "" }])} style={{ width: '100%', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--border-glass)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', fontWeight: 600 }}>
                  <Plus size={20} /> Add Scene
                </button>
              </div>
            </motion.div>
          )}

          {(stage === "generating_media" || stage === "rendering") && (
            <motion.div key="progress" className="status-container" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="status-card" style={{ padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Crafting your cinematic video</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Please wait while Dextora generates the assets.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 1 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontWeight: 'bold' }}>✓</span></div>
                    <div style={{ fontWeight: 600 }}>Structuring Scenes</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: progress.audio < progress.totalVisuals && stage === "generating_media" ? 1 : progress.audio === progress.totalVisuals ? 1 : 0.4 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: progress.audio === progress.totalVisuals ? 'rgba(74, 222, 128, 0.2)' : 'rgba(139, 92, 246, 0.2)', color: progress.audio === progress.totalVisuals ? '#4ade80' : 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {progress.audio === progress.totalVisuals ? <span style={{ fontWeight: 'bold' }}>✓</span> : <Loader2 size={16} className="animate-spin" />}
                    </div>
                    <div style={{ fontWeight: 600 }}>Generating Voiceovers ({progress.audio}/{progress.totalVisuals})</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: progress.visuals < progress.totalVisuals && stage === "generating_media" ? 1 : progress.visuals === progress.totalVisuals ? 1 : 0.4 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: progress.visuals === progress.totalVisuals ? 'rgba(74, 222, 128, 0.2)' : progress.visuals < progress.totalVisuals && stage === "generating_media" ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: progress.visuals === progress.totalVisuals ? '#4ade80' : progress.visuals < progress.totalVisuals && stage === "generating_media" ? 'var(--accent-purple)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {progress.visuals === progress.totalVisuals ? <span style={{ fontWeight: 'bold' }}>✓</span> : progress.visuals < progress.totalVisuals && stage === "generating_media" ? <Loader2 size={16} className="animate-spin" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
                    </div>
                    <div style={{ fontWeight: 600 }}>Rendering Visuals ({progress.visuals}/{progress.totalVisuals})</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: stage === "rendering" ? 1 : 0.4 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: stage === "rendering" ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: stage === "rendering" ? 'var(--accent-purple)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {stage === "rendering" ? <Loader2 size={16} className="animate-spin" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
                    </div>
                    <div style={{ fontWeight: 600 }}>Compositing Final Video Engine</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "ready" && (
            <motion.div key="ready" className="video-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ maxWidth: '1200px', width: '100%' }}>
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="video-card" style={{ flex: '1 1 500px', position: 'sticky', top: '100px', zIndex: 10 }}>
                  <div className="video-player-wrapper" style={{ overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
                    {finalVideoUrl ? (
                      <video src={finalVideoUrl} controls autoPlay style={{ width: "100%", height: "100%", objectFit: 'contain', background: '#000' }} />
                    ) : videoMode === "reels" ? (
                      <Player
                        component={ReelComposition}
                        inputProps={{ title, duration, segments: scenes as any }}
                        durationInFrames={Math.round(duration * 30)}
                        fps={30}
                        compositionWidth={1080}
                        compositionHeight={1920}
                        style={{ width: "100%", height: "100%", aspectRatio: "9/16" }}
                        controls
                        autoPlay
                      />
                    ) : (
                      <Player
                        component={AIComposition}
                        inputProps={{ title, duration, scenes, style }}
                        durationInFrames={Math.round(duration * 30)}
                        fps={30}
                        compositionWidth={1280}
                        compositionHeight={720}
                        style={{ width: "100%", height: "100%", aspectRatio: "16/9" }}
                        controls
                        autoPlay
                      />
                    )}
                  </div>

                  <div className="video-info">
                    <div className="video-meta">
                      <div className="video-prompt-section">
                        <span className="video-prompt-label">Your Video</span>
                        <span className="video-prompt" style={{ fontSize: '16px' }}>{prompt}</span>
                      </div>
                      <div className="video-meta-tags">
                        <span className="meta-tag">{duration}s</span>
                        <span className="meta-tag">{style}</span>
                      </div>
                    </div>
                    <div className="history-actions" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleGenerateMedia} className="btn-download" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--accent-purple)' }}>
                          <RefreshCcw size={18} /> Re-Render
                        </button>
                        {finalVideoUrl && (
                          <a href={finalVideoUrl} download className="btn-download" style={{ flex: 1, justifyContent: 'center' }}>
                            <Download size={18} /> Download MP4
                          </a>
                        )}
                      </div>
                      <button onClick={() => { setStage("input"); setPrompt(""); setScenes([]); }} style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, width: '100%', transition: '0.2s' }}>Create New Video</button>
                    </div>
                  </div>
                </div>

                {/* Post-Gen Editor Panel */}
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="search-wrapper" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-glass)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}><Sparkles size={22} className="text-purple-400" /> Video Director</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>Modify the scenes, rewrite the script, or change the visual style of your video below.</p>
                    <div className="search-inner" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <input
                        className="search-input"
                        type="text"
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="e.g. Make scene 2 more cinematic..."
                        style={{ fontSize: '15px', padding: '12px 0' }}
                        onKeyDown={(e) => e.key === "Enter" && handleAIEdit()}
                      />
                      <button className="search-submit" onClick={handleAIEdit} disabled={isAILoading || !aiInstruction} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px' }}>
                        {isAILoading ? <Loader2 size={18} className="animate-spin" /> : "Apply Magic"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '8px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Story Timeline</h3>
                      <span className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{scenes.length} Scenes</span>
                    </div>
                    {scenes.map((scene, i) => (
                      <div key={scene.id} className="history-item" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '1px' }}>Scene {(i + 1).toString().padStart(2, '0')}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => moveScene(i, 'up')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', transition: '0.2s' }}><MoveUp size={14} /></button>
                            <button onClick={() => moveScene(i, 'down')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', transition: '0.2s' }}><MoveDown size={14} /></button>
                            <button onClick={() => deleteScene(i)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '6px', color: '#ef4444', cursor: 'pointer', marginLeft: '8px', transition: '0.2s' }}><Trash2 size={14} /></button>
                          </div>
                        </div>

                        <div className="setting-group">
                          <label className="setting-label">Narration Script (TTS)</label>
                          <textarea value={scene.script} onChange={(e) => updateScene(i, 'script', e.target.value)} placeholder="What the voiceover will say" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', height: '100px', resize: 'none', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5' }} />
                        </div>

                        <div className="setting-group">
                          <label className="setting-label" style={{ color: 'var(--accent-cyan)' }}>Visual Generation Prompt</label>
                          <textarea value={scene.visualPrompt} onChange={(e) => updateScene(i, 'visualPrompt', e.target.value)} placeholder="Describe the background video exactly" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', height: '80px', resize: 'none', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5' }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setScenes([...scenes, { id: Date.now(), title: "New Scene", duration: 5, script: "New narration", visualPrompt: "Cinematic shot", animation: "fade", transition: "cut", brollPrompt: "" }])} className="search-wrapper" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'transparent', border: '2px dashed var(--border-glass)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '16px', borderRadius: '16px' }}>
                      <Plus size={20} /> Add New Scene
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div key="error" style={{ maxWidth: '600px', margin: '40px auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="status-card" style={{ border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ color: '#f87171', fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Generation Failed</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{errorMessage}</p>
                  <button onClick={() => setStage("input")} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Start Over</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
