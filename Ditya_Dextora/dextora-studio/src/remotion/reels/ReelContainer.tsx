import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";

export const ReelContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* Background Music (LoFi / Trending Reel Audio) - volume mixed low */}
            <Audio src={staticFile("audio/bgm-reels.mp3")} volume={0.05} loop />

            {children}

            {/* Global Reels Overlay Elements (e.g., subtle vignette, noise overlay, captions area) */}
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
                    pointerEvents: "none",
                    zIndex: 100,
                }}
            />

            {/* Safe area for UI (Like buttons, captions) */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: "30%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                    zIndex: 90,
                }}
            />
        </AbsoluteFill>
    );
};
