import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import WebSocket from "ws";

export async function POST(request: NextRequest) {
    try {
        const { text, voice, speakingRate } = await request.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required for TTS." },
                { status: 400 }
            );
        }

        // Connect to custom Dextora TTS WebSocket
        const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
            const ws = new WebSocket("wss://supertts.dextora.org/ws/tts");
            const chunks: Buffer[] = [];
            let timeout: NodeJS.Timeout;
            let hasReceivedData = false;
            let settled = false;

            const finish = (error?: Error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                try { ws.close(); } catch (_e) { /* ignore */ }
                if (error) return reject(error);
                if (chunks.length > 0) resolve(Buffer.concat(chunks));
                else reject(new Error("No audio data received from TTS service"));
            };

            const resetTimeout = () => {
                clearTimeout(timeout);
                // After first data arrives, use a short inactivity timeout (3s)
                // Before data arrives, use a long initial timeout (15s) for generation
                const delay = hasReceivedData ? 3000 : 15000;
                timeout = setTimeout(() => finish(), delay);
            };

            ws.on("open", () => {
                console.log("[TTS] WebSocket connected, sending text...");
                ws.send(JSON.stringify({ text, language: "en" }));
                resetTimeout(); // 15s initial wait
            });

            ws.on("message", (data: Buffer | ArrayBuffer | string) => {
                // Handle binary data (Buffer or ArrayBuffer)
                if (Buffer.isBuffer(data)) {
                    console.log("[TTS] Received buffer chunk:", data.length, "bytes");
                    chunks.push(data);
                    hasReceivedData = true;
                    resetTimeout(); // switch to 3s inactivity
                } else if (data instanceof ArrayBuffer) {
                    const buf = Buffer.from(data);
                    console.log("[TTS] Received ArrayBuffer chunk:", buf.length, "bytes");
                    chunks.push(buf);
                    hasReceivedData = true;
                    resetTimeout();
                } else if (typeof data === "string") {
                    console.log("[TTS] Received string message:", data.substring(0, 200));
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.audio) {
                            chunks.push(Buffer.from(parsed.audio, "base64"));
                            hasReceivedData = true;
                            resetTimeout();
                        }
                    } catch (_e) { /* ignore */ }
                }
            });

            ws.on("error", (err: Error) => {
                console.error("[TTS] WebSocket error:", err.message);
                finish(err);
            });

            ws.on("close", () => {
                console.log("[TTS] WebSocket closed. Chunks received:", chunks.length);
                finish();
            });
        });

        // Save the audio file
        const audioDir = path.join(process.cwd(), "public", "audio");
        await fs.mkdir(audioDir, { recursive: true });

        const filename = `tts-${Date.now()}.mp3`;
        const filepath = path.join(audioDir, filename);

        await fs.writeFile(filepath, audioBuffer);

        return NextResponse.json({
            success: true,
            audioUrl: `/audio/${filename}`,
            duration: audioBuffer.length / 16000, // rough estimate
        });
    } catch (error: unknown) {
        console.error("TTS error:", error);
        const message =
            error instanceof Error ? error.message : "TTS generation failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
