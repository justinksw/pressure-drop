# SPEC — P1 duct / pipe ΔP (Beatrice calc lock for Celine UI brief)

**Audience:** Celine (layout) → Jessie (code). Beatrice does not implement.  
**Substance base:** `ANSWERS-P1-beatrice.md` (this file locks field order, steps, formula strings, goldens).  
**Honesty footer (always visible):**  
EN: `Teaching Darcy–Weisbach + ΣK. Not CIBSE Guide C / CoP / ductulator.`  
ZH: `教學用 Darcy–Weisbach + ΣK。非 CIBSE Guide C／CoP／ductulator。`

Sea-level teaching constants (fixed, not user inputs in v1):  
air ρ = **1.20** kg/m³ · air ν = **1.5×10⁻⁵** m²/s · water ρ = **999** kg/m³ · water ν = **1.3×10⁻⁶** m²/s · g = **9.81** m/s².

---

## 0. Shell / navigation

| UI piece | Spec |
|---|---|
| Page title | `P1 · Duct / pipe ΔP` (ZH: `P1 · 風管／水管壓降`) |
| Mode tabs | **Air** (default, selected on load) \| **CHW** |
| Role chip (Air only) | Segmented: Branch supply (default) \| Main supply \| Return — changes soft velocity bands only |
| Story scrubber | Steps **1–5** (see §3); optional Play |
| Result card | Sticky / always on: shows quantities unlocked by current step |
| Demo note | Footer honesty line above |

Switching tab resets that tab’s defaults and restarts story at step 1.

---

## 1. Input fields — Air tab (display order top→bottom)

| # | Field id | Label EN / ZH | Control | Default | Unit | Range / options | Notes |
|---|---|---|---|---|---|---|---|
| A1 | `shape` | Shape / 截面 | Segmented | **Rectangular** | — | Rectangular \| Circular | Swaps size fields |
| A2 | `Q` | Flow / 風量 | Number | **0.40** | m³/s | > 0; also show L/s = Q×1000 read-only | Primary flow |
| A3a | `W` `H` | Width × Height / 寬×高 | Two numbers | **400 × 250** | mm | > 0; internal | Only if Rectangular |
| A3b | `D` | Diameter / 直徑 | Number | **300** | mm | > 0; internal | Only if Circular |
| A4 | `L` | Length / 長度 | Number | **20** | m | ≥ 0 | Straight run |
| A5 | `material` | Material / 物料 | Select | **GI** | — | GI (ε=0.15 mm) \| Smooth (ε=0.03 mm) | Teaching ε only |
| A6 | `SK` | Fittings ΣK / 配件ΣK | Number | **1.5** | — | ≥ 0 | Single lump K |
| A7 | `role` | Role / 角色 | Chip | **Branch supply** | — | Branch / Main / Return | Soft band only |

**Hidden / fixed (not shown as inputs):** ρ_air, ν_air, ε from material.

**Display order of input block:** A1 → A2 → A3 → A4 → A5 → A6; role chip near velocity or above inputs.

---

## 2. Input fields — CHW tab (display order)

| # | Field id | Label EN / ZH | Control | Default | Unit | Range / options | Notes |
|---|---|---|---|---|---|---|---|
| C1 | `Q` | Flow / 流量 | Number | **2.0** | L/s | > 0 | |
| C2 | `DN` | Nominal size / 管徑 | Select | **DN50** | — | DN20–DN100 (table below) | Sets teaching ID |
| C3 | `L` | Length / 長度 | Number | **30** | m | ≥ 0 | |
| C4 | `material` | Material / 物料 | Select | **Steel (closed CHW)** | — | Steel ε=0.046 mm \| Copper ε=0.0015 mm | |
| C5 | `SK` | Fittings ΣK / 配件ΣK | Number | **2.0** | — | ≥ 0 | |

**DN teaching ID table (lock for Jessie):**

