/**
 * app.js — Frontend Logic
 * PolBrief Assessor — Katadata Style
 */

// ===== STATE =====
let selectedFile = null;
let radarChart   = null;

// ===== ELEMENTS =====
const dropZone   = document.getElementById("drop-zone");
const fileInput  = document.getElementById("file-input");
const filePreview= document.getElementById("file-preview");
const fileNameEl = document.getElementById("file-name");
const fileSizeEl = document.getElementById("file-size");
const removeBtn  = document.getElementById("remove-file");
const assessBtn  = document.getElementById("assess-btn");
const uploadSec  = document.getElementById("upload-section");
const loadingSec = document.getElementById("loading");
const errorSec   = document.getElementById("error-section");
const errorMsg   = document.getElementById("error-msg");
const resultSec  = document.getElementById("result-section");

// ===== INIT: Animate hero grade bars =====
document.addEventListener("DOMContentLoaded", () => {
  // Animate stat counters
  animateCounters();
  // Animate grade bars after a short delay
  setTimeout(() => {
    document.querySelectorAll(".gb-fill").forEach(bar => {
      bar.style.width = bar.dataset.w || bar.style.getPropertyValue("--w");
    });
  }, 600);
});

// ===== COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll(".stat-num[data-target]").forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    if (isNaN(target)) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + suffix;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ===== DRAG & DROP =====
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
});

// ===== FILE HANDLER =====
function handleFile(file) {
  if (file.type !== "application/pdf") {
    showError("Hanya file PDF yang diperbolehkan.");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showError("Ukuran file terlalu besar. Maksimal 20 MB.");
    return;
  }
  selectedFile = file;
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatFileSize(file.size);
  dropZone.style.display = "none";
  filePreview.classList.remove("hidden");
  assessBtn.disabled = false;
}

removeBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  dropZone.style.display = "";
  filePreview.classList.add("hidden");
  assessBtn.disabled = true;
});

// ===== ASSESS =====
assessBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  await runAssessment();
});

async function runAssessment() {
  uploadSec.classList.add("hidden");
  errorSec.classList.add("hidden");
  resultSec.classList.add("hidden");
  loadingSec.classList.remove("hidden");

  // Step animation
  const steps = ["step-1","step-2","step-3","step-4"];
  let idx = 0;
  const stepTimer = setInterval(() => {
    if (idx > 0) {
      const prev = document.getElementById(steps[idx-1]);
      if (prev) { prev.classList.remove("active"); prev.classList.add("done"); prev.textContent = "✅ " + prev.textContent.replace(/^[^\s]+\s/, ""); }
    }
    if (idx < steps.length) {
      const cur = document.getElementById(steps[idx]);
      if (cur) cur.classList.add("active");
      idx++;
    } else clearInterval(stepTimer);
  }, 900);

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const response = await fetch("/api/assess", { method: "POST", body: formData });
    clearInterval(stepTimer);

    // Cek apakah response benar-benar JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Jika bukan JSON, ambil teks HTML error
      const htmlText = await response.text();
      console.error("Server returned non-JSON response:", htmlText.substring(0, 200));
      throw new Error("Server mengembalikan halaman error. Silakan coba lagi atau hubungi administrator.");
    }

    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.error || "Terjadi kesalahan pada server.");
    loadingSec.classList.add("hidden");
    renderResult(json.data);
  } catch (err) {
    clearInterval(stepTimer);
    loadingSec.classList.add("hidden");
    showError(err.message || "Tidak dapat terhubung ke server.");
  }
}

