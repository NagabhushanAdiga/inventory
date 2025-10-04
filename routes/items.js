const express = require("express")
const Item = require("../models/Item")
const Group = require("../models/Group")
const { auth } = require("../middleware/auth")
const upload = require("../middleware/upload")
const router = express.Router()

const generateRandomColour = () => {
  const hexChars = "0123456789ABCDEF";
  let hexColor = "#";
  for (let i = 0; i < 6; i++) {
    hexColor += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return hexColor;
}

// ✅ GET /items?search=&page=1&limit=20&groupId=
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, groupId } = req.query

    const q = {}
    if (search) q.name = { $regex: search, $options: "i" }
    if (groupId) q["group._id"] = groupId  // filter by embedded group id

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const total = await Item.countDocuments(q)

    let items = await Item.find(q)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    // 🔄 Refresh group object for each item
    items = await Promise.all(
      items.map(async (item) => {
        const group = await Group.findById(item.group._id)
        if (group) {
          item.group = {
            _id: group._id,
            name: group.name,
            description: group.description,
            colour: group.colour
          }
        }
        return item
      })
    )

    res.json({ total, page: parseInt(page), limit: parseInt(limit), items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✅ GET single item (always refresh group details)
router.get("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return res.status(404).json({ message: "Not found" })

    const group = await Group.findById(item.group._id)
    if (group) {
      item.group = {
        _id: group._id,
        name: group.name,
        description: group.description,
        colour: group.colour
      }
    }

    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✅ CREATE item (with group snapshot)
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, sku, description, quantity, location, price, groupId } = req.body
    if (!name) return res.status(400).json({ message: "name required" })
    if (!groupId) return res.status(400).json({ message: "groupId required" })

    const group = await Group.findById(groupId)
    if (!group) return res.status(400).json({ message: "Invalid groupId" })

    const item = new Item({
      name,
      sku,
      description,
      quantity: quantity ? Number(quantity) : 0,
      colour: generateRandomColour(),
      location,
      price: price ? Number(price) : 0,
      createdBy: req.user._id,
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        colour: group.colour
      }
    })

    if (req.file) item.image = `/${req.file.path.replace(/\\/g, "/")}`
    await item.save()
    res.json(item)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ✅ UPDATE item (with group snapshot refresh)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return res.status(404).json({ message: "Not found" })

    const updates = (({ name, sku, description, quantity, location, price, groupId }) =>
      ({ name, sku, description, quantity, location, price, groupId }))(req.body)

    if (updates.groupId) {
      const group = await Group.findById(updates.groupId)
      if (!group) return res.status(400).json({ message: "Invalid groupId" })
      item.group = {
        _id: group._id,
        name: group.name,
        description: group.description,
        colour: group.colour
      }
      delete updates.groupId
    }

    Object.keys(updates).forEach(k => {
      if (updates[k] !== undefined) item[k] = updates[k]
    })

    if (req.file) item.image = `/${req.file.path.replace(/\\/g, "/")}`
    await item.save()
    res.json(item)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ✅ DELETE (admin or creator)
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return res.status(404).json({ message: "Not found" })

    if (req.user.role !== "admin" && item.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" })
    }

    await item.remove()
    res.json({ message: "Deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
