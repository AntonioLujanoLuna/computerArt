// editorInteractions.js
import { UI_ELEMENT_IDS } from './config.js';
import { renderVisualEditor } from './visualEditorRenderer.js';

// State data for the visual editor
let visualStatesData = [];
let visualTransitionsData = [];
let selectedStateId = null;
let isDraggingState = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDrawingArrow = false;
let arrowOriginStateId = null;
let currentMouseForArrow = { x: 0, y: 0 };
let pendingTransition = null;
let selectedTransitionId = null;
const ARROW_CLICK_TOLERANCE = 8;

// Getter/setter methods for module state
export function getVisualStatesData() {
    return visualStatesData;
}

export function setVisualStatesData(newStates) {
    visualStatesData = newStates;
}

export function getVisualTransitionsData() {
    return visualTransitionsData;
}

export function setVisualTransitionsData(newTransitions) {
    visualTransitionsData = newTransitions;
}

export function getSelectedStateId() {
    return selectedStateId;
}

export function setSelectedStateId(id) {
    selectedStateId = id;
}

export function getSelectedTransitionId() {
    return selectedTransitionId;
}

export function setSelectedTransitionId(id) {
    selectedTransitionId = id;
}

export function getPendingTransition() {
    return pendingTransition;
}

export function setPendingTransition(transition) {
    pendingTransition = transition;
}

// Mouse event handlers
export function handleMouseDown(event) {
    const canvas = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorCanvas);
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let clickedOnState = false;
    selectedStateId = null;
    selectedTransitionId = null;

    for (let i = visualStatesData.length - 1; i >= 0; i--) { 
        const state = visualStatesData[i];
        const distance = Math.sqrt((mouseX - state.x)**2 + (mouseY - state.y)**2);
        if (distance < state.radius) {
            selectedStateId = state.id;
            if (event.altKey) {
                isDrawingArrow = true;
                isDraggingState = false; 
                arrowOriginStateId = state.id;
                currentMouseForArrow = { x: mouseX, y: mouseY }; 
            } else { 
                isDrawingArrow = false;
                isDraggingState = true;
                dragOffsetX = mouseX - state.x;
                dragOffsetY = mouseY - state.y;
            }
            clickedOnState = true;
            pendingTransition = null;
            break;
        }
    }

    if (!clickedOnState) {
        // Check for arrow clicks
        for (const trans of visualTransitionsData) {
            if (isPointOnArrow(mouseX, mouseY, trans)) {
                selectedTransitionId = trans.id;
                console.log("Selected transition:", selectedTransitionId);
                selectedStateId = null;
                isDrawingArrow = false;
                isDraggingState = false;
                pendingTransition = null;
                break; 
            }
        }
    }
    
    if (!clickedOnState && !selectedTransitionId && !isDrawingArrow) {
        pendingTransition = null;
    }

    renderVisualEditor();
}

export function handleMouseMove(event) {
    const canvas = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorCanvas);
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (isDrawingArrow) {
        currentMouseForArrow = { x: mouseX, y: mouseY };
        renderVisualEditor();
    } else if (isDraggingState && selectedStateId !== null) {
        const state = visualStatesData.find(s => s.id === selectedStateId);
        if (state) {
            state.x = mouseX - dragOffsetX;
            state.y = mouseY - dragOffsetY;
            renderVisualEditor();
        }
    }
}

export function handleMouseUp(event) {
    const canvas = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorCanvas);
    if (!canvas || !isDrawingArrow) {
        isDraggingState = false;
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseUpX = event.clientX - rect.left;
    const mouseUpY = event.clientY - rect.top;
    let targetState = null;

    for (const state of visualStatesData) {
        const distance = Math.sqrt((mouseUpX - state.x)**2 + (mouseUpY - state.y)**2);
        // Ensure target is a different state and mouse is over it
        if (state.id !== arrowOriginStateId && distance < state.radius) {
            targetState = state;
            break;
        }
    }

    if (targetState) {
        console.log(`Arrow drag ended. From: ${arrowOriginStateId}, To: ${targetState.id}. Pending user input.`);
        pendingTransition = { fromStateId: arrowOriginStateId, toStateId: targetState.id };
        selectedStateId = null;
    } else {
        console.log("Arrow drawn to empty space or same state, no transition pending.");
        pendingTransition = null;
    }
    
    isDrawingArrow = false;
    arrowOriginStateId = null;
    renderVisualEditor();
}

export function handleMouseLeave() {
    isDraggingState = false;
}

// Helper function for detecting clicks on arrows
function isPointOnArrow(px, py, arrow) {
    const fromState = visualStatesData.find(s => s.id === arrow.fromStateId);
    const toState = visualStatesData.find(s => s.id === arrow.toStateId);
    if (!fromState || !toState) return false;

    if (arrow.fromStateId === arrow.toStateId) { // Loop arrow
        const loopRadius = fromState.radius * 0.8;
        const loopCenterX = fromState.x;
        const loopCenterY = fromState.y - fromState.radius - loopRadius * 0.5;
        // Check distance from click to the circumference of the loop arc
        const distToLoopCenter = Math.sqrt((px - loopCenterX)**2 + (py - loopCenterY)**2);
        return Math.abs(distToLoopCenter - loopRadius) < ARROW_CLICK_TOLERANCE;
    }

    // For straight arrows, calculate distances
    const angle = Math.atan2(toState.y - fromState.y, toState.x - fromState.x);
    const startX = fromState.x + fromState.radius * Math.cos(angle);
    const startY = fromState.y + fromState.radius * Math.sin(angle);
    const endX = toState.x - toState.radius * Math.cos(angle);
    const endY = toState.y - toState.radius * Math.sin(angle);

    return isPointOnLineSegment(px, py, startX, startY, endX, endY, ARROW_CLICK_TOLERANCE);
}

function isPointOnLineSegment(px, py, x1, y1, x2, y2, tolerance) {
    const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (lenSq === 0) { // Line is a point
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2) < tolerance;
    }
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lenSq;
    t = Math.max(0, Math.min(1, t)); // Clamp t to the segment
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
    return distSq < tolerance ** 2;
}

export function setupEditorEventListeners() {
    const canvas = document.getElementById(UI_ELEMENT_IDS.visualRuleEditorCanvas);
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
}