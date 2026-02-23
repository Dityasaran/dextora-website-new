import React from "react";
import { Img, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface ZoomImageProps {
    src: string;
    effect?: "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "kenBurns";
    intensity?: number;
}

export const ZoomImage: React.FC<ZoomImageProps> = ({
    src,
    effect = "zoomIn",
    intensity = 1,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    switch (effect) {
        case "zoomIn":
            scale = interpolate(frame, [0, durationInFrames], [1, 1 + 0.2 * intensity]);
            break;
        case "zoomOut":
            scale = interpolate(frame, [0, durationInFrames], [1.2 * intensity, 1]);
            break;
        case "panLeft":
            translateX = interpolate(frame, [0, durationInFrames], [0, -50 * intensity]);
            scale = 1.15;
            break;
        case "panRight":
            translateX = interpolate(frame, [0, durationInFrames], [0, 50 * intensity]);
            scale = 1.15;
            break;
        case "kenBurns":
            scale = interpolate(frame, [0, durationInFrames], [1, 1.25 * intensity]);
            translateX = interpolate(frame, [0, durationInFrames], [0, 30 * intensity]);
            translateY = interpolate(frame, [0, durationInFrames], [0, -15 * intensity]);
            break;
    }

    // Fade in
    const opacity = interpolate(frame, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                opacity,
            }}
        >
            <Img
                src={src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                    transformOrigin: "center center",
                }}
            />
        </div>
    );
};
