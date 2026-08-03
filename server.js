// Load env from both .env files
require("dotenv").config({ path: "/vercel/share/.env.project" });
require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const uploadRoutes = require("./routes/upload");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", uploadRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large. Max 25 MB allowed." });
  }
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: err.message });
});

// ── MongoDB Connection 
const startServer = async () => {
  try {
    let mongoUri = process.env.MONGODB_CONNECTION_STRING;
    
    if (!mongoUri) {
      console.warn("⚠️  MONGODB_CONNECTION_STRING not set, using in-memory database");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }
    
    try {
      await mongoose.connect(mongoUri);
      console.log("✅  MongoDB connected");
    } catch (err) {
      console.error("❌  MongoDB connection failed:", err.message);
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀  Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌  Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();
