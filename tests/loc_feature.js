/* Fuel 2026.10.14-i: Location tag on custom foods (f.loc) — create/edit, chips,
   bold prefix in diary / add-sheet / foods tab / detail, loc search, entry fallback. */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const shim = `<script>window.__memStore={"fuel.flags.v1":JSON.stringify({zeroReset:1})};window.localStorage={getItem:k=>window.__memStore[k]??null,setItem:(k,v)=>{window.__memStore[k]=String(v)},removeItem:k=>{delete window.__memStore[k]},clear:()=>{window.__memStore={}}};</script>`;
const html2 = html.replace(/<script/, shim + "<script");
let pass = 0, fail = 0;
function ok(cond, name){ if(cond){ pass++; } else { fail++; console.log("FAIL:", name); } }

const dom = new JSDOM(html2, { runScripts: "dangerously", url: "https://x.test/", pretendToBeVisual: true });
const w = dom.window;
const ev = s => w.eval(s);
const errors = [];
w.addEventListener("error", e => errors.push(e.message || String(e.error)));
const q = s => w.document.querySelector(s), qa = s => [...w.document.querySelectorAll(s)];
const stored = () => JSON.parse(w.localStorage.getItem("fuel.v1"));
const setVal = (id, v) => { const el = q("#" + id); el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await sleep(400);
  try {
    ok(errors.length === 0, "boot with zero JS errors" + (errors.length ? " :: " + errors.slice(0, 3).join(" | ") : ""));
    ok(ev("APP_VERSION") === "2026.10.18-b", "version 2026.10.18-b, got " + ev("APP_VERSION"));

    /* ---- create a food WITH a location via the real form ---- */
    q("#newCustomBtn").click();
    await sleep(60);
    ok(q("#cLoc"), "location input exists in create form");
    ok(q("#cLocChips").style.display === "none", "no location chips before any food has one");
    setVal("cName", "Chinese Chicken Wrap");
    setVal("cServ", "1 wrap");
    setVal("cCal", "970");
    setVal("fProt", "55"); setVal("fCarb", "105"); setVal("fFat", "37");
    setVal("cLoc", "The Stand");
    q("#cSave").click();
    await sleep(80);
    const wrap = stored().customFoods.find(f => f.n === "Chinese Chicken Wrap");
    ok(!!wrap, "wrap saved to customFoods");
    ok(wrap && wrap.loc === "The Stand", "loc saved on food record, got " + (wrap && wrap.loc));

    /* Foods tab row shows the bold prefix (renderFoods ran on save) */
    ok(q("#foodResults").innerHTML.includes('<span class="locpfx">The Stand</span> Chinese Chicken Wrap'), "foods tab row shows bold loc prefix");

    /* ---- create a food WITHOUT a location ---- */
    q("#newCustomBtn").click();
    await sleep(60);
    ok(q("#cLoc").value === "", "loc field cleared on fresh create");
    const chip = qa("#cLocChips .chip").find(c => c.dataset.loc === "The Stand");
    ok(!!chip, "recent-location chip offered for The Stand");
    setVal("cName", "Plain Oats"); setVal("cServ", "100 g"); setVal("cCal", "380");
    setVal("fProt", "13"); setVal("fCarb", "67"); setVal("fFat", "7");
    q("#cSave").click();
    await sleep(80);
    const oats = stored().customFoods.find(f => f.n === "Plain Oats");
    ok(!!oats && !("loc" in oats), "food without location stores no loc key");

    /* chip click fills the input */
    q("#newCustomBtn").click();
    await sleep(60);
    qa("#cLocChips .chip").find(c => c.dataset.loc === "The Stand").click();
    ok(q("#cLoc").value === "The Stand", "chip tap fills location input");
    q("#cX").click();

    /* ---- add-sheet: searching the location finds the food, row shows prefix ---- */
    q("[data-add]").click();
    await sleep(80);
    setVal("sheetSearch", "stand");
    await sleep(120);
    ok(q("#sheetResults").innerHTML.includes("Chinese Chicken Wrap"), "searching 'stand' finds the wrap via loc");
    ok(q("#sheetResults").innerHTML.includes('<span class="locpfx">The Stand</span>'), "add-sheet row shows bold loc prefix");
    setVal("sheetSearch", "Chinese");
    await sleep(120);
    const row = qa("#sheetResults .arow2").find(r => r.dataset.n === "Chinese Chicken Wrap");
    ok(!!row, "wrap row present in search results");
    row.click();
    await sleep(100);
    ok(q("#dName").innerHTML.includes('<span class="locpfx">The Stand</span>'), "detail sheet title shows bold loc prefix");

    /* ---- log it: confirmAdd stages the tray, trayAdd commits to the day ---- */
    q("#confirmAdd").click();
    await sleep(80);
    ok(!q("#trayAdd").disabled, "tray add enabled after confirm");
    q("#trayAdd").click();
    await sleep(120);
    ok(q("#meals").innerHTML.includes('<span class="locpfx">The Stand</span> Chinese Chicken Wrap'), "diary entry title shows bold loc prefix");
    const storedState = stored();
    const dayEnt = Object.values(storedState.days).flatMap(d => Object.values(d.meals).flat()).find(e => e.n === "Chinese Chicken Wrap");
    ok(dayEnt && dayEnt.loc === "The Stand", "logged entry snapshots loc");

    /* ---- old entry without loc snapshot still resolves by name ---- */
    ev(`(function(){ const k = Object.keys(S.days).find(k=>S.days[k].meals && Object.values(S.days[k].meals).some(a=>a.length));
      const arr = Object.values(S.days[k].meals).find(a=>a.length); arr[0].loc = null; save(); renderDiary(); })()`);
    await sleep(80);
    ok(q("#meals").innerHTML.includes('<span class="locpfx">The Stand</span>'), "entry with null loc falls back to food lookup");

    /* ---- edit flow: loc prefilled, clearing it removes the tag ---- */
    ev(`editCustomFood("Chinese Chicken Wrap")`);
    await sleep(60);
    ok(q("#cLoc").value === "The Stand", "edit form pre-fills loc");
    setVal("cLoc", "");
    q("#cSave").click();
    await sleep(80);
    const wrap2 = stored().customFoods.find(f => f.n === "Chinese Chicken Wrap");
    ok(wrap2 && !("loc" in wrap2), "clearing loc in edit removes it from the record");
    ok(errors.length === 0, "zero JS errors throughout" + (errors.length ? " :: " + errors.slice(0, 3).join(" | ") : ""));
  } catch (e) {
    fail++; console.log("EXCEPTION:", e && e.stack || e);
  }
  console.log(`loc_feature: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
