// app.js — lógica traducida desde BinarySearch.java
// Mantiene la misma lógica: array de Integer|null, inserción sin duplicados,
// búsqueda binaria (simulada para pasos), eliminación dejando null y ordenando nulls al final,
// guardado/recuperación de archivo con primer línea = longitud de clave o vacío.

(() => {
  // Estado
  let array = null;               // arreglo de Integer | null
  let keyLength = null;           // longitud de la clave (Number)
  const MINT = '#7cd4bb';
  const DANGER = '#d25f5f';

  // DOM
  const sizeArrayEl = document.getElementById('sizeArray');
  const keyLengthEl = document.getElementById('keyLength');
  const txtKeyEl = document.getElementById('txtKey');
  const btnCreate = document.getElementById('btnCreate');
  const btnInsert = document.getElementById('btnInsert');
  const btnSearch = document.getElementById('btnSearch');
  const btnDelete = document.getElementById('btnDelete');
  const btnSave = document.getElementById('btnSave');
  const btnOpen = document.getElementById('btnOpen');
  const fileInput = document.getElementById('fileInput');
  const cellsWrap = document.getElementById('cellsWrap');
  const btnBack = document.getElementById('btnBack');


  // Utilidades
  function showWarn(msg) { alert(msg); }
  function showInfo(msg) { alert(msg); }

  function render() {
    // vaciar contenedor
    cellsWrap.innerHTML = '';
    if (!array) {
      const hint = document.createElement('div');
      hint.style.color = 'var(--muted)';
      hint.innerText = 'No hay estructura: crea para comenzar.';
      cellsWrap.appendChild(hint);
      return;
    }

    array.forEach((val, i) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (val === null ? ' empty' : '');
      cell.dataset.index = i;
      const idx = document.createElement('div');
      idx.className = 'idx';
      idx.innerText = `#${i + 1}`;
      const v = document.createElement('div');
      v.className = 'val';
      v.innerText = val === null ? '' : String(val);
      cell.appendChild(idx);
      cell.appendChild(v);
      cellsWrap.appendChild(cell);
    });
  }

  // Ordena dejando nulls al final
  function sortWithNulls(arr) {
    arr.sort((a, b) => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
  }

  // Crear arreglo
  btnCreate.addEventListener('click', () => {
    const size = Math.max(1, parseInt(sizeArrayEl.value || '0', 10));
    if (isNaN(size) || size <= 0) return showWarn('Tamaño inválido');
    array = new Array(size).fill(null);
    const kl = parseInt(keyLengthEl.value || '0', 10);
    keyLength = isNaN(kl) || kl <= 0 ? null : kl;
    render();
  });

  // Insertar
  btnInsert.addEventListener('click', () => {
    if (!array) return showWarn('Por Favor crea la estructura');
    const input = (txtKeyEl.value || '').trim();
    const value = parseInt(input, 10);
    if (isNaN(value)) return showWarn('Valor inválido');

    if (keyLength == null) return showWarn('Longitud de claves no definida');
    if (input.length !== keyLength) return showWarn(`Todas las claves deben tener ${keyLength} dígitos`);

    // 2. validar repetidos
    for (const existing of array) {
      if (existing !== null && existing === value) {
        return showWarn(`La clave ${value} ya existe en la tabla`);
      }
    }

    // 3. buscar primer espacio libre
    let freeIndex = -1;
    for (let i = 0; i < array.length; i++) {
      if (array[i] === null) { freeIndex = i; break; }
    }
    if (freeIndex === -1) return showWarn('No se pudo insertar, la tabla está llena');

    // insertar y ordenar
    array[freeIndex] = value;
    sortWithNulls(array);
    render();
  });



  // Generar pasos de búsqueda binaria (simula exactamente la versión Java)
  function binarySearchSteps(value) {
    const steps = [];
    let low = 0, high = array.length - 1;
    let foundIndex = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      steps.push(mid);

      if (array[mid] === null) {
        // si es null, reducimos rango por la izquierda (igual que en Java)
        high = mid - 1;
        continue;
      }

      if (array[mid] === value) {
        foundIndex = mid;
        break;
      } else if (array[mid] < value) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return { steps, foundIndex };
  }

  function scrollCellIntoView(index) {
    const el = cellsWrap.querySelector(`.cell[data-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  // Animación de búsqueda
  function animateSearch(steps, foundIndex, onFinished) {
    if (!array) return;
    // deshabilitar entrada
    txtKeyEl.disabled = true;
    let i = 0;
    const interval = setInterval(() => {
      // limpiar highlights
      Array.from(cellsWrap.querySelectorAll('.cell')).forEach(c => {
        c.classList.remove('highlight-found', 'highlight-discard');
      });

      if (i >= steps.length) {
        clearInterval(interval);
        if (foundIndex === -1) {
          showInfo('Valor no encontrado (colisión o nunca insertado)');
        }
        txtKeyEl.disabled = false;
        if (onFinished) onFinished();
        return;
      }

      const pos = steps[i];
      const cell = cellsWrap.querySelector(`.cell[data-index="${pos}"]`);
      if (cell) {
        if (pos === foundIndex) {
          cell.classList.add('highlight-found');
          scrollCellIntoView(pos);
          clearInterval(interval);
          txtKeyEl.disabled = false;
          if (onFinished) onFinished();
          return;
        } else {
          cell.classList.add('highlight-discard');
          scrollCellIntoView(pos);
        }
      }
      i++;
    }, 450);
  }

  // Buscar (botón)
  btnSearch.addEventListener('click', () => {
    if (!array) return showWarn('Debe insertar al menos una clave');
    const input = (txtKeyEl.value || '').trim();
    const value = parseInt(input, 10);
    if (isNaN(value)) return showWarn('Valor de búsqueda inválido');
    if (keyLength == null) return showWarn('Debe insertar al menos una clave');
    if (input.length !== keyLength) return showWarn(`Todas las claves deben tener ${keyLength} dígitos`);

    render(); // refrescar vista antes de animación
    const { steps, foundIndex } = binarySearchSteps(value);
    animateSearch(steps, foundIndex, null);
  });

  // Animación de eliminación (similar a la de Java, con callback)
  function animateDelete(steps, foundIndex, onFinished) {
    if (!array) return;
    txtKeyEl.disabled = true;
    let i = 0;
    const interval = setInterval(() => {
      Array.from(cellsWrap.querySelectorAll('.cell')).forEach(c => {
        c.classList.remove('highlight-found', 'highlight-discard');
      });

      if (i >= steps.length) {
        clearInterval(interval);
        if (foundIndex === -1) {
          showInfo('Valor no encontrado (colisión o nunca insertado)');
        }
        txtKeyEl.disabled = false;
        if (onFinished) onFinished();
        return;
      }

      const pos = steps[i];
      const cell = cellsWrap.querySelector(`.cell[data-index="${pos}"]`);
      if (cell) {
        if (pos === foundIndex) {
          cell.classList.add('highlight-found');
          scrollCellIntoView(pos);
          // Pausa breve y luego termina para que el usuario vea el encontrado
          setTimeout(() => {
            clearInterval(interval);
            txtKeyEl.disabled = false;
            if (onFinished) onFinished();
          }, 350);
          return;
        } else {
          cell.classList.add('highlight-discard');
          scrollCellIntoView(pos);
        }
      }
      i++;
    }, 400);
  }

  // Eliminar
  btnDelete.addEventListener('click', () => {
    if (!array) return showWarn('Debe insertar al menos una clave');
    const input = (txtKeyEl.value || '').trim();
    const value = parseInt(input, 10);
    if (isNaN(value)) return showWarn('Valor inválido');
    if (keyLength == null) return showWarn('Debe insertar al menos una clave');
    if (input.length !== keyLength) return showWarn(`Todas las claves deben tener ${keyLength} dígitos`);

    render();
    const { steps, foundIndex } = binarySearchSteps(value);
    // En Java el callback borraba y reordenaba; aquí replicamos eso.
    animateDelete(steps, foundIndex, () => {
      if (foundIndex !== -1) {
        array[foundIndex] = null;
        sortWithNulls(array);
        render();
      }
    });
  });

  // Guardar -> crear archivo de texto con el mismo formato Java
  btnSave.addEventListener('click', () => {
    if (!array) return showWarn('No hay nada para guardar');
    // primera línea = keyLength o vacío
    const lines = [];
    lines.push(keyLength == null ? '' : String(keyLength));
    for (const v of array) {
      lines.push(v === null ? '' : String(v));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const filename = 'binarysearch.bin';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  });

  // Abrir -> input file
  btnOpen.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const lines = text.split(/\r?\n/);
        // primera línea = longitud de claves
        const first = (lines.shift() || '').trim();
        keyLength = (first === '') ? null : parseInt(first, 10);
        // resto: cada linea -> number o null
        const parsed = [];
        for (const L of lines) {
          const t = (L || '').trim();
          if (t === '') parsed.push(null);
          else parsed.push(parseInt(t, 10));
        }
        array = parsed.length ? parsed : null;
        // Asegurarse que es array (si se cargó vacío, crear 0-length)
        if (!array) array = null;
        // update inputs UI
        if (array) {
          sizeArrayEl.value = array.length;
        }
        keyLengthEl.value = keyLength == null ? '' : String(keyLength);
        render();
        showInfo('Archivo cargado correctamente.');
      } catch (err) {
        showWarn('Error al abrir: ' + err);
      } finally {
        fileInput.value = '';
      }
    };
    reader.readAsText(f);
  });

  // Volver
  btnBack.addEventListener('click', () => {
    window.electronAPI.navigateTo("src/Index/index.html");
  });

  // Render inicial
  render();

})();
