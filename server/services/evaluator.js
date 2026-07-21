/**
 * evaluator.js
 * Penilaian Policy Brief berbasis Rubrik 8 Kriteria Resmi.
 * Setiap kriteria dinilai pada skala 1–4 sesuai deskriptor rubrik,
 * kemudian dikonversi ke skor 0–100.
 *
 * === PENDEKATAN ASPEK-BASED SCORING ===
 * Alih-alih menghitung frekuensi keyword mentah (yang menghasilkan skor
 * seragam untuk semua dokumen policy brief), kami menggunakan pendekatan
 * aspek-based: setiap kriteria memiliki 4-5 aspek spesifik yang diperiksa
 * kehadirannya secara independen. Makin banyak aspek terpenuhi, makin
 * tinggi level rubrik.
 *
 * Konversi Skala:
 *   4 (Sangat Baik)       → 90–100  → mid: 95
 *   3 (Memuaskan)         → 80–89   → mid: 84
 *   2 (Cukup Memuaskan)   → 70–79   → mid: 74
 *   1 (Kurang Memuaskan)  → <70     → mid: 60
 */

// ============================================================
// KONFIGURASI 8 KRITERIA RUBRIK — ASPEK-BASED SCORING
// ============================================================

const RUBRIC_CRITERIA = [
  {
    id: "cover_page",
    label: "Cover Page",
    weight: 0.125,
    isVisualOnly: true,
    description: "Daya tarik dan relevansi desain cover dengan masalah kebijakan yang diangkat.",
    descriptors: {
      4: "Desain sangat menarik dan relevan dengan masalah kebijakan yang diangkat.",
      3: "Desain cukup menarik dan relevan dengan masalah kebijakan yang diangkat.",
      2: "Desain kurang menarik dan cukup relevan dengan masalah kebijakan yang diangkat.",
      1: "Desain kurang menarik dan kurang relevan dengan masalah kebijakan yang diangkat."
    },
    // Aspek-aspek spesifik yang diperiksa (masing-masing 0 atau 1)
    aspects: [
      {
        id: "cover_title_page",
        label: "Halaman Judul / Cover Page",
        desc: "Teks mengandung judul dokumen policy brief",
        check: (text) => /\b(policy\s?brief|cover\s?page|halaman\s?judul)\b/i.test(text)
      },
      {
        id: "cover_institution",
        label: "Identitas Institusi",
        desc: "Menyebutkan institusi/instansi/universitas",
        check: (text) => /\b(instansi|kementerian|lembaga|universitas|sekolah\s?tinggi|fakultas|program\s?studi)\b/i.test(text)
      },
      {
        id: "cover_date_author",
        label: "Tanggal & Penulis",
        desc: "Terdapat informasi tahun/penulis/penyusun",
        check: (text) => /\b(tahun\s+\d{4}|penulis|disusun\s?oleh|author|disiapkan\s?oleh)\b/i.test(text)
      },
      {
        id: "cover_identity",
        label: "Identitas Dokumen",
        desc: "Terdapat elemen identitas dokumen (judul, logo, nama)",
        check: (text) => /\b(judul|title|logo|nama\s+dokumen)\b/i.test(text)
      }
    ]
  },
  {
    id: "judul",
    label: "Judul",
    weight: 0.125,
    isVisualOnly: false,
    description: "Daya tarik dan kesesuaian judul dengan isi Policy Brief.",
    descriptors: {
      4: "Menarik, dan menggambarkan isi Policy Brief.",
      3: "Cukup menarik, dan menggambarkan isi Policy Brief.",
      2: "Cukup menarik, dan cukup menggambarkan isi Policy Brief.",
      1: "Kurang menarik dan kurang menggambarkan isi Policy Brief."
    },
    aspects: [
      {
        id: "title_policy_terms",
        label: "Istilah Kebijakan",
        desc: "Judul mengandung istilah kebijakan yang substantif",
        check: (text) => /\b(kebijakan|policy|strategi|reformasi|transformasi|optimalisasi|penguatan|peningkatan)\b/i.test(text)
      },
      {
        id: "title_action_verbs",
        label: "Kata Aksi",
        desc: "Judul mengandung kata aksi/direktif",
        check: (text) => /\b(menuju|mewujudkan|membangun|meningkatkan|mendorong|memperkuat|mengembangkan)\b/i.test(text)
      },
      {
        id: "title_specific",
        label: "Spesifik & Kontekstual",
        desc: "Judul menyebutkan sektor/lokus spesifik",
        check: (text) => /\b(di\s+(indonesia|daerah|provinsi|kabupaten|kota|desa|sektor|bidang))\b/i.test(text)
      },
      {
        id: "title_substance",
        label: "Substansi Judul",
        desc: "Judul mengandung unsur masalah/solusi",
        check: (text) => /\b(masalah|solusi|upaya|tantangan|peluang|urgensi)\b/i.test(text)
      }
    ]
  },
  {
    id: "ringkasan_eksekutif",
    label: "Ringkasan Eksekutif",
    weight: 0.125,
    isVisualOnly: false,
    description: "Kelengkapan ringkasan eksekutif: akar masalah, urgensi, solusi, dan pelaksana.",
    descriptors: {
      4: "Secara lengkap dan baik menyampaikan akar masalah, dan terdapat urgensi dari masalah yang diangkat. Solusi dari masalah diungkapkan dengan baik serta dicantumkan juga pelaksana dari solusi tersebut.",
      3: "Menyampaikan akar masalah dengan cukup lengkap, dan/atau terdapat urgensi dari masalah yang diangkat dengan cukup baik. Solusi diungkapkan dengan cukup baik dan/atau dicantumkan juga pelaksana dari solusi tersebut.",
      2: "Kurang menjelaskan akar masalah, urgensi dan rekomendasi kebijakan.",
      1: "Tidak jelas mengungkapkan akar masalah atau tidak terdapat ringkasan eksekutif."
    },
    aspects: [
      {
        id: "exec_section_header",
        label: "Bagian Ringkasan Eksekutif",
        desc: "Ada header/indikasi bagian ringkasan eksekutif",
        check: (text) => /\b(ringkasan\s?eksekutif|executive\s?summary|ringkasan|intisari)\b/i.test(text)
      },
      {
        id: "exec_root_cause",
        label: "Akar Masalah",
        desc: "Menyebutkan akar/penyebab masalah",
        check: (text) => /\b(akar\s?masalah|penyebab|disebabkan\s?oleh|terjadi\s?karena|latar\s?belakang\s?masalah)\b/i.test(text)
      },
      {
        id: "exec_urgency",
        label: "Urgensi",
        desc: "Mengindikasikan urgensi/mendesaknya masalah",
        check: (text) => /\b(urgensi|mendesak|perlu\s?segera|penting\s?untuk|kritis|strategis|signifikan)\b/i.test(text)
      },
      {
        id: "exec_solution",
        label: "Solusi",
        desc: "Memberikan solusi/rekomendasi",
        check: (text) => /\b(solusi|rekomendasi|usulan|alternatif|saran)\b/i.test(text)
      },
      {
        id: "exec_implementer",
        label: "Pelaksana",
        desc: "Menyebutkan pelaksana/aktor solusi",
        check: (text) => /\b(pelaksana|kementerian|pemerintah\s+(daerah|pusat)|lembaga\s?terkait|instansi|pihak\s?berwenang)\b/i.test(text)
      }
    ]
  },
  {
    id: "pendahuluan",
    label: "Pendahuluan",
    weight: 0.125,
    isVisualOnly: false,
    description: "Kelengkapan pendahuluan: topik, pentingnya isu, dan implikasi jika tidak ditindaklanjuti.",
    descriptors: {
      4: "Secara lengkap dan baik menjelaskan topik yang dibahas dalam policy brief, substansi yang ada pada policy brief penting dan strategis. Dijelaskan pula dengan baik implikasi jika Policy Maker tidak mengambil langkah tindak lanjut sesuai yang direkomendasikan.",
      3: "Topik yang dibahas dalam policy brief dijelaskan dengan cukup lengkap dan cukup baik. Substansi yang ada pada policy brief cukup penting dan strategis dan/atau dijelaskan pula dengan cukup baik implikasi jika Policy Maker tidak mengambil langkah tindak lanjut.",
      2: "Dijelaskan secara kurang rinci urgensi dari masalah yang diangkat dan dampak dari masalah yang diangkat jika tidak diselesaikan. Bukti atau contoh yang diberikan kurang kuat.",
      1: "Urgensi dari masalah yang diangkat tidak terlihat, dan tidak dijelaskan dampak dari masalah yang diangkat jika tidak diselesaikan. Bukti atau contoh yang diberikan tidak ada atau sangat kurang."
    },
    aspects: [
      {
        id: "intro_section",
        label: "Bagian Pendahuluan",
        desc: "Ada header/indikasi bagian pendahuluan",
        check: (text) => /\b(pendahuluan|latar\s?belakang|introduction|pendahuluan)\b/i.test(text)
      },
      {
        id: "intro_topic",
        label: "Topik Bahasan",
        desc: "Menjelaskan topik spesifik yang dibahas",
        check: (text) => /\b(tentang|membahas|mengangkat|topik|konteks|isu\s+(strategis|kebijakan))\b/i.test(text)
      },
      {
        id: "intro_strategic",
        label: "Pentingnya Isu",
        desc: "Menjelaskan pentingnya/strategisnya isu",
        check: (text) => /\b(penting|strategis|signifikan|vital|krusial|esensial|urgen)\b/i.test(text)
      },
      {
        id: "intro_consequence",
        label: "Implikasi",
        desc: "Menjelaskan implikasi jika tidak ditindaklanjuti",
        check: (text) => /\b(implikasi|konsekuensi|dampak\s+jika|risiko|akibat\s+(jika|apabila)|jika\s+tidak)\b/i.test(text)
      },
      {
        id: "intro_data",
        label: "Data Pendukung",
        desc: "Menyertakan data/bukti/fenomena pendukung",
        check: (text) => /\b(data|statistik|fenomena|menurut|berdasarkan|tercatat|dilaporkan)\b/i.test(text)
      }
    ]
  },
  {
    id: "deskripsi_masalah",
    label: "Deskripsi Masalah",
    weight: 0.125,
    isVisualOnly: false,
    description: "Kejelasan deskripsi masalah: problem statement, aktor, bukti, dan konsekuensi.",
    descriptors: {
      4: "Dijelaskan dengan baik alasan dari permasalahan yang penting untuk diangkat dan mengapa itu terjadi disertai bukti-bukti dukung atau contoh kasus. Terdapat problem statement yang dijelaskan dengan baik. Dijelaskan aktor-aktor yang terkait dengan permasalahan yang diangkat dan mengapa permasalahan itu terjadi dengan disertai bukti-bukti dukung serta contoh kasus. Dijelaskan pula dengan baik efek atau konsekuensi dari permasalahan tersebut dan diberikan juga bukti-bukti atau contoh kasusnya.",
      3: "Dijelaskan dengan cukup baik alasan dari permasalahan yang penting untuk diangkat dan mengapa itu terjadi dengan atau tidak dengan disertai bukti-bukti dukung atau contoh kasus. Terdapat problem statement yang dijelaskan dengan cukup baik dan/atau dijelaskan aktor-aktor yang terkait serta efek atau konsekuensinya.",
      2: "Kurang jelas diungkapkan alasan dari permasalahan yang penting untuk diangkat. Problem statement yang dijelaskan kurang tajam. Tidak dijelaskan dengan baik aktor-aktor yang terkait. Bukti-bukti atau contoh kasus minimal atau tidak ada.",
      1: "Tidak jelas diungkapkan alasan dari permasalahan yang penting untuk diangkat. Tidak terdapat problem statement atau terdapat namun tidak dijelaskan dengan baik. Tidak dijelaskan aktor-aktor terkait. Tidak ada bukti atau contoh kasus."
    },
    aspects: [
      {
        id: "prob_problem_statement",
        label: "Problem Statement",
        desc: "Ada rumusan masalah yang jelas",
        check: (text) => /\b(problem\s?statement|rumusan\s?masalah|masalah\s+(utama|pokok)|pertanyaan\s?(riset|penelitian))\b/i.test(text)
      },
      {
        id: "prob_cause",
        label: "Penyebab Masalah",
        desc: "Menjelaskan penyebab/akar masalah",
        check: (text) => /\b(penyebab|faktor\s+(penyebab|pemicu)|disebabkan|akar\s?masalah|pemicu)\b/i.test(text)
      },
      {
        id: "prob_actors",
        label: "Aktor Terkait",
        desc: "Mengidentifikasi aktor/stakeholder",
        check: (text) => /\b(aktor|pemangku\s?kepentingan|stakeholder|pihak\s?terkait|pelaku|masyarakat)\b/i.test(text)
      },
      {
        id: "prob_evidence",
        label: "Bukti & Data",
        desc: "Menyertakan bukti/data/contoh kasus",
        check: (text) => /\b(bukti|data|statistik|contoh\s?kasus|studi\s?kasus|fakta|survei|penelitian)\b/i.test(text)
      },
      {
        id: "prob_consequence",
        label: "Konsekuensi",
        desc: "Menjelaskan dampak/konsekuensi masalah",
        check: (text) => /\b(dampak|efek|konsekuensi|akibat|berdampak|mengakibatkan|berpengaruh)\b/i.test(text)
      }
    ]
  },
  {
    id: "rekomendasi",
    label: "Rekomendasi",
    weight: 0.125,
    isVisualOnly: false,
    description: "Jumlah alternatif solusi (≥2), strategi implementasi, persuasif, dan feasible.",
    descriptors: {
      4: "Terdapat lebih dari dua alternatif solusi yang ditawarkan dengan menunjukkan keterkaitan antara alternatif solusi dengan analisis masalah. Terdapat strategi implementasi dari solusi yang ditawarkan. Rekomendasi ditulis secara persuasif, jelas langkah-langkah perumusannya dan feasible dilakukan.",
      3: "Terdapat lebih dari dua alternatif solusi yang ditawarkan dengan menunjukkan keterkaitan antara alternatif solusi dengan analisis masalah. Terdapat strategi implementasi dari solusi yang ditawarkan.",
      2: "Terdapat satu solusi yang ditawarkan dengan terdapat cukup keterkaitan antara alternatif solusi dengan analisis masalah. Terdapat strategi implementasi dari solusi yang ditawarkan.",
      1: "Terdapat satu solusi yang ditawarkan dengan tidak terdapat keterkaitan antara alternatif solusi dengan analisis masalah. Tidak terdapat strategi implementasi dari solusi yang ditawarkan."
    },
    aspects: [
      {
        id: "rec_section",
        label: "Bagian Rekomendasi",
        desc: "Ada header/indikasi bagian rekomendasi",
        check: (text) => /\b(rekomendasi|saran|usulan|rekomendasi\s?kebijakan|penutup)\b/i.test(text)
      },
      {
        id: "rec_multiple",
        label: "Alternatif Solusi",
        desc: "Lebih dari satu alternatif solusi (ada enumerasi)",
        check: (text) => /\b((pertama|kedua|ketiga|keempat)\s*(alternatif|solusi|rekomendasi|opsi)|(alternatif|solusi)\s+(pertama|kedua|ketiga)|pertama.*(dapat|bisa).*(kedua|selain))\b/i.test(text)
      },
      {
        id: "rec_strategy",
        label: "Strategi Implementasi",
        desc: "Ada penjelasan strategi/langkah implementasi",
        check: (text) => /\b(implementasi|strategi\s?implementasi|langkah\s?(implementasi|strategis)|tahapan|rencana\s?aksi|action\s?plan|timeline|pelaksanaan)\b/i.test(text)
      },
      {
        id: "rec_persuasive",
        label: "Bahasa Persuasif",
        desc: "Rekomendasi ditulis dengan bahasa persuasif",
        check: (text) => /\b(sebaiknya|direkomendasikan|disarankan|harus|perlu|hendaknya|alangkah\s?baiknya|mendorong|diusulkan)\b/i.test(text)
      },
      {
        id: "rec_feasible",
        label: "Kelayakan",
        desc: "Solusi menunjukkan kelayakan/keterkaitan analisis",
        check: (text) => /\b(feasible|layak|dapat\s?dilaksanakan|berdasarkan\s?(analisis|pembahasan)|keterkaitan|relevan)\b/i.test(text)
      }
    ]
  },
  {
    id: "gaya_bahasa",
    label: "Gaya Bahasa & Tampilan",
    weight: 0.125,
    isVisualOnly: false,
    description: "Kualitas bahasa, gaya penulisan analitik/persuasif, dan kelengkapan visual (grafik/foto/infografis).",
    descriptors: {
      4: "Tidak ada kesalahan ejaan atau tata bahasa. Gaya penulisan analitik dan argumentatif dan/atau persuasif dengan grafik atau foto atau infografis yang baik.",
      3: "Tidak ada kesalahan ejaan atau tata bahasa. Gaya penulisan analitik dan argumentatif dan/atau persuasif dengan grafik atau foto atau infografis yang cukup baik.",
      2: "Terdapat sedikit kesalahan ejaan atau tata bahasa. Gaya penulisan cukup analitik dan argumentatif dan/atau persuasif dengan grafik atau foto atau infografis yang baik.",
      1: "Terdapat cukup banyak kesalahan ejaan atau tata bahasa. Gaya penulisan kurang analitik dan argumentatif dan/atau kurang persuasif dengan grafik atau foto atau infografis yang kurang baik."
    },
    aspects: [
      {
        id: "style_analytical",
        label: "Gaya Analitik",
        desc: "Menggunakan bahasa analitik dan argumentatif",
        check: (text) => /\b(bahwa|karena|oleh\s?sebab\s?itu|dengan\s?demikian|berdasarkan\s?(analisis|data)|menunjukkan\s?bahwa|terbukti|dapat\s?disimpulkan)\b/i.test(text)
      },
      {
        id: "style_persuasive",
        label: "Gaya Persuasif",
        desc: "Menggunakan gaya persuasif",
        check: (text) => /\b(oleh\s?karena\s?itu|dengan\s?demikian|maka\s?dari\s?itu|sehingga|mendorong|penting\s?untuk|perlu\s?adanya)\b/i.test(text)
      },
      {
        id: "style_visual",
        label: "Visual Pendukung",
        desc: "Menyebutkan grafik/tabel/infografis/foto",
        check: (text) => /\b(grafik|gambar|foto|infografis|tabel|diagram|chart|figure)\b/i.test(text)
      },
      {
        id: "style_connective",
        label: "Kohesi & Koherensi",
        desc: "Menggunakan kata penghubung dan transisi",
        check: (text) => /\b(namun|meskipun|sebaliknya|di\s?sisi\s?lain|selain\s?itu|lebih\s?lanjut|sementara|sementara\s?itu)\b/i.test(text)
      },
      {
        id: "style_structure",
        label: "Tata Bahasa & Ejaan",
        desc: "Dokumen terstruktur dengan paragraf yang rapi",
        check: (text) => {
          const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);
          return paragraphs.length >= 5;
        }
      }
    ]
  },
  {
    id: "kompleksitas_kebaruan",
    label: "Kompleksitas & Kebaruan",
    weight: 0.125,
    isVisualOnly: false,
    description: "Penggunaan alat analisis yang relevan, konektivitas antar unsur Policy Brief, dan kebaruan gagasan solusi.",
    descriptors: {
      4: "Terdapat alat analisis yang digunakan dan relevan. Konektivitas antar unsur Policy Brief sangat baik dan terdapat kebaruan gagasan solusi.",
      3: "Terdapat alat analisis yang digunakan dan relevan. Konektivitas antar unsur Policy Brief cukup baik dan terdapat kebaruan gagasan solusi.",
      2: "Terdapat alat analisis yang digunakan dan relevan. Konektivitas antar unsur Policy Brief cukup baik dan terdapat gagasan solusi yang relatif baru.",
      1: "Tidak terdapat alat analisis yang digunakan dan kurang relevan. Konektivitas antar unsur Policy Brief dan kebaruan gagasan solusi yang kurang."
    },
    aspects: [
      {
        id: "complex_analytical_tool",
        label: "Alat Analisis",
        desc: "Menggunakan alat/kerangka analisis spesifik",
        check: (text) => /\b(analisis\s?swot|swot|cost[-\s]?benefit|pohon\s?masalah|problem\s?tree|fishbone|ishikawa|stakeholder\s?analysis|analisis\s?stakeholder|analisis\s?risiko|logical\s?framework|kerangka\s?logis)\b/i.test(text)
      },
      {
        id: "complex_novelty",
        label: "Kebaruan Gagasan",
        desc: "Menunjukkan kebaruan/novelty gagasan",
        check: (text) => /\b(kebaruan|inovatif|inovasi|novel|baru|belum\s?pernah|terobosan|kontribusi\s?baru|pendekatan\s?baru|perspektif\s?baru)\b/i.test(text)
      },
      {
        id: "complex_connectivity",
        label: "Konektivitas Antar Unsur",
        desc: "Menunjukkan koherensi/keterkaitan antar bagian",
        check: (text) => /\b(konektivitas|keterkaitan|koherensi|terintegrasi|hubungan\s?(antara|timbal\s?balik)|sebagaimana\s?dijelaskan|berdasarkan\s?pembahasan)\b/i.test(text)
      },
      {
        id: "complex_comparative",
        label: "Perbandingan & Analisis",
        desc: "Membandingkan pendekatan/perspektif berbeda",
        check: (text) => /\b(berbeda\s?dari|lebih\s?baik|dibandingkan|alternatif|perbandingan|perbedaan|kesamaan)\b/i.test(text)
      },
      {
        id: "complex_depth",
        label: "Kedalaman Analisis",
        desc: "Menunjukkan analisis yang mendalam dengan istilah teknis",
        check: (text) => {
          // Cek keberadaan beberapa istilah analitis kebijakan
          const terms = [
            "regulasi", "legislasi", "desentralisasi", "governance", "tata\s?kelola",
            "anggaran", "fiskal", "moneter", "subsidi", "insentif",
            "efektivitas", "efisiensi", "produktivitas", "akuntabilitas", "transparansi",
            "partisipasi", "inklusif", "berkelanjutan", "sustainable"
          ];
          const matched = terms.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(text));
          return matched.length >= 3;
        }
      }
    ]
  }
];

