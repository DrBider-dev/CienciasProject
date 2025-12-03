document.addEventListener('DOMContentLoaded', () => {
    const createBtn = document.getElementById('createBtn');
    createBtn.addEventListener('click', calculateAndDraw);

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.electronAPI && window.electronAPI.navigateTo) {
                window.electronAPI.navigateTo('src/Index/index.html');
            } else {
                window.location.href = '../Index/index.html';
            }
        });
    }
});

function calculateAndDraw() {
    const R = parseInt(document.getElementById('recordLength').value);
    const B = parseInt(document.getElementById('blockSize').value);
    const r = parseInt(document.getElementById('recordCount').value);
    const indexType = document.getElementById('indexType').value;
    const levelType = document.getElementById('levelType').value;

    if (isNaN(R) || isNaN(B) || isNaN(r)) {
        alert('Por favor ingrese todos los valores numéricos.');
        return;
    }

    // Data File Calculations
    const BfrData = Math.floor(B / R);
    if (BfrData === 0) {
        alert('El tamaño del bloque (B) debe ser mayor que la longitud del registro (R).');
        return;
    }
    const bData = Math.ceil(r / BfrData);

    // Index File Calculations (R_index = 15)
    const RIndex = 15;
    const BfrIndex = Math.floor(B / RIndex);

    let indexLevels = [];
    let bIndex = 0;
    let accessesIndex = 0;

    if (levelType === 'one') {
        // One Level
        bIndex = Math.ceil(r / BfrIndex); // Assuming dense for primary/secondary base
        // Note: For secondary index on non-key field, it might be different, but sticking to basic interpretation
        // If secondary index is on non-ordering field, it's dense.
        // If primary index, it's sparse (one entry per block).
        // User prompt implies calculating 'bi' based on 'r' or 'b'.
        // Let's refine based on "primary" vs "secondary".
        // Primary: Sparse. Entries = bData.
        // Secondary: Dense. Entries = r.

        let entries = (indexType === 'primary') ? bData : r;
        bIndex = Math.ceil(entries / BfrIndex);
        indexLevels.push({ b: bIndex, entries: entries });
        accessesIndex = Math.log2(bIndex); // Base access cost for binary search on index
    } else {
        // Multilevel
        // Level 1
        let entries = (indexType === 'primary') ? bData : r;
        let currentB = Math.ceil(entries / BfrIndex);
        indexLevels.push({ b: currentB, entries: entries });

        // Subsequent levels
        while (currentB > 1) {
            entries = currentB;
            currentB = Math.ceil(entries / BfrIndex);
            indexLevels.push({ b: currentB, entries: entries });
        }

        // Accesses = number of levels + 1 (for data block)
        accessesIndex = indexLevels.length;
    }

    const accessesData = Math.log2(bData); // This is for binary search on data file if no index, but with index it's different.
    // User asked for "log2(b) u log2(bi)".
    // Let's display what was requested.

    // Display Results
    const resultsDiv = document.getElementById('results');
    let resultsHTML = `
        <p><strong>Resultados:</strong></p>
        <p>Bfr (Datos): ${BfrData}</p>
        <p>Bloques (Datos, b): ${bData}</p>
        <p>Bfr (Índice): ${BfrIndex}</p>
    `;

    indexLevels.forEach((level, idx) => {
        resultsHTML += `<p>Nivel ${idx + 1} - Bloques: ${level.b}</p>`;
    });

    resultsHTML += `
        <p>Accesos (Datos - Búsqueda Binaria): ${accessesData.toFixed(2)}</p>
        <p>Accesos (Índice): ${typeof accessesIndex === 'number' && !Number.isInteger(accessesIndex) ? accessesIndex.toFixed(2) : accessesIndex}</p>
    `;

    resultsDiv.innerHTML = resultsHTML;

    drawVisualization(bData, indexLevels, BfrData, BfrIndex);
}

function drawVisualization(bData, indexLevels, BfrData, BfrIndex) {
    const indexCanvas = document.getElementById('indexCanvas');
    const dataCanvas = document.getElementById('dataCanvas');

    indexCanvas.innerHTML = '';
    dataCanvas.innerHTML = '';

    // Draw Index Blocks (All Levels)
    // We reverse to show root at top if we were stacking, but side-by-side or vertical?
    // Let's just show them in order Level 1, Level 2... or Level k (Root) down to Level 1.
    // Usually Root is shown first or last. Let's show Level k (Root) then down to Level 1.

    // Create container for levels
    for (let l = indexLevels.length - 1; l >= 0; l--) {
        const level = indexLevels[l];
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-container';
        levelDiv.innerHTML = `<h3>Nivel ${l + 1}</h3>`;

        const blocksContainer = document.createElement('div');
        blocksContainer.className = 'blocks-row';

        renderBlocks(blocksContainer, level.b, BfrIndex, `Índice N${l + 1}`, true);

        levelDiv.appendChild(blocksContainer);
        indexCanvas.appendChild(levelDiv);
    }

    // Draw Data Blocks
    const dataBlocksContainer = document.createElement('div');
    dataBlocksContainer.className = 'blocks-row';
    renderBlocks(dataBlocksContainer, bData, BfrData, 'Datos', false);
    dataCanvas.appendChild(dataBlocksContainer);
}

function renderBlocks(container, count, bfr, labelPrefix, isIndex) {
    const maxVisible = 8; // Show max 8 blocks (4 start, 4 end)

    if (count <= maxVisible) {
        for (let i = 0; i < count; i++) {
            container.appendChild(createBlock(i, labelPrefix, bfr, isIndex));
        }
    } else {
        // First 4
        for (let i = 0; i < 4; i++) {
            container.appendChild(createBlock(i, labelPrefix, bfr, isIndex));
        }

        // Ellipsis
        const ellipsis = document.createElement('div');
        ellipsis.className = 'block ellipsis-block';
        ellipsis.innerHTML = '...';
        container.appendChild(ellipsis);

        // Last 4
        for (let i = count - 4; i < count; i++) {
            container.appendChild(createBlock(i, labelPrefix, bfr, isIndex));
        }
    }
}

function createBlock(index, labelPrefix, bfr, isIndex) {
    const block = document.createElement('div');
    block.className = `block ${isIndex ? 'index-block' : 'data-block'}`;

    let tableRows = '';
    // Show max 3 rows per block to save space
    const maxRows = 3;
    const rowsToShow = Math.min(bfr, maxRows);

    for (let j = 0; j < rowsToShow; j++) {
        if (isIndex) {
            tableRows += `<tr><td>Key</td><td>&rarr;</td></tr>`;
        } else {
            tableRows += `<tr><td>Reg</td><td>Data</td></tr>`;
        }
    }
    if (bfr > maxRows) {
        tableRows += `<tr><td colspan="2">...</td></tr>`;
    }

    block.innerHTML = `
        <div class="block-header">${labelPrefix} - B${index + 1}</div>
        <div class="block-content">
            <table class="record-table">
                ${tableRows}
            </table>
        </div>
    `;
    return block;
}
