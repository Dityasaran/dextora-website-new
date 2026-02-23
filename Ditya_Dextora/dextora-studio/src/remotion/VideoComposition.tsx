import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from "remotion";

interface VideoCompositionProps {
    prompt: string;
    settings: Record<string, string | boolean>;
}

export const VideoComposition: React.FC<any> = ({
    prompt,
    settings,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height, durationInFrames } = useVideoConfig();

    // Intro: first 2 seconds (60 frames at 30fps)
    const introEnd = fps * 2;
    // Main content: middle section
    const mainStart = introEnd;
    const mainEnd = durationInFrames - fps * 1.5;
    // Outro: last 1.5 seconds
    const outroStart = mainEnd;

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Animated background particles */}
            <BackgroundParticles frame={frame} width={width} height={height} />

            {/* Intro Card */}
            <Sequence from={0} durationInFrames={introEnd}>
                <IntroCard prompt={prompt} frame={frame} fps={fps} />
            </Sequence>

            {/* Main Content */}
            <Sequence from={mainStart} durationInFrames={mainEnd - mainStart}>
                <MainContent
                    prompt={prompt}
                    settings={settings}
                    frame={frame - mainStart}
                    fps={fps}
                    width={width}
                    height={height}
                />
            </Sequence>

            {/* Outro */}
            <Sequence from={outroStart} durationInFrames={durationInFrames - outroStart}>
                <OutroCard frame={frame - outroStart} fps={fps} />
            </Sequence>
        </AbsoluteFill>
    );
};

// ---- Sub-components ----

const BackgroundParticles: React.FC<{
    frame: number;
    width: number;
    height: number;
}> = ({ frame, width, height }) => {
    const particles = Array.from({ length: 20 }, (_, i) => {
        const x = ((i * 137.5) % width);
        const y = ((i * 73.7 + frame * (0.3 + i * 0.05)) % height);
        const size = 2 + (i % 4);
        const opacity = 0.1 + (i % 5) * 0.05;

        return (
            <div
                key={i}
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: i % 3 === 0
                        ? "rgba(139, 92, 246, 0.6)"
                        : i % 3 === 1
                            ? "rgba(59, 130, 246, 0.6)"
                            : "rgba(6, 182, 212, 0.6)",
                    opacity,
                    filter: `blur(${size > 4 ? 1 : 0}px)`,
                }}
            />
        );
    });

    return <AbsoluteFill>{particles}</AbsoluteFill>;
};

const IntroCard: React.FC<{
    prompt: string;
    frame: number;
    fps: number;
}> = ({ prompt, frame, fps }) => {
    const titleScale = spring({ frame, fps, config: { damping: 12 } });
    const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });
    const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
        extrapolateRight: "clamp",
    });
    const fadeOut = interpolate(frame, [fps * 1.5, fps * 2], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: fadeOut,
            }}
        >
            {/* Glow circle */}
            <div
                style={{
                    position: "absolute",
                    width: 300,
                    height: 300,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%)",
                    filter: "blur(40px)",
                }}
            />

            <div
                style={{
                    transform: `scale(${titleScale})`,
                    opacity: titleOpacity,
                    fontSize: 64,
                    fontWeight: 900,
                    background: "linear-gradient(135deg, #c084fc, #60a5fa, #22d3ee)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textAlign: "center",
                    lineHeight: 1.2,
                    letterSpacing: -2,
                }}
            >
                Dextora
            </div>

            <div
                style={{
                    opacity: subtitleOpacity,
                    fontSize: 20,
                    color: "rgba(255, 255, 255, 0.6)",
                    marginTop: 16,
                    textAlign: "center",
                    maxWidth: "70%",
                    lineHeight: 1.5,
                }}
            >
                {prompt.length > 80 ? prompt.substring(0, 80) + "..." : prompt}
            </div>
        </AbsoluteFill>
    );
};

const MainContent: React.FC<{
    prompt: string;
    settings: Record<string, string | boolean>;
    frame: number;
    fps: number;
    width: number;
    height: number;
}> = ({ prompt, frame, fps, width, height }) => {
    const fadeIn = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Animated text reveal
    const words = prompt.split(" ");
    const wordsPerSecond = 3;
    const framesPerWord = fps / wordsPerSecond;

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: fadeIn,
                padding: "10%",
            }}
        >
            {/* Animated prompt text */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 8,
                    maxWidth: width * 0.7,
                }}
            >
                {words.map((word, i) => {
                    const wordOpacity = interpolate(
                        frame,
                        [i * framesPerWord, i * framesPerWord + 10],
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    );
                    const wordY = interpolate(
                        frame,
                        [i * framesPerWord, i * framesPerWord + 10],
                        [20, 0],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    );

                    return (
                        <span
                            key={i}
                            style={{
                                fontSize: 36,
                                fontWeight: 700,
                                color: "white",
                                opacity: wordOpacity,
                                transform: `translateY(${wordY}px)`,
                                display: "inline-block",
                            }}
                        >
                            {word}
                        </span>
                    );
                })}
            </div>

            {/* Animated waveform bar */}
            <div
                style={{
                    display: "flex",
                    gap: 3,
                    marginTop: 40,
                    alignItems: "center",
                    height: 40,
                }}
            >
                {Array.from({ length: 30 }, (_, i) => {
                    const barHeight =
                        10 +
                        Math.sin(frame * 0.15 + i * 0.5) * 15 +
                        Math.cos(frame * 0.1 + i * 0.3) * 10;
                    return (
                        <div
                            key={i}
                            style={{
                                width: 3,
                                height: Math.max(4, barHeight),
                                borderRadius: 2,
                                background: `hsl(${250 + i * 4}, 80%, 65%)`,
                                opacity: 0.8,
                            }}
                        />
                    );
                })}
            </div>

            {/* Cinematic bars */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: height * 0.08,
                    background: "rgba(0, 0, 0, 0.7)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: height * 0.08,
                    background: "rgba(0, 0, 0, 0.7)",
                }}
            />
        </AbsoluteFill>
    );
};

const OutroCard: React.FC<{
    frame: number;
    fps: number;
}> = ({ frame, fps }) => {
    const fadeIn = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });
    const scale = spring({ frame, fps, config: { damping: 15 } });

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: fadeIn,
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    fontSize: 28,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #c084fc, #60a5fa, #22d3ee)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: 12,
                }}
            >
                Made with Dextora
            </div>

            <div
                style={{
                    fontSize: 14,
                    color: "rgba(255, 255, 255, 0.4)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                }}
            >
                Powered by Dextora AI
            </div>
        </AbsoluteFill>
    );
};
