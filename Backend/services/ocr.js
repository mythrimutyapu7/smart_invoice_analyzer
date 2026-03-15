const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment!");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

const extractText = async (fileName) => {
  const filePath = path.join(__dirname, "..", "uploads", fileName);
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = ext === ".pdf" ? "application/pdf" : 
                   (ext === ".png" ? "image/png" : 
                   (ext === ".webp" ? "image/webp" : "image/jpeg"));
  
  const fileBuffer = fs.readFileSync(filePath);
  
  const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
          responseMimeType: "application/json"
      }
  });

  const prompt = `
  Analyze this invoice document and extract the following information.
  Provide the response as valid JSON with exactly these keys:
  - vendor: string (Name of the vendor/company, keep it concise)
  - issueDate: string (Date of the invoice, ISO format YYYY-MM-DD if possible)
  - total: number (Total amount of the invoice, just the number)
  - invoiceNo: string (Invoice number)
  - category: string 

  CRITICAL CATEGORY RULES:
  You MUST choose the single most accurate category from THIS EXACT LIST ONLY:
  ["Utilities", "Marketing", "Travel", "Office Supplies", "Software", "Food & Dining", "Hardware", "Consulting", "Legal", "Maintenance", "Shipping", "Rent", "Other"]

  DO NOT default to "Services" unless it is literally a professional consulting/legal service. 
  Look at the line items:
  - If it's a software subscription (e.g. Adobe, AWS, Slack), use "Software".
  - If it's a restaurant or food item, use "Food & Dining".
  - If it's electricity, water, or internet, use "Utilities".
  - If it's flights, hotels, or Uber, use "Travel".
  - If it's advertising or Facebook/Google Ads, use "Marketing".
  - If it's physical computer parts, use "Hardware".
  - If it's paper, pens, desks, use "Office Supplies".

  If any field is fundamentally missing, leave it as null. Do not include currency symbols in the total amount.
  `;

  try {
      const result = await model.generateContent([
          prompt,
          {
              inlineData: {
                  data: fileBuffer.toString("base64"),
                  mimeType
              }
          }
      ]);

      const responseText = result.response.text();
      return JSON.parse(responseText);
  } catch (error) {
      console.error("Gemini Extraction Error:", error);
      throw new Error("Failed to extract data using AI Vision model.");
  }
};

module.exports = extractText;