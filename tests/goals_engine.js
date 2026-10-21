/* Goals engine regression tests — FORMULA LAW (2026.10.21-b, Jay's redesign).
   The law these tests pin:
   1. Maintenance = Mifflin-St Jeor BMR x activity multiplier, from the CURRENT
      profile (sex, age, height, weight, activity) — nothing else. commitGoals
      is the only writer; provenance src === "formula".
   2. The food log NEVER moves the goal: a learned/adaptive value sitting in
      state (or a full applyAdaptive pass) leaves maintenance at the formula.
   3. The goal moves when a profile input moves: activity chip, math-table
      row, and above all WEIGHT (up when weight goes up, down when it drops).
   4. No stats (or no sex) -> NO number: maintenance 0, src=nodata, card dash.
   5. Surplus laws unchanged: preset modes glue surplus to their % of
      maintenance; gain-rate chips set surplus = rate x 500 without touching
      maintenance; macro split steppers override by % and reset cleanly.
   6. The Calorie Goal page shows the math: equation line + a table row per
      activity tier, the current tier marked "yours". */
const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ FAIL: " + name); } };

function boot() {
  const errors = [];
  const dom = new JSDOM(html, {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.__errs = errors;
      w.addEventListener("error", e => errors.push(String(e.message)));
      const store = { "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) };
      w.localStorage.setItem("fuel.flags.v1", store["fuel.flags.v1"]);
    }
  });
  return { w: dom.window, errors };
}
const tick = () => new Promise(r => setTimeout(r, 80));
const ev = (w, x) => w.eval(x);

/* 23M, 5'10", 130 lb, moderate. BMR = 10*58.97 + 6.25*177.8 - 115 + 5 = 1,590.9 */
const PROFILE = `({sex:"male",age:23,heightIn:70,weightLb:130,bodyFat:0,activityKey:"moderate",auto:false,units:"lb",updatedAt:"2026-10-01"})`;

async function scenarioFormula() {
  console.log("Scenario 1: formula derivation (profile -> maintenance)");
  const { w, errors } = boot(); await tick();
  ev(w, `
    S.goals.profile = ${PROFILE};
    S.goals.mode = "bulk"; S.goals.surplusMode = "pct"; S.goals.macroAuto = true;
    commitGoals("test");
  `);
  ok(ev(w, "S.goals.maintenance") === 2331, "maintenance = round(1590.9 x 1.465) = 2,331, got " + ev(w, "S.goals.maintenance"));
  ok(ev(w, "S.goals.derived.src") === "formula", "provenance src=formula");
  ok(ev(w, "S.goals.formula.bmr") === 1591, "BMR stamped 1,591");
  ok(ev(w, "S.goals.surplus") === 350, "bulk surplus glued at 15% = 350, got " + ev(w, "S.goals.surplus"));
  const macroSum = ev(w, "S.goals.carbs*4 + S.goals.protein*4 + S.goals.fat*9");
  ok(Math.abs(macroSum - 2681) <= 12, "macros sum to the 2,681 goal (±12), got " + macroSum);
  ok(errors.length === 0, "no page errors: " + errors.join("; "));
}

async function scenarioInputsMoveIt() {
  console.log("Scenario 2: profile inputs move the goal — activity chip, table row, weight");
  const { w } = boot(); await tick();
  ev(w, `
    S.goals.profile = ${PROFILE};
    S.goals.mode = "bulk"; S.goals.surplusMode = "pct"; S.goals.macroAuto = true;
    commitGoals("test"); renderGoals();
  `);
  const chip = w.document.querySelector('#pfAct .chip[data-k="very"]');
  ok(!!chip, "very-active chip exists");
  chip.click(); await tick();
  ok(ev(w, "S.goals.maintenance") === 2744, "chip tap -> maintenance = round(1590.9 x 1.725) = 2,744, got " + ev(w, "S.goals.maintenance"));
  ok(ev(w, "S.goals.surplus") === 412, "surplus re-glued at 15% = 412, got " + ev(w, "S.goals.surplus"));
  const row = w.document.querySelector('#formulaTable button[data-k="sedentary"]');
  ok(!!row, "math-table sedentary row exists");
  row.click(); await tick();
  ok(ev(w, "S.goals.maintenance") === 1909, "table row tap -> maintenance = round(1590.9 x 1.2) = 1,909, got " + ev(w, "S.goals.maintenance"));
  ok(ev(w, "S.goals.profile.activityKey") === "sedentary", "table row set the profile activity");
  ev(w, `S.goals.profile.activityKey = "very"; S.goals.profile.weightLb = 140; commitGoals("test");`);
  ok(ev(w, "S.goals.maintenance") === 2823, "weight 130 -> 140 lb moves goal: round(1636.3 x 1.725) = 2,823, got " + ev(w, "S.goals.maintenance"));
  ev(w, `S.goals.profile.weightLb = 120; commitGoals("test");`);
  ok(ev(w, "S.goals.maintenance") === 2666, "weight loss moves it down: round(1545.6 x 1.725) = 2,666, got " + ev(w, "S.goals.maintenance"));
}

