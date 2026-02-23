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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            duration = 60,
            style = "Educational",
            animationLevel = "Medium"
        } = body;

        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "A prompt is required to generate scenes." },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();

        const geminiEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-2.0-flash:generateContent`;

        const systemInstruction = `You are a professional video director and scriptwriter for a cinematic AI video generation platform.
Your task is to take a user prompt and generate an array of sequential video scenes.

The video duration is: ${duration} seconds.
The video style is: ${style}.
The animation intensity level is: ${animationLevel}.

CRITICAL STYLE INSTRUCTION:
If the style is "Educational" or similar, the 'visualPrompt' MUST request vibrant, colorful, 2D or 3D cartoon animations suitable for children's shows (like Dr. Binocs or CoComelon). Do not use photorealistic or dark cinematic prompts for educational videos. Describe the cartoon characters and bright backgrounds specifically.

You must return a raw JSON object matching exactly this structure:
{
  "title": "String - the video title",
  "duration": Number - total video duration in seconds (should match the requested duration),
  "scenes": [
    {
      "id": 1,
      "title": "String - brief scene title",
      "duration": Number - duration of THIS scene in seconds (usually 4-8 seconds),
      "script": "String - narration script for this scene. Calculate 2-3 words per second for pacing.",
      "visualPrompt": "String - highly detailed video generation prompt for Veo. E.g., 'A vibrant 3D cartoon animation of a smiling sun, bright blue sky, cute educational kids show style, highly detailed'.",
      "animation": "String - description of how elements should animate (e.g. 'fade-in + slow zoom', 'slide-up from bottom')",
      "transition": "String - transition to the next scene (e.g. 'smooth crossfade', 'hard cut', 'glitch')",
      "brollPrompt": "String - alternative b-roll idea if Veo fails"
    }
  ]
}

CRITICAL INSTRUCTIONS:
- The sum of all scene 'duration' values MUST exactly equal the total requested duration (${duration}s).
- Number of scenes depends on the duration (e.g. a 30s video might have 4-6 scenes).
- Do NOT wrap the JSON in markdown code blocks. Just output raw, valid JSON.`;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate scene breakdown for this video topic: "${prompt}"`,
                        },
                    ],
                },
            ],
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
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
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Parse the generated JSON
        let parsedScenes;
        try {
            parsedScenes = JSON.parse(textContent);
        } catch (e) {
            console.error("Failed to parse Gemini output:", textContent);
            throw new Error("Failed to parse generated scenes as JSON.");
        }

        return NextResponse.json({
            success: true,
            data: parsedScenes,
        });
    } catch (error: unknown) {
        console.error("Scene generation error:", error);
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
