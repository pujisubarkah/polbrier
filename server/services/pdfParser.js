/**
 * pdfParser.js
 * Ekstrak teks dari file PDF menggunakan pdfjs-dist (Mozilla PDF.js)
 * - Pure JavaScript, tidak perlu CMap filesystem — compatible dengan Vercel serverless
 * - Menggunakan dynamic import() untuk ES module dari pdfjs-dist
 */

let pdfjsLib = null;

/**
 * Lazy-load pdfjs-dist (ESM) di runtime
 */
async function getPdfjsLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsLib;
}

/**
 * Ekstrak teks dari buffer PDF
 * @param {Buffer} buffer - Buffer file PDF
 * @returns {Promise<string>} - Teks yang diekstrak
 */
async function extractTextFromPDF(buffer) {
  try {
    const lib = await getPdfjsLib();
    
    // Konversi buffer ke Uint8Array (format yang dibutuhkan pdfjs-dist)
    const data = new Uint8Array(buffer);

    // Load dokumen PDF
    const pdfDoc = await lib.getDocument({ data }).promise;
    const totalPages = pdfDoc.numPages;
    const textPages = [];

    // Loop setiap halaman dan ekstrak teks
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      
      // Gabungkan item teks per halaman
      const pageText = content.items.map(item => item.str).join(" ");
      textPages.push(pageText);
    }

    // Gabungkan semua halaman
    const fullText = textPages.join("\n\n");
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error("Teks kosong setelah ekstraksi PDF.");
    }

    return fullText;
  } catch (err) {
    throw new Error("Gagal membaca file PDF: " + err.message);
  }
}

module.exports = { extractTextFromPDF };
