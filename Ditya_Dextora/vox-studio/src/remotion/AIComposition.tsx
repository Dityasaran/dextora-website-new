import React from "react";
import {
    AbsoluteFill,
    Sequence,
    useVideoConfig,
    useCurrentFrame,
    Audio,
    Video,
    interpolate,
    spring,
    staticFile,
    Img
} from "remotion";

import { AnimatedText } from "./components/AnimatedText";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { SceneContainer } from "./components/SceneContainer";
import { FadeTransition } from "./components/FadeTransition";

export interface Scene {
    id: number | string;
    title: string;
    duration: number; // in seconds
    script: string;
    visualPrompt: string;
    animation: string;
    transition: string;
    brollPrompt: string;
    videoUrl?: string;
    ttsAudioUrl?: string;

    // Reel-specific properties
    type?: "avatar" | "visual";
    avatarVideoUrl?: string;
    imageUrls?: string[];
}

export interface AICompositionProps {
    title: string;
    duration: number;
    scenes: Scene[];
    style: string;
}

// Background color palettes per scene index (cycling)
const SCENE_PALETTES = [
    ["#0f0c29", "#302b63", "#24243e"],      // Deep purple cosmos
    ["#0d1117", "#1a5276", "#2e86c1"],      // Ocean blue
    ["#1a0a2e", "#5b2c6f", "#8e44ad"],      // Electric violet
    ["#0b0e11", "#1b4332", "#2d6a4f"],      // Forest emerald
    ["#1c0a00", "#7b2d26", "#c0392b"],      // Crimson fire
    ["#0a0a2e", "#1e3a5f", "#4a90d9"],      // Sapphire night
    ["#0d0d0d", "#333333", "#666666"],      // Monochrome elegance
    ["#0c1445", "#1a237e", "#3f51b5"],      // Indigo deep
];

// Background types per scene (cycling)
const BG_TYPES: Array<"gradient" | "radialPulse" | "particles" | "aurora"> = [
    "aurora",
    "particles",
    "radialPulse",
    "gradient",
    "aurora",
    "particles",
    "gradient",
    "radialPulse",
];

// Text animation types per scene (cycling)
const TEXT_ANIMATIONS: Array<"wordByWord" | "slideUp" | "scaleIn" | "fade"> = [
    "wordByWord",
    "slideUp",
    "scaleIn",
    "wordByWord",
    "fade",
    "slideUp",
    "wordByWord",
    "scaleIn",
];

// Transition types per scene (cycling)
const TRANSITION_TYPES: Array<"fade" | "slideLeft" | "slideUp" | "zoomFade"> = [
    "zoomFade",
    "slideLeft",
    "fade",
    "slideUp",
    "zoomFade",
    "fade",
    "slideLeft",
    "slideUp",
];

