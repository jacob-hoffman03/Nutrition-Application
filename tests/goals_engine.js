/* Goals engine regression tests (2026.10.13-b):
   1. Split-brain scenario — adaptive ON, tapping an activity chip must NOT move
      maintenance/surplus/macros (the Oct 13 bug: hero 3,503 vs macros 2,159).
   2. Calculate maintenance = the one explicit switch back to formula, with
      surplus + macros re-derived in the same commit.
   3. Coverage gates + HOLD — thin data freezes the learned value (stale flag),
      maintenance untouched.
   4. Full data — learned value applies through commitGoals, capped ±150,
      surplus glued to mode %, macros sum to the goal.
   5. Formula mode — activity chip re-derives maintenance AND macros together.
   6. Gain-rate chips set surplus = rate x 500 without touching maintenance;
      macro split steppers override the derivation by % and reset cleanly. */
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
      /* flags the blank-slate guard needs, else goals get wiped on first boot */
      const store = { "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) };
      w.localStorage.setItem("fuel.flags.v1", store["fuel.flags.v1"]);
    }
  });
  return { w: dom.window, errors };
}
const tick = () => new Promise(r => setTimeout(r, 80));

const PROFILE = `({sex:"male",age:23,heightIn:70,weightLb:130,bodyFat:0,activityKey:"very",auto:false,units:"lb",updatedAt:"2026-10-01"})`;

async function scenarioB() {
  console.log("Scenario B: split-brain regression (adaptive on, tap activity chip)");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = true;
    S.goals.adaptive = {ok:true, stale:false, value:1877, learned:1877, avg:2133, rateWk:0.51, days:11, span:14, partial:3, updated:"2026-10-13", algo:"v3-21d"};
    S.goals.maintenance = 1877; S.goals.surplus = 282; S.goals.mode = "bulk";
    S.goals.protein = 127; S.goals.carbs = 278; S.goals.fat = 60; S.goals.macroAuto = true;
    save(); renderGoals();
  `);
  const chip = w.document.querySelector('#pfAct .chip[data-k="sedentary"]');
  ok(!!chip, "sedentary chip exists");
  chip.click(); await tick();
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.maintenance === 1877, "maintenance still learned 1877 after chip tap (got " + g.maintenance + ")");
  ok(g.surplus === 282, "surplus still 282 (got " + g.surplus + ")");
  const msumB = g.protein * 4 + g.carbs * 4 + g.fat * 9;
  ok(Math.abs(msumB - 2159) <= 12, "macros still sum to the SAME goal 2159 (" + msumB + ")");
  ok(g.useAdaptive === true, "adaptive still on");
  ok(g.derived && g.derived.src === "learned", "provenance stamped src=learned");
  ok(g.profile.activityKey === "sedentary", "chip still recorded as formula prior input");

  console.log("Scenario B2: Calculate & Save with no qualifying log data -> formula");
  w.eval(`
    S.goals.adaptive = null; S.days = {}; S.weights = [];
    S.goals.maintenance = 0; S.goals.surplus = 0; save(); renderGoals();
  `);
  w.document.getElementById("goalsDone").click(); await tick();
  const g2 = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  const fmaint = w.eval(`calcMaintenance().maint`);
  ok(g2.useAdaptive === false, "source stays formula (no learned data)");
  ok(g2.maintenance === fmaint, "maintenance = formula (" + fmaint + ", got " + g2.maintenance + ")");
  ok(g2.surplus === Math.round(g2.maintenance * 0.15), "surplus = +15% of maintenance (" + g2.surplus + ")");
  const tot = g2.maintenance + g2.surplus;
  const msum = g2.protein * 4 + g2.carbs * 4 + g2.fat * 9;
  ok(Math.abs(msum - tot) <= 12, "macros sum to the goal (" + msum + " vs " + tot + ")");
  ok(g2.derived && g2.derived.src === "formula", "provenance stamped src=formula");
  ok(errors.length === 0, "no runtime errors (" + errors.join("; ") + ")");
  w.close();
}

async function scenarioC() {
  console.log("Scenario C: coverage gates + HOLD on thin data");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = true;
    S.goals.adaptive = {ok:true, stale:false, value:2500, learned:2500, avg:2600, rateWk:0.1, days:12, span:18, partial:0, updated:"2026-10-10", algo:"v3-21d"};
    S.goals.maintenance = 2500; S.goals.surplus = 375; S.goals.mode = "bulk"; S.goals.macroAuto = true;
    /* only 5 complete days in the 21-day window */
    S.days = {}; S.weights = [];
    for (let i = 1; i <= 5; i++) { const ds = addDays(todayStr(), -i); S.days[ds] = {meals:{breakfast:[{n:"t", cal:2600, p:150, c:300, f:80}]}}; }
    for (let i = 20; i >= 1; i -= 5) { S.weights.push({d: addDays(todayStr(), -i), w: 130}); }
    save();
  `);
  const r = JSON.parse(w.eval(`JSON.stringify(adaptiveCalc())`));
  ok(r.ok === false && r.days === 5, "estimator refuses: 5 complete days < 10 (got ok=" + r.ok + ", days=" + r.days + ")");
  w.eval(`applyAdaptive()`);
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.adaptive.stale === true, "stale flag set (HOLD)");
  ok(g.maintenance === 2500, "maintenance held at last good 2500 (got " + g.maintenance + ")");
  ok(g.surplus === 375, "surplus held at 375");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}

