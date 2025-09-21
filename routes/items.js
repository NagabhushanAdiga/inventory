const express = require("express")
const Item = require("../models/Item")
const { auth, permit } = require("../middleware/auth")
const upload = require("../middleware/upload")
const router = express.Router()

// GET /items?search=&page=1&limit=20
router.get("/", auth, async (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query
  const q = search ? { name: { $regex: search, $options: "i" } } : {}
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
  const total = await Item.countDocuments(q)
  const items = await Item.find(q).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 })
  res.json({ total, page: parseInt(page), limit: parseInt(limit), items })
})

// GET item
router.get("/:id", auth, async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) return res.status(404).json({ message: "Not found" })
  res.json(item)
})

// CREATE (with optional image)
router.post("/", auth, upload.single("image"), async (req, res) => {
  const { name, sku, description, quantity, location, price } = req.body
  if (!name) return res.status(400).json({ message: "name required" })
  const item = new Item({
    name,
    sku,
    description,
    quantity: quantity ? Number(quantity) : 0,
    location,
    price: price ? Number(price) : 0,
    createdBy: req.user._id
  })
  if (req.file) item.image = `/${req.file.path.replace(/\\/g, "/")}`
  await item.save()
  res.json(item)
})

// UPDATE
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) return res.status(404).json({ message: "Not found" })
  const updates = (({ name, sku, description, quantity, location, price }) => ({ name, sku, description, quantity, location, price }))(req.body)
  Object.keys(updates).forEach(k => { if (updates[k] !== undefined) item[k] = updates[k] })
  if (req.file) item.image = `/${req.file.path.replace(/\\/g, "/")}`
  await item.save()
  res.json(item)
})

// DELETE (admin or creator)
router.delete("/:id", auth, async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) return res.status(404).json({ message: "Not found" })
  if (req.user.role !== "admin" && item.createdBy?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" })
  }
  await item.remove()
  res.json({ message: "Deleted" })
})

module.exports = router
