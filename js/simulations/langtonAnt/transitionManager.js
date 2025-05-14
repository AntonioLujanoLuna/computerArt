// transitionManager.js
import { populateCellStateColors, UI_ELEMENT_IDS } from './config.js';
import { getVisualStatesData, getVisualTransitionsData, setVisualStatesData, 
         setVisualTransitionsData, setSelectedStateId, setSelectedTransitionId, 
         setPendingTransition } from './editorInteractions.js';
import { renderVisualEditor } from './visualEditorRenderer.js';
import { getCurrentVisualEditorAntIndex, updateTextareaWithConfiguration } from './uiManager.js';
import { handleApplyRules } from './ruleManager.js';

let nextTransitionUniqueId = 0;

export function loadSampleVisualTransitionData() {
    const visualStatesData = getVisualStatesData();
    
    if (visualStatesData.length < 2) return;
    
    const sampleTransitions = [
        {
            id: `vis_trans_${nextTransitionUniqueId++}`,
            rule: { currentState: 0, turn: 1, nextCellState: 1 },
            fromStateId: 0,
            toStateId: 1 
        },
        {
            id: `vis_trans_${nextTransitionUniqueId++}`,
            rule: { currentState: 1, turn: -1, nextCellState: 0 },
            fromStateId: 1,
            toStateId: 0
        },
    ];
    
    setVisualTransitionsData(sampleTransitions);
    console.log("Loaded sample transitions:", sampleTransitions);
}

export function getRulesFromVisualEditor() {
    const visualStatesData = getVisualStatesData();
    const visualTransitionsData = getVisualTransitionsData();
    const rules = [];
    const activeStateIds = new Set(visualStatesData.map(s => s.id));

    for (const trans of visualTransitionsData) {
        // Basic validation: ensure states in the rule exist visually
        if (!activeStateIds.has(trans.rule.currentState) || 
            !activeStateIds.has(trans.rule.nextCellState)) {
            console.warn("Transition references a state not currently in the visual editor:", trans.rule);
        }
        
        rules.push({
            currentState: trans.rule.currentState,
            turn: trans.rule.turn,
            nextCellState: trans.rule.nextCellState
        });
    }

    console.log("Rules extracted from visual editor:", rules);
    return rules;
}

