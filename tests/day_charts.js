/* Day-by-day charts + weight-dot context + maintenance sparkline (2026.10.18-c).
   Runs on Jay's real export (fuel-data-8): the last-14 window (Oct 5-18)
   contains his flat-127 fed week and the Oct 11 jump, so the weight chart must
   show BOTH dot kinds (fed solid, light hollow), the sodium chart must show
   Oct 15's 8,085 mg as "8.1k", and the sparkline must render from his real
   17-entry adaptiveHist. */
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

  /* --- Day-by-day charts --- */
  ev("renderProgress()");
  ["dbCarbs", "dbWater", "dbSodium"].forEach(id => {
    const box = doc.getElementById(id);
    ok(box && box.querySelectorAll(".dbcol").length === 14, id + " renders 14 day columns, got " + (box ? box.querySelectorAll(".dbcol").length : "missing"));
  });
  const carbAvg = doc.getElementById("dbCarbAvg").textContent;
  ok(/avg \d+g · \d+ of 14 days/.test(carbAvg), "carb avg line populated: '" + carbAvg + "'");
  const sodHtml = doc.getElementById("dbSodium").innerHTML;
  ok(sodHtml.includes("8.1k"), "sodium chart shows Oct 15's 8,085 mg as 8.1k");
  const sodAvg = doc.getElementById("dbSodiumAvg").textContent;
  ok(/avg [\d,]+ mg/.test(sodAvg), "sodium avg line populated: '" + sodAvg + "'");
  const wtrAvg = doc.getElementById("dbWaterAvg").textContent;
  ok(/avg|no data/.test(wtrAvg), "water avg line present: '" + wtrAvg + "'");

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
