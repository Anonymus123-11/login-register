require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const setupSwagger = require("./swagger"); // import swagger riêng

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Default route
app.get("/", (req, res) => res.send("Welcome"));

// Routes
app.use("/api/users", userRoutes);

// Swagger docs
setupSwagger(app);

// Health check DB
app.get("/health/db", (_, res) =>
  res.json({ readyState: mongoose.connection.readyState })
);

// Mongo logs
mongoose.connection.on("connected", () => console.log("✅ MongoDB connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err));
mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));

// Start
async function start() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI missing");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();
