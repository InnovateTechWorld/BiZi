import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { message, history, product, targetCustomer, geographicMarket, pricingStrategy, mainChannels } = req.body;

  const systemInstruction = `You are a Business Chatbot for businesses which can be a start up entrepreneur or large companies to help them with Analyze my market, Review business plan, Financial insights, Competitor analysis, Growth strategies, Risk assessment, Don't Ask Questions just Answer users Questions with the avialable knowledge provided.
  For Prompts like Analyze my market, Review business plan, Financial insights, Competitor analysis, Growth strategies, and Risk assessment, you should provide the user with a detailed response based on the information provided.
  
  Here is some information about the business:
  Product/Service: ${product || 'N/A'}
  Target Customer: ${targetCustomer || 'N/A'}
  Geographic Market: ${geographicMarket || 'N/A'}
  Pricing Strategy: ${pricingStrategy || 'N/A'}
  Main Channels: ${mainChannels || 'N/A'}
  `;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemInstruction
  });

  const formattedHistory = (history || []).map(item => ({
    role: item.role,
    parts: [{ text: item.text }]
  }));
  
  if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      throw new Error("First message in history must be from the user");
    }

  const chat = model.startChat({
    history: formattedHistory,
  });

  try {
    const result = await chat.sendMessage(message);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;