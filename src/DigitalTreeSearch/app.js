// Digital Tree Search implementation in JavaScript
class DigitalTreeSearch {
    constructor() {
        this.root = null;
        this.insertionOrder = [];
        this.highlightedNode = null;
        this.insertionParent = null;
        this.insertionRight = false;
        this.status = "Árbol vacío. Inserte claves (A-Z).";
        this.searchResultNode = null;

        // Canvas and drawing context
        this.canvas = document.getElementById('treeCanvas');
        this.ctx = this.canvas.getContext('2d');

        // UI elements
        this.inputField = document.getElementById('inputField');
        this.letterList = document.getElementById('letterList');
        this.statusElement = document.getElementById('status');

        // Event listeners
        document.getElementById('insertBtn').addEventListener('click', () => this.insertTextAnimated(this.inputField.value));
        document.getElementById('searchBtn').addEventListener('click', () => this.searchText(this.inputField.value));
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelected());
        document.getElementById('clearBtn').addEventListener('click', () => this.resetAll());
        document.getElementById('saveBtn').addEventListener('click', () => this.onSave(false));
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.onLoad(e));
        document.getElementById('backBtn').addEventListener('click', () => this.onReturn());

        // Animation
        this.animationSteps = [];
        this.currentStep = 0;
        this.animationTimer = null;
        this.animationCallback = null;

        // Initial setup
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.drawTree();
    }

    // Node class
    Node = class {
        constructor(value) {
            this.value = value;
            this.left = null;
            this.right = null;
        }
    }

    // ------------------ Basic algorithms ------------------
    letterTo5Bits(ch) {
        ch = ch.toUpperCase();
        if (ch < 'A' || ch > 'Z') return null;
        let pos = (ch.charCodeAt(0) - 'A'.charCodeAt(0)) + 1; // A -> 1
        let s = pos.toString(2);
        while (s.length < 5) s = "0" + s;
        if (s.length > 5) s = s.substring(s.length - 5);
        return s;
    }

    existsInTree(ch) {
        ch = ch.toUpperCase();
        // Verificar tanto en insertionOrder como buscar en el árbol
        if (this.insertionOrder.includes(ch)) return true;

        // Búsqueda adicional en el árbol por si hay inconsistencia
        if (this.root === null) return false;

        const bits = this.letterTo5Bits(ch);
        let current = this.root;

        for (let i = 0; i < bits.length; i++) {
            if (current.value === ch) return true;

            const bit = bits.charAt(i);
            if (bit === '0') {
                if (current.left === null) break;
                current = current.left;
            } else {
                if (current.right === null) break;
                current = current.right;
            }

            // Verificar el nodo actual en cada paso
            if (current.value === ch) return true;
        }

        return false;
    }

    insertDirect(ch) {
        ch = ch.toUpperCase();
        if (ch < 'A' || ch > 'Z') return false;
        if (this.existsInTree(ch)) return false;

        const bits = this.letterTo5Bits(ch);
        if (this.root === null) {
            this.root = new this.Node(ch);
            this.insertionOrder.push(ch);
            return true;
        }

        let cur = this.root;
        for (let i = 0; i < bits.length; i++) {
            const b = bits.charAt(i);
            if (b === '0') {
                if (cur.left === null) {
                    cur.left = new this.Node(ch);
                    this.insertionOrder.push(ch);
                    return true;
                } else {
                    cur = cur.left;
                }
            } else {
                if (cur.right === null) {
                    cur.right = new this.Node(ch);
                    this.insertionOrder.push(ch);
                    return true;
                } else {
                    cur = cur.right;
                }
            }
        }
        return false;
    }

    deleteChar(ch) {
        ch = ch.toUpperCase();
        const index = this.insertionOrder.indexOf(ch);
        if (index === -1) return;

        this.insertionOrder.splice(index, 1);
        this.root = null;
        const copy = [...this.insertionOrder];
        this.insertionOrder = [];
        for (const c of copy) {
            this.insertDirect(c);
        }
    }

    // ------------------ Search function ------------------
    // ------------------ Search function ------------------
    searchText(text) {
        if (!text || text.length === 0) return;

        const ch = text.charAt(0).toUpperCase();
        if (!ch.match(/[A-Z]/)) {
            alert('Por favor, ingrese una clave válida (A-Z)');
            return;
        }

        this.animateSearch(ch);
    }

    planSearchPath(ch) {
        const steps = [];
        ch = ch.toUpperCase();

        if (this.root === null) {
            return { steps, found: false };
        }

        let cur = this.root;
        // Verificar si la raíz contiene la letra
        if (cur.value === ch) {
            steps.push({ node: cur, isMatch: true });
            return { steps, found: true };
        } else {
            steps.push({ node: cur, isMatch: false });
        }

        const bits = this.letterTo5Bits(ch);

        for (let i = 0; i < bits.length; i++) {
            const b = bits.charAt(i);
            if (b === '0') {
                if (cur.left === null) {
                    break;
                } else {
                    cur = cur.left;
                    // Verificar SIEMPRE si el nodo actual contiene la letra
                    if (cur.value === ch) {
                        steps.push({ node: cur, isMatch: true });
                        return { steps, found: true };
                    } else {
                        steps.push({ node: cur, isMatch: false });
                    }
                }
            } else {
                if (cur.right === null) {
                    break;
                } else {
                    cur = cur.right;
                    // Verificar SIEMPRE si el nodo actual contiene la letra
                    if (cur.value === ch) {
                        steps.push({ node: cur, isMatch: true });
                        return { steps, found: true };
                    } else {
                        steps.push({ node: cur, isMatch: false });
                    }
                }
            }
        }

        return { steps, found: false };
    }

    async animateSearch(ch) {
        const { steps, found } = this.planSearchPath(ch);

        if (steps.length === 0) {
            this.status = `Búsqueda: ${ch} no encontrada (árbol vacío)`;
            this.drawTree();
            return;
        }

        // Animate the search path
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            this.highlightedNode = step.node;
            this.status = `Buscando: ${ch} - paso ${i + 1}/${steps.length}`;
            this.drawTree();

            // Wait before next step - REDUCIDO A 200ms
            await new Promise(resolve => setTimeout(resolve, 200));

            // Si encontramos la letra en cualquier paso, terminar la búsqueda
            if (step.isMatch) {
                this.status = `Búsqueda exitosa: ${ch} encontrada`;
                this.searchResultNode = step.node;
                this.animateFoundNode();
                return;
            }

            // Si es el último paso y no se encontró
            if (i === steps.length - 1 && !found) {
                this.status = `Búsqueda fallida: ${ch} no encontrada`;
                // Reset highlights after a delay - REDUCIDO A 1000ms
                setTimeout(() => {
                    this.highlightedNode = null;
                    this.drawTree();
                }, 1000);
                this.drawTree();
            }
        }
    }

    animateFoundNode() {
        let pulseCount = 0;
        const maxPulses = 6;

        const pulseInterval = setInterval(() => {
            pulseCount++;

            if (pulseCount > maxPulses) {
                clearInterval(pulseInterval);
                this.searchResultNode = null;
                this.highlightedNode = null;
                this.drawTree();
                return;
            }

            // Toggle highlight for pulse effect
            if (pulseCount % 2 === 0) {
                this.highlightedNode = null;
            } else {
                this.highlightedNode = this.searchResultNode;
            }

            this.drawTree();
        }, 150); // REDUCIDO A 150ms
    }

    // ------------------ Save / Load ------------------
    onSave(exitAfter) {
        const data = this.insertionOrder.join('\n');
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'tree.dig';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Guardado correctamente');

        if (exitAfter) {
            // In a real Electron app, this would close the window
            console.log('Closing application');
        }
    }

    onLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const letters = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(ch => ch.charAt(0).toUpperCase())
                .filter(ch => ch >= 'A' && ch <= 'Z');

            // Rebuild tree with read letters
            this.root = null;
            this.insertionOrder = [];
            for (const c of letters) {
                this.insertDirect(c);
            }

            this.updateListModel();
            this.drawTree();
            alert('Árbol recuperado correctamente');
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }

    onReturn() {
        window.electronAPI.navigateTo('src/Index/index.html');
    }

    // ------------------ Animation ------------------
    planInsertionPath(ch) {
        const steps = [];
        ch = ch.toUpperCase();

        if (this.root === null) {
            steps.push({ node: null, isInsertion: true, insertionParent: null });
            return steps;
        }

        let cur = this.root;
        steps.push({ node: cur });
        const bits = this.letterTo5Bits(ch);

        for (let i = 0; i < bits.length; i++) {
            const b = bits.charAt(i);
            if (b === '0') {
                if (cur.left === null) {
                    steps.push({
                        node: null,
                        isInsertion: true,
                        insertionParent: cur,
                        insertRight: false
                    });
                    return steps;
                } else {
                    cur = cur.left;
                    steps.push({ node: cur });
                }
            } else {
                if (cur.right === null) {
                    steps.push({
                        node: null,
                        isInsertion: true,
                        insertionParent: cur,
                        insertRight: true
                    });
                    return steps;
                } else {
                    cur = cur.right;
                    steps.push({ node: cur });
                }
            }
        }
        return steps;
    }

    insertTextAnimated(text) {
        if (!text || text.length === 0) return;

        const letters = [];
        for (let i = 0; i < text.length; i++) {
            const c = text.charAt(i);
            if (!c.match(/[a-zA-Z]/)) continue;
            const up = c.toUpperCase();
            // VERIFICACIÓN CORREGIDA: usar el árbol actual para verificar duplicados
            if (!this.existsInTree(up)) letters.push(up);
        }

        if (letters.length === 0) {
            alert('No hay claves nuevas para insertar (o estaban duplicadas).');
            return;
        }

        this.animateInsertionSequence(letters);
        this.inputField.value = '';
    }

    async animateInsertionSequence(letters) {
        for (const c of letters) {
            const steps = this.planInsertionPath(c);
            await this.animateStepsForLetter(c, steps);
            // Small delay between letters
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        this.updateListModel();
    }

    animateStepsForLetter(ch, steps) {
        return new Promise(resolve => {
            // Verificar duplicados al inicio
            if (this.existsInTree(ch)) {
                this.status = `Inserción omitida: ${ch} ya existe`;
                this.drawTree();
                resolve(); // Resolvemos la promesa inmediatamente
                return;
            }

            this.currentStep = 0;
            this.animationSteps = steps;
            this.animationCallback = resolve;

            if (this.animationTimer) {
                clearInterval(this.animationTimer);
            }

            this.animationTimer = setInterval(() => {
                if (this.currentStep < this.animationSteps.length) {
                    const step = this.animationSteps[this.currentStep];
                    this.highlightedNode = step.node;

                    if (step.isInsertion && step.insertionParent) {
                        this.insertionParent = step.insertionParent;
                        this.insertionRight = step.insertRight;
                    } else {
                        this.insertionParent = null;
                    }

                    this.status = `Insertando: ${ch} — paso ${this.currentStep + 1}/${steps.length}`;
                    this.drawTree();
                    this.currentStep++;
                } else {
                    clearInterval(this.animationTimer);
                    this.highlightedNode = null;
                    this.insertionParent = null;

                    // Realizar la inserción real
                    let inserted = false;
                    if (this.root === null) {
                        this.root = new this.Node(ch);
                        inserted = true;
                    } else {
                        let cur = this.root;
                        const bits = this.letterTo5Bits(ch);
                        for (let i = 0; i < bits.length; i++) {
                            const b = bits.charAt(i);
                            if (b === '0') {
                                if (cur.left === null) {
                                    cur.left = new this.Node(ch);
                                    inserted = true;
                                    break;
                                } else {
                                    cur = cur.left;
                                }
                            } else {
                                if (cur.right === null) {
                                    cur.right = new this.Node(ch);
                                    inserted = true;
                                    break;
                                } else {
                                    cur = cur.right;
                                }
                            }
                        }
                    }

                    if (inserted) this.insertionOrder.push(ch);
                    this.status = inserted ? `Inserción completada: ${ch}` : `No se pudo insertar: ${ch}`;
                    this.drawTree();
                    this.animationCallback(); // Esto debería ser resolve, pero ya estamos usando this.animationCallback = resolve
                }
            }, 175);
        });
    }

    // ------------------ Tree drawing ------------------
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.drawTree();
    }

    drawTree() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Update status text
        this.statusElement.textContent = this.status;

        if (this.root === null) {
            ctx.fillStyle = '#666666'; // Cambiado a gris neutro
            ctx.font = '16px Tahoma';
            ctx.fillText('Árbol vacío. Inserte claves (A-Z).', 20, 30);
            return;
        }

        // Calculate node positions
        const positions = new Map();
        this.computePositions(this.root, 10, width - 10, 70, 0, positions);

        // Draw edges first - COLORES MODIFICADOS
        ctx.strokeStyle = '#a0a0a0'; // Gris neutro
        ctx.lineWidth = 2;
        ctx.font = '14px Tahoma';

        for (const [node, pos] of positions) {
            if (node.left && positions.has(node.left)) {
                const childPos = positions.get(node.left);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(childPos.x, childPos.y);
                ctx.stroke();

                // Draw "0" label
                const midX = (pos.x + childPos.x) / 2;
                const midY = (pos.y + childPos.y) / 2;
                this.drawEdgeLabel(ctx, '0', midX, midY);
            }

            if (node.right && positions.has(node.right)) {
                const childPos = positions.get(node.right);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(childPos.x, childPos.y);
                ctx.stroke();

                // Draw "1" label
                const midX = (pos.x + childPos.x) / 2;
                const midY = (pos.y + childPos.y) / 2;
                this.drawEdgeLabel(ctx, '1', midX, midY);
            }
        }

        // Draw nodes - COLORES MODIFICADOS PARA ESTILO RETRO
        const nodeRadius = 28;
        const accentColor = '#716F6F'; // Gris neutro
        const highlightColor = '#D6C7A5'; // Beige suave

        for (const [node, pos] of positions) {
            const isHighlighted = node === this.highlightedNode;
            const isSearchResult = node === this.searchResultNode;

            // Draw insertion hint if applicable
            if (this.insertionParent === node) {
                const hintX = this.insertionRight ? pos.x + 90 : pos.x - 90;
                const hintY = pos.y + 70;

                ctx.fillStyle = 'rgba(113, 111, 111, 0.2)'; // Gris neutro con transparencia
                ctx.beginPath();
                ctx.arc(hintX, hintY, nodeRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(113, 111, 111, 0.5)'; // Gris neutro con transparencia
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(hintX, hintY, nodeRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw node
            if (isSearchResult) {
                // Special highlight for search result
                ctx.fillStyle = 'rgba(214, 199, 165, 0.5)'; // Beige suave
            } else if (isHighlighted) {
                ctx.fillStyle = 'rgba(113, 111, 111, 0.3)'; // Gris neutro
            } else {
                ctx.fillStyle = '#f0f0f0'; // Fondo claro estilo retro
            }

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
            ctx.fill();

            if (isSearchResult) {
                ctx.strokeStyle = '#716F6F'; // Gris neutro
                ctx.lineWidth = 3;
            } else if (isHighlighted) {
                ctx.strokeStyle = '#716F6F'; // Gris neutro
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = '#a0a0a0'; // Gris medio
                ctx.lineWidth = 1;
            }

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw letter
            ctx.fillStyle = '#000000'; // Texto negro
            ctx.font = 'bold 18px Tahoma';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.value, pos.x, pos.y);
        }
    }

    drawEdgeLabel(ctx, text, x, y) {
        ctx.fillStyle = '#f0f0f0'; // Fondo claro
        ctx.font = '14px Tahoma';
        const textWidth = ctx.measureText(text).width;
        const padding = 5;

        ctx.fillRect(
            x - textWidth / 2 - padding,
            y - 14,
            textWidth + padding * 2,
            20
        );

        ctx.fillStyle = '#666666'; // Texto gris
        ctx.fillText(text, x, y);
    }

    computePositions(node, x1, x2, y, depth, positions) {
        if (!node) return;

        const x = (x1 + x2) / 2;
        positions.set(node, { x, y });

        const levelGap = 100; // Aumentado de 70 a 100 para más espacio vertical
        if (node.left) this.computePositions(node.left, x1, x, y + levelGap, depth + 1, positions);
        if (node.right) this.computePositions(node.right, x, x2, y + levelGap, depth + 1, positions);
    }

    // ------------------ UI updates ------------------
    updateListModel() {
        let html = '';
        for (const c of this.insertionOrder) {
            const bits = this.letterTo5Bits(c);
            html += `<div class="letter-list-item">${c} → ${bits}</div>`;
        }
        this.letterList.innerHTML = html;
        this.drawTree();
    }

    deleteSelected() {
        const text = this.inputField.value.trim();
        if (!text) {
            alert('Escriba la(s) clave(s) a eliminar en el campo "Clave".');
            return;
        }

        const set = new Set();
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i);
            if (!ch.match(/\s/)) {
                set.add(ch.toUpperCase());
            }
        }

        if (set.size === 0) {
            alert('No se encontraron caracteres válidos en la entrada.');
            return;
        }

        const toDelete = [];
        const notFound = [];

        for (const ch of set) {
            if (this.existsInTree(ch)) {
                toDelete.push(ch);
            } else {
                notFound.push(ch);
            }
        }

        if (toDelete.length === 0) {
            alert(`Ninguna de las claves indicadas está en el árbol: ${notFound.join(', ')}`);
            return;
        }

        let msg = `Se eliminarán: ${toDelete.join(', ')}.`;
        if (notFound.length > 0) {
            msg += `\nNo se encontraron: ${notFound.join(', ')}.`;
        }
        msg += '\n\n¿Continuar?';

        if (confirm(msg)) {
            for (const ch of toDelete) {
                this.deleteChar(ch);
            }
            this.updateListModel();
            this.inputField.value = '';
        }
    }

    resetAll() {
        if (confirm('¿Reiniciar y vaciar todo?')) {
            this.root = null;
            this.insertionOrder = [];
            this.updateListModel();
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DigitalTreeSearch();
});