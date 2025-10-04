const mongoose = require("mongoose")

// Sub-schema to store a snapshot of the Group
const groupSnapshotSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  colour: { type: String, default: "" }
}, { _id: false }) // prevents creating an extra _id for this subdocument

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, default: "" },
  description: { type: String, default: "" },
  quantity: { type: Number, default: 0 },
  colour: { type: String },
  location: { type: String, default: "" },
  price: { type: Number, default: 0 },
  image: { type: String, default: "" }, // stored as /uploads/...
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // 👇 Embedded group snapshot
  group: { type: groupSnapshotSchema, required: true }

}, { timestamps: true })

module.exports = mongoose.model("Item", itemSchema)
