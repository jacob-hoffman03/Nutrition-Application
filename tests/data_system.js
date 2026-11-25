/* Data system (2026.11.25-c): nothing assumed, everything from your inputs.
   1. Blank start: no calorie goal, macros, water, fiber, potassium or nutrient
      targets until sex, age, height, weight AND activity are all entered —
      no silent "Moderate", no assumed 150 lb, no assumed sex.
   2. Exact Mifflin-St Jeor x activity once complete.
   3. The goal weight is the 7-day average of weigh-ins; a weigh-in
      recalculates the goal immediately (no hidden auto switch).
   4. Age counts up from the date it was entered.
   5. Nutrient targets are the RDA/AI for your sex and age; sat fat and added
      sugars scale to your goal; your own target still wins.
   6. Deleting the last weigh-in blanks the goal; Calculate says what's missing. */
const { JSDOM } = require("jsdom");
const html = require("./_harness").appHtml();

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ FAIL: " + n); } };
const tick = (ms = 120) => new Promise(r => setTimeout(r, ms));

function boot() {
  const errors = [];
  const dom = new JSDOM(html, {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.addEventListener("error", e => errors.push(String(e.message)));
      w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
      w.confirm = () => true; w.alert = () => {};
    }
  });
  return { w: dom.window, errors };
}
const mifflinM = (lb, inch, age, pal) => Math.round((10 * (lb / 2.20462) + 6.25 * (inch * 2.54) - 5 * age + 5) * pal);

