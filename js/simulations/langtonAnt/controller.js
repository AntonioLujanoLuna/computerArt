// controller.js
import { initializeSimulationControls } from './simulationController.js';
import { initializeCanvasInteractions } from './canvasInteractions.js';
import { initializeUI, updateTextareaWithConfiguration, populateAntSelector } from './uiManager.js';
import { initializeRuleManager } from './ruleManager.js';
import { initializeConfigGenerator } from './configGenerator.js';
import { initializeJsonSyncManager } from './jsonSyncManager.js';
import { initVisualRuleEditor } from './visualEditorRenderer.js';
import { drawSimulation } from './view.js';
import { getDefaultAntConfigs } from './simulationController.js';
import { getDefaultRules } from './rules.js';
import { setRedrawSimulationGridCallback as setRedrawCallbackForPropertiesPanel } from './propertiesPanelManager.js';
import { loadRulesToVisualEditor } from './transitionManager.js';
import { initializeStateManager } from './stateManager.js';

export function initializeControls() {
    // Initialize all controller components
    initializeSimulationControls();
    initializeCanvasInteractions();
    initializeUI();
    initializeRuleManager(); 
    initializeConfigGenerator();
    initializeJsonSyncManager();
    initializeStateManager();
    
    // Share the redrawSimulation callback with all modules that need it
    setRedrawCallbackForPropertiesPanel(drawSimulation);
    
    // Initialize visual editor
    initVisualRuleEditor(drawSimulation);
    
    // Load initial configuration
    const defaultAntConfigs = getDefaultAntConfigs();
    updateTextareaWithConfiguration(defaultAntConfigs);
    populateAntSelector(defaultAntConfigs);
    
    if (defaultAntConfigs.length > 0 && defaultAntConfigs[0].rules) {
      loadRulesToVisualEditor(defaultAntConfigs[0].rules);
    } else {
      loadRulesToVisualEditor(getDefaultRules());
    }
    
    drawSimulation();
  }