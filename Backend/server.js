const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const Invoice = require("./models/Invoice");
const upload = require("./middleware/upload");
const extractData = require("./services/ocr");
const { authMiddleware } = require("./middleware/auth");
const invoicesRouter = require("./routes/invoices");
const authRouter = require("./routes/auth");
const chatRouter = require("./routes/chat");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Serve frontend (built via Vite) if dist exists, otherwise serve source files
const frontendRoot = path.join(__dirname, "..", "Frontend");
const builtFrontend = path.join(frontendRoot, "dist");

const frontendStaticPath = require("fs").existsSync(builtFrontend) ? builtFrontend : frontendRoot;
app.use(express.static(frontendStaticPath));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/invoices", authMiddleware, invoicesRouter);
app.use("/api/chat", authMiddleware, chatRouter);

// Connect DB
connectDB();

// Health endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve the frontend landing page on the root path.
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendStaticPath, "index.html"));
});

// Save invoice data (JSON)
app.post("/test-invoice", async (req, res) => {
  try {
    const invoice = new Invoice(req.body);

    await invoice.save();

    res.status(201).json({
      message: "Invoice saved",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// SPA fallback: serve index.html for any non-API route
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(frontendStaticPath, "index.html"));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});