/* app.js
   Implementa: parsing, dibujo, Bellman-Ford, Dijkstra, Floyd-Warshall
   con animación paso a paso y log.
*/

const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const verticesInput = document.getElementById("verticesInput");
const edgesInput = document.getElementById("edgesInput");
const startNodeInput = document.getElementById("startNode");
const delayInput = document.getElementById("delayInput");
const distancesDisplay = document.getElementById("distancesDisplay");
const matrixDisplay = document.getElementById("matrixDisplay");
const logEl = document.getElementById("log");
const runBellmanBtn = document.getElementById("runBellman");
const runDijkstraBtn = document.getElementById("runDijkstra");
const runFloydBtn = document.getElementById("runFloyd");
const drawBtn = document.getElementById("drawBtn");
const resetBtn = document.getElementById("resetBtn");
const backBtn = document.getElementById("backBtn");

function resizeCanvas(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- parsing ---------- */
function parseGraph(){
  const vs = verticesInput.value.split(",").map(x=>x.trim()).filter(Boolean);
  // edges: format A-B:3 or A-B (implicit weight 1)
  const rawEdges = edgesInput.value.split(",").map(x=>x.trim()).filter(Boolean);
  const edges = [];
  for(const r of rawEdges){
    const [pair, wtxt] = r.split(":").map(s=>s && s.trim());
    if(!pair) continue;
    const [a,b] = pair.split("-").map(s=>s && s.trim());
    if(!a || !b) continue;
    const w = (wtxt !== undefined && wtxt !== '') ? Number(wtxt) : 1;
    edges.push({a,b,w});
  }
  return { vertices: vs, edges };
}

/* ---------- drawing ---------- */
let nodePos = {};
function computePositions(vertices){
  const cx = canvas.width/2, cy = canvas.height/2;
  const r = Math.min(cx, cy) - 70;
  const n = vertices.length || 1;
  const step = (2*Math.PI) / n;
  nodePos = {};
  vertices.forEach((v,i)=>{
    nodePos[v] = {
      x: cx + r * Math.cos(i*step - Math.PI/2),
      y: cy + r * Math.sin(i*step - Math.PI/2)
    };
  });
}

function drawArrow(x1,y1,x2,y2, highlight=false){
  const headlen = 10;
  const angle = Math.atan2(y2-y1, x2-x1);
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.strokeStyle = highlight ? "#d9534f" : "#000";
  ctx.lineWidth = highlight ? 3.2 : 2;
  ctx.stroke();

  // arrow head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headlen*Math.cos(angle - Math.PI/6), y2 - headlen*Math.sin(angle - Math.PI/6));
  ctx.lineTo(x2 - headlen*Math.cos(angle + Math.PI/6), y2 - headlen*Math.sin(angle + Math.PI/6));
  ctx.closePath();
  ctx.fillStyle = highlight ? "#d9534f" : "#000";
  ctx.fill();
}

function drawGraph(highlight = { node:null, edge:null }){
  const { vertices, edges } = parseGraph();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  computePositions(vertices);

  // edges
  edges.forEach(e=>{
    const p1 = nodePos[e.a], p2 = nodePos[e.b];
    if(!p1||!p2) return;
    drawArrow(p1.x, p1.y, p2.x, p2.y, highlight.edge && highlight.edge.a===e.a && highlight.edge.b===e.b);
    // peso mid point
    const mx = (p1.x + p2.x)/2, my = (p1.y + p2.y)/2;
    ctx.fillStyle = "#000";
    ctx.font = "13px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(String(e.w), mx, my - 6);
  });

  // nodes
  vertices.forEach(v=>{
    const p = nodePos[v];
    if(!p) return;
    ctx.beginPath();
    ctx.arc(p.x,p.y,22,0,Math.PI*2);
    ctx.fillStyle = (highlight.node===v) ? "#ffee88" : "#fff";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "16px Tahoma";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(v, p.x, p.y);
  });
}

/* ---------- utilities ---------- */
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function log(msg){
  const p = document.createElement("div");
  p.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
  logEl.prepend(p);
}
function showDistances(dist){
  // dist: object vertex->value or 2D matrix
  if(!dist || typeof dist !== 'object'){ distancesDisplay.innerText = '—'; return; }
  const keys = Object.keys(dist);
  if(keys.length && typeof dist[keys[0]] === 'number'){
    // single-source distances
    distancesDisplay.innerHTML = '';
    keys.forEach(k=>{
      const d = dist[k] === Infinity ? '∞' : dist[k];
      const row = document.createElement('div');
      row.textContent = `${k} : ${d}`;
      distancesDisplay.appendChild(row);
    });
  }
}

/* ---------- ALGORITMOS ---------- */

/* Bellman-Ford - animado */
async function bellmanFord(){
  const delay = Number(delayInput.value) || 600;
  const { vertices, edges } = parseGraph();
  const start = startNodeInput.value.trim();
  if(!vertices.includes(start)){ alert("Nodo inicial no válido."); return; }
  // init
  const dist = {}; vertices.forEach(v=>dist[v]=Infinity);
  dist[start]=0;
  showDistances(dist);
  log(`Bellman-Ford iniciado desde ${start}`);

  drawGraph();
  // relax V-1 veces
  const V = vertices.length;
  for(let iter=1; iter<=V-1; iter++){
    let any = false;
    log(`Iteración ${iter}`);
    for(const e of edges){
      // highlight edge and target node
      drawGraph({ node: e.b, edge: e });
      await sleep(delay);
      const u = e.a, v = e.b, w = e.w;
      if(dist[u] !== Infinity && dist[u] + w < dist[v]){
        const old = dist[v];
        dist[v] = dist[u] + w;
        any = true;
        log(`Relajación: ${u}->${v} (${old} → ${dist[v]})`);
        showDistances(dist);
        // highlight change briefly
        drawGraph({ node: v, edge: e });
        await sleep(Math.max(120, delay/2));
      } else {
        // no cambio
        // small flash
        await sleep( Math.min(120, delay/4) );
      }
      drawGraph();
    }
    if(!any){ log("No hubo cambios — terminado antes"); break; }
  }

  // check negative cycle
  let neg = false;
  for(const e of edges){
    if(dist[e.a] !== Infinity && dist[e.a] + e.w < dist[e.b]){
      neg = true; break;
    }
  }
  if(neg){
    log("Se detectó ciclo negativo. Resultados no válidos.");
    alert("Se detectó ciclo negativo en el grafo.");
  } else {
    log("Bellman-Ford finalizado (sin ciclos negativos).");
  }
  showDistances(dist);
  drawGraph();
}

/* Dijkstra - animado (dirigido, pesos >= 0) */
async function dijkstra(){
  const delay = Number(delayInput.value) || 600;
  const { vertices, edges } = parseGraph();
  const start = startNodeInput.value.trim();
  if(!vertices.includes(start)){ alert("Nodo inicial no válido."); return; }
  // build adjacency list
  const adj = {};
  vertices.forEach(v=> adj[v]=[]);
  edges.forEach(e=> { if(adj[e.a]) adj[e.a].push ? adj[e.a].push({to:e.b,w:e.w}) : adj[e.a].push({to:e.b,w:e.w}) ; });

  // init
  const dist = {}; const prev = {};
  const Q = new Set();
  vertices.forEach(v=>{ dist[v]=Infinity; prev[v]=null; Q.add(v); });
  dist[start]=0;
  showDistances(dist);
  log(`Dijkstra iniciado desde ${start}`);

  while(Q.size){
    // pick min dist in Q
    let u=null, best=Infinity;
    for(const v of Q){
      if(dist[v]<best){ best=dist[v]; u=v; }
    }
    if(u===null) break;
    Q.delete(u);

    // highlight extracted node
    log(`Tomando nodo con menor distancia: ${u} (d=${dist[u]===Infinity?'∞':dist[u]})`);
    drawGraph({ node: u });
    await sleep(delay);

    // relax neighbors
    const neighs = adj[u] || [];
    for(const nb of neighs){
      const v = nb.to, w=nb.w;
      // highlight edge u->v
      drawGraph({ node: v, edge: {a:u,b:v} });
      await sleep(Math.max(120, delay/2));
      if(dist[u] !== Infinity && dist[u] + w < dist[v]){
        const old = dist[v];
        dist[v] = dist[u] + w;
        prev[v] = u;
        log(`Relajación: ${u}->${v} (${old} → ${dist[v]})`);
        showDistances(dist);
        // brief highlight
        drawGraph({ node: v, edge: {a:u,b:v} });
        await sleep(Math.max(120, delay/2));
      }
      drawGraph();
    }
  }

  log("Dijkstra finalizado.");
  showDistances(dist);
  drawGraph();
}

/* Floyd-Warshall - animado (matriz) */
async function floydWarshall(){
  const delay = Number(delayInput.value) || 600;
  const { vertices, edges } = parseGraph();
  const n = vertices.length;
  const idx = {}; vertices.forEach((v,i)=> idx[v]=i);

  // build distance matrix
  const INF = 1e12;
  const D = Array.from({length:n}, ()=> Array.from({length:n}, ()=> INF));
  for(let i=0;i<n;i++) D[i][i]=0;
  edges.forEach(e=>{
    const i=idx[e.a], j=idx[e.b];
    if(i===undefined||j===undefined) return;
    if(e.w < D[i][j]) D[i][j] = e.w; // keep smallest if duplicates
  });

  // show initial matrix
  function matrixToText(M){
    let out = "";
    out += "\t" + vertices.join("\t") + "\n";
    for(let i=0;i<n;i++){
      out += vertices[i] + "\t";
      for(let j=0;j<n;j++){
        out += (M[i][j] >= INF ? "∞" : M[i][j]) + "\t";
      }
      out += "\n";
    }
    return out;
  }
  matrixDisplay.textContent = matrixToText(D);
  log("Floyd-Warshall: inicializada matriz.");

  // main triple loop with animation: highlight k node each outer loop
  for(let k=0;k<n;k++){
    const vk = vertices[k];
    log(`Usando k = ${vk} como intermedio`);
    // visually highlight node k
    drawGraph({ node: vk });
    await sleep(delay);

    for(let i=0;i<n;i++){
      for(let j=0;j<n;j++){
        const old = D[i][j];
        if(D[i][k] + D[k][j] < D[i][j]){
          D[i][j] = D[i][k] + D[k][j];
          log(`Actualización D[${vertices[i]}][${vertices[j]}]: ${old === INF ? '∞' : old} → ${D[i][j]}`);
          matrixDisplay.textContent = matrixToText(D);
          // highlight path i->k and k->j and mark node j
          drawGraph({ node: vertices[j], edge: {a: vertices[i], b: vertices[k]} });
          await sleep(Math.max(80, delay/4));
          drawGraph({ node: vertices[j], edge: {a: vertices[k], b: vertices[j]} });
          await sleep(Math.max(80, delay/4));
        }
      }
    }
    drawGraph();
    await sleep(Math.max(120, delay/3));
  }

  log("Floyd-Warshall finalizado.");
  matrixDisplay.textContent = matrixToText(D);
}

/* ---------- event bindings ---------- */
drawBtn.addEventListener("click", ()=> drawGraph());
resetBtn.addEventListener("click", ()=> { logEl.innerHTML=''; matrixDisplay.textContent='—'; distancesDisplay.innerHTML=''; });

runBellmanBtn.addEventListener("click", async ()=>{
  disableControls(true); await bellmanFord(); disableControls(false);
});
runDijkstraBtn.addEventListener("click", async ()=>{
  disableControls(true); await dijkstra(); disableControls(false);
});
runFloydBtn.addEventListener("click", async ()=>{
  disableControls(true); await floydWarshall(); disableControls(false);
});

/* redraw live while typing */
verticesInput.addEventListener("input", () => drawGraph());
edgesInput.addEventListener("input", () => drawGraph());
window.addEventListener("load", () => drawGraph());

backBtn.addEventListener("click", () => {
  window.electronAPI.navigateTo("src/Index/index.html");
});

function disableControls(dis){
  [runBellmanBtn, runDijkstraBtn, runFloydBtn, drawBtn, resetBtn].forEach(b=>b.disabled = dis);
  verticesInput.disabled = dis;
  edgesInput.disabled = dis;
  startNodeInput.disabled = dis;
  delayInput.disabled = dis;
}
