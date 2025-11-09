(() => {

  let matrix = null;          // matriz principal
  let maxKeys = null;         // tamaño máximo de claves permitido
  let keyLength = null;       // longitud de cada clave

  // DOM
  const sizeArrayEl = document.getElementById('sizeArray');
  const keyLengthEl = document.getElementById('keyLength');
  const txtKeyEl = document.getElementById('txtKey');
  const btnCreate = document.getElementById('btnCreate');
  const btnInsert = document.getElementById('btnInsert');
  const btnSearch = document.getElementById('btnSearch');
  const cellsWrap = document.getElementById('cellsWrap');
  const btnSave = document.getElementById('btnSave');
  const btnOpen = document.getElementById('btnOpen');
  const fileInput = document.getElementById('fileInput');
  const btnBack = document.getElementById('btnBack');

  // ---- Utilidades ----
  function showWarn(msg){ alert(msg); }

  function computeDimensions(M) {
    const n = Math.ceil(Math.sqrt(M));       // columnas
    const filas = Math.ceil(M / n);          // filas
    return { filas, columnas: n };
  }

  function flattenMatrix(matrix) {
    const values = [];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[0].length; c++) {
        if (matrix[r][c] !== null) values.push(matrix[r][c]);
      }
    }
    return values;
  }

  function rebuildMatrix(values, filas, columnas) {
    const mat = Array.from({ length: filas }, () => Array(columnas).fill(null));
    let idx = 0;
    for (let c = 0; c < columnas; c++) {
      for (let r = 0; r < filas; r++) {
        if (idx < values.length) {
          mat[r][c] = values[idx++];
        }
      }
    }
    return mat;
  }

  // ---- Render matriz visualmente por columnas ----
