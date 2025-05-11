// js/simulations/langtonAnt/rules.js
import { updateAntPosition, updateAntDirection, getCellState, setCellState } from './model.js'; // getAnts is not directly needed here if ant object is passed
import { GRID_SIZE } from './config.js'; // GRID_SIZE might still be needed, or might be removed if not used

// Define a default rule set for standard Langton's Ant
export const defaultSingleAntRules = Object.freeze([
    { currentState: 0, turn: 1,  nextCellState: 1 }, 
    { currentState: 1, turn: -1, nextCellState: 0 }
]);

// currentRules global variable is removed.

// Function to validate a single ruleset array
export function validateRules(rulesArray) {
    if (!Array.isArray(rulesArray)) {
        console.error('Rules must be an array.');
        return false;
    }
    if (rulesArray.length === 0) {
        console.warn('Rules array is empty. Ant may not behave as expected.');
        return true; 
    }
    for (const rule of rulesArray) {
        if (typeof rule.currentState !== 'number' || 
            typeof rule.turn !== 'number' || 
            typeof rule.nextCellState !== 'number' ||
            rule.currentState < 0 || // Keep check for negative
            rule.nextCellState < 0) { // Keep check for negative
            // Removed checks against CELL_STATE_COLORS.length as colors are now dynamic
            console.error('Invalid rule structure or negative cell state found:', rule);
            return false;
        }
    }
    // console.log('Ruleset validated successfully:', rulesArray); // Optional: for debugging
    return true;
}

// Returns a copy of the default rules for a single ant.
export function getDefaultRules() {
    return JSON.parse(JSON.stringify(defaultSingleAntRules)); // Ensure deep copy for safety
}

export function generateRandomRuleset(numStates) {
    if (numStates <= 0) {
        console.warn(`Invalid number of states for random generation (${numStates}). Defaulting to 1 state.`);
        numStates = 1;
    }
    // Removed clamping of numStates based on CELL_STATE_COLORS.length.
    // Controller now calls populateCellStateColors based on this numStates.

    const newRandomRules = [];
    const possibleTurns = [-1, 0, 1, 2]; // Left, None, Right, U-Turn

    for (let i = 0; i < numStates; i++) {
        const rule = {
            currentState: i,
            turn: possibleTurns[Math.floor(Math.random() * possibleTurns.length)],
            nextCellState: Math.floor(Math.random() * numStates) // next state will also be within 0 to numStates-1
        };
        newRandomRules.push(rule);
    }
    // console.log('Generated random rules:', newRandomRules); // Optional: for debugging
    return newRandomRules;
}

// applyLangtonRules now takes the specific ant object and its index
export function applyLangtonRules(ant, antIndex) { 
    if (!ant || typeof antIndex !== 'number') {
        console.error('applyLangtonRules called with invalid ant or antIndex', ant, antIndex);
        return;
    }
    // Use processedRules (the map) for efficient lookup
    if (!ant.processedRules) { 
        console.error('Ant object is missing processedRules property:', ant);
        return;
    }

    const currentCellState = getCellState(ant.x, ant.y);
    let newDir = ant.dir;

    // Direct lookup from the processedRules map
    const rule = ant.processedRules[currentCellState]; 

    if (rule) {
        if (rule.turn === 1) newDir = (ant.dir + 1) % 4;
        else if (rule.turn === -1) newDir = (ant.dir - 1 + 4) % 4;
        else if (rule.turn === 0) { /* no turn */ }
        else if (rule.turn === 2) newDir = (ant.dir + 2) % 4; 
        
        setCellState(ant.x, ant.y, rule.nextCellState);
    } else {
        // If no rule is found for the current cell state, the ant does nothing to this cell.
        // It will still attempt to move in its current direction.
        // console.warn(`Ant ${ant.id || antIndex}: No rule found for cell state: ${currentCellState} at (${ant.x}, ${ant.y}). Ant will not change cell state.`);
    }
    
    updateAntDirection(antIndex, newDir); // Update direction for the specific ant

    let newX = ant.x; 
    let newY = ant.y;
    switch (newDir) {
        case 0: newY--; break; // Up
        case 1: newX++; break; // Right
        case 2: newY++; break; // Down
        case 3: newX--; break; // Left
    }

    // Grid wrapping logic is already handled by updateAntPosition in model.js
    // So, no need to explicitly wrap here. Model.js will take care of it.
    // newX = (newX + GRID_SIZE) % GRID_SIZE;
    // newY = (newY + GRID_SIZE) % GRID_SIZE;

    updateAntPosition(antIndex, newX, newY); // Update position for the specific ant
}