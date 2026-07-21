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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/assess", assessRoute);

// Fallback ke index.html
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Mulai server (hanya jika bukan di Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log("\n\u{1F680} Server berjalan di http://localhost:" + PORT);
  });
}

// ===== GLOBAL ERROR HANDLER =====
// Pastikan semua error dikembalikan sebagai JSON, bukan HTML
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  // Handle multer errors (file too large, wrong type, etc.)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "Ukuran file terlalu besar. Maksimal 20 MB."
    });
  }

  if (err.message && err.message.includes("Hanya file PDF")) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Default error response sebagai JSON
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Terjadi kesalahan internal server."
  });
});

// Ekspor aplikasi untuk Vercel
module.exports = app;

