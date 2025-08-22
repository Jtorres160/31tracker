export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scale = 150; // Pixels per AU
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    drawCelestialBody(pos, color, size) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(pos.x * this.scale, pos.y * this.scale, size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    render(planetPositions, camera) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        // --- APPLY CAMERA TRANSFORMS ---
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.scale(camera.zoom, camera.zoom);
        this.ctx.translate(camera.offsetX, camera.offsetY);

        // Draw all planetary orbits
        this.drawOrbits(camera);
        
        // Draw all celestial bodies
        this.drawCelestialBody({ x: 0, y: 0 }, '#f59e0b', 12); // Sun (larger)
        this.drawCelestialBody(planetPositions.mercury, '#a9a9a9', 3); // Mercury
        this.drawCelestialBody(planetPositions.venus, '#ffa500', 4); // Venus
        this.drawCelestialBody(planetPositions.earth, '#3b82f6', 6); // Earth
        this.drawCelestialBody(planetPositions.mars, '#ef4444', 4); // Mars
        this.drawCelestialBody(planetPositions.jupiter, '#f59e0b', 8); // Jupiter
        this.drawCelestialBody(planetPositions.saturn, '#fbbf24', 7); // Saturn
        this.drawCelestialBody(planetPositions.uranus, '#22c55e', 6); // Uranus
        this.drawCelestialBody(planetPositions.neptune, '#3b82f6', 6); // Neptune
        this.drawCelestialBody(planetPositions.comet, '#10b981', 5); // Comet
        
        // Draw labels for all bodies
        this.drawLabels(planetPositions, camera);
        
        this.ctx.restore();
    }

    drawOrbits(camera) {
        // Planet orbit colors and sizes
        const orbits = [
            { radius: 0.387, color: 'rgba(169, 169, 169, 0.2)', name: 'Mercury' },
            { radius: 0.723, color: 'rgba(255, 165, 0, 0.2)', name: 'Venus' },
            { radius: 1.0, color: 'rgba(59, 130, 246, 0.3)', name: 'Earth' },
            { radius: 1.524, color: 'rgba(239, 68, 68, 0.2)', name: 'Mars' },
            { radius: 5.203, color: 'rgba(245, 158, 11, 0.2)', name: 'Jupiter' },
            { radius: 9.537, color: 'rgba(251, 191, 36, 0.2)', name: 'Saturn' },
            { radius: 19.191, color: 'rgba(34, 197, 94, 0.2)', name: 'Uranus' },
            { radius: 30.069, color: 'rgba(59, 130, 246, 0.2)', name: 'Neptune' }
        ];

        orbits.forEach(orbit => {
            this.ctx.strokeStyle = orbit.color;
            this.ctx.lineWidth = 1 / camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, orbit.radius * this.scale, 0, 2 * Math.PI);
            this.ctx.stroke();
        });
    }

    drawLabels(planetPositions, camera) {
        // Configure text style
        this.ctx.font = `${Math.max(10, 12 / camera.zoom)}px Arial, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Define labels with positions and colors
        const labels = [
            { pos: { x: 0, y: 0 }, text: 'Sun', color: '#f59e0b', offset: 20 },
            { pos: planetPositions.mercury, text: 'Mercury', color: '#a9a9a9', offset: 8 },
            { pos: planetPositions.venus, text: 'Venus', color: '#ffa500', offset: 8 },
            { pos: planetPositions.earth, text: 'Earth', color: '#3b82f6', offset: 8 },
            { pos: planetPositions.mars, text: 'Mars', color: '#ef4444', offset: 8 },
            { pos: planetPositions.jupiter, text: 'Jupiter', color: '#f59e0b', offset: 12 },
            { pos: planetPositions.saturn, text: 'Saturn', color: '#fbbf24', offset: 12 },
            { pos: planetPositions.uranus, text: 'Uranus', color: '#22c55e', offset: 10 },
            { pos: planetPositions.neptune, text: 'Neptune', color: '#3b82f6', offset: 10 },
            { pos: planetPositions.comet, text: '3I/ATLAS', color: '#10b981', offset: 8 }
        ];

        labels.forEach(label => {
            if (label.pos && !isNaN(label.pos.x) && !isNaN(label.pos.y)) {
                const x = label.pos.x * this.scale;
                const y = label.pos.y * this.scale;
                
                // Only draw labels if they're visible on screen
                if (Math.abs(x) < this.canvas.width / (2 * camera.zoom) && 
                    Math.abs(y) < this.canvas.height / (2 * camera.zoom)) {
                    
                    // Draw text shadow for better readability
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillText(label.text, x, y + label.offset + 1);
                    
                    // Draw main text
                    this.ctx.fillStyle = label.color;
                    this.ctx.fillText(label.text, x, y + label.offset);
                }
            }
        });
    }
}