(async () => {
  console.log("1. Blank start — nothing assumed");
  let { w, errors } = boot(); await tick();
  let ev = x => w.eval(x);
  ok(ev("goalTotal()") === 0, "no calorie goal on a fresh app");
  ok(ev("S.goals.protein") === 0 && ev("S.goals.carbs") === 0 && ev("S.goals.fat") === 0, "no macros");
  ok(ev("formulaGoal()") === null, "formula returns nothing");
  ok(ev("potassiumTarget()") === 0, "no potassium target (sex not assumed)");
  ok(ev("fiberTarget()") === 0, "no fiber target");
  ok(ev("waterCalc().unset") === true, "no water target");
  ok(ev("dayNutrients(todayStr()).every(r => r.target == null)"), "no nutrient targets at all");
  ok(ev("document.getElementById('valPg').textContent") === "–", "diary shows – for an unset protein target");
  ok(ev("JSON.stringify(profileMissing())") === '["sex","age","height","weight","activity"]', "all five profile fields reported missing");

  console.log("   …profile complete except activity");
  ev(`S.goals.profile = Object.assign(S.goals.profile, {sex:"male", age:24, ageAsOf:todayStr(), heightIn:70, weightLb:165, activityKey:""}); commitGoals("t");`);
  ok(ev("goalTotal()") === 0, "still blank without activity (no silent Moderate)");
  ok(ev("JSON.stringify(profileMissing())") === '["activity"]', "activity is the one thing missing");
  ev("showView('goals'); document.getElementById('goalsDone').click()");
  ok(ev("curView") === "goals", "Calculate & Save stays on the page when incomplete");
  ok(/activity level/.test(ev("document.getElementById('toastMsg').textContent")), "and says what's still needed");

  console.log("2. Complete profile — exact formula");
  ev(`S.goals.profile.activityKey = "moderate"; commitGoals("t");`);
  const m0 = mifflinM(165, 70, 24, 1.465);
  ok(ev("S.goals.maintenance") === m0, "maintenance = Mifflin x 1.465 = " + m0 + ", got " + ev("S.goals.maintenance"));
  ok(ev("S.goals.protein") === Math.round(165 / 2.20462 * 2.2), "protein 2.2 g/kg of 165 lb");
  ok(ev("JSON.stringify(targetRateBand())") === "[-0.15,0.15]", "no surplus = maintenance band, not exactly 0%/wk");

  console.log("3. Weigh-ins: 7-day average, immediate recalculation");
  ev(`S.weights = [{d:addDays(todayStr(),-30), w:150}, {d:addDays(todayStr(),-6), w:164}, {d:addDays(todayStr(),-4), w:166}, {d:addDays(todayStr(),-2), w:165}];
      syncWeightFromLog(165, addDays(todayStr(),-2));`);
  ok(Math.abs(ev("goalWeight().lb") - 165) < 0.01 && ev("goalWeight().n") === 3, "goal weight = average of the 3 weigh-ins in the last 7 days (old one ignored)");
  ok(ev("S.goals.maintenance") === mifflinM(165, 70, 24, 1.465), "maintenance uses that average");
  const before = ev("goalTotal()");
  ev(`S.weights.push({d:todayStr(), w:173}); syncWeightFromLog(173, todayStr());`);
  const avg = (164 + 166 + 165 + 173) / 4;
  ok(ev("goalTotal()") !== before, "a new weigh-in changes the goal right away (no hidden auto switch)");
  ok(ev("S.goals.maintenance") === mifflinM(avg, 70, 24, 1.465), "uses the new 7-day average " + avg);
  ok(Math.abs(ev("goalTotal()") - before) < Math.abs(mifflinM(173, 70, 24, 1.465) - before), "a +8 lb single reading moves it far less than using that reading alone would");
  ok(ev("S.goals.protein") === Math.round(avg / 2.20462 * 2.2), "protein follows the same average weight");

  console.log("4. Age counts up from when it was entered");
  ev(`S.goals.profile.age = 24; S.goals.profile.ageAsOf = addDays(todayStr(), -800); commitGoals("t");`);
  ok(ev("effAge()") === 26, "entered 24 about 2.2 years ago -> 26 now");
  ok(ev("formulaGoal().age") === 26, "the formula uses 26");
  ev("renderGoals()");
  ok(ev("document.getElementById('pfAge').value") === "26", "the form shows 26");
  ev("readProfile()");
  ok(ev("S.goals.profile.age") === 24 && ev("S.goals.profile.ageAsOf") === ev("addDays(todayStr(), -800)"), "saving the unchanged age keeps the original entry date");
  ev("document.getElementById('pfAge').value = '30'; readProfile()");
  ok(ev("S.goals.profile.age") === 30 && ev("S.goals.profile.ageAsOf") === ev("todayStr()"), "typing a new age restarts the count from today");

  console.log("5. Nutrient targets from your profile and goal");
  ev(`S.goals.profile.age = 24; S.goals.profile.ageAsOf = todayStr(); commitGoals("t");`);
  const row = n => JSON.parse(ev(`JSON.stringify(dayNutrients(todayStr()).find(r => r.disp === ${JSON.stringify(n)}) || null)`));
  ok(row("Iron").target === 8 && row("Iron").src === "profile", "male 24: iron 8 mg (RDA)");
  ok(row("Magnesium").target === 400, "male 24: magnesium 400 mg");
  ok(row("Thiamin").target === 1.2 && row("Niacin").target === 16, "male: thiamin 1.2 mg, niacin 16 mg (newly personalized)");
  ok(row("Saturated Fat").target === Math.round(ev("goalTotal()") * 0.10 / 9), "saturated fat limit = 10% of this goal");
  ok(row("Added Sugars").target === Math.round(ev("goalTotal()") * 0.10 / 4), "added sugars limit = 10% of this goal");
  ok(row("Fiber").target === Math.round(14 * ev("goalTotal()") / 1000), "fiber 14 g per 1,000 kcal of goal");
  ok(row("Potassium").target === 3400, "potassium 3,400 mg (male AI)");
  ev(`S.goals.profile.sex = "female"; S.goals.profile.age = 55; commitGoals("t");`);
  ok(row("Iron").target === 8 && row("Vitamin B6").target === 1.5 && row("Calcium").target === 1200 && row("Chromium").target === 20, "female 55: iron 8, B6 1.5, calcium 1,200, chromium 20");
  ok(row("Potassium").target === 2600, "female: potassium 2,600 mg");
  ev(`S.goals.nutrTargets = {Iron:{val:12, unit:"mg"}};`);
  ok(row("Iron").target === 12 && row("Iron").custom === true, "your own target still wins");
  ev(`S.goals.nutrTargets = {};`);

  console.log("6. Clearing data blanks the goal");
  ev(`S.goals.profile.sex = "male"; S.goals.profile.age = 24; S.weights = [{d:todayStr(), w:170}]; syncWeightFromLog(170, todayStr()); showView("progress");`);
  ok(ev("goalTotal()") > 0, "goal present with one weigh-in");
  ev(`document.querySelector("#weightHist .wdel:not(.wpdel)").click()`);
  ok(ev("goalTotal()") === 0, "deleting the last weigh-in blanks the goal (no ghost weight)");
  ok(ev("profileMissing().indexOf('weight')") >= 0, "and weight is reported missing");

  ok(errors.length === 0, "no runtime errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
