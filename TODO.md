# TODO: Fix Error "Gagal Menilai Dokumen" di Vercel

## Root Cause
1. `pdfParser.js` line 23 — `workerSrc = "./api/lib/pdf.worker.mjs"` points to non-existent path
2. pdfjs-dist v4.x legacy build already includes worker built-in for Node.js — no `workerSrc` needed
3. No fallback/handling if dynamic ESM import fails in Vercel

## Steps

### Step 1 ✅ Fix `server/services/pdfParser.js`
- [x] Remove `GlobalWorkerOptions.workerSrc` broken line
- [x] Add try-catch fallback (ESM import → CJS require)
- [x] Improve error messages for debugging

### Step 2 ✅ Fix `vercel.json`
- [x] Add `functions` config with `includeFiles` for pdfjs-dist
- [x] Ensure serverless function has all necessary files

### Step 3 ✅ Fix `server/routes/assess.js`
- [x] Add error handling for import/worker failure types
- [x] Ensure all errors return JSON not HTML

### Step 4 ✅ Fix `api/index.js` — Add catch-all error wrapper
- [x] Ensure any uncaught error returns JSON not HTML

### Step 5 ✅ Deploy & Test (manual)
- [ ] Deploy to Vercel: `npx vercel --prod`
- [ ] Test upload PDF via browser

