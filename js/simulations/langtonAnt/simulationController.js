// simulationController.js
import { getAnts, initializeModel } from './model.js';
import { drawSimulation, resetPanZoom } from './view.js';
import { applyLangtonRules } from './rules.js';
import { getDefaultRules } from './rules.js';
import { loadRulesToVisualEditor } from './transitionManager.js';
import { UI_ELEMENT_IDS } from './config.js';
import { updateTextareaWithConfiguration } from './uiManager.js';
import { populateAntSelector } from './uiManager.js';
import { setCurrentVisualEditorAntIndex } from './uiManager.js';


let isRunning = false;
let renderFrameId;
let stepsPerFrame = 1;
let simulationInterval = null;

function renderLoop() {
    if (!isRunning) return;

    const ants = getAnts();
    if (ants && ants.length > 0) {
        for (let i = 0; i < stepsPerFrame; i++) {
            if (!isRunning) break;
            ants.forEach((ant, index) => {
                applyLangtonRules(ant, index);
            });
        }
    }

    if (isRunning) {
        drawSimulation();
    }

    renderFrameId = requestAnimationFrame(renderLoop);
}

export function startSimulation() {
    if (!isRunning) {
        isRunning = true;
        if (!renderFrameId) {
            renderLoop();
        }
    }
}

export function stopSimulation() {
    isRunning = false;
    if (renderFrameId) {
        cancelAnimationFrame(renderFrameId);
        renderFrameId = null;
    }
}

export function resetSimulation() {
    stopSimulation();
    initializeModel(); 
    
    // Get default configuration from separate module
    const defaultAntConfigsForTextArea = getDefaultAntConfigs();
    
    updateTextareaWithConfiguration(defaultAntConfigsForTextArea); 
    populateAntSelector(defaultAntConfigsForTextArea); 
    
    // Set current ant index to first ant
    setCurrentVisualEditorAntIndex(0); 
    
    if (defaultAntConfigsForTextArea.length > 0 && defaultAntConfigsForTextArea[0].rules) {
        loadRulesToVisualEditor(defaultAntConfigsForTextArea[0].rules);
    } else {
        loadRulesToVisualEditor(getDefaultRules());
    }
    
    resetPanZoom();
    setCurrentZoomLevel(1.0);
    drawSimulation();
}

export function setSimulationSpeed(speed) {
    stepsPerFrame = parseInt(speed, 10);
    if (stepsPerFrame < 1) stepsPerFrame = 1;
}

export function getDefaultAntConfigs() {
    // Return default ant configuration structure for textarea example and reset
    return [
        {
            id: "ant_0",
            x: 50,
            y: 50,
            dir: 0,
            rules: getDefaultRules(),
            color: '#FF4136'
        }
    ];
}

let currentZoomLevel = 1.0;

export function getCurrentZoomLevel() {
    return currentZoomLevel;
}

export function setCurrentZoomLevel(level) {
    currentZoomLevel = level;
}

// Initialize simulation control elements
export function initializeSimulationControls() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const resetButton = document.getElementById('resetButton');
    const speedSlider = document.getElementById('speedSlider');
    
    if (startButton) startButton.addEventListener('click', startSimulation);
    if (stopButton) stopButton.addEventListener('click', stopSimulation);
    if (resetButton) resetButton.addEventListener('click', resetSimulation);
    if (speedSlider) {
        speedSlider.addEventListener('input', (event) => setSimulationSpeed(event.target.value));
        setSimulationSpeed(speedSlider.value);
    }
}