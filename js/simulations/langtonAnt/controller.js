// js/simulations/langtonAnt/controller.js
import { UI_ELEMENT_IDS, GRID_SIZE, setCurrentPalette, populateCellStateColors, generateRandomHexColor, getCellStateColors } from './config.js';
import { initializeModel, getAnts } from './model.js';
import { initializeView, drawSimulation, getCanvas, setZoom, adjustPan, resetPanZoom } from './view.js';
import { applyLangtonRules, validateRules, getDefaultRules, generateRandomRuleset } from './rules.js';

let isRunning = false;
let renderFrameId;
let stepsPerFrame = 1;

// Panning state
let isDragging = false;
let lastMouseX, lastMouseY;
let currentZoomLevel = 1.0;

// Control panel dragging state
// let isDraggingPanel = false;
// let panelOffsetX, panelOffsetY;

// Default single-ant configuration structure for textarea example and reset
// Mirrors the structure of defaultAntConfiguration in model.js
const defaultAntConfigsForTextArea = [
    {
        id: "ant_0",
        x: 50, // Example, model.js will use GRID_SIZE/2
        y: 50, // Example, model.js will use GRID_SIZE/2
        dir: 0,
        rules: getDefaultRules(), // Use the function from rules.js
        color: '#FF4136'
    }
];

