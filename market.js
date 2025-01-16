import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const googleSearchApiKey = "AIzaSyC6WMw3KIBfclI5pycrP5dr-V0FjFcfses";
const googleSearchCx = "a23c94f48d3234044";

router.post('/', async (req, res) => {
    const { industry, focusKeyword, audienceRegion } = req.body;

    const searchQuery = `${industry} ${focusKeyword} in ${audienceRegion}`;

    try {
        const searchResponse = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: googleSearchApiKey,
                cx: googleSearchCx,
                q: searchQuery,
            },
        });

        const searchResults = searchResponse.data.items ? searchResponse.data.items.map(item => item.snippet).join('\n') : 'No search results found.';

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze the following search results and provide 5 key insights in JSON format:
                Always Produce an output with the available Search results and Always follow the JSON Format.

        
        Search Results:
        ${searchResults}

        The 5 key insights should be:
        1. Current trends in the industry.
        2. Top competitors or popular companies in the niche.
        3. Consumer sentiment or interest level.
        4. Popular search queries or topics.
        5. Suggestions for user action (e.g., potential strategies or products).
        
        
        The JSON format should be strictly a JSON object, without any additional formatting such as backticks or the word "json". For example:
        
        {
            "trends": ["trend 1", "trend 2"],
            "competitors": ["competitor 1", "competitor 2"],
            "sentiment": "positive",
            "queries": ["query 1", "query 2"],
            "suggestions": ["suggestion 1", "suggestion 2"]
        }
        `;
        const result = await model.generateContent(prompt);
        console.log("AI Response:", result.response.text());
        try {
            const jsonResponse = JSON.parse(result.response.text());
            res.json(jsonResponse);
        } catch (error) {
            console.error("Error parsing JSON response:", error);
            res.status(500).json({ error: "Failed to parse JSON response from AI model." });
        }

    } catch (error) {
        console.error("Error fetching search results or generating content:", error);
        res.status(500).json({ error: 'Failed to fetch search results or generate content' });
    }
});

export default router;