import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import fs from "fs/promises";

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");
const PROJECT_ID = process.env.PROJECT_ID || "veo-test-487816";
const LOCATION = process.env.LOCATION || "us-central1";

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
        const { currentScenes, instructions, duration, style } = body;

        if (!currentScenes || !instructions) {
            return NextResponse.json(
                { error: "currentScenes and instructions are required" },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();
        const geminiEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-2.0-flash:generateContent`;

        const systemInstruction = `You are an expert cinematic director and scriptwriter.
The user has provided an existing list of video scenes in JSON format, representing a ${duration}-second video in a "${style}" style.
The user has provided instructions to edit, refine, or rewrite these scenes.

Current Scenes (JSON):
${JSON.stringify(currentScenes, null, 2)}

Your task is to apply the user's instructions to the scenes and return the UPDATED list of scenes in the exact same JSON array format.

Requirements:
1. You MUST return ONLY a raw JSON array.
2. The JSON array must contain objects with these exact keys: "id" (number), "duration" (number), "script" (string), "visualPrompt" (string), "animation" (string), "transition" (string), "brollPrompt" (string).
3. Do not change the "id" properties of existing scenes unless you are replacing them entirely or the user explicitly asks to remove/add scenes.
4. Keep the total duration of the scenes roughly equal to ${duration} seconds.
5. Provide detailed, varied, and cinematic descriptions for "visualPrompt" suitable for the Veo video generation AI.
6. Return purely the raw JSON array string. DO NOT wrap it in markdown blocks.`;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Edit the scenes using these instructions: "${instructions}"`,
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
            throw new Error(`Gemini API Error: ${errorText}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        let editedScenes = [];
        try {
            editedScenes = JSON.parse(textContent);
        } catch (parseError) {
            const cleanedText = textContent.replace(/```json\n/g, '').replace(/```/g, '').trim();
            editedScenes = JSON.parse(cleanedText);
        }

        return NextResponse.json({
            success: true,
            scenes: editedScenes
        });

    } catch (error: any) {
        console.error("Error in /api/edit-scenes:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred during scene editing" },
            { status: 500 }
        );
    }
}
