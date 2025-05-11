// app.js
async function loadSimulation(name) {
  // Show loading indicator
  const container = document.getElementById('simulation-container');
  container.innerHTML = '<div class="loading">Loading simulation...</div>';
  
  try {
    // Dynamically import the simulation module
    const module = await import(`./simulations/${name}/main.js`);
    const createSimulation = module.default;
    
    // Clean up previous simulation if exists
    if (window.currentSimulation) {
      window.currentSimulation.destroy();
    }
    
    // Clear container and initialize simulation
    container.innerHTML = '';
    const simulation = createSimulation(container);
    
    // Store reference and start
    window.currentSimulation = simulation;
    simulation.start();
    
    return simulation;
  } catch (error) {
    console.error(`Failed to load simulation: ${name}`, error);
    container.innerHTML = `<div class="error">Failed to load ${name}</div>`;
    return null;
  }
}

// TODO: Initialize router and define routes
// Example:
// import router from './router.js';
// router.init({
//   '/': () => { /* show hub view */ },
//   '/langton-ant': () => loadSimulation('langtonAnt'),
//   '/game-of-life': () => loadSimulation('gameOfLife'),
// }); 