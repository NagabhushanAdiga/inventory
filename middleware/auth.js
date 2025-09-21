const jwt = require("jsonwebtoken")
const User = require("../models/User")
const SECRET = process.env.JWT_SECRET

async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: "Missing token" })
  const token = header.split(" ")[1]
  try {
    const payload = jwt.verify(token, SECRET)
    const user = await User.findById(payload.id).select("-password")
    if (!user) return res.status(401).json({ message: "Invalid token user" })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

function permit(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })
    if (allowed.includes(req.user.role)) return next()
    return res.status(403).json({ message: "Forbidden" })
  }
}

module.exports = { auth, permit }
