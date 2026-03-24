import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import multer from "multer";
import { KnowledgeManager } from "./KnowledgeManager.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// 📄 Upload document (PDF)
app.post("/upload-document", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        await KnowledgeManager.addDocument(req.file.originalname, req.file.buffer);
        res.json({ message: "File processed and added to knowledge base" });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to process document" });
    }
});

// 🔗 Add link for scraping
app.post("/add-link", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        await KnowledgeManager.addLink(url);
        res.json({ message: "Link processed and added to knowledge base" });
    } catch (error) {
        console.error("Link error:", error);
        res.status(500).json({ error: "Failed to scrape link" });
    }
});

// 📝 Add raw text
app.post("/add-text", async (req, res) => {
    try {
        const { label, content } = req.body;
        if (!content) return res.status(400).json({ error: "No content provided" });

        await KnowledgeManager.addText(label || "Manual Entry", content);
        res.json({ message: "Text added to knowledge base" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save text" });
    }
});

// 💬 Chat with Gemini + RAG (Local Knowledge Context)
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ response: "Gemini API Key is missing. Please check your .env file." });
        }

        // 🔍 1. FETCH RELEVANT CONTEXT FROM LOCAL KNOWLEDGE
        const context = await KnowledgeManager.findRelevantContext(message);
        
        // 🧪 2. PREPARE Gemini Prompt
        let prompt = `You are an AI Study Mentor for a Data Science student.
        Answer the following question in a helpful, professional, and educational tone.
        
        User Question: "${message}"`;

        if (context) {
            prompt = `You are an AI Study Mentor for a Data Science student. 
            I have found the following relevant material in the student's personal Knowledge Base:
            ---
            ${context}
            ---
            
            Using the provided context ABOVE (and your own general knowledge if the context is insufficient), answer the student's question: 
            "${message}"
            
            If the answer is found in the provided context, prioritize that information.`;
        } else {
            prompt += `\n\n(Note: No specific matches found in the student's knowledge base. Provide a high-quality general answer based on your Data Science expertise.)`;
        }

        // 🚀 3. CALL Gemini API (Updated to 2026 stable Gemini 2.5)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't formulate a response right now.";
        
        res.json({ 
            response: reply, 
            usingContext: !!context,
            source: context ? "Knowledge Base" : "General Wisdom" 
        });

    } catch (error) {
        console.error("Gemini Error:", error.response?.data || error.message);
        res.status(500).json({ response: `Chatbot error: ${error.message}. Please check your connection and API key.` });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});