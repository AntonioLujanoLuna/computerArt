// app.js
async function loadSimulation(name) {
  const hubView = document.getElementById('hub-view');
  const simContainer = document.getElementById('simulation-container');

  if (hubView) hubView.classList.add('hidden');
  
  if (!simContainer) {
    console.error('simulation-container not found!');
    return null;
  }
  simContainer.classList.remove('hidden');
  simContainer.innerHTML = '<div class="loading">Loading simulation...</div>';
  
  try {
    // Dynamically import the simulation module
    const module = await import(`./simulations/${name}/main.js`);
    const createSimulation = module.default;
    
    // Clean up previous simulation if exists
    if (window.currentSimulation) {
      window.currentSimulation.destroy();
    }
    
    // Clear container and initialize simulation
    simContainer.innerHTML = ''; // Clear loading message
    const simulation = createSimulation(simContainer);
    
    // Store reference and start
    window.currentSimulation = simulation;
    simulation.start();
    
    return simulation;
  } catch (error) {
    console.error(`Failed to load simulation: ${name}`, error);
    simContainer.innerHTML = `<div class="error">Failed to load ${name}</div>`;
    return null;
  }
}

// TODO: Initialize router and define routes
// Example:
import router from './router.js';

function showHubView() {
  const hubView = document.getElementById('hub-view');
  const simContainer = document.getElementById('simulation-container');

  if (hubView) {
    hubView.classList.remove('hidden');
  }
  if (simContainer) {
    simContainer.classList.add('hidden');
    simContainer.innerHTML = ''; // Clear previous simulation content
  }

  if (window.currentSimulation) {
    window.currentSimulation.destroy();
    window.currentSimulation = null;
  }
}

router.init({
  '/': () => showHubView(),
  '/langton-ant': () => loadSimulation('langtonAnt'),
  '/game-of-life': () => loadSimulation('gameOfLife'),
});

// Handle simulation card clicks
document.addEventListener('DOMContentLoaded', () => {
  const simulationCardsContainer = document.querySelector('.simulation-cards');
  if (simulationCardsContainer) {
    simulationCardsContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.simulation-card');
      if (card && card.dataset.sim) {
        const simPath = `/${card.dataset.sim}`;
        router.navigateTo(simPath);
      }
    });
  }
}); 