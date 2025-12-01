// ----------------- Lógica de Huffman -----------------
let counts = {};  // mapa char -> frecuencia
let seqCounter = 0;

class Node {
    constructor(ch, count, seq) {
        this.ch = ch;
        this.count = count;
        this.seq = seq;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
    isLeaf() { return !this.left && !this.right; }
}

// Comparador igual que en Java: primero por count, luego por seq
function nodeCompare(a, b) {
    if (a.count !== b.count) return a.count - b.count;
    return a.seq - b.seq;
}

function buildHuffmanTree() {
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;

    seqCounter = 0;
    let pq = entries.map(([ch, count]) => new Node(ch, count, seqCounter++));

    // Si solo hay un carácter, crear nodo padre ficticio
    if (pq.length === 1) {
        const only = pq[0];
        const root = new Node(null, only.count, seqCounter++);
        root.left = only;
        pq = [root];
    }

    while (pq.length > 1) {
        pq.sort(nodeCompare); // mantener orden estable
        const a = pq.shift();
        const b = pq.shift();
        const parent = new Node(null, a.count + b.count, seqCounter++);
        parent.left = a;
        parent.right = b;
        pq.push(parent);
    }
    return pq[0];
}

// ----------------- Dibujo en Canvas -----------------
const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawTree(buildHuffmanTree());
}

function drawTree(root) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!root) {
        ctx.fillStyle = "#666666"; // Gris oscuro del tema retro
        ctx.font = "16px Tahoma, sans-serif"; // Fuente retro
        ctx.fillText("Árbol vacío. Inserta texto para empezar.", 20, 30);
        document.getElementById("infoText").textContent = "Árbol vacío — Inserta texto para empezar.";
        return;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    assignPositions(root, 0, { x: 60 }, computeGap(root));

    drawEdges(root, total);
    drawNodes(root);
    document.getElementById("infoText").textContent = `Total = ${total} (frecuencias como k/${total})`;
}

function computeGap(root) {
    const leaves = countLeaves(root);
    if (leaves <= 0) return 80;
    let gap = 1000 / leaves;
    gap = Math.max(60, Math.min(140, gap));
    if (leaves <= 4) gap = Math.max(gap, 140);
    return gap;
}

function assignPositions(node, depth, curX, gap) {
    if (!node) return;
    node.y = 60 + depth * 90;
    if (node.isLeaf()) {
        node.x = curX.x;
        curX.x += gap;
    } else {
        assignPositions(node.left, depth + 1, curX, gap);
        assignPositions(node.right, depth + 1, curX, gap);
        if (node.left && node.right)
            node.x = (node.left.x + node.right.x) / 2;
        else if (node.left)
            node.x = node.left.x + gap / 2;
        else if (node.right)
            node.x = node.right.x - gap / 2;
    }
}

function drawEdges(node, total) {
    if (!node) return;
    ctx.strokeStyle = "#a0a0a0"; // Gris para bordes (tema retro)
    ctx.lineWidth = 2;
    if (node.left) {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.left.x, node.left.y);
        ctx.stroke();
        drawEdgeLabel(node, node.left, total);
        drawEdges(node.left, total);
    }
    if (node.right) {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.right.x, node.right.y);
        ctx.stroke();
        drawEdgeLabel(node, node.right, total);
        drawEdges(node.right, total);
    }
}

function drawEdgeLabel(parent, child, total) {
    const label = `${child.count}/${total}`;
    const mx = (parent.x + child.x) / 2;
    const my = (parent.y + child.y) / 2;
    const dx = child.x - parent.x, dy = child.y - parent.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = -dy / len, uy = dx / len;
    const offset = 12;
    const tx = mx + ux * offset;
    const ty = my + uy * offset;

    ctx.font = "bold 12px Tahoma, sans-serif"; // Fuente retro
    const tw = ctx.measureText(label).width;

    // Fondo estilo panel retro para la etiqueta
    ctx.fillStyle = "#f8f8f8"; // Color de fondo del tema
    ctx.fillRect(tx - tw / 2 - 4, ty - 10, tw + 8, 14);

    // Borde gris estilo retro
    ctx.strokeStyle = "#c0c0c0";
    ctx.lineWidth = 1;
    ctx.strokeRect(tx - tw / 2 - 4, ty - 10, tw + 8, 14);

    // Texto en gris oscuro
    ctx.fillStyle = "#000000";
    ctx.fillText(label, tx - tw / 2, ty);
}

