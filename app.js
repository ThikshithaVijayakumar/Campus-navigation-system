const svg = document.getElementById("map"), NS = "http://www.w3.org/2000/svg";
const fromEl = document.getElementById("from"), toEl = document.getElementById("to");
const resultEl = document.getElementById("result"), tip = document.getElementById("tip");
const WALK = 72, BASE = { x: 60, y: 110, w: 1400, h: 860 };
const active = new Set(Object.keys(CATEGORIES));
const places = NODES.filter(n => !n.hidden);
const label = n => n.name;
const el = (tag, attrs = {}, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };

// ---- Pan / zoom ----
let vb = { ...BASE }, moved = false, drag = null;
function setVB() { svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); svg.classList.toggle("zoomed", vb.w < 800); }
function clampVB() { vb.x = Math.min(Math.max(vb.x, 0), 1600 - vb.w); vb.y = Math.min(Math.max(vb.y, 60), 1000 - vb.h); }
function zoom(f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) {
  const nw = Math.min(1500, Math.max(300, vb.w * f)), k = nw / vb.w;
  vb = { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w: nw, h: vb.h * k }; clampVB(); setVB();
}
const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
function fitAll() { if (!svg.clientWidth) return; const r = svg.clientHeight / svg.clientWidth; vb = { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.w * r }; setVB(); }
function fitTo(ids) { // fit the route into the part of the screen NOT covered by the search card
  const cw = svg.clientWidth, ch = svg.clientHeight, card = document.querySelector(".card"), mobile = cw <= 760;
  const L = mobile ? 0 : card.offsetWidth + 40, T = mobile ? Math.min(card.offsetHeight, ch * .46) + 20 : 0, pad = 90;
  const xs = ids.map(i => NODE_BY_ID[i].x), ys = ids.map(i => NODE_BY_ID[i].y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let s = Math.min((cw - L - 30) / (x1 - x0 + 2 * pad), (ch - T - 90) / (y1 - y0 + 2 * pad));
  s = Math.min(Math.max(s, cw / 1500), cw / 450);
  const fx = L + (cw - L) / 2, fy = T + (ch - T) / 2 - 20;
  vb = { x: (x0 + x1) / 2 - fx / s, y: (y0 + y1) / 2 - fy / s, w: cw / s, h: ch / s }; clampVB(); setVB();
}
svg.addEventListener("wheel", e => { e.preventDefault(); const p = toSvg(e); zoom(e.deltaY < 0 ? .85 : 1.18, p.x, p.y); }, { passive: false });
svg.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; moved = false; });
svg.addEventListener("pointermove", e => {
  if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!moved && Math.hypot(dx, dy) < 5) return;
  moved = true; const s = svg.getScreenCTM().a; vb.x -= dx / s; vb.y -= dy / s; drag = { x: e.clientX, y: e.clientY }; clampVB(); setVB();
});
["pointerup", "pointerleave"].forEach(t => svg.addEventListener(t, () => drag = null));