function renderLoop() {
    if (!isRunning) return;

    const ants = getAnts();
    if (!ants || ants.length === 0) {
        // console.warn("RenderLoop: No ants to process.");
        // Potentially stop simulation if no ants exist, or wait for them to be added.
    } else {
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
    // Initialize model with its internal default (usually single ant setup)
    initializeModel(); 
    updateTextareaWithConfiguration(defaultAntConfigsForTextArea); // Show the default in textarea
    resetPanZoom();
    currentZoomLevel = 1.0;
    drawSimulation();
}

export function setSimulationSpeed(speed) {
    stepsPerFrame = parseInt(speed, 10);
    if (stepsPerFrame < 1) stepsPerFrame = 1;
}

function handleMouseDown(event) {
    isDragging = true;
    lastMouseX = event.offsetX;
    lastMouseY = event.offsetY;
}

function handleMouseMove(event) {
    if (isDragging) {
        const dx = event.offsetX - lastMouseX;
        const dy = event.offsetY - lastMouseY;
        adjustPan(dx, dy);
        lastMouseX = event.offsetX;
        lastMouseY = event.offsetY;
    }
}

function handleMouseUp() {
    isDragging = false;
}

function handleMouseWheel(event) {
    event.preventDefault();
    const zoomIntensity = 0.1;
    const scrollDelta = Math.sign(event.deltaY);
    const newZoomLevel = currentZoomLevel * (1 - scrollDelta * zoomIntensity);
    currentZoomLevel = newZoomLevel;
    setZoom(currentZoomLevel, event.offsetX, event.offsetY);
}

function handleApplyRules() {
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
    if (!rulesTextarea) return;

    let parsedAntConfigurations;
    try {
        parsedAntConfigurations = JSON.parse(rulesTextarea.value);
    } catch (error) {
        console.error('Error parsing JSON for ant configurations:', error);
        alert('Invalid JSON format for ant configurations. Please check the console.');
        return;
    }

    if (!Array.isArray(parsedAntConfigurations)) {
        console.error('Ant configurations JSON must be an array.');
        alert('Ant configurations must be an array. Please check the JSON structure.');
        return;
    }
    
    if (parsedAntConfigurations.length === 0) {
        console.warn('Ant configurations array is empty. Simulation will have no ants unless defaults are applied.');
        // Decide if we should stop or proceed with no ants, or revert to a default.
        // For now, we allow it, and model.js might load its default if array is empty.
    }

    // Determine max state from rules to populate colors
    let maxState = 0;
    parsedAntConfigurations.forEach(config => {
        if (config.rules && Array.isArray(config.rules)) {
            config.rules.forEach(rule => {
                if (typeof rule.currentState === 'number') {
                    maxState = Math.max(maxState, rule.currentState);
                }
                if (typeof rule.nextCellState === 'number') {
                    maxState = Math.max(maxState, rule.nextCellState);
                }
            });
        }
    });
    populateCellStateColors(maxState + 1);

    // Validate rules for each ant configuration
    let allRulesValid = true;
    for (const config of parsedAntConfigurations) {
        if (!config.rules || !validateRules(config.rules)) {
            allRulesValid = false;
            console.error('Invalid ruleset found in one of the ant configurations:', config.rules);
            alert('One of the ant configurations has an invalid ruleset. Please check console and rules format.');
            break; 
        }
    }

    if (allRulesValid) {
        stopSimulation(); // Stop current simulation before re-initializing
        initializeModel(parsedAntConfigurations); // Pass the full array of ant configs
        console.log('Custom ant configurations applied successfully!');
        drawSimulation(); // Redraw with new model state
    } else {
        console.error('Failed to apply custom ant configurations due to invalid rules.');
    }
}

function handleGenerateRandomRules() {
    const numStatesInput = document.getElementById(UI_ELEMENT_IDS.numStatesForRandom);
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
    // Read the number of ants from the 'numAntsForGeneration' input
    const numAntsInput = document.getElementById(UI_ELEMENT_IDS.numAntsForGeneration);

    if (!numStatesInput || !rulesTextarea || !numAntsInput) {
        console.error('Required input elements for generating random rules/ants not found.');
        return;
    }

    let numStates = parseInt(numStatesInput.value, 10);
    if (isNaN(numStates) || numStates < 1) {
        numStates = 2; // Default to 2 states
        numStatesInput.value = numStates;
        console.warn('Invalid number of states for random rules, defaulting to 2.');
    }

    let numAnts = parseInt(numAntsInput.value, 10);
    if (isNaN(numAnts) || numAnts < 1) {
        numAnts = 1; // Default to 1 ant
        numAntsInput.value = numAnts;
        console.warn('Invalid number of ants for random rules generation, defaulting to 1.');
    }
    
    populateCellStateColors(numStates);

    const randomRules = generateRandomRuleset(numStates); // Generate ONE set of rules
    const generatedAntConfigs = [];

    for (let i = 0; i < numAnts; i++) {
        const antConfig = {
            id: `rand_rule_ant_${i}`,
            x: Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1),
            y: Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1),
            dir: Math.floor(Math.random() * 4),
            rules: randomRules, // All ants get the same generated ruleset
            color: generateRandomHexColor() // Each ant gets a unique body color
        };
        generatedAntConfigs.push(antConfig);
    }
    
    updateTextareaWithConfiguration(generatedAntConfigs);
    console.log(`${numAnts} ant configurations generated with a shared random ruleset (based on ${numStates} states) and populated into textarea. Click Apply to use.`);
}

function handleGenerateAntsSetup() {
    const numAntsInput = document.getElementById(UI_ELEMENT_IDS.numAntsForGeneration);
    const numStatesInput = document.getElementById(UI_ELEMENT_IDS.numStatesForRandom); // For rules per ant
    
    if (!numAntsInput || !numStatesInput) {
        console.error('Required input elements for multi-ant setup not found.');
        return;
    }

    let numAnts = parseInt(numAntsInput.value, 10);
    let numStatesPerAnt = parseInt(numStatesInput.value, 10);

    if (isNaN(numAnts) || numAnts < 1) {
        numAnts = 1;
        numAntsInput.value = numAnts;
        console.warn('Invalid number of ants input, defaulting to 1.');
    }
    if (isNaN(numStatesPerAnt) || numStatesPerAnt < 1) {
        numStatesPerAnt = 2; // Default states for rules if not specified
        numStatesInput.value = numStatesPerAnt; 
        console.warn('Invalid number of states for rules, defaulting to 2.');
    }

    populateCellStateColors(numStatesPerAnt);

    const generatedAntConfigs = [];
    for (let i = 0; i < numAnts; i++) {
        const randomRules = generateRandomRuleset(numStatesPerAnt); // Each ant gets its own random ruleset
        const x = Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1); 
        const y = Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1);
        const dir = Math.floor(Math.random() * 4);
        
        const antColor = generateRandomHexColor(); // Assign a unique random color to the ant

        generatedAntConfigs.push({
            id: `gen_ant_${i}`,
            x: x,
            y: y,
            dir: dir,
            rules: randomRules,
            color: antColor // Use the new random color
        });
    }

    updateTextareaWithConfiguration(generatedAntConfigs);
    console.log(`${numAnts} ant configurations generated (each with unique rules) and populated into textarea. Click Apply to use them.`);
    // alert(`${numAnts} ant configurations generated. Review in textarea and click Apply JSON Rules.`); // Removed alert
}

