require("dotenv").config()
const express = require("express")
const path = require("path")
const cors = require("cors")
const connectDB = require("./config/db")
const authRoutes = require("./routes/auth")
const itemsRoutes = require("./routes/items")

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory"
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads"

const app = express()
app.use(cors())
app.use(express.json())
app.use("/" + UPLOAD_DIR, express.static(path.join(__dirname, UPLOAD_DIR)))

connectDB(MONGO_URI).catch(err => { console.error(err) ;process.exit(1) })

app.use("/auth", authRoutes)
app.use("/items", itemsRoutes)

app.get("/", (req, res) => res.send("Inventory API running"))

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`))