async function scenarioD() {
  console.log("Scenario D: full data — learned applies, capped, glued, consistent");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = true;
    S.goals.adaptive = {ok:true, stale:false, value:2500, learned:2500, avg:2600, rateWk:0.1, days:12, span:18, partial:0, updated:"2026-10-10", algo:"v3-21d"};
    S.goals.maintenance = 2500; S.goals.surplus = 375; S.goals.mode = "bulk"; S.goals.macroAuto = true;
    /* 15 complete days @ 2200 kcal, weight flat 130 → learned = 2200, applied in full (no cap since -c) */
    S.days = {}; S.weights = [];
    for (let i = 1; i <= 15; i++) { const ds = addDays(todayStr(), -i); S.days[ds] = {meals:{breakfast:[{n:"t", cal:2200, p:150, c:250, f:65}]}}; }
    for (let i = 20; i >= 1; i -= 2) { S.weights.push({d: addDays(todayStr(), -i), w: 130}); }
    save();
  `);
  w.eval(`applyAdaptive()`);
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.adaptive.ok === true && g.adaptive.days === 15, "estimator ok with 15 days");
  ok(g.adaptive.learned === 2200, "learned = 2200 from flat weight @ 2200 intake (got " + g.adaptive.learned + ")");
  ok(g.adaptive.value === 2200, "applied = learned in full, no cap (got " + g.adaptive.value + ")");
  ok(g.maintenance === 2200, "maintenance = applied learned value");
  ok(g.surplus === Math.round(2200 * 0.15), "surplus glued to +15% (" + g.surplus + ")");
  const tot = g.maintenance + g.surplus, msum = g.protein * 4 + g.carbs * 4 + g.fat * 9;
  ok(Math.abs(msum - tot) <= 12, "macros sum to goal (" + msum + " vs " + tot + ")");
  ok(g.derived && g.derived.src === "learned" && g.derived.maint === 2200, "provenance stamped with applied value");
  ok(g.adaptive.algo === "v3-21d" && typeof g.adaptive.logged === "number", "estimate record carries algo + coverage");
  const av = w.eval(`(function(){ paintAdaptive(); return document.getElementById("goalSrc").textContent; })()`);
  ok(/2,200/.test(av), "Goal card source line shows the APPLIED value (" + av + ")");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}

async function scenarioE() {
  console.log("Scenario E: formula mode — chip re-derives everything together");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = false;
    S.goals.maintenance = 2000; S.goals.surplus = 0; S.goals.mode = "bulk";
    S.goals.protein = 10; S.goals.carbs = 10; S.goals.fat = 10; S.goals.macroAuto = true;
    save(); renderGoals();
  `);
  w.document.querySelector('#pfAct .chip[data-k="extra"]').click(); await tick();
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  const fmaint = w.eval(`calcMaintenance().maint`);
  ok(g.maintenance === fmaint && fmaint > 3000, "maintenance = formula(extra) " + fmaint + " (got " + g.maintenance + ")");
  ok(g.surplus === Math.round(g.maintenance * 0.15), "surplus glued (" + g.surplus + ")");
  ok(g.protein > 100, "macros re-derived in the same commit (protein " + g.protein + ")");
  const tot = g.maintenance + g.surplus, msum = g.protein * 4 + g.carbs * 4 + g.fat * 9;
  ok(Math.abs(msum - tot) <= 12, "macros sum to goal (" + msum + " vs " + tot + ")");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}


