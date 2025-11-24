const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  window.electronAPI.navigateTo("src/Index/index.html");
});

/* ===================
   PARSER DE GRAFOS
   =================== */

function parseVertices(text) {
  if (!text.trim()) return [];
  return text.split(",").map(v => v.trim());
}

function parseEdges(text) {
  if (!text.trim()) return [];
  return text.split(",").map(e => {
    const [a, b] = e.split("-").map(x => x.trim());
    return { a, b };
  });
}

function makeGraph(v, e) {
  return { vertices: v, edges: e };
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
  const e1 = document.getElementById('e1');
  const v2 = document.getElementById('v2');
  const e2 = document.getElementById('e2');

  const G1 = makeGraph(parseVertices(v1.value), parseEdges(e1.value));
  const G2 = makeGraph(parseVertices(v2.value), parseEdges(e2.value));

  drawGraph(document.getElementById("canvas1"), G1);
  drawGraph(document.getElementById("canvas2"), G2);
}

['v1', 'e1', 'v2', 'e2'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateGraphs);
});

window.addEventListener('load', updateGraphs);

/* ===================
   MAIN
   =================== */

function operate(type) {
  const G1 = makeGraph(
    parseVertices(v1.value),
    parseEdges(e1.value)
  );

  const G2 = makeGraph(
    parseVertices(v2.value),
    parseEdges(e2.value)
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
    e1: document.getElementById('e1').value,
    v2: document.getElementById('v2').value,
    e2: document.getElementById('e2').value
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
    document.getElementById('e1').value = data.e1 || "";
    document.getElementById('v2').value = data.v2 || "";
    document.getElementById('e2').value = data.e2 || "";
    updateGraphs();
    alert("Grafos recuperados correctamente.");
  } catch (e) {
    alert("El archivo no tiene un formato válido.");
  }
}