// ========== MAIN COMPOSITION ==========
export const AIComposition: React.FC<any> = ({
    title,
    duration,
    scenes,
    style,
}) => {
    const { fps, durationInFrames } = useVideoConfig();

    const getBgmForStyle = (styleName: string) => {
        return staticFile("audio/bgm-cinematic.mp3");
    };

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* Background Music */}
            <Audio src={getBgmForStyle(style)} volume={0.04} loop />

            {scenes.map((scene: Scene, i: number) => {
                const prevDuration = scenes
                    .slice(0, i)
                    .reduce((acc: number, s: Scene) => acc + s.duration * fps, 0);
                const currentDurationFrames = Math.max(1, Math.round(scene.duration * fps));

                return (
                    <Sequence
                        key={`scene-${scene.id}`}
                        from={Math.round(prevDuration)}
                        durationInFrames={currentDurationFrames}
                    >
                        <ProfessionalScene
                            scene={scene}
                            index={i}
                            totalScenes={scenes.length}
                            fps={fps}
                        />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};

// ========== PROFESSIONAL SCENE COMPONENT ==========
const ProfessionalScene: React.FC<{
    scene: Scene;
    index: number;
    totalScenes: number;
    fps: number;
}> = ({ scene, index, fps }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const palette = SCENE_PALETTES[index % SCENE_PALETTES.length];
    const bgType = BG_TYPES[index % BG_TYPES.length];
    const textAnim = TEXT_ANIMATIONS[index % TEXT_ANIMATIONS.length];
    const transitionType = TRANSITION_TYPES[index % TRANSITION_TYPES.length];

    // ---- Layer 1: Background ----
    let backgroundLayer;
    if (scene.videoUrl) {
        backgroundLayer = <VideoBackground src={scene.videoUrl} />;
    } else if (scene.imageUrls && scene.imageUrls.length > 0) {
        // Fallback to animated Imagen generated image
        backgroundLayer = <AnimatedImageBackground src={scene.imageUrls[0]} />;
    } else {
        // Strict fallback to error/visual placeholder as requested by user to NEVER be black, but we expect our new API logic to always provide at least an image via Imagen fallback.
        backgroundLayer = (
            <AbsoluteFill style={{ backgroundColor: "#222" }}>
                <AnimatedBackground type={bgType} colors={palette} speed={0.8} />
            </AbsoluteFill>
        );
    }


    // ---- Layer 2: Visual overlay (floating shapes / decorative elements) ----
    const visualLayer = <FloatingElements sceneIndex={index} />;

    // ---- Layer 3: Text ----
    const textLayer = scene.script && scene.script.trim() !== "" ? (
        <AnimatedText
            text={scene.script}
            fontSize={index === 0 ? 56 : 44}
            fontWeight={800}
            fontFamily="'Inter', sans-serif"
            animation={textAnim}
            delay={10}
            color="#ffffff"
        />
    ) : null;

    // ---- Layer 4: Title lower-third ----
    const overlayLayer = (
        <LowerThird title={scene.title} index={index} />
    );

    return (
        <FadeTransition type={transitionType} durationFrames={12}>
            <SceneContainer
                background={backgroundLayer}
                visual={visualLayer}
                text={textLayer}
                overlay={overlayLayer}
                textPosition={index === 0 ? "center" : "bottom"}
                sceneIndex={index}
            />

            {/* TTS Audio Narration */}
            {scene.ttsAudioUrl && (
                <Audio
                    src={
                        scene.ttsAudioUrl.startsWith("/")
                            ? staticFile(scene.ttsAudioUrl.slice(1))
                            : scene.ttsAudioUrl
                    }
                    volume={1.8}
                />
            )}
        </FadeTransition>
    );
};

// ========== VIDEO BACKGROUND WITH ZOOM ==========
const VideoBackground: React.FC<{ src: string }> = ({ src }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const scale = interpolate(frame, [0, durationInFrames], [1, 1.12], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill>
            <Video
                src={src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                }}
            />
        </AbsoluteFill>
    );
};

// ========== IMAGE BACKGROUND WITH ZOOM/PAN (IMAGEN FALLBACK) ==========
const AnimatedImageBackground: React.FC<{ src: string }> = ({ src }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.15], {
        extrapolateRight: "clamp",
    });

    const isExternal = src.startsWith("http");
    const imageSource = isExternal ? src : staticFile(src.replace("/assets/", "assets/")); // NextJS public/ = staticFile root

    return (
        <AbsoluteFill>
            <Img
                src={imageSource}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${scale})`,
                }}
            />
        </AbsoluteFill>
    );
};

// ========== FLOATING DECORATIVE ELEMENTS ==========
const FloatingElements: React.FC<{ sceneIndex: number }> = ({ sceneIndex }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Animated geometric shapes
    const shapes = Array.from({ length: 5 }, (_, i) => {
        const baseX = 10 + ((sceneIndex * 37 + i * 67) % 80);
        const baseY = 10 + ((sceneIndex * 53 + i * 43) % 60);
        const size = 40 + (i * 20);
        const speed = 0.3 + (i * 0.15);

        const x = baseX + Math.sin((frame * speed * 0.03) + i) * 15;
        const y = baseY + Math.cos((frame * speed * 0.02) + i * 2) * 10;
        const rotation = interpolate(frame, [0, durationInFrames], [0, 90 + i * 45]);

        const opacity = interpolate(
            frame,
            [0, 20, durationInFrames - 20, durationInFrames],
            [0, 0.08 + (i * 0.02), 0.08 + (i * 0.02), 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const palette = SCENE_PALETTES[sceneIndex % SCENE_PALETTES.length];
        const color = palette[1] || "#4f7fff";

        return (
            <div
                key={i}
                style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    width: size,
                    height: size,
                    borderRadius: i % 2 === 0 ? "50%" : "20%",
                    border: `2px solid ${color}`,
                    opacity,
                    transform: `rotate(${rotation}deg)`,
                    boxShadow: `0 0 ${size}px ${color}40`,
                }}
            />
        );
    });

    return <AbsoluteFill style={{ pointerEvents: "none" }}>{shapes}</AbsoluteFill>;
};

// ========== LOWER THIRD TITLE BAR ==========
const LowerThird: React.FC<{ title: string; index: number }> = ({ title, index }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const slideIn = spring({
        frame: frame - 20,
        fps,
        config: { damping: 15, stiffness: 80, mass: 1 },
    });

    const opacity = interpolate(
        frame,
        [20, 35, durationInFrames - 20, durationInFrames],
        [0, 0.9, 0.9, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
        <div
            style={{
                position: "absolute",
                bottom: 40,
                right: 30,
                opacity,
                transform: `translateX(${(1 - slideIn) * 100}px)`,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(12px)",
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
            }}
        >
            <div
                style={{
                    width: "4px",
                    height: "24px",
                    borderRadius: "2px",
                    background: "linear-gradient(180deg, #7c5cfc, #4f7fff)",
                }}
            />
            <span
                style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "0.5px",
                }}
            >
                {title}
            </span>
        </div>
    );
};
