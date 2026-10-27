/**
 * P1 Darcy–Weisbach + ΣK + Haaland — Beatrice SPEC lock.
 * Do not invent constants or formulas. Display helpers below are not part of the lock.
 */
(function (root) {
  "use strict";

  var AIR_RHO = 1.20;
  var AIR_NU = 1.5e-5;
  var WATER_RHO = 999;
  var WATER_NU = 1.3e-6;
  var G = 9.81;

  var EPS_MM = {
    gi: 0.15,
    smooth: 0.03,
    steel: 0.046,
    copper: 0.0015
  };

  var DN_ID_MM = {
    20: 21.6,
    25: 27.2,
    32: 35.9,
    40: 41.8,
    50: 52.5,
    65: 68.0,
    80: 80.0,
    100: 105.0
  };

  var AIR_BANDS = {
    branch: { okLo: 4, okHi: 7, warnLo: 3, warnHi: 8 },
    main: { okLo: 6, okHi: 9, warnLo: null, warnHi: 10 },
    return: { okLo: 4, okHi: 6, warnLo: null, warnHi: 7 }
  };

  var NEED_INPUT = "Enter positive flow / size";
  var FLAT_HINT = "Flat duct — check on drawings / 扁管留意圖則";
  var LAMINAR_NOTE = "Laminar — Haaland less typical; still demo";

  function haalandF(eps_m, Dh_m, Re) {
    if (!(Re > 0) || !(Dh_m > 0)) return NaN;
    var term = Math.pow(eps_m / Dh_m / 3.7, 1.11) + 6.9 / Re;
    if (!(term > 0)) return NaN;
    var inv = -1.8 * Math.log10(term);
    return 1 / (inv * inv);
  }

  function areaCircle(d_m) {
    return (Math.PI * d_m * d_m) / 4;
  }

  function epsMetres(material, fallback) {
    var mm = EPS_MM[material];
    if (mm == null) mm = EPS_MM[fallback];
    return mm / 1000;
  }

  /** ρ v² / 2 — shared by friction and fittings. */
  function dynamicPressure(rho, v) {
    return (rho * v * v) / 2;
  }

  function softAir(v, role) {
    var b = AIR_BANDS[role] || AIR_BANDS.branch;
    var warn = false;
    var msg = "";
    if (b.warnLo != null && v < b.warnLo) {
      warn = true;
      msg = "Soft warn: low for " + role + " (<" + b.warnLo + " m/s)";
    } else if (b.warnHi != null && v > b.warnHi) {
      warn = true;
      msg = "Soft warn: high for " + role + " (>" + b.warnHi + " m/s) / 偏高";
    }
    var ok = !warn && v >= b.okLo && v <= b.okHi;
    return { warn: warn, ok: ok, message: msg };
  }

  function softChw(v) {
    var warn = v < 0.5 || v > 2.5;
    var ok = !warn && v >= 0.8 && v <= 2.0;
    var msg = "";
    if (v < 0.5) msg = "Soft warn: low CHW velocity (<0.5 m/s)";
    else if (v > 2.5) msg = "Soft warn: high for CHW (>2.5 m/s) / 冷凍水偏高";
    return { warn: warn, ok: ok, message: msg };
  }

  function teachingHelper(soft, aspectHint) {
    var parts = [];
    if (soft.warn && soft.message) parts.push(soft.message);
    if (aspectHint) parts.push(FLAT_HINT);
    return parts.join(" · ");
  }

  function invalid(mode) {
    return {
      valid: false,
      mode: mode,
      A: NaN, Dh: NaN, Dh_mm: NaN, ID_mm: NaN, D_mm: NaN,
      v: NaN, Re: NaN, f: NaN,
      dPf_Pa: NaN, dPk_Pa: NaN, dPtot_Pa: NaN,
      dPf_kPa: NaN, dPk_kPa: NaN, dPtot_kPa: NaN,
      mmH2O: NaN, head_m: NaN,
      soft: { warn: false, ok: false, message: "" },
      aspectHint: false,
      laminarNote: false,
      helper: NEED_INPUT
    };
  }

  function toSup(exp) {
    var map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
    return String(exp).split("").map(function (c) { return map[c] || c; }).join("");
  }

  /**
   * Teaching display. n >= 1000 → two-digit mantissa ×10ⁿ.
   * toFixed can round the mantissa to 10; bump the exponent so 9.996e3 is 1.00×10⁴.
   * Below 1000, `digs` is decimal places (default 2). The sci branch stays at 2 digits.
   */
  function formatSci(n, digs) {
    if (n == null || !Number.isFinite(n)) return "—";
    var digits = digs != null ? digs : 2;
    if (!(n >= 1000)) return "≈ " + n.toFixed(digits);
    var exp = Math.floor(Math.log10(n));
    var text = (n / Math.pow(10, exp)).toFixed(2);
    if (Number(text) >= 10) {
      exp += 1;
      text = (n / Math.pow(10, exp)).toFixed(2);
    }
    return "≈ " + text + "×10" + toSup(exp);
  }

  /**
   * @param {object} input
   * @param {'air'|'chw'} input.mode
   * @param {'rect'|'circ'} [input.shape]
   * @param {number} input.Q  air: m³/s · chw: L/s
   * @param {number} [input.W_mm]
   * @param {number} [input.H_mm]
   * @param {number} [input.D_mm]
   * @param {number} [input.DN]
   * @param {number} input.L_m
   * @param {string} input.material  gi|smooth|steel|copper
   * @param {number} input.SK
   * @param {'branch'|'main'|'return'} [input.role]
   */
  function compute(input) {
    var mode = input.mode || "air";
    var L = Number(input.L_m);
    var SK = Number(input.SK);
    var Qraw = Number(input.Q);

    if (!(Qraw > 0) || !(L >= 0) || !(SK >= 0) || !Number.isFinite(Qraw) || !Number.isFinite(L) || !Number.isFinite(SK)) {
      return invalid(mode);
    }

    var rho, nu, eps_m, A, Dh, Q_m3s, ID_mm = null, D_mm = null;

    if (mode === "chw") {
      rho = WATER_RHO;
      nu = WATER_NU;
      var dn = Number(input.DN);
      ID_mm = DN_ID_MM[dn];
      if (!(ID_mm > 0)) return invalid(mode);
      var ID = ID_mm / 1000;
      A = areaCircle(ID);
      Dh = ID;
      Q_m3s = Qraw / 1000;
      eps_m = epsMetres(input.material, "steel");
    } else {
      rho = AIR_RHO;
      nu = AIR_NU;
      eps_m = epsMetres(input.material, "gi");
      Q_m3s = Qraw;
      if (input.shape === "circ") {
        D_mm = Number(input.D_mm);
        if (!(D_mm > 0)) return invalid(mode);
        var D = D_mm / 1000;
        A = areaCircle(D);
        Dh = D;
      } else {
        var W_mm = Number(input.W_mm);
        var H_mm = Number(input.H_mm);
        if (!(W_mm > 0) || !(H_mm > 0)) return invalid(mode);
        var W = W_mm / 1000;
        var H = H_mm / 1000;
        A = W * H;
        Dh = (2 * W * H) / (W + H);
      }
    }

    if (!(A > 0) || !(Dh > 0)) return invalid(mode);

    var v = Q_m3s / A;
    var Re = (v * Dh) / nu;
    var f = haalandF(eps_m, Dh, Re);
    var dyn = dynamicPressure(rho, v);
    var dPf_Pa = f * (L / Dh) * dyn;
    var dPk_Pa = SK * dyn;
    var dPtot_Pa = dPf_Pa + dPk_Pa;

    var soft = mode === "chw" ? softChw(v) : softAir(v, input.role || "branch");
    var aspectHint = false;
    if (mode === "air" && input.shape !== "circ") {
      var ar = Math.max(Number(input.W_mm), Number(input.H_mm)) /
        Math.min(Number(input.W_mm), Number(input.H_mm));
      aspectHint = ar > 4;
    }
    var laminarNote = Re < 2300;

    return {
      valid: true,
      mode: mode,
      A: A,
      Dh: Dh,
      Dh_mm: Dh * 1000,
      ID_mm: ID_mm,
      D_mm: D_mm,
      v: v,
      Re: Re,
      f: f,
      dPf_Pa: dPf_Pa,
      dPk_Pa: dPk_Pa,
      dPtot_Pa: dPtot_Pa,
      dPf_kPa: dPf_Pa / 1000,
      dPk_kPa: dPk_Pa / 1000,
      dPtot_kPa: dPtot_Pa / 1000,
      /* mmH₂O is Pa/g (teaching). Head is Pa/(ρ g). Do not substitute one for the other. */
      mmH2O: dPtot_Pa / G,
      head_m: dPtot_Pa / (rho * G),
      soft: soft,
      aspectHint: aspectHint,
      laminarNote: laminarNote,
      helper: teachingHelper(soft, aspectHint)
    };
  }

  var api = {
    AIR_RHO: AIR_RHO,
    AIR_NU: AIR_NU,
    WATER_RHO: WATER_RHO,
    WATER_NU: WATER_NU,
    G: G,
    EPS_MM: EPS_MM,
    DN_ID_MM: DN_ID_MM,
    FLAT_HINT: FLAT_HINT,
    LAMINAR_NOTE: LAMINAR_NOTE,
    haalandF: haalandF,
    formatSci: formatSci,
    compute: compute
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.P1Calc = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
