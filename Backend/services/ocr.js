const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse");
const fs = require("fs-extra");
const path = require("path");

// Extract text from image
const extractFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, "eng", {
    tessedit_pageseg_mode: 1, // Auto layout
    preserve_interword_spaces: 1,
  });

  return result.data.text;
};

// Extract text from PDF
const extractFromPDF = async (filePath) => {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// Main OCR function
const extractText = async (fileName) => {
  const filePath = path.join(__dirname, "..", "uploads", fileName);

  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf") {
    return await extractFromPDF(filePath);
  } else {
    return await extractFromImage(filePath);
  }
};

module.exports = extractText;