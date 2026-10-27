import { chromium, webkit } from "/tmp/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.PROOF_OUT || __dirname;
const BASE = process.env.PROOF_BASE || "http://127.0.0.1:8792/";
const widths = [320, 390, 430];
const height = 844;

fs.mkdirSync(OUT, { recursive: true });
const lines = [];
function log(m) { console.log(m); lines.push(m); }

async function prove(browserName, browser, width) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector(".phone");
  await page.waitForTimeout(300);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const app = document.getElementById("app");
    const sx =
      doc.scrollWidth > doc.clientWidth + 1 ||
      body.scrollWidth > body.clientWidth + 1 ||
      (app && app.scrollWidth > app.clientWidth + 1);
    const badge = document.querySelector(".badge")?.textContent?.trim() || "";
    const h1 = document.querySelector("header.appbar h1")?.textContent?.trim() || "";
    const tot = document.getElementById("v-dPtot")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const vel = document.getElementById("v-v")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const play = document.getElementById("btnPlay");
    const playCs = getComputedStyle(play);
    const playPrimary =
      play.classList.contains("primary") &&
      playCs.backgroundColor.replace(/\s/g, "") === "rgb(30,42,80)" &&
      (playCs.color === "rgb(255, 255, 255)" || playCs.color === "#fff");
    const playH = play.getBoundingClientRect().height;
    const stepH = Math.min(
      ...[...document.querySelectorAll("#steps button")].map((b) => b.getBoundingClientRect().height)
    );
    const honesty = document.querySelector(".demo-note")?.textContent || "";
    const strip = document.getElementById("vizStrip");
    return {
      sx,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      badge,
      h1,
      tot,
      vel,
      playPrimary,
      playH,
      stepH,
      honesty,
      stripVariant: strip?.getAttribute("data-variant"),
      stripStep: strip?.getAttribute("data-step"),
    };
  });

  // Spot-check Golden A numbers at load
  const goldenA =
    /4\.00/.test(metrics.vel) &&
    /27\.[0-4]/.test(metrics.tot) &&
    /2\.[78]/.test(metrics.tot);

  // Switch CHW (tab → defaults + step 1; jump to 5 for totals)
  await page.click("#tabChw");
  await page.waitForTimeout(150);
  await page.click("#steps button[data-step=\"5\"]");
  await page.waitForTimeout(150);
  const chw = await page.evaluate(() => {
    const tot = document.getElementById("c-dPtot")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const vel = document.getElementById("c-v")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const strip = document.getElementById("vizStrip");
    const airHidden = document.getElementById("airResults").hidden;
    return {
      tot, vel,
      variant: strip?.getAttribute("data-variant"),
      airHidden,
      kPa: /kPa/.test(tot),
      head: /m head/.test(tot),
    };
  });

  // Golden B warn
  await page.goto(BASE + "?warn=1&step=5", { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  const warn = await page.evaluate(() => {
    const vel = document.getElementById("v-v")?.innerHTML || "";
    const helper = document.getElementById("vHelper");
    const strip = document.getElementById("vizStrip");
    const tot = document.getElementById("v-dPtot")?.textContent || "";
    return {
      hasWarnBand: /band-warn/.test(vel),
      helperVisible: helper && !helper.hidden && /warn|偏高|high/i.test(helper.textContent || ""),
      stripWarn: strip?.classList.contains("warn"),
      tot,
    };
  });

  // Play / Pause chrome
  await page.goto(BASE + "?step=2", { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await page.click("#btnPlay");
  await page.waitForTimeout(100);
  const pauseChrome = await page.evaluate(() => {
    const play = document.getElementById("btnPlay");
    const cs = getComputedStyle(play);
    return {
      label: play.textContent.trim(),
      bg: cs.backgroundColor.replace(/\s/g, ""),
      color: cs.color.replace(/\s/g, ""),
      isPrimary: play.classList.contains("primary"),
    };
  });
  await page.click("#btnPlay"); // pause
  await page.waitForTimeout(50);

  const tag = `${browserName}-${width}`;
  const shot = path.join(OUT, `${tag}.png`);
  await page.goto(BASE + "?step=5", { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot, fullPage: false });

  const noSx = !metrics.sx && metrics.scrollWidth <= metrics.clientWidth + 1;
  // Live ship: no PREVIEW/MOCKUP chip. A badge means this tree is not the live tip.
  const badgeOk = metrics.badge === "";
  const titleOk = /Duct \/ pipe/.test(metrics.h1);
  const tapsOk = metrics.playH >= 44 && metrics.stepH >= 44;
  const honestyOk = /Teaching Darcy–Weisbach/.test(metrics.honesty) && /教學用/.test(metrics.honesty);
  const chwOk = chw.variant === "pipe" && chw.kPa && chw.head && chw.airHidden;
  const warnOk = warn.hasWarnBand && warn.stripWarn;
  const pauseOk =
    pauseChrome.label === "Pause" &&
    pauseChrome.isPrimary &&
    pauseChrome.bg === "rgb(30,42,80)";

  const pass = noSx && badgeOk && titleOk && tapsOk && honestyOk && goldenA && chwOk && warnOk && pauseOk && metrics.playPrimary;

  log(`[${tag}] PASS=${pass} scrollPASS=${noSx} sx=${metrics.sx} ${metrics.scrollWidth}/${metrics.clientWidth}`);
  log(`  badge=${metrics.badge || "(none)"} h1=${metrics.h1}`);
  log(`  GoldenA vel=${metrics.vel} tot=${metrics.tot} ok=${goldenA}`);
  log(`  CHW variant=${chw.variant} tot=${chw.tot} ok=${chwOk}`);
  log(`  warn band=${warn.hasWarnBand} strip=${warn.stripWarn} tot=${warn.tot.trim().slice(0,40)} ok=${warnOk}`);
  log(`  pause label=${pauseChrome.label} bg=${pauseChrome.bg} ok=${pauseOk}`);
  log(`  taps playH=${metrics.playH} stepH=${metrics.stepH} honesty=${honestyOk}`);
  log(`  shot=${shot}`);

  await context.close();
  return { tag, pass, noSx, shot, goldenA, chwOk, warnOk, pauseOk };
}

async function main() {
  const results = [];
  for (const [name, launch] of [
    ["chromium", chromium],
    ["webkit", webkit],
  ]) {
    const browser = await launch.launch();
    for (const w of widths) {
      results.push(await prove(name, browser, w));
    }
    await browser.close();
  }
  const all = results.every((r) => r.pass);
  const scrollAll = results.every((r) => r.noSx);
  log("\n=== SUMMARY ===");
  log("scroll matrix: " + results.map((r) => `${r.tag}:${r.noSx ? "PASS" : "FAIL"}`).join(" "));
  log("overall: " + (all ? "PASS" : "FAIL"));
  fs.writeFileSync(path.join(OUT, "REPORT.txt"), lines.join("\n") + "\n");
  fs.writeFileSync(
    path.join(OUT, "RESULTS.json"),
    JSON.stringify({ all, scrollAll, results }, null, 2)
  );
  process.exit(all ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
