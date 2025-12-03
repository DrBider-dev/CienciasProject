(() => {

  // ---- Estado Global por Método ----
  const state = {
    'Expansiones Totales': {
      matrix: null,
      blockSize: null,
      keyLength: null,
      expansionCount: 1,
      recordCount: 0,
      overflowArea: [], // Array para elementos en colisión
      visibleCols: []
    },
    'Expansiones Parciales': {
      matrix: null,
      blockSize: null,
      keyLength: null,
      expansionStep: 0,
      n: 1,
      recordCount: 0,
      overflowArea: [], // Array para elementos en colisión
      visibleCols: []
    }
  };

  const MAX_VISIBLE_BLOCKS = 8;

  // DOM
  const hashSelect = document.getElementById('hashSelect');
  const blockSizeEl = document.getElementById('blockSize');
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

  function getCurrentState() {
    return state[hashSelect.value];
  }

  // Hash function (ambos métodos usan mod)
  function hashMod(key, numBlocks) {
    return key % numBlocks;
  }

  function getHash(key, method, numBlocks) {
    return hashMod(key, numBlocks);
  }

  // Calcular número de bloques según el método
  function getNumBlocks(currState, method) {
    if (method === 'Expansiones Totales') {
      return Math.pow(2, currState.expansionCount);
    } else if (method === 'Expansiones Parciales') {
      if (currState.expansionStep === 0) {
        return Math.pow(2, currState.n);
      } else {
        return 3 * Math.pow(2, currState.n - 1);
      }
    }
    return 2;
  }

  // Calcular densidad de ocupación (incluye overflow)
  function getLoadFactor(recordCount, blockSize, numBlocks) {
    return recordCount / (blockSize * numBlocks);
  }

  // ---- Inicializar columnas visibles (ordenadas de menor a mayor) ----
  function initVisibleCols(currState, numBlocks) {
    currState.visibleCols = [];
    if (numBlocks > MAX_VISIBLE_BLOCKS) {
      for (let i = 0; i < MAX_VISIBLE_BLOCKS; i++) {
        if (i === MAX_VISIBLE_BLOCKS - 1) {
          currState.visibleCols.push(numBlocks - 1);
        } else {
          currState.visibleCols.push(Math.floor(i * (numBlocks - 1) / (MAX_VISIBLE_BLOCKS - 1)));
        }
      }
    } else {
      for (let c = 0; c < numBlocks; c++) {
        currState.visibleCols.push(c);
      }
    }
    currState.visibleCols.sort((a, b) => a - b);
  }

  // ---- Asegurar visibilidad dinámica ----
  function ensureBlockVisible(currState, targetCol) {
    if (!currState.matrix) return;
    const numBlocks = currState.matrix[0].length;

    if (numBlocks <= MAX_VISIBLE_BLOCKS) return;
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

  // ---- Helper DOM ----
  function getColBlockForRealIndex(realCol) {
    const currState = getCurrentState();
    if (!currState.matrix) return null;

    const visibleIndex = currState.visibleCols.indexOf(realCol);
    if (visibleIndex === -1) return null;
    return cellsWrap.children[visibleIndex] || null;
  }

  // ---- Render matriz visualmente por columnas (ordenadas) ----
  function render() {
    cellsWrap.innerHTML = '';
    const currState = getCurrentState();

    if (!currState.matrix) {
      const hint = document.createElement('div');
      hint.style.color = 'var(--muted)';
      hint.innerText = 'No hay estructura: crea la matriz para comenzar.';
      cellsWrap.appendChild(hint);
      return;
    }

    const filas = currState.blockSize;
    const method = hashSelect.value;
    const numBlocks = getNumBlocks(currState, method);

    if (!currState.visibleCols || currState.visibleCols.length === 0) {
      initVisibleCols(currState, numBlocks);
    }

    // Renderizar solo bloques visibles (ya ordenados)
    for (let index = 0; index < currState.visibleCols.length; index++) {
      const realCol = currState.visibleCols[index];
      const colBlock = document.createElement('div');
      colBlock.className = 'col-block';

      const title = document.createElement('div');
      title.className = 'col-title';
      title.innerText = `Bloque ${realCol + 1}`;
      colBlock.appendChild(title);

      for (let r = 0; r < filas; r++) {
        const val = currState.matrix[r][realCol];
        const cell = document.createElement('div');
        cell.className = 'cell' + (val === null ? ' empty' : '');
        const v = document.createElement('div');
        v.className = 'val';
        v.innerText = val === null ? '' : val;
        cell.appendChild(v);
        colBlock.appendChild(cell);
      }
      cellsWrap.appendChild(colBlock);
    }

    // Mostrar área de overflow si hay elementos
    if (currState.overflowArea.length > 0) {
      const overflowBlock = document.createElement('div');
      overflowBlock.className = 'col-block';
      overflowBlock.style.borderColor = '#ff6b6b';

      const title = document.createElement('div');
      title.className = 'col-title';
      title.style.backgroundColor = '#ff6b6b';
      title.innerText = `Overflow (${currState.overflowArea.length})`;
      overflowBlock.appendChild(title);

      currState.overflowArea.forEach(val => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.borderColor = '#ff6b6b';
        const v = document.createElement('div');
        v.className = 'val';
        v.innerText = val;
        cell.appendChild(v);
        overflowBlock.appendChild(cell);
      });

      cellsWrap.appendChild(overflowBlock);
    }
  }

  // ---- Crear ----
  btnCreate.addEventListener('click', () => {
    const currState = getCurrentState();
    const blockSize = parseInt(blockSizeEl.value, 10);
    const keyLength = parseInt(keyLengthEl.value, 10);
    const method = hashSelect.value;

    if (isNaN(blockSize) || blockSize <= 0) return showWarn("Tamaño de bloque inválido");
    if (isNaN(keyLength) || keyLength <= 0) return showWarn("Debe definir tamaño de clave");

    currState.blockSize = blockSize;
    currState.keyLength = keyLength;
    currState.recordCount = 0;
    currState.overflowArea = [];

    if (method === 'Expansiones Totales') {
      currState.expansionCount = 1;
    } else if (method === 'Expansiones Parciales') {
      currState.n = 1;
      currState.expansionStep = 0;
    }

    const numBlocks = getNumBlocks(currState, method);
    currState.matrix = Array.from({ length: blockSize }, () => Array(numBlocks).fill(null));
    initVisibleCols(currState, numBlocks);

    render();
  });

  // ---- Expandir matriz ----
  function expandMatrix() {
    const currState = getCurrentState();
    const method = hashSelect.value;

    // Extraer todos los valores (matriz + overflow)
    const values = [];
    const oldNumBlocks = getNumBlocks(currState, method);
    for (let c = 0; c < oldNumBlocks; c++) {
      for (let r = 0; r < currState.blockSize; r++) {
        if (currState.matrix[r][c] !== null) {
          values.push(currState.matrix[r][c]);
        }
      }
    }
    // Agregar elementos del overflow
    values.push(...currState.overflowArea);
    currState.overflowArea = [];

    // Incrementar según el método
    if (method === 'Expansiones Totales') {
      currState.expansionCount++;
    } else if (method === 'Expansiones Parciales') {
      if (currState.expansionStep === 0) {
        currState.expansionStep = 1;
      } else {
        currState.expansionStep = 0;
        currState.n++;
      }
    }

    const newNumBlocks = getNumBlocks(currState, method);

    currState.matrix = Array.from({ length: currState.blockSize }, () => Array(newNumBlocks).fill(null));
    initVisibleCols(currState, newNumBlocks);

    // Redistribuir todos los valores
    for (const value of values) {
      const blockIndex = getHash(value, method, newNumBlocks);

      let inserted = false;
      for (let r = 0; r < currState.blockSize; r++) {
        if (currState.matrix[r][blockIndex] === null) {
          currState.matrix[r][blockIndex] = value;
          inserted = true;
          break;
        }
      }

      // Si no se pudo insertar, va al overflow nuevamente
      if (!inserted) {
        currState.overflowArea.push(value);
      }
    }
  }

  // ---- Reducir matriz ----
  function shrinkMatrix() {
    const currState = getCurrentState();
    const method = hashSelect.value;

    if (method === 'Expansiones Totales' && currState.expansionCount <= 1) return false;
    if (method === 'Expansiones Parciales' && currState.n === 1 && currState.expansionStep === 0) return false;

    // Extraer todos los valores (matriz + overflow)
    const values = [];
    const oldNumBlocks = getNumBlocks(currState, method);
    for (let c = 0; c < oldNumBlocks; c++) {
      for (let r = 0; r < currState.blockSize; r++) {
        if (currState.matrix[r][c] !== null) {
          values.push(currState.matrix[r][c]);
        }
      }
    }
    values.push(...currState.overflowArea);
    currState.overflowArea = [];

    // Decrementar según el método
    if (method === 'Expansiones Totales') {
      currState.expansionCount--;
    } else if (method === 'Expansiones Parciales') {
      if (currState.expansionStep === 1) {
        currState.expansionStep = 0;
      } else {
        currState.n--;
        currState.expansionStep = 1;
        if (currState.n < 1) {
          currState.n = 1;
          currState.expansionStep = 0;
        }
      }
    }

    const newNumBlocks = getNumBlocks(currState, method);

    currState.matrix = Array.from({ length: currState.blockSize }, () => Array(newNumBlocks).fill(null));
    initVisibleCols(currState, newNumBlocks);

    // Redistribuir todos los valores
    for (const value of values) {
      const blockIndex = getHash(value, method, newNumBlocks);

      let inserted = false;
      for (let r = 0; r < currState.blockSize; r++) {
        if (currState.matrix[r][blockIndex] === null) {
          currState.matrix[r][blockIndex] = value;
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        currState.overflowArea.push(value);
      }
    }

    return true;
  }

  // ---- Insertar ----
  btnInsert.addEventListener('click', async () => {
    const currState = getCurrentState();
    const method = hashSelect.value;
    if (!currState.matrix) return showWarn(`Primero crea la estructura para ${method}`);

    const input = txtKeyEl.value.trim();
    if (input.length !== currState.keyLength) return showWarn(`La clave debe tener ${currState.keyLength} dígitos`);

    const value = parseInt(input, 10);
    if (isNaN(value)) return showWarn("Clave inválida");

    // Verificar duplicado en matriz
    const numBlocks = getNumBlocks(currState, method);
    for (let c = 0; c < numBlocks; c++) {
      for (let r = 0; r < currState.blockSize; r++) {
        if (currState.matrix[r][c] === value) {
          return showWarn("La clave ya existe");
        }
      }
    }
    // Verificar duplicado en overflow
    if (currState.overflowArea.includes(value)) {
      return showWarn("La clave ya existe (en overflow)");
    }

    const blockIndex = getHash(value, method, numBlocks);
    ensureBlockVisible(currState, blockIndex);

    // Intentar insertar en el bloque correspondiente
    let inserted = false;
    for (let r = 0; r < currState.blockSize; r++) {
      if (currState.matrix[r][blockIndex] === null) {
        currState.matrix[r][blockIndex] = value;
        currState.recordCount++;
        inserted = true;
        break;
      }
    }

    // Si hay colisión (bloque lleno), guardar en overflow
    if (!inserted) {
      currState.overflowArea.push(value);
      currState.recordCount++; // Contar en la densidad
    }

    const loadFactor = getLoadFactor(currState.recordCount, currState.blockSize, numBlocks);

    render();

    if (loadFactor > 0.75) {
      await new Promise(resolve => setTimeout(resolve, 500));
      expandMatrix();
      const newNumBlocks = getNumBlocks(currState, method);
      render();
      showWarn(`Densidad superó 0.75. Matriz expandida a ${newNumBlocks} bloques.`);
    }

    txtKeyEl.value = '';
  });

  // ---- Búsqueda ----
  btnSearch.addEventListener('click', async () => {
    const currState = getCurrentState();
    const method = hashSelect.value;
    if (!currState.matrix) return showWarn("Primero crea la estructura");

    const input = txtKeyEl.value.trim();
    if (input.length !== currState.keyLength) return showWarn(`La clave debe tener ${currState.keyLength} dígitos`);

    const target = parseInt(input, 10);
    if (isNaN(target)) return showWarn("Clave inválida");

    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    document.querySelectorAll('.cell').forEach(c =>
      c.classList.remove('highlight-found', 'highlight-check', 'highlight-last')
    );

    const numBlocks = getNumBlocks(currState, method);
    const blockIndex = getHash(target, method, numBlocks);

    ensureBlockVisible(currState, blockIndex);
    render();

    const colBlock = getColBlockForRealIndex(blockIndex);
    if (colBlock) {
      for (let r = 0; r < currState.blockSize; r++) {
        const cell = colBlock.children[r + 1];
        cell.classList.add('highlight-check');
        await sleep(350);

        if (currState.matrix[r][blockIndex] === target) {
          cell.classList.remove('highlight-check');
          cell.classList.add('highlight-found');
          return;
        }
        cell.classList.remove('highlight-check');
      }
    }

    // Buscar en overflow
    if (currState.overflowArea.includes(target)) {
      alert(`Clave encontrada en área de overflow`);
      return;
    }

    alert("Clave no encontrada");
  });

  // ---- Eliminar ----
  btnDelete.addEventListener('click', async () => {
    const currState = getCurrentState();
    const method = hashSelect.value;
    if (!currState.matrix) return showWarn("Primero crea la estructura");

    const input = txtKeyEl.value.trim();
    if (input.length !== currState.keyLength) return showWarn(`La clave debe tener ${currState.keyLength} dígitos`);

    const target = parseInt(input, 10);
    if (isNaN(target)) return showWarn("Clave inválida");

    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    document.querySelectorAll('.cell').forEach(c =>
      c.classList.remove('highlight-found', 'highlight-check', 'highlight-last')
    );

    const numBlocks = getNumBlocks(currState, method);
    const blockIndex = getHash(target, method, numBlocks);

    ensureBlockVisible(currState, blockIndex);
    render();

    const colBlock = getColBlockForRealIndex(blockIndex);
    if (colBlock) {
      for (let r = 0; r < currState.blockSize; r++) {
        const cell = colBlock.children[r + 1];
        cell.classList.add('highlight-check');
        await sleep(350);

        if (currState.matrix[r][blockIndex] === target) {
          currState.matrix[r][blockIndex] = null;
          currState.recordCount--;

          const blockValues = [];
          for (let i = 0; i < currState.blockSize; i++) {
            if (currState.matrix[i][blockIndex] !== null) {
              blockValues.push(currState.matrix[i][blockIndex]);
            }
          }

          for (let i = 0; i < currState.blockSize; i++) {
            currState.matrix[i][blockIndex] = i < blockValues.length ? blockValues[i] : null;
          }

          cell.classList.remove('highlight-check');

          const density = getLoadFactor(currState.recordCount, currState.blockSize, numBlocks);

          render();

          if (density < 0.25) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const shrunk = shrinkMatrix();
            if (shrunk) {
              const newNumBlocks = getNumBlocks(currState, method);
              render();
              showWarn(`Densidad cayó por debajo de 0.25. Matriz reducida a ${newNumBlocks} bloques.`);
            }
          }

          return;
        }
        cell.classList.remove('highlight-check');
      }
    }

    // Buscar en overflow
    const overflowIndex = currState.overflowArea.indexOf(target);
    if (overflowIndex !== -1) {
      currState.overflowArea.splice(overflowIndex, 1);
      currState.recordCount--;
      render();
      alert("Clave eliminada del área de overflow");
      return;
    }

    alert("Clave no encontrada");
  });

  // ---- Guardar/Cargar ----
  function saveMatrixToFile() {
    const currState = getCurrentState();
    const method = hashSelect.value;
    if (!currState.matrix) return showWarn("No hay datos para guardar");

    const lines = [];
    lines.push(String(currState.keyLength));
    lines.push(String(currState.blockSize));
    lines.push(String(currState.recordCount));
    lines.push(method);

    if (method === 'Expansiones Totales') {
      lines.push(String(currState.expansionCount));
    } else if (method === 'Expansiones Parciales') {
      lines.push(String(currState.n));
      lines.push(String(currState.expansionStep));
    }

    // Guardar overflow
    lines.push(String(currState.overflowArea.length));
    currState.overflowArea.forEach(val => lines.push(String(val)));

    const numBlocks = getNumBlocks(currState, method);
    for (let r = 0; r < currState.blockSize; r++) {
      for (let c = 0; c < numBlocks; c++) {
        const val = currState.matrix[r][c];
        lines.push(val === null ? "" : String(val));
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "matriz_dinamica.dat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function loadMatrixFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());

    const keyLength = parseInt(lines[0], 10);
    const blockSize = parseInt(lines[1], 10);
    const recordCount = parseInt(lines[2], 10);
    const method = lines[3];

    hashSelect.value = method;
    const currState = getCurrentState();

    currState.keyLength = keyLength;
    currState.blockSize = blockSize;
    currState.recordCount = recordCount;

    let idx = 4;
    if (method === 'Expansiones Totales') {
      currState.expansionCount = parseInt(lines[idx++], 10);
    } else if (method === 'Expansiones Parciales') {
      currState.n = parseInt(lines[idx++], 10);
      currState.expansionStep = parseInt(lines[idx++], 10);
    }

    // Cargar overflow
    const overflowCount = parseInt(lines[idx++], 10);
    currState.overflowArea = [];
    for (let i = 0; i < overflowCount; i++) {
      currState.overflowArea.push(parseInt(lines[idx++], 10));
    }

    const numBlocks = getNumBlocks(currState, method);
    currState.matrix = Array.from({ length: blockSize }, () => Array(numBlocks).fill(null));
    initVisibleCols(currState, numBlocks);

    for (let r = 0; r < blockSize; r++) {
      for (let c = 0; c < numBlocks; c++) {
        if (idx < lines.length && lines[idx] !== "") {
          currState.matrix[r][c] = parseInt(lines[idx], 10);
        }
        idx++;
      }
    }

    blockSizeEl.value = blockSize;
    keyLengthEl.value = keyLength;

    render();
  }

  btnSave.addEventListener("click", () => {
    saveMatrixToFile();
  });

  btnOpen.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => loadMatrixFromText(reader.result);
    reader.readAsText(file);
  });

  hashSelect.addEventListener('change', () => {
    render();
  });

  btnBack.addEventListener('click', () => {
    window.electronAPI.navigateTo("src/Index/index.html");
  });

  render();

})();
