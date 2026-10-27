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
      ["v = Q / A", "流速 = 風量 ÷ 截面積"]
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
  var RECT_DH = ["Dh = 2·W·H / (W+H)", "水力直徑"];
  var AIR_DASH = ["v-A", "v-Dh", "v-v", "v-Re", "v-f", "v-dPf", "v-dPk", "v-dPtot"];
  var CHW_DASH = ["c-A", "c-ID", "c-v", "c-Re", "c-f", "c-dPf", "c-dPk", "c-dPtot"];

  var mode = "air";
  var step = 5;
  var playing = false;
  var playTimer = null;
  var last = null;

  function $(id) { return document.getElementById(id); }

  function fmtNum(n, digs) {
    if (n == null || !isFinite(n)) return "—";
    return n.toFixed(digs);
  }

  function approx(n, digs) {
    var t = fmtNum(n, digs);
    return t === "—" ? t : "≈ " + t;
  }

  function readNum(id) {
    return parseFloat($(id).value);
  }

  function checkedValue(selector, key, fallback) {
    var el = document.querySelector(selector);
    return el ? el.dataset[key] : fallback;
  }

  function setChecked(selector, key, value) {
    document.querySelectorAll(selector).forEach(function (b) {
      b.setAttribute("aria-checked", b.dataset[key] === value ? "true" : "false");
    });
  }

  function airShape() {
    return checkedValue("[data-shape][aria-checked='true']", "shape", "rect");
  }

  function applyAirShape(shape) {
    setChecked("[data-shape]", "shape", shape);
    var circ = shape === "circ";
    $("fldW").hidden = circ;
    $("fldH").hidden = circ;
    $("fldD").hidden = !circ;
  }

  function bandHtml(soft) {
    if (soft.warn) return ' <span class="band-warn">WARN</span>';
    if (soft.ok) return ' <span class="band-ok">OK</span>';
    return "";
  }

  function clearText(ids) {
    ids.forEach(function (id) { $(id).textContent = "—"; });
  }

  function readAirInput() {
    return {
      mode: "air",
      shape: airShape(),
      Q: readNum("airQ"),
      W_mm: readNum("airW"),
      H_mm: readNum("airH"),
      D_mm: readNum("airD"),
      L_m: readNum("airL"),
      material: $("airMat").value,
      SK: readNum("airSK"),
      role: checkedValue("#roleRow .seg-btn[aria-checked='true']", "role", "branch")
    };
  }

  function readChwInput() {
    return {
      mode: "chw",
      Q: readNum("chwQ"),
      DN: parseInt($("chwDN").value, 10),
      L_m: readNum("chwL"),
      material: $("chwMat").value,
      SK: readNum("chwSK")
    };
  }

  function setAirDefaults() {
    $("airQ").value = AIR_DEFAULTS.Q;
    $("airW").value = AIR_DEFAULTS.W;
    $("airH").value = AIR_DEFAULTS.H;
    $("airD").value = AIR_DEFAULTS.D;
    $("airL").value = AIR_DEFAULTS.L;
    $("airSK").value = AIR_DEFAULTS.SK;
    $("airMat").value = AIR_DEFAULTS.material;
    applyAirShape(AIR_DEFAULTS.shape);
    setChecked("#roleRow .seg-btn", "role", AIR_DEFAULTS.role);
    updateAirQLs();
  }

  function setChwDefaults() {
    $("chwQ").value = CHW_DEFAULTS.Q;
    $("chwDN").value = CHW_DEFAULTS.DN;
    $("chwL").value = CHW_DEFAULTS.L;
    $("chwSK").value = CHW_DEFAULTS.SK;
    $("chwMat").value = CHW_DEFAULTS.material;
  }

  function updateAirQLs() {
    var q = readNum("airQ");
    $("airQLs").textContent = isFinite(q) ? ("= " + Math.round(q * 1000) + " L/s") : "= — L/s";
  }

  function setTotal(id, primary, secondary) {
    $(id).innerHTML = primary + '<span class="sec">' + secondary + "</span>";
  }

  function renderResults(r) {
    last = r;
    var air = mode === "air";
    var helperEl = $("vHelper");
    if (!r || !r.valid) {
      clearText(air ? AIR_DASH : CHW_DASH);
      helperEl.hidden = false;
      helperEl.textContent = (r && r.helper) || "Enter positive flow / size";
      updateStripWarn(false);
      return;
    }

    if (air) {
      var circ = airShape() === "circ";
      $("v-A").textContent = fmtNum(r.A, 4) + " m²";
      if (circ) {
        $("r-Dh").querySelector(".lab").textContent = "Diameter / 直徑";
        $("v-Dh").textContent = fmtNum(r.D_mm, 1) + " mm";
      } else {
        $("r-Dh").querySelector(".lab").textContent = "Hydraulic dia. / 水力直徑";
        $("v-Dh").textContent = fmtNum(r.Dh_mm, 1) + " mm";
      }
      $("v-v").innerHTML = fmtNum(r.v, 2) + " m/s" + bandHtml(r.soft);
      $("v-Re").textContent = window.P1Calc.formatSci(r.Re);
      $("v-f").textContent = approx(r.f, 4);
      $("v-dPf").textContent = approx(r.dPf_Pa, 1) + " Pa";
      $("v-dPk").textContent = fmtNum(r.dPk_Pa, 1) + " Pa";
      setTotal("v-dPtot", approx(r.dPtot_Pa, 1) + " Pa", approx(r.mmH2O, 1) + " mmH₂O");
    } else {
      $("c-A").textContent = window.P1Calc.formatSci(r.A, 4) + " m²";
      $("c-ID").textContent = fmtNum(r.ID_mm, 1) + " mm";
      $("c-v").innerHTML = approx(r.v, 2) + " m/s" + bandHtml(r.soft);
      $("c-Re").textContent = window.P1Calc.formatSci(r.Re);
      $("c-f").textContent = approx(r.f, 4);
      $("c-dPf").textContent = approx(r.dPf_kPa, 2) + " kPa";
      $("c-dPk").textContent = approx(r.dPk_kPa, 2) + " kPa";
      setTotal("c-dPtot", approx(r.dPtot_kPa, 2) + " kPa", approx(r.head_m, 2) + " m head");
    }

    var msgs = [];
    if (r.helper) msgs.push(r.helper);
    if (r.laminarNote && step >= 3) msgs.push(window.P1Calc.LAMINAR_NOTE);
    if (msgs.length && step >= 2) {
      helperEl.hidden = false;
      helperEl.textContent = msgs.join(" · ");
    } else {
      helperEl.hidden = true;
      helperEl.textContent = "";
    }
    updateStripWarn(!!r.soft.warn);
  }

  function updateStripWarn(warn) {
    $("vizStrip").classList.toggle("warn", !!warn);
  }

  function lengthReadout(id) {
    var raw = $(id).value.trim();
    return "L = " + (raw === "" ? "—" : raw) + " m";
  }

  function updateStrip(n) {
    var strip = $("vizStrip");
    strip.setAttribute("data-step", String(n));
    strip.classList.toggle("playing", playing);
    if (mode === "chw") {
      strip.setAttribute("data-variant", "pipe");
      $("stripLen").textContent = lengthReadout("chwL");
    } else {
      strip.setAttribute("data-variant", "duct");
      $("stripLen").textContent = lengthReadout("airL");
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

  function formulaLines(n) {
    var lines = (FORMULAS[n] || []).slice();
    if (n === 1 && mode === "air" && airShape() === "rect") lines.push(RECT_DH);
    return lines;
  }

  function renderHow(n) {
    var list = formulaLines(n);
    var ul = document.createElement("ul");
    list.forEach(function (pair) {
      var li = document.createElement("li");
      var code = document.createElement("code");
      code.textContent = pair[0];
      li.appendChild(code);
      if (pair[1]) {
        var zh = document.createElement("span");
        zh.className = "zh-f";
        zh.textContent = "（" + pair[1] + "）";
        li.appendChild(document.createTextNode(" "));
        li.appendChild(zh);
      }
      ul.appendChild(li);
    });
    var body = $("howBody");
    body.textContent = "";
    body.appendChild(ul);
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
    renderHow(step);
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
    $("airMat").value = AIR_DEFAULTS.material;
    applyAirShape(AIR_DEFAULTS.shape);
    updateAirQLs();
    recompute();
    setStep(5);
  }

  // —— wire events ——
  $("tabAir").addEventListener("click", function () { setMode("air", 1); });
  $("tabChw").addEventListener("click", function () { setMode("chw", 1); });

  document.querySelectorAll("#roleRow .seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setChecked("#roleRow .seg-btn", "role", btn.dataset.role);
      recompute();
    });
  });

  document.querySelectorAll("[data-shape]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyAirShape(btn.dataset.shape);
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
