/**
 * api/index.js — Vercel Serverless Entry Point
 * 
 * Vercel mengharuskan Serverless Functions berada di dalam direktori `api/`.
 * File ini mengimpor aplikasi Express dari `server/index.js` dan
 * mengeksposnya sebagai handler serverless untuk Vercel.
 * 
 * Penting: Handler ini membungkus request Express dengan try-catch
 * untuk memastikan 100% error dikembalikan sebagai JSON, bukan HTML.
 * Vercel secara default akan mengembalikan HTML error page jika
 * terjadi unhandled exception di serverless function.
 * 
 * Referensi:
 *   - https://vercel.com/docs/functions/serverless-functions
 *   - https://vercel.com/docs/functions/creating-and-deploying
 */

const app = require("../server/index");

/**
 * Wrapper handler untuk Vercel serverless.
 * Memastikan semua error yang tidak tertangkap Express
 * tetap dikembalikan sebagai JSON response.
 */
module.exports = async (req, res) => {
  try {
    // Forward request ke Express app
    await app(req, res);
  } catch (err) {
    console.error("Vercel serverless unhandled error:", err);
    console.error("Stack:", err.stack);

    // Pastikan response selalu JSON, jangan sampai Vercal mengembalikan HTML
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Server mengembalikan halaman error. Silakan coba lagi atau hubungi administrator.",
        errorCode: "UNHANDLED_SERVER_ERROR"
      });
    }
  }
};


