const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
       return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    // Fetch user invoices
    const invoices = await Invoice.find({ userId: req.user.id }).lean();

    // Format invoices to string
    const invoiceContext = invoices.map(i => {
      const d = i.date ? new Date(i.date).toLocaleDateString() : 'Unknown Date';
      return `Vendor: ${i.vendor || "Unknown"}, Date: ${d}, Amount: $${i.amount}, Category: ${i.category}, Status: ${i.status}`;
    }).join("\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a helpful and intelligent financial assistant for an invoice management platform.
Below is the limited invoice data available for the current user. Use ONLY this data to accurately answer the user's question. If the user asks general questions not related to finances, politely remind them of your purpose. Be concise and conversational.

INVOICE DATA START:
${invoiceContext}
INVOICE DATA END

User Question: ${query}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

module.exports = router;
