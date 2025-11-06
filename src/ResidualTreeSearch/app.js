// tree.js
// Migración fiel de ResidualTreeSearch.java -> JS
// Autor: generado por assistant (traducción de la lógica de Java original)

(() => {
    // --- CONFIGURACIONES de layout (mantener proporciones similares al Java) ---
    const NODE_RADIUS = 22;
    const LINK_W = 44;  // Circulos más pequeños para nodos de enlace
    const LINK_H = 44;
    const H_SPACING = 100;
    const V_SPACING = 110;
    const MARGIN = 40;
    const HEADER_HEIGHT = 92;
    const HEADER_TOP_GAP = 8;
    const EXTRA_TOP_SPACE = 40;
    const DRAW_OFFSET_Y = HEADER_TOP_GAP + HEADER_HEIGHT + EXTRA_TOP_SPACE;

    // Colores oscuros que combinan con el tema
    const HEADER_BLUE = '#0A2B3E';
    const ACCENT = '#26C6B0';   // verde menta
    const HIGHLIGHT = 'rgb(255,140,0)'; // naranja
    const NODE_BG = '#121416'; // Fondo oscuro para nodos
    const NODE_TEXT = '#e6eef0'; // Texto claro

    // --- ESTRUCTURAS de datos (Node, PathStep, ParentRef) ---
    function Node(isLink = true, letter = null) {
        this.isLink = isLink; // true -> link node (internal). false -> hoja (info/letter)
        this.letter = letter; // char or null
        this.left = null;
        this.right = null;
        this.x = 0; // posición para dibujar
        this.y = 0;
    }

    function ParentRef(parent, node, isLeft) {
        this.parent = parent;
        this.node = node;
        this.isLeft = isLeft;
    }

    function PathStep(parent, bit, target) {
        this.parent = parent; // Node
        this.bit = bit;       // 0/1
        this.target = target; // Node or null
    }

    // --- Estado global similar al Java ---
    const root = new Node(true, null); // root inicial: enlace (isLink = true)
    let highlightNode = null;
    let highlightStep = null;

    // --- Canvas y UI ---
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('status');

    // UI buttons/inputs
    const inputField = document.getElementById('inputField');
    const insertBtn = document.getElementById('insertBtn');
    const insertAnimBtn = document.getElementById('insertAnimBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const searchBtn = document.getElementById('searchBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const fileInput = document.getElementById('fileInput');
    const backBtn = document.getElementById('backBtn');

    // Para el scroll
    let contentWidth = 1000, contentHeight = 600;
    let treeWidth = 0, treeHeight = 0;

    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // Tamaño del canvas: usar el máximo entre el tamaño del árbol y el contenedor
        canvas.width = Math.max(treeWidth, containerWidth);
        canvas.height = Math.max(treeHeight, containerHeight);

        // Determinar si necesitamos scroll DESPUÉS de establecer el tamaño del canvas
        const needsHorizontalScroll = treeWidth > containerWidth;
        const needsVerticalScroll = treeHeight > containerHeight;

        // Aplicar overflow solo si es necesario
        container.style.overflowX = needsHorizontalScroll ? 'auto' : 'hidden';
        container.style.overflowY = needsVerticalScroll ? 'auto' : 'hidden';

        repaint();
    }

    window.addEventListener('resize', resizeCanvas);

    // --- UTILIDADES de bits (fiel a Java) ---
    function codeBits(letter) {
        let pos = (letter.charCodeAt(0) - 'A'.charCodeAt(0)) + 1;
        const bits = new Array(5);
        for (let i = 4; i >= 0; i--) {
            bits[i] = pos & 1;
            pos >>= 1;
        }
        return bits;
    }

    // --- LÓGICA DE INSERCIÓN (idéntica a Java) ---
    function insertLetterImmediate(letter) {
        const bits = codeBits(letter);
        insertAt(root, letter, bits, 0);
    }

    function insertAt(current, letter, bits, pos) {
        if (pos >= bits.length) return;
        const bit = bits[pos];
        const child = (bit === 0) ? current.left : current.right;

        if (child == null) {
            const info = new Node(false, letter);
            if (bit === 0) current.left = info; else current.right = info;
            return;
        }

        if (!child.isLink) {
            if (child.letter === letter) return; // duplicate
            const existing = child.letter;
            // convert child to link
            child.isLink = true; child.letter = null; child.left = null; child.right = null;
            insertAt(child, existing, codeBits(existing), pos + 1);
            insertAt(child, letter, bits, pos + 1);
            return;
        }
        // otherwise child is link -> keep inserting deeper
        insertAt(child, letter, bits, pos + 1);
    }

    // --- DELETE / COMPRESSION (idénticas a Java) ---
    function findLetter(node, parent, letter) {
        if (node == null) return null;
        if (!node.isLink && node.letter === letter) {
            return new ParentRef(parent, node, parent != null && parent.left === node);
        }
        const l = findLetter(node.left, node, letter);
        if (l != null) return l;
        return findLetter(node.right, node, letter);
    }

    function countInfoNodes(node) {
        if (node == null) return 0;
        if (!node.isLink) return 1;
        return countInfoNodes(node.left) + countInfoNodes(node.right);
    }

    function findSoleLetter(node) {
        if (node == null) return null;
        if (!node.isLink) return node.letter;
        const l = findSoleLetter(node.left);
        if (l != null) return l;
        return findSoleLetter(node.right);
    }

    function compressNode(node) {
        if (node == null) return null;
        const count = countInfoNodes(node);
        if (count === 0) return null;
        if (count === 1) {
            const sole = findSoleLetter(node);
            const info = new Node(false, sole);
            return info;
        }
        const res = new Node(true, null);
        res.left = compressNode(node.left);
        res.right = compressNode(node.right);
        return res;
    }

    function collectLetters(node, list) {
        if (node == null) return;
        if (!node.isLink) { list.push(node.letter); return; }
        collectLetters(node.left, list);
        collectLetters(node.right, list);
    }

    // --- VISUAL: asignación de posiciones ---
    const nodeBounds = new Map();

    function recomputeAndRepaint() {
        computePositions();
        resizeCanvas();
    }

    function computePositions() {
        nodeBounds.clear();
        const next = { next: 0 };
        assignPositions(root, 0, next);

        // Calcular dimensiones del árbol
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodeBounds.forEach((r) => {
            minX = Math.min(minX, r.x);
            maxX = Math.max(maxX, r.x + r.w);
            minY = Math.min(minY, r.y);
            maxY = Math.max(maxY, r.y + r.h);
        });

        // Si no hay nodos, usar dimensiones mínimas
        if (minX === Infinity) {
            treeWidth = 800;
            treeHeight = 520;
            return;
        }

        treeWidth = maxX - minX + 2 * MARGIN;
        treeHeight = maxY - minY + 2 * MARGIN;

        // Asegurar dimensiones mínimas
        treeWidth = Math.max(treeWidth, 800);
        treeHeight = Math.max(treeHeight, 520);

        // Centrar el árbol en el canvas
        const centerX = (treeWidth - (maxX - minX)) / 2 - minX;
        const centerY = (treeHeight - (maxY - minY)) / 2 - minY;

        // Aplicar centrado a todos los nodos
        nodeBounds.forEach((r) => {
            r.x += centerX;
            r.y += centerY;
        });

        // Actualizar coordenadas de nodos para las aristas
        updateNodePositions(root);
    }

    function updateNodePositions(node) {
        if (node == null) return;
        const bounds = nodeBounds.get(node);
        if (bounds) {
            node.x = bounds.x + bounds.w / 2;
            node.y = bounds.y + bounds.h / 2;
        }
        updateNodePositions(node.left);
        updateNodePositions(node.right);
    }

    function assignPositions(node, depth, nx) {
        if (node == null) return;

        // No dibujar el nodo raíz si no tiene hijos (árbol vacío)
        if (node === root && node.left == null && node.right == null) {
            return;
        }

        const y = DRAW_OFFSET_Y + depth * V_SPACING;

        if (!node.isLink) {
            // Nodos de información (ahora son rectángulos)
            const x = MARGIN + nx.next * H_SPACING;
            nx.next++;
            node.x = x; node.y = y;
            nodeBounds.set(node, {
                x: x - LINK_W / 2,
                y: y - LINK_H / 2,
                w: LINK_W,
                h: LINK_H
            });
        } else {
            // Nodos de enlace (ahora son círculos)
            if (node.left != null) assignPositions(node.left, depth + 1, nx);
            if (node.right != null) assignPositions(node.right, depth + 1, nx);

            let x;
            if (node.left != null && node.right != null) {
                x = Math.floor((node.left.x + node.right.x) / 2);
            } else if (node.left != null) {
                x = node.left.x;
            } else if (node.right != null) {
                x = node.right.x;
            } else {
                x = MARGIN + nx.next * H_SPACING;
                nx.next++;
            }
            node.x = x; node.y = y;
            nodeBounds.set(node, {
                x: x - NODE_RADIUS,
                y: y - NODE_RADIUS,
                w: NODE_RADIUS * 2,
                h: NODE_RADIUS * 2
            });
        }
    }

    // --- DIBUJO en canvas ---
    function repaint() {
        // Fondo oscuro
        ctx.fillStyle = '#0f1113';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        // header rectangle

        ctx.fillRect(0, HEADER_TOP_GAP, canvas.width, HEADER_HEIGHT);

        // title text
        ctx.fillStyle = '#ffffff';
        //ctx.font = 'bold 20px sans-serif';
        //ctx.fillText('Árbol por Residuos', 20, HEADER_TOP_GAP + 38);

        // edges primero
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 2;
        drawEdges(root);

        // highlight step
        if (highlightStep != null && highlightStep.target == null && highlightStep.parent != null) {
            const pr = nodeBounds.get(highlightStep.parent);
            if (pr) {
                const px = pr.x + pr.w / 2, py = pr.y + pr.h;
                const childX = px + (highlightStep.bit === 0 ? -H_SPACING / 2 : H_SPACING / 2);
                const childY = py + V_SPACING - (MARGIN / 2);
                ctx.setLineDash([6, 6]);
                ctx.strokeStyle = HIGHLIGHT;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(childX, childY, NODE_RADIUS, NODE_RADIUS, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // nodes después
        drawNodes(root);
        ctx.restore();
    }

    function drawEdges(node) {
        if (node == null) return;
        // No dibujar aristas del root si no tiene hijos
        if (node === root && node.left == null && node.right == null) return;

        const r = nodeBounds.get(node);
        if (!r) return;

        if (node.left != null) {
            const rc = nodeBounds.get(node.left);
            if (rc) {
                const x1 = r.x + r.w / 2, y1 = r.y + r.h;
                const x2 = rc.x + rc.w / 2, y2 = rc.y;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                drawBitLabel(x1, y1, x2, y2, '0');
            }
            drawEdges(node.left);
        }
        if (node.right != null) {
            const rc = nodeBounds.get(node.right);
            if (rc) {
                const x1 = r.x + r.w / 2, y1 = r.y + r.h;
                const x2 = rc.x + rc.w / 2, y2 = rc.y;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                drawBitLabel(x1, y1, x2, y2, '1');
            }
            drawEdges(node.right);
        }
    }

    function drawBitLabel(x1, y1, x2, y2, bit) {
        const mx = Math.floor((x1 + x2) / 2) - 6;
        const my = Math.floor((y1 + y2) / 2) - 6;
        ctx.fillStyle = ACCENT;
        ctx.font = '12px sans-serif';
        ctx.fillText(bit, mx, my);
    }

    function drawNodes(node) {
        if (node == null) return;
        // No dibujar el root si no tiene hijos
        if (node === root && node.left == null && node.right == null) return;

        const r = nodeBounds.get(node);
        if (!r) return;
        const isHighlight = (node === highlightNode);

        if (!node.isLink) {
            // Nodos de información: RECTÁNGULOS (cuadrados)
            ctx.fillStyle = NODE_BG;
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.lineWidth = 2;
            ctx.strokeStyle = isHighlight ? HIGHLIGHT : ACCENT;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // letter
            ctx.fillStyle = NODE_TEXT;
            ctx.font = 'bold 14px sans-serif';
            const s = String(node.letter);
            const sw = ctx.measureText(s).width;
            ctx.fillText(s, r.x + (r.w - sw) / 2, r.y + (r.h / 2) + 5);
        } else {
            // Nodos de enlace: CÍRCULOS
            ctx.fillStyle = NODE_BG;
            ctx.beginPath();
            ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = isHighlight ? HIGHLIGHT : ACCENT;
            ctx.stroke();
        }

        // recurse
        drawNodes(node.left);
        drawNodes(node.right);
    }

    // highlight helpers
    function setHighlightNode(n) { highlightNode = n; highlightStep = null; }
    function setHighlightStep(ps) { highlightStep = ps; highlightNode = null; }
    function clearHighlights() { highlightNode = null; highlightStep = null; }

    // --- BUILD PATH FOR ANIMATION ---
    function buildPathForAnimation(rootNode, letter) {
        const path = [];
        if (!rootNode) return path;
        const bits = codeBits(letter);
        let cur = rootNode;
        path.push(new PathStep(null, -1, cur));
        for (let pos = 0; pos < bits.length; pos++) {
            const b = bits[pos];
            const child = (b === 0) ? cur.left : cur.right;
            path.push(new PathStep(cur, b, child));
            if (child == null) break;
            if (!child.isLink) break;
            cur = child;
        }
        return path;
    }

    // --- ANIMACIÓN DE BÚSQUEDA ---
    let searchTimer = null;
    function animateSearch(letter) {
        if (!letter || letter.length === 0) { setStatus('Nada que buscar'); return; }
        const c = letter.toUpperCase().charAt(0);
        if (c < 'A' || c > 'Z') { setStatus('Clave inválida (A-Z)'); return; }

        clearHighlights();
        recomputeAndRepaint();

        const path = buildPathForAnimation(root, c);
        if (path.length === 0) { setStatus('Árbol vacío'); return; }

        let step = 0;
        setStatus('Buscando ' + c + '...');
        if (searchTimer) clearInterval(searchTimer);
        searchTimer = setInterval(() => {
            if (step >= path.length) {
                clearInterval(searchTimer);
                setStatus('Búsqueda terminada');
                return;
            }
            const ps = path[step++];
            if (ps.target != null) {
                setHighlightNode(ps.target);
                repaint();
                if (!ps.target.isLink && ps.target.letter === c) {
                    setStatus('Clave ' + c + ' encontrada.');
                    clearInterval(searchTimer);
                    return;
                }
            } else {
                setHighlightStep(ps);
                repaint();
            }
            if (step >= path.length) {
                const last = path[path.length - 1];
                if (last.target == null) {
                    setStatus('Valor no encontrado (nunca insertado)');
                } else if (!last.target.isLink && last.target.letter !== c) {
                    setStatus('Valor no encontrado (colisión o distinto)');
                } else {
                    setStatus('Búsqueda finalizada.');
                }
                clearInterval(searchTimer);
            }
        }, 350);
    }

    // --- UI: botones y acciones ---
    function setStatus(txt) { statusEl.textContent = txt; }

    backBtn.addEventListener('click', () => {
        window.electronAPI.navigateTo('src/Index/index.html')
    });

    insertBtn.addEventListener('click', () => {
        const text = inputField.value || '';
        if (!text) { setStatus('Nada para insertar'); return; }
        const letters = [];
        for (const ch of text.toUpperCase()) if (ch >= 'A' && ch <= 'Z') letters.push(ch);
        if (letters.length === 0) { setStatus('No claves validas (A-Z)'); return; }
        for (const c of letters) insertLetterImmediate(c);
        recomputeAndRepaint();
        setStatus(`${letters.length} claves insertadas.`);
    });

    insertAnimBtn.addEventListener('click', () => {
        const text = inputField.value || '';
        if (!text) { setStatus('Nada para insertar'); return; }
        const letters = [];
        for (const ch of text.toUpperCase()) if (ch >= 'A' && ch <= 'Z') letters.push(ch);
        if (letters.length === 0) { setStatus('No claves validas (A-Z)'); return; }

        let idx = 0;
        setStatus('Insertando (animado)...');
        const seqTimer = setInterval(() => {
            if (idx >= letters.length) {
                clearInterval(seqTimer);
                setStatus('Inserciones animadas completadas');
                return;
            }
            const c = letters[idx++];
            setStatus('Insertando: ' + c);
            recomputeAndRepaint();
            const path = buildPathForAnimation(root, c);
            let step = 0;
            if (searchTimer) { clearInterval(searchTimer); searchTimer = null; }
            searchTimer = setInterval(() => {
                if (step >= path.length) {
                    insertLetterImmediate(c);
                    clearHighlights();
                    recomputeAndRepaint();
                    clearInterval(searchTimer);
                    searchTimer = null;
                    return;
                }
                const ps = path[step++];
                if (ps.target != null) setHighlightNode(ps.target);
                else setHighlightStep(ps);
                recomputeAndRepaint();
            }, 300);
        }, 700);
    });

    deleteBtn.addEventListener('click', () => {
        const s = inputField.value || '';
        if (!s || s.length === 0) { setStatus('Escribe la clave a eliminar en el mismo campo'); return; }
        const c = s.toUpperCase().charAt(0);
        if (c < 'A' || c > 'Z') { setStatus('Clave inválida'); return; }
        const found = findLetter(root, null, c);
        if (!found) { setStatus('Clave no encontrada'); return; }
        if (!found.parent) { setStatus('No se puede eliminar la raíz'); return; }
        if (found.isLeft) found.parent.left = null; else found.parent.right = null;
        const compressed = compressNode(root);
        if (compressed == null) {
            root.left = null; root.right = null; root.isLink = true; root.letter = null;
        } else if (!compressed.isLink) {
            const sole = compressed.letter;
            const first = codeBits(sole)[0];
            const info = new Node(false, sole);
            if (first === 0) root.left = info; else root.right = info;
            root.isLink = true;
        } else {
            root.left = compressed.left; root.right = compressed.right; root.isLink = true;
        }
        clearHighlights();
        recomputeAndRepaint();
        setStatus('Clave ' + c + ' eliminada (si existía).');
    });

    clearBtn.addEventListener('click', () => {
        root.left = null; root.right = null; root.isLink = true; root.letter = null;
        clearHighlights(); recomputeAndRepaint(); setStatus('Árbol limpiado');
    });

    searchBtn.addEventListener('click', () => {
        const s = inputField.value || '';
        if (!s || s.length === 0) { setStatus('Nada que buscar'); return; }
        const c = s.toUpperCase().charAt(0);
        animateSearch(c);
    });

    saveBtn.addEventListener('click', () => {
        const letters = [];
        collectLetters(root, letters);
        const txt = letters.join('\n');
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'residuos.res';
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus(`Guardado ${letters.length} claves en archivo .res`);
    });

    loadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (ev) => {
        const f = ev.target.files[0];
        if (!f) return;
        if (!f.name.toLowerCase().endsWith('.res')) {
            setStatus('Seleccione un archivo con extensión .res');
            fileInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result || '';
            const lines = text.split(/\r?\n/);
            const letters = [];
            for (let line of lines) {
                line = (line || '').trim().toUpperCase();
                if (!line) continue;
                if (line.length === 1 && line >= 'A' && line <= 'Z') letters.push(line);
                else { for (const ch of line) if (ch >= 'A' && ch <= 'Z') letters.push(ch); }
            }
            root.left = null; root.right = null; root.isLink = true; root.letter = null;
            for (const c of letters) insertLetterImmediate(c);
            recomputeAndRepaint();
            setStatus(`Recuperado ${letters.length} letras desde ${f.name}`);
        };
        reader.readAsText(f, 'utf-8');
        fileInput.value = '';
    });

    // Inicialización
    recomputeAndRepaint();

    // Debug
    window._treeDebug = {
        root, recomputeAndRepaint, insertAt, codeBits, collectLetters, compressNode
    };
})();