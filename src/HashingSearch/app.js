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

const cellsWrap = document.getElementById('cellsWrap');
const hashSelect = document.getElementById('hashSelect');
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
    txt.textContent = 'No hay estructura: crea un arreglo para comenzar.';
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
  el.className = 'cell' + (value == null ? ' empty' : '');
  el.dataset.pos = position - 1;

  const idx = document.createElement('div');
  idx.className = 'idx';
  idx.textContent = position;

  const val = document.createElement('div');
  val.className = 'val';
  val.textContent = value == null ? '' : value;

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
  cell.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
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

function onCreateArray() {
  try {
    const selected = hashSelect.value;
    const size = Math.max(1, parseInt(sizeArray.value.trim(), 10));
    const keyLen = Math.max(1, parseInt(sizeKey.value.trim(), 10));

    switch (selected) {
      case 'H. Mod':
        arrayMod = new Array(size).fill(null);
        longitudClavesMod = keyLen;
        break;
      case 'H. Cuadrado':
        arraySqr = new Array(size).fill(null);
        longitudClavesSqr = keyLen;
        break;
      case 'H. Plegamiento':
        arrayFold = new Array(size).fill(null);
        longitudClavesFold = keyLen;
        break;
      case 'H. Truncamiento':
        arrayTrunk = new Array(size).fill(null);
        longitudClavesTrunk = keyLen;
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

    switch (metodoActual) {
      case 'H. Mod': {
        if (!arrayMod) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (longitudClavesMod == null) { alert('Longitud no definida'); return; }
        if (input.length !== longitudClavesMod) { alert('Todas las claves deben tener ' + longitudClavesMod + ' dígitos'); return; }

        const n = arrayMod.length;
        const index = modHash(key, n);

        if (arrayMod[index] != null && arrayMod[index] === key) {
          alert('La clave ' + key + ' ya existe en la tabla de ' + metodoActual);
          return;
        } else if (arrayMod[index] == null) {
          arrayMod[index] = key;
          refreshCellsUI();
          alert('Clave ' + key + ' insertada correctamente en ' + metodoActual);
        } else {
          refreshCellsUI();
          alert('No se pudo insertar, colisión en la posición ' + (index + 1) + ' para ' + metodoActual);
        }
        break;
      }
      case 'H. Cuadrado': {
        if (!arraySqr) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (longitudClavesSqr == null) { alert('Longitud no definida'); return; }
        if (input.length !== longitudClavesSqr) { alert('Todas las claves deben tener ' + longitudClavesSqr + ' dígitos'); return; }

        const n = arraySqr.length;
        const index = middleSquareHash(key, n);

        // Mismo comportamiento: no probing, no modulo adicional
        if (arraySqr[index] != null && arraySqr[index] === key) {
          alert('La clave ' + key + ' ya existe en la tabla de ' + metodoActual);
          return;
        } else if (arraySqr[index] == null) {
          arraySqr[index] = key;
          refreshCellsUI();
          alert('Clave ' + key + ' insertada correctamente en ' + metodoActual);
        } else {
          refreshCellsUI();
          alert('No se pudo insertar, colisión en la posición ' + (index + 1) + ' para ' + metodoActual);
        }
        break;
      }
      case 'H. Plegamiento': {
        if (!arrayFold) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (longitudClavesFold == null) { alert('Longitud no definida'); return; }
        if (input.length !== longitudClavesFold) { alert('Todas las claves deben tener ' + longitudClavesFold + ' dígitos'); return; }

        const n = arrayFold.length;
        const index = foldingHash(key, n);

        if (arrayFold[index] != null && arrayFold[index] === key) {
          alert('La clave ' + key + ' ya existe en la tabla de ' + metodoActual);
          return;
        } else if (arrayFold[index] == null) {
          arrayFold[index] = key;
          refreshCellsUI();
          alert('Clave ' + key + ' insertada correctamente en ' + metodoActual);
        } else {
          refreshCellsUI();
          alert('No se pudo insertar, colisión en la posición ' + (index + 1) + ' para ' + metodoActual);
        }
        break;
      }
      case 'H. Truncamiento': {
        if (!arrayTrunk) { alert('Por Favor cree la Estructura para ' + metodoActual); return; }
        if (longitudClavesTrunk == null) { alert('Longitud no definida'); return; }
        if (input.length !== longitudClavesTrunk) { alert('Todas las claves deben tener ' + longitudClavesTrunk + ' dígitos'); return; }

        const n = arrayTrunk.length;
        const index = truncationHash(key, n);

        if (arrayTrunk[index] != null && arrayTrunk[index] === key) {
          alert('La clave ' + key + ' ya existe en la tabla de ' + metodoActual);
          return;
        } else if (arrayTrunk[index] == null) {
          arrayTrunk[index] = key;
          refreshCellsUI();
          alert('Clave ' + key + ' insertada correctamente en ' + metodoActual);
        } else {
          refreshCellsUI();
          alert('No se pudo insertar, colisión en la posición ' + (index + 1) + ' para ' + metodoActual);
        }
        break;
      }
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

    switch (metodoActual) {
      case 'H. Mod': {
        if (longitudClavesMod == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== longitudClavesMod) { alert('Todas las claves deben tener ' + longitudClavesMod + ' dígitos'); return; }

        clearHighlights();
        const n = arrayMod ? arrayMod.length : 0;
        const index = modHash(key, n);
        const steps = [index];
        const foundIndex = (arrayMod && arrayMod[index] != null && arrayMod[index] === key) ? index : -1;
        animateSearch(steps, foundIndex);
        break;
      }
      case 'H. Cuadrado': {
        if (longitudClavesSqr == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== longitudClavesSqr) { alert('Todas las claves deben tener ' + longitudClavesSqr + ' dígitos'); return; }

        clearHighlights();
        const n = arraySqr ? arraySqr.length : 0;
        const index = middleSquareHash(key, n);
        const steps = [index];
        const foundIndex = (arraySqr && arraySqr[index] != null && arraySqr[index] === key) ? index : -1;
        animateSearch(steps, foundIndex);
        break;
      }
      case 'H. Plegamiento': {
        if (longitudClavesFold == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== longitudClavesFold) { alert('Todas las claves deben tener ' + longitudClavesFold + ' dígitos'); return; }

        clearHighlights();
        const n = arrayFold ? arrayFold.length : 0;
        const index = foldingHash(key, n);
        const steps = [index];
        const foundIndex = (arrayFold && arrayFold[index] != null && arrayFold[index] === key) ? index : -1;
        animateSearch(steps, foundIndex);
        break;
      }
      case 'H. Truncamiento': {
        if (longitudClavesTrunk == null) { alert('Longitud de claves no definida'); return; }
        if (input.length !== longitudClavesTrunk) { alert('Todas las claves deben tener ' + longitudClavesTrunk + ' dígitos'); return; }

        clearHighlights();
        const n = arrayTrunk ? arrayTrunk.length : 0;
        const index = truncationHash(key, n);
        const steps = [index];
        const foundIndex = (arrayTrunk && arrayTrunk[index] != null && arrayTrunk[index] === key) ? index : -1;
        animateSearch(steps, foundIndex);
        break;
      }
    }
  } catch (ex) {
    alert('Valor inválido');
  }
}

function onDelete() {
  try {
    const metodoActual = hashSelect.value;
    const input = keyInput.value.trim();
    const key = parseInt(input, 10);

    switch (metodoActual) {
      case 'H. Mod': {
        const n = arrayMod ? arrayMod.length : 0;
        const index = modHash(key, n);

        if (arrayMod && arrayMod[index] != null && arrayMod[index] === key) {
          arrayMod[index] = null;
          refreshCellsUI();
          alert('Clave ' + key + ' eliminada de la posición ' + (index + 1));
        } else {
          alert('La clave ' + key + ' no se encuentra en la tabla');
        }
        clearHighlights();

        const steps = [index];
        const foundIndex = (arrayMod && arrayMod[index] != null && arrayMod[index] === key) ? index : -1;
        animateDelete(steps, foundIndex, () => {
          if (foundIndex !== -1) {
            arrayMod[foundIndex] = null;
            refreshCellsUI();
            alert('Clave ' + key + ' eliminada de la posición ' + (foundIndex + 1));
          } else {
            alert('La clave ' + key + ' no se encuentra en la tabla');
          }
        });
        break;
      }
      case 'H. Cuadrado': {
        const n = arraySqr ? arraySqr.length : 0;
        const index = middleSquareHash(key, n);

        if (arraySqr && arraySqr[index] != null && arraySqr[index] === key) {
          arraySqr[index] = null;
          refreshCellsUI();
          alert('Clave ' + key + ' eliminada de la posición ' + (index + 1));
        } else {
          alert('La clave ' + key + ' no se encuentra en la tabla');
        }
        clearHighlights();

        const steps = [index];
        const foundIndex = (arraySqr && arraySqr[index] != null && arraySqr[index] === key) ? index : -1;
        animateDelete(steps, foundIndex, () => {
          if (foundIndex !== -1) {
            arraySqr[foundIndex] = null;
            refreshCellsUI();
            alert('Clave ' + key + ' eliminada de la posición ' + (foundIndex + 1));
          } else {
            alert('La clave ' + key + ' no se encuentra en la tabla');
          }
        });
        break;
      }
      case 'H. Plegamiento': {
        const n = arrayFold ? arrayFold.length : 0;
        const index = foldingHash(key, n);

        if (arrayFold && arrayFold[index] != null && arrayFold[index] === key) {
          arrayFold[index] = null;
          refreshCellsUI();
          alert('Clave ' + key + ' eliminada de la posición ' + (index + 1));
        } else {
          alert('La clave ' + key + ' no se encuentra en la tabla');
        }
        clearHighlights();

        const steps = [index];
        const foundIndex = (arrayFold && arrayFold[index] != null && arrayFold[index] === key) ? index : -1;
        animateDelete(steps, foundIndex, () => {
          if (foundIndex !== -1) {
            arrayFold[foundIndex] = null;
            refreshCellsUI();
            alert('Clave ' + key + ' eliminada de la posición ' + (foundIndex + 1));
          } else {
            alert('La clave ' + key + ' no se encuentra en la tabla');
          }
        });
        break;
      }
      case 'H. Truncamiento': {
        const n = arrayTrunk ? arrayTrunk.length : 0;
        const index = truncationHash(key, n);

        if (arrayTrunk && arrayTrunk[index] != null && arrayTrunk[index] === key) {
          arrayTrunk[index] = null;
          refreshCellsUI();
          alert('Clave ' + key + ' eliminada de la posición ' + (index + 1));
        } else {
          alert('La clave ' + key + ' no se encuentra en la tabla');
        }
        clearHighlights();

        const steps = [index];
        const foundIndex = (arrayTrunk && arrayTrunk[index] != null && arrayTrunk[index] === key) ? index : -1;
        animateDelete(steps, foundIndex, () => {
          if (foundIndex !== -1) {
            arrayTrunk[foundIndex] = null;
            refreshCellsUI();
            alert('Clave ' + key + ' eliminada de la posición ' + (foundIndex + 1));
          } else {
            alert('La clave ' + key + ' no se encuentra en la tabla');
          }
        });
        break;
      }
    }

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
        alert('Valor no encontrado (colisión o nunca insertado)');
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
        alert('Valor no encontrado (colisión o nunca insertado)');
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
  reader.onload = function(ev) {
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
