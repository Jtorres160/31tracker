// Import classes (they will use the global THREE object from index.html)
import { Physics } from './physics.js';
import { SceneManager } from './sceneManager.js';
import { UI } from './ui.js';

// --- Starfield Generator ---
const starfield = document.getElementById('starfield');
if (starfield) {
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starfield.appendChild(star);
    }
}

// --- Main App Class ---
class App {
    constructor() {
        this.physics = new Physics();
        this.sceneManager = new SceneManager('scene-container');
        this.ui = new UI();
        this.simulationDate = new Date();
        // --- MODIFIED: Removed jupiter and saturn ---
        this.planetNames = ['mercury', 'venus', 'earth', 'mars'];
        // --- END OF MODIFICATION ---
    }

    init() {
        this.ui.startClock();
        this.createCometPath(); 
        this.animate();
    }

    createCometPath() {
        const now = new Date();
        const startDate = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000)); // 6 months ago
        const endDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year in future
        
        const trailPoints = []; 
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 2)) {
            const pos = this.physics.calculateOrbitalPosition(this.physics.elements.comet, d);
            if (!isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z) && 
                isFinite(pos.x) && isFinite(pos.y) && isFinite(pos.z)) {
                
                trailPoints.push(new THREE.Vector3(pos.x, pos.z, -pos.y));
            }
        }
        
        console.log('Static comet path created with', trailPoints.length, 'points');
        
        this.sceneManager.updateCometTail(trailPoints);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.simulationDate = new Date();

        const positions = {};
        this.planetNames.forEach(name => {
            positions[name] = this.physics.calculateOrbitalPosition(this.physics.elements[name], this.simulationDate);
        });
        positions.comet = this.physics.calculateOrbitalPosition(this.physics.elements.comet, this.simulationDate);

        this.sceneManager.updateBodyPositions(positions);
        this.sceneManager.render();

        this.ui.update(positions.earth, positions.comet, this.simulationDate, this.physics.elements.comet);
    }
}

// --- Start the app ---
if (typeof THREE !== 'undefined') {
    const app = new App();
    app.init();
} else {
    console.error('THREE.js not loaded!');
}