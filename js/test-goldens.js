#!/usr/bin/env node
"use strict";
var calc = require("./calc.js");
var fail = 0;
function approx(got, exp, tol, label) {
  var ok = Math.abs(got - exp) <= tol;
  console.log((ok ? "PASS" : "FAIL") + "  " + label + ": got=" + got + " exp=" + exp + " ±" + tol);
  if (!ok) fail++;
}
function truth(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) fail++;
}

console.log("=== Golden A (Air defaults) ===");
var A = calc.compute({
  mode: "air", shape: "rect", Q: 0.40, W_mm: 400, H_mm: 250,
  L_m: 20, material: "gi", SK: 1.5, role: "branch"
});
approx(A.A, 0.1, 1e-6, "A");
approx(A.Dh, 0.3077, 0.0001, "Dh");
approx(A.v, 4.00, 0.01, "v");
approx(A.f, 0.0206, 0.0002, "f");
approx(A.dPf_Pa, 12.8, 0.3, "ΔP_f");
approx(A.dPk_Pa, 14.4, 0.05, "ΔP_k");
approx(A.dPtot_Pa, 27.2, 0.5, "Total Pa");
approx(A.mmH2O, 2.8, 0.15, "mmH₂O");
truth(A.soft.ok && !A.soft.warn, "soft OK branch");

console.log("=== Golden B (300×150) ===");
var B = calc.compute({
  mode: "air", shape: "rect", Q: 0.40, W_mm: 300, H_mm: 150,
  L_m: 20, material: "gi", SK: 1.5, role: "branch"
});
approx(B.v, 8.89, 0.05, "v");
truth(B.soft.warn, "soft WARN");
approx(B.dPtot_Pa, 169, 3, "Total Pa");
approx(B.mmH2O, 17, 1, "mmH₂O");

console.log("=== Golden C (CHW default) ===");
var C = calc.compute({
  mode: "chw", Q: 2.0, DN: 50, L_m: 30, material: "steel", SK: 2.0
});
approx(C.ID_mm, 52.5, 0.01, "ID");
approx(C.v, 0.92, 0.02, "v");
approx(C.dPf_kPa, 5.95, 0.1, "ΔP_f kPa");
approx(C.dPk_kPa, 0.85, 0.05, "ΔP_k kPa");
approx(C.dPtot_kPa, 6.81, 0.1, "Total kPa");
approx(C.head_m, 0.69, 0.02, "m head");
truth(C.soft.ok && !C.soft.warn, "soft OK CHW");

console.log("=== Smoke ===");
var Z = calc.compute({
  mode: "air", shape: "rect", Q: 0, W_mm: 400, H_mm: 250,
  L_m: 20, material: "gi", SK: 1.5, role: "branch"
});
truth(!Z.valid, "Q=0 → invalid");
truth(Z.helper === "Enter positive flow / size", "invalid helper");

var Circ = calc.compute({
  mode: "air", shape: "circ", Q: 0.40, D_mm: 300,
  L_m: 20, material: "gi", SK: 1.5, role: "branch"
});
approx(Circ.v, 5.66, 0.05, "circ v");
approx(Circ.dPtot_Pa, 54, 2, "circ Total");

var Flat = calc.compute({
  mode: "air", shape: "rect", Q: 0.40, W_mm: 800, H_mm: 150,
  L_m: 20, material: "gi", SK: 1.5, role: "branch"
});
truth(Flat.aspectHint, "aspect >4:1 hint");
truth(Flat.helper === calc.FLAT_HINT, "flat helper only");

var Both = calc.compute({
  mode: "air", shape: "rect", Q: 0.45, W_mm: 500, H_mm: 100,
  L_m: 20, material: "gi", SK: 1.5, role: "branch"
});
truth(Both.soft.warn && Both.aspectHint, "warn and flat together");
truth(Both.helper === Both.soft.message + " · " + calc.FLAT_HINT, "helper joins both");

console.log("=== Display ===");
truth(calc.formatSci(A.Re) === "≈ 8.21×10⁴", "Re display golden A");
truth(calc.formatSci(C.A, 4) === "≈ 0.0022", "CHW area display");
truth(calc.formatSci(9994) === "≈ 9.99×10³", "sci no false rollover");
truth(calc.formatSci(9996) === "≈ 1.00×10⁴", "sci mantissa rollover");

console.log(fail === 0 ? "\nALL PASS" : "\n" + fail + " FAILURES");
process.exit(fail === 0 ? 0 : 1);
