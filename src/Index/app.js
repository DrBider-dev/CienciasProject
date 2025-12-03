const dinamicoTexts = {
  linealSearchLabel: "Búsqueda Lineal<br>Algoritmo de búsqueda secuencial que recorre cada elemento de una estructura de datos uno por uno, comparándolo con la clave objetivo. Su complejidad temporal es O(n) en el peor caso, siendo aplicable sin requisitos de ordenamiento previo.",
  binarySearchLabel: "Búsqueda Binaria<br>Método de búsqueda que requiere datos ordenados. En cada iteración compara el elemento central con la clave, descartando la mitad del arreglo donde la clave no puede estar, logrando búsquedas rápidas.",
  hashingSearchlabel: "Funciones Hash<br>Técnica que convierte claves en direcciones mediante funciones hash. Permite acceso cercano a O(1) en tablas hash bien dimensionadas.",
  residualTreeLabel: "Árbol por residuos<br>Estructura que utiliza particiones por residuos para organizar claves; puede dejar la raíz vacía o ajustar frente a colisiones.",
  digitalTreeLabel: "Árboles Digitales<br>Estructura basada en los dígitos o bits de las claves, ideal para búsquedas por prefijo.",
  multipleTreeLabel: "Residuos Múltiples<br>Variante de árboles que permite particionar claves en varias ramas según múltiples residuos o criterios.",
  huffmanTreeLabel: "Árboles Huffman<br>Estructura usada en compresión que organiza símbolos por frecuencia, optimizando el código de longitud variable.",
  linealSearchEX: "Búsqueda Lineal (Externa)<br>Búsqueda en estructuras por bloques secuencialmente, útil para datos en almacenamiento externo.",
  binarySearchEX: "Búsqueda Binaria (Externa)<br>Versión adaptada a bloques externos, aplicando dividir y conquistar sobre índices o bloques.",
  dinamicSearchEX: "Búsqueda Dinámica<br>Diseñada para estructuras que cambian en tiempo real, ajustando los índices dinámicamente.",
  hashingSearchEX: "Búsqueda Hashing (Externa)<br>Utiliza una función hash (Modulo) para distribuir claves en bloques externos, permitiendo inserción y búsqueda directa.",
  graphOperations: "Operaciones con Grafos<br>Manipulación y análisis de grafos, incluyendo combinaciones como el producto cartesiano de grafos.",
  shortestPath: "Camino Más Corto<br>Algoritmos para encontrar la ruta más corta entre nodos en un grafo, como Dijkstra o Floyd."
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Index app.js loaded');

  const dinamicoArea = document.getElementById("dinamicoArea");

  function showDinamico(id) {
    if (dinamicoArea) {
      dinamicoArea.innerHTML = dinamicoTexts[id] || "Información no disponible";
      dinamicoArea.classList.add("visible");
    }
  }

  function hideDinamico() {
    if (dinamicoArea) {
      dinamicoArea.classList.remove("visible");
      dinamicoArea.innerHTML = "";
    }
  }

  function openWindowFor(id) {
    console.log('openWindowFor called with id:', id);
    const map = {
      linealSearchLabel: "src/LinealSearch/LinealSearch.html",
      binarySearchLabel: "src/BinarySearch/BinarySearch.html",
      hashingSearchlabel: "src/HashingSearch/HashingSearch.html",
      residualTreeLabel: "src/ResidualTreeSearch/ResidualTreeSearch.html",
      digitalTreeLabel: "src/DigitalTreeSearch/DigitalTreeSearch.html",
      multipleTreeLabel: "src/MultipleTreeSearch/MultipleTreeSearch.html",
      huffmanTreeLabel: "src/HuffmanTreeSearch/HuffmanTreeSearch.html",
      linealSearchLabel1: "src/ExternalLinealSearch/ExternalLinealSearch.html",
      binarySearchLabel1: "src/ExternalBinarySearch/ExternalBinarySearch.html",
      dinamicSearchLabel: "src/DinamicSearch/DinamicSearch.html",
      linealSearchEX: "src/LinealSearchEX/linealSearchEX.html",
      binarySearchEX: "src/BinarySearchEX/binarySearchEX.html",
      dinamicSearchEX: "src/DinamicSearchEX/DinamicSearchEX.html",
      hashingSearchEX: "src/HashingSearchEX/hashingSearchEX.html",
      graphOperations: "src/GraphOperations/GraphOperations.html",
      shortestPath: "src/ShortestPath/ShortestPath.html"
    };

    const url = map[id];
    console.log('URL found:', url);
    if (url) {
      console.log('Calling navigateTo with:', url);
      if (window.electronAPI && window.electronAPI.navigateTo) {
        window.electronAPI.navigateTo(url);
      } else {
        console.error('electronAPI.navigateTo not available');
        alert('Error: electronAPI no está disponible');
      }
    } else {
      console.error('No URL found for id:', id);
      alert("Página no encontrada: " + id);
    }
  }

  document.querySelectorAll(".option").forEach(opt => {
    const id = opt.dataset.id;
    opt.addEventListener("mouseenter", () => { opt.classList.add("active"); showDinamico(id); });
    opt.addEventListener("mouseleave", () => { opt.classList.remove("active"); hideDinamico(); });
    opt.addEventListener("click", () => openWindowFor(id));
  });

  const cards = [
    document.getElementById("card-1"),
    document.getElementById("card-2"),
    document.getElementById("card-3"),
    document.getElementById("card-4")
  ];
  let current = 0;

  function showCard(i) {
    cards.forEach((c, idx) => {
      if (c) c.style.display = idx === i ? "block" : "none";
    });
    current = i;
  }

  // Initialize view
  showCard(0);

  const next1 = document.getElementById("next1");
  if (next1) next1.onclick = () => showCard(1);

  const next2 = document.getElementById("next2");
  if (next2) next2.onclick = () => showCard(2);

  const next3 = document.getElementById("next3");
  if (next3) next3.onclick = () => showCard(3);

  const prev1 = document.getElementById("prev1");
  if (prev1) prev1.onclick = () => showCard(0);

  const prev2 = document.getElementById("prev2");
  if (prev2) prev2.onclick = () => showCard(0);

  const prev3 = document.getElementById("prev3");
  if (prev3) prev3.onclick = () => showCard(1);

  const prev4 = document.getElementById("prev4");
  if (prev4) prev4.onclick = () => showCard(2);

  document.addEventListener("keydown", e => { if (e.key === "Escape") hideDinamico(); });
});
