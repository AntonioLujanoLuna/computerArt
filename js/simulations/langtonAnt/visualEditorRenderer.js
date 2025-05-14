// visualEditorRenderer.js
import { UI_ELEMENT_IDS, getCellStateColor } from './config.js';
import { updatePropertiesPanel } from './propertiesPanelManager.js';
import { setupEditorEventListeners } from './editorInteractions.js';
import { loadSampleVisualTransitionData } from './transitionManager.js';
import { addVisualState } from './stateManager.js';
import { getVisualStatesData, getVisualTransitionsData, 
    getSelectedStateId, getSelectedTransitionId } from './editorInteractions.js';

let isDrawingArrow = false;
let arrowOriginStateId = null;
let currentMouseForArrow = { x: 0, y: 0 };

let canvas = null;
let ctx = null;
let redrawSimulationGrid = () => {}; // Placeholder for the callback

const STATE_CIRCLE_RADIUS = 20;
const STATE_LABEL_FONT = '12px Arial';
const ARROW_LABEL_FONT = '10px Arial';
const ARROW_COLOR = '#333';
const ARROW_HEAD_SIZE = 8;
const SELECTED_STATE_BORDER_WIDTH = 3;
const SELECTED_STATE_BORDER_COLOR = '#FFD700'; // Gold color for selection

export function initVisualRuleEditor(redrawCallback) {
    canvas = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorCanvas);
    if (!canvas) {
        console.error('Visual Rule Editor canvas not found!');
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get 2D context from Visual Rule Editor canvas!');
        return;
    }
    if(typeof redrawCallback === 'function') {
        redrawSimulationGrid = redrawCallback;
    }

    if (!canvas.width) canvas.width = 300; 
    if (!canvas.height) canvas.height = 150;

    addVisualState(); // Adds state 0
    addVisualState(); // Adds state 1
    loadSampleVisualTransitionData(); // Load sample transitions

    renderVisualEditor(); // Initial render after setup
    
    // Set up event listeners here or in a separate interactions module
    setupEditorEventListeners();
}

function drawArrow(fromX, fromY, toX, toY, label, isLoop = false, transitionId = null, currentSelectedTransitionId = null) {
    const isSelected = transitionId && transitionId === currentSelectedTransitionId;
    ctx.strokeStyle = isSelected ? SELECTED_STATE_BORDER_COLOR : ARROW_COLOR;
    ctx.fillStyle = isSelected ? SELECTED_STATE_BORDER_COLOR : ARROW_COLOR;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    if (isLoop) {
        // Loop arrow drawing code
        const loopRadius = STATE_CIRCLE_RADIUS * 0.8;
        const loopCenterX = fromX;
        const loopCenterY = fromY - STATE_CIRCLE_RADIUS - loopRadius * 0.5;
        ctx.beginPath();
        ctx.arc(loopCenterX, loopCenterY, loopRadius, Math.PI * 0.25, Math.PI * 1.75, false);
        ctx.stroke();
        
        // Loop arrowhead
        const angle = Math.PI * 1.75; 
        const arrowX = loopCenterX + loopRadius * Math.cos(angle);
        const arrowY = loopCenterY + loopRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - ARROW_HEAD_SIZE * Math.cos(angle - Math.PI / 6), arrowY - ARROW_HEAD_SIZE * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - ARROW_HEAD_SIZE * Math.cos(angle + Math.PI / 6), arrowY - ARROW_HEAD_SIZE * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        
        // Loop label
        ctx.fillStyle = isSelected ? SELECTED_STATE_BORDER_COLOR : '#000';
        ctx.font = ARROW_LABEL_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, loopCenterX, loopCenterY - loopRadius - ARROW_HEAD_SIZE - (isSelected ? 2 : 0));
        return;
    }

    // Regular arrow drawing code
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Adjust start and end points to be on circle edges
    const startX = fromX + STATE_CIRCLE_RADIUS * Math.cos(angle);
    const startY = fromY + STATE_CIRCLE_RADIUS * Math.sin(angle);
    const endX = toX - STATE_CIRCLE_RADIUS * Math.cos(angle);
    const endY = toY - STATE_CIRCLE_RADIUS * Math.sin(angle);
    
    // Line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - ARROW_HEAD_SIZE * Math.cos(angle - Math.PI / 6), endY - ARROW_HEAD_SIZE * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - ARROW_HEAD_SIZE * Math.cos(angle + Math.PI / 6), endY - ARROW_HEAD_SIZE * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const labelOffsetX = 10 * Math.sin(angle);
    const labelOffsetY = -10 * Math.cos(angle);
    ctx.font = ARROW_LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX + labelOffsetX, midY + labelOffsetY);
}

export function renderVisualEditor() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const visualStatesData = getVisualStatesData();
    const visualTransitionsData = getVisualTransitionsData();
    const selectedStateId = getSelectedStateId();
    const selectedTransitionId = getSelectedTransitionId();

    // Draw temporary arrow line if currently drawing
    if (isDrawingArrow && arrowOriginStateId !== null) {
        const originState = visualStatesData.find(s => s.id === arrowOriginStateId);
        if (originState) {
            ctx.beginPath();
            ctx.moveTo(originState.x, originState.y);
            ctx.lineTo(currentMouseForArrow.x, currentMouseForArrow.y);
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Draw states
    visualStatesData.forEach(state => {
        ctx.beginPath();
        ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
        ctx.fillStyle = getCellStateColor(state.id);
        ctx.fill();
        
        // Visual cue for selected state
        if (state.id === selectedStateId) {
            ctx.strokeStyle = SELECTED_STATE_BORDER_COLOR;
            ctx.lineWidth = SELECTED_STATE_BORDER_WIDTH;
        } else {
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
        }
        ctx.stroke();

        // State label
        ctx.fillStyle = '#000000';
        ctx.font = STATE_LABEL_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.id.toString(), state.x, state.y);
    });

    // Draw transitions (arrows)
    visualTransitionsData.forEach(trans => {
        const fromState = visualStatesData.find(s => s.id === trans.fromStateId);
        const toState = visualStatesData.find(s => s.id === trans.toStateId);

        if (fromState && toState) {
            const turnSymbol = getTurnSymbol(trans.rule.turn);
            drawArrow(fromState.x, fromState.y, toState.x, toState.y, turnSymbol, 
                      fromState.id === toState.id, trans.id, selectedTransitionId);
        }
    });
    
    updatePropertiesPanel();
}

function getTurnSymbol(turnValue) {
    if (turnValue === 1) return 'R'; // Right
    if (turnValue === -1) return 'L'; // Left
    if (turnValue === 2) return 'U'; // U-turn (180 degrees)
    if (turnValue === 0) return 'N'; // No turn (straight)
    return '?'; // Unknown
}