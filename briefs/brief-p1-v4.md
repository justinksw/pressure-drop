# P1 · Duct / pipe ΔP — Design brief v4

**Designer:** Celine · **Builder (after Justin OK):** Jessie · **Calc lock:** Beatrice · **Coordinator:** Sua  
**Direction:** `briefs/direction-p1-v1.md` + Play viz `briefs/direction-p1-play-viz-v1.md` (**V2 picked** by Justin **2026-10-27** Asia/Hong_Kong)  
**Substance (do not change):** `briefs/SPEC-P1-calc-ui-beatrice.md` · `briefs/ANSWERS-P1-beatrice.md`  
**Mockup:** `mockup/p1-dp-v4.html` · Shots: `mockup/shots/p1-v4-*.png`  
**Supersedes:** `briefs/brief-p1-v3.md` · `mockup/p1-dp-v3.html` (and v2 / v1)  
**Justin punch (2026-10-27 Asia/Hong_Kong via Sua):** Play button **color/format must match psychart** (same family). Steps stay. Jessie still hold.  
**Punch fix:** `#btnPlay` uses `class="primary"` + `.scrubber button.primary` exactly as psychart (`background: var(--ink); color: #fff; border-color: var(--ink)`). Pause **keeps** ink primary — only the label toggles Play/Pause. Do **not** style Pause like a selected step (`#E8ECF5`).  
**Status:** Design pack for Justin review via Sua — **Jessie hold** until Justin OK. Standalone page (later own repo e.g. `pressure-drop`); **not** hub work.

---

## 1. Goal

Phone-first HK BSI teaching calc for **Darcy–Weisbach + ΣK** duct / pipe pressure drop:

- **Air** tab default (branch duct story)  
- **CHW** tab second (coil feed story)  
- Story scrubber **1–5** + **Play / Pause** with **V2 mini duct/pipe strip** visualization  
- Sticky result card; soft amber velocity warns; bilingual honesty footer  

Audience: juniors on phone. **Not** CIBSE Guide C / CoP / ductulator.

## 2. Locked decisions

| Item | Value |
|---|---|
| Title | `P1 · Duct / pipe ΔP` / `P1 · 風管／水管壓降` |
| Mode tabs | **Air** (default) \| **CHW**; switch → that tab’s defaults + story **step 1** |
| Air role chip | Branch supply (default) \| Main \| Return — **soft bands only** |
| Story | Steps **1–5** manual scrubber + **Play / Pause** auto-advance (~1.2 s/step) |
| Play viz | **V2 mini duct/pipe strip** (see §7) — Play is not a dead button |
| Play chrome | **Psychart primary** — ink fill / white type (`.scrubber button.primary`); Pause same chrome |
| Result card | Sticky / always-on; lines unlock by step; prior lines stay |
| Primary emphasis | **v** (from step 2) and **Total ΔP** (step 5) — larger type |
| Soft warns | Amber helpers; never hard-block typing |
| Honesty footer | Always visible EN + ZH (SPEC strings) |
| Field order / defaults / goldens / formulas | **Exactly** Beatrice SPEC |
| Visual system | Copy psychart / hub tokens — no new palette |
| Logo | `logos/p1-dp.svg` in appbar ~32px |
| Hosting | Standalone tool page (own repo later); hub links later |

## 3. Screen structure (iPhone 13 = 390×844)

Phone stack (acceptance gate **320–430**):

1. **`header.appbar`** — mark 32px · h1 17/700 · ZH sub 12 muted · MOCKUP/PREVIEW badge on non-live  
2. **Result pane** — result card with **V2 strip** under Result head, then unlocked rows  
3. **Scrubber** — **Play/Pause** (≥44px, **psychart primary**) + steps **1–5** (≥44px) + bilingual caption  
4. **`.sheet`** — white, radius 16 top, grab · mode tabs · (Air) role · inputs 2-col grid · How calculated · demo-note  

### Result card order

