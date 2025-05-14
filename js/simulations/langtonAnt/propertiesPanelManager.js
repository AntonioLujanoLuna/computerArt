// propertiesPanelManager.js
import { UI_ELEMENT_IDS } from './config.js';
import { getVisualStatesData, getVisualTransitionsData, getSelectedStateId, 
         getSelectedTransitionId, getPendingTransition, setSelectedStateId, 
         setSelectedTransitionId, setPendingTransition, setVisualTransitionsData } from './editorInteractions.js';
import { renderVisualEditor } from './visualEditorRenderer.js';
import { handleStateColorChange } from './stateManager.js';
import { getCellStateColor } from './config.js';

let redrawSimulationGrid = () => {}; // Add this function reference
let nextTransitionUniqueId = 0;

export function setRedrawSimulationGridCallback(callback) {
    if (typeof callback === 'function') {
        redrawSimulationGrid = callback;
    }
}

export function updatePropertiesPanel() {
    const panel = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorPropertiesPanel);
    if (!panel) return;

    // Clone the panel to reset all event listeners
    const oldPanel = panel;
    const newPanel = oldPanel.cloneNode(false);
    oldPanel.parentNode.replaceChild(newPanel, oldPanel);

    const selectedStateId = getSelectedStateId();
    const selectedTransitionId = getSelectedTransitionId();
    const pendingTransition = getPendingTransition();
    const visualStatesData = getVisualStatesData();
    const visualTransitionsData = getVisualTransitionsData();
    const selectedTransition = visualTransitionsData.find(t => t.id === selectedTransitionId);

    // Helper to generate state options for select dropdown
    function createStateOptions(selectedValue) {
        let optionsHTML = '';
        if (visualStatesData.length === 0) {
            optionsHTML = '<option value="0">State 0 (default)</option>'; 
        } else {
            visualStatesData.forEach(state => {
                optionsHTML += `<option value="${state.id}" ${state.id === selectedValue ? 'selected' : ''}>State ${state.id}</option>`;
            });
        }
        return optionsHTML;
    }

    if (pendingTransition) {
        const nextCellStateOptions = createStateOptions(pendingTransition.toStateId);
        newPanel.innerHTML = `
            <p><strong>Create New Transition</strong></p>
            <div>From State: ${pendingTransition.fromStateId} &rarr; To State: ${pendingTransition.toStateId}</div>
            <div>
                <label for="turnDirectionSelect">Turn:</label>
                <select id="turnDirectionSelect">
                    <option value="1">Right (R)</option>
                    <option value="-1">Left (L)</option>
                    <option value="0">No Turn (N)</option>
                    <option value="2">U-Turn (U)</option>
                </select>
            </div>
            <div>
                <label for="nextCellStateSelect">Next Cell State:</label>
                <select id="nextCellStateSelect">${nextCellStateOptions}</select>
            </div>
            <button id="confirmTransitionButton">Confirm Transition</button>
            <button id="cancelTransitionButton">Cancel</button>
        `;
        newPanel.querySelector('#confirmTransitionButton').addEventListener('click', confirmNewTransition);
        newPanel.querySelector('#cancelTransitionButton').addEventListener('click', cancelNewTransition);

    } else if (selectedTransition) {
        const nextCellStateOptions = createStateOptions(selectedTransition.rule.nextCellState);
        newPanel.innerHTML = `
            <p><strong>Edit Transition</strong></p>
            <div>From State: ${selectedTransition.fromStateId} &rarr; To State: ${selectedTransition.toStateId}</div>
            <div>
                <label for="editTurnDirectionSelect">Turn:</label>
                <select id="editTurnDirectionSelect">
                    <option value="1" ${selectedTransition.rule.turn === 1 ? 'selected' : ''}>Right (R)</option>
                    <option value="-1" ${selectedTransition.rule.turn === -1 ? 'selected' : ''}>Left (L)</option>
                    <option value="0" ${selectedTransition.rule.turn === 0 ? 'selected' : ''}>No Turn (N)</option>
                    <option value="2" ${selectedTransition.rule.turn === 2 ? 'selected' : ''}>U-Turn (U)</option>
                </select>
            </div>
            <div>
                <label for="editNextCellStateSelect">Next Cell State:</label>
                <select id="editNextCellStateSelect">${nextCellStateOptions}</select>
            </div>
            <button id="updateTransitionButton">Update Transition</button>
            <button id="deleteTransitionButton">Delete Transition</button>
            <button id="deselectComponentButton">Done Editing</button> 
        `;
        newPanel.querySelector('#updateTransitionButton').addEventListener('click', updateSelectedTransition);
        newPanel.querySelector('#deleteTransitionButton').addEventListener('click', deleteSelectedTransition);
        newPanel.querySelector('#deselectComponentButton').addEventListener('click', deselectAllComponents); 

    } else if (selectedStateId !== null) {
        const state = visualStatesData.find(s => s.id === selectedStateId);
        if (state) {
            const stateColor = getCellStateColor(state.id);
            newPanel.innerHTML = `
                <p><strong>Selected State</strong></p>
                <div>ID: ${state.id}</div>
                <div>Color: <span style="color:${stateColor};">${stateColor}</span> <input type="color" value="${stateColor}" id="stateColorPicker"></div>
                <div>X: ${state.x.toFixed(0)}, Y: ${state.y.toFixed(0)}</div>
                <button id="deselectComponentButton">Done Editing</button>
            `;
            const colorPicker = newPanel.querySelector('#stateColorPicker');
            if (colorPicker) {
                colorPicker.addEventListener('change', handleStateColorChange);
            }
            newPanel.querySelector('#deselectComponentButton').addEventListener('click', deselectAllComponents);
        } else {
            newPanel.innerHTML = '<p>Error: Selected state data not found.</p>';
        }
    } else {
        newPanel.innerHTML = '<p>Select a state or Alt+Drag between states to create a transition. Click an arrow to edit it.</p>';
    }
}

