import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface AnimatedTextProps {
    text: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: number;
    delay?: number;
    animation?: "fade" | "slideUp" | "slideDown" | "scaleIn" | "typewriter" | "wordByWord";
    style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
    text,
    fontSize = 48,
    color = "#ffffff",
    fontFamily = "'Inter', sans-serif",
    fontWeight = 800,
    delay = 0,
    animation = "slideUp",
    style = {},
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const adjustedFrame = frame - delay;

    // Fade out near end of scene
    const fadeOut = interpolate(
        frame,
        [durationInFrames - 15, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    if (animation === "wordByWord") {
        const words = text.split(" ");
        return (
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "12px",
                    opacity: fadeOut,
                    ...style,
                }}
            >
                {words.map((word, i) => {
                    const wordDelay = delay + i * 6;
                    const wordFrame = frame - wordDelay;

                    const wordOpacity = interpolate(wordFrame, [0, 8], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    });

                    const wordScale = spring({
                        frame: wordFrame,
                        fps,
                        config: { damping: 10, stiffness: 200, mass: 0.6 },
                    });

                    const wordY = interpolate(wordFrame, [0, 8], [30, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    });

                    return (
                        <span
                            key={`${i}-${word}`}
                            style={{
                                fontSize,
                                color,
                                fontFamily,
                                fontWeight,
                                opacity: wordOpacity,
                                transform: `scale(${wordScale}) translateY(${wordY}px)`,
                                display: "inline-block",
                                textShadow:
                                    "2px 2px 0 rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)",
                            }}
                        >
                            {word}
                        </span>
                    );
                })}
            </div>
        );
    }

    // Single-block animations
    let opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    let translateY = 0;
    let translateX = 0;
    let scale = 1;

    switch (animation) {
        case "slideUp":
            translateY = interpolate(adjustedFrame, [0, 20], [60, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            });
            break;
        case "slideDown":
            translateY = interpolate(adjustedFrame, [0, 20], [-60, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            });
            break;
        case "scaleIn":
            scale = spring({
                frame: adjustedFrame,
                fps,
                config: { damping: 12, stiffness: 150, mass: 0.8 },
            });
            break;
        case "fade":
        default:
            break;
    }

    return (
        <div
            style={{
                fontSize,
                color,
                fontFamily,
                fontWeight,
                opacity: opacity * fadeOut,
                transform: `scale(${scale}) translateX(${translateX}px) translateY(${translateY}px)`,
                textShadow: "2px 2px 0 rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)",
                textAlign: "center",
                lineHeight: 1.3,
                maxWidth: "85%",
                ...style,
            }}
        >
            {text}
        </div>
    );
};
