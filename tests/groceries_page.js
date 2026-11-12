/* Groceries page (2026.11.12-a): auto-categories from the foods themselves,
   one reusable weekly list (add merges quantities, check-off, clear/reset),
   and "Running low?" restock predictions from the last 14 days of logs —
   servings + days eaten, pack counts from the food's package size (ps). */
const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");

let pass = 0, fail = 0;
const ok = (c, name) => { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ FAIL: " + name); } };
const tick = (ms=40) => new Promise(r => setTimeout(r, ms));
const dstr = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
const ago = n => { const d = new Date(); d.setDate(d.getDate()-n); return dstr(d); };
const E = (n, qty) => ({ n, s:"1 serving", qty, cal:100, p:10, c:10, f:2 });

function boot(storage){
  const errors = [];
  const dom = new JSDOM(html, { url:"https://localhost/", runScripts:"dangerously", pretendToBeVisual:true,
    beforeParse(w){ w.__errs = errors; w.addEventListener("error", e=>errors.push(String(e.message)));
      w.fetch = () => Promise.reject(new Error("offline"));
      if(storage) for(const k in storage) w.localStorage.setItem(k, storage[k]); } });
  dom.window.__errs = errors;
  return dom.window;
}
const FLAGS = JSON.stringify({ zeroReset:1, calcNet:1, defPhotos:1, ggAbbr:1, crabFix:1, testPurge:1, mealSplit1:1, foodFresh1:1 });

function baseState(){
  const days = {};
  const put = (k, meal, entries) => { days[k] = days[k] || { meals:{breakfast:[],lunch:[],dinner:[],snacks:[],supplements:[]}, waterOz:0 }; days[k].meals[meal] = entries; };
  put(ago(0), "lunch", [E("Chicken Breast", 2)]);
  put(ago(2), "dinner", [E("Chicken Breast", 3)]);
  put(ago(5), "lunch", [E("Chicken Breast", 3)]);
  put(ago(9), "dinner", [E("Chicken Breast", 2)]);           // chicken: 10 servings, 4 days
  put(ago(20), "lunch", [E("Chicken Breast", 5)]);           // outside the 14-day window — must not count
  put(ago(1), "breakfast", [E("Large Eggs", 2)]);
  put(ago(3), "breakfast", [E("Large Eggs", 2)]);
  put(ago(6), "breakfast", [E("Large Eggs", 1)]);            // eggs: 5 servings, 3 days
  put(ago(4), "dinner", [E("Jasmine Rice", 1)]);             // rice: 1 serving — not suggested
  return {
    goals:{ maintenance:2715, surplus:750, protein:150, carbs:300, fat:90, water:0, waterV:1, weight:126, weightStart:120, mode:"bulk", nutrTargets:{},
      profile:{ units:"imp", sex:"m", age:23, heightIn:70, weightLb:126, bodyFat:0, waistIn:0, activityKey:"very", auto:true },
      muscleGoal:0, macroAuto:true, adaptive:null, adaptiveHist:[], useAdaptive:false, adTuneNote:"", profHash:"x" },
    days,
    customFoods:[
      { n:"Chicken Breast", s:"4 oz", cal:140, p:26, c:0, f:3, kind:"food", img:"data:image/png;base64,AAA", pr:10.00, ps:4 },
      { n:"Large Eggs", s:"1 egg", cal:70, p:6, c:0, f:5, kind:"food" },
      { n:"Jasmine Rice", s:"1 cup", cal:230, p:4, c:45, f:0, kind:"food" },
      { n:"Creatine Test", s:"1 scoop", cal:0, p:0, c:0, f:0, kind:"supp" }
    ],
    favorites:[], weights:[], pmWeights:[], recipes:[], groceries:[],
    profile:{ name:"Jay", img:"", theme:"#0056d6", photos:[] },
    bottles:[{ id:"b0", name:"Glass", oz:8 }], waterV2:1,
    training:{ sched:{}, done:{}, deloads:{} }, streaks:{ nicotine:{lastUse:"2026-10-05"}, alcohol:{lastUse:null} },
    mealTimes:{ breakfast:[], lunch:[], dinner:[], snacks:[] }
  };
}

(async () => {
  console.log("Groceries: fresh boot");
  {
    const w = boot({ "fuel.flags.v1": FLAGS });
    await tick();
    ok(Array.isArray(w.eval("S.groceries")) && w.eval("S.groceries.length") === 0, "fresh: groceries starts empty");
    w.eval("showView('groceries')"); await tick();
    ok(w.document.getElementById("view-groceries").classList.contains("active"), "fresh: view opens");
    ok(w.__errs.length === 0, "fresh: no errors (" + w.__errs.join(";") + ")");
    w.close();
  }

  console.log("Groceries: categories are automatic");
  {
    const w = boot({ "fuel.flags.v1": FLAGS, "fuel.v1": JSON.stringify(baseState()) });
    await tick();
    const ev = s => w.eval(s);
    ok(ev("grocCategory(findFood('Chicken Breast'))") === "Meat & Seafood", "chicken -> Meat & Seafood");
    ok(ev("grocCategory(findFood('Large Eggs'))") === "Dairy & Eggs", "eggs -> Dairy & Eggs");
    ok(ev("grocCategory(findFood('Jasmine Rice'))") === "Bakery & Grains", "rice -> Bakery & Grains");
    ok(ev("grocCategory(findFood('Creatine Test'))") === "Supplements", "supp kind -> Supplements");
    ok(ev("grocCategory('Paper Towels')") === "Household", "free-text paper towels -> Household");
    ok(ev("grocCategory('Peanut Butter Cups')") === "Pantry" || ev("grocCategory('Natural Peanut Butter'))") === "Pantry", "peanut butter -> Pantry (not Dairy)");
    w.close();
  }

  console.log("Groceries: predictions from logs");
  {
    const w = boot({ "fuel.flags.v1": FLAGS, "fuel.v1": JSON.stringify(baseState()) });
    await tick();
    const sugg = w.eval("grocSuggestions()");
    const names = sugg.map(s => s.n);
    ok(names.includes("Chicken Breast") && names.includes("Large Eggs"), "chicken + eggs suggested");
    ok(!names.includes("Jasmine Rice"), "rice (1 serving) not suggested");
    const ch = sugg.find(s => s.n === "Chicken Breast");
    ok(ch.serv === 10 && ch.days === 4, "chicken counts only the 14-day window (10 serv / 4 days), got " + JSON.stringify(ch));
    ok(w.eval("grocSuggestedQty('Chicken Breast', 5)") === 2, "pack suggestion: 5/wk over 4-serving packs -> 2 packs");
    w.eval("showView('groceries')"); await tick();
    const suggHtml = w.document.getElementById("grocSugg").innerHTML;
    ok(suggHtml.includes("10 servings on 4 days"), "suggestion shows its basis");
    ok(suggHtml.includes("≈2 packs"), "suggestion shows pack count");
    w.close();
  }

  console.log("Groceries: list mechanics");
  {
    const w = boot({ "fuel.flags.v1": FLAGS, "fuel.v1": JSON.stringify(baseState()) });
    await tick();
    const ev = s => w.eval(s);
    ev("addGroc('Chicken Breast', 1)"); ev("addGroc('Chicken Breast', 1)");
    ok(ev("S.groceries.length") === 1 && ev("S.groceries[0].qty") === 2, "adding twice merges quantity");
    ok(!ev("grocSuggestions()").some(s => s.n === "Chicken Breast"), "on-list food leaves suggestions");
    ev("showView('groceries')"); await tick();
    const listHtml = w.document.getElementById("grocList").innerHTML;
    ok(w.document.getElementById("grocList").textContent.includes("Meat & Seafood"), "list groups under auto category");
    ok(listHtml.includes("data:image/png"), "row shows the food photo");
    ok(listHtml.includes("140 kcal"), "row shows logged nutrition");
    ok(listHtml.includes("$20.00"), "row prices qty x pack price (2 x $10)");
    ev("S.groceries[0].done = true; save(); renderGroceries();"); await tick();
    ok(w.document.getElementById("grocSummary").textContent.includes("1 of 1 in the cart"), "summary counts checked");
    ok(w.document.getElementById("grocProg").style.width === "100%", "progress bar full");
    const saved = JSON.parse(w.localStorage.getItem("fuel.v1"));
    ok(saved.groceries && saved.groceries.length === 1 && saved.groceries[0].done === true, "list persists to storage");
    ev("renderSettings()");
    ok(w.document.getElementById("grocRowVal").textContent === "All bought", "settings row reflects state");
    ev("document.getElementById('grocClearDone').click()"); await tick();
    ok(ev("S.groceries.length") === 0, "clear checked empties bought items");
    ok(w.__errs.length === 0, "no errors (" + w.__errs.join(";") + ")");
    w.close();
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
