/**
 * aiDetector.js
 * Deteksi kemungkinan teks dibuat oleh AI (statistical heuristics)
 * Tidak memerlukan API eksternal — berjalan 100% di server.
 * 
 * Metrik:
 *  - Lexical Diversity (Type-Token Ratio)
 *  - Sentence Length Variance (Burstiness)
 *  - Repetition Score (frasa berulang)
 *  - AI Marker Phrases (frasa khas AI)
 *  - Paragraph Uniformity
 */

// ============================================================
// FRASA YANG SERING DIGUNAKAN AI BAHASA INDONESIA
// ============================================================
const AI_MARKER_PHRASES = [
  // Frasa pembuka khas AI
  "dalam era digital", "di era globalisasi", "di era modern", "dalam konteks",
  "perlu dipahami bahwa", "perlu dicatat bahwa", "perlu diingat bahwa",
  "tidak dapat dipungkiri bahwa", "sangat penting untuk", "penting untuk dicatat",
  "patut menjadi perhatian", "menjadi sorotan utama",
  
  // Frasa transisi khas AI
  "dengan demikian", "oleh karena itu", "oleh sebab itu",
  "dalam hal ini", "dalam kaitannya dengan", "sehubungan dengan",
  "berdasarkan uraian di atas", "berdasarkan pembahasan di atas",
  "sebagaimana telah disebutkan", "sebagaimana dijelaskan sebelumnya",
  
  // Frasa penutup khas AI
  "sebagai kesimpulan", "dapat disimpulkan bahwa", "kesimpulannya adalah",
  "dari pembahasan di atas", "dari uraian di atas",
  "demikianlah pembahasan mengenai", "demikian paper ini",
  
  // Frasa argumentasi generik AI
  "salah satu", "berbagai", "beragam", "beberapa",
  "dapat diartikan sebagai", "merupakan bentuk",
  "memiliki peran penting", "memiliki peran strategis",
  "memiliki dampak yang signifikan", "berkontribusi terhadap",
  "tidak terlepas dari", "erat kaitannya dengan",
  "hal ini dikarenakan", "hal ini disebabkan oleh",
  "memberikan gambaran tentang", "memberikan pemahaman tentang",
  
  // Pola umum AI
  "dengan kata lain", "artinya", "maksudnya",
  "secara umum", "secara khusus", "secara keseluruhan",
  "tidak hanya", "tetapi juga", "baik itu",
  "maupun", "seperti", "misalnya", "contohnya",
  "terdiri dari", "terbagi menjadi", "meliputi",
  
  // Frasa rekomendasi AI
  "disarankan untuk", "direkomendasikan untuk", "sebaiknya dilakukan",
  "perlu adanya", "hendaknya", "alangkah baiknya",
  "sebagai langkah", "sebagai upaya", "dalam upaya"
];

// ============================================================
// FUNGSI UTAMA
// ============================================================

/**
 * Hitung Lexical Diversity (Type-Token Ratio)
 * Semakin rendah TTR → semakin repetitif → semakin mungkin AI
 * @param {string[]} words - Array kata
 * @returns {number} - Skor 0-100 (semakin tinggi → semakin manusiawi)
 */
function lexicalDiversityScore(text) {
  const words = text.toLowerCase().match(/\b[a-z]+/gi) || [];
  if (words.length < 50) return 50; // default untuk teks pendek

  const unique = new Set(words);
  const ttr = unique.size / words.length;

  // TTR normal manusia ~0.60-0.85, AI ~0.40-0.65
  // Skala: ttr 0.35 → 0, ttr 0.85 → 100
  let score = ((ttr - 0.35) / 0.50) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Hitung Sentence Length Variance (Burstiness)
 * AI cenderung kalimat dengan panjang seragam
 * @param {string} text - Teks
 * @returns {number} - Skor 0-100 (semakin tinggi → semakin manusiawi)
 */
function burstinessScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 5) return 50;

  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  // Variance
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV)
  const cv = stdDev / mean;

  // CV normal manusia ~0.5-1.2, AI ~0.2-0.5
  // Skala: cv 0.15 → 0, cv 1.2 → 100
  let score = ((cv - 0.15) / 1.05) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Hitung Repetition Score — frasa berulang sepanjang 3-4 kata
 * @param {string} text - Teks
 * @returns {number} - Skor 0-100 (semakin tinggi → semakin manusiawi)
 */
