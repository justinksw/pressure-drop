(function () {
  "use strict";

  var BEAT_MS = 1200;
  var CAPTIONS = {
    1: "1 · Flow & size · 風量／管徑",
    2: "2 · Velocity · 流速",
    3: "3 · Friction along L · 沿程摩擦",
    4: "4 · Fittings · 配件",
    5: "5 · Total ΔP · 總壓降"
  };
  var BEATS = {
    1: "1 · Size",
    2: "2 · Velocity",
    3: "3 · Friction fill",
    4: "4 · ΣK fittings",
    5: "5 · Total ΔP"
  };
  var FORMULAS = {
    1: [
      ["v = Q / A", "流速 = 風量 ÷ 截面積"],
      ["Dh = 2·W·H / (W+H)", "水力直徑"]
    ],
    2: [
      ["v = Q / A", "流速 = 風量 ÷ 截面積"]
    ],
    3: [
      ["Re = v · Dh / ν", "雷諾數（圓管用 D）"],
      ["1/√f = −1.8 log₁₀[(ε/Dh/3.7)¹·¹¹ + 6.9/Re]", "Haaland"],
      ["ΔP_f = f · (L/Dh) · (ρ v² / 2)", "Darcy–Weisbach"]
    ],
    4: [
      ["ΔP_k = ΣK · (ρ v² / 2)", "配件壓降"]
    ],
    5: [
      ["ΔP = ΔP_f + ΔP_k", "總壓降"],
      ["mmH₂O ≈ ΔP / 9.81", "空氣雙單位"],
      ["H = ΔP / (ρ g)", "CHW 水頭"]
    ]
  };

  var AIR_DEFAULTS = {
    shape: "rect",
    Q: "0.40",
    W: "400",
    H: "250",
    D: "300",
    L: "20",
    material: "gi",
    SK: "1.5",
    role: "branch"
  };
  var CHW_DEFAULTS = {
    Q: "2.0",
    DN: "50",
    L: "30",
    material: "steel",
    SK: "2.0"
  };

  var mode = "air";
  var step = 5;
  var playing = false;
  var playTimer = null;
  var last = null;

  function $(id) { return document.getElementById(id); }

  function fmtSci(n, digs) {
    if (n == null || !isFinite(n)) return "—";
    if (n >= 1000) {
      var exp = Math.floor(Math.log10(n));
      var mant = n / Math.pow(10, exp);
      return "≈ " + mant.toFixed(2) + "×10" + toSup(exp);
    }
    return "≈ " + n.toFixed(digs != null ? digs : 2);
  }

  function toSup(exp) {
    var map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
    return String(exp).split("").map(function (c) { return map[c] || c; }).join("");
  }

  function fmtNum(n, digs) {
    if (n == null || !isFinite(n)) return "—";
    return n.toFixed(digs);
  }

  function readAirInput() {
    var shapeBtn = document.querySelector("[data-shape][aria-checked='true']");
    var roleBtn = document.querySelector("#roleRow .seg-btn[aria-checked='true']");
    var matSel = $("airMat");
    return {
      mode: "air",
      shape: shapeBtn ? shapeBtn.dataset.shape : "rect",
      Q: parseFloat($("airQ").value, 10),
      W_mm: parseFloat($("airW").value, 10),
      H_mm: parseFloat($("airH").value, 10),
      D_mm: parseFloat($("airD").value, 10),
      L_m: parseFloat($("airL").value, 10),
      material: matSel.value,
      SK: parseFloat($("airSK").value, 10),
      role: roleBtn ? roleBtn.dataset.role : "branch"
    };
  }

  function readChwInput() {
    var matSel = $("chwMat");
    return {
      mode: "chw",
      Q: parseFloat($("chwQ").value, 10),
      DN: parseInt($("chwDN").value, 10),
      L_m: parseFloat($("chwL").value, 10),
      material: matSel.value,
      SK: parseFloat($("chwSK").value, 10)
    };
  }

  function setAirDefaults() {
    $("airQ").value = AIR_DEFAULTS.Q;
    $("airW").value = AIR_DEFAULTS.W;
    $("airH").value = AIR_DEFAULTS.H;
    $("airD").value = AIR_DEFAULTS.D;
    $("airL").value = AIR_DEFAULTS.L;
    $("airSK").value = AIR_DEFAULTS.SK;
    $("airMat").value = "gi";
    document.querySelectorAll("[data-shape]").forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.shape === "rect" ? "true" : "false");
    });
    $("fldW").hidden = false;
    $("fldH").hidden = false;
    $("fldD").hidden = true;
    document.querySelectorAll("#roleRow .seg-btn").forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.role === "branch" ? "true" : "false");
    });
    updateAirQLs();
  }

  function setChwDefaults() {
    $("chwQ").value = CHW_DEFAULTS.Q;
    $("chwDN").value = CHW_DEFAULTS.DN;
    $("chwL").value = CHW_DEFAULTS.L;
    $("chwSK").value = CHW_DEFAULTS.SK;
    $("chwMat").value = "steel";
  }

  function updateAirQLs() {
    var q = parseFloat($("airQ").value, 10);
    $("airQLs").textContent = isFinite(q) ? ("= " + Math.round(q * 1000) + " L/s") : "= — L/s";
  }

  function dash() { return "—"; }

  function renderResults(r) {
    last = r;
    var air = mode === "air";
    if (!r || !r.valid) {
      if (air) {
        $("v-A").textContent = dash();
        $("v-Dh").textContent = dash();
        $("v-v").textContent = dash();
        $("v-Re").textContent = dash();
        $("v-f").textContent = dash();
        $("v-dPf").textContent = dash();
        $("v-dPk").textContent = dash();
        $("v-dPtot").textContent = dash();
      } else {
        $("c-A").textContent = dash();
        $("c-ID").textContent = dash();
        $("c-v").textContent = dash();
        $("c-Re").textContent = dash();
        $("c-f").textContent = dash();
        $("c-dPf").textContent = dash();
        $("c-dPk").textContent = dash();
        $("c-dPtot").textContent = dash();
      }
      var helperBad = $("vHelper");
      helperBad.hidden = step < 2;
      helperBad.textContent = (r && r.helper) || "Enter positive flow / size";
      updateStripWarn(false);
      return;
    }

    if (air) {
      $("v-A").textContent = fmtNum(r.A, 4) + " m²";
      var shapeBtn = document.querySelector("[data-shape][aria-checked='true']");
      var circ = shapeBtn && shapeBtn.dataset.shape === "circ";
      if (circ) {
        $("r-Dh").querySelector(".lab").textContent = "Diameter / 直徑";
        $("v-Dh").textContent = fmtNum(r.D_mm, 1) + " mm";
      } else {
        $("r-Dh").querySelector(".lab").textContent = "Hydraulic dia. / 水力直徑";
        $("v-Dh").textContent = fmtNum(r.Dh_mm, 1) + " mm";
      }
      var band = "";
      if (r.soft.warn) band = ' <span class="band-warn">WARN</span>';
      else if (r.soft.ok) band = ' <span class="band-ok">OK</span>';
      $("v-v").innerHTML = fmtNum(r.v, 2) + " m/s" + band;
      $("v-Re").textContent = fmtSci(r.Re);
      $("v-f").textContent = "≈ " + fmtNum(r.f, 4);
      $("v-dPf").textContent = "≈ " + fmtNum(r.dPf_Pa, 1) + " Pa";
      $("v-dPk").textContent = fmtNum(r.dPk_Pa, 1) + " Pa";
      $("v-dPtot").innerHTML =
        "≈ " + fmtNum(r.dPtot_Pa, 1) + " Pa" +
        '<span class="sec">≈ ' + fmtNum(r.mmH2O, 1) + " mmH₂O</span>";
    } else {
      $("c-A").textContent = fmtSci(r.A, 4) + " m²";
      $("c-ID").textContent = fmtNum(r.ID_mm, 1) + " mm";
      var bandC = "";
      if (r.soft.warn) bandC = ' <span class="band-warn">WARN</span>';
      else if (r.soft.ok) bandC = ' <span class="band-ok">OK</span>';
      $("c-v").innerHTML = "≈ " + fmtNum(r.v, 2) + " m/s" + bandC;
      $("c-Re").textContent = fmtSci(r.Re);
      $("c-f").textContent = "≈ " + fmtNum(r.f, 4);
      $("c-dPf").textContent = "≈ " + fmtNum(r.dPf_kPa, 2) + " kPa";
      $("c-dPk").textContent = "≈ " + fmtNum(r.dPk_kPa, 2) + " kPa";
      $("c-dPtot").innerHTML =
        "≈ " + fmtNum(r.dPtot_kPa, 2) + " kPa" +
        '<span class="sec">≈ ' + fmtNum(r.head_m, 2) + " m head</span>";
    }

    var helper = $("vHelper");
    var msgs = [];
    if (r.soft.warn && r.soft.message) msgs.push(r.soft.message);
    if (r.aspectHint) msgs.push("Flat duct — check on drawings / 扁管留意圖則");
    if (r.laminarNote && step >= 3) msgs.push("Laminar — Haaland less typical; still demo");
    if (msgs.length && step >= 2) {
      helper.hidden = false;
      helper.textContent = msgs.join(" · ");
    } else {
      helper.hidden = true;
      helper.textContent = "";
    }
    updateStripWarn(!!r.soft.warn);
  }

  function updateStripWarn(warn) {
    $("vizStrip").classList.toggle("warn", !!warn);
  }

  function updateStrip(n) {
    var strip = $("vizStrip");
    strip.setAttribute("data-step", String(n));
    strip.classList.toggle("playing", playing);
    if (mode === "chw") {
      strip.setAttribute("data-variant", "pipe");
      $("stripGlyph").textContent = "○";
      $("stripLen").textContent = "L = " + ($("chwL").value || "30") + " m";
    } else {
      strip.setAttribute("data-variant", "duct");
      var circ = document.querySelector("[data-shape][aria-checked='true']");
      $("stripGlyph").textContent = (circ && circ.dataset.shape === "circ") ? "○" : "□";
      $("stripLen").textContent = "L = " + ($("airL").value || "20") + " m";
    }
    $("stripBeat").textContent = BEATS[n];
  }

  function setStep(n, fromPlay) {
    step = n;
    document.querySelectorAll("#steps button").forEach(function (btn) {
      btn.setAttribute("aria-current", btn.dataset.step === String(n) ? "true" : "false");
    });
    $("stepCaption").textContent = CAPTIONS[n];
    var root = mode === "air" ? $("airResults") : $("chwResults");
    root.querySelectorAll(".result-row").forEach(function (row) {
      var from = parseInt(row.getAttribute("data-from"), 10);
      row.hidden = from > n;
    });
    // vHelper visibility tied to step in renderResults
    updateStrip(n);
    renderHow(n);
    if (last) renderResults(last);
    if (!fromPlay && playing) stopPlay();
  }

  function renderHow(n) {
    var list = FORMULAS[n] || [];
    var html = "<ul>";
    list.forEach(function (pair) {
      html += "<li><code>" + pair[0] + "</code>";
      if (pair[1]) html += " <span class='zh-f'>（" + pair[1] + "）</span>";
      html += "</li>";
    });
    html += "</ul>";
    $("howBody").innerHTML = html;
  }

  function stopPlay() {
    playing = false;
    if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    $("btnPlay").setAttribute("aria-pressed", "false");
    $("btnPlay").textContent = "Play";
    $("btnPlay").setAttribute("aria-label", "Play story");
    $("vizStrip").classList.remove("playing");
  }

  function scheduleNext() {
    if (!playing) return;
    playTimer = setTimeout(function () {
      if (!playing) return;
      if (step >= 5) {
        stopPlay();
        return;
      }
      setStep(step + 1, true);
      scheduleNext();
    }, BEAT_MS);
  }

  function startPlay() {
    if (playing) return;
    playing = true;
    $("btnPlay").setAttribute("aria-pressed", "true");
    $("btnPlay").textContent = "Pause";
    $("btnPlay").setAttribute("aria-label", "Pause story");
    if (step >= 5) {
      setStep(1, true);
    } else {
      updateStrip(step);
    }
    scheduleNext();
  }

  function recompute() {
    var input = mode === "air" ? readAirInput() : readChwInput();
    var r = window.P1Calc.compute(input);
    renderResults(r);
    updateStrip(step);
  }

  function setMode(m, goStep) {
    stopPlay();
    mode = m;
    last = null;
    $("tabAir").setAttribute("aria-checked", m === "air" ? "true" : "false");
    $("tabChw").setAttribute("aria-checked", m === "chw" ? "true" : "false");
    $("airPanel").hidden = m !== "air";
    $("chwPanel").hidden = m !== "chw";
    $("airResults").hidden = m !== "air";
    $("chwResults").hidden = m !== "chw";
    if (m === "air") setAirDefaults();
    else setChwDefaults();
    setStep(goStep == null ? 1 : goStep);
    recompute();
  }

  function applyGoldenBInputs() {
    setMode("air", 5);
    $("airQ").value = "0.40";
    $("airW").value = "300";
    $("airH").value = "150";
    $("airL").value = "20";
    $("airSK").value = "1.5";
    $("airMat").value = "gi";
    document.querySelectorAll("[data-shape]").forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset.shape === "rect" ? "true" : "false");
    });
    $("fldW").hidden = false;
    $("fldH").hidden = false;
    $("fldD").hidden = true;
    updateAirQLs();
    recompute();
    setStep(5);
  }

  // —— wire events ——
  $("tabAir").addEventListener("click", function () { setMode("air", 1); });
  $("tabChw").addEventListener("click", function () { setMode("chw", 1); });

  document.querySelectorAll("#roleRow .seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#roleRow .seg-btn").forEach(function (b) {
        b.setAttribute("aria-checked", b === btn ? "true" : "false");
      });
      recompute();
    });
  });

  document.querySelectorAll("[data-shape]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-shape]").forEach(function (b) {
        b.setAttribute("aria-checked", b === btn ? "true" : "false");
      });
      var circ = btn.dataset.shape === "circ";
      $("fldW").hidden = circ;
      $("fldH").hidden = circ;
      $("fldD").hidden = !circ;
      recompute();
    });
  });

  document.querySelectorAll("#steps button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setStep(parseInt(btn.dataset.step, 10));
    });
  });

  $("btnPlay").addEventListener("click", function () {
    if (playing) stopPlay();
    else startPlay();
  });

  ["airQ", "airW", "airH", "airD", "airL", "airSK"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      if (id === "airQ") updateAirQLs();
      recompute();
    });
  });
  $("airMat").addEventListener("change", recompute);

  ["chwQ", "chwL", "chwSK"].forEach(function (id) {
    $(id).addEventListener("input", recompute);
  });
  $("chwDN").addEventListener("change", recompute);
  $("chwMat").addEventListener("change", recompute);

  // URL helpers
  var params = new URLSearchParams(location.search);
  var freezeStep = params.get("step");
  var startStep = freezeStep ? parseInt(freezeStep, 10) : 5;
  if (isNaN(startStep) || startStep < 1 || startStep > 5) startStep = 5;

  if (params.get("warn") === "1") {
    applyGoldenBInputs();
    setStep(startStep);
  } else if (params.get("chw") === "1") {
    setMode("chw", startStep);
  } else {
    setAirDefaults();
    mode = "air";
    setStep(startStep);
    recompute();
  }

  if (params.get("play") === "1") {
    startPlay();
  }
  if (params.get("pause") === "1") {
    $("btnPlay").setAttribute("aria-pressed", "true");
    $("btnPlay").textContent = "Pause";
    $("btnPlay").setAttribute("aria-label", "Pause story");
  }
})();
