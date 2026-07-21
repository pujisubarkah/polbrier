# TODO: Perbaikan Error "Unexpected token" di Vercel

## Root Cause
`multer` tidak kompatibel dengan lingkungan serverless Vercel karena Vercel sudah mengonsumsi raw request body sebelum Express/multer memprosesnya. Akibatnya, `multer` gagal memparse `multipart/form-data` dan Express mengembalikan HTML error page (bukan JSON), sehingga frontend gagal parse sebagai JSON.

## Rencana Perbaikan
Alihkan dari `multer` (upload file via `multipart/form-data`) ke pendekatan **base64 JSON** yang kompatibel dengan serverless.

### Steps

- [x] **Step 1**: Hapus dependensi `multer` dari `package.json`
- [x] **Step 2**: Update `server/index.js` — perbesar limit JSON body (50MB) untuk tampung base64 file
- [x] **Step 3**: Update `server/routes/assess.js` — ubah dari multer multipart ke penerimaan JSON base64
- [x] **Step 4**: Update `public/app.js` — ubah dari FormData ke base64 JSON POST + tambah helper `fileToBase64`
- [x] **Step 5**: Update `vercel.json` — pastikan konfigurasi mendukung body besar
- [x] **Step 6**: Hapus `node_modules` dan re-install dependencies (multer otomatis terhapus)
- [x] **Step 7**: Test hasil perubahan — server berjalan normal di port 3000

