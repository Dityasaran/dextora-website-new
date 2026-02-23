import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import fs from "fs/promises";

async function test() {
    try {
        const keyFile = JSON.parse(await fs.readFile("service-account.json", "utf-8"));
        const client = new TextToSpeechClient({ credentials: keyFile });
        const [response] = await client.synthesizeSpeech({
            input: { text: "Hello from test" },
            voice: { languageCode: "en-US", name: "en-US-Journey-D" },
            audioConfig: { audioEncoding: "MP3", volumeGainDb: 6.0, pitch: 2.0 },
        });
        console.log("Audio content available:", !!response.audioContent);
        if (response.audioContent) {
            console.log("Type:", typeof response.audioContent);
            console.log("Length:", response.audioContent.length);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
