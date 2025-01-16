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
    const { fileType, fileContent } = req.body;

    if (!fileType || !fileContent) {
        return res.status(400).json({ error: "Missing fileType or fileContent" });
    }

    let mimeType;
    if (fileType === 'pdf') {
        mimeType = 'application/pdf';
    } else if (fileType === 'txt') {
        mimeType = 'text/plain';
    } else {
        return res.status(400).json({ error: "Invalid fileType. Must be 'pdf' or 'txt'." });
    }

    try {
        const buffer = Buffer.from(fileContent, 'base64');
        const tempFilePath = `temp_file_${Date.now()}.${fileType}`;
        fs.writeFileSync(tempFilePath, buffer);

        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: mimeType,
            displayName: `uploaded_file_${Date.now()}`
        });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze the following document and provide a detailed summary and key points. Your ENTIRE response MUST be a valid JSON object, and nothing else. Do not include any backticks, the word "json", or any other conversational text or explanations. The JSON object should have the following format:
        
        {
            "summary": "A detailed summary of the document.",
            "keyPoints": ["key point 1", "key point 2", "key point 3"]
        }
        `;

        const result = await model.generateContent([
            {
                fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: uploadResult.file.mimeType,
                },
            },
            prompt
        ]);

        fs.unlinkSync(tempFilePath);

        try {
            const jsonResponse = JSON.parse(result.response.text());
            res.json(jsonResponse);
        } catch (error) {
            console.error("Error parsing JSON response:", error);
            res.status(500).json({ error: "Failed to parse JSON response from AI model." });
        }

    } catch (error) {
        console.error("Error processing document:", error);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

export default router;