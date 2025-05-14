// configGenerator.js
import { UI_ELEMENT_IDS, GRID_SIZE, populateCellStateColors, generateRandomHexColor } from './config.js';
import { generateRandomRuleset } from './rules.js';
import { updateTextareaWithConfiguration, populateAntSelector, setCurrentVisualEditorAntIndex } from './uiManager.js';
import { loadRulesToVisualEditor } from './transitionManager.js';

export function handleGenerateAntsWithSharedRuleset() { 
    const numStatesInput = document.getElementById(UI_ELEMENT_IDS.numStatesForRandom);
    const numAntsInput = document.getElementById(UI_ELEMENT_IDS.numAntsForGeneration);

    if (!numStatesInput || !numAntsInput) {
        console.error('Required input elements for generating random rules/ants not found.');
        return;
    }

    let numStates = parseInt(numStatesInput.value, 10);
    if (isNaN(numStates) || numStates < 1) {
        numStates = 2; 
        numStatesInput.value = numStates;
        console.warn('Invalid number of states for random rules, defaulting to 2.');
    }

    let numAnts = parseInt(numAntsInput.value, 10);
    if (isNaN(numAnts) || numAnts < 1) {
        numAnts = 1; 
        numAntsInput.value = numAnts;
        console.warn('Invalid number of ants for random rules generation, defaulting to 1.');
    }
    
    populateCellStateColors(numStates);

    const randomRules = generateRandomRuleset(numStates); 
    const generatedAntConfigs = [];

    for (let i = 0; i < numAnts; i++) {
        const antConfig = {
            id: `rand_shared_ant_${i}`,
            x: Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1),
            y: Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1),
            dir: Math.floor(Math.random() * 4),
            rules: randomRules, 
            color: generateRandomHexColor() 
        };
        generatedAntConfigs.push(antConfig);
    }
    
    updateTextareaWithConfiguration(generatedAntConfigs);
    populateAntSelector(generatedAntConfigs); 
    
    if (generatedAntConfigs.length > 0) {
        setCurrentVisualEditorAntIndex(0);
        loadRulesToVisualEditor(generatedAntConfigs[0].rules);
    }
    
    console.log(`${numAnts} ant configurations generated with a shared random ruleset (based on ${numStates} states) and populated into textarea. Click Apply to use.`);
}

export function handleGenerateAntsWithUniqueRulesets() { 
    const numAntsInput = document.getElementById(UI_ELEMENT_IDS.numAntsForGeneration);
    const numStatesInput = document.getElementById(UI_ELEMENT_IDS.numStatesForRandom); 
    
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
        numStatesPerAnt = 2; 
        numStatesInput.value = numStatesPerAnt; 
        console.warn('Invalid number of states for rules, defaulting to 2.');
    }

    populateCellStateColors(numStatesPerAnt); 

    const generatedAntConfigs = [];
    for (let i = 0; i < numAnts; i++) {
        const randomRules = generateRandomRuleset(numStatesPerAnt); 
        const x = Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1); 
        const y = Math.floor(Math.random() * GRID_SIZE * 0.8 + GRID_SIZE * 0.1);
        const dir = Math.floor(Math.random() * 4);
        const antColor = generateRandomHexColor(); 

        generatedAntConfigs.push({
            id: `gen_unique_ant_${i}`,
            x: x,
            y: y,
            dir: dir,
            rules: randomRules,
            color: antColor 
        });
    }

    updateTextareaWithConfiguration(generatedAntConfigs);
    populateAntSelector(generatedAntConfigs); 
    
    if (generatedAntConfigs.length > 0) {
        setCurrentVisualEditorAntIndex(0);
        loadRulesToVisualEditor(generatedAntConfigs[0].rules);
    }
    
    console.log(`${numAnts} ant configurations generated (each with unique rules) and populated into textarea. Click Apply to use them.`);
}

export function initializeConfigGenerator() {
    const generateAntsButton = document.getElementById(UI_ELEMENT_IDS.generateAntsButton); 
    const generateRulesButton = document.getElementById(UI_ELEMENT_IDS.generateRulesButton);
    
    if (generateAntsButton) generateAntsButton.addEventListener('click', handleGenerateAntsWithUniqueRulesets);
    if (generateRulesButton) generateRulesButton.addEventListener('click', handleGenerateAntsWithSharedRuleset);
}