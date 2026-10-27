/**
 * P1 Darcy–Weisbach + ΣK + Haaland — Beatrice SPEC lock.
 * Do not invent constants or formulas.
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

  function haalandF(eps_m, Dh_m, Re) {
    if (!(Re > 0) || !(Dh_m > 0)) return NaN;
    var term = Math.pow(eps_m / Dh_m / 3.7, 1.11) + 6.9 / Re;
    if (!(term > 0)) return NaN;
    var inv = -1.8 * Math.log10(term);
    return 1 / (inv * inv);
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

    var empty = {
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
      helper: "Enter positive flow / size"
    };

    if (!(Qraw > 0) || !(L >= 0) || !(SK >= 0) || !isFinite(Qraw) || !isFinite(L) || !isFinite(SK)) {
      return empty;
    }

    var rho, nu, eps_m, A, Dh, Q_m3s, ID_mm = null, D_mm = null;

    if (mode === "chw") {
      rho = WATER_RHO;
      nu = WATER_NU;
      var dn = Number(input.DN);
      ID_mm = DN_ID_MM[dn];
      if (!(ID_mm > 0)) return empty;
      var ID = ID_mm / 1000;
      A = Math.PI * ID * ID / 4;
      Dh = ID;
      Q_m3s = Qraw / 1000;
      eps_m = (EPS_MM[input.material] != null ? EPS_MM[input.material] : EPS_MM.steel) / 1000;
    } else {
      rho = AIR_RHO;
      nu = AIR_NU;
      eps_m = (EPS_MM[input.material] != null ? EPS_MM[input.material] : EPS_MM.gi) / 1000;
      Q_m3s = Qraw;
      if (input.shape === "circ") {
        D_mm = Number(input.D_mm);
        if (!(D_mm > 0)) return empty;
        var D = D_mm / 1000;
        A = Math.PI * D * D / 4;
        Dh = D;
      } else {
        var W_mm = Number(input.W_mm);
        var H_mm = Number(input.H_mm);
        if (!(W_mm > 0) || !(H_mm > 0)) return empty;
        var W = W_mm / 1000;
        var H = H_mm / 1000;
        A = W * H;
        Dh = (2 * W * H) / (W + H);
      }
    }

    if (!(A > 0) || !(Dh > 0)) return empty;

    var v = Q_m3s / A;
    var Re = (v * Dh) / nu;
    var f = haalandF(eps_m, Dh, Re);
    var dyn = rho * v * v / 2;
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
      mmH2O: dPtot_Pa / G,
      head_m: dPtot_Pa / (rho * G),
      soft: soft,
      aspectHint: aspectHint,
      laminarNote: laminarNote,
      helper: soft.message || (aspectHint ? "Flat duct — check on drawings / 扁管留意圖則" : "")
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
    haalandF: haalandF,
    compute: compute
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.P1Calc = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
