/**
 * api/index.js — Vercel Serverless Entry Point
 * 
 * Vercel mengharuskan Serverless Functions berada di dalam direktori `api/`.
 * File ini mengimpor aplikasi Express dari `server/index.js` dan
 * mengeksposnya sebagai handler serverless untuk Vercel.
 * 
 * Referensi:
 *   - https://vercel.com/docs/functions/serverless-functions
 *   - https://vercel.com/docs/functions/creating-and-deploying
 */

const app = require("../server/index");

module.exports = app;

