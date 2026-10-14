/* Foods page (2026.10.13-h): supplements section, macro sorts, most-logged,
   favorites filter, location search + the add sheet's Supplements tab. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

let passed = 0, failed = 0;
const ok = (cond, msg) => { if (cond) { passed++; console.log("  ✓ " + msg); } else { failed++; console.log("  ✗ FAIL: " + msg); } };
const tick = (ms = 70) => new Promise(r => setTimeout(r, ms));

function boot() {
  const errors = [];
  const dom = new JSDOM(html, {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.addEventListener("error", e => errors.push(String(e.message)));
      w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
    }
  });
  return { w: dom.window, errors };
}

const SEED = `
  S.customFoods = [
    {n:"Greek Yogurt", s:"1 cup", cal:150, p:17, c:9, f:0, kind:"food"},
    {n:"Pasta Bake", s:"1 plate", cal:800, p:30, c:110, f:20, kind:"food"},
    {n:"Chicken Bowl", s:"1 bowl", cal:600, p:50, c:60, f:15, kind:"food", loc:"Chipotle"},
    {n:"Zinc Test 50", s:"1 capsule", cal:0, p:0, c:0, f:0, kind:"supp"},
    {n:"Creatine Test", s:"1 scoop", cal:10, p:0, c:0, f:0, kind:"supp"}
  ];
  S.favorites = ["Greek Yogurt"];
  S.days = {}; S.weights = [];
  const d1 = addDays(todayStr(), -1), d2 = addDays(todayStr(), -2);
  S.days[d1] = {meals:{lunch:[{n:"Chicken Bowl", cal:600, p:50, c:60, f:15}, {n:"Chicken Bowl", cal:600, p:50, c:60, f:15}]}};
  S.days[d2] = {meals:{lunch:[{n:"Chicken Bowl", cal:600, p:50, c:60, f:15}], dinner:[{n:"Pasta Bake", cal:800, p:30, c:110, f:20}]}};
  save();
`;

(async () => {
  console.log("Foods page: sections");
  const { w, errors } = boot(); await tick();
  w.eval(SEED + ` showView("foods"); renderFoods();`);
  const names = sel => [...w.document.querySelectorAll(sel + " .arow2")].map(r => r.dataset.n);
  let supps = names("#suppResults"), foods = names("#foodResults");
  ok(supps.length === 2 && supps.includes("Zinc Test 50") && supps.includes("Creatine Test"), "supplements card holds only supps (" + supps.join(", ") + ")");
  ok(foods.length === 3 && !foods.some(n => n.includes("Test")), "foods card holds only foods (" + foods.join(", ") + ")");
  ok(w.document.getElementById("suppCard").style.display !== "none", "supplements card visible");

  console.log("Foods page: sorts");
  const chip = s => [...w.document.querySelectorAll("#foodSortChips .chip")].find(c => c.dataset.s === s);
  chip("p").click(); await tick(30);
  ok(JSON.stringify(names("#foodResults")) === JSON.stringify(["Chicken Bowl", "Pasta Bake", "Greek Yogurt"]), "protein sort desc (" + names("#foodResults").join(" > ") + ")");
  chip("c").click(); await tick(30);
  ok(JSON.stringify(names("#foodResults")) === JSON.stringify(["Pasta Bake", "Chicken Bowl", "Greek Yogurt"]), "carbs sort desc");
  chip("freq").click(); await tick(30);
  ok(names("#foodResults")[0] === "Chicken Bowl", "most-logged puts 3x-logged food first");
  chip("dens").click(); await tick(30);
  ok(names("#foodResults")[0] === "Greek Yogurt", "protein/kcal puts densest protein first");

  console.log("Foods page: search + favorites filter");
  const search = w.document.getElementById("foodSearch");
  search.value = "chipotle"; search.dispatchEvent(new w.Event("input", { bubbles: true })); await tick(30);
  ok(JSON.stringify(names("#foodResults")) === JSON.stringify(["Chicken Bowl"]), "search matches location");
  ok(w.document.getElementById("suppCard").style.display === "none", "supplements card hides when no supps match");
  search.value = ""; search.dispatchEvent(new w.Event("input", { bubbles: true })); await tick(30);
  [...w.document.querySelectorAll("#foodSortChips .chip")].find(c => c.dataset.fav).click(); await tick(30);
  ok(JSON.stringify(names("#foodResults")) === JSON.stringify(["Greek Yogurt"]), "favorites filter shows only favorites");

  console.log("Add sheet: Supplements tab");
  w.eval(`openSheet("lunch")`); await tick();
  [...w.document.querySelectorAll("#sheetTabs .segtab")].find(t => t.dataset.t === "supps").click(); await tick();
  const rows = [...w.document.querySelectorAll("#sheetResults .arow2")].map(r => r.dataset.n);
  const kinds = w.eval(`(function(){ return ${JSON.stringify(rows)}.map(n => { const f = findFood(n); return f ? f.kind : "?"; }); })()`);
  ok(rows.length >= 2 && kinds.every(k => k === "supp"), "sheet supps tab lists only supplements (" + rows.length + " rows)");
  console.log("Add sheet: removed built-ins stay removed (2026.10.14-g)");
  const defName = w.eval(`FOODS[0].n`);
  [...w.document.querySelectorAll("#sheetTabs .segtab")].find(t => t.dataset.t === "custom").click(); await tick();
  let allRows = [...w.document.querySelectorAll("#sheetResults .arow2")].map(r => r.dataset.n);
  ok(allRows.includes(defName), "built-in shows in All before removal");
  w.eval(`S.deletedFoods = [${JSON.stringify(defName)}]; renderSheetResults("");`);
  await tick();
  allRows = [...w.document.querySelectorAll("#sheetResults .arow2")].map(r => r.dataset.n);
  ok(!allRows.includes(defName), "removed built-in gone from All");
  ok(w.eval(`findFood(${JSON.stringify(defName)})`) === null, "findFood no longer resolves the removed built-in");

  ok(errors.length === 0, "no runtime errors (" + errors.join("; ") + ")");
  w.close();
  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})();
