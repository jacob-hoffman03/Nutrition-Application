/* Smart Go-tos (2026.10.18-b): macro-gap re-ranking of go-tos + generalized
   Fill-the-gap. Scenario: Jay ate a protein-heavy, carb-light breakfast, so by
   lunch he is behind on CARBS relative to his calorie pace. His two lunch
   usuals are near-tied (legacy scoring puts chicken a hair ahead); the carb
   usual must re-rank above it and carry the reason. A balanced morning must
   produce NO gap and legacy behavior. Hermetic: fixed local copy of the shell. */
const fs = require("fs"), path = require("path"), os = require("os");
const { JSDOM } = require(path.join(__dirname, "..", "node_modules", "jsdom"));
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nxsg-"));
fs.writeFileSync(path.join(tmp, "harness.html"), html.replace('persistence:"local"', 'persistence:"memory"'));

let pass = 0, fail = 0; const fails = [];
function ok(c, m){ if(c){ pass++; } else { fail++; fails.push(m); console.log("  FAIL", m); } }

const EXPORT = JSON.parse(fs.readFileSync(path.join(os.homedir(), "workspace/user/files/fuel-data-8.json"), "utf8"));
const FLAGS = JSON.stringify({ zeroReset: 1, calcNet: 1 });

function boot(){
  const dom = new JSDOM(fs.readFileSync(path.join(tmp, "harness.html"), "utf8"), {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w){
      w.localStorage.setItem("fuel.flags.v1", FLAGS);
      w.localStorage.setItem("fuel.v1", JSON.stringify(EXPORT));
    }
  });
  return dom.window;
}
const sleep = ms => new Promise(r=>setTimeout(r, ms));

function seed(ev, todayCals){
  ev(`S.goals = { mode:"bulk", maintenance:2066, surplus:750, auto:true, goalSrc:"learned", goalNote:"", protein:126, carbs:403, fat:78, macroAuto:true, waterAuto:true, waterOz:96, rateWk:0.5 };`);
  ev(`S.profile = Object.assign(S.profile||{}, { weightLb:127 });`);
  ev(`S.customFoods = [
    {n:"Test Rice Bowl", s:"1 bowl", cal:700, p:14, c:150, f:10, kind:"food", unit:null, nutrs:[], xw:false},
    {n:"Test Chicken", s:"1 breast", cal:310, p:58, c:0, f:6, kind:"food", unit:null, nutrs:[], xw:false},
    {n:"Test Egg Whites", s:"1 cup", cal:120, p:26, c:2, f:0, kind:"food", unit:null, nutrs:[], xw:false},
    {n:"Test Oil", s:"1 tbsp", cal:120, p:0, c:0, f:14, kind:"food", unit:null, nutrs:[], xw:false}
  ];`);
  ev(`S.lastServ = {}; S.favorites = [];`);
  const E = (n, cal, p, c, f) => ({ id: Math.random().toString(36).slice(2), n, s: "1 serv", qty: 1, img: null, loc: null, cal, p, c, f, kind: "food", nutrs: [], xw: false });
  const days = {};
  const t = ev("todayStr()");
  const d1 = ev(`addDays(todayStr(), -1)`), d2 = ev(`addDays(todayStr(), -2)`), d3 = ev(`addDays(todayStr(), -3)`);
  const blank = () => ({ meals: { breakfast: [], lunch: [], dinner: [], snacks: [], supplements: [] }, water: [] });
  /* history: chicken at lunch d-1 and d-3; rice at lunch d-2 and d-3 (near-tie,
     chicken a hair ahead on recency); egg whites at breakfast daily */
  let x = blank(); x.meals.lunch.push(E("Test Chicken", 310, 58, 0, 6)); x.meals.breakfast.push(E("Test Egg Whites", 120, 26, 2, 0)); days[d1] = x;
  x = blank(); x.meals.lunch.push(E("Test Rice Bowl", 700, 14, 150, 10)); x.meals.breakfast.push(E("Test Egg Whites", 120, 26, 2, 0)); days[d2] = x;
  x = blank(); x.meals.lunch.push(E("Test Chicken", 310, 58, 0, 6)); x.meals.lunch.push(E("Test Rice Bowl", 700, 14, 150, 10)); x.meals.breakfast.push(E("Test Egg Whites", 120, 26, 2, 0)); days[d3] = x;
  x = blank(); todayCals.forEach(e => x.meals.breakfast.push(e)); days[t] = x;
  ev(`S.days = ${JSON.stringify(days)};`);
  ev("save()");
}

