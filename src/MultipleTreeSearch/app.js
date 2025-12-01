// app.js
// Migración fiel MultipleTreeSearch -> JS (sin tocar lógica)
// UI + canvas + lista de orden de inserción

document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const canvas = document.getElementById('treeCanvas');
  const ctx = canvas.getContext('2d');
  const inputField = document.getElementById('inputField');
  const insertBtn = document.getElementById('insertBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const searchBtn = document.getElementById('searchBtn');
  const fileInput = document.getElementById('fileInput');
  const volverBtn = document.getElementById('volverBtn');
  const keysListEl = document.getElementById('keysList');

  // appearance - MODIFICADO PARA TEMA RETRO
  const ACCENT = '#716F6F'; // Gris del tema retro
  const ACCENT_BORDER = 'rgba(113, 111, 111, 0.4)'; // Gris semitransparente
  const TEXT_ACCENT = '#000000'; // Texto negro para contraste
  const EDGE_COLOR = '#a0a0a0'; // Gris para bordes
  const HIGHLIGHT_COLOR = 'rgba(113, 111, 111, 0.3)'; // Resaltado sutil
  const NODE_FILL = '#f8f8f8'; // Fondo blanco roto como los paneles
  const NODE_STROKE = '#716F6F'; // Borde gris
  const LETTER_COLOR = '#000000'; // Letras negras
  const insertionOrder = []; // array of {char, bitsStr}

  class TrieNode {
    constructor(level) {
      this.level = level;
      this.letter = '\0';
      this.children = (level < 2) ? new Array(4).fill(null) : new Array(2).fill(null);
    }
    getChild(i) { return (i >= 0 && i < this.children.length) ? this.children[i] : null; }
    ensureChild(i) { if (i < 0 || i >= this.children.length) return null; if (!this.children[i]) this.children[i] = new TrieNode(this.level + 1); return this.children[i]; }
    removeChild(i) { if (i < 0 || i >= this.children.length) return; this.children[i] = null; }
    childrenCount() { return this.children.length; }
    isEmpty() { if (this.letter !== '\0') return false; for (const c of this.children) if (c) return false; return true; }
  }

  // panel holds tree and drawing/layout logic (keeps algorithm identical)
  const panel = {
    root: new TrieNode(0),
    positions: new Map(), // TrieNode -> {x,y}
    targetPositions: new Map(),
    startPositions: new Map(),
    animStartTime: 0,
    animDuration: 300,
    animRunning: false,
    highlight: new Set(),

    // char -> code (identical)
    charToCode: function (ch) {
      if (!ch || ch < 'A' || ch > 'Z') return 0;
      return (ch.charCodeAt(0) - 'A'.charCodeAt(0) + 1) & 0x1F;
    },

    // insertChar (identical)
    insertChar: function (c) {
      const code = this.charToCode(c);
      const b1 = (code >> 3) & 0x3;
      const b2 = (code >> 1) & 0x3;
      const b3 = code & 0x1;
      let cur = this.root;
      cur = cur.ensureChild(b1);
      cur = cur.ensureChild(b2);
      cur = cur.ensureChild(b3);
      cur.letter = c;
    },

    // deleteChar (identical)
    deleteChar: function (c) {
      const code = this.charToCode(c);
      const b1 = (code >> 3) & 0x3;
      const b2 = (code >> 1) & 0x3;
      const b3 = code & 0x1;
      const stack = [];
      let cur = this.root;
      stack.push(cur);
      cur = cur.getChild(b1); if (!cur) return;
      stack.push(cur);
      cur = cur.getChild(b2); if (!cur) return;
      stack.push(cur);
      cur = cur.getChild(b3); if (!cur) return;
      cur.letter = '\0';
      // cleanup up to 3 levels
      for (let i = 0; i < 3; i++) {
        const t = stack.pop();
        const parent = stack[stack.length - 1];
        if (t && t.isEmpty()) {
          for (let j = 0; j < parent.children.length; j++) {
            if (parent.getChild(j) === t) parent.removeChild(j);
          }
        } else break;
      }
    },

    // computeLeafCounts (same logic)
    computeLeafCounts: function (node, map) {
      if (!node) return 0;
      let cnt = 0;
      let hasChild = false;
      for (let i = 0; i < 4; i++) {
        const c = node.getChild(i);
        if (c) { hasChild = true; cnt += this.computeLeafCounts(c, map); }
      }
      if (!hasChild) cnt = 1;
      map.set(node, cnt);
      return cnt;
    },

    assignPositions: function (node, depth, nextXRef, spacing, vSpacing, yRoot, leafCounts, outPositions) {
      if (!node) return;
      let startX = Number.POSITIVE_INFINITY, endX = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < 4; i++) {
        const c = node.getChild(i);
        if (!c) continue;
        this.assignPositions(c, depth + 1, nextXRef, spacing, vSpacing, yRoot, leafCounts, outPositions);
        const pc = outPositions.get(c);
        if (pc) {
          if (pc.x < startX) startX = pc.x;
          if (pc.x > endX) endX = pc.x;
        }
      }
      let x;
      if (startX === Number.POSITIVE_INFINITY) {
        x = nextXRef[0];
        nextXRef[0] += spacing;
      } else {
        x = Math.floor((startX + endX) / 2);
      }
      const y = yRoot + depth * vSpacing;
      outPositions.set(node, { x: x, y: y });
    },

    computePositions: function () {
      const tempPositions = new Map();
      if (!this.root) return;
      const w = canvas.width;
      const yRoot = 80;
      const verticalSpacing = 130;
      const leafCounts = new Map();
      this.computeLeafCounts(this.root, leafCounts);
      const nextX = [60];
      this.assignPositions(this.root, 0, nextX, 120, verticalSpacing, yRoot, leafCounts, tempPositions);

      // center tree inside canvas left area
      let minX = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY;
      for (const p of tempPositions.values()) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; }
      if (minX === Number.POSITIVE_INFINITY) return;
      const treeMid = Math.floor((minX + maxX) / 2);
      const centerX = Math.floor(w / 2.4); // bias left area a bit
      const shift = centerX - treeMid;
      if (shift !== 0) {
        const shifted = new Map();
        for (const [k, p] of tempPositions.entries()) shifted.set(k, { x: p.x + shift, y: p.y });
        this.targetPositions = shifted;
      } else {
        this.targetPositions = tempPositions;
      }

      if (this.positions.size === 0) {
        this.positions = new Map(this.targetPositions);
        return;
      }

      // animate layout change
      this.startPositions.clear();
      for (const [n, tp] of this.targetPositions.entries()) {
        const sp = this.positions.get(n) || { x: tp.x, y: tp.y };
        this.startPositions.set(n, { x: sp.x, y: sp.y });
      }
      this.animStartTime = performance.now();
      this.animRunning = true;
      this.animateLayout();
    },

    animateLayout: function () {
      const now = performance.now();
      const elapsed = now - this.animStartTime;
      let t = elapsed / this.animDuration;
      if (t > 1) t = 1;
      for (const [n, tp] of this.targetPositions.entries()) {
        const sp = this.startPositions.get(n) || tp;
        const ix = Math.round(sp.x + (tp.x - sp.x) * t);
        const iy = Math.round(sp.y + (tp.y - sp.y) * t);
        this.positions.set(n, { x: ix, y: iy });
      }
      this.repaint();
      if (t < 1) requestAnimationFrame(() => this.animateLayout());
      else {
        // finalize
        const keep = new Set(Array.from(this.targetPositions.keys()));
        for (const k of Array.from(this.positions.keys())) if (!keep.has(k)) this.positions.delete(k);
        for (const [k, p] of this.targetPositions.entries()) this.positions.set(k, p);
        this.animRunning = false;
        this.repaint();
      }
    },

    recomputeAndRepaint: function () {
      this.computePositions();
      this.repaint();
      updateKeysList(); // update sidebar each recompute (reflect current insertion order)
    },

    // draw edges and nodes
    repaint: function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // background is page background, draw edges then nodes
      this.drawEdges(this.root);
      this.drawNodes();
    },

    drawEdges: function (node) {
      if (!node) return;
      const p = this.positions.get(node);
      if (!p) return;
      const maxChildren = node.childrenCount();
      for (let i = 0; i < maxChildren; i++) {
        const child = node.getChild(i);
        if (!child) continue;
        const pc = this.positions.get(child);
        if (!pc) continue;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 22);
        ctx.lineTo(pc.x, pc.y - 22);
        ctx.strokeStyle = EDGE_COLOR;
        ctx.lineWidth = 2;
        ctx.stroke();

        // label edge with bit value depending on level/idx (same mapping used earlier)
        const label = this.edgeLabelFor(node.level, i);
        ctx.fillStyle = '#666666'; // Gris oscuro para etiquetas
        ctx.font = '12px Tahoma, sans-serif'; // Fuente retro
        const mx = (p.x + pc.x) / 2;
        const my = (p.y + 22 + pc.y - 22) / 2 - 6;
        ctx.fillText(label, mx - 6, my);
        this.drawEdges(child);
      }
    },

    edgeLabelFor: function (level, idx) {
      if (level === 0 || level === 1) {
        const labels = ['00', '01', '10', '11'];
        return labels[idx] || String(idx);
      } else {
        return String(idx);
      }
    },

    drawNodes: function () {
      for (const [node, p] of this.positions.entries()) {
        const isHighlighted = this.highlight.has(node);

        // Nodo con efecto de relieve
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);

        // Fondo del nodo con gradiente para efecto 3D
        const gradient = ctx.createRadialGradient(p.x - 3, p.y - 3, 5, p.x, p.y, 26);
        gradient.addColorStop(0, isHighlighted ? '#e0e0e0' : '#f8f8f8');
        gradient.addColorStop(1, isHighlighted ? '#c8c8c8' : '#e8e8e8');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Borde con efecto de relieve
        ctx.lineWidth = 2;
        if (isHighlighted) {
          ctx.strokeStyle = '#000000'; // Borde negro para resaltado
          ctx.lineWidth = 3;
        } else {
          // Efecto de borde biselado
          ctx.strokeStyle = '#ffffff';
          ctx.setLineDash([]);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
          ctx.strokeStyle = '#a0a0a0';
          ctx.stroke();
        }
        ctx.stroke();

        // letter if any
        if (node.letter && node.letter !== '\0') {
          ctx.fillStyle = LETTER_COLOR;
          ctx.font = 'bold 18px Tahoma, sans-serif'; // Fuente retro
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.letter, p.x, p.y);
        }
      }
    },

    // build path for animation (exact same bit-path logic)
    buildPathForAnimation: function (letter) {
      const path = [];
      if (!this.root) return path;
      const c = letter.toUpperCase();
      if (c < 'A' || c > 'Z') return path;
      const code = this.charToCode(c);
      const b1 = (code >> 3) & 0x3;
      const b2 = (code >> 1) & 0x3;
      const b3 = code & 0x1;
      let cur = this.root;
      path.push(cur);
      const c1 = cur.getChild(b1);
      path.push(c1);
      if (!c1) return path;
      const c2 = c1.getChild(b2);
      path.push(c2);
      if (!c2) return path;
      const c3 = c2.getChild(b3);
      path.push(c3);
      return path;
    },

    animateSearch: function (letter) {
      const path = this.buildPathForAnimation(letter);
      if (!path || path.length === 0) return;
      let i = 0;
      const stepms = 440;
      this.highlight.clear();
      this.repaint();
      const timer = setInterval(() => {
        if (i >= path.length) {
          clearInterval(timer);
          if (path[path.length - 1]) {
            this.highlight.clear();
            this.highlight.add(path[path.length - 1]);
            this.repaint();
          }
          return;
        }
        this.highlight.clear();
        const node = path[i];
        if (node) this.highlight.add(node);
        this.repaint();
        i++;
      }, stepms);
    }
  }; // panel

  // canvas sizing to fill left panel
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(800, Math.floor(rect.width - 0));
    canvas.height = Math.max(540, Math.floor(rect.height - 0));
    panel.recomputeAndRepaint();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // helpers: update insertion order list UI
  function bitsStringFor(ch) {
    const code = panel.charToCode(ch);
    let s = code.toString(2);
    if (s.length < 5) s = '0'.repeat(5 - s.length) + s;
    return s;
  }

  function updateKeysList() {
    keysListEl.innerHTML = '';
    // show in order of insertion, last inserted at bottom (as in image)
    for (let i = 0; i < insertionOrder.length; i++) {
      const it = insertionOrder[i];
      const row = document.createElement('div');
      row.className = 'letter-list-item';
      const left = document.createElement('span');
      left.className = 'letter-char';
      left.textContent = it.char;
      const right = document.createElement('span');
      right.className = 'letter-bits';
      right.textContent = " → " + it.bits;
      row.appendChild(left);
      row.appendChild(right);
      keysListEl.appendChild(row);
    }
  }

  // functions that mirror Java behavior for string insertion/deletion (same flow)
  function insertString(s) {
    const text = (s || '').toUpperCase();
    for (const ch of text) {
      if (ch < 'A' || ch > 'Z') continue;
      panel.insertChar(ch);
      insertionOrder.push({ char: ch, bits: bitsStringFor(ch) });
    }
    panel.recomputeAndRepaint();
  }

  function deleteString(s) {
    const text = (s || '').toUpperCase();
    for (const ch of text) {
      if (ch < 'A' || ch > 'Z') continue;
      panel.deleteChar(ch);
      // remove first occurrence in insertionOrder of that char (to mimic removing inserted record)
      const idx = insertionOrder.findIndex(e => e.char === ch);
      if (idx !== -1) insertionOrder.splice(idx, 1);
    }
    panel.recomputeAndRepaint();
  }

  // save/load (JSON) — same as previous implementation (non-invasive)
  function saveToFile() {
    function nodeToObj(n) {
      if (!n) return null;
      return {
        level: n.level,
        letter: n.letter,
        children: n.children.map(c => nodeToObj(c))
      };
    }
    const obj = nodeToObj(panel.root);
    const blob = new Blob([JSON.stringify({ root: obj, order: insertionOrder })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tree.mul.json'; a.click();
    URL.revokeObjectURL(a.href);
  }

  function loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        function objToNode(o) {
          if (!o) return null;
          const n = new TrieNode(o.level || 0);
          n.letter = o.letter || '\0';
          n.children = (n.level < 2) ? new Array(4).fill(null) : new Array(2).fill(null);
          if (Array.isArray(o.children)) {
            for (let i = 0; i < n.children.length && i < o.children.length; i++) {
              n.children[i] = objToNode(o.children[i]);
              if (n.children[i]) n.children[i].level = n.level + 1;
            }
          }
          return n;
        }
        panel.root = objToNode(parsed.root) || new TrieNode(0);
        insertionOrder.length = 0;
        if (Array.isArray(parsed.order)) {
          for (const it of parsed.order) insertionOrder.push(it);
        }
        panel.recomputeAndRepaint();
      } catch (err) { alert('Error cargando archivo: ' + err.message); }
    };
    reader.readAsText(file);
  }

  // UI event handlers (matching Java buttons semantics)
  insertBtn.addEventListener('click', () => {
    const s = inputField.value.trim();
    if (!s) return;
    insertString(s);
    inputField.value = '';
    updateKeysList();
  });

  deleteBtn.addEventListener('click', () => {
    const s = inputField.value.trim();
    if (!s) return;
    deleteString(s);
    inputField.value = '';
    updateKeysList();
  });

  clearBtn.addEventListener('click', () => {
    panel.root = new TrieNode(0);
    insertionOrder.length = 0;
    panel.positions.clear(); panel.targetPositions.clear(); panel.startPositions.clear();
    panel.recomputeAndRepaint();
    updateKeysList();
  });

  saveBtn.addEventListener('click', () => saveToFile());
  loadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    loadFromFile(f);
    fileInput.value = '';
  });

  searchBtn.addEventListener('click', () => {
    const s = inputField.value.trim().toUpperCase();
    if (!s || s.length === 0) { alert('Escribe la clave a buscar (una letra).'); return; }
    const c = s.charAt(0);
    panel.animateSearch(c);
  });

  volverBtn.addEventListener('click', () => {
    window.electronAPI.navigateTo('src/Index/index.html');
  });

  // expose some helpers for debugging
  window._treePanel = panel;
  window._insertionOrder = insertionOrder;

  // initial draw
  panel.recomputeAndRepaint();
  updateKeysList();
  // ensure canvas sizing correct
  resizeCanvas();
});