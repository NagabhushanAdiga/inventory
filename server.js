require("dotenv").config()
const express = require("express")
const path = require("path")
const cors = require("cors")
const connectDB = require("./config/db")

// Routes
const authRoutes = require("./routes/auth")
const itemsRoutes = require("./routes/items")
const groupRoutes = require('./routes/group')

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory"
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads"

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Serve uploaded files statically
app.use("/" + UPLOAD_DIR, express.static(path.join(__dirname, UPLOAD_DIR)))

// Database
connectDB(MONGO_URI).catch(err => {
  console.error(err)
  process.exit(1)
})

// ✅ Standard API prefixes
app.use("/api/auth", authRoutes)
app.use("/api/items", itemsRoutes)
app.use("/api/groups",groupRoutes)

app.get("/", (req, res) => res.send("✅ Inventory API is running"))

app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`))
