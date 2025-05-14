// js/simulations/langtonAnt/config.js
import { drawSimulation } from './view.js';

export const CANVAS_ID = 'langtonCanvas';
export const GRID_SIZE = 500;
export const CELL_SIZE = 5;

// Helper function to generate a random hex color
// Export this function so it can be used by controller.js for ant body colors
export function generateRandomHexColor() {
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += Math.floor(Math.random() * 16).toString(16);
    }
    return color;
}

const PALETTES = {
    default: Object.freeze([
        '#FFFFFF', // State 0: White (Background)
        '#000000', // State 1: Black
        '#0074D9', // State 2: Blue
        '#2ECC40', // State 3: Green
        '#FFDC00', // State 4: Yellow
        '#B10DC9'  // State 5: Purple
    ]),
    grayscale: Object.freeze(['#FFFFFF']), // Placeholder, will be generated
    warm: Object.freeze(['#FFFFFF', '#FF4136', '#FF851B', '#FFDC00']), // White, Red, Orange, Yellow
    cool: Object.freeze(['#FFFFFF', '#0074D9', '#7FDBFF', '#2ECC40', '#B10DC9']), // White, Blue, Aqua, Green, Purple
    randomized: Object.freeze(['#FFFFFF']) // Special case: State 0 is white, others random
};

let currentPaletteName = 'default';
let cellStateColorsInternal = [...PALETTES.default];

function generateGrayscaleColors(numStates) {
    const colors = ['#FFFFFF']; // State 0 is white
    if (numStates <= 1) return colors.slice(0, numStates);

    // Generate shades of gray from black to near-white for subsequent states
    const step = Math.floor(255 / (numStates - 1)); 
    for (let i = 0; i < numStates - 1; i++) {
        // Start from darker grays for lower states (after background)
        const shade = Math.max(0, 255 - (i + 1) * step).toString(16).padStart(2, '0');
        // Corrected to make states other than background darker first.
        // Let's try a different approach: from black up to light gray for states > 0
        const darkShadeVal = Math.min(255, i * step);
        const hex = darkShadeVal.toString(16).padStart(2, '0');
        colors.push(`#${hex}${hex}${hex}`);
    }
     // Simplified grayscale: Black, varying grays, up to almost white, white is state 0
    const gray_colors = ['#FFFFFF'];
    if (numStates > 1) gray_colors.push('#000000'); // State 1 Black
    const numGrayShades = numStates - 2;
    if (numGrayShades > 0) {
        const step = Math.floor(220 / (numGrayShades +1)); // Avoid pure white/black again, range from 20 to 240
        for (let i = 0; i < numGrayShades; i++) {
            const shadeVal = 20 + (i+1) * step;
            const hex = shadeVal.toString(16).padStart(2, '0');
            gray_colors.push(`#${hex}${hex}${hex}`);
        }
    }
    return gray_colors.slice(0, numStates);
}

export function setCurrentPalette(paletteName) {
    if (PALETTES[paletteName]) {
        currentPaletteName = paletteName;
        // console.log(`Palette changed to: ${currentPaletteName}`);
        // Actual color population will happen via populateCellStateColors
    } else {
        console.warn(`Palette "${paletteName}" not found. Keeping current palette.`);
    }
}

export function populateCellStateColors(numberOfStates) {
    if (numberOfStates <= 0) numberOfStates = 1;
    let newColors = [];
    const basePalette = PALETTES[currentPaletteName];

    if (currentPaletteName === 'randomized') {
        newColors.push(basePalette[0] || '#FFFFFF'); // Background color from palette or default white
        for (let i = 1; i < numberOfStates; i++) {
            newColors.push(generateRandomHexColor());
        }
    } else if (currentPaletteName === 'grayscale') {
        newColors = generateGrayscaleColors(numberOfStates);
    } else {
        newColors = [...basePalette];
    }

    // Ensure the array has the required number of states
    while (newColors.length < numberOfStates) {
        newColors.push(generateRandomHexColor()); // Fill with random if base palette is too short
    }
    // Trim if the base palette was longer than needed (e.g. default palette and numStates is 2)
    cellStateColorsInternal = newColors.slice(0, numberOfStates);
    // console.log('Populated cellStateColorsInternal:', cellStateColorsInternal);
}

export let customStateColors = {}; // Map of stateId to custom color string

export function setCustomStateColor(stateId, color) {
    customStateColors[stateId] = color;
    // Note: This function does not trigger re-renders. Caller should handle that.
}

export function clearCustomStateColors() {
    customStateColors = {};
    // Caller should trigger re-renders.
}

export function getCellStateColor(state) {
    if (customStateColors.hasOwnProperty(state)) {
        return customStateColors[state];
    }
    if (state >= 0 && state < cellStateColorsInternal.length) {
        return cellStateColorsInternal[state];
    }
    return '#FF00FF'; // Fallback color
}

export const UI_ELEMENT_IDS = {
    startButton: 'startButton',
    stopButton: 'stopButton',
    resetButton: 'resetButton',
    speedSlider: 'speedSlider',
    rulesTextarea: 'rulesTextarea',
    applyRulesButton: 'applyRulesButton',
    resetRulesButton: 'resetRulesButton',
    numStatesForRandom: 'numStatesForRandom',
    generateRulesButton: 'generateRulesButton',
    numAntsForGeneration: 'numAntsForGeneration',
    generateAntsButton: 'generateAntsButton',
    paletteSelect: 'paletteSelect',
    visualRuleEditorCanvas: 'visualRuleEditorCanvas',
    addStateButton: 'addStateButton',
    removeStateButton: 'removeStateButton',
    visualRuleEditorPropertiesPanel: 'visualRuleEditorPropertiesPanel',
    visualEditorAntSelector: 'visualEditorAntSelector',
    applyVisualRulesButton: 'applyVisualRulesButton',
    getVisualRulesToJsonButton: 'getVisualRulesToJsonButton',
    syncJsonViewButton: 'syncJsonViewButton',
    jsonSyncModal: 'jsonSyncModal',
    closeJsonSyncModalButton: 'closeJsonSyncModalButton',
    jsonSyncTextarea: 'jsonSyncTextarea',
    copyJsonToClipboardButton: 'copyJsonToClipboardButton',
    applyJsonToVisualEditorButton: 'applyJsonToVisualEditorButton'
};

populateCellStateColors(PALETTES.default.length);

// In an appropriate file (e.g., config.js or a new paletteManager.js)
export function handlePaletteChange(event) {
    const selectedPalette = event.target.value;
    setCurrentPalette(selectedPalette);
    // To ensure the new palette is used, we need to re-populate colors based on the current number of states.
    // This requires knowing the max state ID in use. 
    // For simplicity, we'll re-populate with the current length of cellStateColorsInternal,
    // assuming it reflects the max number of states reasonably well.
    // A more robust solution might involve getting max state from the model or rules.
    populateCellStateColors(cellStateColorsInternal.length);
    drawSimulation(); // Redraw the simulation to reflect the new palette
}