/**
 * assess.js
 * Route POST /api/assess — terima PDF, nilai, kembalikan hasil JSON
 */

const express = require("express");
const multer = require("multer");
const { extractTextFromPDF } = require("../services/pdfParser");
const { evaluatePolicyBrief } = require("../services/evaluator");

const router = express.Router();

// Konfigurasi multer — simpan di memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // maks 20 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Hanya file PDF yang diperbolehkan"));
    }
  }
});

// POST /api/assess
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Tidak ada file yang diunggah." });
    }

    // 1. Ekstrak teks dari PDF
    const text = await extractTextFromPDF(req.file.buffer);

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        error: "Teks dalam PDF terlalu sedikit atau tidak dapat dibaca. Pastikan PDF bukan hasil scan gambar."
      });
    }

    // 2. Evaluasi teks
    const result = evaluatePolicyBrief(text);

    // 3. Tambahkan metadata file
    result.fileName = req.file.originalname;
    result.fileSize = req.file.size;
    result.assessedAt = new Date().toISOString();

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("Assessment error:", err);
    res.status(500).json({ error: err.message || "Terjadi kesalahan saat menilai dokumen." });
  }
});

module.exports = router;
