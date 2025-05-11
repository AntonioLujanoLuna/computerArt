// router.js
export default {
  routes: {},
  currentPath: window.location.pathname,
  
  init(routes) {
    this.routes = routes;
    
    // Handle navigation events
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname);
    });
    
    // Intercept link clicks for SPA navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('a.nav-link')) {
        e.preventDefault();
        const path = e.target.getAttribute('href');
        this.navigateTo(path);
      }
    });
    
    // Initial navigation
    this.navigate(this.currentPath);
  },
  
  navigateTo(path) {
    // Update browser history
    history.pushState({}, '', path);
    this.navigate(path);
  },
  
  navigate(path) {
    this.currentPath = path;
    
    // Find matching route or use default
    const routeHandler = this.routes[path] || this.routes['/']; // Renamed 'route' to 'routeHandler' to avoid conflict
    
    // Call route handler
    if (routeHandler) {
      routeHandler();
    } else {
      console.warn(`No route found for path: ${path}`);
      // Optionally, navigate to a default/404 page
      // const notFoundHandler = this.routes['/404'] || this.routes['/'];
      // if (notFoundHandler) notFoundHandler();
    }
  }
}; 