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

// ──────────────────────────────────────────────
// Step 1: Use Gemini to enhance the user prompt
//         into a detailed, cinematic video prompt
// ──────────────────────────────────────────────
async function enhancePromptWithGemini(
    userPrompt: string,
    aspectRatio: string,
    duration: string,
    accessToken: string
): Promise<{ videoPrompt: string; narrationScript: string }> {
    const geminiEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-2.0-flash:generateContent`;

    const systemInstruction = `You are a world-class video production AI director working for Dextora Studio. 
Your job is to take a simple user idea and transform it into TWO things:

1. **videoPrompt**: A highly detailed, cinematic video generation prompt for Google Veo AI. 
   Include specific details about:
   - Camera angles and movements (e.g., "slow dolly in", "aerial crane shot", "close-up tracking")
   - Lighting and atmosphere (e.g., "golden hour warm light", "dramatic rim lighting", "soft diffused glow")
   - Colors and visual style (e.g., "vibrant saturated colors", "moody desaturated tones", "neon cyberpunk palette")
   - Motion and action (e.g., "particles floating gently", "dynamic swooping motion", "slow-motion reveal")
   - Audio/sound design hints (e.g., "with ambient orchestral music", "upbeat electronic background", "calm nature sounds")
   - Quality descriptors (e.g., "photorealistic 4K", "cinematic depth of field", "high production value")
   Make the prompt vivid and specific so Veo generates a stunning video. Keep it under 200 words.

2. **narrationScript**: A short professional narration script that could be read as a voiceover for the video.
   This should be 2-3 sentences, matching the tone of the video (educational, exciting, calm, etc.).
   Keep it under 50 words.

The video is ${aspectRatio} aspect ratio and ${duration} seconds long.

Respond ONLY in JSON format:
{"videoPrompt": "...", "narrationScript": "..."}`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `Create a stunning video from this idea: "${userPrompt}"`,
                    },
                ],
            },
        ],
        systemInstruction: {
            parts: [{ text: systemInstruction }],
        },
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
        },
    };

    const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        // Fallback: return the original prompt enhanced manually
        return {
            videoPrompt: `Cinematic high-quality video: ${userPrompt}. Shot in 4K with beautiful lighting, smooth camera movements, and professional color grading. Photorealistic quality with ambient soundtrack.`,
            narrationScript: userPrompt,
        };
    }

    const data = await response.json();

    try {
        const textContent =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(textContent);
        return {
            videoPrompt:
                parsed.videoPrompt ||
                `Cinematic video: ${userPrompt}. High quality, 4K, professional.`,
            narrationScript: parsed.narrationScript || userPrompt,
        };
    } catch {
        console.error("Failed to parse Gemini response, using fallback");
        return {
            videoPrompt: `Cinematic high-quality video of ${userPrompt}. Shot with professional cameras, beautiful lighting, smooth movements, 4K resolution, ambient soundtrack.`,
            narrationScript: userPrompt,
        };
    }
}

// ──────────────────────────────────────────────
// Step 2: Generate video with Veo using the
//         AI-enhanced prompt
// ──────────────────────────────────────────────
async function generateVideoWithVeo(
    enhancedPrompt: string,
    aspectRatio: string,
    duration: string,
    accessToken: string
): Promise<{ videoUrl: string | null; status: string; message: string }> {
    // Try Veo 3.1 via Gemini API first
    const veoEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-001:predictLongRunning`;

    const veoPayload = {
        instances: [
            {
                prompt: enhancedPrompt,
            },
        ],
        parameters: {
            aspectRatio: aspectRatio,
            sampleCount: 1,
            durationSeconds: parseInt(duration),
        },
    };

    try {
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

            // Parse the error for a user-friendly message
            let errorMessage = "Veo API is not available.";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage =
                    errorJson.error?.message || errorJson.message || errorMessage;
            } catch {
                // use default message
            }

            return {
                videoUrl: null,
                status: "veo_unavailable",
                message: errorMessage,
            };
        }

        const operationData = await veoResponse.json();
        const operationName = operationData.name;

        // Poll for completion
        const result = await pollOperation(operationName, accessToken);

        // Extract video URL from response
        const videoUrl = extractVideoUrl(result);

        return {
            videoUrl,
            status: "complete",
            message: "Video generated successfully!",
        };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("Veo generation error:", msg);
        return {
            videoUrl: null,
            status: "error",
            message: msg,
        };
    }
}