// ============================================================
// KONVERSI LEVEL RUBRIK → SKOR 0-100
// ============================================================

function rubricLevelToScore(level) {
  const map = { 4: 95, 3: 84, 2: 74, 1: 60 };
  return map[level] || 60;
}

function scoreToGrade(score) {
  if (score >= 90) return { grade: "A",  label: "Sangat Baik",      color: "#22c55e", rubricLevel: 4 };
  if (score >= 80) return { grade: "B",  label: "Memuaskan",        color: "#84cc16", rubricLevel: 3 };
  if (score >= 70) return { grade: "C",  label: "Cukup Memuaskan",  color: "#eab308", rubricLevel: 2 };
  return               { grade: "D",  label: "Kurang Memuaskan",  color: "#ef4444", rubricLevel: 1 };
}

function rubricLevelLabel(level) {
  const labels = { 4: "Sangat Baik", 3: "Memuaskan", 2: "Cukup Memuaskan", 1: "Kurang Memuaskan" };
  return labels[level] || "Kurang Memuaskan";
}

// ============================================================
// ASPEK-BASED SCORING
// ============================================================

/**
 * Hitung skor rubrik (level 1-4) untuk satu kriteria berdasarkan
 * berapa banyak aspek yang terpenuhi dalam teks.
 *
 * Setiap kriteria memiliki 4-5 aspek spesifik (masing-masing 0/1).
 * Mapping:
 *   5/5 aspek → level 4
 *   3-4/5 aspek → level 3
 *   2/5 aspek → level 2
 *   0-1/5 aspek → level 1
 */