(async ()=>{
  /* ---- Scenario A: carb gap by lunch ---- */
  let w = boot(); await sleep(350);
  const ev = x => w.eval(x);
  const E = (n, cal, p, c, f) => ({ id: "t", n, s: "1 serv", qty: 1, img: null, loc: null, cal, p, c, f, kind: "food", nutrs: [], xw: false });
  seed(ev, [E("Test Egg Whites", 360, 78, 6, 0), E("Test Oil", 240, 0, 0, 28)]); /* 600 kcal, 78P / 6C / 28F: carbs far behind pace */
  const gap = ev("macroGap()");
  ok(gap && gap.key === "c", "A: macroGap detects carbs, got " + JSON.stringify(gap));
  ok(gap && Math.abs(gap.rem - 397) < 1, "A: remaining carbs = 397, got " + (gap && gap.rem));
  const gotos = ev("gotoFoods('lunch')");
  const names = gotos.map(r => r.f.n);
  ok(names.indexOf("Test Rice Bowl") !== -1 && names.indexOf("Test Chicken") !== -1, "A: both lunch usuals present: " + names.join(","));
  ok(names.indexOf("Test Rice Bowl") < names.indexOf("Test Chicken"), "A: rice re-ranked above chicken: " + names.join(","));
  const rice = gotos.find(r => r.f.n === "Test Rice Bowl");
  ok(rice && /remaining carbs/.test(rice.reason||""), "A: rice carries the carbs reason, got '" + (rice && rice.reason) + "'");
  const gaps = ev("gapFoods()");
  ok(gaps.length && gaps[0].f.n === "Test Rice Bowl" && gaps[0].gkLabel === "carbs", "A: Fill-the-gap leads with rice for carbs: " + JSON.stringify(gaps.map(g=>g.f.n+":"+g.gkLabel)));
  ev("sheetMeal = 'lunch'; paintSheetSmart('')");
  const smart = w.document.getElementById("sheetSmart").innerHTML;
  ok(smart.includes("Go-tos · ") && smart.includes("Fill the gap"), "A: both sections paint with the usual headers");
  ok(smart.includes("remaining carbs"), "A: painted go-to row shows the carbs reason");
  ok(/\+150g carbs/.test(smart), "A: painted gap row shows +150g carbs");
  /* the sheet still hides smart rows while searching */
  ev("paintSheetSmart('ric')");
  ok(w.document.getElementById("sheetSmart").style.display === "none", "A: smart block hides during search, as before");
  w.close();

  /* ---- Scenario B: balanced morning -> no gap, legacy behavior ---- */
  w = boot(); await sleep(350);
  const ev2 = x => w.eval(x);
  seed(ev2, [E("Test Balanced", 1408, 63, 201.5, 39)]); /* exactly half of every target */
  ok(ev2("macroGap()") === null, "B: balanced morning -> macroGap null");
  ev2("sheetMeal = 'lunch'; paintSheetSmart('')");
  const smart2 = w.document.getElementById("sheetSmart").innerHTML;
  ok(!smart2.includes("remaining carbs") && !smart2.includes("remaining protein") && !smart2.includes("remaining fat"), "B: no gap reason text anywhere");
  ok(!/g carbs</.test(smart2) && !/g fat</.test(smart2), "B: gap rows (if any) stay on the protein fallback");
  w.close();

  console.log(`smart_gotos: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ERR", e); process.exit(1); });
