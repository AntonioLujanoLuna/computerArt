// stateManager.js
import { UI_ELEMENT_IDS, populateCellStateColors, setCustomStateColor } from './config.js';
import { renderVisualEditor } from './visualEditorRenderer.js';
import { getVisualStatesData, setVisualStatesData, getSelectedStateId, setSelectedStateId } from './editorInteractions.js';

const STATE_CIRCLE_RADIUS = 20;
const STATE_SPACING = 80;

export function addVisualState() {
    const canvas = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorCanvas);
    if (!canvas) return;
    
    const visualStatesData = getVisualStatesData();
    let newId = 0;
    let newX = 50; 
    const newY = canvas.height / 2; 

    if (visualStatesData.length > 0) {
        const lastState = visualStatesData[visualStatesData.length - 1];
        newId = lastState.id + 1;
        newX = lastState.x + STATE_SPACING;
    }

    if (newX + STATE_CIRCLE_RADIUS > canvas.width) {
        console.warn("New state would be off canvas.");
        return; 
    }

    const updatedStates = [...visualStatesData, { 
        id: newId, 
        x: newX, 
        y: newY, 
        radius: STATE_CIRCLE_RADIUS 
    }];
    
    setVisualStatesData(updatedStates);
    populateCellStateColors(newId + 1); 
    renderVisualEditor();
    console.log('Added state:', newId);
}

export function removeVisualState() {
    const selectedStateId = getSelectedStateId();
    const visualStatesData = getVisualStatesData();
    
    if (selectedStateId === null) {
        console.log('No state selected to remove.');
        return;
    }

    const stateToRemoveIndex = visualStatesData.findIndex(s => s.id === selectedStateId);

    if (stateToRemoveIndex !== -1) {
        const newStates = [...visualStatesData];
        const removedState = newStates.splice(stateToRemoveIndex, 1)[0];
        console.log('Removed state:', removedState.id);

        setVisualStatesData(newStates);
        setSelectedStateId(null);
    } else {
        console.warn('Selected state ID not found in visualStatesData.');
        setSelectedStateId(null);
    }
    
    renderVisualEditor();
}

export function handleStateColorChange(event) {
    const selectedStateId = getSelectedStateId();
    if (selectedStateId === null) return;
    
    const newColor = event.target.value;
    setCustomStateColor(selectedStateId, newColor);
    
    console.log(`State ${selectedStateId} color changed to ${newColor}. Config updated.`);
    
    renderVisualEditor(); 
    if (typeof redrawSimulationGrid === 'function') {
        redrawSimulationGrid(); 
    }
}

export function initializeStateManager() {
    const addStateBtn = document.getElementById(UI_ELEMENT_IDS.addStateButton);
    const removeStateBtn = document.getElementById(UI_ELEMENT_IDS.removeStateButton);
    
    if (addStateBtn) addStateBtn.addEventListener('click', addVisualState);
    if (removeStateBtn) removeStateBtn.addEventListener('click', removeVisualState);
}