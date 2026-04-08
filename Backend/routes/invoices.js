const multer = require("multer");
const path = require("path");
const fs = require("fs");
const express = require("express");
const PDFDocument = require("pdfkit");
const Invoice = require("../models/Invoice");
const extractData = require("../services/ocr");

const router = express.Router();

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

async function checkAndMarkOverdue(userId) {
  try {
    await Invoice.updateMany({
      userId,
      status: "pending",
      dueDate: { $lt: new Date(), $exists: true }
    }, {
      $set: { status: "overdue" }
    });
  } catch (e) {
    console.error("Error auto-updating status", e);
  }
}

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
      filter.$or = [
        { vendor: regex },
        { category: regex },
        { invoiceNo: regex },
        { status: regex }
      ];

      // If search string cleanly parses as a number, allow exact numeric searches on amount
      const parsedNum = parseFloat(search);
      if (!isNaN(parsedNum)) {
        filter.$or.push({ amount: parsedNum });
      }
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

router.post("/upload", upload.single("invoice"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    console.log("Running Gemini Extraction...");
    const fields = await extractData(req.file.filename);
    
    console.log("----- AI EXTRACTION RESULTS -----");
    console.log(JSON.stringify(fields, null, 2));
    console.log("---------------------------------");

    const vendor = fields.vendor || "Unknown Vendor";
    const amount = fields.total || 0;
    const userId = req.user._id;

    // Intelligent Flagging
    const warnings = [];

    // 1. Duplicate Detection
    const duplicate = await Invoice.findOne({ userId, vendor, amount });
    if (duplicate && amount > 0) {
      warnings.push(`Duplicate Warning: A previous invoice from ${vendor} for $${amount} already exists in your database.`);
    }

    // 2. Anomaly Detection
    if (amount > 0) {
      const historical = await Invoice.aggregate([
        { $match: { userId, vendor: vendor } },
        { $group: { _id: null, avgAmount: { $avg: "$amount" }, count: { $sum: 1 } } }
      ]);
      
      if (historical.length > 0) {
         const { avgAmount, count } = historical[0];
         // Trigger if amount > 200% of average, and there is a verified footprint (count >= 2)
         if (count >= 2 && amount > (avgAmount * 2)) {
           warnings.push(`Anomaly Warning: This amount ($${amount}) is unusually high compared to your historical average ($${avgAmount.toFixed(2)}) for ${vendor}.`);
         }
      }
    }

    res.json({ message: "Processed", extractedData: fields, fileName: req.file.filename, warnings });

  } catch (error) {
    console.error("ROUTE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2b. POST /api/invoices/confirm - SAVE TO DB
router.post("/confirm", async (req, res) => {
  try {
    const { fileName, extractedData, vendor, invoiceNo, amount, date, category, type } = req.body;
    
    const issueDate = new Date(date);
    const defaultDueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000); 

    const invoice = new Invoice({
      userId: req.user._id,
      fileName,
      invoiceNo: invoiceNo || "N/A",
      type: type || "expense",
      rawText: JSON.stringify(extractedData),
      vendor,
      date: issueDate,
      dueDate: defaultDueDate,
      amount,
      category,
    });
    
    await invoice.save();
    res.json({ message: "Invoice Confirmed and Saved", invoice });
  } catch (error) {
    console.error("CONFIRM ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/invoices/summary - Aggregated totals
router.get("/summary", async (req, res) => {
  try {
    const { vendor, category, status, startDate, endDate } = req.query;
    const userId = req.user._id;
    
    const userMatch = { userId };
    if (vendor) userMatch.vendor = vendor;
    if (category) userMatch.category = category;
    if (status) userMatch.status = status;
    if (startDate || endDate) {
      userMatch.date = {};
      if (startDate) userMatch.date.$gte = new Date(startDate);
      if (endDate) userMatch.date.$lte = new Date(endDate);
    }

    const categories = await Invoice.aggregate([
      { $match: userMatch },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const vendors = await Invoice.aggregate([
      { $match: userMatch },
      { $group: { _id: "$vendor", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    const totals = await Invoice.aggregate([
      { $match: userMatch },
      { $group: { 
          _id: null, 
          totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          invoiceCount: { $sum: 1 } 
      } },
    ]);

    const statusCounts = await Invoice.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: null,
          overdueCount: { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] } },
          overdueAmount: { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, "$amount", 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          pendingAmount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } }
        }
      }
    ]);

    const monthly = await Invoice.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const { totalIncome = 0, totalExpense = 0, invoiceCount = 0 } = totals[0] || {};
    const { overdueCount = 0, overdueAmount = 0, pendingCount = 0, pendingAmount = 0 } = statusCounts[0] || {};
    res.json({ categories, vendors, monthly, totalIncome, totalExpense, netBalance: totalIncome - totalExpense, invoiceCount, overdueCount, overdueAmount, pendingCount, pendingAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT /api/invoices/:id - Update invoice details
router.put("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const { vendor, date, dueDate, amount, category, status, notes } = req.body;

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { vendor, date, dueDate, amount, category, status, notes } },
      { returnDocument: "after" }
    );

    if (!updatedInvoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice updated successfully", data: updatedInvoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE /api/invoices/:id
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

// 5. GET /api/invoices/filters-lookup
router.get("/filters-lookup", async (req, res) => {
  try {
    const userId = req.user._id;
    const vendors = await Invoice.distinct("vendor", { userId });
    const categories = await Invoice.distinct("category", { userId });
    res.json({ vendors: vendors.filter(Boolean).sort(), categories: categories.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. GET /api/invoices/monthly-insights
router.get("/monthly-insights", async (req, res) => {
  try {
    const userId = req.user._id;
    let { month, year } = req.query;
    
    let now = new Date();
    if (month && year) {
      now = new Date(year, month - 1, 1);
    } else {
      // Smart Default: Find the latest month that has invoices
      const latestInvoice = await Invoice.findOne({ userId }).sort({ date: -1 });
      if (latestInvoice && latestInvoice.date) {
        now = new Date(latestInvoice.date);
      }
    }
    
    const targetMonth = now.getMonth();
    const targetYear = now.getFullYear();

    const firstDayThisMonth = new Date(targetYear, targetMonth, 1);
    const lastDayThisMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    const firstDayLastMonth = new Date(targetYear, targetMonth - 1, 1);
    const lastDayLastMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    const thisMonthInvoices = await Invoice.find({
      userId,
      date: { $gte: firstDayThisMonth, $lte: lastDayThisMonth }
    });
    
    const lastMonthInvoices = await Invoice.find({
      userId,
      date: { $gte: firstDayLastMonth, $lte: lastDayLastMonth }
    });

    const thisMonthTotal = thisMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const lastMonthTotal = lastMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    let growthFactor = 0;
    if (lastMonthTotal === 0 && thisMonthTotal > 0) {
      growthFactor = 100;
    } else if (lastMonthTotal > 0) {
      growthFactor = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }

    const daysInMonth = lastDayThisMonth.getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: `${i + 1}`,
      total: 0
    }));

    const categoryTotals = {};

    thisMonthInvoices.forEach(inv => {
      const day = new Date(inv.date).getDate() - 1;
      if (dailyData[day]) dailyData[day].total += (inv.amount || 0);
      
      const cat = inv.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (inv.amount || 0);
    });

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);

    res.json({
      month: targetMonth + 1,
      year: targetYear,
      thisMonthTotal,
      lastMonthTotal,
      growthFactor: parseFloat(growthFactor.toFixed(1)),
      dailyTrend: dailyData,
      categoryBreakdown: categoryData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET /api/invoices/export - Generate PDF/CSV
router.get("/export", async (req, res) => {
  try {
    const { format, sortField = "createdAt", sortOrder = "desc", search, category, status, startDate, endDate } = req.query;
    const userId = req.user._id;

    const filter = { userId };
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ vendor: regex }, { category: regex }, { invoiceNo: regex }];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };
    const invoices = await Invoice.find(filter).sort(sort);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="invoices_report.csv"');
      
      let csv = "Invoice No,Vendor,Category,Date,Due Date,Status,Amount\n";
      invoices.forEach(inv => {
        csv += `"${inv.invoiceNo || ''}","${inv.vendor}","${inv.category}","${formatDate(inv.date)}","${formatDate(inv.dueDate)}","${inv.status}",${inv.amount}\n`;
      });
      return res.send(csv);
    } else if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="invoices_report.pdf"');
      
      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);
      
      doc.fontSize(20).text("Financial Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("gray").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);
      
      const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);
      const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
      
      doc.fillColor("black").fontSize(12).text(`Total Invoices: ${invoices.length}`);
      doc.text(`Total Expenditure: $${totalAmount.toFixed(2)}`);
      if (overdueAmount > 0) {
        doc.fillColor("red").text(`Overdue Payments: $${overdueAmount.toFixed(2)}`);
      }
      doc.fillColor("black").moveDown(2);

      const tableTop = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 40, tableTop);
      doc.text("Vendor", 120, tableTop);
      doc.text("Category", 300, tableTop);
      doc.text("Status", 420, tableTop);
      doc.text("Amount", 500, tableTop);
      
      doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let y = tableTop + 25;
      doc.font("Helvetica");
      invoices.forEach((inv) => {
        if (y > 700) {
          doc.addPage();
          y = 40;
        }
        doc.text(formatDate(inv.date), 40, y);
        doc.text(inv.vendor.substring(0, 30), 120, y);
        doc.text(inv.category.substring(0, 18), 300, y);
        doc.fillColor(inv.status === 'overdue' ? 'red' : inv.status === 'paid' ? 'green' : 'black').text(inv.status.toUpperCase(), 420, y);
        doc.fillColor('black').text(`$${inv.amount.toFixed(2)}`, 500, y);
        y += 20;
      });
      
      doc.end();
    } else {
      res.status(400).json({ message: "Invalid format requested." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;