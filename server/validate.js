const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { extractTextFromPDF } = require('./services/pdfParser');
const { evaluatePolicyBrief } = require('./services/evaluator');

const datasetPath = path.join(__dirname, 'dataset.csv');
const results = [];

/**
 * Fungsi utama untuk menjalankan proses validasi.
 */
async function validate() {
  console.log('Memulai proses validasi...');

  if (!fs.existsSync(datasetPath)) {
    console.error(`File dataset tidak ditemukan di: ${datasetPath}`);
    console.error('Pastikan file server/dataset.csv sudah ada.');
    return;
  }

  fs.createReadStream(datasetPath)
    .pipe(csv())
    .on('data', (row) => {
      results.push(processRow(row));
    })
    .on('end', async () => {
      try {
        const allResults = await Promise.all(results);
        console.log('\nValidasi selesai. Menghitung laporan akurasi...');
        generateReport(allResults);
      } catch (error) {
        console.error('\nTerjadi kesalahan saat memproses semua file:', error.message);
      }
    });
}

/**
 * Memproses satu baris dari file CSV.
 * @param {object} row - Data satu baris dari CSV.
 */
async function processRow(row) {
  const pdfPath = path.join(__dirname, row.file_path);
  console.log(`- Memproses: ${row.file_path}`);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`File PDF tidak ditemukan: ${pdfPath}`);
  }

  const fileBuffer = fs.readFileSync(pdfPath);
  const text = await extractTextFromPDF(fileBuffer);

  if (!text || text.trim().length < 50) {
    throw new Error('Teks tidak dapat diekstrak atau terlalu sedikit.');
  }

  const evaluation = evaluatePolicyBrief(text);
  const systemScores = {};
  evaluation.indicators.forEach(ind => {
    systemScores[ind.id] = ind.score;
  });

  const manualScores = {};
  Object.keys(row).forEach(key => {
    if (key !== 'file_path') {
      manualScores[key] = parseInt(row[key], 10);
    }
  });

  return { file: row.file_path, manual: manualScores, system: systemScores };
}

/**
 * Menghasilkan dan menampilkan laporan perbandingan.
 * @param {Array<object>} allResults - Hasil perbandingan skor.
 */
function generateReport(allResults) {
  if (allResults.length === 0) {
    console.log('Tidak ada hasil untuk dilaporkan. Periksa dataset.csv');
    return;
  }

  const errors = {};
  const counts = {};
  const indicatorIds = Object.keys(allResults[0].manual);

  // Inisialisasi total error dan jumlah data
  indicatorIds.forEach(id => {
    errors[id] = 0;
    counts[id] = 0;
  });

  // Akumulasi selisih absolut
  allResults.forEach(result => {
    indicatorIds.forEach(id => {
      const manualScore = result.manual[id];
      const systemScore = result.system[id];
      if (typeof manualScore === 'number' && typeof systemScore === 'number') {
        errors[id] += Math.abs(manualScore - systemScore);
        counts[id]++;
      }
    });
  });

  console.log('\n--- LAPORAN AKURASI (Mean Absolute Error) ---');
  console.log('MAE yang lebih rendah menunjukkan akurasi yang lebih baik.\n');

  // Hitung dan tampilkan MAE untuk setiap indikator
  indicatorIds.forEach(id => {
    if (counts[id] > 0) {
      const mae = errors[id] / counts[id];
      console.log(`- ${id.padEnd(25)}: ${mae.toFixed(2)}`);
    }
  });

  console.log('\n--- HASIL PERBANDINGAN (RAW) ---');
  console.log(JSON.stringify(allResults, null, 2));
}

// Jalankan validasi
validate();