**Air** (from SPEC): A → Dh (or D if circular) → **v** → Re → f → ΔP_f → ΔP_k → **Total** (Pa · mmH₂O)  
**CHW:** A → ID → **v** → Re → f → ΔP_f → ΔP_k → **Total** (kPa · m head)

### Input order

**Air:** Shape → Q (+ L/s read-only) → W×H or D → L → Material → ΣK; role chip above inputs.  
**CHW:** Q → DN → L → Material → ΣK.  
Defaults / options / DN ID table = SPEC §§1–2.

## 4. Visual tokens (copy — do not diverge)

```
--canvas: #EEF1F4
--panel: #FFFFFF
--ink: #1E2A50
--muted: #5A6178
--line: #C8CDD8
--accent: #C45C26
--comfort-edge: #2E7D6E
--focus: #174A7C
body background: #D8DCE2
font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", "PingFang TC", "Helvetica Neue", sans-serif
```

Type: appbar h1 **17/700**; sub/ZH **12**; field EN **13/600**; field ZH **12** muted; demo-note **11**; soft-warn **12/600** accent; emphasis v ~18–20; Total ~20–22.  
Controls: height **44**; radius **10**; inputs on `--canvas`; segmented checked = `#E8ECF5` + ink border (psychart).  
**Play / Pause:** `.scrubber button.primary` → `background: var(--ink); color: #fff; border-color: var(--ink)` (psychart exact). Selected **steps** may use `#E8ECF5`; **Pause must not**.  
At **≤340px**: hide segmented ZH labels (same as psychart) to protect 320 width.

## 5. Copy locks

| Piece | EN | ZH |
|---|---|---|
| Title | P1 · Duct / pipe ΔP | P1 · 風管／水管壓降 |
| Tabs | Air \| CHW | 風管 \| 冷凍水 |
| Role | Branch \| Main \| Return | 分支 \| 主幹 \| 回風 |
| Steps | Flow & size · Velocity · Friction along L · Fittings · Total ΔP | 風量／管徑 · 流速 · 沿程摩擦 · 配件 · 總壓降 |
| Play | Play / Pause | (button label EN ok; optional ZH later) |
| How calculated | How calculated | 計算說明 |
| Honesty | Teaching Darcy–Weisbach + ΣK. Not CIBSE Guide C / CoP / ductulator. | 教學用 Darcy–Weisbach + ΣK。非 CIBSE Guide C／CoP／ductulator。 |

Formula strings for How calculated = SPEC §5 exactly (step shows only formulas that step introduces).

## 6. Field map / goldens

Point Jessie at **SPEC** for field ids, ranges, DN table, constants, and unit tests:

- Golden **A** (Air load): v **4.00 m/s**, Total ≈ **27.2 Pa** ≈ **2.8 mmH₂O**, soft OK  
- Golden **B** (300×150): v ≈ **8.89 m/s** → soft **warn**; Total ≈ **169 Pa** ≈ **17 mmH₂O**  
- Golden **C** (CHW default): v ≈ **0.92 m/s**; Total ≈ **6.81 kPa** ≈ **0.69 m head**  

Mockup displays locked goldens (static); production must compute live from SPEC formulas.

## 7. Story steps + Play + V2 strip

| Step | Unlocks (result rows) | V2 strip beat (~1.2 s on Play) |
|---|---|---|
| 1 | Q, A, Dh/D (or ID) | Inlet **size glyph** highlights (□ duct / ○ pipe) |
| 2 | **v** + soft band status | Flow **chevrons** + **velocity tick** on soft band (amber tick if warn) |
| 3 | Re, f, **ΔP_f** | **Friction fill** grows along length bar |
| 4 | **ΔP_k** | Fitting **dots flash** + **ΣK** label |
| 5 | **ΔP_total** (+ dual unit) | Accent **ΔP arrow** settles at outlet |

### Play / Pause behavior

