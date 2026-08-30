const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Access the model list via the API
        // For the Node SDK, checking available models might need a direct call if not exposed on the instance easily,
        // but let's try to infer or use a simple generation to test a known safe fallback.

        // Actually, the SDK doesn't always expose listModels directly on the main class in older versions, 
        // but checking the docs for 0.24.1+, there might be a way. 
        // Let's try to just run a simple prompt on a few candidates.

        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];

        console.log("Testing available models for your API Key...");

        for (const modelName of models) {
            try {
                console.log(`\nTesting ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you there?");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName} is working!`);
                console.log("Response:", response.text());
                return; // Found a working one
            } catch (error) {
                console.log(`❌ FAILED: ${modelName}`);
                console.log(`Error: ${error.message.split('\n')[0]}`);
            }
        }

        console.log("\n❌ ALL TESTED MODELS FAILED. Check your API Key permissions or Region.");

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

listModels();
