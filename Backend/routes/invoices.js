const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const extractFields = require("../services/extractFields");
const express = require("express");
const Invoice = require("../models/Invoice");

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// GET /api/invoices - list invoices with optional filtering, paging, sorting
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
      // simple text search across vendor, category, and notes
      const regex = new RegExp(search, "i");
      filter.$or = [{ vendor: regex }, { category: regex }, { notes: regex }];
    }

    if (category) {
      filter.category = category;
    }

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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices - create a new invoice
router.post("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const payload = { ...req.body, userId };

    if (payload.date) {
      payload.date = new Date(payload.date);
    }

    const invoice = new Invoice(payload);
    await invoice.save();

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/summary - category and monthly totals
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user._id;
    const userMatch = { userId };

    const categories = await Invoice.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const monthly = await Invoice.aggregate([
      { $match: userMatch },
      {
        $addFields: {
          month: { $dateToString: { format: "%Y-%m", date: "$date" } },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = await Invoice.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    const { totalAmount = 0, invoiceCount = 0 } = totals[0] || {};

    res.json({ categories, monthly, totalAmount, invoiceCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const invoice = await Invoice.findOne({ _id: req.params.id, userId });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/invoices/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/invoices/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
// POST /api/invoices/upload
router.post("/upload", upload.single("invoice"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;

    // OCR using Tesseract
    const { data } = await Tesseract.recognize(filePath, "eng");

    const text = data.text;

    // Extract fields
    const fields = extractFields(text);

    // Save invoice
    const invoice = new Invoice({
      ...fields,
      userId: req.user._id
    });

    await invoice.save();

    res.json({
      message: "Invoice processed successfully",
      extractedData: fields,
      invoice
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
