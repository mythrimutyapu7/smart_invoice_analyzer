const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    fileName: String,
    invoiceNo: String,
    vendor: String,
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    amount: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      default: "expense",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    notes: String,
    rawText: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);