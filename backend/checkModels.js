import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  console.log("Fetching allowed models for your API key...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("\n✅ YOUR APPROVED MODELS:");
    data.models.forEach(m => {
      if (m.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${m.name.replace('models/', '')}`);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkModels();