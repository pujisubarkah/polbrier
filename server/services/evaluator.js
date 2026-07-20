/**
 * evaluator.js
 * Penilaian Policy Brief berbasis analisis teks / keyword.
 * Menghasilkan skor 0-100 per indikator → Grade A-E.
 */

// ============================================================
// KONFIGURASI INDIKATOR & KEYWORD
// ============================================================

// Indikator baru berdasarkan Unit Kompetensi
const INDICATORS = [
  {
    id: "substansi_kebijakan",
    label: "Pengetahuan tentang Substansi Kebijakan Publik",
    weight: 0.20,
    description: "Pemahaman terhadap konteks, urgensi, dan signifikansi masalah dalam lingkup kebijakan publik.",
    keywords: {
      high: [
        "masalah", "problem", "isu", "krisis", "darurat", "mendesak", "urgensi", "konteks",
        "tantangan", "hambatan", "ketimpangan", "kesenjangan", "permasalahan", "latar belakang", "akar masalah",
        "signifikan", "kritis", "serius", "kompleks", "multidimensi", "dampak", "nasional",
        "kesehatan", "pendidikan", "ekonomi", "sosial", "lingkungan", "pembangunan", "faktor penyebab",
        "skala masalah", "kelompok terdampak", "kerentanan", "keadilan sosial", "kesejahteraan"
      ],
      medium: [
        "terjadi", "mengalami", "menghadapi", "berdampak", "mempengaruhi", "menyebabkan",
        "pemerintah", "masyarakat", "publik", "pemangku kepentingan", "stakeholder", "menjadi perhatian",
        "prioritas", "agenda", "isu strategis"
      ],
      structure: [
        "pendahuluan", "latar belakang", "rumusan masalah", "konteks kebijakan", "abstrak", "ringkasan eksekutif"
      ]
    }
  },
  {
    id: "metode_riset",
    label: "Metode Riset",
    weight: 0.20,
    description: "Penggunaan data, bukti empiris, dan metodologi riset yang valid untuk mendukung argumen.",
    keywords: {
      high: [
        "data", "statistik", "survei", "penelitian", "studi", "riset", "kajian",
        "temuan", "fakta", "bukti", "evidens", "empiris", "sumber", "referensi", "literatur", "data primer", "data sekunder",
        "jurnal", "publikasi", "metodologi", "metode", "kerangka", "validitas", "reliabilitas",
        "bps", "kemenkes", "who", "bank dunia", "wawancara", "kuesioner", "studi kasus", "case study",
        "analisis kuantitatif", "analisis kualitatif", "sampel", "populasi", "hipotesis"
      ],
      medium: [
        "menunjukkan", "membuktikan", "mengindikasikan", "berdasarkan", "menurut", "sesuai", "mengacu",
        "ditemukan", "dilaporkan", "menurut data"
      ],
      structure: [
        "metodologi penelitian", "metode", "tinjauan pustaka", "kajian literatur", "kerangka teori", "hasil dan pembahasan"
      ]
    }
  },
  {
    id: "analisis_kebijakan",
    label: "Teknik dan Analisis Kebijakan",
    weight: 0.20,
    description: "Penerapan teknik analisis untuk mengevaluasi opsi dan dampak kebijakan.",
    keywords: {
      high: [
        "analisis", "evaluasi", "perbandingan", "cost-benefit", "analisis biaya-manfaat", "swot",
        "analisis dampak", "proyeksi", "skenario", "pemodelan", "opsi kebijakan", "alternatif kebijakan", "analisis stakeholder",
        "efektivitas", "efisiensi", "kelayakan", "feasibility", "analisis risiko", "risk analysis",
        "pohon masalah", "problem tree", "cost-effectiveness"
      ],
      medium: [
        "mempertimbangkan", "mengevaluasi", "menganalisis", "dibandingkan", "potensi", "risiko",
        "diperkirakan", "implikasi", "konsekuensi"
      ],
      structure: [
        "analisis", "pembahasan", "evaluasi opsi", "kerangka analisis", "analisis dan pembahasan"
      ]
    }
  },
  {
    id: "saran_kebijakan",
    label: "Penyusunan Saran Kebijakan",
    weight: 0.20,
    description: "Kejelasan, kelayakan, dan relevansi saran atau rekomendasi kebijakan yang diajukan.",
    keywords: {
      high: [
        "rekomendasi", "saran", "usulan", "proposal", "opsi", "alternatif", "solusi",
        "kebijakan", "program", "intervensi", "implementasi", "penerapan", "pelaksanaan", "tahapan implementasi",
        "strategi", "langkah", "tindakan", "rencana aksi", "tindak lanjut", "kerangka waktu", "timeline",
        "anggaran", "monitoring", "evaluasi", "indikator keberhasilan", "kpi", "pilot project"
      ],
      medium: [
        "direkomendasikan", "disarankan", "diusulkan", "diperlukan", "sebaiknya", "perlu", "harus",
        "menyarankan", "mengusulkan", "mendorong"
      ],
      structure: [
        "rekomendasi kebijakan", "saran", "kesimpulan dan rekomendasi", "implikasi kebijakan"
      ]
    }
  },
  {
    id: "regulasi_legislasi",
    label: "Regulasi dan Legislasi",
    weight: 0.20,
    description: "Pemahaman terhadap kerangka hukum, regulasi, dan proses legislasi yang relevan.",
    keywords: {
      high: [
        "regulasi", "peraturan", "undang-undang", "uu", "perpu", "perpres", "permen", "perda",
        "hukum", "legal", "legislasi", "amandemen", "yuridis", "konstitusi", "dpr", "kementerian",
        "rancangan undang-undang", "ruu", "naskah akademik", "uji materiil", "judicial review"
      ],
      medium: [
        "mengatur", "menetapkan", "sesuai dengan", "berdasarkan pada", "kerangka hukum", "payung hukum", "legalitas"
      ],
      structure: [
        "landasan hukum", "aspek yuridis", "kerangka regulasi", "landasan yuridis"
      ]
    }
  }
];

// ============================================================
// FUNGSI PENILAIAN UTAMA
// ============================================================

/**
 * Hitung skor mentah untuk satu indikator berdasarkan teks
 * @param {string} text - Teks dokumen (lowercase)
 * @param {object} indicator - Konfigurasi indikator
 * @returns {number} - Skor 0-100
 */
function scoreIndicator(text, indicator) {
  const words = text.toLowerCase();
  const totalWords = text.split(/\s+/).length;

  // Hitung kemunculan keyword tiap kategori
  let highHits = 0;
  let mediumHits = 0;
  let structureHits = 0;

  indicator.keywords.high.forEach(kw => {
    const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'gi');
    const matches = (text.match(regex) || []).length;
    if (matches > 0) highHits += Math.min(matches, 3); // max 3 per keyword
  });

  indicator.keywords.medium.forEach(kw => {
    const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'gi');
    const matches = (text.match(regex) || []).length;
    if (matches > 0) mediumHits += Math.min(matches, 2);
  });

  indicator.keywords.structure.forEach(kw => {
    if (words.includes(kw.toLowerCase())) structureHits += 5;
  });

  // Normalisasi berdasarkan panjang dokumen
  const docFactor = Math.min(totalWords / 800, 1.5); // ideal ~800 kata

  const rawScore = (highHits * 3 + mediumHits * 1.5 + structureHits) / docFactor;

  // Skalakan ke 0-100
  const maxExpected = 60; // skor raw yang dianggap sempurna
  const normalized = Math.min((rawScore / maxExpected) * 100, 100);

  return Math.round(normalized);
}

/**
 * Escape karakter khusus regex
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Konversi skor numerik ke grade A-E
 */
function scoreToGrade(score) {
  if (score >= 85) return { grade: "A", label: "Sangat Baik", color: "#22c55e" };
  if (score >= 70) return { grade: "B", label: "Baik", color: "#84cc16" };
  if (score >= 55) return { grade: "C", label: "Cukup", color: "#eab308" };
  if (score >= 40) return { grade: "D", label: "Kurang", color: "#f97316" };
  return { grade: "E", label: "Sangat Kurang", color: "#ef4444" };
}

/**
 * Hasilkan deskripsi umpan balik berdasarkan skor
 */
