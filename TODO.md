# TODO: Perbaikan Error Vercel + Upgrade PDF Parser

## ✅ Completed

### Step 1 ✅ Update `package.json`
- Ganti dependency `pdf-parse` → `pdfjs-dist` + `@supabase/supabase-js`
- Update `package.json` ke version 2.0.0

### Step 2 ✅ Update `server/services/pdfParser.js`
- Ganti implementasi dari `pdf-parse` ke `pdfjs-dist/legacy/build/pdf`
- Tidak perlu CMap filesystem → compatible dengan Vercel serverless
- Menggunakan legacy build yang sudah include worker untuk Node.js

### Step 3 ✅ Update `server/routes/assess.js`
- Menambahkan error categorization dengan kode error spesifik
- PDF_PARSE_ERROR, EMPTY_TEXT, TIMEOUT — masing-masing dengan HTTP status code sesuai
- Stack trace logging untuk debugging

### Step 4 ✅ Update `public/app.js`
- Menambahkan visual feedback ❌ ketika terjadi error di step loading
- Upload section muncul kembali setelah error

### Step 5 ✅ Update `public/index.html`
- Menambahkan tips penanganan error pada error card
- Tips jelas: PDF teks (bukan scan), maks 20MB, coba ulang

### Step 6 ✅ Perbaiki CSS `public/index.css`
- Memperbaiki corrupted CSS — selector `.retry-btn` yang hilang sudah ditambahkan kembali
- Seluruh file CSS diverifikasi valid, tidak ada properti orphaned

### Step 7 ✅ Fix Evaluator — Skor Variatif Berdasarkan Konten
- **Masalah:** Semua dokumen mendapat skor sama karena keyword matching terlalu broad dan threshold terlalu rendah
- **Solusi:** Migrasi dari keyword frequency ke **aspect-based scoring**
- Setiap kriteria punya 4-5 aspek spesifik (0/1) yang diperiksa kehadirannya di teks
- Level ditentukan dari rasio aspek terpenuhi: 80%+ → level 4, 60-79% → level 3, 40-59% → level 2, <40% → level 1
- Penalti untuk dokumen pendek (<300 kata)
- Cover page dibatasi maksimal level 3 (karena penilaian visual butuh review manual)
- Juga memperbaiki app.js label dari "5 indikator" → "8 kriteria rubrik"

## 🔄 In Progress

### Step 8 🔄 Install dependencies (`npm install`)
- Menunggu instalasi selesai

## ⬜ Not Yet Started

### Step 9 ⬜ Test di lokal
- Jalankan `node server/index.js` dan coba upload PDF

### Step 10 ⬜ Deploy ke Vercel
- `vercel --prod` atau deploy via Vercel dashboard

