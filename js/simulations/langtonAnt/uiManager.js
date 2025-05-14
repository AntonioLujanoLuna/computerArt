// uiManager.js
import { UI_ELEMENT_IDS, handlePaletteChange } from './config.js';
import { handleVisualEditorAntSelectionChange } from './ruleManager.js';
import { handleApplyVisualRulesToSim, handleGetVisualRulesToJson } from './transitionManager.js';

let visualEditorAntSelectorElement;
let currentVisualEditorAntIndex = 0;
let isDraggingPanel = false;
let panelOffsetX, panelOffsetY;

export function updateTextareaWithConfiguration(configObject) {
    const rulesTextarea = document.getElementById(UI_ELEMENT_IDS.rulesTextarea);
    if (rulesTextarea) {
        rulesTextarea.value = JSON.stringify(configObject, null, 2);
    }
}

export function getCurrentVisualEditorAntIndex() {
    return currentVisualEditorAntIndex;
}

export function setCurrentVisualEditorAntIndex(index) {
    currentVisualEditorAntIndex = index;
    if (visualEditorAntSelectorElement) {
        visualEditorAntSelectorElement.value = index.toString();
    }
}

export function populateAntSelector(antConfigurations) {
    if (!visualEditorAntSelectorElement) return;

    visualEditorAntSelectorElement.innerHTML = ''; 

    if (!antConfigurations || antConfigurations.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No ants configured';
        option.disabled = true;
        visualEditorAntSelectorElement.appendChild(option);
        return;
    }

    antConfigurations.forEach((ant, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = ant.id ? `Ant ${index + 1} (${ant.id})` : `Ant ${index + 1}`;
        visualEditorAntSelectorElement.appendChild(option);
    });

    if (currentVisualEditorAntIndex >= 0 && currentVisualEditorAntIndex < antConfigurations.length) {
        visualEditorAntSelectorElement.value = currentVisualEditorAntIndex.toString();
    } else if (antConfigurations.length > 0) {
        setCurrentVisualEditorAntIndex(0);
    }
}

// Panel dragging functions
export function panelDragStart(event, panel) {
    if (event.target.classList.contains('drag-handle')) {
        isDraggingPanel = true;
        panelOffsetX = event.clientX - panel.offsetLeft;
        panelOffsetY = event.clientY - panel.offsetTop;
        document.addEventListener('mousemove', panelDragMove);
        document.addEventListener('mouseup', panelDragEnd);
        event.preventDefault();
    }
}

function panelDragMove(event) {
    if (isDraggingPanel) {
        const panel = document.querySelector('.controls');
        if (!panel) return;
        let newX = event.clientX - panelOffsetX;
        let newY = event.clientY - panelOffsetY;
        const maxX = window.innerWidth - panel.offsetWidth;
        const maxY = window.innerHeight - panel.offsetHeight;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        panel.style.left = newX + 'px';
        panel.style.top = newY + 'px';
    }
}

function panelDragEnd() {
    isDraggingPanel = false;
    document.removeEventListener('mousemove', panelDragMove);
    document.removeEventListener('mouseup', panelDragEnd);
}

export function initializeUI() {
    visualEditorAntSelectorElement = document.getElementById(UI_ELEMENT_IDS.visualEditorAntSelector);
    
    if (visualEditorAntSelectorElement) {
        visualEditorAntSelectorElement.addEventListener('change', handleVisualEditorAntSelectionChange);
    } else {
        console.error(`Visual editor ant selector element with ID '${UI_ELEMENT_IDS.visualEditorAntSelector}' not found`);
    }

    // Set up control panel dragging
    const controlsPanelDragHandle = document.querySelector('.controls .drag-handle');
    if (controlsPanelDragHandle) {
        controlsPanelDragHandle.addEventListener('mousedown', (event) => panelDragStart(event, document.querySelector('.controls')));
    }

    const applyVisualRulesBtn = document.getElementById(UI_ELEMENT_IDS.applyVisualRulesButton);
    if (applyVisualRulesBtn) applyVisualRulesBtn.addEventListener('click', handleApplyVisualRulesToSim);

    const getVisualRulesToJsonBtn = document.getElementById(UI_ELEMENT_IDS.getVisualRulesToJsonButton);
    if (getVisualRulesToJsonBtn) getVisualRulesToJsonBtn.addEventListener('click', handleGetVisualRulesToJson);

    const paletteSelect = document.getElementById(UI_ELEMENT_IDS.paletteSelect);
    if (paletteSelect) paletteSelect.addEventListener('change', handlePaletteChange);

    // Minimize button functionality
    const minimizeButton = document.getElementById('minimizeControlsButton');
    const controlsContent = document.querySelector('.controls .controls-content');
    const mainControlsPanel = document.querySelector('.controls'); // Get the main controls panel

    if (minimizeButton && controlsContent && mainControlsPanel) {
        minimizeButton.addEventListener('click', () => {
            controlsContent.classList.toggle('minimized');
            if (controlsContent.classList.contains('minimized')) {
                minimizeButton.textContent = '+';
                mainControlsPanel.style.height = 'auto'; // Rely on min-height set in CSS
                mainControlsPanel.style.resize = 'none'; // Prevent resize when minimized
                mainControlsPanel.style.overflow = 'hidden';
            } else {
                minimizeButton.textContent = '-';
                mainControlsPanel.style.height = ''; // Reset to allow CSS or content to define height
                mainControlsPanel.style.resize = 'both'; // Allow resize when expanded
                // overflow will be handled by controls-content for scrolling
            }
        });
    }
}