function render() {
  cellsWrap.innerHTML = '';

  if (!matrix) {
    const hint = document.createElement('div');
    hint.style.color = 'var(--muted)';
    hint.innerText = 'No hay estructura: crea la matriz para comenzar.';
    cellsWrap.appendChild(hint);
    return;
  }

  const filas = matrix.length;
  const columnas = matrix[0].length;

  // Si hay menos de 100 claves → mostrar matriz completa normal
  if (maxKeys < 100) {

    for (let c = 0; c < columnas; c++) {
      const colBlock = document.createElement('div');
      colBlock.className = 'col-block';

      const title = document.createElement('div');
      title.className = 'col-title';
      title.innerText = `Bloque ${c + 1}`;
      colBlock.appendChild(title);

      for (let r = 0; r < filas; r++) {
        const val = matrix[r][c];
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
    return;
  }

  //  Si MAX >= 100 → usamos visualización proporcional 10×10
  const MAX = 8;

  // Selección proporcional de columnas
  const visibleCols = [];
  for (let i = 0; i < MAX; i++) {
    if (i === MAX - 1) visibleCols.push(columnas - 1); 
    else visibleCols.push(Math.floor(i * (columnas - 1) / (MAX - 1)));
  }

  // Selección proporcional de filas
  const visibleRows = [];
  for (let j = 0; j < MAX; j++) {
    if (j === MAX - 1) visibleRows.push(filas - 1);
    else visibleRows.push(Math.floor(j * (filas - 1) / (MAX - 1)));
  }

  // Render usando los índices seleccionados
  for (let index = 0; index < visibleCols.length; index++) {
    const realCol = visibleCols[index];
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

    cellsWrap.appendChild(colBlock);
  }
}




  // ---- Crear matriz vacía ----
  btnCreate.addEventListener('click', () => {
    maxKeys = parseInt(sizeArrayEl.value, 10);
    keyLength = parseInt(keyLengthEl.value, 10);

    if (isNaN(maxKeys) || maxKeys <= 0) return showWarn("Tamaño inválido");
    if (isNaN(keyLength) || keyLength <= 0) return showWarn("Debe definir tamaño de clave");

    const { filas, columnas } = computeDimensions(maxKeys);

    matrix = Array.from({ length: filas }, () => Array(columnas).fill(null));
    render();
  });

  // ---- Insertar clave ordenada ----
  btnInsert.addEventListener('click', () => {
    if (!matrix) return showWarn("Primero crea la estructura");

    const input = txtKeyEl.value.trim();
    if (input.length !== keyLength) return showWarn(`La clave debe tener ${keyLength} dígitos`);

    const value = parseInt(input, 10);
    if (isNaN(value)) return showWarn("Clave inválida");

    // Extraemos todas las claves existentes
    let values = flattenMatrix(matrix);

    // Verificar duplicado
    if (values.includes(value)) return showWarn("La clave ya existe");

    // Verificar espacio disponible
    if (values.length >= maxKeys) return showWarn("La matriz está llena");

    // Insertar ordenadamente
    values.push(value);
    values.sort((a, b) => a - b);

    // Reconstruir matriz
    const { filas, columnas } = computeDimensions(maxKeys);
    matrix = rebuildMatrix(values, filas, columnas);

    render();
    //  Mostrar visualmente la clave recién insertada
      const pos = getKeyPosition(value);
      if (pos && maxKeys >= 100) {
      // Ajustar ventana de columnas para incluir el bloque
      // visibleBlockStart es tu desplazamiento actual
      if (pos.col < visibleBlockStart || pos.col >= visibleBlockStart + MAX_VISIBLE_BLOCKS) {
    visibleBlockStart = Math.max(0, pos.col - Math.floor(MAX_VISIBLE_BLOCKS / 2));
    }
    render();
    }

  });

  // ---- Búsqueda Lineal Etiquetada ----
  btnSearch.addEventListener('click', async () => {
  if (!matrix) return showWarn("Primero crea la estructura");

  const input = txtKeyEl.value.trim();
  if (input.length !== keyLength) return showWarn(`La clave debe tener ${keyLength} dígitos`);

  const target = parseInt(input, 10);
  if (isNaN(target)) return showWarn("Clave inválida");

  const filas = matrix.length;
  const columnas = matrix[0].length;

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // limpiar estilos anteriores
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('highlight-found', 'highlight-check', 'highlight-last');
  });

  // recorrer columnas
  for (let c = 0; c < columnas; c++) {

    const colBlock = cellsWrap.children[c];
    const lastR = filas - 1;
    const lastCell = colBlock.children[lastR + 1]; // +1 por el título
    const lastVal = matrix[lastR][c];

    // **ANIMAR revisión de la última celda**
    lastCell.classList.add('highlight-last');
    await sleep(450);
    lastCell.classList.remove('highlight-last');

    //  CASO 1: Última casilla es NULL → buscar SOLO en este bloque
    if (lastVal === null) {

      for (let r = 0; r < filas; r++) {
        const cell = colBlock.children[r + 1];

        cell.classList.add('highlight-check');
        await sleep(350);

        if (matrix[r][c] === target) {
          cell.classList.remove('highlight-check');
          cell.classList.add('highlight-found');
          return;
        }

        cell.classList.remove('highlight-check');
      }

      // Se buscó solo este bloque y no se encontró → detener búsqueda
      alert("Clave no encontrada");
      return;
    }

    //  CASO 2: Última casilla NO es nula pero target > último valor → saltar columna
    if (target > lastVal) continue;

    //  CASO 3: target ≤ último valor → buscar dentro del bloque
    for (let r = 0; r < filas; r++) {
      const cell = colBlock.children[r + 1];

      cell.classList.add('highlight-check');
      await sleep(350);

      if (matrix[r][c] === target) {
        cell.classList.remove('highlight-check');
        cell.classList.add('highlight-found');
        return;
      }

      cell.classList.remove('highlight-check');
    }
  }

  // Si terminó todas las columnas y no encontró:
  alert("Clave no encontrada");
});