function scoreCriteria(text, criteria) {
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;

  if (!criteria.aspects || criteria.aspects.length === 0) {
    // Fallback untuk kriteria tanpa aspek
    return 1;
  }

  // Cek setiap aspek
  let fulfilledAspects = 0;
  criteria.aspects.forEach(aspect => {
    try {
      if (aspect.check(text)) {
        fulfilledAspects++;
      }
    } catch (e) {
      // Abaikan error pada regex
    }
  });

  const totalAspects = criteria.aspects.length;

  // Penalti untuk dokumen yang sangat pendek (< 300 kata)
  // Dokumen pendek kemungkinan tidak memiliki konten yang memadai
  const shortDocPenalty = totalWords < 300 ? 1 : 0;

  // Mapping ke level rubrik
  let level;
  const ratio = fulfilledAspects / totalAspects;

  if (ratio >= 0.8) {
    level = 4; // 80%+ aspek terpenuhi
  } else if (ratio >= 0.6) {
    level = 3; // 60-79%
  } else if (ratio >= 0.4) {
    level = 2; // 40-59%
  } else {
    level = 1; // < 40%
  }

  // Terapkan penalti dokumen pendek
  if (shortDocPenalty && level > 1) {
    level = level - 1;
  }

  // Cover page: jika tidak ada teks yang cukup, beri level 2 maksimal
  // karena penilaian visual tidak bisa dilakukan otomatis penuh
  if (criteria.isVisualOnly && level > 3) {
    level = 3;
  }

  return Math.max(1, Math.min(4, level));
}

