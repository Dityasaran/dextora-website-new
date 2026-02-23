import WebSocket from "ws";
import fs from "fs/promises";

async function testTTS() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket("wss://supertts.dextora.org/ws/tts");

        ws.on("open", () => {
            console.log("Connected to TTS WebSocket");
            ws.send(JSON.stringify({
                text: "Hello world, this is a test of the Dextora TTS system.",
                language: "en"
            }));
        });

        const audioChunks: Buffer[] = [];

        ws.on("message", (data) => {
            if (data instanceof Buffer) {
                console.log("Received buffer, size:", data.length);
                audioChunks.push(data);
                // If the stream doesn't close on its own, resolve after a short delay of no chunks (e.g. 2s)
                resetTimeout();
            } else if (typeof data === "string") {
                console.log("Received string:", data);
            }
        });

        ws.on("close", async () => {
            console.log("WebSocket closed naturally.");
            finish();
        });

        ws.on("error", (err) => {
            console.error("WebSocket error:", err);
            reject(err);
        });

        let timeout: NodeJS.Timeout;
        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log("No messages for 2 seconds, assuming complete.");
                ws.close();
                finish();
            }, 2000);
        };
        resetTimeout();

        const finish = async () => {
            clearTimeout(timeout);
            if (audioChunks.length > 0) {
                const finalBuffer = Buffer.concat(audioChunks);
                await fs.writeFile("test-dextora-tts-2.mp3", finalBuffer);
                console.log("Saved audio to test-dextora-tts-2.mp3, size:", finalBuffer.length);
            }
            resolve(true);
        };
    });
}

testTTS().catch(console.error);
