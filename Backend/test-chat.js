require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/invoiceDB");
  
  const user = await User.findOne();
  if (!user) {
    console.log("No user found.");
    process.exit(1);
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "change-me", { expiresIn: "1h" });

  const Invoice = require("./models/Invoice");
  const invoices = await Invoice.find({ userId: user._id }).lean();
  const invoiceContext = invoices.map(i => {
    const d = i.date ? new Date(i.date).toLocaleDateString() : 'Unknown Date';
    return `Vendor: ${i.vendor || "Unknown"}, Date: ${d}, Amount: $${i.amount}, Category: ${i.category}, Status: ${i.status}`;
  }).join("\n");

  const query = "test";
  const prompt = `You are a helpful and intelligent financial assistant for an invoice management platform.
Below is the limited invoice data available for the current user. Use ONLY this data to accurately answer the user's question. If the user asks general questions not related to finances, politely remind them of your purpose. Be concise and conversational.

INVOICE DATA START:
${invoiceContext}
INVOICE DATA END

User Question: ${query}`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    console.log("REPLY:", result.response.text());
  } catch (err) {
    console.error("DEBUG ERR:", err);
  }
  process.exit(0);
}

test().catch(console.error);