export function loadRulesToVisualEditor(rulesArray) {
    if (!Array.isArray(rulesArray)) {
        console.error("loadRulesToVisualEditor expects an array.");
        setVisualStatesData([]);
        setVisualTransitionsData([]);
        setPendingTransition(null);
        setSelectedStateId(null);
        setSelectedTransitionId(null);
        renderVisualEditor();
        return;
    }

    setVisualStatesData([]);
    setVisualTransitionsData([]);
    setPendingTransition(null);
    setSelectedStateId(null);
    setSelectedTransitionId(null);
    nextTransitionUniqueId = 0;

    const stateIds = new Set();
    rulesArray.forEach(rule => {
        stateIds.add(rule.currentState);
        stateIds.add(rule.nextCellState);
    });

    if (stateIds.size === 0 && rulesArray.length === 0) {
        stateIds.add(0); 
    } else if (stateIds.size === 0 && rulesArray.length > 0) {
        // Fallback to ensure state 0 if implied
        console.warn("Rules provided but no explicit states found; defaulting to state 0.");
        if (!rulesArray.some(r => r.currentState === 0 || r.nextCellState === 0)) {
            stateIds.add(0);
        }
    }

    const sortedStateIds = Array.from(stateIds).sort((a, b) => a - b);
    
    const canvas = document.getElementById('visualRuleEditorCanvas');
    let maxStateId = 0;
    const numStates = sortedStateIds.length;

    if (numStates > 0 && canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        // Calculate layout radius
        let layoutRadius = Math.min(canvas.width, canvas.height) / 2 - 20 - 10; // State radius + padding
        if (numStates <= 1) {
            layoutRadius = 0; // Single state at center
        }
        layoutRadius = Math.max(0, layoutRadius);

        const newStates = [];
        sortedStateIds.forEach((id, index) => {
            let x, y;
            if (numStates === 1) {
                x = centerX;
                y = centerY;
            } else {
                const angle = (index / numStates) * 2 * Math.PI - (Math.PI / 2); // Start from top (-PI/2)
                x = centerX + layoutRadius * Math.cos(angle);
                y = centerY + layoutRadius * Math.sin(angle);
            }
            newStates.push({ id: id, x: x, y: y, radius: 20 });
            if (id > maxStateId) maxStateId = id;
        });
        setVisualStatesData(newStates);
    } else if (numStates > 0) {
        // Canvas not available fallback
        const newStates = sortedStateIds.map(id => {
            if (id > maxStateId) maxStateId = id;
            return { id: id, x: 50, y: 50, radius: 20 };
        });
        setVisualStatesData(newStates);
        console.warn("Canvas not available during loadRulesToVisualEditor state layout.");
    }
    
    // If visualStatesData is still empty, ensure default state 0
    if (getVisualStatesData().length === 0) {
        const x = canvas ? canvas.width/2 : 50;
        const y = canvas ? canvas.height/2 : 50;
        setVisualStatesData([{ id: 0, x: x, y: y, radius: 20 }]);
        maxStateId = Math.max(maxStateId, 0);
    }

    populateCellStateColors(maxStateId + 1);

    // Create transitions from rules
    const newTransitions = [];
    rulesArray.forEach(rule => {
        const visualStatesData = getVisualStatesData();
        // Ensure the states for the rule exist in visualStatesData
        const fromStateExists = visualStatesData.some(s => s.id === rule.currentState);
        const toStateVisualExists = visualStatesData.some(s => s.id === rule.nextCellState);

        if (!fromStateExists || !toStateVisualExists) {
            console.warn(`Rule references state(s) not found in visual states.`);
        }

        newTransitions.push({
            id: `vis_trans_${nextTransitionUniqueId++}`,
            rule: { ...rule }, 
            fromStateId: rule.currentState, 
            toStateId: rule.nextCellState     
        });
    });
    
    setVisualTransitionsData(newTransitions);
    console.log("Visual editor updated from rules array with new layout.");
    renderVisualEditor();
}

export function handleApplyVisualRulesToSim() {
    const rules = getRulesFromVisualEditor();
    const antIndex = getCurrentVisualEditorAntIndex();
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);

    if (!rulesTextarea) {
        console.error("Rules textarea not found.");
        return;
    }

    try {
        let currentConfigurations = JSON.parse(rulesTextarea.value);
        if (!Array.isArray(currentConfigurations)) {
            console.warn("Textarea content is not an array. Initializing with new structure.");
            currentConfigurations = [];
        }

        // Ensure there's an ant configuration for the current index
        while (currentConfigurations.length <= antIndex) {
            currentConfigurations.push({ id: `ant_${currentConfigurations.length}`, rules: [] });
        }

        currentConfigurations[antIndex].rules = rules;
        updateTextareaWithConfiguration(currentConfigurations); // Update the main textarea
        handleApplyRules(); // Apply to simulation
        console.log(`Applied visual rules to ant ${antIndex} and simulation.`);
    } catch (error) {
        console.error("Error applying visual rules to simulation:", error);
        alert("Failed to apply visual rules. Check console for details.");
    }
}

export function handleGetVisualRulesToJson() {
    const rules = getRulesFromVisualEditor();
    const antIndex = getCurrentVisualEditorAntIndex();
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);

    if (!rulesTextarea) {
        console.error("Rules textarea not found.");
        return;
    }

    try {
        let currentConfigurations = JSON.parse(rulesTextarea.value);
        if (!Array.isArray(currentConfigurations)) {
            console.warn("Textarea content is not an array. Initializing with new structure.");
            currentConfigurations = [];
        }
        
        while (currentConfigurations.length <= antIndex) {
            currentConfigurations.push({ id: `ant_${currentConfigurations.length}`, rules: [] });
        }

        currentConfigurations[antIndex].rules = rules;
        updateTextareaWithConfiguration(currentConfigurations);
        console.log(`Updated textarea with visual rules for ant ${antIndex}.`);
        alert("Rules from visual editor have been updated in the JSON textarea for the selected ant.");
    } catch (error) {
        console.error("Error updating JSON textarea with visual rules:", error);
        alert("Failed to update JSON textarea. Check console for details.");
    }
}