function drawNodes(node) {
    if (!node) return;
    const r = 24;

    // Fondo del nodo con efecto de relieve
    const gradient = ctx.createRadialGradient(
        node.x - 3, node.y - 3, 5,
        node.x, node.y, r
    );
    gradient.addColorStop(0, "#f8f8f8"); // Color claro
    gradient.addColorStop(1, "#e8e8e8"); // Color oscuro para efecto 3D

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fill();

    // Borde biselado estilo retro
    ctx.lineWidth = 2;

    // Borde exterior claro (efecto de luz)
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.stroke();

    // Borde interior oscuro (efecto de sombra)
    ctx.strokeStyle = "#a0a0a0";
    ctx.beginPath();
    ctx.arc(node.x, node.y, r - 1, 0, 2 * Math.PI);
    ctx.stroke();

    if (node.isLeaf()) {
        // Texto de caracteres en negro
        ctx.fillStyle = "#000000";
        ctx.font = "bold 16px Tahoma, sans-serif"; // Fuente retro
        const text = node.ch;
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, node.x - tw / 2, node.y + 5);
    } else {
        // Para nodos internos, mostrar la frecuencia
        ctx.fillStyle = "#666666"; // Gris oscuro
        ctx.font = "bold 12px Tahoma, sans-serif"; // Fuente retro
        const text = node.count.toString();
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, node.x - tw / 2, node.y + 4);
    }

    drawNodes(node.left);
    drawNodes(node.right);
}

function countLeaves(node) {
    if (!node) return 0;
    if (node.isLeaf()) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
}

// ----------------- Botones -----------------
const input = document.getElementById("inputText");

document.getElementById("insertBtn").onclick = () => {
    const text = input.value.trim();
    if (!text) return;
    for (const ch of text)
        counts[ch] = (counts[ch] || 0) + 1;
    input.value = "";
    drawTree(buildHuffmanTree());
};

document.getElementById("deleteBtn").onclick = () => {
    const text = input.value.trim();
    if (!text) return;
    for (const ch of text)
        delete counts[ch];
    input.value = "";
    drawTree(buildHuffmanTree());
};

document.getElementById("clearBtn").onclick = () => {
    counts = {};
    drawTree(null);
};

document.getElementById("saveBtn").onclick = () => {
    if (Object.keys(counts).length === 0) {
        alert("No hay datos para guardar.");
        return;
    }
    const lines = ["# Huffman .huf v1"];
    for (const [ch, cnt] of Object.entries(counts)) {
        lines.push(`${ch.codePointAt(0)},${cnt}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "huffman.huf";
    a.click();
};

document.getElementById("loadBtn").onclick = async () => {
    // Implementación alternativa para navegadores que no soportan showOpenFilePicker
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.huf';

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            counts = {};
            text.split(/\r?\n/).forEach(line => {
                if (!line || line.startsWith("#")) return;
                const [cp, cnt] = line.split(",", 2);
                if (!isNaN(cp) && !isNaN(cnt))
                    counts[String.fromCodePoint(parseInt(cp))] = parseInt(cnt);
            });
            drawTree(buildHuffmanTree());
        };
        reader.readAsText(file);
    };

    fileInput.click();
};

// Inicialización
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Llamar para establecer el tamaño inicial

// Botón volver
document.getElementById("backBtn").addEventListener('click', () => {
    window.electronAPI.navigateTo('src/Index/index.html');
});