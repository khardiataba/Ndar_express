const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const http = require("http")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config({ path: path.join(__dirname, ".env") })

const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const rideRoutes = require("./routes/rideRoutes")
const serviceRoutes = require("./routes/serviceRoutes")
const applicationRoutes = require("./routes/applicationRoutes")
const ratingRoutes = require("./routes/ratingRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const mapsRoutes = require("./routes/mapsRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const supportRoutes = require("./routes/supportRoutes")
const rentalRoutes = require("./routes/rentalRoutes")
const galleryRoutes = require("./routes/galleryRoutes")
const userRoutes = require("./routes/userRoutes")
const socketManager = require("./socket/socketManager")

const app = express()
const server = http.createServer(app)

// ================= SOCKET =================
socketManager.initialize(server)

// ================= SECURITY =================
app.use(helmet())

// ================= CORS =================
const DEFAULT_ALLOWED_ORIGINS = [
  "https://ndar-express-eezj.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174"
]

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : DEFAULT_ALLOWED_ORIGINS

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)

app.options("*", cors())

// ================= BODY LIMIT (important Render 512MB) =================
app.use(express.json({ limit: "50kb" }))
app.use(express.urlencoded({ extended: true, limit: "50kb" }))

// ================= RATE LIMIT =================
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
})

app.use(generalLimiter)

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    message: "YOON WI API OK",
    status: "running"
  })
})

// ================= ROUTES =================
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/rides", rideRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/ratings", ratingRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/maps", mapsRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/support", supportRoutes)
app.use("/api/rentals", rentalRoutes)
app.use("/api/gallery", galleryRoutes)
app.use("/api/user", userRoutes)
app.use("/api/users", userRoutes)

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({
    message: `Route API introuvable: ${req.method} ${req.originalUrl}`
  })
})

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Error:", err.message)

  res.status(err.status || 500).json({
    message: err.message || "Erreur serveur"
  })
})

// ================= DATABASE =================
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI manquant")
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET manquant")
    }

    mongoose.set("strictQuery", true)

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    })

    console.log("MongoDB connecté")

    server.listen(PORT, () => {
      console.log(`Serveur running sur port ${PORT}`)
    })
  } catch (err) {
    console.error("Erreur serveur:", err.message)
    process.exit(1)
  }
}

startServer()

// ================= PROCESS SAFETY =================
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err)
})

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err)
})

// ================= SHUTDOWN =================
const shutdown = async (signal) => {
  console.log(`${signal} reçu`)

  server.close(async () => {
    await mongoose.connection.close()
    process.exit(0)
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))