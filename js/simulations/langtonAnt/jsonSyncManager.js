// jsonSyncManager.js
import { UI_ELEMENT_IDS } from './config.js';
import { getRulesFromVisualEditor, loadRulesToVisualEditor } from './transitionManager.js';

let jsonSyncModalElement, jsonSyncTextareaElement, closeJsonSyncModalButtonElement;
let copyJsonBtn, applyJsonToEditorBtn;

export function openJsonSyncModal() {
    if (!jsonSyncModalElement || !jsonSyncTextareaElement) return;
    try {
        const visualRules = getRulesFromVisualEditor();
        jsonSyncTextareaElement.value = JSON.stringify(visualRules, null, 2);
        jsonSyncModalElement.style.display = 'block';
    } catch (e) {
        console.error("Error preparing JSON for modal:", e);
        alert("Could not load rules into JSON view.");
    }
}

export function closeJsonSyncModal() {
    if (jsonSyncModalElement) {
        jsonSyncModalElement.style.display = 'none';
    }
}

export function handleCopyJson() {
    if (!jsonSyncTextareaElement) return;
    navigator.clipboard.writeText(jsonSyncTextareaElement.value)
        .then(() => {
            alert('JSON copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy JSON: ', err);
            alert('Failed to copy JSON.');
        });
}

export function handleApplyJsonToEditor() {
    if (!jsonSyncTextareaElement) return;
    try {
        const rulesFromJson = JSON.parse(jsonSyncTextareaElement.value);
        if (Array.isArray(rulesFromJson)) {
            loadRulesToVisualEditor(rulesFromJson);
            const updatedVisualRules = getRulesFromVisualEditor();
            jsonSyncTextareaElement.value = JSON.stringify(updatedVisualRules, null, 2); 
            alert('Rules applied to visual editor! Select an ant and click "Apply Visual Rules to Sim" or "Visual Editor → JSON Textarea" to save them.');
        } else {
            alert('Invalid JSON format: Must be an array of rules.');
        }
    } catch (e) {
        console.error("Error parsing JSON from modal textarea:", e);
        alert('Invalid JSON in textarea. Please correct it. Error: ' + e.message);
    }
}

export function initializeJsonSyncManager() {
    // Get DOM elements
    jsonSyncModalElement = document.getElementById(UI_ELEMENT_IDS.jsonSyncModal);
    jsonSyncTextareaElement = document.getElementById(UI_ELEMENT_IDS.jsonSyncTextarea);
    closeJsonSyncModalButtonElement = document.getElementById(UI_ELEMENT_IDS.closeJsonSyncModalButton);
    copyJsonBtn = document.getElementById(UI_ELEMENT_IDS.copyJsonToClipboardButton);
    applyJsonToEditorBtn = document.getElementById(UI_ELEMENT_IDS.applyJsonToVisualEditorButton);
    
    // Add event listeners
    const syncJsonViewBtn = document.getElementById(UI_ELEMENT_IDS.syncJsonViewButton);
    if (syncJsonViewBtn) syncJsonViewBtn.addEventListener('click', openJsonSyncModal);
    if (closeJsonSyncModalButtonElement) closeJsonSyncModalButtonElement.addEventListener('click', closeJsonSyncModal);
    if (copyJsonBtn) copyJsonBtn.addEventListener('click', handleCopyJson);
    if (applyJsonToEditorBtn) applyJsonToEditorBtn.addEventListener('click', handleApplyJsonToEditor);

    // Modal backdrop click to close
    if (jsonSyncModalElement) {
        jsonSyncModalElement.addEventListener('click', (event) => {
            if (event.target === jsonSyncModalElement) { 
                closeJsonSyncModal();
            }
        });
    }
}