# TODO: Fitur AI Detection

## Files Changed/Created

### Created
- [x] **server/services/aiDetector.js** — Service AI detection dengan 5 metrik statistik:
  1. Lexical Diversity (TTR) — 25%
  2. Burstiness (variasi panjang kalimat) — 20%
  3. Repetition Score (pengulangan frasa) — 20%
  4. AI Marker Phrases (frasa khas AI) — 20%
  5. Paragraph Uniformity (variasi paragraf) — 15%

### Edited
- [x] **server/routes/assess.js** — Integrasi `detectAI()` ke hasil penilaian
- [x] **public/index.html** — AI Detection card di result section + loading step
- [x] **public/app.js** — Render AI detection + animasi + reset
- [x] **public/index.css** — Styling AI detection card, badge, progress bar, metrics

