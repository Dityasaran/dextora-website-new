import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface SceneContainerProps {
    background: React.ReactNode;    // Layer 1: Animated background
    visual?: React.ReactNode;       // Layer 2: B-roll / image / visual element
    text?: React.ReactNode;         // Layer 3: Animated text overlay
    overlay?: React.ReactNode;      // Layer 4: Extra overlays (particles, lower thirds)
    textPosition?: "bottom" | "center" | "top";
    showGradientOverlay?: boolean;
    sceneIndex?: number;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
    background,
    visual,
    text,
    overlay,
    textPosition = "bottom",
    showGradientOverlay = true,
    sceneIndex = 0,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Scene-level fade in/out
    const sceneOpacity = interpolate(
        frame,
        [0, 12, durationInFrames - 12, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    // Scene number indicator animation
    const numberScale = spring({
        frame: frame - 5,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    // Text area alignment
    const textAlign: React.CSSProperties = {
        bottom: { alignItems: "center", justifyContent: "flex-end", paddingBottom: "6%" },
        center: { alignItems: "center", justifyContent: "center" },
        top: { alignItems: "center", justifyContent: "flex-start", paddingTop: "15%" },
    }[textPosition];

    return (
        <AbsoluteFill style={{ opacity: sceneOpacity }}>
            {/* Layer 1: Background */}
            <AbsoluteFill>{background}</AbsoluteFill>

            {/* Layer 2: Visual / B-roll */}
            {visual && <AbsoluteFill>{visual}</AbsoluteFill>}

            {/* Gradient overlay for text readability */}
            {showGradientOverlay && (
                <AbsoluteFill>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "55%",
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                        }}
                    />
                </AbsoluteFill>
            )}

            {/* Subtle vignette */}
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Scene number badge */}
            <div
                style={{
                    position: "absolute",
                    top: 30,
                    left: 30,
                    opacity: interpolate(frame, [8, 18], [0, 0.6], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                    transform: `scale(${numberScale})`,
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                Scene {(sceneIndex + 1).toString().padStart(2, "0")}
            </div>

            {/* Layer 3: Text */}
            {text && (
                <AbsoluteFill
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "5%",
                        ...textAlign,
                    }}
                >
                    {text}
                </AbsoluteFill>
            )}

            {/* Layer 4: Overlays */}
            {overlay && <AbsoluteFill>{overlay}</AbsoluteFill>}

            {/* Animated accent line at bottom */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "3px",
                    width: `${interpolate(frame, [0, durationInFrames], [0, 100])}%`,
                    background: "linear-gradient(90deg, #7c5cfc, #4f7fff, #38bdf8)",
                    boxShadow: "0 0 15px rgba(79, 127, 255, 0.5)",
                }}
            />
        </AbsoluteFill>
    );
};
