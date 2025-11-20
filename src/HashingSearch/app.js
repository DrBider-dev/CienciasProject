// Lógica migrada desde HashingSearch.java (sin cambiar la lógica)
// - Arrays: arrayMod, arraySqr, arrayFold, arrayTrunk
// - Longitudes: longitudClavesMod, longitudClavesSqr, longitudClavesFold, longitudClavesTrunk
// - Hashing functions kept identical en comportamiento al Java original

// Estado
let arrayMod = null;
let arraySqr = null;
let arrayFold = null;
let arrayTrunk = null;

let longitudClavesMod = null;
let longitudClavesSqr = null;
let longitudClavesFold = null;
let longitudClavesTrunk = null;

let collisionMod = 'linear';
let collisionSqr = 'linear';
let collisionFold = 'linear';
let collisionTrunk = 'linear';

const DELETED = '[[DELETED]]';

const cellsWrap = document.getElementById('cellsWrap');
const hashSelect = document.getElementById('hashSelect');
const collisionSelect = document.getElementById('collisionSelect');
const sizeArray = document.getElementById('sizeArray');
const sizeKey = document.getElementById('sizeKey');
const keyInput = document.getElementById('keyInput');
const createBtn = document.getElementById('createBtn');
const insertBtn = document.getElementById('insertBtn');
const searchBtn = document.getElementById('searchBtn');
const deleteBtn = document.getElementById('deleteBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const fileInput = document.getElementById('fileInput');
const logoImg = document.getElementById('logo');
const returnBtn = document.getElementById('returnBtn');

createBtn.addEventListener('click', onCreateArray);
insertBtn.addEventListener('click', onInsert);
searchBtn.addEventListener('click', onSearch);
deleteBtn.addEventListener('click', onDelete);
saveBtn.addEventListener('click', onSave);
loadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', onFileSelected);
hashSelect.addEventListener('change', () => { refreshCellsUI(); });
returnBtn.addEventListener('click', onReturn);

// Mantener icono inicial
setIcon();
refreshCellsUI();

/* ---------------------- UTILIDADES UI ---------------------- */

function refreshCellsUI() {
  const arr = getArray();
  cellsWrap.innerHTML = '';
  cellsWrap.appendChild(createSpacer(8));
  if (!arr) {
    const txt = document.createElement('div');
    txt.style.color = 'var(--muted)';
    txt.style.padding = '24px';
    txt.textContent = 'No hay estructura: crea para comenzar.';
    cellsWrap.appendChild(txt);
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const c = createCell(i + 1, arr[i]);
    cellsWrap.appendChild(c);
  }
}

function createSpacer(w = 8) {
  const d = document.createElement('div');
  d.style.width = w + 'px';
  return d;
}

function createCell(position, value) {
  const el = document.createElement('div');
  let displayVal = '';
  let isEmpty = false;

  if (value == null) {
    isEmpty = true;
  } else if (value === DELETED) {
    displayVal = 'X'; // Deleted marker
  } else if (Array.isArray(value)) {
    // Chaining / Nested
    if (value.length === 0) isEmpty = true;
    else displayVal = value.join(', ');
  } else {
    displayVal = value;
  }

  el.className = 'cell' + (isEmpty ? ' empty' : '');
  el.dataset.pos = position - 1;

  const idx = document.createElement('div');
  idx.className = 'idx';
  idx.textContent = position;

  const val = document.createElement('div');
  val.className = 'val';
  val.textContent = displayVal;

  el.appendChild(idx);
  el.appendChild(val);
  return el;
}

function clearHighlights() {
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('highlight-found', 'highlight-discard');
  });
}

