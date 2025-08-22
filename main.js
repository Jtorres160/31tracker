import { Physics } from './physics.js';
import { SceneManager } from './sceneManager.js';
import { UI } from './ui.js';

class App {
    constructor() {
        this.physics = new Physics();
        this.sceneManager = new SceneManager('scene-container');
        this.ui = new UI();
        this.simulationDate = new Date(); // Start at today's real time
        this.planetNames = ['mercury', 'venus', 'earth', 'mars', 'jupiter'];
    }

    init() {
        this.ui.startClock();
        this.createPastCometTrail();
        this.animate();
    }

    createPastCometTrail() {
        const trailPoints = [];
        const today = new Date();
        const startDate = new Date('2024-01-01');

        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 5)) {
            const pos = this.physics.calculateOrbitalPosition(this.physics.elements.comet, d);
            trailPoints.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }
        this.sceneManager.drawTrail(trailPoints);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.simulationDate = new Date(); // Always track real time

        // Calculate all body positions
        const positions = {};
        this.planetNames.forEach(name => {
            positions[name] = this.physics.calculateOrbitalPosition(this.physics.elements[name], this.simulationDate);
        });
        positions.comet = this.physics.calculateOrbitalPosition(this.physics.elements.comet, this.simulationDate);

        // Update 3D scene and render
        this.sceneManager.updateBodyPositions(positions);
        this.sceneManager.render();

        // Update the UI panel with the new data
        this.ui.update(positions.earth, positions.comet, this.simulationDate, this.physics.elements.comet);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