function confirmNewTransition() {
    const pendingTransition = getPendingTransition();
    const visualTransitionsData = getVisualTransitionsData();
    
    if (!pendingTransition) return;
    
    const turnValue = parseInt(document.getElementById('turnDirectionSelect').value, 10);
    const nextCellStateValue = parseInt(document.getElementById('nextCellStateSelect').value, 10);

    if (isNaN(nextCellStateValue)) {
        alert("Invalid Next Cell State selected.");
        return;
    }
    
    const newTransition = {
        id: `vis_trans_${nextTransitionUniqueId++}`,
        rule: { 
            currentState: pendingTransition.fromStateId, 
            turn: turnValue, 
            nextCellState: nextCellStateValue 
        },
        fromStateId: pendingTransition.fromStateId,
        toStateId: pendingTransition.toStateId
    };
    
    const alreadyExists = visualTransitionsData.some(t => 
        t.fromStateId === newTransition.fromStateId &&
        t.toStateId === newTransition.toStateId &&
        t.rule.turn === newTransition.rule.turn &&
        t.rule.nextCellState === newTransition.rule.nextCellState
    );
    
    if (!alreadyExists) {
        setVisualTransitionsData([...visualTransitionsData, newTransition]);
        console.log("New transition confirmed:", newTransition);
    } else {
        console.log("Identical transition already exists.");
    }
    
    setPendingTransition(null);
    renderVisualEditor();
    redrawSimulationGrid();
}

function cancelNewTransition() {
    setPendingTransition(null);
    renderVisualEditor(); 
}

function updateSelectedTransition() {
    const selectedTransitionId = getSelectedTransitionId();
    const visualTransitionsData = getVisualTransitionsData();
    
    if (!selectedTransitionId) return;
    
    const transition = visualTransitionsData.find(t => t.id === selectedTransitionId);
    if (!transition) {
        console.error("Selected transition not found for update.");
        return;
    }

    const turnValue = parseInt(document.getElementById('editTurnDirectionSelect').value, 10);
    const nextCellStateValue = parseInt(document.getElementById('editNextCellStateSelect').value, 10);

    if (isNaN(nextCellStateValue)) { 
        alert("Invalid Next Cell State selected.");
        return;
    }

    // Create a new array with the updated transition
    const updatedTransitions = visualTransitionsData.map(t => {
        if (t.id === selectedTransitionId) {
            return {
                ...t,
                rule: {
                    ...t.rule,
                    turn: turnValue,
                    nextCellState: nextCellStateValue
                }
            };
        }
        return t;
    });

    setVisualTransitionsData(updatedTransitions);
    console.log("Transition updated:", transition);
    renderVisualEditor(); 
    redrawSimulationGrid(); 
}

function deleteSelectedTransition() {
    const selectedTransitionId = getSelectedTransitionId();
    const visualTransitionsData = getVisualTransitionsData();
    
    if (!selectedTransitionId) return;
    
    const updatedTransitions = visualTransitionsData.filter(t => t.id !== selectedTransitionId);
    
    setVisualTransitionsData(updatedTransitions);
    setSelectedTransitionId(null);
    
    console.log("Transition deleted:", selectedTransitionId);
    renderVisualEditor();
    redrawSimulationGrid();
}

function deselectAllComponents() {
    setSelectedStateId(null);
    setSelectedTransitionId(null);
    setPendingTransition(null);
    renderVisualEditor();
}