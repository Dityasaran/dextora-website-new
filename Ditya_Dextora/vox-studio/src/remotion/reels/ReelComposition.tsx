import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig, Audio, staticFile } from "remotion";
import { ReelContainer } from "./ReelContainer";
import { AvatarScene } from "./AvatarScene";
import { AnimatedImageScene } from "./AnimatedImageScene";

export interface ReelSegment {
    type: "avatar" | "visual";
    duration: number; // in seconds
    script?: string;
    visualPrompt?: string;

    // Populated later
    avatarVideoUrl?: string;
    ttsAudioUrl?: string;
    imageUrls?: string[];
    videoUrl?: string;
}

export interface ReelCompositionProps {
    title: string;
    duration: number;
    segments: ReelSegment[];
}

export const ReelComposition: React.FC<ReelCompositionProps> = ({
    title,
    duration,
    segments,
}) => {
    const { fps } = useVideoConfig();

    return (
        <ReelContainer>
            {segments.map((segment, i) => {
                const prevDuration = segments
                    .slice(0, i)
                    .reduce((acc, s) => acc + s.duration * fps, 0);
                const currentFrames = Math.max(1, Math.round(segment.duration * fps));

                return (
                    <Sequence
                        key={`reel-segment-${i}`}
                        from={Math.round(prevDuration)}
                        durationInFrames={currentFrames}
                    >
                        {segment.type === "avatar" ? (
                            <AvatarScene segment={segment} index={i} />
                        ) : (
                            <AnimatedImageScene segment={segment} index={i} />
                        )}
                    </Sequence>
                );
            })}
        </ReelContainer>
    );
};