function generateFeedback(indicatorId, score) {
  const feedbacks = {
    substansi_kebijakan: {
      high: "Pemahaman substansi kebijakan sangat baik. Masalah, konteks, dan urgensi diuraikan dengan jelas dan mendalam.",
      medium: "Substansi kebijakan cukup tergambar, namun perlu pendalaman lebih lanjut pada konteks atau urgensi masalah.",
      low: "Pemahaman substansi kebijakan masih dangkal. Perlu penjelasan yang lebih kuat mengenai masalah dan signifikansinya."
    },
    metode_riset: {
      high: "Penggunaan metode riset sangat kuat. Argumen didukung oleh data dan bukti empiris yang relevan dan kredibel.",
      medium: "Metode riset sudah digunakan, namun perlu diperkuat dengan data yang lebih kaya atau metodologi yang lebih jelas.",
      low: "Dukungan data dan metode riset sangat lemah. Argumen perlu didasarkan pada bukti yang valid dan dapat diverifikasi."
    },
    analisis_kebijakan: {
      high: "Teknik analisis kebijakan diterapkan dengan sangat baik untuk mengevaluasi berbagai opsi dan potensi dampaknya.",
      medium: "Analisis kebijakan sudah ada, namun bisa lebih tajam dengan penggunaan teknik yang lebih spesifik atau perbandingan opsi yang lebih mendalam.",
      low: "Analisis kebijakan masih bersifat deskriptif. Perlu penerapan teknik analisis untuk mengevaluasi opsi secara sistematis."
    },
    saran_kebijakan: {
      high: "Saran kebijakan yang disusun sangat jelas, konkret, dan berpotensi untuk diimplementasikan.",
      medium: "Saran kebijakan sudah ada, namun perlu diperjelas langkah-langkah implementasinya atau kelayakannya.",
      low: "Saran kebijakan masih terlalu umum atau tidak ada. Perlu dirumuskan usulan yang spesifik dan actionable."
    },
    regulasi_legislasi: {
      high: "Pemahaman terhadap kerangka regulasi dan legislasi sangat baik dan terintegrasi dalam analisis.",
      medium: "Aspek regulasi dan legislasi disinggung, namun perlu dihubungkan lebih erat dengan analisis atau saran kebijakan.",
      low: "Aspek regulasi dan legislasi belum terlihat. Perlu mempertimbangkan kerangka hukum yang ada terkait isu kebijakan."
    }
  };

  const fb = feedbacks[indicatorId];
  if (!fb) return "Tidak ada umpan balik tersedia.";

  if (score >= 70) return fb.high;
  if (score >= 45) return fb.medium;
  return fb.low;
}

/**
 * Hitung skor rata-rata tertimbang
 */
function calculateFinalScore(indicatorResults) {
  let total = 0;
  indicatorResults.forEach(r => {
    total += r.score * r.weight;
  });
  return Math.round(total);
}

// ============================================================
// FUNGSI EKSPOR UTAMA
// ============================================================

/**
 * Evaluasi teks policy brief
 * @param {string} text - Konten teks dokumen
 * @returns {object} - Hasil penilaian lengkap
 */
function evaluatePolicyBrief(text) {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Nilai tiap indikator
  const indicatorResults = INDICATORS.map(indicator => {
    const score = scoreIndicator(text, indicator);
    const gradeInfo = scoreToGrade(score);
    const feedback = generateFeedback(indicator.id, score);

    return {
      id: indicator.id,
      label: indicator.label,
      description: indicator.description,
      weight: indicator.weight,
      score,
      grade: gradeInfo.grade,
      gradeLabel: gradeInfo.label,
      color: gradeInfo.color,
      feedback
    };
  });

  // Nilai akhir
  const finalScore = calculateFinalScore(indicatorResults);
  const finalGradeInfo = scoreToGrade(finalScore);

  // Kekuatan & kelemahan utama
  const sorted = [...indicatorResults].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2).map(r => r.label);
  const weaknesses = sorted.slice(-2).reverse().map(r => r.label);

  return {
    wordCount,
    indicators: indicatorResults,
    finalScore,
    finalGrade: finalGradeInfo.grade,
    finalGradeLabel: finalGradeInfo.label,
    finalColor: finalGradeInfo.color,
    strengths,
    weaknesses,
    summary: generateSummary(finalScore, finalGradeInfo.grade)
  };
}

function generateSummary(score, grade) {
  const summaries = {
    A: "Policy brief ini memenuhi standar kualitas yang sangat tinggi. Dokumen menunjukkan pemahaman mendalam terhadap isu kebijakan, didukung bukti yang kuat, dan memberikan rekomendasi yang actionable.",
    B: "Policy brief ini berkualitas baik dengan sebagian besar aspek terpenuhi dengan memadai. Masih ada ruang untuk penyempurnaan pada beberapa area.",
    C: "Policy brief ini cukup memadai namun memerlukan perbaikan pada beberapa aspek penting agar lebih efektif dalam mendorong perubahan kebijakan.",
    D: "Policy brief ini memerlukan revisi yang signifikan. Banyak aspek penting yang belum terpenuhi dengan baik.",
    E: "Policy brief ini belum memenuhi standar minimal. Diperlukan penulisan ulang secara menyeluruh dengan memperhatikan semua aspek penilaian."
  };
  return summaries[grade] || "Tidak ada ringkasan tersedia.";
}

module.exports = { evaluatePolicyBrief };
