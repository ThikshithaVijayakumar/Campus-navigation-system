// Node coordinates (x,y) are pixel positions taken from the official college layout board (1500x920 map space).
const CATEGORIES = {
  academic: { label: "Academic", color: "#3b82f6" },
  hostel: { label: "Hostels", color: "#a855f7" },
  sports: { label: "Sports", color: "#22c55e" },
  facility: { label: "Facilities", color: "#f59e0b" },
  parking: { label: "Parking & Utilities", color: "#64748b" }
};
const N = (id, name, cat, x, y) => ({ id, name, cat, x, y });
const NODES = [
  N(1,"Dr. A.P.J. Abdul Kalam Block","academic",663,475), N(2,"Dr. S. Radhakrishnan Block","academic",569,310),
  N(3,"Laboratories Shed I","academic",835,345), N(4,"Laboratories Shed II","academic",889,329),
  N(5,"Veda Hostel","hostel",199,326), N(6,"Octa Hostel","hostel",821,192), N(7,"Dr. Muthulakshmi Reddy Hostel","hostel",1331,330),
  N(8,"Play Ground","sports",1143,598), N(9,"Ball Badminton Court","sports",652,596), N(10,"Kabaddi Court","sports",556,505),
  N(11,"Kho-Kho Court","sports",599,541), N(12,"Basket Ball Court","sports",507,570), N(13,"Cricket Practice Net","sports",414,613),
  N(14,"Volley Ball Court","sports",468,478), N(15,"Tennis Court","sports",380,531),
  N(16,"Main Gate (Security Office)","facility",651,743), N(17,"Axis ATM","facility",886,827), N(18,"SBI ATM","facility",780,570),
  N(19,"Olympia Block","facility",350,388), N(20,"Canteen","facility",443,447),
  N(22,"Guest House","facility",334,393), N(23,"Boys Mess","facility",375,291), N(24,"Staff Quarters","facility",880,283),
  N(25,"Storage Yard","facility",1007,332), N(26,"Power House","facility",1047,342), N(27,"Snack Corner","facility",1072,387),
  N(28,"Girls Mess","facility",1150,381), N(29,"Main Transformer","facility",1337,224),
  N(30,"Two Wheeler Parking","parking",838,790), N(31,"Four Wheeler Parking","parking",1071,873), N(32,"Fuel Station","parking",591,672),
  N(33,"Sewage Treatment Plant","parking",1292,222), N(34,"Bio Gas Point 1","parking",1124,341), N(35,"Bio Gas Point 2","parking",899,194),
  N(36,"Bio Gas Point 3","parking",290,274), N(37,"Solar PV Point 1","parking",610,438), N(38,"Solar PV Point 2","parking",683,362),
  N(39,"Solar PV Point 3","parking",840,386), N(40,"Solar PV Point 4","parking",850,488), N(41,"Solar PV Point 5","parking",255,294),
  N(42,"Solar PV Point 6","parking",251,321), N(43,"Emergency Assembly Point 1","parking",833,628), N(44,"Emergency Assembly Point 2","parking",1135,404),
  N(45,"Emergency Assembly Point 3","parking",586,368), N(46,"Emergency Assembly Point 4","parking",305,386),
  N(47,"Raji's Cafe","facility",1282,432)
];
// Hidden road junctions (x,y) that shape the road network so routes follow real roads, not straight lines.
const J = {a1:[700,712],a2:[770,665],a3:[805,598],t1:[836,710],f1:[620,708],w1:[672,640],j9:[630,565],j11:[555,560],j12:[610,490],
  j13:[725,520],j15:[715,583],j16:[600,400],j17:[395,415],j19:[250,355],j22:[360,340],j23:[520,420],j24:[700,330],j25:[850,230],
  j26:[960,390],j27:[1230,370],j29:[1140,500],j30:[990,640],j31:[930,450]};
Object.entries(J).forEach(([id, [x, y]]) => NODES.push({ id, name: "", cat: "junction", x, y, hidden: true }));
NODES.forEach(n => { if (!n.hidden && ((n.id >= 33 && n.id <= 46) || n.id === 29)) n.minor = true; });
// Roads (wide, vehicle) and paths (footpaths). Each chain links consecutive points; metres estimated from map pixels.
const ROADS = [[16,"a1","a2",43],[43,"a3",18],[43,"t1",30,17,31]];
const PATHS = [[16,"f1",32],["a1","w1",9],[9,"j9",11],[11,10],[10,14],[11,"j11",12],[12,13],[12,14],[13,15],[15,14],[10,"j12",1],
  [18,"j13",1],[18,"j15",9],[14,20],[20,"j23",1],[1,38],[38,"j24"],["j24",2],["j24",3],[1,37],[37,"j16"],[45,"j16"],["j16",1],[2,45],
  [1,39],[3,39],[1,40],[40,18],[40,"j31","j26"],["j26",39],["j26",27],[20,"j17",19],[19,22],[22,46],[19,46],
  [46,"j19",5],[5,41],[5,42],[41,36],[42,41],[5,23],[23,"j22",19],[23,2],[3,4],[4,25],[25,26],[26,27],[27,28],[26,34],[34,28],
  [4,24],[24,"j25",6],[6,35],[28,44],[44,"j27",7],[28,7],[7,47],["j27",47],[7,29],[29,33],[44,"j29",8],[43,"j30",8]];
const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
const EDGES = [], ADJ = {};
NODES.forEach(n => ADJ[n.id] = []);
[[ROADS, true], [PATHS, false]].forEach(([set, road]) => set.forEach(chain => {
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i], b = chain[i + 1], A = NODE_BY_ID[a], B = NODE_BY_ID[b];
    const w = Math.max(5, Math.round(Math.hypot(A.x - B.x, A.y - B.y) * 0.35));
    EDGES.push({ a, b, road }); ADJ[a].push({ to: b, w, kind: "walk" }); ADJ[b].push({ to: a, w, kind: "walk" });
  }
}));
