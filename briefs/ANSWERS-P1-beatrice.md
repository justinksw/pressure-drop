# Beatrice substance — P1 duct / pipe ΔP mini-calc (HK BSI teaching)

> **Calc/UI lock for Celine:** see [`SPEC-P1-calc-ui-beatrice.md`](./SPEC-P1-calc-ui-beatrice.md) (field order, steps 1–5, formula UI strings, goldens). This ANSWERS file stays the substance source.

For Celine brief → Jessie build. **Demo defaults, not CIBSE Guide C / CoP / ductulator.**  
Hub: BSE tools index + psychart (existing) + this P1.

Sea-level air ρ ≈ 1.2 kg/m³; water ρ ≈ 998 kg/m³. g = 9.81 m/s².

---

## 1. Scope priority

| Mode | v1? | Notes |
|---|---|---|
| **Air duct** | **Default tab** | Sequel to psychart (air-side). Highest BSI day-to-day value. |
| **CHW pipe** | **Second tab** | Same story shape; chilled-water to AHU coil. |
| Steam / DR / medical gas | Out | Later if asked. |

**Recommendation:** **both tabs, Air first on load.** One result story per mode (inputs → velocity → friction ΔP → optional fittings → total).

Straight duct/pipe only + simple fittings as **ΣK** or **% equivalent length** (toggle one method in v1; recommend **ΣK** for clarity).

---

## 2. Defaults (HK BSI teaching)

### Tab A — Air duct (default)

| Input | Default | Unit | Notes |
|---|---|---|---|
| Shape | **Rectangular** | — | Also offer Circular |
| Flow Q | **0.40** | m³/s | ≈ 400 L/s branch / small main teaching |
| Width × height | **400 × 250** | mm | Internal; or D = 300 mm if circular |
| Length L | **20** | m | Straight run |
| Material | **GI (galvanized)** | — | ε ≈ 0.15 mm teaching |
| Fittings ΣK | **1.5** | — | e.g. 2 elbows + 1 take-off demo |
| Air density | **1.20** | kg/m³ | Fixed; advanced later |

**Derived show always:**  
- Velocity v = Q / A (m/s)  
- Hydraulic diameter Dh (rect: 2ab/(a+b))  
- Friction factor f (Haaland approx)  
- Friction ΔP_f = f (L/Dh) (ρ v² / 2)  [Pa]  
- Fitting ΔP_k = ΣK (ρ v² / 2)  [Pa]  
- **Total ΔP** = ΔP_f + ΔP_k  [Pa] and **mmH₂O** (÷9.81 approx for site speak)

**Soft velocity bands (air, low/med pressure teaching — soft only):**

| Role chip (optional) | Soft OK | Soft warn |
|---|---|---|
| Branch supply (default chip) | **4–7 m/s** | &lt;3 quiet? or **&gt;8** “high for branch” |
| Main supply | 6–9 m/s | &gt;10 “high for low-pressure main” |
| Return | 4–6 m/s | &gt;7 |

Default chip = **Branch supply**. Not a Code velocity schedule.

### Tab B — CHW pipe

| Input | Default | Unit | Notes |
|---|---|---|---|
| Flow Q | **2.0** | L/s | Small AHU coil feed teaching |
| Nominal size | **DN50** (ID ≈ **52.5** mm teaching) | — | Simple ID table DN20–DN100 |
| Length L | **30** | m | |
| Material | **Steel (closed CHW)** | — | ε ≈ 0.046 mm teaching |
| Fittings ΣK | **2.0** | — | elbows + valves demo |
| Fluid | Water 10°C teaching | ρ=999, ν≈1.3e-6 m²/s fixed |

**Derived:** v (m/s), Re, f (Haaland), ΔP_f, ΔP_k, **Total ΔP [kPa]** and **m head** (= ΔP/(ρg)).

**Soft velocity bands (CHW teaching):**

| Soft OK | Soft warn |
|---|---|
| **0.8–2.0 m/s** | &lt;0.5 “low / dirt risk talk” · **&gt;2.5** “high for CHW” |

---

## 3. Formula / table honesty line (must show in UI demo-note)

**Use (transparent):**

1. Continuity: \(v = Q/A\)  
2. Darcy–Weisbach: \(\Delta P_f = f \frac{L}{D_h}\frac{\rho v^2}{2}\)  
3. Haaland explicit \(f\) (smooth enough for demo; no Colebrook iteration required)  
4. Fittings: \(\Delta P_k = \sum K \cdot \frac{\rho v^2}{2}\)  
5. CHW head: \(H = \Delta P / (\rho g)\)

**Do NOT claim:**

- Full **CIBSE Guide C** duct/pipe tables or fitting catalogues  
- Manufacturer **ductulator** / ASHRAE fitting database  
- Temperature-varying ρ, altitude, glycol, roughness ageing  
- System curve / fan or pump selection  
- Fire damper / attenuator manufacturer ΔP

UI footer (EN/ZH):  
“Teaching Darcy–Weisbach + ΣK. Not CIBSE Guide C / CoP / ductulator.”

Optional advanced: equal-friction Pa/m target — **out of v1** (keep one story).

---

## 4. Result story (psychart-style) — use cases

Same scrubber energy: **1 Flow & size → 2 Velocity → 3 Friction along L → 4 Fittings → 5 Total ΔP**  
(Play optional; step buttons fine.)

### Use case 1 — Branch supply sanity (default load)
OA-side air after psychart: 400 L/s in 400×250 GI, 20 m, ΣK=1.5.  
**Look for:** v in branch band; total ΔP order-of-magnitude vs “contractor says almost no drop.”

### Use case 2 — Contractor velocity too high
Same Q, shrink to **300×150** (or raise Q to 0.8 m³/s).  
**Look for:** soft warn on velocity; ΔP jumps — talking point for BSI “flag and escalate,” not redesign.

### Use case 3 — CHW to coil (tab B)
2 L/s DN50 × 30 m, ΣK=2.  
**Look for:** v ~1–1.5 m/s OK; total kPa / m head for pump talk — still demo, not pump pick.

---

## 5. Validation / soft warns (don’t hard-block typing)

| Check | Behaviour |
|---|---|
| Q ≤ 0, size ≤ 0, L &lt; 0 | Soft block compute / show “—” |
| Air v outside chip band | Amber helper under velocity |
| CHW v &gt; 2.5 or &lt; 0.5 | Amber helper |
| Aspect ratio rect &gt; 4:1 | Soft hint “flat duct — check on drawings” |
| Off-range size | Still compute; clamp marker N/A (no chart) |

---

## 6. Units display (EN primary / ZH secondary)

| Qty | EN | ZH |
|---|---|---|
| Flow air | m³/s (also show L/s) | m³/s · L/s |
| Flow water | L/s | L/s |
| Velocity | m/s | m/s |
| ΔP air | Pa · mmH₂O | Pa · mm水柱 |
| ΔP water | kPa · m head | kPa · m水頭 |

No CFM / in.wg in v1 (optional secondary later).

---

## Quick wire checklist for Jessie

1. Tabs: **Air (default)** | **CHW**  
2. Air defaults: 0.40 m³/s, 400×250, L=20, GI, ΣK=1.5; branch velocity chip  
3. CHW defaults: 2.0 L/s, DN50, L=30, steel, ΣK=2.0  
4. Story steps 1–5; popover/result card: v, ΔP_f, ΔP_k, total (+ mmH₂O or m head)  
5. Soft velocity warns; demo-note honesty line  
6. Hub index links: Psychart · P1 ΔP  

