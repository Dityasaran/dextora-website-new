import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Write props to a temporary file
        const tmpDir = path.join(process.cwd(), "tmp");
        await fs.mkdir(tmpDir, { recursive: true });

        const timestamp = Date.now();
        const propsFile = path.join(tmpDir, `props-${timestamp}.json`);
        await fs.writeFile(propsFile, JSON.stringify(body));

        // Ensure output directory exists
        const outDir = path.join(process.cwd(), "public", "videos");
        await fs.mkdir(outDir, { recursive: true });

        const outputFile = `video-${timestamp}.mp4`;
        const outputPath = path.join(outDir, outputFile);

        // Determine target composition
        const isReel = body.isReel || false;
        const compositionId = isReel ? "ReelComposition" : "AIComposition";

        // Calculate total duration in frames
        const fps = 30;
        let totalDurationSec = body.duration || 60;

        if (isReel && body.segments) {
            totalDurationSec = body.segments.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) || totalDurationSec;
        } else if (!isReel && body.scenes) {
            totalDurationSec = body.scenes.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) || totalDurationSec;
        }

        const totalFrames = Math.round(totalDurationSec * fps);

        // Include total frames in props so the composition renders at the correct length
        const propsWithFrames = { ...body, _totalFrames: totalFrames };
        await fs.writeFile(propsFile, JSON.stringify(propsWithFrames));

        // Run remotion render with explicit frame count
        const command = `npx remotion render src/remotion/index.ts ${compositionId} ${outputPath} --props=${propsFile} --frames=0-${totalFrames - 1}`;

        console.log("Starting render with command:", command);
        console.log("Total duration:", totalDurationSec, "sec |", totalFrames, "frames");
        const { stdout, stderr } = await execPromise(command, { cwd: process.cwd(), timeout: 300000 });
        console.log("Remotion render stdout:", stdout);
        if (stderr) console.error("Remotion render stderr:", stderr);

        // Cleanup
        await fs.unlink(propsFile).catch(() => { });

        return NextResponse.json({
            success: true,
            videoUrl: `/videos/${outputFile}`
        });
    } catch (e: any) {
        console.error("Render failed:", e);
        return NextResponse.json({ error: e.message || "Render failed" }, { status: 500 });
    }
}
