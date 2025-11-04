class LinealSearch {
    constructor() {
        this.array = null;
        this.longitudClaves = null;
        this.init();
    }

    init() {
        // Inicializar elementos de la interfaz
        this.arrayContainer = document.getElementById('arrayContainer');
        
        // Asignar event listeners a los botones
        document.getElementById('btnCreate').addEventListener('click', () => this.onCreateArray());
        document.getElementById('btnInsert').addEventListener('click', () => this.onInsert());
        document.getElementById('btnSearch').addEventListener('click', () => this.onSearch());
        document.getElementById('btnDelete').addEventListener('click', () => this.onDelete());
        document.getElementById('btnSave').addEventListener('click', () => this.guardarArray());
        document.getElementById('btnOpen').addEventListener('click', () => this.abrirArray());
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        
        // Inicializar la visualización
        this.refreshCellsUI();
    }

    goBack() {
        // En una aplicación Electron, aquí iría la lógica para volver a la ventana principal
        alert("Volviendo al menú principal...");
        // window.close() o navegación a otra ventana en Electron
    }

    // Algoritmo de ordenación Merge Sort
    mergeSort(arr) {
        if (arr == null || arr.length < 2) return;
        this.mergeSortHelper(arr, 0, arr.length - 1);
    }

    mergeSortHelper(arr, left, right) {
        if (left < right) {
            const mid = left + Math.floor((right - left) / 2);
            this.mergeSortHelper(arr, left, mid);
            this.mergeSortHelper(arr, mid + 1, right);
            this.merge(arr, left, mid, right);
        }
    }

    merge(arr, left, mid, right) {
        const n1 = mid - left + 1;
        const n2 = right - mid;
        const L = new Array(n1);
        const R = new Array(n2);
        
        for (let i = 0; i < n1; i++) L[i] = arr[left + i];
        for (let j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];
        
        let i = 0, j = 0, k = left;
        while (i < n1 && j < n2) {
            if (L[i] == null) {
                arr[k++] = R[j++];
            } else if (j < n2 && R[j] == null) {
                arr[k++] = L[i++];
            } else if (L[i] <= R[j]) {
                arr[k++] = L[i++];
            } else {
                arr[k++] = R[j++];
            }
        }
        
        while (i < n1) arr[k++] = L[i++];
        while (j < n2) arr[k++] = R[j++];
    }

    // Operaciones principales
    onCreateArray() {
        try {
            const size = Math.max(1, parseInt(document.getElementById('sizeArrayField').value));
            this.array = new Array(size).fill(null);
            this.longitudClaves = Math.max(1, parseInt(document.getElementById('sizeKeyField').value));
            this.refreshCellsUI();
        } catch (ex) {
            this.showMessage("Tamaño o longitud de clave inválido(s)", "Error");
        }
    }

    onInsert() {
        try {
            if (this.array == null) {
                this.showMessage("Por Favor cree la Estructura", "Estructura no creada");
                return;
            }
            
            const input = document.getElementById('txtKey').value.trim();
            const value = parseInt(input);

            // Validar longitud de la clave
            if (this.longitudClaves == null) {
                this.showMessage("Longitud de claves no definida");
                return;
            } else if (input.length !== this.longitudClaves) {
                this.showMessage(
                    `Todas las claves deben tener ${this.longitudClaves} dígitos`,
                    "Longitud inválida"
                );
                return;
            }

            // Validar si la clave ya existe
            for (const existing of this.array) {
                if (existing !== null && existing === value) {
                    this.showMessage(
                        `La clave ${value} ya existe en la tabla`,
                        "Clave repetida"
                    );
                    return;
                }
            }

            // Inserción lineal: buscar primer espacio libre
            let inserted = false;
            for (let i = 0; i < this.array.length; i++) {
                if (this.array[i] === null) {
                    this.array[i] = value;
                    this.mergeSort(this.array);
                    this.refreshCellsUI();
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                this.showMessage(
                    "No se pudo insertar, la tabla está llena",
                    "Tabla llena"
                );
            }
        } catch (ex) {
            this.showMessage("Valor inválido", "Error");
        }
    }

    onSearch() {
        try {
            const input = document.getElementById('txtKey').value.trim();
            const value = parseInt(input);
            
            if (this.longitudClaves == null) {
                this.showMessage(
                    "Debe Insertar al menos una clave",
                    "Estructura Vacía"
                );
                return;
            } else if (input.length !== this.longitudClaves) {
                this.showMessage(
                    `Todas las claves deben tener ${this.longitudClaves} dígitos`,
                    "Longitud inválida"
                );
                return;
            }
            
            // Ordenar array antes de buscar
            this.mergeSort(this.array);
            this.refreshCellsUI();
            this.clearHighlights();
            
            const steps = [];
            let foundIndex = -1;
            
            for (let i = 0; i < this.array.length; i++) {
                steps.push(i);
                if (this.array[i] !== null && this.array[i] === value) {
                    foundIndex = i;
                    break;
                }
            }
            
            this.animateSearch(steps, foundIndex);
        } catch (ex) {
            this.showMessage("Valor de búsqueda inválido", "Error");
        }
    }

    onDelete() {
        try {
            const input = document.getElementById('txtKey').value.trim();
            const value = parseInt(input);

            // Validar longitud de la clave
            if (this.longitudClaves == null) {
                this.showMessage(
                    "Debe insertar al menos una clave antes de eliminar",
                    "Estructura vacía"
                );
                return;
            } else if (input.length !== this.longitudClaves) {
                this.showMessage(
                    `Todas las claves deben tener ${this.longitudClaves} dígitos`,
                    "Longitud inválida"
                );
                return;
            }

            this.mergeSort(this.array);
            this.refreshCellsUI();
            this.clearHighlights();
            
            const steps = [];
            let foundIndex = -1;
            
            for (let i = 0; i < this.array.length; i++) {
                steps.push(i);
                if (this.array[i] !== null && this.array[i] === value) {
                    foundIndex = i;
                    break;
                }
            }
            
            this.animateDelete(steps, foundIndex, () => {
                if (foundIndex !== -1) {
                    this.array[foundIndex] = null;
                    this.refreshCellsUI();
                    this.showMessage(
                        `Clave ${value} eliminada de la posición ${foundIndex + 1}`,
                        "Eliminado"
                    );
                } else {
                    this.showMessage(
                        `La clave ${value} no se encuentra en la tabla`,
                        "No encontrado"
                    );
                }
            });
        } catch (ex) {
            this.showMessage("Clave inválida", "Error");
        }
    }

    // Animaciones
    animateSearch(steps, foundIndex) {
        this.clearHighlights();
        let currentStep = 0;
        const txtKey = document.getElementById('txtKey');
        txtKey.disabled = true;

        const animateStep = () => {
            if (currentStep >= steps.length) {
                if (foundIndex === -1) {
                    this.showMessage(
                        "Valor no encontrado",
                        "Buscar"
                    );
                }
                txtKey.disabled = false;
                return;
            }

            const pos = steps[currentStep];
            const cell = document.getElementById(`cell-${pos}`);
            
            if (cell) {
                if (pos === foundIndex) {
                    // Encontrado → verde
                    cell.classList.add('highlight-green');
                    this.scrollCellToVisible(pos);
                    txtKey.disabled = false;
                    return;
                } else {
                    // Descartado → rojo
                    cell.classList.add('highlight-red');
                    this.scrollCellToVisible(pos);
                }
            }
            
            currentStep++;
            setTimeout(animateStep, 400);
        };

        animateStep();
    }

    animateDelete(steps, foundIndex, onFinished) {
        this.clearHighlights();
        let currentStep = 0;
        const txtKey = document.getElementById('txtKey');
        txtKey.disabled = true;

        const animateStep = () => {
            if (currentStep >= steps.length) {
                if (foundIndex === -1) {
                    this.showMessage(
                        "Valor no encontrado",
                        "Buscar"
                    );
                }
                txtKey.disabled = false;
                
                // Llamar al callback cuando termina la animación
                if (onFinished) {
                    onFinished();
                }
                return;
            }

            const pos = steps[currentStep];
            const cell = document.getElementById(`cell-${pos}`);
            
            if (cell) {
                if (pos === foundIndex) {
                    // Encontrado → verde
                    cell.classList.add('highlight-green');
                    this.scrollCellToVisible(pos);
                    txtKey.disabled = false;
                    
                    // Llamar al callback cuando encuentra el elemento
                    if (onFinished) {
                        onFinished();
                    }
                    return;
                } else {
                    // Descartado → rojo
                    cell.classList.add('highlight-red');
                    this.scrollCellToVisible(pos);
                }
            }
            
            currentStep++;
            setTimeout(animateStep, 400);
        };

        animateStep();
    }

    // Guardado y recuperación de archivos
    guardarArray() {
        if (!this.array) {
            this.showMessage("No hay datos para guardar", "Error");
            return;
        }

        const data = {
            longitudClaves: this.longitudClaves,
            array: this.array
        };

        const dataStr = JSON.stringify(data);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Crear un enlace de descarga
        const downloadLink = document.createElement('a');
        downloadLink.download = 'busqueda_lineal.lin';
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.click();
        
        this.showMessage("Archivo guardado correctamente.");
    }

    abrirArray() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.lin';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.longitudClaves = data.longitudClaves;
                    this.array = data.array;
                    
                    // Actualizar campos de entrada
                    document.getElementById('sizeArrayField').value = this.array.length;
                    document.getElementById('sizeKeyField').value = this.longitudClaves || '';
                    
                    this.refreshCellsUI();
                    this.showMessage("Archivo cargado correctamente.");
                } catch (ex) {
                    this.showMessage("Error al cargar el archivo", "Error");
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // UI: refresco y utilidades
    refreshCellsUI() {
        this.arrayContainer.innerHTML = '';
        
        if (!this.array) return;
        
        for (let i = 0; i < this.array.length; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${i}`;
            
            const position = document.createElement('div');
            position.className = 'position';
            position.textContent = i + 1;
            
            const value = document.createElement('div');
            value.className = 'value';
            value.textContent = this.array[i] !== null ? this.array[i] : '';
            
            cell.appendChild(position);
            cell.appendChild(value);
            this.arrayContainer.appendChild(cell);
        }
    }

    clearHighlights() {
        const cells = document.getElementsByClassName('cell');
        for (let cell of cells) {
            cell.classList.remove('highlight-green', 'highlight-red');
        }
    }

    scrollCellToVisible(index) {
        const cell = document.getElementById(`cell-${index}`);
        if (cell) {
            cell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    showMessage(message, title = "Información") {
        alert(`${title}: ${message}`);
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new LinealSearch();
});