// ===== RENDER RESULT =====
function renderResult(data) {
  // Meta
  document.getElementById("res-filename").textContent = data.fileName || selectedFile.name;
  document.getElementById("res-wordcount").textContent = `${(data.wordCount||0).toLocaleString("id-ID")} kata`;
  document.getElementById("res-date").textContent = formatDate(data.assessedAt);

  // Final grade ring
  const gradeLetter = document.getElementById("final-grade-letter");
  gradeLetter.textContent = data.finalGrade;
  gradeLetter.style.color = data.finalColor;

  const ring = document.getElementById("grade-ring");
  ring.style.borderColor = data.finalColor;
  ring.style.boxShadow   = `0 0 24px ${data.finalColor}44`;

  document.getElementById("final-grade-label").textContent = data.finalGradeLabel;
  document.getElementById("final-score-text").textContent  = `${data.finalScore}/100`;

  // Scorecards
  const scorecardRow = document.getElementById("scorecard-row");
  scorecardRow.innerHTML = "";
  data.indicators.forEach(ind => {
    const sc = document.createElement("div");
    sc.className = "scorecard";
    sc.style.setProperty("--sc-color", ind.color);
    sc.innerHTML = `
      <div class="scorecard-grade">${ind.grade}</div>
      <div class="scorecard-score">${ind.score}/100</div>
      <div class="scorecard-name">${ind.label}</div>
    `;
    scorecardRow.appendChild(sc);
  });

  // Summary
  document.getElementById("result-summary").textContent = data.summary;

  // Strengths & Weaknesses
  const strList = document.getElementById("strengths-list");
  const wkList  = document.getElementById("weaknesses-list");
  strList.innerHTML = "";
  wkList.innerHTML  = "";
  data.strengths.forEach(s => {
    const li = document.createElement("li"); li.textContent = s; strList.appendChild(li);
  });
  data.weaknesses.forEach(w => {
    const li = document.createElement("li"); li.textContent = w; wkList.appendChild(li);
  });

  // Indicator detail list
  const indList = document.getElementById("indicator-list");
  indList.innerHTML = "";
  data.indicators.forEach(ind => indList.appendChild(buildIndicatorItem(ind)));

  // Radar chart
  buildRadarChart(data.indicators);

  resultSec.classList.remove("hidden");
  setTimeout(() => resultSec.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

function buildIndicatorItem(ind) {
  const el = document.createElement("div");
  el.className = "indicator-item";
  el.innerHTML = `
    <div class="indicator-header">
      <span class="indicator-name">${ind.label}</span>
      <div class="indicator-grade-badge">
        <div class="grade-badge" style="background:${ind.color}">${ind.grade}</div>
        <span class="score-num">${ind.score}/100</span>
      </div>
    </div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" style="width:0%;background:${ind.color}"></div>
    </div>
    <p class="indicator-feedback">${ind.feedback}</p>
  `;
  setTimeout(() => {
    const bar = el.querySelector(".progress-bar-fill");
    if (bar) bar.style.width = `${ind.score}%`;
  }, 300);
  return el;
}

function buildRadarChart(indicators) {
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  const ctx = document.getElementById("radar-chart").getContext("2d");
  const labels = indicators.map(i => i.label.split(" ").slice(0,2).join(" "));
  const scores = indicators.map(i => i.score);

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Skor Kompetensi",
        data: scores,
        backgroundColor: "rgba(37, 99, 235, 0.15)", // Biru lebih lembut
        borderColor: "rgba(37, 99, 235, 0.8)",      // Biru lebih lembut
        pointBackgroundColor: scores.map(s => getGradeColor(s)),
        pointBorderColor: "#ffffff",
        pointRadius: 6, pointHoverRadius: 8, borderWidth: 2.5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 100, suggestedMin: 0, suggestedMax: 100,
          ticks: { stepSize: 25, color: "rgba(107, 114, 128, 0.4)", font: { size: 10 }, backdropColor: "transparent" },
          grid: { color: "rgba(59, 130, 246, 0.1)" },
          angleLines: { color: "rgba(59, 130, 246, 0.1)" },
          pointLabels: { color: "#374151", font: { size: 11, family: "'Inter'", weight: "500" } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff", borderColor: "rgba(0,0,0,0.1)", borderWidth: 1,
          titleColor: "#1f2937", bodyColor: "#4b5563", padding: 12,
          callbacks: { label: ctx => ` Skor: ${ctx.raw}/100` }
        }
      }
    }
  });
}

// ===== HELPERS =====
function getGradeColor(score) {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#3b82f6"; // Biru lebih solid
  if (score >= 55) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function showError(msg) {
  uploadSec.classList.remove("hidden");
  errorMsg.textContent = msg;
  errorSec.classList.remove("hidden");
  errorSec.scrollIntoView({ behavior: "smooth" });
}

function resetApp() {
  selectedFile = null;
  fileInput.value = "";
  dropZone.style.display = "";
  filePreview.classList.add("hidden");
  assessBtn.disabled = true;
  uploadSec.classList.remove("hidden");
  errorSec.classList.add("hidden");
  resultSec.classList.add("hidden");
  loadingSec.classList.add("hidden");

  // Reset steps
  const labels = ["📄 Membaca dokumen PDF","🔍 Mengekstrak teks konten","⚖️ Menilai 5 indikator","📊 Menyusun laporan akhir"];
  ["step-1","step-2","step-3","step-4"].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "step" + (i === 0 ? " active" : "");
    el.textContent = labels[i];
  });

  if (radarChart) { radarChart.destroy(); radarChart = null; }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/(1024*1024)).toFixed(1) + " MB";
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}
