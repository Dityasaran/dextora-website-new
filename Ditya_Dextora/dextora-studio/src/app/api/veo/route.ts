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

function extractVideoUrl(result: Record<string, unknown>): string | null {
    const predictions = result.predictions as Array<Record<string, unknown>> | undefined;
    if (predictions && predictions.length > 0) {
        const prediction = predictions[0];
        if (prediction.video) return prediction.video as string;
        if (prediction.bytesBase64Encoded) {
            return `data:video/mp4;base64,${prediction.bytesBase64Encoded}`;
        }
    }
    const response = result.response as Record<string, unknown> | undefined;
    if (response) {
        const generatedVideos = response.generatedVideos as Array<Record<string, unknown>> | undefined;
        if (generatedVideos && generatedVideos.length > 0) {
            const video = generatedVideos[0].video as Record<string, string> | undefined;
            if (video?.uri) return video.uri;
        }
    }
    return null;
}

async function pollOperation(
    operationName: string,
    accessToken: string
): Promise<Record<string, unknown>> {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
        const statusUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;
        const statusResponse = await fetch(statusUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!statusResponse.ok) {
            throw new Error(`Polling failed: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();

        if (statusData.done) {
            if (statusData.error) {
                throw new Error(
                    `Veo generation failed: ${statusData.error.message || "Unknown error"}`
                );
            }
            return statusData.response || statusData;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
    }

    throw new Error("Veo generation timed out after 5 minutes.");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            aspectRatio = "16:9",
            duration = 4
        } = body;

        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "A prompt is required to generate video." },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();

        const veoEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-001:predictLongRunning`;

        const veoPayload = {
            instances: [
                {
                    prompt: prompt,
                },
            ],
            parameters: {
                aspectRatio: aspectRatio,
                sampleCount: 1,
                durationSeconds: Number(duration),
            },
        };

        const veoResponse = await fetch(veoEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(veoPayload),
        });

        if (!veoResponse.ok) {
            const errorText = await veoResponse.text();
            console.error("Veo API Error:", errorText);

            let errorMessage = "Veo API is not available.";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
            } catch {
                // Ignore parsing error
            }

            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        const operationData = await veoResponse.json();
        const operationName = operationData.name;

        // Poll for completion
        const result = await pollOperation(operationName, accessToken);

        // Extract video URL or base64
        const videoUrl = extractVideoUrl(result);

        if (!videoUrl) {
            throw new Error("Video URL could not be extracted from Vertex AI response.");
        }

        return NextResponse.json({
            success: true,
            videoUrl,
        });
    } catch (error: unknown) {
        console.error("Veo generation route error:", error);
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
