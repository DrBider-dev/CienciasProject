const dinamicoTexts = {
  linealSearchLabel: "Búsqueda Lineal<br>Algoritmo de búsqueda secuencial que recorre cada elemento de una estructura de datos uno por uno, comparándolo con la clave objetivo. Su complejidad temporal es O(n) en el peor caso, siendo aplicable sin requisitos de ordenamiento previo.",
  binarySearchLabel: "Búsqueda Binaria<br>Método de búsqueda que requiere datos ordenados. En cada iteración compara el elemento central con la clave, descartando la mitad del arreglo donde la clave no puede estar, logrando búsquedas rápidas.",
  hashingSearchlabel: "Funciones Hash<br>Técnica que convierte claves en direcciones mediante funciones hash. Permite acceso cercano a O(1) en tablas hash bien dimensionadas.",
  residualTreeLabel: "Árbol por residuos<br>Estructura que utiliza particiones por residuos para organizar claves; puede dejar la raíz vacía o ajustar frente a colisiones.",
  digitalTreeLabel: "Árboles Digitales<br>Estructura basada en los dígitos o bits de las claves, ideal para búsquedas por prefijo.",
  multipleTreeLabel: "Residuos Múltiples<br>Variante de árboles que permite particionar claves en varias ramas según múltiples residuos o criterios.",
  huffmanTreeLabel: "Árboles Huffman<br>Estructura usada en compresión que organiza símbolos por frecuencia, optimizando el código de longitud variable.",
  linealSearchLabel1: "Búsqueda Lineal (Externa)<br>Búsqueda en estructuras por bloques secuencialmente, útil para datos en almacenamiento externo.",
  binarySearchLabel1: "Búsqueda Binaria (Externa)<br>Versión adaptada a bloques externos, aplicando dividir y conquistar sobre índices o bloques.",
  dinamicSearchLabel: "Búsqueda Dinámica<br>Diseñada para estructuras que cambian en tiempo real, ajustando los índices dinámicamente."
};

const dinamicoArea = document.getElementById("dinamicoArea");

function showDinamico(id) {
  dinamicoArea.innerHTML = dinamicoTexts[id] || "Información no disponible";
  dinamicoArea.classList.add("visible");
}

function hideDinamico() {
  dinamicoArea.classList.remove("visible");
  dinamicoArea.innerHTML = "";
}

document.querySelectorAll(".option").forEach(opt => {
  const id = opt.dataset.id;
  opt.addEventListener("mouseenter", () => { opt.classList.add("active"); showDinamico(id); });
  opt.addEventListener("mouseleave", () => { opt.classList.remove("active"); hideDinamico(); });
  opt.addEventListener("click", () => openWindowFor(id));
});

function openWindowFor(id) {
  const map = {
    linealSearchLabel: "../LinealSearch/LinealSearch.html",
    binarySearchLabel: "BinarySearch.html",
    hashingSearchlabel: "HashingSearch.html",
    residualTreeLabel: "ResidualTreeSearch.html",
    digitalTreeLabel: "DigitalTreeSearch.html",
    multipleTreeLabel: "MultipleTreeSearch.html",
    huffmanTreeLabel: "HuffmanTreeSearch.html",
    linealSearchLabel1: "ExternalLinealSearch.html",
    binarySearchLabel1: "ExternalBinarySearch.html",
    dinamicSearchLabel: "DinamicSearch.html"
  };
  const url = map[id];
  if (url) window.open(url, "_blank");
  else alert("Abrir: " + id);
}

const cards = [document.getElementById("card-1"), document.getElementById("card-2"), document.getElementById("card-3")];
let current = 0;
function showCard(i) {
  cards.forEach((c, idx) => c.style.display = idx === i ? "block" : "none");
  current = i;
}

document.getElementById("next1").onclick = () => showCard(1);
document.getElementById("next2").onclick = () => showCard(2);
document.getElementById("prev1").onclick = () => showCard(0);
document.getElementById("prev2").onclick = () => showCard(0);
document.getElementById("prev3").onclick = () => showCard(1);
document.getElementById("closeX").onclick = () => window.close();

document.addEventListener("keydown", e => { if (e.key === "Escape") hideDinamico(); });