// ---- Vector basemap (Google-Maps style) ----
let routeLayer, markLayer, nodeEls = {};
function drawBase() {
  el("rect", { x: -200, y: -200, width: 2200, height: 1600, fill: "#ebe8e0" });
  const park = "#c9e7b8", bld = "#dcd6c8", bs = "#c3bba8";
  [[640,120,860,190],[60,420,260,260],[60,120,60,240]].forEach(([x,y,w,h]) => el("rect", { x, y, width: w, height: h, rx: 30, fill: park }));
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 120; i++) el("circle", { cx: 660 + rnd() * 820, cy: 130 + rnd() * 170, r: 5 + rnd() * 4, fill: "#a8d28f" });
  el("rect", { x: 330, y: 440, width: 280, height: 210, rx: 18, fill: "#b9e2c9" }); // sports courts
  [[355,555,110,70],[470,520,100,60],[345,470,70,50],[430,455,90,55]].forEach(([x,y,w,h]) => el("rect", { x, y, width: w, height: h, rx: 4, fill: "#a1d4b6", stroke: "#fff", "stroke-width": 2 }));
  el("ellipse", { cx: 1143, cy: 598, rx: 300, ry: 195, fill: "#f3c9b8", stroke: "#e2a48f", "stroke-width": 3 }); // track
  el("ellipse", { cx: 1143, cy: 598, rx: 215, ry: 130, fill: "#a8dab5", stroke: "#fff", "stroke-width": 3 });
  el("rect", { x: 780, y: 760, width: 480, height: 140, rx: 8, fill: "#d9dbdf", stroke: "#c2c5ca", "stroke-width": 2 }); // parking
  el("rect", { x: 1260, y: 190, width: 110, height: 60, rx: 8, fill: "#b8d8f0" }); // sewage plant
  const B = [[545,415,240,115],[490,275,190,80],[125,285,200,80],[318,365,110,70],[725,170,200,75],[1170,265,300,150],[790,318,150,48],
    [860,262,70,45],[985,316,110,45],[330,262,120,50],[555,645,70,45],[432,428,42,38],[1262,420,40,26]]; // last two: Canteen Block, Raji's Cafe
  B.forEach(([x,y,w,h]) => el("rect", { x, y, width: w, height: h, rx: 6, fill: bld, stroke: bs, "stroke-width": 2 }));
  el("rect", { x: 590, y: 440, width: 150, height: 62, rx: 6, fill: park }); // courtyard
  [[1,"casing"],[0,"fill"]].forEach(([c]) => {
    EDGES.forEach(e => { const A = NODE_BY_ID[e.a], Bn = NODE_BY_ID[e.b], w = e.road ? 22 : 13;
      el("line", { x1: A.x, y1: A.y, x2: Bn.x, y2: Bn.y, stroke: c ? "#c9c9c9" : "#fff", "stroke-width": c ? w : w - 4, "stroke-linecap": "round" }); });
  });
  routeLayer = el("g"); const layer = el("g");
  places.forEach(n => {
    const cat = CATEGORIES[n.cat], L = LBL[n.id] || [14, 5, "start"];
    const g = el("g", { class: "node" + (n.minor ? " minor" : ""), tabindex: 0, role: "button", "aria-label": n.name, transform: `translate(${n.x},${n.y})` }, layer);
    el("circle", { r: n.minor ? 6 : 9, fill: cat.color, stroke: "#fff", "stroke-width": 3 }, g);
    el("text", { class: "lbl" + (n.minor ? " minor" : ""), x: L[0], y: L[1], "text-anchor": L[2] }, g).textContent = n.name;
    g.addEventListener("click", () => { if (!moved) pick(n); });
    g.addEventListener("keydown", e => { if (e.key === "Enter") pick(n); });
    g.addEventListener("mousemove", e => { tip.hidden = false; tip.textContent = n.name; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; });
    g.addEventListener("mouseleave", () => tip.hidden = true);
    nodeEls[n.id] = g;
  });
  markLayer = el("g");
}
const LBL = { 22: [-14, 5, "end"], 25: [0, -16, "middle"], 26: [0, 25, "middle"], 19: [14, -8, "start"], 28: [0, 24, "middle"], 27: [0, 24, "middle"], 3: [-14, 18, "end"], 4: [14, -6, "start"], 11: [14, 18, "start"], 10: [-14, 5, "end"], 9: [14, 5, "start"], 14: [-14, 5, "end"], 15: [-14, 5, "end"], 13: [-14, 5, "end"], 12: [-14, 5, "end"], 16: [-14, 5, "end"], 43: [0, -14, "middle"], 44: [14, -8, "start"] };

function marker(n, type) {
  const g = el("g", { transform: `translate(${n.x},${n.y})` }, markLayer);
  if (type === "start") {
    el("circle", { class: "pulse", r: 22, fill: "#1a73e8" }, g);
    el("circle", { r: 11, fill: "#1a73e8", stroke: "#fff", "stroke-width": 4 }, g);
  } else {
    el("path", { d: "M0,0 C-10,-14 -17,-22 -17,-31 A17,17 0 1 1 17,-31 C17,-22 10,-14 0,0Z", fill: "#ea4335", stroke: "#fff", "stroke-width": 2.5 }, g);
    el("circle", { cy: -31, r: 6, fill: "#fff" }, g);
  }
}