// ============================================================
// FEEDBACK BERBASIS LEVEL PER KRITERIA
// ============================================================

function generateFeedback(criteriaId, level) {
  const feedbacks = {
    cover_page: {
      4: "Cover page terdeteksi dengan informasi identitas yang lengkap.",
      3: "Cover page cukup teridentifikasi dari elemen teks dokumen.",
      2: "Elemen cover page kurang lengkap berdasarkan analisis teks. Catatan: penilaian desain visual memerlukan review manual.",
      1: "Cover page tidak terdeteksi atau sangat minim informasi. Penilaian visual memerlukan review manual."
    },
    judul: {
      4: "Judul menggunakan kata-kata kuat dan substantif yang menggambarkan isi kebijakan dengan baik.",
      3: "Judul cukup menggambarkan isi policy brief dan relevan dengan topik kebijakan.",
      2: "Judul ada namun kurang kuat atau kurang spesifik menggambarkan isi policy brief.",
      1: "Judul tidak terdeteksi atau sangat lemah dalam menggambarkan isi dokumen."
    },
    ringkasan_eksekutif: {
      4: "Ringkasan eksekutif mencakup akar masalah, urgensi, solusi, dan pelaksana secara lengkap.",
      3: "Ringkasan eksekutif menyampaikan sebagian besar elemen penting (akar masalah, solusi, pelaksana) dengan cukup baik.",
      2: "Ringkasan eksekutif kurang lengkap. Beberapa elemen seperti pelaksana atau urgensi perlu diperkuat.",
      1: "Ringkasan eksekutif tidak terdeteksi atau sangat lemah. Perlu memastikan ada bagian yang menjelaskan inti permasalahan dan solusinya."
    },
    pendahuluan: {
      4: "Pendahuluan menjelaskan topik secara strategis dan implikasi kebijakan jika tidak ditindaklanjuti dengan sangat baik.",
      3: "Pendahuluan cukup baik menjelaskan konteks dan urgensi isu kebijakan.",
      2: "Pendahuluan kurang rinci. Perlu perkuat bagian implikasi dan urgensi jika masalah tidak diselesaikan.",
      1: "Pendahuluan sangat lemah. Tidak terlihat urgensi isu dan tidak ada penjelasan dampak jika tidak ditindaklanjuti."
    },
    deskripsi_masalah: {
      4: "Deskripsi masalah sangat kuat: problem statement jelas, aktor teridentifikasi, didukung bukti dan data, serta konsekuensi dijelaskan.",
      3: "Deskripsi masalah cukup baik dengan problem statement dan beberapa elemen pendukung (aktor/bukti/konsekuensi).",
      2: "Deskripsi masalah ada namun kurang tajam. Problem statement kurang jelas dan bukti/data masih minim.",
      1: "Deskripsi masalah sangat lemah. Tidak ada problem statement yang jelas, aktor, bukti, atau penjelasan konsekuensi."
    },
    rekomendasi: {
      4: "Rekomendasi sangat kuat: terdapat lebih dari dua alternatif solusi, ada strategi implementasi, dan ditulis secara persuasif dan feasible.",
      3: "Rekomendasi baik: lebih dari dua alternatif solusi dengan strategi implementasi yang cukup.",
      2: "Rekomendasi ada satu solusi dengan strategi implementasi yang masih terbatas.",
      1: "Rekomendasi sangat lemah: hanya satu solusi tanpa keterkaitan analisis atau strategi implementasi."
    },
    gaya_bahasa: {
      4: "Gaya bahasa analitik dan argumentatif/persuasif, dilengkapi dengan infografis/grafik yang baik.",
      3: "Gaya bahasa cukup analitik dan persuasif, visual pendukung cukup baik.",
      2: "Gaya bahasa cukup memadai namun perlu diperkuat aspek analitik dan visual pendukung.",
      1: "Gaya bahasa kurang analitik. Perlu meningkatkan kualitas penulisan dan melengkapi visual pendukung."
    },
    kompleksitas_kebaruan: {
      4: "Menggunakan alat analisis yang relevan, konektivitas antar bagian sangat baik, dan terdapat kebaruan gagasan solusi yang signifikan.",
      3: "Alat analisis digunakan dengan cukup relevan dan terdapat kebaruan gagasan solusi.",
      2: "Alat analisis digunakan namun konektivitas antar bagian masih bisa ditingkatkan. Gagasan solusi relatif baru.",
      1: "Tidak terlihat penggunaan alat analisis. Konektivitas antar bagian dan kebaruan gagasan masih lemah."
    }
  };

  const fb = feedbacks[criteriaId];
  if (!fb) return "Tidak ada umpan balik tersedia.";
  return fb[level] || fb[1];
}

