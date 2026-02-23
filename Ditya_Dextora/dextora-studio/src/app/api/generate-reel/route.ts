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

export async function POST(req: NextRequest) {
    try {
        const { prompt, duration = 60 } = await req.json();

        // The strict requirement: 5-second alternating blocks
        const segmentCount = Math.floor(duration / 5);

        const systemInstruction = `You are a professional Instagram Reels scriptwriter and director.
Generate a strictly structured JSON response for a vertical 9:16 Instagram Reel.
Each segment MUST be exactly 5 seconds long.
There should be exactly ${segmentCount} segments to fill ${duration} seconds.

The JSON format MUST be exactly:
{
    "title": "A catchy, short title for the reel",
    "totalDuration": ${duration},
    "segments": [
        {
            "sceneId": 1,
            "duration": 5,
            "script": "The exact words the AI presenter will say to the camera (captivating hook).",
            "visualPrompt": "A highly detailed, cinematic prompt for an AI video generator.",
            "avatarRequired": true
        }
    ]
}

CRITICAL RULES:
1. Every segment MUST have a duration of 5.
2. Total segments must be exactly ${segmentCount}.
3. 'visualPrompt' must be descriptive enough for Veo video generation model. Always include a visualPrompt.`;

        const accessToken = await getAccessToken();
        const geminiEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-2.5-flash:generateContent`;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `User Request: Create a ${duration}-second Instagram reel about: ${prompt}` },
                    ],
                },
            ],
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            generationConfig: {
                temperature: 0.7,
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
            console.error("Vertex AI Error:", errorText);
            throw new Error(`Vertex AI Error: ${response.statusText}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const reelPlan = JSON.parse(textContent);

        return NextResponse.json({ success: true, plan: reelPlan });

    } catch (error: any) {
        console.error("Gemini Reels Generation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate reel plan" }, { status: 500 });
    }
}