// Helper to update textarea content
function updateTextareaWithConfiguration(configObject) {
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
    if (rulesTextarea) {
        rulesTextarea.value = JSON.stringify(configObject, null, 2);
    }
}

// Drag and Drop for Control Panel
// function panelDragStart(event, panel) {
//     if (event.target.classList.contains('drag-handle')) {
//         isDraggingPanel = true;
//         panelOffsetX = event.clientX - panel.offsetLeft;
//         panelOffsetY = event.clientY - panel.offsetTop;
//         document.addEventListener('mousemove', panelDragMove);
//         document.addEventListener('mouseup', panelDragEnd);
//         event.preventDefault();
//     }
// }

// function panelDragMove(event) {
//     if (isDraggingPanel) {
//         const panel = document.querySelector('.controls');
//         if (!panel) return;
//         let newX = event.clientX - panelOffsetX;
//         let newY = event.clientY - panelOffsetY;
//         const maxX = window.innerWidth - panel.offsetWidth;
//         const maxY = window.innerHeight - panel.offsetHeight;
//         newX = Math.max(0, Math.min(newX, maxX));
//         newY = Math.max(0, Math.min(newY, maxY));
//         panel.style.left = newX + 'px';
//         panel.style.top = newY + 'px';
//     }
// }

// function panelDragEnd() {
//     isDraggingPanel = false;
//     document.removeEventListener('mousemove', panelDragMove);
//     document.removeEventListener('mouseup', panelDragEnd);
// }

