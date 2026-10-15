# Verification record

Verified locally on 14 October 2026, Windows, Node.js 22.17.0 and Python 3.13.5.

| Check | Result |
| --- | --- |
| Python preprocessing, grouping, actual model inference and HTTP tests | 32 passed |
| Frontend API boundary, history and CSV tests | 7 passed |
| Desktop/mobile real browser workflows and accessibility checks | 12 passed |
| TypeScript check and production Vite build | Passed |
| Local UI HTTP request | 200 |
| Local `/api/health` | Ready, model version 1.0.0 |
| Independent source review after fixes | No remaining important findings |

Browser workflows covered real Python predictions, evidence, keyboard shortcut, pipeline display, uncertainty, empty input, persisted/cleared history, bounded pending-batch editing, batch row order, CSV download, measured insights, methodology, JavaScript page errors and horizontal overflow. Desktop and mobile screenshots are in `docs/screenshots/` and were visually inspected.

Automated axe checks found no violations for the selected WCAG A/AA tags across the four initial workspace views. This is not a comprehensive manual accessibility certification. Dynamic results were functionally checked; not all possible states were accessibility-audited.

The project was built and tested before packaging. `scripts/package_project.py` runs ZIP CRC checks and compares every archived input against its project SHA-256 hash. `delivery/package-receipt.json` records the resulting archive checksum and size. That receipt stays next to the ZIP, avoiding a recursive ZIP-inside-ZIP.

## Limits of verification

No hosted Vercel deployment, Vercel build logs, cold-start timings or deployed concurrency test have been collected. The Vercel entrypoints use the same locally tested HTTP handler. The README explicitly asks the recipient to verify health, classification and batch behavior after deployment.

Synthetic held-out metrics are not a measure of real customer traffic. Unknown-domain rejection uses heuristics and is not guaranteed. Original dataset seed IDs are unavailable, so normalized/near-duplicate grouping cannot prove the absence of all related templates across splits.
