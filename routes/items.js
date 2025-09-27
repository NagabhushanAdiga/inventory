const express = require("express");
const Item = require("../models/Item");
const Group = require("../models/Group"); // new model
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// ================= GROUP ROUTES =================

// Create Group
router.post("/groups", auth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Group name required" });

  const exists = await Group.findOne({ name });
  if (exists) return res.status(400).json({ message: "Group already exists" });

  const group = new Group({
    name,
    description,
    createdBy: req.user._id,
  });

  await group.save();
  res.json(group);
});

// Get all Groups
router.get("/groups", auth, async (req, res) => {
  const groups = await Group.find().sort({ createdAt: -1 });
  res.json(groups);
});

// ================= ITEM ROUTES =================

// GET /items?search=&groupId=&page=1&limit=20
router.get("/", auth, async (req, res) => {
  const { search = "", groupId, page = 1, limit = 20 } = req.query;

  const q = {};
  if (search) q.name = { $regex: search, $options: "i" };
  if (groupId) q.group = groupId;

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const total = await Item.countDocuments(q);

  const items = await Item.find(q)
    .populate("group", "name") // include group name
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
});

// GET single item
router.get("/:id", auth, async (req, res) => {
  const item = await Item.findById(req.params.id).populate("group", "name");
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

// CREATE (with optional image)
router.post("/", auth, upload.single("image"), async (req, res) => {
  const { name, sku, description, quantity, location, price, group } = req.body;
  if (!name) return res.status(400).json({ message: "name required" });

  const item = new Item({
    name,
    sku,
    description,
    quantity: quantity ? Number(quantity) : 0,
    location,
    price: price ? Number(price) : 0,
    group: group || null, // assign group if provided
    createdBy: req.user._id,
  });

  if (req.file) item.image = `/${req.file.path.replace(/\\/g, "/")}`;

  await item.save();
  res.json(await item.populate("group", "name"));
});

// UPDATE
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  const updates = (({ name, sku, description, quantity, location, price, group }) => ({
    name,
    sku,
    description,
    quantity,
    location,
    price,
    group,
  }))(req.body);

  Object.keys(updates).forEach((k) => {
    if (updates[k] !== undefined) item[k] = updates[k];
  });

  if (req.file) item.image = `/${req.file.path.replace(/\\/g, "/")}`;

  await item.save();
  res.json(await item.populate("group", "name"));
});

// DELETE (admin or creator)
router.delete("/:id", auth, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  if (req.user.role !== "admin" && item.createdBy?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await item.remove();
  res.json({ message: "Deleted" });
});

module.exports = router;
