import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import fs from "fs/promises";

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");
const PROJECT_ID = "veo-test-487816";
const LOCATION = "us-central1";

async function getAccessToken(): Promise<string> {
    const keyFile = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, "utf-8"));
    const auth = new GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token || "";
}

async function generateImagen(prompt: string, accessToken: string, sceneId: string): Promise<string> {
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagegeneration@006:predict`;
    const payload = {
        instances: [{ prompt: prompt + ", cinematic, highly detailed, 8k" }],
        parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } },
    };

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`Imagen failed: ${await res.text()}`);
    }

    const data = await res.json();
    const base64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) throw new Error("No image data returned.");

    const imagesDir = path.join(process.cwd(), "public", "assets", "images");
    await fs.mkdir(imagesDir, { recursive: true });

    // Use specific timestamp or ID to avoid caching issues on client
    const filename = `scene-${sceneId}-${Date.now()}.jpg`;
    const filepath = path.join(imagesDir, filename);
    await fs.writeFile(filepath, Buffer.from(base64, "base64"));

    return `/assets/images/${filename}`;
}

async function pollVeo(operationName: string, accessToken: string): Promise<Record<string, unknown>> {
    const maxAttempts = 30; // 2.5 mins
    let attempts = 0;
    while (attempts < maxAttempts) {
        const res = await fetch(`https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error(`Veo polling failed: ${res.statusText}`);
        const data = await res.json();
        if (data.done) {
            if (data.error) throw new Error(`Veo failed: ${data.error.message}`);
            return data.response || data;
        }
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
    }
    throw new Error("Veo timed out");
}

export async function POST(req: NextRequest) {
    try {
        const { prompt, sceneId, isVertical } = await req.json();
        if (!prompt || !sceneId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const accessToken = await getAccessToken();

        try {
            // Attempt Veo Generation First
            const veoEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-001:predictLongRunning`;
            const payload = {
                instances: [{ prompt }],
                parameters: { aspectRatio: isVertical ? "9:16" : "16:9", sampleCount: 1, durationSeconds: 5 },
            };

            const veoReq = await fetch(veoEndpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!veoReq.ok) throw new Error("Veo API unavailable or quota exceeded");

            const operationData = await veoReq.json();
            const result = await pollVeo(operationData.name, accessToken);

            // Extract and save
            let base64Video = null;
            const predictions = result.predictions as any[];
            if (predictions && predictions[0]?.bytesBase64Encoded) {
                base64Video = predictions[0].bytesBase64Encoded;
            } else if (result.generatedVideos && (result as any).generatedVideos[0]?.video?.bytesBase64Encoded) {
                base64Video = (result as any).generatedVideos[0].video.bytesBase64Encoded;
            }

            if (!base64Video) throw new Error("Veo generated successfully but returned no video bytes");

            const videosDir = path.join(process.cwd(), "public", "assets", "videos");
            await fs.mkdir(videosDir, { recursive: true });
            const filename = `scene-${sceneId}-${Date.now()}.mp4`;
            const filepath = path.join(videosDir, filename);
            await fs.writeFile(filepath, Buffer.from(base64Video, "base64"));

            return NextResponse.json({ success: true, url: `/assets/videos/${filename}`, type: "video" });

        } catch (veoError: any) {
            console.warn(`Veo fallback triggered for scene ${sceneId}:`, veoError.message);

            // Fallback to Imagen (Generate 4 images in parallel for animation)
            const imagePromises = [1, 2, 3, 4].map((idx) => generateImagen(`${prompt}, variation ${idx}`, accessToken, `${sceneId}-${idx}`));
            const imageUrls = await Promise.all(imagePromises);

            return NextResponse.json({ success: true, urls: imageUrls, type: "image" });
        }

    } catch (e: any) {
        console.error("Visual generation failed:", e);
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
    }
}
