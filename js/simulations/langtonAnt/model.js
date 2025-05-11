// js/simulations/langtonAnt/model.js
import { GRID_SIZE } from './config.js'; // Removed INITIAL_ANT_STATE import

let grid = [];
let ants = []; // Changed from single 'ant' object to an array 'ants'

// Default ant configuration if none is provided
const defaultAntConfiguration = [
    {
        x: Math.floor(GRID_SIZE / 2),
        y: Math.floor(GRID_SIZE / 2),
        dir: 0, // 0: up, 1: right, 2: down, 3: left
        rules: [ // Standard Langton's Ant rules
            { "currentState": 0, "turn": 1,  "nextCellState": 1 },
            { "currentState": 1, "turn": -1, "nextCellState": 0 }
        ],
        color: '#FF4136' // Default ant color, can be overridden by JSON
    }
];

export function initializeModel(antConfigurations) {
    // Initialize grid cells to state 0 (default background state)
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    ants = []; // Clear previous ants

    const configsToUse = antConfigurations && antConfigurations.length > 0 ? antConfigurations : defaultAntConfiguration;

    configsToUse.forEach((config, index) => {
        const rulesArray = Array.isArray(config.rules) && config.rules.length > 0 
                            ? config.rules 
                            : defaultAntConfiguration[0].rules; // Fallback to default rules array

        const processedRules = {};
        if (rulesArray) {
            rulesArray.forEach(rule => {
                processedRules[rule.currentState] = rule;
            });
        }

        const newAnt = {
            id: config.id || `ant_${index}`,
            x: typeof config.x === 'number' ? config.x : Math.floor(GRID_SIZE / 2),
            y: typeof config.y === 'number' ? config.y : Math.floor(GRID_SIZE / 2),
            dir: typeof config.dir === 'number' ? config.dir : 0,
            processedRules: processedRules, // Store the processed rules map
            // rules: rulesArray, // Optionally keep original array for debugging or other purposes, or remove
            color: config.color || defaultAntConfiguration[0].color 
        };
        // Ensure initial position is within grid bounds (can be refined with wrapping if needed)
        newAnt.x = (newAnt.x % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        newAnt.y = (newAnt.y % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        ants.push(newAnt);
    });

    console.log(`Model initialized with ${ants.length} ant(s). Grid set to state 0.`);
}

export function getGrid() {
    return grid;
}

export function getAnts() { // Renamed from getAnt
    return ants;
}

export function updateAntPosition(antIndex, newX, newY) {
    if (ants[antIndex]) {
        ants[antIndex].x = (newX + GRID_SIZE) % GRID_SIZE; // Ensure wrapping
        ants[antIndex].y = (newY + GRID_SIZE) % GRID_SIZE; // Ensure wrapping
    }
}

export function updateAntDirection(antIndex, newDir) {
    if (ants[antIndex]) {
        ants[antIndex].dir = newDir;
    }
}

export function getCellState(x, y) {
    // Ensure x and y are within bounds before accessing grid
    // This handles cases where an ant might be (temporarily, before wrapping) calculated as outside
    const wrappedX = (x % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    const wrappedY = (y % GRID_SIZE + GRID_SIZE) % GRID_SIZE;

    if (wrappedY >= 0 && wrappedY < GRID_SIZE && wrappedX >= 0 && wrappedX < GRID_SIZE) {
        return grid[wrappedY][wrappedX];
    }
    // This should ideally not be reached if all coordinates are pre-wrapped.
    console.warn(`Attempted to getCellState effectively out of bounds: ${x},${y} (wrapped to ${wrappedX},${wrappedY})`);
    return 0; // Default state for out-of-bounds (should be rare)
}

export function setCellState(x, y, state) {
    // Ensure x and y are within bounds before setting state
    const wrappedX = (x % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    const wrappedY = (y % GRID_SIZE + GRID_SIZE) % GRID_SIZE;

    if (wrappedY >= 0 && wrappedY < GRID_SIZE && wrappedX >= 0 && wrappedX < GRID_SIZE) {
        grid[wrappedY][wrappedX] = state;
    } else {
        console.warn(`Attempted to setCellState effectively out of bounds: ${x},${y} (wrapped to ${wrappedX},${wrappedY})`);
    }
}

// Initialize model on load with default ant configuration
initializeModel();