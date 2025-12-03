const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  window.electronAPI.navigateTo("src/Index/index.html");
});

/* ===================
   STATE
   =================== */

let edgesListG1 = [];
let edgesListG2 = [];

/* ===================
   PARSER DE GRAFOS
   =================== */

function generateVertexNames(count) {
  const names = [];
  for (let i = 0; i < count; i++) {
    let name = '';
    let n = i;
    while (n >= 0) {
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    }
    names.push(name);
  }
  return names;
}

function parseVertices(input) {
  const count = parseInt(input, 10);
  if (!isNaN(count)) {
    return generateVertexNames(count);
  }
  if (!input.trim()) return [];
  return input.split(",").map(v => v.trim());
}

function makeGraph(v, e) {
  return { vertices: v, edges: e };
}

/* ===================
   EDGE MANAGEMENT
   =================== */

function addEdge(graphId, from, to) {
  from = from.trim().toUpperCase();
  to = to.trim().toUpperCase();

  if (!from || !to) {
    alert('Por favor ingrese ambos vértices');
    return;
  }

  const edgesList = graphId === 1 ? edgesListG1 : edgesListG2;
  edgesList.push({ a: from, b: to });

  renderEdgeList(graphId);
  updateGraphs();

  // Clear inputs
  const fromInput = document.getElementById(`v${graphId}-from`);
  const toInput = document.getElementById(`v${graphId}-to`);
  fromInput.value = '';
  toInput.value = '';
  fromInput.focus();
}

function removeEdge(graphId, index) {
  const edgesList = graphId === 1 ? edgesListG1 : edgesListG2;
  edgesList.splice(index, 1);
  renderEdgeList(graphId);
  updateGraphs();
}

function renderEdgeList(graphId) {
  const listEl = document.getElementById(`listE${graphId}`);
  const edgesList = graphId === 1 ? edgesListG1 : edgesListG2;

  if (edgesList.length === 0) {
    listEl.innerHTML = '<span style="color:var(--muted);">Sin aristas</span>';
    return;
  }

  listEl.innerHTML = edgesList.map((e, i) =>
    `<span class="edge-item" onclick="removeEdge(${graphId}, ${i})" title="Click para eliminar">${e.a}-${e.b}</span>`
  ).join(' ');
}

/* ===================
   OPERACIONES ENTRE GRAFOS
   =================== */

function union(G, H) {
  return {
    vertices: [...new Set([...G.vertices, ...H.vertices])],
    edges: [...new Set([...G.edges.map(x => x.a + "-" + x.b), ...H.edges.map(x => x.a + "-" + x.b)])]
      .map(e => { const [a, b] = e.split("-"); return { a, b }; })
  };
}

function intersection(G, H) {
  const setH = new Set(H.edges.map(x => x.a + "-" + x.b));
  return {
    vertices: G.vertices.filter(v => H.vertices.includes(v)),
    edges: G.edges.filter(x => setH.has(x.a + "-" + x.b))
  };
}

function xor(G, H) {
  const gSet = new Set(G.edges.map(x => x.a + "-" + x.b));
  const hSet = new Set(H.edges.map(x => x.a + "-" + x.b));
  const res = [];

  gSet.forEach(e => { if (!hSet.has(e)) res.push(e); });
  hSet.forEach(e => { if (!gSet.has(e)) res.push(e); });

  return {
    vertices: [...new Set([...G.vertices, ...H.vertices])],
    edges: res.map(e => { const [a, b] = e.split("-"); return { a, b }; })
  };
}

function join(G, H) {
  const edges = [];

  // agregar las de G y H
  edges.push(...G.edges, ...H.edges);

  // conectar todos los vértices
  G.vertices.forEach(a => {
    H.vertices.forEach(b => {
      edges.push({ a, b });
    });
  });

  return {
    vertices: [...G.vertices, ...H.vertices],
    edges
  };
}

function tensor(G, H) {
  const verts = [];
  const edges = [];

  // vértices como pares
  G.vertices.forEach(u => {
    H.vertices.forEach(v => verts.push(`${u}|${v}`));
  });

  // aristas si ambas aristas existen en G y H
  G.edges.forEach(e1 => {
    H.edges.forEach(e2 => {
      edges.push({
        a: `${e1.a}|${e2.a}`,
        b: `${e1.b}|${e2.b}`
      });
    });
  });

  return { vertices: verts, edges };
}

function cartesian(G, H) {
  const verts = [];
  const edges = [];

  G.vertices.forEach(u => {
    H.vertices.forEach(v => verts.push(`${u}|${v}`));
  });

  // cambiar un componente
  G.edges.forEach(e => {
    H.vertices.forEach(v => {
      edges.push({
        a: `${e.a}|${v}`,
        b: `${e.b}|${v}`
      });
    });
  });

  H.edges.forEach(e => {
    G.vertices.forEach(u => {
      edges.push({
        a: `${u}|${e.a}`,
        b: `${u}|${e.b}`
      });
    });
  });

  return { vertices: verts, edges };
}

function compose(G, H) {
  const verts = [];
  const edges = [];

  G.vertices.forEach(u => {
    H.vertices.forEach(v => verts.push(`${u}|${v}`));
  });

  // si u1 conectado con u2 → unir TODAS las copias
  G.edges.forEach(e => {
    H.vertices.forEach(v1 => {
      H.vertices.forEach(v2 => {
        edges.push({
          a: `${e.a}|${v1}`,
          b: `${e.b}|${v2}`
        });
      });
    });
  });

  // si u igual → aristas internas de H
  G.vertices.forEach(u => {
    H.edges.forEach(e => {
      edges.push({
        a: `${u}|${e.a}`,
        b: `${u}|${e.b}`
      });
    });
  });

  return { vertices: verts, edges };
}

