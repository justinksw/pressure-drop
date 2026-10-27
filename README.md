# P1 · Duct / pipe ΔP

HK BSI teaching calculator — **Darcy–Weisbach + ΣK** (Haaland friction factor).

**Preview:** https://justinksw.github.io/pressure-drop/  
**Branch:** `preview` (PREVIEW badge on). Hold `main` / live until Justin OK.

Teaching demo only. Not CIBSE Guide C / CoP / ductulator.

## Calc lock

See `briefs/SPEC-P1-calc-ui-beatrice.md` and `briefs/ANSWERS-P1-beatrice.md`.  
Design brief: `briefs/brief-p1-v4.md`.

## Local

```bash
npx serve -l 8792 .
node js/test-goldens.js
PROOF_BASE=http://127.0.0.1:8792/ node preview-proof/run-proof.mjs
```

## Acceptance

See `ACCEPTANCE.md` (tip SHA + Playwright matrix after prove).
