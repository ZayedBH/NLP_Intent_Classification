# IntentLab progress

Plan: docs/PLAN.md

Ruling: Implement directly in the empty approved workspace; Git worktree/commit steps do not apply because it is not a repository.
Ruling: Hosting target is Vercel under Zayed's account; do not create an unrelated Sites deployment. Prepare source and verify locally.
Pre-flight: classifier response schema is shared by Python API and TypeScript UI; use one documented Analysis contract and verify real responses end-to-end.

Implementation and local verification complete. ZIP/email handoff is tracked in delivery/.

Task 1: preprocessing and grouped split tests: 11 passed. Public Bitext CSV and original license downloaded with pinned revision and hashes.
Ruling: Bitext lacks return-item and product-information intents. Substitute refund policy and get invoice; retain eight classes and disclose the change in UI/docs.

Task 1: complete. Actual grouped training selected Multinomial Naive Bayes by validation macro F1 (0.9905 versus 0.9832). Held-out accuracy 0.9962085, macro F1 0.9940276; 6,989 unique messages.
Task 2: complete. Shared HTTP handler, direct classify/health Vercel entrypoints, local server; Python suite 32 passed.
Task 3: complete. Four responsive views, real predictions and signed evidence, bounded batch/CSV, resilient local history, locally bundled fonts.
Task 4: complete. Production build passed; frontend tests 7 passed; desktop/mobile browser tests 12 passed, including four-view automated WCAG A/AA audits. Screenshots inspected.
Task 5: complete. README, beginner guide, demo/viva notes, original data/license, pinned download/retraining scripts and archive verification tool included.

Review: two P2 findings fixed and independently re-reviewed: batch request/input pairing and malformed successful API responses. Regression tests pass. Follow-up read-only review reported no remaining important issues; reviewer's own test rerun hit sandbox EPERM, so root ran the actual verification outside that process restriction.
Accessibility: darker supporting text, sidebar overflow handling, role for split chart, focusable scroll tables. Automated checks do not establish full manual WCAG conformance.
API verification found Windows TCP reset races on early body rejection; bounded drain and reading valid-sized bodies before content-type rejection fixed the reproduced tests.
Hosted Vercel deployment has not been performed. Source configuration is ready for recipient deployment; packaging/cold starts must be checked on Vercel.
