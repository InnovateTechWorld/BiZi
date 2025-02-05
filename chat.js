import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { message, history, product, targetCustomer, geographicMarket, pricingStrategy, mainChannels, fileContent } = req.body;

  let fileUri = null;
  let fileMimeType = null;

  // Handle PDF upload if provided
  if (fileContent) {
    try {
      const buffer = Buffer.from(fileContent, 'base64');
      const tempFilePath = `temp_file_${Date.now()}.pdf`;
      fs.writeFileSync(tempFilePath, buffer);

      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'application/pdf',
        displayName: `uploaded_file_${Date.now()}`
      });

      fileUri = uploadResult.file.uri;
      fileMimeType = uploadResult.file.mimeType;

      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error("Error processing PDF:", error);
      return res.status(500).json({ error: 'Failed to process PDF document' });
    }
  }

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
    model: "gemini-2.0-flash-exp",
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
    // Prepare message parts
    const messageParts = [];
    
    // Add PDF file if provided
    if (fileUri && fileMimeType) {
      messageParts.push({
        fileData: {
          fileUri: fileUri,
          mimeType: fileMimeType
        }
      });
    }
    
    // Add text message
    messageParts.push(message);

    const result = await chat.sendMessage(messageParts);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;