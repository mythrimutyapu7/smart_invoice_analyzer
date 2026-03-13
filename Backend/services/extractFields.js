// Backend/services/extractFields.js

const extractFields = (text) => {
  const result = {};

  if (!text) return result;

  // Normalize text
  const cleanText = text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ");

  const lines = cleanText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 2);

  /* =======================
     VENDOR (Company Name)
     ======================= */

  // Take top lines only
  const topLines = lines.slice(0, 10);

  let vendorCandidate = "";

  for (let line of topLines) {
    // Skip lines with numbers
    if (/\d/.test(line)) continue;

    // Skip keywords
    if (/invoice|date|no\.|total|bill/i.test(line)) continue;

    const letters = line.replace(/[^A-Za-z]/g, "");
    if (letters.length < 4) continue;

    const upperCount = letters.replace(/[^A-Z]/g, "").length;
    const ratio = upperCount / letters.length;

    // Prefer mostly uppercase
    if (ratio > 0.5 && line.length > vendorCandidate.length) {
      vendorCandidate = line;
    }
  }

  if (vendorCandidate) {
    result.vendor = vendorCandidate;
  }

  /* =======================
     INVOICE NUMBER
     ======================= */

  const invoiceRegex =
    /(invoice\s*(no|number|#)?\s*[:\-]?\s*)([A-Za-z0-9\-]+)/i;

  const invoiceMatch = cleanText.match(invoiceRegex);

  if (invoiceMatch) {
    result.invoiceNo = invoiceMatch[3];
  }

  /* =======================
     DATE (Issue / Bill Date)
     ======================= */

  const dateRegex =
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;

  const dates = cleanText.match(new RegExp(dateRegex, "g"));

  if (dates && dates.length > 0) {
    result.date = dates[0]; // First date = usually issue date
  }

  /* =======================
     TOTAL AMOUNT
     ======================= */

  const totalRegex =
    /(total|amount\s*due|grand\s*total|net\s*total)[^0-9]*([\₹\$€]?\s?[\d,]+(\.\d{2})?)/i;

  const totalMatch = cleanText.match(totalRegex);

  if (totalMatch) {
    const amount = totalMatch[2]
      .replace(/[^\d.]/g, "");

    result.amount = parseFloat(amount);
  }

  /* =======================
     CURRENCY
     ======================= */

  if (cleanText.includes("₹")) {
    result.currency = "INR";
  } else if (cleanText.includes("€") || cleanText.includes("EUR")) {
    result.currency = "EUR";
  } else if (cleanText.includes("$") || cleanText.includes("USD")) {
    result.currency = "USD";
  } else {
    result.currency = "UNKNOWN";
  }

  /* =======================
     CATEGORY (RULE BASED)
     ======================= */

  const lower = cleanText.toLowerCase();

  if (lower.includes("electric") || lower.includes("water") || lower.includes("gas")) {
    result.category = "Utilities";

  } else if (lower.includes("uber") || lower.includes("ola") || lower.includes("taxi")) {
    result.category = "Travel";

  } else if (lower.includes("facebook") || lower.includes("google ads")) {
    result.category = "Marketing";

  } else if (lower.includes("stationery") || lower.includes("office")) {
    result.category = "Office";

  } else {
    result.category = "Other";
  }

  return result;
};

module.exports = extractFields;