| DN | ID (mm) |
|---|---|
| 20 | 21.6 |
| 25 | 27.2 |
| 32 | 35.9 |
| 40 | 41.8 |
| **50** | **52.5** |
| 65 | 68.0 |
| 80 | 80.0 |
| 100 | 105.0 |

Fluid fixed: water 10°C teaching (ρ, ν above). No glycol in v1.

---

## 3. Story steps 1–5 (psychart-style one story)

Same scrubber energy as psychart. Each step **reveals** more on the result card; prior lines stay.

| Step | Title EN | Title ZH | Unlocks on result card | Teaching beat |
|---|---|---|---|---|
| **1** | Flow & size | 風量／管徑 | Q, A, (Dh or D) | Continuity setup |
| **2** | Velocity | 流速 | **v** + soft band status | “Is this sensible for role?” |
| **3** | Friction along L | 沿程摩擦 | Re, f, **ΔP_f** | Darcy–Weisbach |
| **4** | Fittings | 配件 | **ΔP_k** | ΣK × dynamic pressure |
| **5** | Total ΔP | 總壓降 | **ΔP_total** (+ dual unit) | Site speak / escalate talk |

**Play:** auto-advance 1→5 (~1.2 s/step); Pause keeps current step. Changing any input snaps story to step 1 and recomputes (or live-recompute all but scrubber position optional — prefer **live recompute, keep step**).

---

## 4. Output fields — display order on result card

### Air

| Order | id | Label EN / ZH | Unit | Shown from step |
|---|---|---|---|---|
| 1 | `A` | Area / 截面積 | m² | 1 |
| 2 | `Dh` | Hydraulic dia. / 水力直徑 | mm (show) | 1 (rect only; circ show D) |
| 3 | `v` | Velocity / 流速 | m/s | 2 (+ amber helper if soft warn) |
| 4 | `Re` | Reynolds / 雷諾數 | — | 3 |
| 5 | `f` | Friction factor f / 摩擦係數 | — | 3 (3–4 decimals) |
| 6 | `dPf` | Friction ΔP / 摩擦壓降 | Pa | 3 |
| 7 | `dPk` | Fitting ΔP / 配件壓降 | Pa | 4 |
| 8 | `dPtot` | **Total ΔP** / **總壓降** | **Pa** · **mmH₂O** | 5 |

mmH₂O = Pa / 9.81 (teaching; label as approx).

### CHW

| Order | id | Label | Unit | From step |
|---|---|---|---|---|
| 1 | `A` | Area | m² | 1 |
| 2 | `ID` | Internal dia. | mm | 1 |
| 3 | `v` | Velocity | m/s | 2 (+ amber) |
| 4 | `Re` | Reynolds | — | 3 |
| 5 | `f` | f | — | 3 |
| 6 | `dPf` | Friction ΔP | kPa | 3 |
| 7 | `dPk` | Fitting ΔP | kPa | 4 |
| 8 | `dPtot` | **Total ΔP** | **kPa** · **m head** | 5 |

m head = ΔP_Pa / (ρ g).

**Primary emphasis:** v (step 2) and Total (step 5) — larger type like psychart’s key state.

---

## 5. Formula strings for UI (show in “How calculated” / step popover)

Use these exact teaching lines (EN; ZH optional in paren):

1. Continuity: `v = Q / A`（流速 = 風量 ÷ 截面積）  
2. Rect hydraulic: `Dh = 2·W·H / (W+H)`（水力直徑）  
3. Reynolds: `Re = v · Dh / ν`（圓管用 D）  
4. Haaland: `1/√f = −1.8 log₁₀[(ε/Dh/3.7)¹·¹¹ + 6.9/Re]`  
5. Darcy–Weisbach: `ΔP_f = f · (L/Dh) · (ρ v² / 2)`  
6. Fittings: `ΔP_k = ΣK · (ρ v² / 2)`  
7. Total: `ΔP = ΔP_f + ΔP_k`  
8. Air dual: `mmH₂O ≈ ΔP / 9.81`  
9. CHW head: `H = ΔP / (ρ g)`