function extractVideoUrl(
    result: Record<string, unknown>
): string | null {
    // Vertex AI Veo returns video data in predictions
    const predictions = result.predictions as Array<Record<string, unknown>> | undefined;
    if (predictions && predictions.length > 0) {
        const prediction = predictions[0];
        // Video might be base64 encoded or a GCS URI
        if (prediction.video) {
            return prediction.video as string;
        }
        if (prediction.bytesBase64Encoded) {
            // Save base64 video to a file and return the URL
            return `data:video/mp4;base64,${prediction.bytesBase64Encoded}`;
        }
    }
    // Check for generatedVideos format (Gemini API style)
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
    const maxAttempts = 60; // 5 minutes with 5s intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
        const statusUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;

        const statusResponse = await fetch(statusUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const statusData = await statusResponse.json();

        if (statusData.done) {
            if (statusData.error) {
                throw new Error(
                    `Video generation failed: ${statusData.error.message || "Unknown error"}`
                );
            }
            return statusData.response || statusData;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
    }

    throw new Error("Video generation timed out after 5 minutes.");
}

// ──────────────────────────────────────────────
// Step 3: Generate TTS narration
// ──────────────────────────────────────────────
async function generateTTS(text: string): Promise<string | null> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/tts`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            return data.audioUrl;
        }
        return null;
    } catch {
        console.error("TTS generation failed");
        return null;
    }
}

// ──────────────────────────────────────────────
// Main POST handler — the full pipeline
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            aspectRatio = "16:9",
            resolution = "720p",
            duration = "6",
            enableTts = false,
            narrationText = "",
        } = body;

        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "A prompt is required to generate a video." },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();

        // ── STEP 1: AI Prompt Enhancement ──
        // Gemini reads the user's simple prompt and creates a
        // detailed cinematic prompt for Veo
        console.log("🧠 Step 1: Enhancing prompt with Gemini AI...");
        console.log("   User prompt:", prompt);

        const { videoPrompt, narrationScript } = await enhancePromptWithGemini(
            prompt.trim(),
            aspectRatio,
            duration,
            accessToken
        );

        console.log("✨ Enhanced prompt:", videoPrompt);
        console.log("🎙️ Narration script:", narrationScript);

        // ── STEP 2: Generate Video with Veo ──
        console.log("🎬 Step 2: Generating video with Veo...");

        const videoResult = await generateVideoWithVeo(
            videoPrompt,
            aspectRatio,
            duration,
            accessToken
        );

        console.log("📹 Video result:", videoResult.status, videoResult.message);

        // ── STEP 3: Generate TTS narration ──
        let ttsAudioUrl = null;
        const ttsText = enableTts
            ? narrationText || narrationScript
            : null;

        if (ttsText) {
            console.log("🎙️ Step 3: Generating TTS narration...");
            ttsAudioUrl = await generateTTS(ttsText);
        }

        return NextResponse.json({
            success: true,
            // Original user prompt
            originalPrompt: prompt,
            // AI-enhanced prompt sent to Veo
            enhancedPrompt: videoPrompt,
            // AI-generated narration script
            narrationScript,
            // Video generation result
            video: {
                videoUrl: videoResult.videoUrl,
                status: videoResult.status,
                message: videoResult.message,
            },
            ttsAudioUrl,
            prompt: prompt,
            settings: { aspectRatio, resolution, duration, enableTts },
            generatedAt: new Date().toISOString(),
        });
    } catch (error: unknown) {
        console.error("Generation error:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            { error: `Failed to generate video: ${message}` },
            { status: 500 }
        );
    }
}