// ============================================================
// FUNGSI EKSPOR UTAMA
// ============================================================

/**
 * Evaluasi teks policy brief berdasarkan 8 kriteria rubrik
 * @param {string} text - Konten teks dokumen
 * @returns {object} - Hasil penilaian lengkap
 */
function evaluatePolicyBrief(text) {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Nilai tiap kriteria
  const indicatorResults = RUBRIC_CRITERIA.map(criteria => {
    const rubricLevel = scoreCriteria(text, criteria);
    const score = rubricLevelToScore(rubricLevel);
    const gradeInfo = scoreToGrade(score);
    const feedback = generateFeedback(criteria.id, rubricLevel);

    return {
      id: criteria.id,
      label: criteria.label,
      description: criteria.description,
      weight: criteria.weight,
      score,
      grade: gradeInfo.grade,
      gradeLabel: gradeInfo.label,
      color: gradeInfo.color,
      feedback,
      // Data rubrik lengkap
      rubricLevel,
      rubricLevelLabel: rubricLevelLabel(rubricLevel),
      rubricDescriptor: criteria.descriptors[rubricLevel],
      rubricAllDescriptors: {
        4: { label: "Sangat Baik (4)",      text: criteria.descriptors[4] },
        3: { label: "Memuaskan (3)",         text: criteria.descriptors[3] },
        2: { label: "Cukup Memuaskan (2)",   text: criteria.descriptors[2] },
        1: { label: "Kurang Memuaskan (1)",  text: criteria.descriptors[1] }
      },
      isVisualOnly: criteria.isVisualOnly || false
    };
  });

  // Nilai akhir (rata-rata tertimbang)
  let totalScore = 0;
  indicatorResults.forEach(r => { totalScore += r.score * r.weight; });
  const finalScore = Math.round(totalScore);
  const finalGradeInfo = scoreToGrade(finalScore);

  // Level rubrik akhir
  const avgLevel = Math.round(indicatorResults.reduce((sum, r) => sum + r.rubricLevel, 0) / indicatorResults.length);

  // Kekuatan & kelemahan (berdasarkan rubric level)
  const sorted = [...indicatorResults].sort((a, b) => b.rubricLevel - a.rubricLevel);
  const strengths = sorted.slice(0, 2).map(r => `${r.label} (Level ${r.rubricLevel} – ${r.rubricLevelLabel})`);
  const weaknesses = sorted.slice(-2).reverse().map(r => `${r.label} (Level ${r.rubricLevel} – ${r.rubricLevelLabel})`);

  return {
    wordCount,
    indicators: indicatorResults,
    finalScore,
    finalGrade: finalGradeInfo.grade,
    finalGradeLabel: finalGradeInfo.label,
    finalColor: finalGradeInfo.color,
    finalRubricLevel: avgLevel,
    finalRubricLevelLabel: rubricLevelLabel(avgLevel),
    strengths,
    weaknesses,
    summary: generateSummary(finalScore, finalGradeInfo.grade)
  };
}

