/**
 * assess.js
 * Route POST /api/assess — terima base64 PDF via JSON, nilai, kembalikan hasil JSON
 * Tidak menggunakan multer agar kompatibel dengan Vercel serverless.
 */

const express = require("express");
const { extractTextFromPDF } = require("../services/pdfParser");
const { evaluatePolicyBrief } = require("../services/evaluator");
const { detectAI } = require("../services/aiDetector");

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

    // 2b. Deteksi AI
    result.aiDetection = detectAI(text);

    // 3. Tambahkan metadata file
    result.fileName = fileName || "dokumen.pdf";
    result.fileSize = fileSize || buffer.length;
    result.assessedAt = new Date().toISOString();

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("Assessment error:", err);
    console.error("Stack:", err.stack);

    // Kategorikan error untuk pesan yang lebih informatif
    let statusCode = 500;
    let errorMessage = err.message || "Terjadi kesalahan saat menilai dokumen.";
    let errorCode = "INTERNAL_ERROR";

    if (err.message && err.message.includes("Gagal membaca file PDF")) {
      statusCode = 400;
      errorCode = "PDF_PARSE_ERROR";
      errorMessage = "Gagal membaca file PDF. Pastikan file adalah PDF yang valid dan tidak rusak.";
    } else if (err.message && err.message.includes("Teks kosong")) {
      statusCode = 400;
      errorCode = "EMPTY_TEXT";
      errorMessage = "PDF tidak mengandung teks yang bisa diekstrak. Pastikan PDF bukan hasil scan gambar.";
    } else if (err.message && err.message.includes("Timeout")) {
      statusCode = 504;
      errorCode = "TIMEOUT";
      errorMessage = "Waktu analisis habis. Dokumen terlalu besar, coba file dengan ukuran lebih kecil.";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: errorCode
    });
  }
});

module.exports = router;
