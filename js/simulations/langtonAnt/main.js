// js/simulations/langtonAnt/main.js
import { initializeModel } from './model.js';
import { initializeView } from './view.js';
import { initializeControls } from './controller.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeModel();
    initializeView();
    initializeControls();
});