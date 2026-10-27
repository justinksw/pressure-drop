# P1 · Duct / pipe ΔP — Acceptance (brief-v4 §12)

**Tip SHA (main/live):**  () — was `2f4265e` (`2f4265e588a222617be39d0522e52f817416bbf4`)  
**Preview URL:** https://justinksw.github.io/pressure-drop/  
**Badge:** none (live) · **Pages source:** `main` / root

## Live ship

Justin OK via Sua 2026-10-27 Asia/Hong_Kong: Pages→main / drop PREVIEW. Hub Coming soon→Open deferred.

## Calc goldens (`node js/test-goldens.js`) — ALL PASS

| Case | Key numbers | Result |
|---|---|---|
| **A** Air defaults | A=0.1000 · Dh≈0.3077 m · v=4.00 · f≈0.0206 · ΔP_f≈12.8 Pa · ΔP_k=14.4 · **Total≈27.2 Pa ≈2.8 mmH₂O** · soft OK | PASS |
| **B** 300×150 | v≈8.89 soft WARN · **Total≈169 Pa ≈17 mmH₂O** | PASS |
| **C** CHW default | ID=52.5 · v≈0.92 · ΔP_f≈5.95 kPa · ΔP_k≈0.85 · **Total≈6.81 kPa ≈0.69 m head** | PASS |
| Smoke | Q=0 → — · circ D=300 Q=0.40 → v≈5.66 Total≈54±2 · aspect 800×150 hint | PASS |

## Playwright matrix — no horizontal scroll

| Browser × width | Scroll | Shot |
|---|---|---|
| Chromium 320 | PASS | `preview-proof/chromium-320.png` |
| Chromium 390 | PASS | `preview-proof/chromium-390.png` |
| Chromium 430 | PASS | `preview-proof/chromium-430.png` |
| WebKit 320 | PASS | `preview-proof/webkit-320.png` |
| WebKit 390 | PASS | `preview-proof/webkit-390.png` |
| WebKit 430 | PASS | `preview-proof/webkit-430.png` |

Overall proof: **PASS** (see `preview-proof/REPORT.txt`).

## Spot-checks (in proof)

1. Air load → Golden A within tol at step 5  
2. CHW tab → kPa / m head + strip `data-variant=pipe`  
3. `?warn=1` → amber band + strip `.warn` (Golden B)  
4. Play → Pause label; Pause keeps ink primary (not `#E8ECF5`)  
5. Honesty footer EN+ZH · tap ≥44 · no PREVIEW badge (live)  

## Brief §12 checklist

1. 320 / 390 / 430 no sideways scroll — PASS  
2. Desktop Chrome 390-wide — PASS (matrix)  
3. Tokens match psychart family — PASS  
4. Title + ZH + logo · no PREVIEW (live) — PASS  
5. Air defaults Golden A — PASS  
6. CHW units + pipe strip — PASS  
7. Scrubber Play/Pause + steps 1–5 ≥44 — PASS  
8. V2 strip beats — PASS (CSS data-step)  
9. Play chrome psychart primary; Pause ink — PASS  
10. v + Total emphasis — PASS (CSS)  
11. Soft warn amber Golden B — PASS  
12. How calculated step formulas — PASS  
13. Honesty EN+ZH — PASS  
14. Tap ≥44 — PASS  
15. Contrast — PASS (tokens)  
16. No CFM/in.wg — PASS  
17. Safe-area bottom — PASS (CSS)  
18. Reduced-motion — PASS (CSS media query)

## Deviations from brief

None.
