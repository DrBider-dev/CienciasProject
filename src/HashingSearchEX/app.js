(() => {

    // ---- Estado Global por Método ----
    const state = {
        'H. Mod': { matrix: null, maxKeys: null, keyLength: null, visibleCols: [] },
        'H. Cuadrado': { matrix: null, maxKeys: null, keyLength: null, visibleCols: [] },
        'H. Plegamiento': { matrix: null, maxKeys: null, keyLength: null, visibleCols: [] },
        'H. Truncamiento': { matrix: null, maxKeys: null, keyLength: null, visibleCols: [] },
        'H. Conversion de Base': { matrix: null, maxKeys: null, keyLength: null, visibleCols: [] }
    };

    const MAX_VISIBLE_ROWS = 8; // Constante para visualización parcial

    // DOM
    const hashSelect = document.getElementById('hashSelect');
    const sizeArrayEl = document.getElementById('sizeArray');
    const keyLengthEl = document.getElementById('keyLength');
    const txtKeyEl = document.getElementById('txtKey');
    const btnCreate = document.getElementById('btnCreate');
    const btnInsert = document.getElementById('btnInsert');
    const btnSearch = document.getElementById('btnSearch');
    const btnDelete = document.getElementById('btnDelete');
    const cellsWrap = document.getElementById('cellsWrap');
    const btnSave = document.getElementById('btnSave');
    const btnOpen = document.getElementById('btnOpen');
    const fileInput = document.getElementById('fileInput');
    const btnBack = document.getElementById('btnBack');

    // ---- Utilidades ----
    function showWarn(msg) { alert(msg); }
    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    function getCurrentState() {
        return state[hashSelect.value];
    }

    function computeDimensions(M) {
        const n = Math.ceil(Math.sqrt(M));       // columnas
        const filas = Math.ceil(M / n);          // filas
        return { filas, columnas: n };
    }

    // ---- Funciones Hash (Adaptadas de HashingSearch) ----

    function modHash(clave, tamañoArreglo) {
        return clave % tamañoArreglo;
    }

    function middleSquareHash(clave, tamañoArreglo) {
        const square = BigInt(clave) * BigInt(clave);
        const squareTxt = square.toString();
        const length = String(tamañoArreglo).length;
        const need = length - 1; // dígitos centrales

        // Si need <= 0, usamos 1 dígito al menos o modulo simple
        if (need <= 0) return clave % tamañoArreglo;

        const start = Math.floor((squareTxt.length - need) / 2);
        const end = start + need;
        // En HashingSearch original no hacían modulo extra, pero aquí 'tamañoArreglo' es 'columnas'.
        // Si el recorte da un número mayor a columnas, necesitamos modulo.
        // HashingSearch original: return parseInt(hash, 10); (asumiendo que encaja)
        // Aquí aseguraremos con modulo.
        let hashVal = 0;
        if (squareTxt.length < need) hashVal = parseInt(squareTxt, 10);
        else {
            const sub = squareTxt.substring(start, end);
            hashVal = sub === "" ? 0 : parseInt(sub, 10);
        }
        return hashVal % tamañoArreglo;
    }

    function foldingHash(clave, tamañoArreglo) {
        const claveTxt = String(clave);
        let groupSize = String(tamañoArreglo).length - 1;
        if (groupSize <= 0) groupSize = 1;

        let sum = 0;
        for (let i = 0; i < claveTxt.length; i += groupSize) {
            const end = Math.min(i + groupSize, claveTxt.length);
            const group = claveTxt.substring(i, end);
            sum += parseInt(group, 10);
        }
        return sum % tamañoArreglo;
    }

    function truncationHash(clave, tamañoArreglo) {
        const claveTxt = String(clave);
        let digitsNeeded = String(tamañoArreglo).length - 1;
        if (digitsNeeded <= 0) digitsNeeded = 1;

        let part;
        if (claveTxt.length <= digitsNeeded) {
            part = claveTxt;
        } else {
            part = claveTxt.substring(claveTxt.length - digitsNeeded);
        }
        return parseInt(part, 10) % tamañoArreglo;
    }

    function base7Hash(clave, tamañoArreglo) {
        // La clave llega como número decimal (porque parseamos el input como base 10 para almacenarlo).
        // PERO la lógica dice: "recibimos la clave y suponemos que esta esta en otra base... convertimos a base 10".
        // Si el usuario escribe "12", txtKeyEl.value es "12".
        // Nosotros almacenamos 12 (visual).
        // Para el hash, interpretamos "12" como Base 7 -> 9.
        // Hash = 9 % tamaño.

        // Recuperamos la representación string del número almacenado
        const claveTxt = String(clave);

        // Validar que sea base 7 válida (0-6)
        // Esto debería validarse antes, pero aquí hacemos el cálculo.
        // parseInt(str, 7)
        const valBase10 = parseInt(claveTxt, 7);
        if (isNaN(valBase10)) return 0; // Fallback

        return valBase10 % tamañoArreglo;
    }

    function hashFunction(key, numBloques) {
        const method = hashSelect.value;
        switch (method) {
            case 'H. Mod': return modHash(key, numBloques);
            case 'H. Cuadrado': return middleSquareHash(key, numBloques);
            case 'H. Plegamiento': return foldingHash(key, numBloques);
            case 'H. Truncamiento': return truncationHash(key, numBloques);
            case 'H. Conversion de Base': return base7Hash(key, numBloques);
            default: return key % numBloques;
        }
    }

    // ---- Inicializar columnas visibles ----
    function initVisibleCols(currState, columnas) {
        const MAX_COLS = 8;
        currState.visibleCols = [];
        if (columnas > MAX_COLS) {
            for (let i = 0; i < MAX_COLS; i++) {
                if (i === MAX_COLS - 1) currState.visibleCols.push(columnas - 1);
                else currState.visibleCols.push(Math.floor(i * (columnas - 1) / (MAX_COLS - 1)));
            }
        } else {
            for (let c = 0; c < columnas; c++) currState.visibleCols.push(c);
        }
    }

    // ---- Asegurar visibilidad dinámica ----
    function ensureBlockVisible(currState, targetCol) {
        const matrix = currState.matrix;
        if (!matrix) return;
        const columnas = matrix[0].length;
        const MAX_COLS = 8;

        if (columnas <= MAX_COLS) return;
        if (currState.visibleCols.includes(targetCol)) return;

        let replaced = false;
        for (let i = 0; i < currState.visibleCols.length; i++) {
            if (currState.visibleCols[i] > targetCol) {
                currState.visibleCols[i] = targetCol;
                replaced = true;
                break;
            }
        }
        if (!replaced) {
            currState.visibleCols[currState.visibleCols.length - 1] = targetCol;
        }
        currState.visibleCols.sort((a, b) => a - b);
    }

    // ---- Render ----
    function render() {
        cellsWrap.innerHTML = '';
        const currState = getCurrentState();
        const matrix = currState.matrix;

        if (!matrix) {
            const hint = document.createElement('div');
            hint.style.color = 'var(--muted)';
            hint.innerText = `No hay estructura para ${hashSelect.value}: crea la matriz.`;
            cellsWrap.appendChild(hint);
            return;
        }

        const filas = matrix.length;
        const columnas = matrix[0].length;

        // Usar visibleCols del estado actual
        if (!currState.visibleCols || currState.visibleCols.length === 0) {
            initVisibleCols(currState, columnas);
        }

        const visibleRows = [];
        for (let j = 0; j < Math.min(MAX_VISIBLE_ROWS, filas); j++) {
            visibleRows.push(j);
        }

        for (let index = 0; index < currState.visibleCols.length; index++) {
            const realCol = currState.visibleCols[index];
            const colBlock = document.createElement('div');
            colBlock.className = 'col-block';

            const title = document.createElement('div');
            title.className = 'col-title';
            title.innerText = `Bloque ${realCol + 1}`;
            colBlock.appendChild(title);

            visibleRows.forEach(row => {
                const val = matrix[row][realCol];
                const cell = document.createElement('div');
                cell.className = 'cell' + (val === null ? ' empty' : '');
                const v = document.createElement('div');
                v.className = 'val';
                v.innerText = val === null ? '' : val;
                cell.appendChild(v);
                colBlock.appendChild(cell);
            });

            if (filas > MAX_VISIBLE_ROWS) {
                const dots = document.createElement('div');
                dots.style.textAlign = 'center';
                dots.style.color = 'var(--muted)';
                dots.innerText = '...';
                colBlock.appendChild(dots);
            }

            cellsWrap.appendChild(colBlock);
        }
    }

    // ---- Helper DOM ----
    function getColBlockForRealIndex(realCol) {
        const currState = getCurrentState();
        if (!currState.matrix) return null;

        const visibleIndex = currState.visibleCols.indexOf(realCol);
        if (visibleIndex === -1) return null;
        return cellsWrap.children[visibleIndex] || null;
    }

    // ---- Eventos UI ----
    hashSelect.addEventListener('change', () => {
        render();
    });

    // ---- Crear ----
    btnCreate.addEventListener('click', () => {
        const currState = getCurrentState();
        const maxKeys = parseInt(sizeArrayEl.value, 10);
        const keyLength = parseInt(keyLengthEl.value, 10);

        if (isNaN(maxKeys) || maxKeys <= 0) return showWarn("Tamaño inválido");
        if (isNaN(keyLength) || keyLength <= 0) return showWarn("Debe definir tamaño de clave");

        currState.maxKeys = maxKeys;
        currState.keyLength = keyLength;

        const { filas, columnas } = computeDimensions(maxKeys);
        currState.matrix = Array.from({ length: filas }, () => Array(columnas).fill(null));
        initVisibleCols(currState, columnas);

        render();
    });

    // ---- Insertar ----
    btnInsert.addEventListener('click', async () => {
        const currState = getCurrentState();
        if (!currState.matrix) return showWarn(`Primero crea la estructura para ${hashSelect.value}`);

        const input = txtKeyEl.value.trim();
        if (input.length !== currState.keyLength) return showWarn(`La clave debe tener ${currState.keyLength} dígitos`);

        const value = parseInt(input, 10);
        if (isNaN(value)) return showWarn("Clave inválida");

        // Validación extra para Base 7
        if (hashSelect.value === 'H. Conversion de Base') {
            if (/[^0-6]/.test(input)) return showWarn("La clave contiene dígitos inválidos para Base 7 (0-6)");
        }

        const matrix = currState.matrix;
        const columnas = matrix[0].length;
        const filas = matrix.length;

        const col = hashFunction(value, columnas);

        // Dinámica
        ensureBlockVisible(currState, col);
        render();

        // Validar duplicados en bloque
        for (let r = 0; r < filas; r++) {
            if (matrix[r][col] === value) return showWarn(`La clave ${value} ya existe en el bloque ${col + 1}`);
        }

        // Insertar y Ordenar
        const blockValues = [];
        for (let r = 0; r < filas; r++) {
            if (matrix[r][col] !== null) {
                blockValues.push(matrix[r][col]);
            }
        }

        if (blockValues.length >= filas) {
            return showWarn(`El bloque ${col + 1} está lleno (Overflow)`);
        }

        blockValues.push(value);
        blockValues.sort((a, b) => a - b);

        // Reescribir columna
        for (let r = 0; r < filas; r++) {
            if (r < blockValues.length) {
                matrix[r][col] = blockValues[r];
            } else {
                matrix[r][col] = null;
            }
        }

        render();

        // Animar
        const colBlock = getColBlockForRealIndex(col);
        if (colBlock) {
            colBlock.style.borderColor = 'var(--accent)';
            await sleep(300);
            colBlock.style.borderColor = '';
        }
    });

    // ---- Buscar / Eliminar ----
    async function findValue(target, isDelete = false) {
        const currState = getCurrentState();
        const matrix = currState.matrix;
        const filas = matrix.length;
        const columnas = matrix[0].length;

        document.querySelectorAll('.cell').forEach(c =>
            c.classList.remove('highlight-found', 'highlight-check', 'highlight-last')
        );

        const col = hashFunction(target, columnas);

        ensureBlockVisible(currState, col);
        render();

        const colBlock = getColBlockForRealIndex(col);
        const animateThisColumn = !!colBlock;

        if (animateThisColumn && colBlock) {
            colBlock.style.borderColor = 'var(--accent)';
            await sleep(450);
            colBlock.style.borderColor = '';
        }

        for (let r = 0; r < filas; r++) {
            const val = matrix[r][col];

            if (val === null) {
                alert("Clave no encontrada");
                return { found: false };
            }

            if (animateThisColumn) {
                let cell = null;
                if (r < MAX_VISIBLE_ROWS) {
                    cell = colBlock.children[r + 1];
                }
                if (cell) {
                    cell.classList.add('highlight-check');
                    await sleep(350);
                    cell.classList.remove('highlight-check');
                }
            }

            if (val === target) {
                if (animateThisColumn) {
                    let cell = null;
                    if (r < MAX_VISIBLE_ROWS) {
                        cell = colBlock.children[r + 1];
                        cell.classList.add('highlight-found');
                    } else {
                        const visibleCells = colBlock.querySelectorAll('.cell');
                        if (visibleCells.length > 0) {
                            const lastVisibleCell = visibleCells[visibleCells.length - 1];
                            lastVisibleCell.querySelector('.val').innerText = target;
                            lastVisibleCell.classList.add('highlight-found');
                            lastVisibleCell.style.border = "2px dashed var(--accent)";
                        }
                    }
                }

                await sleep(100);
                alert(`Encontrado en Bloque ${col + 1}, Posición ${r + 1}`);

                if (isDelete) {
                    matrix[r][col] = null;
                    for (let k = r; k < filas - 1; k++) {
                        matrix[k][col] = matrix[k + 1][col];
                    }
                    matrix[filas - 1][col] = null;

                    await new Promise(r => requestAnimationFrame(r));
                    render();
                    alert(`Clave ${target} eliminada.`);
                }
                return { found: true, r, c: col };
            }
        }

        alert("Clave no encontrada");
        return { found: false };
    }

    btnSearch.addEventListener('click', async () => {
        const currState = getCurrentState();
        if (!currState.matrix) return showWarn(`Primero crea la estructura para ${hashSelect.value}`);

        const input = txtKeyEl.value.trim();
        if (input.length !== currState.keyLength) return showWarn(`La clave debe tener ${currState.keyLength} dígitos`);
        const target = parseInt(input, 10);
        if (isNaN(target)) return showWarn("Clave inválida");

        if (hashSelect.value === 'H. Conversion de Base') {
            if (/[^0-6]/.test(input)) return showWarn("La clave contiene dígitos inválidos para Base 7 (0-6)");
        }

        await findValue(target, false);
    });

    if (btnDelete) {
        btnDelete.addEventListener('click', async () => {
            const currState = getCurrentState();
            if (!currState.matrix) return showWarn(`Primero crea la estructura para ${hashSelect.value}`);

            const input = txtKeyEl.value.trim();
            if (input.length !== currState.keyLength) return showWarn(`La clave debe tener ${currState.keyLength} dígitos`);
            const target = parseInt(input, 10);
            if (isNaN(target)) return showWarn("Clave inválida");

            if (hashSelect.value === 'H. Conversion de Base') {
                if (/[^0-6]/.test(input)) return showWarn("La clave contiene dígitos inválidos para Base 7 (0-6)");
            }

            await findValue(target, true);
        });
    }

    // ---- Save/Load (Simplificado: Solo guarda el estado actual) ----
    function saveMatrixToFile() {
        const currState = getCurrentState();
        const matrix = currState.matrix;
        if (!matrix) return showWarn("No hay datos para guardar");

        let lines = [];
        lines.push(String(currState.keyLength));
        lines.push(String(currState.maxKeys));

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                const val = matrix[r][c];
                lines.push(val === null ? "" : String(val));
            }
        }
        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `hashing_${hashSelect.value.replace(' ', '_')}.dat`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function loadMatrixFromText(text) {
        const currState = getCurrentState();
        const lines = text.split(/\r?\n/).map(l => l.trim());

        currState.keyLength = parseInt(lines.shift(), 10);
        currState.maxKeys = parseInt(lines.shift(), 10);

        const { filas, columnas } = computeDimensions(currState.maxKeys);
        currState.matrix = Array.from({ length: filas }, () => Array(columnas).fill(null));
        initVisibleCols(currState, columnas);

        let lineIdx = 0;
        for (let r = 0; r < filas; r++) {
            for (let c = 0; c < columnas; c++) {
                if (lineIdx < lines.length) {
                    const l = lines[lineIdx++];
                    currState.matrix[r][c] = l === "" ? null : parseInt(l, 10);
                }
            }
        }
        render();
    }

    btnSave.addEventListener("click", () => saveMatrixToFile());
    btnOpen.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => loadMatrixFromText(reader.result);
        reader.readAsText(file);
    });

    btnBack.addEventListener('click', () => {
        window.electronAPI.navigateTo("src/Index/index.html");
    });

    // Inicializar render
    render();

})();
