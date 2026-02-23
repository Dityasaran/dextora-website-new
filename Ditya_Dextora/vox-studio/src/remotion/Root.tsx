import { Composition } from "remotion";
import { AIComposition } from "./AIComposition";
import { VideoComposition } from "./VideoComposition";
import { ReelComposition } from "./reels/ReelComposition";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="VideoComposition"
                // @ts-ignore
                component={VideoComposition}
                durationInFrames={180}
                fps={30}
                width={1280}
                height={720}
                defaultProps={{
                    prompt: "A beautiful cinematic video",
                    settings: {},
                }}
            />
            <Composition
                id="AIComposition"
                // @ts-ignore
                component={AIComposition}
                // Default duration (60s at 30fps), usually overridden via inputProps
                durationInFrames={1800}
                fps={30}
                width={1280}
                height={720}
                defaultProps={{
                    title: "Generated Video",
                    duration: 60,
                    scenes: [],
                    style: "Educational",
                }}
            />
            <Composition
                id="ReelComposition"
                // @ts-ignore
                component={ReelComposition}
                durationInFrames={1800} // 60s default
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: "Generated Reel",
                    duration: 60,
                    segments: [],
                }}
            />
        </>
    );
};