/* ===================
   DRAW
   =================== */

function drawGraph(canvas, graph) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  ctx.clearRect(0, 0, W, H);

  const n = graph.vertices.length;
  if (n === 0) return;

  const radius = Math.min(W, H) / 2.5;
  const cx = W / 2;
  const cy = H / 2;

  // posiciones circulares
  const pos = {};
  graph.vertices.forEach((v, i) => {
    const angle = (2 * Math.PI * i) / n;
    pos[v] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  // aristas
  ctx.strokeStyle = "#333";
  graph.edges.forEach(e => {
    if (!pos[e.a] || !pos[e.b]) return;
    ctx.beginPath();
    ctx.moveTo(pos[e.a].x, pos[e.a].y);
    ctx.lineTo(pos[e.b].x, pos[e.b].y);
    ctx.stroke();
  });

  // vértices
  graph.vertices.forEach(v => {
    const p = pos[v];
    ctx.beginPath();
    ctx.fillStyle = "#f0f0f0";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "14px Tahoma";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(v, p.x, p.y);
  });
}

/* ===================
   REAL-TIME UPDATE
   =================== */

function updateGraphs() {
  const v1 = document.getElementById('v1');
  const v2 = document.getElementById('v2');

  const G1 = makeGraph(parseVertices(v1.value), edgesListG1);
  const G2 = makeGraph(parseVertices(v2.value), edgesListG2);

  drawGraph(document.getElementById("canvas1"), G1);
  drawGraph(document.getElementById("canvas2"), G2);
}

['v1', 'v2'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateGraphs);
});

// Add edge button listeners
document.getElementById('btnAddE1').addEventListener('click', () => {
  const from = document.getElementById('v1-from').value;
  const to = document.getElementById('v1-to').value;
  addEdge(1, from, to);
});

document.getElementById('btnAddE2').addEventListener('click', () => {
  const from = document.getElementById('v2-from').value;
  const to = document.getElementById('v2-to').value;
  addEdge(2, from, to);
});

// Enter key support
['v1-from', 'v1-to'].forEach(id => {
  document.getElementById(id).addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnAddE1').click();
  });
});

['v2-from', 'v2-to'].forEach(id => {
  document.getElementById(id).addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnAddE2').click();
  });
});

window.addEventListener('load', () => {
  updateGraphs();
  renderEdgeList(1);
  renderEdgeList(2);
});

/* ===================
   MAIN
   =================== */

function operate(type) {
  const G1 = makeGraph(
    parseVertices(v1.value),
    edgesListG1
  );

  const G2 = makeGraph(
    parseVertices(v2.value),
    edgesListG2
  );

  let R = null;

  switch (type) {
    case "union": R = union(G1, G2); break;
    case "intersect": R = intersection(G1, G2); break;
    case "xor": R = xor(G1, G2); break;
    case "join": R = join(G1, G2); break;
    case "tensor": R = tensor(G1, G2); break;
    case "cartesian": R = cartesian(G1, G2); break;
    case "compose": R = compose(G1, G2); break;
  }

  drawGraph(document.getElementById("canvas1"), G1);
  drawGraph(document.getElementById("canvas2"), G2);
  drawGraph(document.getElementById("canvasResult"), R);
}

/* ===================
   SAVE / LOAD
   =================== */

async function saveGraphs() {
  const data = {
    v1: document.getElementById('v1').value,
    v2: document.getElementById('v2').value,
    edgesG1: edgesListG1,
    edgesG2: edgesListG2
  };

  const json = JSON.stringify(data, null, 2);
  const result = await window.electronAPI.saveFile(json, {
    filters: [{ name: 'Graph Operations File', extensions: ['gop'] }]
  });

  if (!result.success) {
    if (result.error) alert("Error al guardar: " + result.error);
  } else {
    alert("Grafos guardados correctamente.");
  }
}

async function loadGraphs() {
  const result = await window.electronAPI.openFile({
    filters: [{ name: 'Graph Operations File', extensions: ['gop'] }]
  });

  if (!result.success) {
    if (result.error) alert("Error al abrir: " + result.error);
    return;
  }

  try {
    const data = JSON.parse(result.content);
    document.getElementById('v1').value = data.v1 || "";
    document.getElementById('v2').value = data.v2 || "";

    edgesListG1 = data.edgesG1 || [];
    edgesListG2 = data.edgesG2 || [];

    renderEdgeList(1);
    renderEdgeList(2);
    updateGraphs();
    alert("Grafos recuperados correctamente.");
  } catch (e) {
    alert("El archivo no tiene un formato válido.");
  }
}

/* ===================
   PRINT
   =================== */

function printGraphs() {
  const element = document.getElementById('graphsContainer');
  if (!element) return;

  html2canvas(element).then(async canvas => {
    const imgData = canvas.toDataURL('image/png');

    // Use the exposed Electron API to print
    const result = await window.electronAPI.printImage(imgData);

    if (result.status === 'printed') {
      // Success (silent or dialog)
      console.log('Print success');
    } else if (result.status === 'cancelled') {
      console.log('Print cancelled');
    } else if (result.status === 'saved') {
      alert('Guardado como PDF en: ' + result.filePath);
    } else if (result.status === 'error') {
      console.error('Print error:', result.message);
      alert('Error al imprimir: ' + result.message);
    }
  }).catch(err => {
    console.error("Error generating image for print:", err);
    alert("Error al generar la imagen para imprimir.");
  });
}
