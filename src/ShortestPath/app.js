/* app.js
   Implementa: parsing, dibujo, Floyd-Warshall
   con animación paso a paso y log.
*/

const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const verticesInput = document.getElementById("verticesInput");
const edgesInput = document.getElementById("edgesInput");
const delayInput = document.getElementById("delayInput");
const matrixDisplay = document.getElementById("matrixDisplay");
const logEl = document.getElementById("log");
const runFloydBtn = document.getElementById("runFloyd");
const resetBtn = document.getElementById("resetBtn");
const backBtn = document.getElementById("backBtn");

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- parsing ---------- */
function parseGraph() {
  const vs = verticesInput.value.split(",").map(x => x.trim()).filter(Boolean);
  // edges: format A-B:3 or A-B (implicit weight 1)
  const rawEdges = edgesInput.value.split(",").map(x => x.trim()).filter(Boolean);
  const edges = [];
  for (const r of rawEdges) {
    const [pair, wtxt] = r.split(":").map(s => s && s.trim());
    if (!pair) continue;
    const [a, b] = pair.split("-").map(s => s && s.trim());
    if (!a || !b) continue;
    let w = (wtxt !== undefined && wtxt !== '') ? Number(wtxt) : 1;
    if (isNaN(w)) w = 1;
    edges.push({ a, b, w });
  }
  return { vertices: vs, edges };
}

/* ---------- drawing ---------- */
let nodePos = {};
function computePositions(vertices) {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 70;
  const n = vertices.length || 1;
  const step = (2 * Math.PI) / n;
  nodePos = {};
  vertices.forEach((v, i) => {
    nodePos[v] = {
      x: cx + r * Math.cos(i * step - Math.PI / 2),
      y: cy + r * Math.sin(i * step - Math.PI / 2)
    };
  });
}

function drawLine(x1, y1, x2, y2, highlight = false) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = highlight ? "#d9534f" : "#000";
  ctx.lineWidth = highlight ? 3.2 : 2;
  ctx.stroke();
}

function drawGraph(highlight = { node: null, edge: null }) {
  const { vertices, edges } = parseGraph();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  computePositions(vertices);

  // edges
  edges.forEach(e => {
    const p1 = nodePos[e.a], p2 = nodePos[e.b];
    if (!p1 || !p2) return;
    // check if this edge is highlighted (either direction)
    const isHigh = highlight.edge &&
      ((highlight.edge.a === e.a && highlight.edge.b === e.b) ||
        (highlight.edge.a === e.b && highlight.edge.b === e.a));
    drawLine(p1.x, p1.y, p2.x, p2.y, isHigh);
    // peso mid point
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    ctx.fillStyle = "#000";
    ctx.font = "13px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(String(e.w), mx, my - 6);
  });

  // nodes
  vertices.forEach(v => {
    const p = nodePos[v];
    if (!p) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = (highlight.node === v) ? "#ffee88" : "#fff";
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
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) {
  const p = document.createElement("div");
  p.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
  logEl.prepend(p);
}


/* ---------- ALGORITMOS ---------- */



/* Floyd-Warshall - animado (matriz) */
/* Floyd-Warshall - animado (matriz) */
async function floydWarshall() {
  const delay = Number(delayInput.value) || 600;
  const { vertices, edges } = parseGraph();
  const n = vertices.length;
  const idx = {}; vertices.forEach((v, i) => idx[v] = i);

  // build distance matrix
  const INF = Infinity;
  const D = Array.from({ length: n }, () => Array.from({ length: n }, () => INF));
  for (let i = 0; i < n; i++) D[i][i] = 0;
  edges.forEach(e => {
    const i = idx[e.a], j = idx[e.b];
    if (i === undefined || j === undefined) return;
    if (e.w < D[i][j]) {
      D[i][j] = e.w;
      D[j][i] = e.w; // undirected
    }
  });

  // show initial matrix
  function matrixToText(M) {
    let out = "";
    out += "\t" + vertices.join("\t") + "\n";
    for (let i = 0; i < n; i++) {
      out += vertices[i] + "\t";
      for (let j = 0; j < n; j++) {
        out += (M[i][j] === INF ? "∞" : M[i][j]) + "\t";
      }
      out += "\n";
    }
    return out;
  }
  matrixDisplay.textContent = matrixToText(D);
  log("Floyd-Warshall: inicializada matriz.");

  // main triple loop with animation: highlight k node each outer loop
  for (let k = 0; k < n; k++) {
    const vk = vertices[k];
    log(`Usando k = ${vk} como intermedio`);
    // visually highlight node k
    drawGraph({ node: vk });
    await sleep(delay);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const old = D[i][j];
        if (D[i][k] !== INF && D[k][j] !== INF && D[i][k] + D[k][j] < D[i][j]) {
          D[i][j] = D[i][k] + D[k][j];
          log(`Actualización D[${vertices[i]}][${vertices[j]}]: ${old === INF ? '∞' : old} → ${D[i][j]}`);
          matrixDisplay.textContent = matrixToText(D);
          // highlight path i->k and k->j and mark node j
          drawGraph({ node: vertices[j], edge: { a: vertices[i], b: vertices[k] } });
          await sleep(Math.max(80, delay / 4));
          drawGraph({ node: vertices[j], edge: { a: vertices[k], b: vertices[j] } });
          await sleep(Math.max(80, delay / 4));
        }
      }
    }
    drawGraph();
    await sleep(Math.max(120, delay / 3));
  }

  log("Floyd-Warshall finalizado.");
  matrixDisplay.textContent = matrixToText(D);
}

/* ---------- event bindings ---------- */
resetBtn.addEventListener("click", () => { logEl.innerHTML = ''; matrixDisplay.textContent = '—'; });


runFloydBtn.addEventListener("click", async () => {
  disableControls(true); await floydWarshall(); disableControls(false);
});

/* redraw live while typing */
verticesInput.addEventListener("input", () => drawGraph());
edgesInput.addEventListener("input", () => drawGraph());
window.addEventListener("load", () => drawGraph());

backBtn.addEventListener("click", () => {
  window.electronAPI.navigateTo("src/Index/index.html");
});

function disableControls(dis) {
  verticesInput.disabled = dis;
  edgesInput.disabled = dis;
  runFloydBtn.disabled = dis;
  resetBtn.disabled = dis;
  delayInput.disabled = dis;
}

/* ===================
   SAVE / LOAD (.sp)
   =================== */

async function saveGraphs() {
  const data = {
    vertices: verticesInput.value,
    edges: edgesInput.value,
    delay: delayInput.value
  };

  const json = JSON.stringify(data, null, 2);
  const result = await window.electronAPI.saveFile(json, {
    filters: [{ name: 'Shortest Path File', extensions: ['sp'] }]
  });

  if (!result.success) {
    if (result.error) alert("Error al guardar: " + result.error);
  } else {
    alert("Grafo guardado correctamente (.sp).");
  }
}

async function loadGraphs() {
  const result = await window.electronAPI.openFile({
    filters: [{ name: 'Shortest Path File', extensions: ['sp'] }]
  });

  if (!result.success) {
    if (result.error) alert("Error al abrir: " + result.error);
    return;
  }

  try {
    const data = JSON.parse(result.content);
    verticesInput.value = data.vertices || "";
    edgesInput.value = data.edges || "";
    delayInput.value = data.delay || "600";

    // Redibujar automáticamente
    drawGraph();
    alert("Grafo recuperado correctamente.");
  } catch (e) {
    alert("El archivo no tiene un formato válido.");
  }
}
