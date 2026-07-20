/**
 * pdfParser.js
 * Ekstrak teks dari file PDF menggunakan pdf-parse v1.1.1
 */

const pdfParse = require("pdf-parse");

/**
 * Ekstrak teks dari buffer PDF
 * @param {Buffer} buffer - Buffer file PDF
 * @returns {Promise<string>} - Teks yang diekstrak
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err) {
    throw new Error("Gagal membaca file PDF: " + err.message);
  }
}

module.exports = { extractTextFromPDF };
