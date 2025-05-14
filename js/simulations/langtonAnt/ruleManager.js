// ruleManager.js
import { UI_ELEMENT_IDS } from './config.js';
import { validateRules, getDefaultRules } from './rules.js';
import { initializeModel, getAnts } from './model.js';
import { stopSimulation } from './simulationController.js';
import { drawSimulation } from './view.js';
import { populateAntSelector, updateTextareaWithConfiguration, getCurrentVisualEditorAntIndex, setCurrentVisualEditorAntIndex } from './uiManager.js';
import { loadRulesToVisualEditor } from './transitionManager.js';
import { populateCellStateColors } from './config.js';

export function handleApplyRules() {
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
    if (!rulesTextarea) return;

    let parsedAntConfigurations;
    let rulesToLoadInEditor = getDefaultRules(); 

    try {
        parsedAntConfigurations = JSON.parse(rulesTextarea.value);
    } catch (error) {
        console.error('Error parsing JSON for ant configurations:', error);
        alert('Invalid JSON format for ant configurations. Please check the console.');
        populateAntSelector([]); 
        loadRulesToVisualEditor(rulesToLoadInEditor);
        return;
    }

    if (!Array.isArray(parsedAntConfigurations)) {
        console.error('Ant configurations JSON must be an array.');
        alert('Ant configurations must be an array. Please check the JSON structure.');
        populateAntSelector([]); 
        loadRulesToVisualEditor(rulesToLoadInEditor); 
        return;
    }
    
    populateAntSelector(parsedAntConfigurations); 

    let currentVisualEditorAntIndex = getCurrentVisualEditorAntIndex();

    if (parsedAntConfigurations.length === 0) {
        console.warn('Ant configurations array is empty. Simulation will use model defaults.');
        rulesToLoadInEditor = getDefaultRules();
        setCurrentVisualEditorAntIndex(0); 
    } else {
        if (currentVisualEditorAntIndex >= parsedAntConfigurations.length) {
            setCurrentVisualEditorAntIndex(0); 
            currentVisualEditorAntIndex = 0;
        }
        
        if (parsedAntConfigurations[currentVisualEditorAntIndex] && parsedAntConfigurations[currentVisualEditorAntIndex].rules) {
            rulesToLoadInEditor = parsedAntConfigurations[currentVisualEditorAntIndex].rules;
        } else if (parsedAntConfigurations.length > 0 && parsedAntConfigurations[0] && parsedAntConfigurations[0].rules) {
            console.warn(`Selected ant index ${currentVisualEditorAntIndex} has no rules, or ant does not exist. Falling back to first ant\'s rules for visual editor.`);
            setCurrentVisualEditorAntIndex(0);
            rulesToLoadInEditor = parsedAntConfigurations[0].rules;
        } else {
            console.warn("Neither selected nor first ant configuration has rules. Visual editor will use default rules.");
            rulesToLoadInEditor = getDefaultRules();
            setCurrentVisualEditorAntIndex(0); 
        }
    }
    
    loadRulesToVisualEditor(rulesToLoadInEditor);

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
        stopSimulation(); 
        initializeModel(parsedAntConfigurations.length > 0 ? parsedAntConfigurations : undefined);
        console.log('Custom ant configurations applied successfully!');
        const currentModelAnts = getAnts().map((ant, index) => ({ 
            id: ant.id || `ant_${index}`, 
            rules: ant.rules 
        }));
        
        populateAntSelector(currentModelAnts); 
        currentVisualEditorAntIndex = getCurrentVisualEditorAntIndex();
        
        if (currentModelAnts[currentVisualEditorAntIndex] && currentModelAnts[currentVisualEditorAntIndex].rules) {
            loadRulesToVisualEditor(currentModelAnts[currentVisualEditorAntIndex].rules);
        } else if (currentModelAnts.length > 0 && currentModelAnts[0] && currentModelAnts[0].rules) {
            setCurrentVisualEditorAntIndex(0);
            loadRulesToVisualEditor(currentModelAnts[0].rules);
        } else {
             loadRulesToVisualEditor(getDefaultRules()); 
        }

        drawSimulation(); 
    } else {
        console.error('Failed to apply custom ant configurations due to invalid rules.');
    }
}

export function handleResetRules() {
    stopSimulation();
    initializeModel(); 
    const modelDefaultAnts = getAnts().map((ant, index) => ({ 
        id: ant.id || `ant_${index}`,
        rules: ant.rules
    }));
    updateTextareaWithConfiguration(modelDefaultAnts); 
    populateAntSelector(modelDefaultAnts); 
    setCurrentVisualEditorAntIndex(0); 
    if (modelDefaultAnts.length > 0 && modelDefaultAnts[0].rules) {
        loadRulesToVisualEditor(modelDefaultAnts[0].rules);
    } else {
        loadRulesToVisualEditor(getDefaultRules());
    }
    console.log('Model reset to default ant configuration.');
    drawSimulation(); 
}

export function handleVisualEditorAntSelectionChange() {
    const currentVisualEditorAntIndex = getCurrentVisualEditorAntIndex();
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
    if (!rulesTextarea) return;

    try {
        const parsedAntConfigurations = JSON.parse(rulesTextarea.value);
        if (Array.isArray(parsedAntConfigurations) && 
            parsedAntConfigurations[currentVisualEditorAntIndex] && 
            parsedAntConfigurations[currentVisualEditorAntIndex].rules) {
            loadRulesToVisualEditor(parsedAntConfigurations[currentVisualEditorAntIndex].rules);
        } else {
            console.warn(`Rules for selected ant index ${currentVisualEditorAntIndex} not found in textarea. Loading default rules to editor.`);
            loadRulesToVisualEditor(getDefaultRules());
        }
    } catch (error) {
        console.error('Error parsing JSON from textarea for ant selection change:', error);
        alert('Could not load rules for the selected ant due to an error in the JSON configuration. Loading default rules to editor.');
        loadRulesToVisualEditor(getDefaultRules());
    }
}

export function initializeRuleManager() {
    const applyRulesButton = document.getElementById(UI_ELEMENT_IDS.applyRulesButton);
    const resetRulesButton = document.getElementById(UI_ELEMENT_IDS.resetRulesButton);
    
    if (applyRulesButton) applyRulesButton.addEventListener('click', handleApplyRules);
    if (resetRulesButton) resetRulesButton.addEventListener('click', handleResetRules);
}