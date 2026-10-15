# IntentLab implementation plan

Approved in chat on 14 October 2026. Build a responsive intent-analysis studio for Zayed's NLP course project, using NLTK for real text preprocessing and a saved scikit-learn classifier served by a Python Vercel Function.

## Constraints and decisions
- English customer-support messages; eight intents plus an uncertainty outcome.
- React, TypeScript, Vite; ivory, charcoal, orange; no external AI API.
- Offline training, bounded inference, no runtime corpus downloads or server-side message persistence.
- Public dataset provenance and license included. Synthetic-data metrics must not be presented as real-world accuracy.
- Preserve negation; use NLTK Treebank tokenization and TF-IDF word/bigram features.
- Compare Logistic Regression with Multinomial Naive Bayes; choose using validation macro F1.
- Group near-duplicate templates before a reproducible 70/15/15 split; fit vectorization only on training data. Select confidence threshold on validation data; report held-out test metrics.
- No Git repository exists. Use this empty, user-selected workspace directly; do not invent a Git identity or create commits.

## Tasks
1. [x] Dataset and classifier: `scripts/download_data.py`, `scripts/train.py`, `intentlab/nlp.py`, `intentlab/classifier.py`, `models/`, `public/model-report.json`. Test preprocessing, grouped splits, classification, explanations and uncertainty.
2. [x] API: `api/classify.py`, `api/health.py`, `intentlab/http.py`, `scripts/dev_server.py`, `vercel.json`. POST `/api/classify` accepts `{texts: string[]}` (1–25 messages, 2,000 characters each); returns `{results: Analysis[]}`. Validate JSON, blanks, wrong types, length, and batch limits. GET `/api/health` reports model version.
3. [x] UI: `src/App.tsx`, `src/components/`, `src/lib/`, `src/styles.css`. Playground, actual ranked predictions, signed feature evidence, processing steps, examples, local history with clear control; batch/export; insights and methodology.
4. [x] Verification: Python suite; frontend behavior tests; TypeScript and production build; full browser-to-Python flow, mobile and keyboard review.
5. [x] Handoff: README, dataset notice, measured report, demo/viva notes and Vercel instructions. Include verification evidence and any unverified hosted behavior.

## Review focus
- Unknown text or ambiguity must not silently become a confident supported intent.
- Empty, oversized and malformed requests must return useful client errors.
- Scores and attribution must come from the saved model, never canned predictions.
- Local history must recover from invalid/unavailable storage without breaking inference.
- Batch results must stay paired with their original messages; exports must be safe for spreadsheet formulas.

## Design
Paper `#f7f6f2`, ink `#252620`, muted `#6b6d62`, line `#e2e3dc`, signal orange `#c84612`, pale orange `#fff1e9`, success `#38644b`. Use a wide studio workspace with a slim left navigation rail, a compact header, a large message composer and an adjacent prediction panel. A serif display title and clean sans-serif controls lend character; the circular score instrument is the main visual motif. Left-aligned copy, ample breathing room, accessible states, reduced-motion support.

## Verification commands
`python -m pytest -q`, `npm test`, `npm run build`; browser tests against Vite proxy + Python API. Re-read actual output before completion claims.
