require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function listModels() {
    try {
        console.log("API key loaded:", !!process.env.GEMINI_API_KEY);

        for await (const model of await ai.models.list()) {
            if (model.supportedActions?.includes("generateContent")) {
                console.log(model.name);
            }
        }
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

listModels();