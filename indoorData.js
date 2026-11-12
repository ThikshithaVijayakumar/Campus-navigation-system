// INDOOR MAPS for 4 buildings. Room code = prefix + floor digit + 2-digit number (APJ019 = ground floor room 19, RK202 = 2nd floor room 2, LAB1-05 = Lab Shed I room 5).
// These floor plans are TEMPLATES (ring or straight corridor). Replace counts, positions and ROOM_INFO labels with the real plan.
const BLD = {
  apj: { name: "Dr. A.P.J. Abdul Kalam Block", short: "Kalam Block", type: "ring", floors: 4, rooms: 40, prefix: "APJ", outer: 1 },
  rk: { name: "Dr. S. Radhakrishnan Block", short: "Radhakrishnan Block", type: "line", floors: 4, rooms: 24, prefix: "RK", outer: 2, span: [70, 730] },
  lab1: { name: "Laboratories Shed I", short: "Lab Shed I", type: "line", floors: 1, rooms: 12, prefix: "LAB1-", outer: 3, span: [220, 580] },
  lab2: { name: "Laboratories Shed II", short: "Lab Shed II", type: "line", floors: 1, rooms: 12, prefix: "LAB2-", outer: 4, span: [220, 580] },
  can: { name: "Canteen Block", short: "Canteen Block", type: "hall", floors: 3, rooms: 1, prefix: "CAN", outer: 20, span: [100, 700] }
};
const INDOOR_NODES = [], ROOM_INFO = {}; // ROOM_INFO e.g. { APJ019: "CSE Classroom A" }
// ---- Named rooms. Girls Washroom is exactly above Boys Washroom (same position, next floor) in APJ and RK. ----
Object.assign(ROOM_INFO, {
  APJ002: "Library",                                  // ground floor, top wing (WIDE below makes it 4 slots wide)
  APJ035: "Staff Room",                               // ground floor, left side
  APJ020: "Boys Washroom", APJ120: "Girls Washroom",  // ground floor last right corner, girls directly above on floor 1
  RK001: "Staff Room",                                // ground floor, left end
  RK024: "Boys Washroom", RK124: "Girls Washroom",    // ground floor right end, girls directly above on floor 1
  CAN001: "Canteen Hall", CAN101: "Admission Office", CAN201: "Gym"  // Canteen Block: ground / 1 / 2
});
const WIDE = { APJ002: 4 };                           // room code -> number of slots it covers (top wing only); neighbours are skipped
const pad2 = n => String(n).padStart(2, "0");
function addIn(b, id, name, floor, x, y, extra = {}) {
  const n = { id, name, floor, x, y, indoor: true, bld: b, ...extra };
  INDOOR_NODES.push(n); NODE_BY_ID[id] = n; ADJ[id] = [];
}
function link(a, b, kind = "walk", w) {
  const A = NODE_BY_ID[a], B = NODE_BY_ID[b];
  w = w || Math.max(2, Math.round(Math.hypot(A.x - B.x, A.y - B.y) * 0.1)); // 1 plan px = 0.1 m
  ADJ[a].push({ to: b, w, kind }); ADJ[b].push({ to: a, w, kind });
}
const RING_CONN = [[1, 150, 130, "Staircase A", "stairs"], [2, 650, 130, "Lift 1", "lift"], [3, 650, 390, "Staircase B", "stairs"], [4, 150, 390, "Lift 2", "lift"]];
Object.entries(BLD).forEach(([b, B]) => {
  const code = (f, n) => B.prefix + (B.floors > 1 ? f : "") + pad2(n), conn = [];
  for (let f = 0; f < B.floors; f++) {
    const S = k => `${b}S${f}_${k}`, ring = [];
    if (B.type === "ring") {
      RING_CONN.forEach(([k, x, y, name, t]) => addIn(b, S(k), name, f, x, y, { corner: true, type: t }));
      ring.push(S(1)); let skipLeft = 0;
      for (let n = 1; n <= B.rooms; n++) {
        const wing = Math.floor((n - 1) / 10), k = (n - 1) % 10; let rx, ry, cx, cy, rect;
        if (skipLeft > 0) { skipLeft--; if (n % 10 === 0) ring.push(S([2, 3, 4, 1][wing])); continue; }
        const wide = wing === 0 && WIDE[code(f, n)] || 1; skipLeft = wide - 1;
        if (wing === 0) { rx = 175 + 50 * (k + (wide - 1) / 2); ry = 87; cx = rx; cy = 130; rect = { x: 175 + 50 * k - 24, y: 60, width: 50 * (wide - 1) + 48, height: 55 }; }
        else if (wing === 1) { rx = 695; ry = 143 + 26 * k; cx = 650; cy = ry; rect = { x: 665, y: ry - 12, width: 60, height: 24 }; }
        else if (wing === 2) { rx = 625 - 50 * k; ry = 435; cx = rx; cy = 390; rect = { x: rx - 24, y: 405, width: 48, height: 60 }; }
        else { rx = 105; ry = 377 - 26 * k; cx = 150; cy = ry; rect = { x: 75, y: ry - 12, width: 60, height: 24 }; }
        const id = code(f, n), c = `${b}c${f}_${n}`;
        addIn(b, id, ROOM_INFO[id] ? ROOM_INFO[id] + " (" + id + ")" : id, f, rx, ry, { room: true, rect, short: id.slice(B.prefix.length), info: ROOM_INFO[id] });
        addIn(b, c, "", f, cx, cy, { hidden: true });
        link(id, c, "room", 4); ring.push(c);
        if (n % 10 === 0) ring.push(S([2, 3, 4, 1][wing]));
      }
    } else {
      const [s0, s1] = B.span, cols = B.rooms / 2, i0 = s0 + 40, i1 = s1 - 40, cx = k => i0 + (i1 - i0) * (k + .5) / cols, rw = Math.min(60, (i1 - i0) / cols - 6);
      const Ln = `${b}L${f}`, Rn = `${b}R${f}`;
      addIn(b, Ln, "", f, s0, 260, { hidden: true }); addIn(b, Rn, "", f, s1, 260, { hidden: true }); ring.push(Ln);
      [[1, s0 - 12, 292, "Staircase A", "stairs", Ln], [2, s1 + 12, 228, "Lift 1", "lift", Rn], [3, s1 + 12, 292, "Staircase B", "stairs", Rn], [4, s0 - 12, 228, "Lift 2", "lift", Ln]]
        .forEach(([k, x, y, name, t, at]) => { addIn(b, S(k), name, f, x, y, { corner: true, type: t }); link(S(k), at, "walk", 4); });
      if (B.type === "hall") { // one big hall per floor, opening onto the lobby corridor
        const id = code(f, 1), c = `${b}c${f}_0`;
        addIn(b, c, "", f, 400, 260, { hidden: true }); ring.push(c);
        addIn(b, id, ROOM_INFO[id], f, 400, 145, { room: true, rect: { x: 130, y: 60, width: 540, height: 170 }, short: "", info: ROOM_INFO[id] });
        link(id, c, "room", 4);
      } else for (let n = 1; n <= B.rooms; n++) {
        const col = Math.floor((n - 1) / 2), top = (n - 1) % 2 === 0, id = code(f, n), c = `${b}c${f}_${col}`;
        if (top) { addIn(b, c, "", f, cx(col), 260, { hidden: true }); ring.push(c); }
        addIn(b, id, ROOM_INFO[id] ? ROOM_INFO[id] + " (" + id + ")" : id, f, cx(col), top ? 205 : 315, { room: true, rect: { x: cx(col) - rw / 2, y: top ? 175 : 285, width: rw, height: 60 }, short: id.slice(B.prefix.length), info: ROOM_INFO[id] });
        link(id, c, "room", 4);
      }
      ring.push(Rn);
    }
    for (let i = 0; i < ring.length - 1; i++) link(ring[i], ring[i + 1], "walk");
  }
  for (let f = 0; f < B.floors - 1; f++) [1, 2, 3, 4].forEach(k => { const t = (B.type === "ring" ? RING_CONN[k - 1][4] : ["stairs", "lift", "stairs", "lift"][k - 1]); link(`${b}S${f}_${k}`, `${b}S${f + 1}_${k}`, t, t === "lift" ? 10 : 14); });
  const ent = `ENT_${b}`, ring = B.type === "ring";
  addIn(b, ent, B.short + " Entrance", 0, ring ? 690 : B.span[0] - 45, ring ? 430 : 260, { entrance: true });
  link(ent, ring ? `${b}S0_3` : `${b}L0`, "walk"); link(ent, B.outer, "entry", 20); // joins the indoor map to the outdoor campus graph
});
