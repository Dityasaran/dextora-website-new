import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig, interpolate, spring, useCurrentFrame, Img, Video, staticFile } from "remotion";
import { ReelSegment } from "./ReelComposition";

export const AnimatedImageScene: React.FC<{ segment: ReelSegment; index: number }> = ({ segment, index }) => {
    const { fps, durationInFrames } = useVideoConfig();

    // 1. If Veo Video exists, render it
    if (segment.videoUrl) {
        return (
            <AbsoluteFill>
                <Video
                    src={segment.videoUrl.startsWith("/") ? staticFile(segment.videoUrl.slice(1)) : segment.videoUrl}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                    }}
                />
            </AbsoluteFill>
        );
    }

    // 2. Fallback to Imagen Images Sequence
    const images = segment.imageUrls && segment.imageUrls.length > 0
        ? segment.imageUrls
        : [
            // Absolute last resort fallback to avoid black screens if generation completely crashed
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1080&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1080&auto=format&fit=crop"
        ];

    const numImages = images.length;
    // Divide the scene into equal parts
    const segmentFrames = Math.floor(durationInFrames / numImages);

    return (
        <AbsoluteFill>
            {images.map((imgSrc, i) => {
                const overlap = 15;
                const start = Math.max(0, i * segmentFrames - (i > 0 ? overlap : 0));
                const duration = i === numImages - 1
                    ? durationInFrames - start
                    : segmentFrames + (i > 0 ? overlap : 0);

                return (
                    <Sequence
                        key={`img-seq-${i}`}
                        from={start}
                        durationInFrames={duration}
                    >
                        <AnimatedImage src={imgSrc} index={i} isLast={i === numImages - 1} overlap={overlap} />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};

const AnimatedImage: React.FC<{ src: string; index: number; isLast: boolean; overlap: number }> = ({ src, index, isLast, overlap }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // 1. Crossfade Transition
    // Fade in
    const fadeIn = interpolate(frame, [0, overlap], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // Fade out (only if not the last image in the scene)
    const fadeOut = isLast ? 1 : interpolate(
        frame,
        [durationInFrames - overlap, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const opacity = Math.min(index === 0 ? 1 : fadeIn, fadeOut);

    // 2. Motion Animation (Zoom / Pan)
    // Alternate effects based on index to keep the motion dynamic and unpredictable
    const zoomType = index % 3;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    if (zoomType === 0) {
        // Zoom IN
        scale = interpolate(frame, [0, durationInFrames], [1, 1.25], { extrapolateRight: "extend" });
    } else if (zoomType === 1) {
        // Zoom OUT with slight pan
        scale = interpolate(frame, [0, durationInFrames], [1.3, 1], { extrapolateRight: "extend" });
        translateX = interpolate(frame, [0, durationInFrames], [30, -30], { extrapolateRight: "extend" });
    } else if (zoomType === 2) {
        // Pan UP
        scale = 1.15;
        translateY = interpolate(frame, [0, durationInFrames], [40, -40], { extrapolateRight: "extend" });
    }

    return (
        <AbsoluteFill style={{ opacity }}>
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
        </AbsoluteFill>
    );
};
