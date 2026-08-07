import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/ai/insight (Static Questions)
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

// POST /api/ai/chat (Dynamic Q&A with Citation Enforcement)
// Notice this is just '/chat' now!
router.post('/chat', async (req, res) => {
  try {
    const { documentUrl, question } = req.body;

    if (!documentUrl || !question) {
      return res.status(400).json({ error: 'Missing document URL or question' });
    }

    console.log(`[AI Chat] Fetching PDF from: ${documentUrl}`);
    
    const pdfResponse = await fetch(documentUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    console.log(`[AI Chat] PDF downloaded. Asking Gemini: "${question}"`);

    // Initialize the Gemini model properly using your API key
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from .env file");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // The Forensic System Prompt
    const systemInstruction = `
      You are an elite, impartial forensic research assistant for EvidenceHub AI. 
      You are analyzing a proprietary research document.

      CRITICAL RULES:
      1. Answer the user's question using ONLY the provided document.
      2. If the answer is NOT in the document, you must reply EXACTLY with: "I cannot find this information in the provided research paper." Do not guess, infer, or hallucinate.
      3. For EVERY single claim you make, you MUST provide a precise citation.
      4. Format your citations exactly like this at the end of the sentence: [Source: Page X, "Exact Section Heading"].
      5. Format the overall output in clean Markdown with bolding for key terms.
    `;

    const prompt = `
      ${systemInstruction}

      USER QUESTION: ${question}
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf"
        }
      },
      prompt
    ]);

    const answer = await result.response.text();
    console.log(`[AI Chat] Gemini responded successfully.`);

    res.json({ answer });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({ error: 'Failed to process AI chat request' });
  }
});

export default router;