async function scenarioF() {
  console.log("Scenario F: one button picks the source — learned when the log supports it");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = false;
    S.goals.adaptive = {ok:true, stale:false, value:2319, learned:2319, avg:2219, rateWk:-0.2, days:14, span:19, partial:4, logged:18, updated:"2026-10-13", algo:"v3-21d"};
    S.goals.maintenance = 3050; S.goals.surplus = 458; S.goals.mode = "bulk"; S.goals.macroAuto = true;
    S.days = {}; S.weights = [];
    save(); renderGoals();
  `);
  w.document.getElementById("goalsDone").click(); await tick();
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.useAdaptive === true && g.maintenance === 2319, "button applies learned 2319 automatically (got " + g.maintenance + ")");
  ok(g.surplus === Math.round(2319 * 0.15), "surplus glued (" + g.surplus + ")");
  ok(g.derived && g.derived.src === "learned", "provenance src=learned");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}

async function scenarioG() {
  console.log("Scenario G: autopilot upgrades formula -> learned on its own (better over time)");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = false;
    S.goals.adaptive = null;
    S.goals.maintenance = 3050; S.goals.surplus = 458; S.goals.mode = "bulk"; S.goals.macroAuto = true;
    S.days = {}; S.weights = [];
    for (let i = 1; i <= 15; i++) { const ds = addDays(todayStr(), -i); S.days[ds] = {meals:{breakfast:[{n:"t", cal:2200, p:150, c:250, f:65}]}}; }
    for (let i = 20; i >= 1; i -= 2) { S.weights.push({d: addDays(todayStr(), -i), w: 130}); }
    S.auto = S.auto || {}; S.auto.lastRun = "2000-01-01";
    save();
  `);
  w.eval(`autoPilot()`);
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.useAdaptive === true, "autopilot switched source to learned");
  ok(g.maintenance === 2200, "maintenance = learned 2200 (got " + g.maintenance + ")");
  ok(g.surplus === Math.round(2200 * 0.15), "surplus glued (" + g.surplus + ")");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}

async function scenarioH() {
  console.log("Scenario H: gain-rate chips + macro split steppers (2026.10.14-f)");
  const { w, errors } = boot(); await tick();
  w.eval(`
    S.goals.profile = ${PROFILE};
    S.goals.useAdaptive = false;
    S.goals.mode = "bulk"; S.goals.surplusMode = null; S.goals.splitPct = null; S.goals.gainRate = null;
    commitGoals("test");
    renderGoals();
  `);
  await tick();
  const maint = w.eval(`S.goals.maintenance`);
  ok(maint > 0, "formula maintenance established (" + maint + ")");
  w.document.querySelector('#goalMode .chip[data-r="1.5"]').click(); await tick();
  let g = w.eval(`S.goals`);
  ok(g.surplus === 750, "rate 1.5 -> surplus 750 (got " + g.surplus + ")");
  ok(g.maintenance === maint, "maintenance untouched by rate tap (got " + g.maintenance + ")");
  ok(g.mode === "bulk", "mode label follows rate (bulk)");
  const tot = w.eval(`goalTotal()`);
  ok(tot === maint + 750, "goal = maintenance + 750 (got " + tot + ")");
  const p0 = g.protein;
  const pPct0 = Math.round(p0 * 4 / tot * 100);
  const btn = w.document.querySelector('#splitCtl .sbtn[data-sp="p"][data-d="1"]');
  ok(!!btn, "protein stepper exists");
  btn.click(); await tick(); btn.click(); await tick(); btn.click(); await tick();
  g = w.eval(`S.goals`);
  ok(g.splitPct && g.splitPct.p === pPct0 + 3, "splitPct protein +3 (got " + JSON.stringify(g.splitPct) + ")");
  ok(g.protein === Math.round(tot * g.splitPct.p / 100 / 4), "protein grams follow split % (got " + g.protein + ")");
  w.document.getElementById("splitReset").click(); await tick();
  g = w.eval(`S.goals`);
  ok(g.splitPct === null, "reset clears splitPct");
  ok(g.protein === p0, "protein back to recommended derivation (got " + g.protein + " vs " + p0 + ")");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}

(async () => {
  await scenarioB(); await scenarioC(); await scenarioD(); await scenarioE(); await scenarioF(); await scenarioG(); await scenarioH();
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