- **Play:** auto-advance step 1→5 at ~**1.2 s** per beat; strip animates with each beat; result rows unlock in sync. If already on step 5, Play restarts from step 1.  
- **Pause** or **tap a step:** stops auto-advance; tap jumps to that step (strip + rows update).  
- Play chrome stays **ink primary** while Pause is shown (label-only toggle).  
- `prefers-reduced-motion: reduce` → no chevron/flash animations; still unlocks rows on step change.  
- Strip placement: **inside** result card, under Result head, above rows — thin (~40–52px tall including meta). Must not crowd Total emphasis.  
- **Air** strip = rectangular duct metaphor; **CHW** = round-pipe variant of same metaphor (`data-variant="pipe"`).

Manual scrubber alone remains fully usable without Play.

## 8. Soft warns

Never hard-block. Amber under **v** (and sheet helper as needed):

- Air vs role band (SPEC §6)  
- CHW v &lt; 0.5 or &gt; 2.5  
- Q/size ≤ 0 or L &lt; 0 → results `—` + helper  
- Rect aspect &gt; 4:1 → soft hint  
- Re &lt; 2300 → soft laminar note  

Mock review: `?warn=1` or **State: Golden B warn** control shows amber under v. Capture shots with `?shot=1` to hide mock toolbar. `?step=N` freezes story step for shots; `?chw=1` opens CHW; `?pause=1` shows Pause label with primary chrome (for mid-Play shot).

## 9. How calculated

Disclosure / expandable: formulas for **current step only** (SPEC §5 mapping). Monospace formula + optional ZH paren.

## 10. Honesty footer

Always visible at bottom of sheet — EN primary line + ZH secondary line (exact SPEC strings). No CoP / Guide C claims.

## 11. Out of v4

Equal-friction target · Colebrook iteration · fitting catalogue pickers · glycol · altitude · fan/pump selection · fire damper ΔP · CFM / in.wg · hub redesign · full 3D duct / particle CFD / sound (Play viz out-of-scope from direction note).

## 12. Acceptance list

1. **Primary viewport:** iPhone 13 CSS **390×844** (WebKit); also **320** and **430** — **no horizontal scroll**; ZH uses `overflow-wrap` / keep-all (segmented ZH may hide ≤340).  
2. Desktop Chrome at 390-wide (device mode) matches phone mock chrome.  
3. Tokens/type match §4 (side-by-side with live psychart — same family, not a new brand).  
4. Title + ZH sub + p1 logo in appbar; PREVIEW/MOCKUP badge only on non-live.  
5. **Air** selected on load with SPEC defaults; result card at story position shows Golden **A** numbers within SPEC tolerances when computed.  
6. **CHW** tab switches panel + defaults; result units kPa · m head; strip uses **pipe** variant.  
7. Scrubber: **Play/Pause** (≥44px, **ink primary**) + steps **1–5** (≥44px) + bilingual caption; result rows reveal by step.  
8. **V2 strip** present in result card; beats match §7; Play auto-advances with strip motion; Pause / step tap stops or jumps.  
9. **Play chrome** matches psychart `.scrubber button.primary` (ink / white); Pause does **not** use selected-step `#E8ECF5`.  
10. **v** and **Total** use larger emphasis type than other result rows.  
11. Soft warn: amber helper under v for Golden B–class velocity (accent `#C45C26`); never blocks input; strip velocity tick turns amber in warn.  
12. How calculated shows SPEC formula strings for current step.  
13. Honesty footer EN + ZH always visible.  
14. Tap targets for primary controls / segmented / steps / Play / inputs ≥ **44px**; focus ring `--focus`.  
15. Contrast readable (ink on canvas/panel; muted secondary; accent for warn / strip ΔP only).  
16. No CFM/in.wg; no invented Guide C claims.  
17. Safe-area bottom padding on sheet.  
18. Reduced-motion: strip still updates by step without looping animations.

## 13. Ask Justin (via Sua)

OK **P1 brief-v4 + mockup v4** (Play chrome matched to psychart primary; V2 strip unchanged) for Jessie preview build? Tweaks welcome before build. Hub remains separate. **Jessie hold** until OK.