export function initializeControls() {
    const startButton = document.getElementById(UI_ELEMENT_IDS.startButton);
    const stopButton = document.getElementById(UI_ELEMENT_IDS.stopButton);
    const resetButton = document.getElementById(UI_ELEMENT_IDS.resetButton);
    const speedSlider = document.getElementById(UI_ELEMENT_IDS.speedSlider);
    const applyRulesButton = document.getElementById(UI_ELEMENT_IDS.applyRulesButton);
    const generateRulesButton = document.getElementById(UI_ELEMENT_IDS.generateRulesButton);
    const numAntsForGenerationInput = document.getElementById(UI_ELEMENT_IDS.numAntsForGeneration);
    const generateAntsButton = document.getElementById(UI_ELEMENT_IDS.generateAntsButton);
    const paletteSelect = document.getElementById(UI_ELEMENT_IDS.paletteSelect);
    // const minimizeControlsButton = document.getElementById(UI_ELEMENT_IDS.minimizeControlsButton); // REMOVED
    const toggleControlsSidebarButton = document.getElementById(UI_ELEMENT_IDS.toggleControlsSidebarButton); // NEW sidebar toggle

    const canvas = getCanvas();
    const controlsPanel = document.querySelector('.controls');

    if (startButton) startButton.addEventListener('click', startSimulation);
    if (stopButton) stopButton.addEventListener('click', stopSimulation);
    if (resetButton) resetButton.addEventListener('click', resetSimulation); 
    if (speedSlider) {
        speedSlider.addEventListener('input', (event) => setSimulationSpeed(event.target.value));
        setSimulationSpeed(speedSlider.value);
    }

    if (applyRulesButton) applyRulesButton.addEventListener('click', handleApplyRules);
    if (generateRulesButton) generateRulesButton.addEventListener('click', handleGenerateRandomRules);
    if (generateAntsButton) generateAntsButton.addEventListener('click', handleGenerateAntsSetup);

    if (paletteSelect) {
        paletteSelect.addEventListener('change', (event) => {
            setCurrentPalette(event.target.value);
            const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
            let maxStateInRules = 0;
            if (rulesTextarea && rulesTextarea.value) {
                try {
                    const currentAntConfigs = JSON.parse(rulesTextarea.value);
                    if (Array.isArray(currentAntConfigs)) {
                        currentAntConfigs.forEach(config => {
                            if (config.rules && Array.isArray(config.rules)) {
                                config.rules.forEach(rule => {
                                    if (typeof rule.currentState === 'number') {
                                        maxStateInRules = Math.max(maxStateInRules, rule.currentState);
                                    }
                                    if (typeof rule.nextCellState === 'number') {
                                        maxStateInRules = Math.max(maxStateInRules, rule.nextCellState);
                                    }
                                });
                            }
                        });
                    }
                }
                catch (e) {
                    console.warn('Could not parse rules from textarea to determine max state for palette change. Using default.');
                    const defaultRulesForPalette = getDefaultRules(); 
                    defaultRulesForPalette.forEach(rule => {
                         maxStateInRules = Math.max(maxStateInRules, rule.currentState, rule.nextCellState);
                    });
                }
            }
            populateCellStateColors(maxStateInRules + 1);
            updateColorPalettePreview(); 
            drawSimulation(); 
        });
        let initialMaxState = 0;
        defaultAntConfigsForTextArea[0].rules.forEach(rule => {
            initialMaxState = Math.max(initialMaxState, rule.currentState, rule.nextCellState);
        });
        populateCellStateColors(initialMaxState + 1);
        updateColorPalettePreview(); 
    }

    if (canvas) {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('wheel', handleMouseWheel);
    }

    // Panel dragging event listener - REMOVED
    // if (controlsPanel) {
    //     controlsPanel.addEventListener('mousedown', (event) => panelDragStart(event, controlsPanel));
    // }

    // Old minimize button listener - REMOVED
    /* 
    if (minimizeControlsButton && controlsPanel) {
        minimizeControlsButton.addEventListener('click', () => {
            controlsPanel.classList.toggle('controls-minimized');
            if (controlsPanel.classList.contains('controls-minimized')) {
                minimizeControlsButton.innerHTML = '&#43;'; 
                minimizeControlsButton.title = 'Maximize Controls';
            } else {
                minimizeControlsButton.innerHTML = '&#8210;'; 
                minimizeControlsButton.title = 'Minimize Controls';
            }
        });
    }
    */

    // NEW: Event listener for the sidebar toggle button
    if (toggleControlsSidebarButton && controlsPanel) {
        toggleControlsSidebarButton.addEventListener('click', () => {
            controlsPanel.classList.toggle('hidden');
            // Optionally, change button text or icon
            if (controlsPanel.classList.contains('hidden')) {
                toggleControlsSidebarButton.textContent = 'Show Controls';
            } else {
                toggleControlsSidebarButton.textContent = 'Hide Controls';
            }
        });
        // Set initial state of button text if sidebar starts hidden by default (it doesn't currently)
        // if (controlsPanel.classList.contains('hidden')) {
        //     toggleControlsSidebarButton.textContent = 'Show Controls';
        // }
    }

    updateTextareaWithConfiguration(defaultAntConfigsForTextArea);
    drawSimulation(); 
}

// New function to display color swatches in the preview div
function updateColorPalettePreview() {
    const previewDiv = document.getElementById(UI_ELEMENT_IDS.colorPalettePreview);
    if (!previewDiv) return;

    const colors = getCellStateColors();
    previewDiv.innerHTML = ''; 

    if (colors && colors.length > 0) {
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch'; 
            swatch.style.backgroundColor = color;
            previewDiv.appendChild(swatch);
        });
    } else {
        const noColorsMessage = document.createElement('span');
        noColorsMessage.className = 'no-colors-text'; 
        noColorsMessage.textContent = 'No colors to display or palette not yet active.';
        previewDiv.appendChild(noColorsMessage);
    }
}