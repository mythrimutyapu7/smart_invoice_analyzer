const multer = require("multer");
const path = require("path");
const fs = require("fs");
const express = require("express");
const Invoice = require("../models/Invoice");
const extractData = require("../services/ocr");

const router = express.Router();

// --- STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// --- ROUTES ---

// 1. GET /api/invoices - List all invoices with filtering/search
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      sortField = "createdAt",
      sortOrder = "desc",
      search,
      category,
      startDate,
      endDate,
    } = req.query;

    const userId = req.user._id;
    const filter = { userId };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ vendor: regex }, { category: regex }, { invoiceNo: regex }];
    }

    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };
    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ total, page: Number(page), limit: Number(limit), data: invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/invoices/upload - AI ENSEMBLE UPLOAD
// ... existing imports ...

router.post("/upload", upload.single("invoice"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    console.log("Running Gemini Extraction...");
    const fields = await extractData(req.file.filename);
    
    console.log("----- AI EXTRACTION RESULTS -----");
    console.log(JSON.stringify(fields, null, 2));
    console.log("---------------------------------");

    // DATABASE SAVE
    const invoice = new Invoice({
      userId: req.user._id,
      fileName: req.file.filename,
      rawText: JSON.stringify(fields),
      vendor: fields.vendor || "Unknown Vendor",
      date: fields.issueDate ? new Date(fields.issueDate) : new Date(),
      amount: fields.total || 0,
      invoiceNo: fields.invoiceNo || "N/A",
      category: fields.category || "Uncategorized",
    });

    await invoice.save();
    res.json({ message: "Processed", extractedData: fields, invoice });

  } catch (error) {
    console.error("ROUTE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/invoices/summary - Aggregated totals
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user._id;
    const userMatch = { userId };

    const categories = await Invoice.aggregate([
      { $match: userMatch },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const totals = await Invoice.aggregate([
      { $match: userMatch },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, invoiceCount: { $sum: 1 } } },
    ]);

    const { totalAmount = 0, invoiceCount = 0 } = totals[0] || {};
    res.json({ categories, totalAmount, invoiceCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE /api/invoices/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;