function repetitionScore(text) {
  const words = text.toLowerCase().match(/\b[a-z]+/gi) || [];
  if (words.length < 100) return 50;

  // Cari frasa 3-gram yang berulang
  const trigrams = new Map();
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    trigrams.set(phrase, (trigrams.get(phrase) || 0) + 1);
  }

  // Hitung rasio frasa yang muncul >1 kali
  let repeatedCount = 0;
  let totalCount = 0;
  trigrams.forEach((count) => {
    totalCount += count;
    if (count > 1) repeatedCount += count;
  });

  const repeatRatio = totalCount > 0 ? repeatedCount / totalCount : 0;

  // repeatRatio normal manusia < 0.15, AI > 0.25
  // Skala: 0.35 → 0, 0.05 → 100
  let score = ((0.35 - repeatRatio) / 0.30) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Deteksi frasa marker AI
 * @param {string} text - Teks
 * @returns {number} - Skor 0-100 (semakin tinggi → semakin manusiawi)
 */
function aiMarkerScore(text) {
  const lower = text.toLowerCase();
  let hits = 0;

  AI_MARKER_PHRASES.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    const matches = (lower.match(regex) || []).length;
    hits += matches;
  });

  // Normalisasi berdasarkan panjang teks
  const wordCount = text.split(/\s+/).length;
  const density = wordCount > 0 ? hits / wordCount : 0;

  // density normal manusia < 0.02, AI > 0.08
  // Skala: 0.12 → 0, 0.01 → 100
  let score = ((0.12 - density) / 0.11) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Analisis uniformity panjang paragraf
 * @param {string} text - Teks
 * @returns {number} - Skor 0-100 (semakin tinggi → semakin manusiawi)
 */
function paragraphUniformityScore(text) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  if (paragraphs.length < 3) return 50;

  const lengths = paragraphs.map(p => p.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // CV paragraf normal manusia > 0.5, AI < 0.3
  let score = ((cv - 0.15) / 0.55) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Hitung skor AI Detection keseluruhan (weighted average)
 * @param {string} text - Teks dokumen
 * @returns {object} - Hasil deteksi AI
 */
function detectAI(text) {
  const metrics = {
    lexicalDiversity: { score: lexicalDiversityScore(text), weight: 0.25, label: "Keragaman Kosakata", description: "Semakin beragam kosakata, semakin alami tulisan" },
    burstiness: { score: burstinessScore(text), weight: 0.20, label: "Variasi Panjang Kalimat", description: "Tulisan manusia memiliki variasi panjang kalimat yang alami" },
    repetition: { score: repetitionScore(text), weight: 0.20, label: "Pengulangan Frasa", description: "AI cenderung mengulang pola frasa yang sama" },
    aiMarkers: { score: aiMarkerScore(text), weight: 0.20, label: "Frasa Khas AI", description: "Deteksi frasa yang sering digunakan AI dalam menulis" },
    paragraphUniformity: { score: paragraphUniformityScore(text), weight: 0.15, label: "Variasi Paragraf", description: "AI cenderung menulis paragraf dengan panjang seragam" }
  };

  // Hitung weighted average
  let totalScore = 0;
  Object.values(metrics).forEach(m => {
    totalScore += m.score * m.weight;
  });
  const finalScore = Math.round(totalScore);

  // Konversi ke label dan confidence
  let label, confidence, verdict, color;
  if (finalScore >= 80) {
    label = "Sangat Mungkin Manusia";
    verdict = "HUMAN";
    confidence = "Tinggi";
    color = "#22c55e";
  } else if (finalScore >= 60) {
    label = "Cenderung Manusia";
    verdict = "LIKELY_HUMAN";
    confidence = "Sedang";
    color = "#38bdf8";
  } else if (finalScore >= 40) {
    label = "Cenderung AI";
    verdict = "LIKELY_AI";
    confidence = "Sedang";
    color = "#f97316";
  } else {
    label = "Sangat Mungkin AI";
    verdict = "AI";
    confidence = "Tinggi";
    color = "#ef4444";
  }

  return {
    aiScore: finalScore,
    aiLabel: label,
    verdict,
    confidence,
    color,
    metrics: Object.entries(metrics).map(([key, val]) => ({
      id: key,
      ...val
    }))
  };
}

module.exports = { detectAI };

