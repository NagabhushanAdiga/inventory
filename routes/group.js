// routes/groupRoutes.js
const express = require("express");
const Group = require("../models/Group");

const router = express.Router();

const generateRandomColour = () =>{
   const hexChars = '0123456789ABCDEF';
  let hexColor = '#';
  for (let i = 0; i < 6; i++) {
    hexColor += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return hexColor;
} 

// Create group
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Group name is required" });

    const exists = await Group.findOne({ name });
    if (exists) return res.status(400).json({ error: "Group already exists" });

    const group = await Group.create({ name, description ,colour:generateRandomColour() });
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single group
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update group
router.put("/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ error: "Group not found" });

    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();
    res.json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete group
router.delete("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    await group.deleteOne();
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