btnDelete.addEventListener('click', async () => {
  if (!matrix) return showWarn("Primero crea la estructura");

  const input = txtKeyEl.value.trim();
  if (input.length !== keyLength) return showWarn(`La clave debe tener ${keyLength} dígitos`);

  const target = parseInt(input, 10);
  if (isNaN(target)) return showWarn("Clave inválida");

  const filas = matrix.length;
  const columnas = matrix[0].length;

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // limpiar estilos previos
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('highlight-found', 'highlight-check', 'highlight-last');
  });

  // recorrer columnas
  for (let c = 0; c < columnas; c++) {

    const colBlock = cellsWrap.children[c];
    const lastR = filas - 1;
    const lastCell = colBlock.children[lastR + 1];
    const lastVal = matrix[lastR][c];

    // animar revisión de última celda
    lastCell.classList.add('highlight-last');
    await sleep(450);
    lastCell.classList.remove('highlight-last');

    // Caso 1: la última casilla es null → buscar solo este bloque
    if (lastVal === null) {

      for (let r = 0; r < filas; r++) {
        const cell = colBlock.children[r + 1];

        cell.classList.add('highlight-check');
        await sleep(350);

        if (matrix[r][c] === target) {
          //  Eliminar valor
          matrix[r][c] = null;

          //  Reorganizar matriz
          reorganizeMatrix();
          render();
          return;
        }

        cell.classList.remove('highlight-check');
      }

      // No encontrado → terminar búsqueda y avisar
      alert("Clave no encontrada");
      return;
    }

    // Caso 2: si el target es mayor al último valor, saltar bloque
    if (target > lastVal) continue;

    // Caso 3: buscar secuencialmente dentro del bloque
    for (let r = 0; r < filas; r++) {
      const cell = colBlock.children[r + 1];

      cell.classList.add('highlight-check');
      await sleep(350);

      if (matrix[r][c] === target) {
        //  eliminar valor
        matrix[r][c] = null;

        //  reorganizar matriz
        reorganizeMatrix();
        render();
        return;
      }

      cell.classList.remove('highlight-check');
    }
  }

  // no encontrado en ningún bloque
  alert("Clave no encontrada");
});
  function reorganizeMatrix() {
  // 1. extraer valores no nulos
  const values = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c] !== null) values.push(matrix[r][c]);
    }
  }

  // 2. ordenar
  values.sort((a, b) => a - b);

  // 3. reconstruir matriz columna por columna
  const M = maxKeys;
  const { filas, columnas } = computeDimensions(M);
  matrix = Array.from({ length: filas }, () => Array(columnas).fill(null));

  let idx = 0;
  for (let c = 0; c < columnas; c++) {
    for (let r = 0; r < filas; r++) {
      if (idx < values.length) {
        matrix[r][c] = values[idx++];
      }
    }
  }
}

function saveMatrixToFile() {
  if (!matrix) return showWarn("No hay datos para guardar");

  let lines = [];
  lines.push(String(keyLength));   // primera línea = tamaño de clave
  lines.push(String(maxKeys));     // segunda línea = cantidad máxima de claves

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      const val = matrix[r][c];
      lines.push(val === null ? "" : String(val));
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "matriz_bloques.dat";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function loadMatrixFromText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim());

  // Leer parámetros guardados
  keyLength = parseInt(lines.shift(), 10);
  maxKeys = parseInt(lines.shift(), 10);

  const M = maxKeys;
  const { filas, columnas } = computeDimensions(M);

  // 1) Extraer valores válidos (no vacíos)
  const values = [];
  for (const l of lines) {
    if (l !== "") values.push(parseInt(l, 10));
  }

  // 2) Ordenar los valores
  values.sort((a, b) => a - b);

  // 3) Reconstruir matriz columna x columna
  matrix = Array.from({ length: filas }, () => Array(columnas).fill(null));

  let idx = 0;
  for (let c = 0; c < columnas; c++) {
    for (let r = 0; r < filas; r++) {
      if (idx < values.length) {
        matrix[r][c] = values[idx++];
      }
    }
  }

  // 4) Renderizar visualmente
  setTimeout(() => render(), 150); // pequeño delay para animaciones suaves
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

function getKeyPosition(value) {
  const filas = matrix.length;
  const columnas = matrix[0].length;

  for (let c = 0; c < columnas; c++) {
    for (let r = 0; r < filas; r++) {
      if (matrix[r][c] === value) {
        return { fila: r, col: c };
      }
    }
  }
  return null;
}
btnBack.addEventListener('click', () => {
    window.electronAPI.navigateTo("src/Index/index.html");
  });





  render();

})();