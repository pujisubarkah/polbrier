/**
 * assess.js
 * Route POST /api/assess — terima base64 PDF via JSON, nilai, kembalikan hasil JSON
 * Tidak menggunakan multer agar kompatibel dengan Vercel serverless.
 */

const express = require("express");
const { extractTextFromPDF } = require("../services/pdfParser");
const { evaluatePolicyBrief } = require("../services/evaluator");

const router = express.Router();

// POST /api/assess
router.post("/", async (req, res) => {
  try {
    const { fileBase64, fileName, fileSize } = req.body;

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        error: "Tidak ada file yang diunggah."
      });
    }

    // Validasi prefix base64 PDF
    if (!fileBase64.startsWith("data:application/pdf;base64,")) {
      return res.status(400).json({
        success: false,
        error: "Format file tidak valid. Hanya file PDF yang diperbolehkan."
      });
    }

    // Decode base64 ke Buffer
    const base64Data = fileBase64.replace(/^data:application\/pdf;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Validasi ukuran (maks 20 MB)
    if (buffer.length > 20 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: "Ukuran file terlalu besar. Maksimal 20 MB."
      });
    }

    // 1. Ekstrak teks dari PDF
    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Teks dalam PDF terlalu sedikit atau tidak dapat dibaca. Pastikan PDF bukan hasil scan gambar."
      });
    }

    // 2. Evaluasi teks
    const result = evaluatePolicyBrief(text);

    // 3. Tambahkan metadata file
    result.fileName = fileName || "dokumen.pdf";
    result.fileSize = fileSize || buffer.length;
    result.assessedAt = new Date().toISOString();

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("Assessment error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Terjadi kesalahan saat menilai dokumen."
    });
  }
});

module.exports = router;
