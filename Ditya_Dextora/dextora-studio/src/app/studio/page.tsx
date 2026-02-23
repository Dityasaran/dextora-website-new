"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Player } from "@remotion/player";
import { AIComposition, Scene } from "@/remotion/AIComposition";
import { ReelComposition, ReelSegment } from "@/remotion/reels/ReelComposition";
import { Video, ChevronLeft, Loader2, Play, Download, Settings2, Scissors, Activity, Layers, Sparkles } from "lucide-react";

type GenerationStage = "idle" | "generating" | "rendering" | "ready" | "error";

interface ProgressState {
    step: string;
    detail: string;
    progress: number;
}

export default function StudioDashboard() {
    const router = useRouter();

    // Settings State
    const [prompt, setPrompt] = useState("");
    const [duration, setDuration] = useState(30);
    const [videoMode, setVideoMode] = useState<"normal" | "reels">("normal");

    // Generation State
    const [stage, setStage] = useState<GenerationStage>("idle");
    const [progress, setProgress] = useState<ProgressState>({ step: "", detail: "", progress: 0 });
    const [errorMessage, setErrorMessage] = useState("");

    // Data State
    const [title, setTitle] = useState("Cinematic Generation");
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setStage("generating");
        setErrorMessage("");
        setProgress({ step: "INTELLIGENCE ENGINE", detail: "Structuring cinematic narrative (Gemini)...", progress: 10 });

        try {
            // 1. Generate Outline & Scenes
            const outlineRoute = videoMode === "reels" ? "/api/generate-reel" : "/api/scenes";
            const outlineRes = await fetch(outlineRoute, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, duration, style: "Cinematic", animationLevel: "High" }),
            });
            const outlineData = await outlineRes.json();
            if (!outlineRes.ok) throw new Error(outlineData.error || "Outline generation failed");

            const generatedTitle = outlineData.plan?.title || outlineData.data?.title || prompt;
            let generatedScenes: Scene[] = [];

            if (videoMode === "reels") {
                generatedScenes = (outlineData.plan.segments || []).map((seg: any, i: number) => ({ ...seg, id: i }));
            } else {
                generatedScenes = outlineData.data.scenes || [];
            }

            setTitle(generatedTitle);

            // 2. Generate Media Assets (Linear progress simulation for UX)
            setProgress({ step: "VISUALS & AUDIO", detail: "Synthesizing assets via Veo & TTS...", progress: 40 });

            const updatedScenes = [...generatedScenes];
            for (let i = 0; i < updatedScenes.length; i++) {
                const scene = updatedScenes[i];

                // Progress update per scene
                const progressPercent = 40 + Math.floor(((i + 1) / updatedScenes.length) * 40);
                setProgress(p => ({ ...p, detail: `Generating Scene ${i + 1}/${updatedScenes.length}...`, progress: progressPercent }));

                // Audio
                if (scene.script) {
                    const ttsRes = await fetch("/api/tts", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: scene.script, voice: "male-deep" }),
                    });
                    if (ttsRes.ok) {
                        updatedScenes[i].ttsAudioUrl = (await ttsRes.json()).audioUrl;
                    }
                }

                if (videoMode === "reels" && scene.type === "avatar") {
                    updatedScenes[i].avatarVideoUrl = "/videos/avatar-fallback.mp4"; // Avatar placeholder
                } else if (scene.visualPrompt) {
                    // Visual (Veo -> Imagen)
                    const visualRes = await fetch("/api/generate-visual", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: scene.visualPrompt, sceneId: i, isVertical: videoMode === "reels" }),
                    });
                    if (visualRes.ok) {
                        const visualData = await visualRes.json();
                        if (visualData.type === "video") {
                            updatedScenes[i].videoUrl = visualData.url;
                            updatedScenes[i].visualAsset = visualData.url;
                        }
                        else if (visualData.type === "image") {
                            updatedScenes[i].imageUrls = visualData.urls;
                            updatedScenes[i].visualAsset = visualData.urls[0]; // Set visualAsset to the first Imagen framework image
                        }

                        // Strict check to ensure visual generation occurred as commanded by user
                        if (!updatedScenes[i].visualAsset && !updatedScenes[i].videoUrl && (!updatedScenes[i].imageUrls || updatedScenes[i].imageUrls!.length === 0)) {
                            throw new Error(`Visual generation for scene ${i + 1} returned no visual asset URLs.`);
                        }
                    } else {
                        const errorData = await visualRes.json().catch(() => ({}));
                        throw new Error(`Visual Engine Error (Scene ${i + 1}): ${errorData.error || visualRes.statusText}`);
                    }
                } else {
                    throw new Error(`Gemini Error (Scene ${i + 1}): No visualPrompt was generated by the language model.`);
                }
            }

            setScenes(updatedScenes);

            // 3. Render Final Video
            setStage("rendering");
            setProgress({ step: "REMOTION RENDERER", detail: "Compositing final video file...", progress: 90 });

            const renderRes = await fetch("/api/render", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    videoMode === "reels"
                        ? { isReel: true, title: generatedTitle, duration, segments: updatedScenes }
                        : { title: generatedTitle, duration, style: "Cinematic", scenes: updatedScenes }
                )
            });
            const renderData = await renderRes.json();
            if (!renderRes.ok) throw new Error(renderData.error || "Rendering failed");

            setFinalVideoUrl(renderData.videoUrl);
            setProgress({ step: "COMPLETE", detail: "Video successfully rendered.", progress: 100 });
            setStage("ready");

        } catch (e: any) {
            setErrorMessage(e.message);
            setStage("error");
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A14] text-[#F0EFF4] flex flex-col font-heading">

            {/* --- DASHBOARD HEADER --- */}
            <header className="h-16 border-b border-white/10 flex flex-shrink-0 items-center justify-between px-6 bg-[#05050A]">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="hover:text-white text-gray-400 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-[#7B61FF]/20 border border-[#7B61FF]/50 flex items-center justify-center">
                        <Video className="text-[#7B61FF] w-4 h-4" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Studio Engine</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#10b981]/10 border border-[#10b981]/20">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                        <span className="text-xs font-data text-[#10b981]">SYSTEM ONLINE</span>
                    </div>
                </div>
            </header>

            {/* --- WORKSPACE GRID --- */}
            <main className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL: CONFIGURATION */}
                <aside className="w-[400px] flex-shrink-0 border-r border-white/10 bg-[#0A0A14] flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-sm uppercase tracking-widest font-data text-gray-500 mb-6 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" /> Generation Params
                        </h2>

                        <div className="space-y-6 text-sm">
                            <div>
                                <label className="block text-gray-400 mb-2 font-data text-xs">CINEMATIC PROMPT</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the cinematic masterpiece you want to create..."
                                    className="w-full h-32 bg-[#05050A] border border-white/10 rounded-xl p-4 text-[#F0EFF4] placeholder-gray-600 focus:border-[#7B61FF] focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/50 transition-all font-data resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-2 font-data text-xs">ASPECT / MODE</label>
                                    <div className="relative">
                                        <select
                                            value={videoMode}
                                            onChange={(e) => setVideoMode(e.target.value as "normal" | "reels")}
                                            className="w-full bg-[#05050A] border border-white/10 rounded-lg py-3 px-4 appearance-none focus:border-[#38bdf8] focus:outline-none focus:ring-1 focus:ring-[#38bdf8]/50"
                                        >
                                            <option value="normal">Cinematic (16:9)</option>
                                            <option value="reels">Vertical Reel (9:16)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 font-data text-xs">DURATION</label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full bg-[#05050A] border border-white/10 rounded-lg py-3 px-4 appearance-none focus:border-[#38bdf8] focus:outline-none focus:ring-1 focus:ring-[#38bdf8]/50"
                                    >
                                        <option value={15}>15 Seconds</option>
                                        <option value={30}>30 Seconds</option>
                                        <option value={60}>60 Seconds</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 mt-auto border-t border-white/5 bg-[#05050A]">
                        <button
                            onClick={handleGenerate}
                            disabled={stage === "generating" || stage === "rendering" || !prompt.trim()}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#38bdf8] text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {(stage === "generating" || stage === "rendering") ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> EXECUTING...</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> INITIALIZE RENDER</>
                            )}
                        </button>
                    </div>
                </aside>

                {/* RIGHT PANEL: PREVIEW & TELEMETRY */}
                <section className="flex-1 flex flex-col bg-[#05050A] relative overflow-hidden">
                    {/* Dynamic Background */}
                    <div className="absolute inset-0 bg-[#38bdf8]/[0.02] pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[#7B61FF]/[0.05] to-transparent pointer-events-none" />

                    <div className="flex-1 p-8 flex flex-col items-center justify-center relative z-10">

                        {stage === "idle" && (
                            <div className="text-center text-gray-600 flex flex-col items-center">
                                <Video className="w-16 h-16 mb-4 opacity-20" />
                                <p className="font-data text-sm uppercase tracking-widest">Awaiting Prompt Input</p>
                            </div>
                        )}

                        {(stage === "generating" || stage === "rendering") && (
                            <div className="w-full max-w-2xl bg-[#0A0A14] border border-white/10 rounded-[2rem] p-10 flex flex-col shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#38bdf8]/10 blur-[60px]" />
                                <h2 className="text-2xl font-drama italic mb-8 flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#38bdf8]" />
                                    Processing Pipeline
                                </h2>

                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <div className="flex justify-between text-xs font-data mb-2 text-gray-400">
                                            <span className="text-[#38bdf8]">{progress.step}</span>
                                            <span>{progress.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#7B61FF] to-[#38bdf8] transition-all duration-500 ease-out"
                                                style={{ width: `${progress.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Telemetry Log */}
                                    <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-data text-xs text-gray-400 h-24 flex items-end">
                                        <p className="w-full truncate">{`> ${progress.detail}`}<span className="inline-block w-1.5 h-3 bg-[#38bdf8] ml-1 animate-blink align-middle"></span></p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {stage === "error" && (
                            <div className="w-full max-w-2xl bg-[#1A0A0A] border border-[#ef4444]/30 rounded-[2rem] p-10 flex flex-col text-center shadow-2xl">
                                <div className="text-[#ef4444] mb-4"><Activity className="w-12 h-12 mx-auto" /></div>
                                <h2 className="text-2xl font-bold mb-2">System Error</h2>
                                <p className="text-gray-400 font-data text-sm bg-black/50 p-4 rounded-xl border border-[#ef4444]/20">{errorMessage}</p>
                                <button onClick={() => setStage("idle")} className="mt-8 px-6 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 self-center font-data text-sm">RESET ENGINE</button>
                            </div>
                        )}

                        {stage === "ready" && (
                            <div className="w-full max-w-5xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-2xl font-bold">{title}</h2>
                                    <div className="flex gap-3">
                                        {finalVideoUrl && (
                                            <a href={finalVideoUrl} download className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-data text-xs flex items-center gap-2 transition-colors">
                                                <Download className="w-4 h-4" /> EXPORT MP4
                                            </a>
                                        )}
                                        <button onClick={() => { setStage("idle"); setPrompt(""); }} className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 rounded-lg font-data text-xs flex items-center gap-2 text-gray-400 transition-colors">
                                            <Scissors className="w-4 h-4" /> NEW PROJECT
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full flex justify-center bg-black/60 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[#7B61FF]/[0.02] group-hover:bg-[#7B61FF]/[0.05] transition-colors pointer-events-none" />
                                    {finalVideoUrl ? (
                                        <video
                                            src={finalVideoUrl}
                                            controls
                                            autoPlay
                                            className={`rounded-2xl shadow-lg ${videoMode === 'reels' ? 'h-[600px] w-auto aspect-[9/16]' : 'w-full aspect-video'} object-contain bg-black`}
                                        />
                                    ) : (
                                        <Player
                                            component={videoMode === 'reels' ? (ReelComposition as any) : (AIComposition as any)}
                                            inputProps={videoMode === 'reels' ? { title, duration, segments: scenes } as any : { title, duration, scenes, style: "Cinematic" } as any}
                                            durationInFrames={Math.round(duration * 30)}
                                            fps={30}
                                            compositionWidth={videoMode === 'reels' ? 1080 : 1280}
                                            compositionHeight={videoMode === 'reels' ? 1920 : 720}
                                            style={{
                                                width: videoMode === 'reels' ? "auto" : "100%",
                                                height: videoMode === 'reels' ? "600px" : "100%",
                                                aspectRatio: videoMode === 'reels' ? "9/16" : "16/9",
                                                borderRadius: "16px",
                                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                                            }}
                                            controls
                                            autoPlay
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </section>

            </main>
        </div>
    );
}
