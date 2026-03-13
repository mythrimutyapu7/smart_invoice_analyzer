const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    fileName: String,
    vendor: String,
    date: {
      type: Date,
      default: Date.now,
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