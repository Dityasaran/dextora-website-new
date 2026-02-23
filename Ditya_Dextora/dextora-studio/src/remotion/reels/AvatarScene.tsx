import React from "react";
import { AbsoluteFill, Video, Audio, staticFile, interpolate, useCurrentFrame, useVideoConfig, Img } from "remotion";
import { ReelSegment } from "./ReelComposition";
import { AnimatedText } from "../components/AnimatedText";

export const AvatarScene: React.FC<{ segment: ReelSegment; index: number }> = ({ segment, index }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const sourceString = segment.visualAsset || segment.videoUrl || segment.avatarVideoUrl;

    if (!sourceString) {
        return (
            <AbsoluteFill style={{ backgroundColor: "black", justifyContent: "center", alignItems: "center", color: "white" }}>
                <div style={{ fontSize: "2rem", fontFamily: "sans-serif" }}>Generating visuals...</div>
            </AbsoluteFill>
        );
    }

    const isVideo = sourceString.endsWith(".mp4") || sourceString.endsWith(".webm") || sourceString.endsWith(".mov");
    const videoSource = sourceString.startsWith("/") ? staticFile(sourceString.slice(1)) : sourceString;

    // Very subtle zoom on the avatar for a dynamic feel
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.05]);

    return (
        <AbsoluteFill>
            {isVideo ? (
                <Video
                    src={videoSource}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `scale(${scale})`,
                        transformOrigin: "center center",
                    }}
                />
            ) : (
                <Img
                    src={videoSource}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `scale(${scale})`,
                        transformOrigin: "center center",
                    }}
                />
            )}

            {/* Display Captions (optional, but good for Reels) */}
            {segment.script && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "15%",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        padding: "0 10%",
                        zIndex: 150,
                    }}
                >
                    <AnimatedText
                        text={segment.script}
                        fontSize={64} // Larger for vertical format
                        animation="wordByWord"
                        color="#ffffff"
                        style={{
                            textShadow: "0 4px 16px rgba(0,0,0,0.8)",
                        }}
                    />
                </div>
            )}

            {/* TTS Audio - The Avatar should ideally have its own audio, but we use TTS as fallback */}
            {segment.ttsAudioUrl && (
                <Audio
                    src={segment.ttsAudioUrl.startsWith("/") ? staticFile(segment.ttsAudioUrl.slice(1)) : segment.ttsAudioUrl}
                    volume={1.5}
                />
            )}
        </AbsoluteFill>
    );
};
