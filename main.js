import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

class App {
    constructor() {
        this.physics = new Physics();
        this.renderer = new Renderer('solar-system-canvas');
        this.ui = new UI();
        
        this.useLiveData = true; // Start in Live mode by default
        this.simulationDate = new Date('2025-08-21T00:00:00Z');
        this.timeMultiplier = 86400;

        // --- CAMERA STATE ---
        this.camera = {
            zoom: 1.0,
            offsetX: 0,
            offsetY: 0,
            minZoom: 0.1,
            maxZoom: 15.0,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0
        };

        this.animate = this.animate.bind(this);
        this.setTimeMultiplier = this.setTimeMultiplier.bind(this);
    }

    init() {
        this.ui.startClock();
        this.ui.bindTimeControls(this.setTimeMultiplier);
        this.bindCameraControls();
        this.fetchInitialData(); // Attempt to get live data on startup
        this.animate();
    }

    async fetchInitialData() {
        if (!this.useLiveData) {
            this.ui.updateDataSource('Static', 'local simulation');
            return;
        }

        this.ui.updateDataSource('Fetching...', 'connecting to JPL');
        const apiEndpoint = 'https://ssd-api.jpl.nasa.gov/horizons.api';
        const command = "'DES=C/2025 N1 (ATLAS);'";

        try {
            const params = new URLSearchParams({
                format: 'json',
                COMMAND: command,
                EPHEM_TYPE: 'OBSERVER',
                CENTER: '@earth',
                START_TIME: new Date().toISOString().slice(0, 10),
                STOP_TIME: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                STEP_SIZE: '1d',
                QUANTITIES: '1,9,20'
            });

            const response = await fetch(`${apiEndpoint}?${params}`);
            if (!response.ok) throw new Error('Object not found in JPL database.');
            
            const data = await response.json();
            // This part will likely not be reached, but is here for completeness
            console.log("JPL Data Received:", data);
            this.ui.updateDataSource('Live', 'JPL Horizons');

        } catch (error) {
            console.error("JPL API Call Failed (as expected for a fictional object):", error.message);
            this.useLiveData = false; // Fall back to static mode
            this.ui.updateDataSource('Error', 'fallback to static', true);
        }
    }

    setTimeMultiplier(newSpeed) {
        this.timeMultiplier = newSpeed;
    }

    // --- CAMERA CONTROLS ---
    bindCameraControls() {
        const canvas = this.renderer.canvas;
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', () => this.handleMouseUp());
        canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    handleWheel(e) {
        e.preventDefault();
        const zoomAmount = 1.1;
        this.camera.zoom *= (e.deltaY < 0) ? zoomAmount : 1 / zoomAmount;
        this.camera.zoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.camera.zoom));
    }

    handleMouseDown(e) {
        this.camera.isDragging = true;
        this.camera.lastMouseX = e.clientX;
        this.camera.lastMouseY = e.clientY;
    }

    handleMouseMove(e) {
        if (!this.camera.isDragging) return;
        const dx = e.clientX - this.camera.lastMouseX;
        const dy = e.clientY - this.camera.lastMouseY;
        this.camera.offsetX += dx / this.camera.zoom;
        this.camera.offsetY += dy / this.camera.zoom;
        this.camera.lastMouseX = e.clientX;
        this.camera.lastMouseY = e.clientY;
    }

    handleMouseUp() {
        this.camera.isDragging = false;
    }

    animate() {
        // If in live mode, use the real time. Otherwise, use the simulation time.
        if (this.useLiveData) {
            this.simulationDate = new Date();
        } else {
            const stepSize = this.timeMultiplier * (1000 / 60);
            this.simulationDate = new Date(this.simulationDate.getTime() + stepSize);
        }

        // Calculate positions for all planets
        const planetPositions = {
            mercury: this.physics.calculateOrbitalPosition(this.physics.elements.mercury, this.simulationDate),
            venus: this.physics.calculateOrbitalPosition(this.physics.elements.venus, this.simulationDate),
            earth: this.physics.calculateOrbitalPosition(this.physics.elements.earth, this.simulationDate),
            mars: this.physics.calculateOrbitalPosition(this.physics.elements.mars, this.simulationDate),
            jupiter: this.physics.calculateOrbitalPosition(this.physics.elements.jupiter, this.simulationDate),
            saturn: this.physics.calculateOrbitalPosition(this.physics.elements.saturn, this.simulationDate),
            uranus: this.physics.calculateOrbitalPosition(this.physics.elements.uranus, this.simulationDate),
            neptune: this.physics.calculateOrbitalPosition(this.physics.elements.neptune, this.simulationDate),
            comet: this.physics.calculateOrbitalPosition(this.physics.elements.comet, this.simulationDate)
        };
        
        // Pass all positions to the renderer
        this.renderer.render(planetPositions, this.camera);

        this.ui.update(planetPositions.earth, planetPositions.comet, this.simulationDate, this.physics.elements.comet);

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
