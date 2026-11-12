// Turn-by-turn instruction builder for mixed indoor/outdoor routes.
const bear = (a, b) => Math.atan2(b.x - a.x, -(b.y - a.y)) * 180 / Math.PI;
const disp = n => n.info || n.name;
const FL = f => f === 0 ? "Ground floor" : "Floor " + f;
const viewOf = n => n.indoor ? n.bld + ":" + n.floor : "campus";
function buildSteps(path) {
  const N = i => NODE_BY_ID[path[i]], E = i => ADJ[path[i]].find(e => e.to === path[i + 1]), last = path.length - 1;
  const out = []; let acc = 0, prev = null, pb = null, side = "";
  const emit = (ic, t, v) => { if (prev) prev.d = acc; acc = 0; prev = { ic, t, v, d: 0 }; out.push(prev); };
  const landmark = i => { for (let k = i + 1; k <= last; k++) if (!N(k).hidden) return N(k); return N(last); };
  for (let i = 0; i < last; i++) {
    const a = N(i), b = N(i + 1), e = E(i), v = viewOf(a);
    if (e.kind === "room") { if (i === last - 1 && pb !== null) side = ((bear(a, b) - pb + 540) % 360) - 180 > 0 ? "right" : "left"; if (i === 0) emit("&#8594;", `Exit <b>${disp(a)}</b> into the corridor`, v); acc += e.w; pb = null; continue; }
    if (e.kind === "stairs" || e.kind === "lift") {
      const up = b.floor > a.floor, txt = `Take the <b>${e.kind}</b> ${up ? "up" : "down"} to <b>${FL(b.floor)}</b>`;
      if (prev && prev.vk === e.kind) { prev.t = txt; acc += e.w; pb = null; continue; }
      emit(up ? "&#8679;" : "&#8681;", txt, v); prev.vk = e.kind; acc += e.w; pb = null; continue;
    }
    if (e.kind === "entry") {
      emit("&#8689;", a.indoor ? `Exit through the <b>Main Entrance</b> of the ${BLD[a.bld].short}` : `Enter the ${BLD[b.bld].short} through the <b>Main Entrance</b>`, v); acc += e.w; pb = null; continue;
    }
    const bg = bear(a, b);
    if (pb === null) emit("&#8593;", `Walk <b>straight</b>${a.indoor ? " along the corridor" : ""} toward <b>${landmark(i).name}</b>`, v);
    else {
      const t = ((bg - pb + 540) % 360) - 180, ab = Math.abs(t), pl = !a.hidden;
      if (ab > 35) emit(t > 0 ? (ab < 60 ? "&#8599;" : "&#8625;") : (ab < 60 ? "&#8598;" : "&#8624;"),
        `${ab < 60 ? "Slight " : ""}Turn <b>${t > 0 ? "right" : "left"}</b> ${pl ? "at <b>" + a.name + "</b>" : "toward <b>" + landmark(i).name + "</b>"}`, v);
      else if (pl && !a.indoor) emit("&#8593;", `Continue past <b>${a.name}</b>`, v);
    }
    pb = bg; acc += e.w;
  }
  emit("&#9873;", `Arrive at <b>${disp(N(last))}</b>${N(last).indoor ? " (" + FL(N(last).floor) + ")" : ""}${side ? ", on your <b>" + side + "</b>" : ""}`, viewOf(N(last)));
  prev.d = 0; return out;
}
