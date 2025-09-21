const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const router = express.Router()

const SECRET = process.env.JWT_SECRET || "supersecret"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h"
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" })
    }

    const existing = await User.findOne({ username })
    if (existing) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      password: hash,
      role: role || "user"
    })

    res.json({
      message: "Registered successfully",
      user: { id: user._id, username: user.username, role: user.role }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" })
    }

    const user = await User.findOne({ username })
    if (!user) return res.status(400).json({ message: "Invalid credentials" })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(400).json({ message: "Invalid credentials" })

    const accessToken = jwt.sign({ id: user._id }, SECRET, { expiresIn: JWT_EXPIRES_IN })
    const refreshToken = jwt.sign({ id: user._id }, SECRET, { expiresIn: REFRESH_EXPIRES_IN })

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, username: user.username, role: user.role }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