// ---- Search + filters (outdoor places + indoor rooms) ----
const rooms = INDOOR_NODES.filter(n => n.room || n.entrance), searchable = [...places, ...rooms];
const outer = n => n.indoor ? NODE_BY_ID[BLD[n.bld].outer] : n;
const ALIAS = { "main entrance": 16, "main gate": 16, "entrance": 16, "gate": 16, "apj block": 1, "kalam block": 1, "rk block": 2, "lab 1": 3, "lab shed 1": 3, "lab 2": 4, "lab shed 2": 4 };
let current = null, viewNow = "campus";
function refreshList() {
  const dl = document.getElementById("places"); dl.innerHTML = "";
  [{ name: "Main Entrance" }, ...places.filter(n => active.has(n.cat)), ...rooms].forEach(n => { const o = document.createElement("option"); o.value = n.name; dl.appendChild(o); });
  places.forEach(n => nodeEls[n.id].classList.toggle("dim", !active.has(n.cat)));
}
function buildFilters() {
  const box = document.getElementById("filters");
  Object.entries(CATEGORIES).forEach(([key, c]) => {
    const b = document.createElement("button"); b.className = "chip"; b.setAttribute("aria-pressed", "true");
    b.innerHTML = `<i style="background:${c.color}"></i>${c.label}`;
    b.onclick = () => { active.has(key) ? active.delete(key) : active.add(key); b.setAttribute("aria-pressed", active.has(key)); refreshList(); };
    box.appendChild(b);
  });
}
function findNode(text) {
  const t = text.trim().toLowerCase(); if (!t) return null;
  if (ALIAS[t]) return NODE_BY_ID[ALIAS[t]];
  return searchable.find(n => n.name.toLowerCase() === t) || searchable.find(n => n.name.toLowerCase().includes(t));
}
function pick(n) {
  if (!fromEl.value || toEl.value) { fromEl.value = n.name; toEl.value = ""; clearRoute(); showStart(); }
  else { toEl.value = n.name; route(); }
}
function showStart() { markLayer.innerHTML = ""; const a = findNode(fromEl.value); if (a) marker(outer(a), "start"); }