async function scenarioLogNeverMovesIt() {
  console.log("Scenario 3: the food log / learned value NEVER moves the goal");
  const { w } = boot(); await tick();
  ev(w, `
    S.goals.profile = {sex:"male",age:23,heightIn:70,weightLb:126.2,bodyFat:0,activityKey:"very",auto:true,units:"lb",updatedAt:"2026-10-01"};
    S.goals.mode = "bulk"; S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; S.goals.macroAuto = true;
    commitGoals("test");
  `);
  ok(ev(w, "S.goals.maintenance") === 2715, "Jay's case: maintenance 2,715 (BMR 1,574 x 1.725), got " + ev(w, "S.goals.maintenance"));
  ok(ev(w, "goalTotal()") === 3465, "goal total 3,465 with +750 surplus, got " + ev(w, "goalTotal()"));
  ev(w, `
    S.goals.adaptive = {ok:true, stale:false, value:1816, learned:1816, avg:2600, rateWk:1.1, days:15, span:20, partial:0, updated:"2026-10-21", algo:"v5-shift"};
    commitGoals("adaptive");
  `);
  ok(ev(w, "S.goals.maintenance") === 2715, "a learned value of 1,816 in state is ignored — still 2,715");
  ev(w, `applyAdaptive();`);
  ok(ev(w, "S.goals.maintenance") === 2715, "applyAdaptive() cannot move it either — still 2,715, got " + ev(w, "S.goals.maintenance"));
  ok(ev(w, "S.goals.derived.src") === "formula", "src stays formula after adaptive pass");
}

async function scenarioNoData() {
  console.log("Scenario 4: no stats -> no number");
  const { w } = boot(); await tick();
  ev(w, `S.goals.profile = {sex:"",age:0,heightIn:0,weightLb:0,bodyFat:0,activityKey:"",auto:false,units:"lb",updatedAt:""}; commitGoals("test"); renderGoals();`);
  ok(ev(w, "S.goals.maintenance") === 0, "maintenance 0 with empty profile");
  ok(ev(w, "S.goals.derived.src") === "nodata", "src=nodata");
  ok(w.document.getElementById("goalTotal").textContent === "—", "card shows a dash, not a guess");
  ev(w, `S.goals.profile = {sex:"",age:23,heightIn:70,weightLb:130,bodyFat:0,activityKey:"very",auto:false,units:"lb",updatedAt:""}; commitGoals("test");`);
  ok(ev(w, "S.goals.maintenance") === 0, "no sex -> still no number (Mifflin needs it)");
}

async function scenarioRateAndSplit() {
  console.log("Scenario 5: gain-rate chips + macro split steppers (unchanged laws)");
  const { w } = boot(); await tick();
  ev(w, `
    S.goals.profile = {sex:"male",age:23,heightIn:70,weightLb:126.2,bodyFat:0,activityKey:"very",auto:false,units:"lb",updatedAt:"2026-10-01"};
    S.goals.mode = "bulk"; S.goals.surplusMode = "pct"; S.goals.macroAuto = true;
    commitGoals("test"); renderGoals();
  `);
  const chip = w.document.querySelector('#goalMode .chip[data-r="1"]');
  ok(!!chip, "+1.0 lb/wk chip exists");
  chip.click(); await tick();
  ok(ev(w, "S.goals.surplus") === 500, "rate chip sets surplus = 1.0 x 500 = 500, got " + ev(w, "S.goals.surplus"));
  ok(ev(w, "S.goals.maintenance") === 2715, "maintenance untouched by rate chip");
  const before = ev(w, "S.goals.protein");
  const btn = w.document.querySelector('#splitCtl .sbtn[data-sp="p"][data-d="1"]');
  btn.click(); await tick();
  ok(ev(w, "S.goals.protein") > before, "split stepper raises protein above the auto value");
  const sum = ev(w, "S.goals.carbs*4 + S.goals.protein*4 + S.goals.fat*9");
  ok(Math.abs(sum - ev(w, "goalTotal()")) <= 12, "macros still sum to the goal after split override");
  w.document.getElementById("splitReset").click(); await tick();
  ok(ev(w, "S.goals.splitPct") === null, "split reset clears the override");
}

async function scenarioTable() {
  console.log("Scenario 6: the math table on the Calorie Goal page");
  const { w } = boot(); await tick();
  ev(w, `
    S.goals.profile = {sex:"male",age:23,heightIn:70,weightLb:126.2,bodyFat:0,activityKey:"very",auto:false,units:"lb",updatedAt:"2026-10-01"};
    commitGoals("test"); renderGoals();
  `);
  const eq = w.document.getElementById("formulaEq").textContent;
  ok(/Mifflin-St Jeor/.test(eq) && /1,574/.test(eq), "equation line shows Mifflin + BMR 1,574: " + eq);
  const rows = w.document.querySelectorAll("#formulaTable button");
  ok(rows.length === 6, "six activity rows, got " + rows.length);
  const very = w.document.querySelector('#formulaTable button[data-k="very"]');
  ok(/2,715/.test(very.textContent) && /yours/.test(very.textContent), "Very Active row = 2,715 and marked yours");
  const sed = w.document.querySelector('#formulaTable button[data-k="sedentary"]');
  ok(/1,888/.test(sed.textContent), "Sedentary row = 1,888 (BMR x 1.2)");
  ok(w.document.querySelector("#view-goals h1").textContent.includes("Calorie Goal"), "page is titled Calorie Goal");
  const src = w.document.getElementById("goalSrc").textContent;
  ok(/BMR 1,574/.test(src) && /1.725/.test(src), "goal line is one short formula line: " + src);
  ok(!w.document.getElementById("microRow"), "cleanup: no micronutrient section on this page");
  ok(!w.document.getElementById("pfNote"), "cleanup: no duplicate stats note");
  ok(!w.document.querySelector(".goalbig #formulaTable"), "cleanup: math table is its own card, not inside the goal card");
  ev(w, 'S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; commitGoals("t"); renderGoals();');
  ok(w.document.getElementById("gainProj").textContent === "\u2248 +1.50 lb/week at this surplus", "gain projection is one short line: " + w.document.getElementById("gainProj").textContent);
}

(async () => {
  await scenarioFormula();
  await scenarioInputsMoveIt();
  await scenarioLogNeverMovesIt();
  await scenarioNoData();
  await scenarioRateAndSplit();
  await scenarioTable();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