function generateSummary(score, grade) {
  const summaries = {
    A: "Policy brief ini memenuhi standar kualitas yang sangat tinggi (Level 4 – Sangat Baik). Dokumen menunjukkan pemahaman mendalam terhadap semua elemen rubrik: cover yang menarik, ringkasan eksekutif lengkap, deskripsi masalah kuat, rekomendasi persuasif, dan kebaruan gagasan yang signifikan.",
    B: "Policy brief ini berkualitas memuaskan (Level 3). Sebagian besar kriteria rubrik terpenuhi dengan baik. Masih ada ruang penyempurnaan terutama pada beberapa kriteria yang belum mencapai level tertinggi.",
    C: "Policy brief ini cukup memadai (Level 2 – Cukup Memuaskan) namun memerlukan perbaikan pada beberapa aspek penting. Perhatikan kelengkapan ringkasan eksekutif, kekuatan deskripsi masalah, dan jumlah alternatif rekomendasi.",
    D: "Policy brief ini kurang memenuhi standar rubrik (Level 1 – Kurang Memuaskan). Diperlukan revisi yang signifikan pada hampir semua kriteria, terutama problem statement, bukti pendukung, dan strategi rekomendasi yang feasible."
  };
  return summaries[grade] || "Tidak ada ringkasan tersedia.";
}

module.exports = { evaluatePolicyBrief };
