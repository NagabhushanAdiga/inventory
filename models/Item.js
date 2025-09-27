const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    location: { type: String, default: "" },
    price: { type: Number, default: 0 },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    image: { type: String, default: "" }, // stored as /uploads/...
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
