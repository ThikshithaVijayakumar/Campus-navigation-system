// Dijkstra's shortest path. `skip(edge)` optionally blocks edges (e.g. stairs for step-free routes).
function dijkstra(adj, start, end, skip) {
  const dist = {}, prev = {}, done = new Set();
  Object.keys(adj).forEach(k => dist[k] = Infinity);
  dist[start] = 0;
  const queue = [[0, start]];
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, u] = queue.shift();
    if (done.has(u)) continue;
    done.add(u);
    if (u === end) break;
    for (const e of adj[u]) {
      if (skip && skip(e)) continue;
      if (d + e.w < dist[e.to]) { dist[e.to] = d + e.w; prev[e.to] = u; queue.push([dist[e.to], e.to]); }
    }
  }
  if (dist[end] === Infinity) return null;
  const path = [];
  for (let c = end; c !== undefined; c = prev[c]) path.unshift(c);
  return { path, distance: dist[end] };
}
