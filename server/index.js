/**
 * index.js — Entry point server Express
 * Aplikasi Penilaian Policy Brief
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const assessRoute = require("./routes/assess");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Static files (frontend)
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/assess", assessRoute);

// Fallback ke index.html
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Mulai server
app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
});

// Ekspor aplikasi untuk Vercel
module.exports = app;
