import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const VIDEOS_DIR = path.join(process.cwd(), "public", "videos");
const METADATA_FILE = path.join(VIDEOS_DIR, "metadata.json");

interface VideoMeta {
    id: string;
    prompt: string;
    videoUrl: string;
    ttsAudioUrl: string | null;
    settings: Record<string, string | boolean>;
    generatedAt: string;
}

async function getMetadata(): Promise<VideoMeta[]> {
    try {
        const data = await fs.readFile(METADATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function GET() {
    try {
        const videos = await getMetadata();
        return NextResponse.json({ videos });
    } catch (error: unknown) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({ videos: [] });
    }
}
