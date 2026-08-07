import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/insight', async (req, res) => {
  try {
    const { documentUrl, question } = req.body;
    console.log(`[AI] Processing question: "${question}"`);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from .env file");
    }

    const fileName = documentUrl.split('/').pop();
    const filePath = path.join(__dirname, '../../uploads', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found on server' });
    }

    // 1. Read PDF as Base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    // 2. Initialize the STANDARD Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const systemPrompt = `
      You are an expert forensic research assistant for EvidenceHub AI. 
      Your job is to answer the user's question based strictly and ONLY on the provided PDF document.
      
      RULES for generating the answer:
      1. If the answer is not in the document, reply exactly with: "I cannot answer this based on the provided document." Do not guess.
      2. For every claim you make, you MUST provide a citation.
      
      FORMATTING RULES (Strictly use Markdown):
      - Start with a clear, bold, 1-sentence summary of the answer.
      - Use bullet points to list the key findings or methodology.
      - Use **bold text** to highlight important metrics, names, or data points.
      - Create a dedicated heading at the very bottom called "### 🔍 Citations" and list exact quotes and page/section references there.
    `;

    // 3. Generate Content
    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      },
      `QUESTION: ${question}`
    ]);

    const response = await result.response;
    const answerText = response.text();
    
    console.log(`[AI] Success! Sending response.`);
    res.status(200).json({ answer: answerText });

  } catch (error) {
    console.error('[AI ROUTE CRASH]:', error);
    res.status(500).json({ 
      error: 'Backend failed to generate AI insight.',
      details: error.message 
    });
  }
});

export default router;