function scrollCellToVisible(index) {
  const cell = getCellElement(index);
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const parentRect = cellsWrap.parentElement.getBoundingClientRect();
  // Simple scroll: bring into view horizontally/vertically by centering
  cell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

function getCellElement(index) {
  // index es 0-based
  const cells = Array.from(document.querySelectorAll('.cell'));
  return cells[index] || null;
}


/* ---------------------- HASH FUNCTIONS (igual que en Java) ---------------------- */

function modHash(clave, tamañoArreglo) {
  return clave % tamañoArreglo;
}

function middleSquareHash(clave, tamañoArreglo) {
  const square = BigInt(clave) * BigInt(clave);
  const squareTxt = square.toString();

  const length = String(tamañoArreglo).length;
  const need = length - 1; // cantidad de dígitos centrales requeridos

  const start = Math.floor((squareTxt.length - need) / 2);
  const end = start + need;
  // En el Java original no se hace modulo por tamañoArreglo aquí; replicamos exactamente
  const hash = squareTxt.substring(start, end);
  return parseInt(hash, 10);
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

  const index = parseInt(part, 10) % tamañoArreglo;
  return index;
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
  const index = sum % tamañoArreglo;
  return index;
}

/* ---------------------- OPERACIONES (Crear / Insertar / Buscar / Eliminar) ---------------------- */

/* ---------------------- COLLISION LOGIC ---------------------- */

function getSecondaryHash(key, size) {
  // h2(k) = 1 + (k % (size - 1))
  // Ensure size > 1
  if (size <= 1) return 1;
  return 1 + (key % (size - 1));
}

function performInsert(array, key, startIdx, strategy) {
  const n = array.length;

  if (strategy === 'chaining' || strategy === 'nested') {
    // Buckets
    if (array[startIdx] == null) {
      array[startIdx] = [key];
      return { success: true };
    } else if (Array.isArray(array[startIdx])) {
      if (array[startIdx].includes(key)) {
        return { success: false };
      }
      array[startIdx].push(key);
      return { success: true };
    } else {
      // Should not happen if consistent
      return { success: false, msg: 'No se pudo insertar' };
    }
  }

  // Probing
  let idx = startIdx;
  let h2 = (strategy === 'double') ? getSecondaryHash(key, n) : 0;

  for (let i = 0; i < n; i++) {
    if (strategy === 'linear') {
      idx = (startIdx + i) % n;
    } else if (strategy === 'quadratic') {
      idx = (startIdx + i * i) % n;
    } else if (strategy === 'double') {
      idx = (startIdx + i * h2) % n;
    }

    if (array[idx] == null || array[idx] === DELETED) {
      array[idx] = key;
      return { success: true };
    } else if (array[idx] === key) {
      return { success: false };
    }
  }
  return { success: false };
}

function performSearch(array, key, startIdx, strategy) {
  const n = array.length;
  const steps = [];
  let foundIndex = -1;

  if (strategy === 'chaining' || strategy === 'nested') {
    steps.push(startIdx);
    if (array[startIdx] && Array.isArray(array[startIdx]) && array[startIdx].includes(key)) {
      foundIndex = startIdx;
    }
    return { steps, foundIndex };
  }

  // Probing
  let idx = startIdx;
  let h2 = (strategy === 'double') ? getSecondaryHash(key, n) : 0;

  for (let i = 0; i < n; i++) {
    if (strategy === 'linear') {
      idx = (startIdx + i) % n;
    } else if (strategy === 'quadratic') {
      idx = (startIdx + i * i) % n;
    } else if (strategy === 'double') {
      idx = (startIdx + i * h2) % n;
    }

    steps.push(idx);
    if (array[idx] === key) {
      foundIndex = idx;
      break;
    }
    if (array[idx] == null) {
      // Empty slot found, stop
      break;
    }
    // If DELETED, continue
  }
  return { steps, foundIndex };
}

function performDelete(array, key, startIdx, strategy) {
  const n = array.length;

  if (strategy === 'chaining' || strategy === 'nested') {
    if (array[startIdx] && Array.isArray(array[startIdx])) {
      const bucket = array[startIdx];
      const idxInBucket = bucket.indexOf(key);
      if (idxInBucket !== -1) {
        bucket.splice(idxInBucket, 1);
        if (bucket.length === 0) array[startIdx] = null; // Optional: cleanup
        return { success: true, msg: 'Eliminado de lista en ' + (startIdx + 1), steps: [startIdx], foundIndex: startIdx };
      }
    }
    return { success: false, msg: 'No encontrado', steps: [startIdx], foundIndex: -1 };
  }

  // Probing
  const { steps, foundIndex } = performSearch(array, key, startIdx, strategy);
  if (foundIndex !== -1) {
    array[foundIndex] = DELETED;
    return { success: true, msg: 'Eliminado de posición ' + (foundIndex + 1), steps, foundIndex };
  }
  return { success: false, msg: 'No encontrado', steps, foundIndex: -1 };
}

function onCreateArray() {
  try {
    const selected = hashSelect.value;
    const size = Math.max(1, parseInt(sizeArray.value.trim(), 10));
    const keyLen = Math.max(1, parseInt(sizeKey.value.trim(), 10));

    const collision = collisionSelect.value;

    switch (selected) {
      case 'H. Mod':
        arrayMod = new Array(size).fill(null);
        longitudClavesMod = keyLen;
        collisionMod = collision;
        break;
      case 'H. Cuadrado':
        arraySqr = new Array(size).fill(null);
        longitudClavesSqr = keyLen;
        collisionSqr = collision;
        break;
      case 'H. Plegamiento':
        arrayFold = new Array(size).fill(null);
        longitudClavesFold = keyLen;
        collisionFold = collision;
        break;
      case 'H. Truncamiento':
        arrayTrunk = new Array(size).fill(null);
        longitudClavesTrunk = keyLen;
        collisionTrunk = collision;
        break;
    }
    refreshCellsUI();
  } catch (e) {
    alert('Tamaño inválido');
  }
}

function onInsert() {
  try {
    const metodoActual = hashSelect.value;
    const input = keyInput.value.trim();
    const key = parseInt(input, 10);

    let arr, len, col, idx;

    switch (metodoActual) {
      case 'H. Mod':
        arr = arrayMod; len = longitudClavesMod; col = collisionMod;
        if (!arr) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (len == null) { alert('Longitud no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = modHash(key, arr.length);
        break;
      case 'H. Cuadrado':
        arr = arraySqr; len = longitudClavesSqr; col = collisionSqr;
        if (!arr) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (len == null) { alert('Longitud no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = middleSquareHash(key, arr.length);
        break;
      case 'H. Plegamiento':
        arr = arrayFold; len = longitudClavesFold; col = collisionFold;
        if (!arr) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (len == null) { alert('Longitud no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = foldingHash(key, arr.length);
        break;
      case 'H. Truncamiento':
        arr = arrayTrunk; len = longitudClavesTrunk; col = collisionTrunk;
        if (!arr) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (len == null) { alert('Longitud no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = truncationHash(key, arr.length);
        break;
    }

    const result = performInsert(arr, key, idx, col);
    if (result.success) {
      refreshCellsUI();
    } else {
      alert(result.msg);
    }

  } catch (ex) {
    alert('Valor inválido');
  }
}

function onSearch() {
  try {
    const metodoActual = hashSelect.value;
    const input = keyInput.value.trim();
    const key = parseInt(input, 10);

    let arr, len, col, idx;

    switch (metodoActual) {
      case 'H. Mod':
        arr = arrayMod; len = longitudClavesMod; col = collisionMod;
        if (len == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = modHash(key, arr ? arr.length : 0);
        break;
      case 'H. Cuadrado':
        arr = arraySqr; len = longitudClavesSqr; col = collisionSqr;
        if (len == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = middleSquareHash(key, arr ? arr.length : 0);
        break;
      case 'H. Plegamiento':
        arr = arrayFold; len = longitudClavesFold; col = collisionFold;
        if (len == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = foldingHash(key, arr ? arr.length : 0);
        break;
      case 'H. Truncamiento':
        arr = arrayTrunk; len = longitudClavesTrunk; col = collisionTrunk;
        if (len == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== len) { alert('Todas las claves deben tener ' + len + ' dígitos'); return; }
        idx = truncationHash(key, arr ? arr.length : 0);
        break;
    }

    if (!arr) { alert('Estructura no creada'); return; }

    clearHighlights();
    const { steps, foundIndex } = performSearch(arr, key, idx, col);
    animateSearch(steps, foundIndex);

  } catch (ex) {
    alert('Valor inválido');
  }
}

function onDelete() {
  try {
    const metodoActual = hashSelect.value;
    const input = keyInput.value.trim();
    const key = parseInt(input, 10);

    let arr, len, col, idx;

    switch (metodoActual) {
      case 'H. Mod':
        arr = arrayMod; len = longitudClavesMod; col = collisionMod;
        idx = modHash(key, arr ? arr.length : 0);
        break;
      case 'H. Cuadrado':
        arr = arraySqr; len = longitudClavesSqr; col = collisionSqr;
        idx = middleSquareHash(key, arr ? arr.length : 0);
        break;
      case 'H. Plegamiento':
        arr = arrayFold; len = longitudClavesFold; col = collisionFold;
        idx = foldingHash(key, arr ? arr.length : 0);
        break;
      case 'H. Truncamiento':
        arr = arrayTrunk; len = longitudClavesTrunk; col = collisionTrunk;
        idx = truncationHash(key, arr ? arr.length : 0);
        break;
    }

    if (!arr) { alert('Estructura no creada'); return; }

    clearHighlights();
    const { steps, foundIndex, success, msg } = performDelete(arr, key, idx, col);

    animateDelete(steps, foundIndex, () => {
      if (success) {
        refreshCellsUI();
        alert(msg);
      } else {
        alert(msg);
      }
    });

  } catch (ex) {
    alert('Clave inválida');
  }
}

function onReturn() {
  window.electronAPI.navigateTo('src/Index/index.html');
}

/* ---------------------- ANIMACIONES (imitando Timer de Swing) ---------------------- */

function animateSearch(steps, foundIndex) {
  clearHighlights();
  let idx = 0;
  keyInput.disabled = true;

  const timer = setInterval(() => {
    if (idx >= steps.length) {
      if (foundIndex === -1) {
        alert('Valor no encontrado');
      }
      keyInput.disabled = false;
      clearInterval(timer);
      return;
    }
    const pos = steps[idx];
    const cell = getCellElement(pos);
    if (cell) {
      if (pos === foundIndex) {
        cell.classList.add('highlight-found');
        scrollCellToVisible(pos);
        keyInput.disabled = false;
        clearInterval(timer);
        return;
      } else {
        cell.classList.add('highlight-discard');
        scrollCellToVisible(pos);
      }
    }
    idx++;
  }, 400);
}

function animateDelete(steps, foundIndex, onFinished) {
  clearHighlights();
  let idx = 0;
  keyInput.disabled = true;

  const timer = setInterval(() => {
    if (idx >= steps.length) {
      if (foundIndex === -1) {
        alert('Valor no encontrado');
      }
      keyInput.disabled = false;
      clearInterval(timer);
      if (onFinished) onFinished();
      return;
    }
    const pos = steps[idx];
    const cell = getCellElement(pos);
    if (cell) {
      if (pos === foundIndex) {
        cell.classList.add('highlight-found');
        scrollCellToVisible(pos);
        keyInput.disabled = false;
        clearInterval(timer);
        if (onFinished) onFinished();
        return;
      } else {
        cell.classList.add('highlight-discard');
        scrollCellToVisible(pos);
      }
    }
    idx++;
  }, 400);
}

/* ---------------------- SAVE / LOAD (mismo formato .mod que en Java) ---------------------- */

function onSave() {
  // Crear contenido igual al Java: 4 primeras líneas longitudes (vacío si null), luego ---MOD--- etc.
  const lines = [];
  lines.push(longitudClavesMod != null ? String(longitudClavesMod) : '');
  lines.push(longitudClavesSqr != null ? String(longitudClavesSqr) : '');
  lines.push(longitudClavesFold != null ? String(longitudClavesFold) : '');
  lines.push(longitudClavesTrunk != null ? String(longitudClavesTrunk) : '');

  writeArrayToLines(lines, 'MOD', arrayMod);
  writeArrayToLines(lines, 'SQR', arraySqr);
  writeArrayToLines(lines, 'FOLD', arrayFold);
  writeArrayToLines(lines, 'TRUNK', arrayTrunk);

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'hashing.mod';
  a.click();
  URL.revokeObjectURL(url);
  alert('Archivo guardado correctamente.');
}

function writeArrayToLines(lines, name, arr) {
  lines.push('---' + name + '---');
  if (arr) {
    for (let v of arr) {
      if (v == null) lines.push('');
      else lines.push(String(v));
    }
  }
  lines.push('---END ' + name + '---');
}

function onFileSelected(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (!f.name.toLowerCase().endsWith('.mod')) {
    alert('El archivo seleccionado no corresponde a una búsqueda Hash Mod.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const text = ev.target.result;
      parseModFile(text);
      refreshCellsUI();
      alert('Archivo cargado correctamente.');
    } catch (err) {
      alert('Error al abrir: ' + err.message);
    }
  };
  reader.readAsText(f);
  // limpiar input para permitir volver a seleccionar el mismo archivo luego
  e.target.value = '';
}

function parseModFile(text) {
  const lines = text.split(/\r?\n/);
  let idx = 0;
  function nextLine() {
    return lines[idx++] || '';
  }
  longitudClavesMod = parsearEntero(nextLine().trim());
  longitudClavesSqr = parsearEntero(nextLine().trim());
  longitudClavesFold = parsearEntero(nextLine().trim());
  longitudClavesTrunk = parsearEntero(nextLine().trim());

  arrayMod = leerArray(lines, 'MOD');
  arraySqr = leerArray(lines, 'SQR');
  arrayFold = leerArray(lines, 'FOLD');
  arrayTrunk = leerArray(lines, 'TRUNK');
}

function parsearEntero(texto) {
  if (texto == null || texto === '') return null;
  const v = parseInt(texto, 10);
  return isNaN(v) ? null : v;
}

function leerArray(lines, nombreArray) {
  // Buscar inicio
  let i = 0;
  while (i < lines.length && lines[i].trim() !== '---' + nombreArray + '---') i++;
  if (i >= lines.length) return null;
  i++; // avanzar a la siguiente línea
  const lista = [];
  while (i < lines.length) {
    const linea = lines[i++].trim();
    if (linea === '---END ' + nombreArray + '---') break;
    if (linea !== '') lista.push(parseInt(linea, 10));
    else lista.push(null);
  }
  return lista;
}

/* ---------------------- AYUDAS / GETTERS ---------------------- */

function getArray() {
  const metodo = hashSelect.value;
  switch (metodo) {
    case 'H. Mod': return arrayMod;
    case 'H. Cuadrado': return arraySqr;
    case 'H. Plegamiento': return arrayFold;
    case 'H. Truncamiento': return arrayTrunk;
    default: return null;
  }
}
