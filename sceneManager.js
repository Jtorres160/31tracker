// Relies on the global THREE object loaded in index.html
export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        // Top-down view
        this.camera.position.set(0, 15, 0);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        const sunLight = new THREE.PointLight(0xffa500, 3, 500);
        sunLight.position.set(0, 0, 0);
        this.scene.add(sunLight);
        this.scene.add(new THREE.AmbientLight(0x333333, 0.3));

        // Mouse controls
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.cameraAngle = Math.PI / 2;
        this.cameraHeight = 15;
        this.cameraDistance = 15;

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.cameraAngle += deltaX * 0.01;
                this.cameraHeight = Math.max(5, Math.min(25, this.cameraHeight - deltaY * 0.05));
                
                this.updateCameraPosition();
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance = Math.max(8, Math.min(30, this.cameraDistance + e.deltaY * 0.01));
            this.updateCameraPosition();
        });

        // Create orbit rings
        this.createOrbitRings();

        // Create celestial bodies
        // --- MODIFIED: Removed jupiter and saturn ---
        this.bodies = {
            sun: this.createSun(),
            mercury: this.createPlanet(0.04, 0x8c8c8c),
            venus: this.createPlanet(0.08, 0xd4a06a),
            earth: this.createPlanet(0.085, 0x3b82f6),
            mars: this.createPlanet(0.06, 0xb94b4b),
            comet: this.createComet()
        };
        // --- END OF MODIFICATION ---
        
        for (const body in this.bodies) {
            this.scene.add(this.bodies[body]);
        }

        // Create comet tail
        this.cometTail = null;

        window.addEventListener('resize', () => this.onWindowResize());
    }

    updateCameraPosition() {
        this.camera.position.x = Math.sin(this.cameraAngle) * this.cameraDistance;
        this.camera.position.y = this.cameraHeight;
        this.camera.position.z = Math.cos(this.cameraAngle) * this.cameraDistance;
        this.camera.lookAt(0, 0, 0);
    }

    createSun() {
        const geometry = new THREE.SphereGeometry(0.4, 32, 32); 
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffa500
        });
        const sun = new THREE.Mesh(geometry, material);
        
        const glowGeometry = new THREE.SphereGeometry(0.6, 32, 32); 
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa500,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        sun.add(glow);
        
        return sun;
    }

    createPlanet(size, color) {
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.1
        });
        return new THREE.Mesh(geometry, material);
    }

    createComet() {
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 1.5
        });
        const comet = new THREE.Mesh(geometry, material);
        
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        comet.add(glow);
        
        return comet;
    }

    createOrbitRings() {
        // --- MODIFIED: Removed jupiter and saturn ---
        const orbits = [
            { radius: 1.0, color: 0x444444 }, // Mercury
            { radius: 1.8, color: 0x555555 }, // Venus
            { radius: 2.5, color: 0x4488ff }, // Earth (blue)
            { radius: 3.3, color: 0x666666 }  // Mars
        ];
        // --- END OF MODIFICATION ---

        orbits.forEach(orbit => {
            const geometry = new THREE.RingGeometry(orbit.radius - 0.01, orbit.radius + 0.01, 128);
            const material = new THREE.MeshBasicMaterial({ 
                color: orbit.color, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.4 
            });
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2;
            this.scene.add(ring);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateBodyPositions(positions) {
        for (const bodyName in positions) {
            if (this.bodies[bodyName]) {
                const pos = positions[bodyName];
                if (!isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z)) {
                    this.bodies[bodyName].position.set(pos.x, pos.z, -pos.y);
                }
            }
        }
    }

    updateCometTail(points) {
        if (this.cometTail) {
            this.scene.remove(this.cometTail);
            this.cometTail.geometry.dispose();
            this.cometTail.material.dispose();
        }
        
        if (points.length < 2) return;
        
        const colors = [];
        for (let i = 0; i < points.length; i++) {
            const t = i / points.length;
            const r = 0; 
            const g = Math.floor(255 * (1 - t));
            const b = Math.floor(136 * (1 - t));
            colors.push(r / 255, g / 255, b / 255);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.LineBasicMaterial({ 
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            linewidth: 3
        });
        this.cometTail = new THREE.Line(geometry, material);
        this.scene.add(this.cometTail);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}