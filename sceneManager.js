export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Add Lighting
        const sunLight = new THREE.PointLight(0xffffff, 1.5, 200);
        this.scene.add(sunLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        // Create Celestial Bodies
        this.bodies = {
            sun: new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfbbf24 })),
            mercury: new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8c8c8c })),
            venus: new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshStandardMaterial({ color: 0xd4a06a })),
            earth: new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshStandardMaterial({ color: 0x3b82f6 })),
            mars: new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshStandardMaterial({ color: 0xb94b4b })),
            jupiter: new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), new THREE.MeshStandardMaterial({ color: 0xd8caaf })),
            comet: new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981 })) // Green comet
        };
        for (const body in this.bodies) {
            this.scene.add(this.bodies[body]);
        }

        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    updateBodyPositions(positions) {
        for (const bodyName in positions) {
            if (this.bodies[bodyName]) {
                const pos = positions[bodyName];
                this.bodies[bodyName].position.set(pos.x, pos.y, pos.z);
            }
        }
    }

    drawTrail(points) {
        if (this.trailLine) this.scene.remove(this.trailLine);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x10b981 }); // Green trail
        this.trailLine = new THREE.Line(geometry, material);
        this.scene.add(this.trailLine);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
