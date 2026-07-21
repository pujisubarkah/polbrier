/**
 * pdfParser.js
 * Ekstrak teks dari file PDF menggunakan pdfjs-dist (Mozilla PDF.js)
 * - Menggunakan dynamic import() untuk ESM (.mjs) — compatible dengan Vercel serverless
 * - pdfjs-dist v4.x hanya menyediakan file .mjs, sehingga require() tidak bisa digunakan
 * - disableFontFace + useSystemFonts agar tidak perlu font files
 * - Tidak perlu CMap filesystem — compatible dengan Vercel
 * 
 * IMPORTANT: pdfjs-dist v4.x legacy build sudah include worker built-in untuk Node.js.
 * JANGAN set workerSrc karena akan menyebabkan error fetch worker dari path yang tidak ada.
 */

let pdfjsLib = null;

/**
 * Lazy-load pdfjs-dist (ESM .mjs) di runtime via dynamic import()
 * pdfjs-dist v4.x ke atas hanya menyediakan file .mjs (ESM), 
 * bukan .js (CJS) — sehingga menggunakan import() sebagai ganti require().
 * 
 * Fallback: Jika import ESM gagal (misal di Vercel), coba require CJS.
 */
async function getPdfjsLib() {
  if (!pdfjsLib) {
    try {
      // Dynamic import untuk ESM .mjs — compatible dengan Node.js 20+ dan Vercel
      const module = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Legacy build v4.x sudah include worker built-in untuk Node.js.
      // Tidak perlu set workerSrc — setting ini malah menyebabkan error
      // karena mencoba fetch file worker yang tidak ada di Vercel.
      pdfjsLib = module;
    } catch (importErr) {
      console.warn("ESM import gagal, mencoba CJS fallback:", importErr.message);
      try {
        // Fallback: Coba require CJS (untuk environment yang tidak support ESM)
        const module = require("pdfjs-dist/legacy/build/pdf.js");
        pdfjsLib = module;
      } catch (requireErr) {
        console.error("CJS fallback juga gagal:", requireErr.message);
        throw new Error(
          "Gagal memuat library PDF. " +
          "Import ESM: " + importErr.message + ". " +
          "CJS fallback: " + requireErr.message
        );
      }
    }
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

    // Konversi buffer ke Uint8Array
    const data = new Uint8Array(buffer);

    // Load dokumen PDF
    // Gunakan disableFontFace + useSystemFonts agar Vercel tidak perlu font files
    const pdfDoc = await lib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
      disableAutoFetch: true,
      disableStream: true
    }).promise;

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
    console.error("PDF Parsing Error Details:", err);
    console.error("Stack Trace:", err.stack);
    throw new Error("Gagal membaca file PDF: " + err.message);
  }
}

module.exports = { extractTextFromPDF };