// ---- Floor plan view ----
const plan = document.getElementById("plan");
function drawPlan(b, f) {
  plan.innerHTML = ""; const B = BLD[b], P = (tag, attrs) => el(tag, attrs, plan);
  P("rect", { x: -100, y: -100, width: 1000, height: 720, fill: "#ebe8e0" });
  if (B.type === "ring") {
    P("rect", { x: 165, y: 145, width: 470, height: 230, rx: 14, fill: "#c9e7b8" });
    P("text", { x: 400, y: 265, "text-anchor": "middle", class: "lbl" }).textContent = "Courtyard";
    P("rect", { x: 150, y: 130, width: 500, height: 260, fill: "none", stroke: "#cfc9bb", "stroke-width": 34 });
    P("rect", { x: 150, y: 130, width: 500, height: 260, fill: "none", stroke: "#fff", "stroke-width": 30 });
  } else {
    P("rect", { x: B.span[0], y: 245, width: B.span[1] - B.span[0], height: 30, rx: 6, fill: "#fff", stroke: "#cfc9bb", "stroke-width": 2 });
  }
  const startId = current && current.path[0], endId = current && current.path[current.path.length - 1];
  const here = n => n.indoor && n.bld === b && n.floor === f;
  INDOOR_NODES.filter(n => n.room && here(n)).forEach(n => {
    const r = n.rect, g = P("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": n.name });
    const fill = n.id === startId ? "#d2e3fc" : n.id === endId ? "#fad2cf" : n.info ? "#fdf0c8" : "#f8f5ec";
    el("rect", { ...r, rx: 3, fill, stroke: "#b9b09a", "stroke-width": 1.5 }, g);
    const big = r.width > 90, lines = n.info ? (big ? [n.info] : n.info.split(" ")) : [n.short], fs = n.info ? (big ? 17 : 9.5) : 11;
    lines.forEach((t, i) => el("text", { x: r.x + r.width / 2, y: r.y + r.height / 2 + 4 + (i - (lines.length - 1) / 2) * (fs + 1), "text-anchor": "middle", "font-size": fs, "font-weight": n.info ? 600 : 400, fill: "#3c4043" }, g).textContent = t);
    g.addEventListener("click", () => pick(n)); g.addEventListener("keydown", e => { if (e.key === "Enter") pick(n); });
    g.addEventListener("mousemove", e => { tip.hidden = false; tip.textContent = n.name + (n.info ? " - " + n.info : "") + " (" + FL(f) + ")"; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; });
    g.addEventListener("mouseleave", () => tip.hidden = true);
  });
  INDOOR_NODES.filter(n => n.corner && here(n)).forEach(n => {
    el("rect", { x: n.x - 13, y: n.y - 13, width: 26, height: 26, rx: 5, fill: n.type === "lift" ? "#e8f0fe" : "#fef7e0", stroke: "#80868b" }, plan);
    el("text", { x: n.x, y: n.y + 5, "text-anchor": "middle", "font-size": 14 }, plan).innerHTML = n.type === "lift" ? "&#8645;" : "&#9776;";
    el("text", { x: n.x, y: n.y + (n.y < 250 ? -20 : 30), "text-anchor": "middle", class: "lbl", style: "font-size:11px" }, plan).textContent = n.name;
  });
  const e = f === 0 && INDOOR_NODES.find(n => n.entrance && n.bld === b);
  if (e) {
    const t = NODE_BY_ID[ADJ[e.id].find(x => NODE_BY_ID[x.to].indoor).to];
    P("line", { x1: e.x, y1: e.y, x2: t.x, y2: t.y, stroke: "#fff", "stroke-width": 10, "stroke-linecap": "round" });
    P("rect", { x: e.x - 14, y: e.y - 14, width: 28, height: 28, rx: 14, fill: "#34a853", stroke: "#fff", "stroke-width": 3 });
    P("text", { x: e.x, y: e.y + 32, "text-anchor": "middle", class: "lbl", style: "font-size:11px" }).textContent = "Main Entrance";
  }
  if (current) {
    const path = current.path; let run = [];
    const flush = () => { if (run.length > 1) { const pts = run.map(n => n.x + "," + n.y).join(" ");
      ["#fff|15", "#1a73e8|8"].forEach(s => { const [c, w] = s.split("|"); P("polyline", { points: pts, fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" }); }); } run = []; };
    path.forEach(id => { const n = NODE_BY_ID[id]; here(n) ? run.push(n) : flush(); }); flush();
    for (let i = 0; i < path.length - 1; i++) {
      const a = NODE_BY_ID[path[i]], c = NODE_BY_ID[path[i + 1]];
      if (a.indoor && c.indoor && a.floor !== c.floor) [[a, c], [c, a]].forEach(([x, y]) => { if (here(x)) {
        P("circle", { cx: x.x, cy: x.y, r: 15, fill: "#f9ab00", stroke: "#fff", "stroke-width": 3 });
        P("text", { x: x.x, y: x.y + 5, "text-anchor": "middle", "font-size": 15, fill: "#fff" }).innerHTML = y.floor > x.floor ? "&#8679;" : "&#8681;"; } });
    }
    const s = NODE_BY_ID[path[0]], t = NODE_BY_ID[path[path.length - 1]];
    if (here(s)) P("circle", { cx: s.x, cy: s.y, r: 8, fill: "#1a73e8", stroke: "#fff", "stroke-width": 3 });
    if (here(t)) P("path", { transform: `translate(${t.x},${t.y})`, d: "M0,0 C-8,-10 -12,-16 -12,-22 A12,12 0 1 1 12,-22 C12,-16 8,-10 0,0Z", fill: "#ea4335", stroke: "#fff", "stroke-width": 2 });
  }
}
const vbar = document.getElementById("views"), bsel = document.createElement("select"), flBox = document.createElement("span");
function setView(v) {
  viewNow = v; const c = v === "campus", [b, f] = c ? [] : v.split(":");
  svg.style.display = c ? "block" : "none"; plan.style.display = c ? "none" : "block";
  document.querySelector(".zoomctl").style.display = c ? "flex" : "none";
  if (!c && bsel.value !== b) { bsel.value = b; buildFloors(); }
  document.getElementById("badge").textContent = c ? "Campus map" : BLD[b].name + " \u00b7 " + FL(+f);
  vbar.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === v));
  if (!c) drawPlan(b, +f);
}
function buildFloors() {
  const b = bsel.value; flBox.innerHTML = "";
  for (let f = 0; f < BLD[b].floors; f++) { const x = document.createElement("button"); x.dataset.v = b + ":" + f; x.textContent = f ? f : "G"; x.title = BLD[b].short + " " + FL(f); x.onclick = () => setView(x.dataset.v); flBox.appendChild(x); }
}
function markViews() {
  const touched = v => current && current.path.some(id => viewOf(NODE_BY_ID[id]) === v);
  vbar.querySelectorAll("button").forEach(x => x.classList.toggle("has", !!touched(x.dataset.v)));
  [...bsel.options].forEach(o => o.textContent = BLD[o.value].short + (current && current.path.some(id => NODE_BY_ID[id].bld === o.value) ? " \u2022" : ""));
}

// ---- Routing ----
function clearRoute() {
  current = null; routeLayer.innerHTML = ""; markLayer.innerHTML = ""; markViews();
  resultEl.innerHTML = '<p class="hint">Choose a destination to see directions.</p>'; if (viewNow !== "campus") setView(viewNow);
}
function route() {
  const a = findNode(fromEl.value), b = findNode(toEl.value);
  if (!a || !b) { resultEl.innerHTML = '<p class="err">Pick valid places or rooms (e.g. APJ019) from the suggestions.</p>'; return; }
  if (a.id === b.id) { resultEl.innerHTML = '<p class="err">Start and destination are the same place.</p>'; return; }
  const r = dijkstra(ADJ, a.id, b.id, document.getElementById("sf").checked ? e => e.kind === "stairs" : null);
  if (!r) { resultEl.innerHTML = '<p class="err">No route found with these settings.</p>'; return; }
  clearRoute(); current = r;
  const out = r.path.filter(i => !NODE_BY_ID[i].indoor), pts = out.map(i => `${NODE_BY_ID[i].x},${NODE_BY_ID[i].y}`).join(" ");
  if (out.length > 1) { [["#fff", 20], ["#1a73e8", 12]].forEach(([c, w]) => el("polyline", { points: pts, fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" }, routeLayer)); }
  marker(outer(a), "start"); if (outer(b) !== outer(a)) marker(outer(b), "end");
  out.length ? (vb.w && fitTo(out)) : fitAll();
  const mins = Math.max(1, Math.round(r.distance / WALK)), steps = buildSteps(r.path);
  resultEl.innerHTML = `<div class="sum"><span class="eta">${mins} min</span><span class="dist">(${r.distance} m) walking</span></div><p class="hint" style="margin:0 0 6px">Tap a step to see it on the map or floor plan.</p><ol class="steps">` +
    steps.map(s => `<li data-v="${s.v}"><span class="ic">${s.ic}</span><span class="st">${s.t}</span><span class="d">${s.d ? s.d + " m" : ""}</span></li>`).join("") + "</ol>";
  resultEl.querySelectorAll("li").forEach(li => li.onclick = () => setView(li.dataset.v));
  const firstIn = out.length < 2 && r.path.map(i => NODE_BY_ID[i]).find(n => n.indoor); setView(viewOf(firstIn || a)); markViews();
  history.replaceState(null, "", "#" + new URLSearchParams({ from: fromEl.value, to: toEl.value, sf: document.getElementById("sf").checked ? 1 : 0 }));
}

// ---- Init ----
const cb = document.createElement("button"); cb.dataset.v = "campus"; cb.textContent = "Campus"; cb.onclick = () => setView("campus");
Object.entries(BLD).forEach(([k, B]) => bsel.add(new Option(B.short, k)));
bsel.setAttribute("aria-label", "Building"); bsel.onchange = () => { buildFloors(); setView(bsel.value + ":0"); };
vbar.append(cb, bsel, flBox); buildFloors();
drawBase(); buildFilters(); refreshList(); fitAll(); setView("campus");
fromEl.value = NODE_BY_ID[16].name; showStart();
document.getElementById("go").onclick = route;
document.getElementById("sf").onchange = () => { if (fromEl.value && toEl.value) route(); };
document.getElementById("swap").onclick = () => { [fromEl.value, toEl.value] = [toEl.value, fromEl.value]; if (fromEl.value && toEl.value) route(); };
document.getElementById("reset").onclick = () => { fromEl.value = NODE_BY_ID[16].name; toEl.value = ""; clearRoute(); setView("campus"); showStart(); fitAll(); };
document.getElementById("zin").onclick = () => zoom(.75);
document.getElementById("zout").onclick = () => zoom(1.33);
document.getElementById("zfit").onclick = fitAll;
window.addEventListener("resize", () => { if (viewNow === "campus") fitAll(); });
[fromEl, toEl].forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") route(); }));

// ---- Extras: quick demo routes, share link, read aloud ----
const DEMOS = [["Canteen", "Gym"], ["Main Entrance", "Library"], ["Admission Office", "Library"], ["Main Entrance", "Raji's Cafe"], ["APJ020", "APJ120"], ["APJ Block", "RK Block"]];
const demoBox = document.getElementById("demos");
DEMOS.forEach(([a, b]) => { const x = document.createElement("button"); x.className = "chip"; x.textContent = a + " \u2192 " + b; x.onclick = () => { fromEl.value = a; toEl.value = b; route(); }; demoBox.appendChild(x); });
document.getElementById("share").onclick = e => { navigator.clipboard && navigator.clipboard.writeText(location.href); e.target.textContent = "Link copied"; setTimeout(() => e.target.textContent = "Share", 1500); };
document.getElementById("speak").onclick = () => {
  if (speechSynthesis.speaking) return speechSynthesis.cancel();
  const t = [...resultEl.querySelectorAll(".st")].map(x => x.textContent).join(". "); if (t) speechSynthesis.speak(new SpeechSynthesisUtterance(t));
};
const q = new URLSearchParams(location.hash.slice(1));
if (q.get("from") && q.get("to")) { fromEl.value = q.get("from"); toEl.value = q.get("to"); document.getElementById("sf").checked = q.get("sf") === "1"; route(); }
