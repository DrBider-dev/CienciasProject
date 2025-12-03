(() => {

  let matrix = null;          // matriz principal
  let maxKeys = null;         // tamaño máximo de claves permitido
  let keyLength = null;       // longitud de cada clave
  const MAX_VISIBLE_ROWS = 8; // Constante para visualización parcial

  // DOM
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

  function reorganizeMatrix() {
    const values = flattenMatrix(matrix);
    const { filas, columnas } = computeDimensions(maxKeys);
    matrix = rebuildMatrix(values, filas, columnas);
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

  // ---- Helper para obtener bloque DOM ----
  function getColBlockForRealIndex(realCol) {
    if (!matrix) return null;

    // Caso normal
    if (maxKeys < 100) {
      return cellsWrap.children[realCol] || null;
    }

    // Caso visualización parcial
    const MAX = MAX_VISIBLE_ROWS;
    const columnas = matrix[0].length;
    const visibleCols = [];
    for (let i = 0; i < MAX; i++) {
      if (i === MAX - 1) visibleCols.push(columnas - 1);
      else visibleCols.push(Math.floor(i * (columnas - 1) / (MAX - 1)));
    }

    const visibleIndex = visibleCols.indexOf(realCol);
    if (visibleIndex === -1) return null;
    return cellsWrap.children[visibleIndex] || null;
  }

  // ---- Función Unificada de Búsqueda ----
  async function findValue(target, isDelete = false) {
    const filas = matrix.length;
    const columnas = matrix[0].length;

    document.querySelectorAll('.cell').forEach(c =>
      c.classList.remove('highlight-found', 'highlight-check', 'highlight-last')
    );

    let left = 0;
    let right = columnas - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const colBlock = getColBlockForRealIndex(mid);
      const animateThisColumn = !!colBlock;

      const lastR = filas - 1;
      const lastVal = matrix[lastR][mid];
      const firstVal = matrix[0][mid];

      // Animar revisión de columna
      if (animateThisColumn) {
        if (colBlock) {
          colBlock.style.borderColor = 'var(--accent)';
          await sleep(450);
          colBlock.style.borderColor = '';

          const visibleCells = colBlock.querySelectorAll('.cell');
          if (visibleCells.length > 0) {
            const lastVisible = visibleCells[visibleCells.length - 1];
            lastVisible.classList.add('highlight-last');
            await sleep(450);
            lastVisible.classList.remove('highlight-last');
          }
        }
      }

      // --- Lógica de descarte de columnas ---
      if (lastVal === null) {
        if (firstVal === null) {
          right = mid - 1;
          continue;
        }
        if (target > firstVal) {
          // Simplificación: buscamos en esta columna.
        } else if (target < firstVal) {
          right = mid - 1;
          continue;
        }
      } else {
        if (target > lastVal) {
          left = mid + 1;
          continue;
        }
        if (target < firstVal) {
          right = mid - 1;
          continue;
        }
      }

      // --- Búsqueda Lineal dentro de la columna ---
      if (animateThisColumn) {
        for (let r = 0; r < filas; r++) {
          let cell = null;

          if (maxKeys < 100) {
            cell = colBlock.children[r + 1];
          } else {
            const MAX = MAX_VISIBLE_ROWS;
            if (r < Math.min(MAX, filas)) {
              cell = colBlock.children[r + 1];
            }
          }

          if (cell) cell.classList.add('highlight-check');
          await sleep(350);

          if (matrix[r][mid] === target) {
            if (cell) {
              cell.classList.remove('highlight-check');
              cell.classList.add('highlight-found');
            } else {
              // --- CASO: Clave encontrada pero NO visible ---
              // Mostrar la clave en la última posición visible de este bloque
              const visibleCells = colBlock.querySelectorAll('.cell');
              if (visibleCells.length > 0) {
                const lastVisibleCell = visibleCells[visibleCells.length - 1];

                // Guardar valor original para restaurar si fuera necesario (aunque en delete se borra)
                // Para visualización, simplemente sobrescribimos visualmente
                const originalText = lastVisibleCell.querySelector('.val').innerText;

                lastVisibleCell.querySelector('.val').innerText = target;
                lastVisibleCell.classList.add('highlight-found');

                // Opcional: indicar visualmente que es un "proxy"
                lastVisibleCell.style.border = "2px dashed var(--accent)";
              }
            }

            // Mostrar mensaje detallado
            await sleep(100); // Breve pausa para ver el highlight
            alert(`Encontrado en Bloque ${mid + 1}, Posición ${r + 1}`);

            if (isDelete) {
              matrix[r][mid] = null;
              reorganizeMatrix();
              await new Promise(r => requestAnimationFrame(r));
              render();
            }
            return { found: true, r, c: mid };
          }

          if (cell) cell.classList.remove('highlight-check');
        }
      } else {
        // Búsqueda sin animación (columna no visible)
        for (let r = 0; r < filas; r++) {
          if (matrix[r][mid] === target) {
            alert(`Encontrado en Bloque ${mid + 1}, Posición ${r + 1}`);
            if (isDelete) {
              matrix[r][mid] = null;
              reorganizeMatrix();
              await new Promise(r => requestAnimationFrame(r));
              render();
            }
            return { found: true, r, c: mid };
          }
        }
      }

      return { found: false };
    }

    return { found: false };
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

    let values = flattenMatrix(matrix);

    if (values.includes(value)) return showWarn("La clave ya existe");
    if (values.length >= maxKeys) return showWarn("La matriz está llena");

    values.push(value);
    values.sort((a, b) => a - b);

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

    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    document.querySelectorAll('.cell').forEach(c =>
      c.classList.remove('highlight-found', 'highlight-check', 'highlight-last')
    );

    // ---- BÚSQUEDA BINARIA SOBRE LAS COLUMNAS ----
    let left = 0;
    let right = columnas - 1;

    while (left <= right) {

      // Si columnas es impar → tomar el pivote hacia la izquierda
      let mid = Math.floor((left + right) / 2);

      const lastR = filas - 1;
      const lastVal = matrix[lastR][mid];

      // Animar la revisión del último elemento de la columna
      const colBlock = cellsWrap.children[mid];
      const lastCell = colBlock.children[lastR + 1];
      lastCell.classList.add('highlight-last');
      await sleep(450);
      lastCell.classList.remove('highlight-last');

      if (lastVal === null) {
        // La columna aún no está llena → el dato debe estar antes
        right = mid - 1;
        continue;
      }

      if (target > lastVal) {
        // El objetivo está en una columna más a la derecha
        left = mid + 1;
      } else {
        // El objetivo está en esta columna o a la izquierda
        right = mid - 1;

        // ------ Buscar secuencial dentro de esta columna ------
        for (let r = 0; r < filas; r++) {
          const cell = colBlock.children[r + 1];
          cell.classList.add('highlight-check');
          await sleep(350);

          if (matrix[r][mid] === target) {
            cell.classList.remove('highlight-check');
            cell.classList.add('highlight-found');
            return;
          }
          cell.classList.remove('highlight-check');
        }
      }
    }

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

    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    document.querySelectorAll('.cell').forEach(c =>
      c.classList.remove('highlight-found', 'highlight-check', 'highlight-last')
    );

    // helper: obtener el bloque DOM correspondiente a una columna "real"
    function getColBlockForRealIndex(realCol) {
      // si no estamos en vista proporcional, hay un bloque por columna
      if (!matrix || maxKeys < 100) {
        return cellsWrap.children[realCol] || null;
      }

      // si estamos en vista proporcional, calcular los índices visibles
      const MAX = 8;
      const visibleCols = [];
      for (let i = 0; i < MAX; i++) {
        if (i === MAX - 1) visibleCols.push(columnas - 1);
        else visibleCols.push(Math.floor(i * (columnas - 1) / (MAX - 1)));
      }

      const visibleIndex = visibleCols.indexOf(realCol);
      if (visibleIndex === -1) return null; // no está renderizado en la vista proporcional
      return cellsWrap.children[visibleIndex] || null;
    }

    // --- Búsqueda Binaria de Columnas (sobre índices reales) ---
    let left = 0;
    let right = columnas - 1;

    while (left <= right) {

      const mid = Math.floor((left + right) / 2);
      const colBlock = getColBlockForRealIndex(mid); // puede ser null en vista proporcional

      const lastR = filas - 1;
      const lastVal = matrix[lastR][mid];
      const firstVal = matrix[0][mid];

      const animateThisColumn = !!colBlock; // animar sólo si el bloque está en el DOM

      // Animar (si existe el bloque). Si no existe, hacemos el chequeo internamente sin animación.
      if (animateThisColumn) {
        const lastCell = colBlock.children[lastR + 1]; // +1 por el título
        if (lastCell) {
          lastCell.classList.add('highlight-last');
          await sleep(450);
          lastCell.classList.remove('highlight-last');
        }
      }

      // ---- REGLAS DE SALTO ----
      if (lastVal === null) {
        // Columna aparentemente no llena (no hay último valor)

        // Si la primera también está vacía → columna totalmente vacía → descartar hacia la izquierda
        if (firstVal === null) {
          right = mid - 1;
          continue;
        }

        // La regla que pediste: si el target es mayor que el primer elemento -> saltar columna hacia la izquierda
        if (target > firstVal) {
          right = mid - 1;
          continue;
        }

        // Si llegamos aquí → debemos buscar dentro de la columna.
        // Si el bloque está en DOM hacemos la animación; si no, buscamos internamente sin animación.
        if (animateThisColumn) {
          // buscar con animación
          for (let r = 0; r < filas; r++) {
            const cell = colBlock.children[r + 1];
            if (cell) cell.classList.add('highlight-check');
            await sleep(350);

            if (matrix[r][mid] === target) {
              // eliminar, reorganizar y refrescar DOM
              matrix[r][mid] = null;
              reorganizeMatrix();
              await new Promise(r => requestAnimationFrame(r));
              render();
              return;
            }

            if (cell) cell.classList.remove('highlight-check');
          }
        } else {
          // buscar internamente sin animación
          for (let r = 0; r < filas; r++) {
            if (matrix[r][mid] === target) {
              matrix[r][mid] = null;
              rebuildMatrix();
              await new Promise(r => requestAnimationFrame(r));
              render();
              return;
            }
          }
        }

        // Si no se encontró en esta columna visible/no visible
        alert("Clave no encontrada");
        return;
      }

      // Si lastVal existe, seguir lógica binaria normal

      // Si target > lastVal → objetivo está en una columna más a la derecha
      if (target > lastVal) {
        left = mid + 1;
        continue;
      }

      // Si target < firstVal → no puede estar en esta columna ni en la derecha (porque columnas a la derecha empiezan con >= lastVal de esta columna),
      // por nuestra organización movemos la búsqueda hacia la izquierda.
      if (target < firstVal) {
        right = mid - 1;
        continue;
      }

      // Si aquí: target está dentro del rango [firstVal, lastVal] de esta columna -> buscar en la columna
      if (animateThisColumn) {
        // búsqueda con animación
        for (let r = 0; r < filas; r++) {
          const cell = colBlock.children[r + 1];
          if (cell) cell.classList.add('highlight-check');
          await sleep(350);

          if (matrix[r][mid] === target) {
            matrix[r][mid] = null;
            reorganizeMatrix();
            await new Promise(r => requestAnimationFrame(r));
            render();
            return;
          }

          if (cell) cell.classList.remove('highlight-check');
        }
      } else {
        // búsqueda sin animación (columna no renderizada)
        for (let r = 0; r < filas; r++) {
          if (matrix[r][mid] === target) {
            matrix[r][mid] = null;
            reorganizeMatrix();
            await new Promise(r => requestAnimationFrame(r));
            render();
            return;
          }
        }
      }

      // Si no lo encontramos en la columna actual, terminamos la búsqueda (porque si target estaba entre first y last y no aparece, no existe)
      alert("Clave no encontrada");
      return;
    }

    // si el while terminó sin encontrar
    alert("Clave no encontrada");
  });



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