Popover per step shows only the formulas that step introduces (step 3 → 3–5; step 4 → 6; step 5 → 7–9).

---

## 6. Soft warns (never hard-block typing)

| Check | When | UI |
|---|---|---|
| Q ≤ 0 or size ≤ 0 | any | Soft block: results show `—`; helper “Enter positive flow / size” |
| L < 0 | any | Same |
| Air v vs role band | step ≥ 2 | Amber under v |
| CHW v < 0.5 or > 2.5 | step ≥ 2 | Amber under v |
| Rect aspect > 4:1 | Air rect | Soft hint “Flat duct — check on drawings” |
| Re < 2300 | step ≥ 3 | Soft note “Laminar — Haaland less typical; still demo” |

**Air soft OK bands (role chip):**

| Role | Soft OK | Soft warn |
|---|---|---|
| Branch supply (default) | 4–7 m/s | < 3 or > 8 |
| Main supply | 6–9 m/s | > 10 |
| Return | 4–6 m/s | > 7 |

**CHW soft OK:** 0.8–2.0 m/s · warn < 0.5 or > 2.5.

---

## 7. Verification goldens (Jessie unit tests / Celine preview check)

Constants: Haaland as §5; air ν=1.5e-5; water ν=1.3e-6; GI ε=0.15 mm; steel ε=0.046 mm.

### Golden A — Air default (load state)

| Qty | Value (tol) |
|---|---|
| A | 0.1000 m² |
| Dh | 0.3077 m (±0.0001) |
| v | **4.00 m/s** |
| Re | ≈ 8.21×10⁴ |
| f | ≈ 0.0206 (±0.0002) |
| ΔP_f | ≈ **12.8 Pa** (±0.3) |
| ΔP_k | **14.4 Pa** (exact: 1.5×1.2×16/2) |
| Total | ≈ **27.2 Pa** ≈ **2.8 mmH₂O** |
| Soft | OK (branch 4–7) |

### Golden B — Air shrink (use case 2)

Q=0.40, 300×150 mm, L=20, ΣK=1.5, GI, Branch:

| Qty | Value |
|---|---|
| v | ≈ **8.89 m/s** → soft **warn** (>8) |
| Total | ≈ **169 Pa** ≈ **17 mmH₂O** |

### Golden C — CHW default

| Qty | Value (tol) |
|---|---|
| ID | 52.5 mm |
| v | ≈ **0.92 m/s** (OK band) |
| ΔP_f | ≈ **5.95 kPa** |
| ΔP_k | ≈ **0.85 kPa** |
| Total | ≈ **6.81 kPa** ≈ **0.69 m head** |

### Smoke checks

- Q=0 → all `—`  
- Circular D=300 mm, Q=0.40, L=20, ΣK=1.5, GI → v≈5.66 m/s, Total≈54 Pa (±2)  
- Aspect 800×150 → hint flat duct  

---

## 8. Units summary (EN primary / ZH secondary)

| Qty | Display |
|---|---|
| Air flow | m³/s + L/s subtitle |
| Water flow | L/s |
| Sizes | mm |
| Length | m |
| Velocity | m/s |
| Air ΔP | Pa primary · mmH₂O secondary |
| Water ΔP | kPa primary · m head secondary |
| f, Re, ΣK | dimensionless |

No CFM / in.wg in v1.

---

## 9. Celine brief wire (one screen)

1. Hub link later; this page standalone for build.  
2. Tabs Air | CHW; Air defaults fill on load.  
3. Left (or top): inputs in §1/§2 order.  
4. Right (or bottom): result card + step scrubber 1–5.  
5. Soft amber helpers under v; honesty footer.  
6. “How calculated” expands formulas for current step.  
7. Match psychart density / type hierarchy: one story, not a spreadsheet dump.

---

## 10. Out of v1 (do not design)

Equal-friction target · Colebrook iteration · fitting catalogue pickers · glycol · altitude · fan/pump selection · fire damper ΔP · CFM/in.wg.
