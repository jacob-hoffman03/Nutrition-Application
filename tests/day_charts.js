/* Day-by-day panel + weight-dot context + maintenance sparkline.
   Panel (2026.10.18-d): mirrors This week — Carbs/Water/Sodium categories,
   7-day window, < > paging. Runs on Jay's real export (fuel-data-8): the
   current window (Oct 12-18) contains Oct 15's 8,085 mg sodium day ("8.1k")
   and his flat-127 fed week; the weight chart (All range) must show BOTH dot
   kinds; the sparkline renders from his real 17-entry adaptiveHist. */
const fs = require("fs"), path = require("path"), os = require("os");
const { JSDOM } = require(path.join(__dirname, "..", "node_modules", "jsdom"));
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nxdc-"));
fs.writeFileSync(path.join(tmp, "harness.html"), html.replace('persistence:"local"', 'persistence:"memory"'));

let pass = 0, fail = 0;
function ok(c, m){ if(c){ pass++; } else { fail++; console.log("  FAIL", m); } }

const EXPORT = JSON.parse(fs.readFileSync(path.join(os.homedir(), "workspace/user/files/fuel-data-8.json"), "utf8"));

const dom = new JSDOM(fs.readFileSync(path.join(tmp, "harness.html"), "utf8"), {
  url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w){
    w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
    w.localStorage.setItem("fuel.v1", JSON.stringify(EXPORT));
  }
});
const w = dom.window;
const sleep = ms => new Promise(r=>setTimeout(r, ms));

(async ()=>{
  await sleep(500);
  const ev = x => w.eval(x);
  const doc = w.document;

  /* --- Day-by-day panel: default Carbs, current week --- */
  ev("renderProgress()");
  const bars = () => doc.getElementById("dbBars");
  ok(bars().querySelectorAll(".bcol").length === 7, "panel renders 7 day columns, got " + bars().querySelectorAll(".bcol").length);
  ok(doc.getElementById("dbUnit").textContent === "g", "default category is Carbs (unit g)");
  ok(/of 7 days/.test(doc.getElementById("dbAvg").textContent), "avg line populated: '" + doc.getElementById("dbAvg").textContent + "'");
  ok(doc.getElementById("dbRange").textContent === "Last 7 days", "range label is Last 7 days");
  ok(doc.getElementById("dbNext").disabled === true && doc.getElementById("dbPrev").disabled === false, "nav state: next disabled at current week, prev enabled");
  ok(doc.querySelector('#dbSeg .segbtn[data-dseg="crb"]').classList.contains("on"), "Carbs tab marked on");

  /* --- Sodium category --- */
  ev('S.dbSeg = "sod"; paintDayCharts()');
  ok(bars().innerHTML.includes("8.1k"), "sodium bars show Oct 15's 8,085 mg as 8.1k");
  ok(doc.getElementById("dbUnit").textContent === "mg", "sodium unit is mg");
  ok(/Sodium averaged/.test(doc.getElementById("dbNote").textContent), "vs-last-week note renders for sodium: '" + doc.getElementById("dbNote").textContent + "'");

  /* --- Water category --- */
  ev('S.dbSeg = "wtr"; paintDayCharts()');
  ok(bars().querySelectorAll(".bcol").length === 7 && doc.getElementById("dbUnit").textContent === "oz", "water category renders 7 columns, unit oz");

  /* --- Paging back one week: Oct 5 - Oct 11 --- */
  ev('S.dbSeg = "crb"; dbOffset = 1; paintDayCharts()');
  const lbl = doc.getElementById("dbRange").textContent;
  ok(lbl.includes("Oct 5") && lbl.includes("Oct 11"), "backtrack label is the date range, got '" + lbl + "'");
  ok(bars().querySelector(".bdn").textContent === "5", "first column is Oct 5");
  ok(doc.getElementById("dbNext").disabled === false, "next re-enables after paging back");
  ev("dbOffset = 0; paintDayCharts()");

  /* --- Weight chart dots (All range so Sep light days are in view) --- */
  ev("wRange = 0");
  ev("paintWeightChart(sortedWeights())");
  const svg = doc.getElementById("weightChart").innerHTML;
  const hollow = (svg.match(/stroke="#a9a9ba"/g) || []).length;
  const solids = (svg.match(/r="3\.2" fill="(?!#fff)/g) || []).length;
  ok(hollow >= 1, "at least one hollow (light day before) dot, got " + hollow);
  ok(solids >= 1, "at least one solid (fed day before) dot, got " + solids);
  const wlg = doc.getElementById("wGoalLegend");
  ok(wlg.style.display !== "none" && wlg.textContent.includes("light day before"), "dot legend visible with the key");

  /* --- Maintenance sparkline in the Autopilot card --- */
  ev("paintAutoZone()");
  const az = doc.getElementById("autoZoneP").innerHTML;
  ok(az.includes("Maintenance trend"), "sparkline block renders in Autopilot");
  ok(/Sep 29/.test(az) && /Oct 17/.test(az), "sparkline spans his real history dates (Sep 29 -> Oct 17)");

  w.close();
  console.log(`day_charts: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ERR", e); process.exit(1); });
