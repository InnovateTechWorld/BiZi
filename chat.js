import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a Business Chatbot for businesses which can be a start up entrepreneur or large companies to help them with Analyze my market, Review business plan, Financial insights, Competitor analysis, Growth strategies, Risk assessment."
});

router.post('/', async (req, res) => {
  const { message, history } = req.body;

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