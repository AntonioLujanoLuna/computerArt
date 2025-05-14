// canvasInteractions.js
import { getCanvas } from './view.js';
import { drawSimulation, setZoom, adjustPan } from './view.js';
import { getCurrentZoomLevel, setCurrentZoomLevel } from './simulationController.js';

let isDragging = false;
let lastMouseX, lastMouseY;

export function resetPanZoom() {
    setCurrentZoomLevel(1.0);
    // The view.js resetPanZoom will be called with this update
    drawSimulation();
}

export function handleMouseDown(event) {
    isDragging = true;
    lastMouseX = event.offsetX;
    lastMouseY = event.offsetY;
}

export function handleMouseMove(event) {
    if (isDragging) {
        const dx = event.offsetX - lastMouseX;
        const dy = event.offsetY - lastMouseY;
        adjustPan(dx, dy);
        lastMouseX = event.offsetX;
        lastMouseY = event.offsetY;
    }
}

export function handleMouseUp() {
    isDragging = false;
}

export function handleMouseWheel(event) {
    event.preventDefault();
    const zoomIntensity = 0.1;
    const scrollDelta = Math.sign(event.deltaY);
    const newZoomLevel = getCurrentZoomLevel() * (1 - scrollDelta * zoomIntensity);
    setCurrentZoomLevel(newZoomLevel);
    setZoom(newZoomLevel, event.offsetX, event.offsetY);
}

export function initializeCanvasInteractions() {
    const simulationCanvas = getCanvas();
    
    if (simulationCanvas) {
        simulationCanvas.addEventListener('mousedown', handleMouseDown);
        simulationCanvas.addEventListener('mousemove', handleMouseMove);
        simulationCanvas.addEventListener('mouseup', handleMouseUp);
        simulationCanvas.addEventListener('mouseleave', handleMouseUp);
        simulationCanvas.addEventListener('wheel', handleMouseWheel);
    }
}