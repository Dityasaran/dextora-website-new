import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface FadeTransitionProps {
    children: React.ReactNode;
    type?: "fade" | "slideLeft" | "slideRight" | "slideUp" | "zoomFade";
    durationFrames?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
    children,
    type = "fade",
    durationFrames = 15,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Fade in
    const fadeIn = interpolate(frame, [0, durationFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // Fade out
    const fadeOut = interpolate(
        frame,
        [durationInFrames - durationFrames, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const opacity = Math.min(fadeIn, fadeOut);

    let transform = "";

    switch (type) {
        case "slideLeft":
            const slideL = interpolate(frame, [0, durationFrames], [80, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            });
            transform = `translateX(${slideL}px)`;
            break;
        case "slideRight":
            const slideR = interpolate(frame, [0, durationFrames], [-80, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            });
            transform = `translateX(${slideR}px)`;
            break;
        case "slideUp":
            const slideU = interpolate(frame, [0, durationFrames], [60, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            });
            transform = `translateY(${slideU}px)`;
            break;
        case "zoomFade":
            const zoomScale = interpolate(frame, [0, durationFrames], [0.9, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            });
            transform = `scale(${zoomScale})`;
            break;
        default:
            break;
    }

    return (
        <AbsoluteFill style={{ opacity, transform }}>
            {children}
        </AbsoluteFill>
    );
};
