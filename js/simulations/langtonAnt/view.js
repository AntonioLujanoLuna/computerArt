// js/simulations/langtonAnt/view.js
import { CANVAS_ID, GRID_SIZE, CELL_SIZE, getCellStateColor } from './config.js';
import { getGrid, getAnts } from './model.js';

let canvas, ctx;
let zoomLevel = 1.0;
let panX = 0;
let panY = 0;

function resizeCanvas() {
    if (!canvas) return;
    // Set canvas internal resolution to its displayed size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // When canvas is resized, the drawing surface is cleared, and pan/zoom might need re-centering or adjusting.
    // For now, just redraw. A more sophisticated approach might try to maintain the current view center.
    resetPanZoom(); // Recalculate pan for new size and redraw
}

export function initializeView() {
    console.log('[View] Initializing. Attempting to find canvas with ID:', CANVAS_ID);
    canvas = document.getElementById(CANVAS_ID);
    console.log('[View] Canvas element found:', canvas);
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    
    // Initial resize and setup listener for dynamic resizing
    resizeCanvas(); // Set initial size based on CSS
    window.addEventListener('resize', resizeCanvas);
    // resetPanZoom() is called by resizeCanvas, which also calls drawSimulation()
}

export function setZoom(level, mouseX, mouseY) {
    if (!canvas) return;
    const prevZoomLevel = zoomLevel;
    zoomLevel = Math.max(0.1, Math.min(level, 10));
    const worldX = (mouseX - panX) / prevZoomLevel;
    const worldY = (mouseY - panY) / prevZoomLevel;
    panX = mouseX - worldX * zoomLevel;
    panY = mouseY - worldY * zoomLevel;
    drawSimulation();
}

export function adjustPan(dx, dy) {
    panX += dx;
    panY += dy;
    drawSimulation();
}

export function getCanvas() {
    return canvas;
}

export function resetPanZoom() {
    if (!canvas) return;
    zoomLevel = 1.0;
    // Pan to center the conceptual GRID_SIZE * CELL_SIZE area in the middle of the actual canvas
    panX = (canvas.width - GRID_SIZE * CELL_SIZE * zoomLevel) / 2;
    panY = (canvas.height - GRID_SIZE * CELL_SIZE * zoomLevel) / 2;
    drawSimulation();
}

export function drawSimulation() {
    if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;

    const gridData = getGrid();
    const ants = getAnts();

    ctx.save();
    // Use getCellStateColor for the default background (state 0)
    ctx.fillStyle = getCellStateColor(0); // Was: CELL_STATE_COLORS[0] || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);

    const viewXStart = -panX / zoomLevel;
    const viewYStart = -panY / zoomLevel;
    const viewWidth = canvas.width / zoomLevel;
    const viewHeight = canvas.height / zoomLevel;

    const cellXStart = Math.floor(viewXStart / CELL_SIZE) - 1;
    const cellYStart = Math.floor(viewYStart / CELL_SIZE) - 1;
    const cellXEnd = Math.ceil((viewXStart + viewWidth) / CELL_SIZE) + 1;
    const cellYEnd = Math.ceil((viewYStart + viewHeight) / CELL_SIZE) + 1;

    const screenCellSize = CELL_SIZE * zoomLevel;
    const minPixelSizeForVisibleDetail = 0.5; 
    const minPixelSizeForAntDraw = 0.5;
    const defaultCellColor = getCellStateColor(0); // New way: state 0 is the default background

    if (screenCellSize < 0.1) {
        // Extremely zoomed out, background already drawn.
    } else if (screenCellSize < minPixelSizeForVisibleDetail) { 
        const step = Math.max(1, Math.floor(1.0 / screenCellSize)); 
        for (let y = cellYStart; y < cellYEnd; y += step) {
            for (let x = cellXStart; x < cellXEnd; x += step) {
                let blockHasNonBackgroundCell = false;
                let dominantColorInBlock = defaultCellColor; // For more advanced coloring if needed
                // Simplified: check if any cell in this block is NOT state 0
                for (let subY = 0; subY < step; subY++) {
                    if (blockHasNonBackgroundCell) break;
                    for (let subX = 0; subX < step; subX++) {
                        if ((y + subY) >= cellYEnd || (x + subX) >= cellXEnd) continue;
                        const checkSourceX = ((x + subX) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
                        const checkSourceY = ((y + subY) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
                        const cellState = gridData[checkSourceY][checkSourceX];
                        if (cellState !== 0) { // Assuming state 0 is background
                            blockHasNonBackgroundCell = true;
                            dominantColorInBlock = getCellStateColor(cellState);
                            break;
                        }
                    }
                }
                if (blockHasNonBackgroundCell) {
                    ctx.fillStyle = dominantColorInBlock; // Use the color of the first non-bg cell found
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE * step, CELL_SIZE * step);
                }
            }
        }
    } else {
        for (let y = cellYStart; y < cellYEnd; y++) {
            for (let x = cellXStart; x < cellXEnd; x++) {
                const sourceX = (x % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
                const sourceY = (y % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
                const cellState = gridData[sourceY][sourceX];
                
                if (cellState !== 0) { 
                    ctx.fillStyle = getCellStateColor(cellState);
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // Draw all ants
    if (screenCellSize >= minPixelSizeForAntDraw && ants) {
        ants.forEach(ant => {
            if (ant) { // Ensure ant object exists
                ctx.fillStyle = ant.color || '#FF0000'; // Use ant's color, fallback to red
                // Ant's position is already in grid cell coordinates, so multiply by CELL_SIZE
                ctx.fillRect(ant.x * CELL_SIZE, ant.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        });
    }
    ctx.restore();
}