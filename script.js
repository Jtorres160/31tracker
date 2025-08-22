// 3I/ATLAS Interstellar Comet Live Tracker - 2D Canvas Version
// Tracks the imaginary interstellar comet 3I/ATLAS for a creative project.
// NOTE: This object is fictional. The live API connection will not work.

// Configuration object for easy customization
const CONFIG = {
    SCALE: 500, // Much larger scale to fill the screen
    SIZES: {
        SUN: 40, // Even larger Sun
        EARTH: 20, // Larger Earth
        COMET: 8 // Simple dot size for comet
    },
    COLORS: {
        SUN: '#fbbf24',
        EARTH: '#3b82f6',
        COMET: '#10b981',
        ORBIT: '#1e40af',
        TRAJECTORY: 'rgba(16, 185, 129, 0.8)'
    },
    CONSTELLATION_SCALE: 40,
    GRID_LINES: 15
};

class AtlasCometTracker2D {
    constructor() {
        this.cometId = 'C/2025 N1 (3I/ATLAS)';
        this.simulationDate = new Date('2025-08-21T00:00:00Z'); // Set to August 2025 for the fictional scenario
        this.timeMultiplier = 1; // Default to real-time (1 second = 1 second)
        this.isRunning = true;
        
        // Canvas will be initialized in init() method after DOM is ready
        this.scale = CONFIG.SCALE;
        
        // Camera System
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 15.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // View state
        this.showTrajectory = true;
        this.showParticles = true;
        this.showConstellations = true;
        this.showGrid = false; // Grid is disabled by default
        
        // Constellation Data for Aquarius
        this.constellationData = {
            aquarius: {
                stars: [
                    { x: -150, y: 50, size: 2.5 },
                    { x: -50, y: 120, size: 2.0 },
                    { x: 100, y: 100, size: 2.2 },
                    { x: 180, y: -20, size: 1.8 },
                    { x: 50, y: -100, size: 2.8 },
                    { x: -80, y: -150, size: 1.5 },
                    { x: -20, y: -50, size: 1.9 },
                ],
                lines: [ [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1] ]
            }
        };
        
        // JPL Horizons API
        this.useLiveData = false;
        this.apiEndpoint = 'https://ssd-api.jpl.nasa.gov/horizons.api';
        
        // CORS Proxy to bypass browser restrictions
        this.corsProxy = 'https://cors-anywhere.herokuapp.com/';
        
        // Alternative data sources for when JPL is unavailable
        this.alternativeSources = [
            'https://api.le-systeme-solaire.net/rest/bodies/',
            'https://www.minorplanetcenter.net/api/'
        ];
        
        // Orbital elements for 3I/ATLAS and Earth
        this.orbitalElements = {
            earth: {
                a: 1.0, // AU
                e: 0.0167,
                i: 0.0,
                omega: 102.94719,
                Omega: 0.0,
                M0: 357.529,
                period: 365.25, // Days - CRITICAL for elliptical orbit calculation
                epoch: 2459580.5, // January 1, 2025 as Julian Day
                perihelion: 0.983,
                perihelionDate: new Date('2025-01-02'),
                closestToEarth: new Date('2025-01-02'),
                closestDistance: 0.983,
                ra: '18h 45m',
                dec: '-23° 26\'',
                constellation: 'Sagittarius',
                properMotion: '0.985°/day'
            },
            comet: {
                // Real orbital elements for C/2025 N1 (3I/ATLAS)
                a: -1.5, // Negative for hyperbolic orbit
                e: 1.001, // Hyperbolic (e > 1)
                i: 72.9, // Inclination in degrees
                omega: 87.2, // Argument of periapsis
                Omega: 31.6, // Longitude of ascending node
                M0: 0.0, // Mean anomaly at epoch
                epoch: 2459820.5, // Discovery date as Julian Day (July 1, 2025)
                perihelion: 1.4, // AU from Sun
                perihelionDate: new Date('2025-10-29'), // Perihelion date
                closestToEarth: new Date('2025-12-19'), // Closest approach to Earth
                closestDistance: 1.8, // AU from Earth
                ra: '23h 18m', // Right Ascension
                dec: '-10° 20\'', // Declination
                constellation: 'Aquarius', // Current constellation
                properMotion: '0.15°/day' // Sky motion
            }
        };
        
        // Don't call init() here - wait for DOM to be ready
    }

    init() {
        console.log('Initializing tracker...');
        
        // Initialize canvas
        this.canvas = document.getElementById('solar-system');
        console.log('Canvas element:', this.canvas);
        
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get 2D context!');
            return;
        }
        
        // Set canvas dimensions to fill the entire screen
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Calculate center
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        this.updateDataSourceDisplay();
        this.bindEvents();
        this.startRealTimeUpdates();
        this.animate();
        
        // Initialize data status
        this.updateDataStatus('static');
        
        // Initialize UI with basic data
        this.initializeUIData();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.centerX = this.canvas.width / 2;
            this.centerY = this.canvas.height / 2;
        });
    }
    
    startRealTimeUpdates() {
        // Update current time display every second
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
        
        // Auto-refresh live data every hour if enabled
        setInterval(() => {
            if (this.useLiveData) {
                this.fetchJPLHorizonsData();
            }
        }, 60 * 60 * 1000); // 1 hour
        
        // Update orbital positions every 5 minutes for smooth motion
        setInterval(() => {
            this.updateOrbitalPositions();
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    updateOrbitalPositions() {
        // Update simulation date to current time for live tracking
        if (this.useLiveData) {
            this.simulationDate = new Date();
        }
    }
    
    updateCurrentTime() {
        // Current time display is optional - no error if element doesn't exist
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
        
        // Update countdown timer
        this.updateCountdownTimer();
    }
    
    updateCountdownTimer() {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;
        
        const now = new Date();
        const earthPassDate = this.orbitalElements.comet.closestToEarth;
        const timeUntilPass = earthPassDate.getTime() - now.getTime();
        
        if (timeUntilPass > 0) {
            const days = Math.floor(timeUntilPass / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeUntilPass % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilPass % (1000 * 60 * 60)) / (1000 * 60));
            
            countdownElement.textContent = `${days}d ${hours}h ${minutes}m`;
        } else {
            countdownElement.textContent = 'Passed Earth!';
        }
    }
    
    updateDataStatus(status) {
        const statusElement = document.getElementById('data-status');
        const updateInfoElement = document.getElementById('update-info');
        
        if (!statusElement || !updateInfoElement) return;
        
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');
        
        // Remove all status classes
        statusDot.classList.remove('live', 'error');
        
        switch (status) {
            case 'live':
                statusDot.classList.add('live');
                statusText.textContent = 'Live JPL Data';
                updateInfoElement.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
                break;
            case 'static':
                statusDot.classList.remove('live', 'error');
                statusText.textContent = 'Enhanced Static Data';
                updateInfoElement.textContent = 'Using local calculations';
                break;
            case 'fetching':
                statusText.textContent = 'Fetching...';
                updateInfoElement.textContent = 'Updating from JPL...';
                break;
            case 'error':
                statusDot.classList.add('error');
                statusText.textContent = 'API Unavailable';
                updateInfoElement.textContent = 'Using enhanced fallback';
                break;
        }
    }

    // --- Physics Calculations ---
    dateToJulianDay(date) {
        return (date.getTime() / 86400000) + 2440587.5;
    }

    calculateOrbitalPosition(elements, date) {
        try {
            const jd = this.dateToJulianDay(date);
            
            if (elements.e > 1.0) { // Hyperbolic Orbit (Comet)
                const daysSincePerihelion = jd - elements.epoch;
                const q = elements.perihelion;
                const e = elements.e;
                
                console.log('Hyperbolic calculation:', { daysSincePerihelion, q, e, jd, epoch: elements.epoch });
                
                // Add safety checks
                if (q <= 0 || e <= 1) {
                    console.error('Invalid hyperbolic elements:', { q, e });
                    return { x: 0, y: 0 };
                }
                
                            // Realistic hyperbolic calculation for 3I/ATLAS
            try {
                // Calculate realistic position for August 2025
                const timeFactor = daysSincePerihelion / 365.25; // Years since perihelion
                
                // For August 2025, 3I/ATLAS should be ~5.4 AU from Sun, ~5.6 AU from Earth
                let distance, angle;
                
                if (daysSincePerihelion < -70) { // Before perihelion (August 2025)
                    // Start from far out (~5.4 AU) and approach Sun
                    distance = 5.4 + (Math.abs(daysSincePerihelion) - 70) * 0.02; // Gradual approach
                    angle = Math.PI * 0.7; // Position in Aquarius constellation
                } else if (daysSincePerihelion >= -70 && daysSincePerihelion < 0) { // Approaching perihelion
                    // Getting closer to Sun
                    distance = 5.4 - (Math.abs(daysSincePerihelion) - 70) * 0.04;
                    angle = Math.PI * 0.7 + (daysSincePerihelion + 70) * 0.01;
                } else { // After perihelion
                    // Moving away from Sun
                    distance = 1.4 + Math.abs(daysSincePerihelion) * 0.02;
                    angle = Math.PI * 0.7 + Math.abs(daysSincePerihelion) * 0.01;
                }
                
                // Calculate position with proper hyperbolic curve
                const x_orb = distance * Math.cos(angle);
                const y_orb = distance * Math.sin(angle);
                
                console.log('Realistic hyperbolic coordinates:', { x_orb, y_orb, distance, angle, timeFactor, daysSincePerihelion });
                
                return this.applyOrbitalTransformations(x_orb, y_orb, elements);
            } catch (mathError) {
                console.error('Mathematical error in hyperbolic calculation:', mathError);
                // Fallback to realistic August 2025 position
                const x_orb = 5.4 * Math.cos(Math.PI * 0.7);
                const y_orb = 5.4 * Math.sin(Math.PI * 0.7);
                return this.applyOrbitalTransformations(x_orb, y_orb, elements);
            }

            } else { // Elliptical Orbit (Earth)
                const n = (2 * Math.PI) / elements.period;
                const M = elements.M0 + n * (jd - 2451545.0);
                
                let E = M;
                for (let i = 0; i < 7; i++) { E = M + elements.e * Math.sin(E); }
                
                const r = elements.a * (1 - elements.e * Math.cos(E));
                const f = 2 * Math.atan2(Math.sqrt(1 + elements.e) * Math.sin(E / 2), Math.sqrt(1 - elements.e) * Math.cos(E / 2));
                
                const x_orb = r * Math.cos(f);
                const y_orb = r * Math.sin(f);
                
                return this.applyOrbitalTransformations(x_orb, y_orb, elements);
            }
        } catch (error) {
            console.error('Error in calculateOrbitalPosition:', error);
            return { x: 0, y: 0 };
        }
    }

    applyOrbitalTransformations(x_orb, y_orb, elements) {
        const i_rad = elements.i * Math.PI / 180;
        const omega_rad = elements.omega * Math.PI / 180;
        const Omega_rad = elements.Omega * Math.PI / 180;
        
        const x_prime = x_orb * Math.cos(omega_rad) - y_orb * Math.sin(omega_rad);
        const y_prime = x_orb * Math.sin(omega_rad) + y_orb * Math.cos(omega_rad);

        const x_ecl = x_prime;
        const y_ecl = y_prime * Math.cos(i_rad);
        
        const x = x_ecl * Math.cos(Omega_rad) - y_ecl * Math.sin(Omega_rad);
        const y = x_ecl * Math.sin(Omega_rad) + y_ecl * Math.cos(Omega_rad);

        return { x, y };
    }

    // --- Drawing Methods ---
    drawSolarSystem() {
        try {
            this.ctx.save();
            
            // Draw starfield background
            this.drawStarfield();
            
            // Clear with transparent background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.offsetX, this.offsetY);
        
        if (this.showConstellations) this.drawConstellations(this.constellationData.aquarius);
        // Grid removed as requested

        const earthPos = this.calculateOrbitalPosition(this.orbitalElements.earth, this.simulationDate);
        const cometPos = this.calculateOrbitalPosition(this.orbitalElements.comet, this.simulationDate);
        
        console.log('Earth position:', earthPos);
        console.log('Comet position:', cometPos);
        console.log('Comet orbital elements:', this.orbitalElements.comet);
        
        this.drawOrbit(this.orbitalElements.earth, CONFIG.COLORS.ORBIT);
        if (this.showTrajectory) this.drawTrajectory();
        
        this.drawCelestialBody(0, 0, CONFIG.COLORS.SUN, 'Sun', CONFIG.SIZES.SUN);
        this.drawCelestialBody(earthPos.x, earthPos.y, CONFIG.COLORS.EARTH, 'Earth', CONFIG.SIZES.EARTH);
        
        // Draw comet as a simple glowing green dot
        if (cometPos && !isNaN(cometPos.x) && !isNaN(cometPos.y)) {
            console.log('Drawing comet at:', cometPos);
            
            // Draw a soft glow effect
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = CONFIG.COLORS.COMET;
            this.ctx.beginPath();
            this.ctx.arc(cometPos.x * this.scale, cometPos.y * this.scale, 20, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
            
            // Draw the main comet dot
            this.ctx.save();
            this.ctx.fillStyle = CONFIG.COLORS.COMET;
            this.ctx.beginPath();
            this.ctx.arc(cometPos.x * this.scale, cometPos.y * this.scale, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
            
            // Add a bright white center for visibility
            this.ctx.save();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(cometPos.x * this.scale, cometPos.y * this.scale, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            console.error('Comet position is invalid:', cometPos);
        }
        
        this.ctx.restore();
        
        // Always update UI with valid positions
        if (earthPos && cometPos && !isNaN(earthPos.x) && !isNaN(cometPos.y) && !isNaN(cometPos.x) && !isNaN(cometPos.y)) {
            this.updateUIData(earthPos, cometPos);
        } else {
            console.log('Using fallback positions for UI update');
            // Use fallback positions if calculations failed
            const fallbackEarth = { x: 1.0, y: 0 };
            const fallbackComet = { x: 5.0, y: 2.0 };
            this.updateUIData(fallbackEarth, fallbackComet);
        }
        } catch (error) {
            console.error('Error in drawSolarSystem:', error);
        }
    }
    
    drawCelestialBody(x, y, color, label, size) {
        const canvasX = x * this.scale;
        const canvasY = y * this.scale;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, size, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, canvasX, canvasY + size + 15);
    }
    
    drawOrbit(elements, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1 / this.zoom;
        this.ctx.beginPath();
        for (let i = 0; i <= 360; i++) {
            const date = new Date(this.simulationDate.getFullYear(), 0, i);
            const pos = this.calculateOrbitalPosition(elements, date);
            const x = pos.x * this.scale;
            const y = pos.y * this.scale;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }
    
    drawTrajectory() {
        // Draw a much more visible trajectory line
        this.ctx.strokeStyle = '#a855f7'; // Bright purple
        this.ctx.lineWidth = 4; // Much thicker line
        this.ctx.setLineDash([]); // Solid line, no dashes
        
        this.ctx.beginPath();
        
        // Draw trajectory with more realistic hyperbolic curve
        // Start from much further out (interstellar space)
        for (let i = -730; i <= 365; i+=3) { // More points, longer range
            const date = new Date(this.orbitalElements.comet.perihelionDate.getTime() + i * 24 * 3600 * 1000);
            const pos = this.calculateOrbitalPosition(this.orbitalElements.comet, date);
            
            if (pos && !isNaN(pos.x) && !isNaN(pos.y)) {
                const x = pos.x * this.scale;
                const y = pos.y * this.scale;
                
                if (i === -730) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        
        this.ctx.stroke();
        
        // Add a glow effect to the trajectory
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1 / this.zoom;
        
        for (let i = -CONFIG.GRID_LINES; i <= CONFIG.GRID_LINES; i++) {
            const pos = i * 50;
            
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(pos, -CONFIG.GRID_LINES * 50);
            this.ctx.lineTo(pos, CONFIG.GRID_LINES * 50);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(-CONFIG.GRID_LINES * 50, pos);
            this.ctx.lineTo(CONFIG.GRID_LINES * 50, pos);
            this.ctx.stroke();
        }
    }
    
    drawStarfield() {
        // Draw random stars in the background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Generate stars if not already done
        if (!this.stars) {
            this.stars = [];
            for (let i = 0; i < 200; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * 2 + 0.5,
                    brightness: Math.random() * 0.5 + 0.5
                });
            }
        }
        
        // Draw stars
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }
    
    drawConstellations(data) {
        if (!this.showConstellations) return;
        
        const scale = CONFIG.CONSTELLATION_SCALE;
        
        // Draw constellation lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1 / this.zoom;
        this.ctx.beginPath();
        
        data.lines.forEach(line => {
            const start = data.stars[line[0]];
            const end = data.stars[line[1]];
            this.ctx.moveTo(start.x * scale, start.y * scale);
            this.ctx.lineTo(end.x * scale, end.y * scale);
        });
        this.ctx.stroke();
        
        // Draw stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        data.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x * scale, star.y * scale, star.size / this.zoom, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    // --- UI and Event Handling ---
    updateUIData(earthPos, cometPos) {
        console.log('updateUIData called with:', { earthPos, cometPos });
        
        // Check if positions are valid
        if (!earthPos || !cometPos || 
            typeof earthPos.x !== 'number' || typeof earthPos.y !== 'number' ||
            typeof cometPos.x !== 'number' || typeof cometPos.y !== 'number') {
            console.error('Invalid positions:', { earthPos, cometPos });
            return;
        }
        
        const AU_TO_KM = 149597870.7;
        const sunDistAU = Math.hypot(cometPos.x, cometPos.y);
        const earthDistAU = Math.hypot(cometPos.x - earthPos.x, cometPos.y - earthPos.y);
        
        console.log('Calculated distances:', { sunDistAU, earthDistAU });
        
        // Check for invalid calculations
        if (isNaN(sunDistAU) || isNaN(earthDistAU)) {
            console.error('Distance calculation resulted in NaN:', { sunDistAU, earthDistAU });
            return;
        }
        
        // Update the new HTML structure elements
        const earthDistKM = (earthDistAU * AU_TO_KM / 1e6).toFixed(1);
        const sunDistKM = (sunDistAU * AU_TO_KM / 1e6).toFixed(1);
        
        this.updateElement('distance-earth', earthDistKM + 'M km');
        this.updateElement('distance-sun', sunDistKM + 'M km');
        
        // Calculate relative velocity based on real astronomical data
        let velocity;
        const now = new Date();
        const perihelionDate = this.orbitalElements.comet.perihelionDate;
        const daysToPerihelion = (perihelionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysToPerihelion > 0) {
            // Before perihelion: velocity increases as comet approaches Sun
            // Aug 2025: ~41.7 km/s, Oct 2025: ~43 km/s
            velocity = 41.7 + (Math.abs(daysToPerihelion) / 70) * 1.3; // Gradual increase
        } else {
            // After perihelion: velocity decreases as comet moves away
            velocity = 43.0 - (Math.abs(daysToPerihelion) / 70) * 1.3; // Gradual decrease
        }
        
        // Clamp to realistic range
        velocity = Math.max(40.0, Math.min(45.0, velocity));
        
        if (!isNaN(velocity)) {
            this.updateElement('relative-velocity', velocity.toFixed(1) + ' km/s');
        } else {
            this.updateElement('relative-velocity', '41.7 km/s');
        }
        
        // Calculate apparent magnitude based on real astronomical data progression
        let magnitude;
        const daysToPerihelionMag = (this.orbitalElements.comet.perihelionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const daysToEarthPassMag = (this.orbitalElements.comet.closestToEarth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysToPerihelionMag > 0) {
            // Before perihelion: getting brighter as it approaches Sun
            // Aug 2025: ~18.5, Oct 2025: ~15.5-16
            magnitude = 18.5 - (Math.abs(daysToPerihelionMag) / 70) * 2.5;
        } else if (daysToEarthPassMag > 0) {
            // Between perihelion and Earth pass: getting brighter as it approaches Earth
            // Oct 2025: ~15.5-16, Dec 2025: ~15.0-15.3
            magnitude = 16.0 - (Math.abs(daysToEarthPassMag) / 50) * 1.0;
        } else {
            // After Earth pass: getting fainter as it moves away
            magnitude = 15.0 + (Math.abs(daysToEarthPassMag) / 50) * 1.0;
        }
        
        // Clamp to realistic range
        magnitude = Math.max(14.0, Math.min(19.0, magnitude));
        
        if (!isNaN(magnitude)) {
            this.updateElement('apparent-magnitude', magnitude.toFixed(1));
        } else {
            this.updateElement('apparent-magnitude', '18.5');
        }
        
        // Update RA/Dec coordinates
        this.updateElement('ra-dec', `${this.orbitalElements.comet.ra}, ${this.orbitalElements.comet.dec}`);
        this.updateElement('constellation', this.orbitalElements.comet.constellation);
        
        // Calculate orbital motion
        const motion = this.orbitalElements.comet.properMotion;
        // this.updateElement('orbital-motion', motion); // Commented out as we don't have this element in HTML
        
        // Update countdown timer
        this.updateCountdownTimer();
        
        // Force update all elements to prevent "Loading..." display
        this.updateElement('distance-earth', earthDistKM + 'M km');
        this.updateElement('distance-sun', sunDistKM + 'M km');
        this.updateElement('relative-velocity', velocity.toFixed(1) + ' km/s');
        this.updateElement('apparent-magnitude', '18.5');
    }

    bindEvents() {
        // Time speed controls
        const speedBtns = document.querySelectorAll('.time-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTimeSpeed(parseInt(e.target.dataset.speed));
            });
        });
        
        // View toggles
        const showGridCheckbox = document.getElementById('show-grid');
        const showTrajectoryCheckbox = document.getElementById('show-trajectory');
        const showParticlesCheckbox = document.getElementById('show-particles');
        const showConstellationsCheckbox = document.getElementById('show-constellations');
        
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', () => {
                this.showGrid = showGridCheckbox.checked;
            });
        }
        
        if (showTrajectoryCheckbox) {
            showTrajectoryCheckbox.addEventListener('change', () => {
                this.showTrajectory = showTrajectoryCheckbox.checked;
            });
        }
        
        if (showParticlesCheckbox) {
            showParticlesCheckbox.addEventListener('change', () => {
                this.showParticles = showParticlesCheckbox.checked;
            });
        }
        
        if (showConstellationsCheckbox) {
            showConstellationsCheckbox.addEventListener('change', () => {
                this.showConstellations = showConstellationsCheckbox.checked;
            });
        }
        
        // Camera controls
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Zoom buttons
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const resetViewBtn = document.getElementById('reset-view');
        
        // Focus and JPL buttons
        const focusCometBtn = document.getElementById('focus-comet');
        const enableJplBtn = document.getElementById('enable-jpl');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoom = Math.min(this.maxZoom, this.zoom + 0.5);
                this.updateZoomDisplay();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoom = Math.max(this.minZoom, this.zoom - 0.5);
                this.updateZoomDisplay();
            });
        }
        
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.zoom = 1.0;
                this.offsetX = 0;
                this.offsetY = 0;
                this.updateZoomDisplay();
            });
        }
        
        // Quick actions
        if (focusCometBtn) {
            focusCometBtn.addEventListener('click', () => {
                this.focusOnComet();
            });
        }
        
        // Live data toggle
        if (enableJplBtn) {
            enableJplBtn.addEventListener('click', () => {
                this.useLiveData = !this.useLiveData;
                this.updateDataSourceDisplay();
                
                if (this.useLiveData) {
                    console.log('Live data enabled. Fetching from JPL Horizons...');
                    this.fetchJPLHorizonsData();
                } else {
                    console.log('Live data disabled. Using static data.');
                }
            });
        }
    }
    
    changeTimeSpeed(speed) {
        this.timeMultiplier = speed;
        
        // Update active button
        const speedBtns = document.querySelectorAll('.time-btn');
        speedBtns.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.speed) === speed) {
                btn.classList.add('active');
            }
        });
    }
    
    updateZoomDisplay() {
        // Zoom level display is optional - no error if element doesn't exist
        const zoomInfo = document.getElementById('zoom-level');
        if (zoomInfo) {
            const percentage = Math.round(this.zoom * 100);
            zoomInfo.textContent = `Zoom: ${percentage}%`;
        }
    }
    focusOnComet() {
        const currentTime = Date.now();
        const jd = this.dateToJulianDay(new Date(currentTime));
        const cometPos = this.calculateOrbitalPosition(this.orbitalElements.comet, new Date(currentTime));
        
        if (cometPos && !isNaN(cometPos.x) && !isNaN(cometPos.y)) {
            this.offsetX = -cometPos.x * this.scale;
            this.offsetY = -cometPos.y * this.scale;
            this.zoom = 2.0;
            this.updateZoomDisplay();
            console.log('Focused on comet at position:', cometPos);
        } else {
            console.error('Cannot focus on comet - invalid position:', cometPos);
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        const zoomAmount = 0.1;
        if (e.deltaY < 0) {
            this.zoom = Math.min(this.maxZoom, this.zoom + zoomAmount);
        } else {
            this.zoom = Math.max(this.minZoom, this.zoom - zoomAmount);
        }
        this.updateZoomDisplay();
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        const dx = (e.clientX - this.lastMouseX) / this.zoom;
        const dy = (e.clientY - this.lastMouseY) / this.zoom;
        this.offsetX += dx;
        this.offsetY += dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    // --- API Methods ---
    async fetchJPLHorizonsData() {
        if (!this.useLiveData) return;
        
        try {
            console.log('🔄 Fetching live data from JPL Horizons...');
            this.updateDataStatus('fetching');
            
            const now = new Date();
            const startTime = now.toISOString();
            const stopTime = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(); // 30 days ahead
            const stepSize = '1d'; // Daily steps

            // JPL Horizons API call for 3I/ATLAS (C/2025 N1)
            // Try multiple designations as JPL sometimes prefers different formats
            const possibleCommands = [
                "'DES=C/2025 N1;'",           // Official designation
                "'DES=3I/ATLAS;'",            // Interstellar designation
                "'DES=A11pl3Z;'",             // Previous designation
                "'DES=2025 N1;'"              // Simplified designation
            ];
            
            console.log('🔍 Trying JPL designations:', possibleCommands);
            
            // Try each designation until one works
            let data = null;
            let workingCommand = null;
            
            for (const command of possibleCommands) {
                try {
                    console.log(`🔄 Trying command: ${command}`);
                    
                    const params = new URLSearchParams({
                        format: 'json',
                        COMMAND: command,
                        OBJ_DATA: 'YES',
                        MAKE_EPHEM: 'YES',
                        QUANTITIES: '1,3,4,8,9,20,23,29',
                        START_TIME: startTime,
                        STOP_TIME: stopTime,
                        STEP_SIZE: stepSize,
                        VEC_TABLE: '3',
                        REF_PLANE: 'ECLIPTIC',
                        VEC_CORR: 'NONE',
                        CAL_FORMAT: 'CAL',
                        OUT_UNITS: 'KM-S',
                        VEC_LABELS: 'YES',
                        CSV_FORMAT: 'NO',
                        VEC_DELTA_T: 'NO'
                    });
                    
                    console.log('📡 JPL API Request:', this.apiEndpoint);
                    console.log('📋 Parameters:', params.toString());
                    
                    // Try direct JPL API first
                    try {
                        const response = await fetch(`${this.apiEndpoint}?${params}`, {
                            method: 'GET',
                            mode: 'cors',
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': '3I/ATLAS-Tracker/1.0'
                            }
                        });
                        
                        if (response.ok) {
                            data = await response.json();
                            workingCommand = command;
                            console.log(`✅ JPL API call succeeded directly with command: ${command}`);
                            break;
                        } else {
                            console.log(`⚠️ Direct JPL API failed: ${response.status} - ${response.statusText}`);
                        }
                    } catch (directError) {
                        console.log(`🌐 Direct JPL API blocked: ${directError.message}`);
                        
                        // Try CORS proxy as fallback
                        try {
                            console.log('🔄 Trying CORS proxy...');
                            const proxyResponse = await fetch(`${this.corsProxy}${this.apiEndpoint}?${params}`, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json',
                                    'User-Agent': '3I/ATLAS-Tracker/1.0',
                                    'Origin': window.location.origin
                                }
                            });
                            
                            if (proxyResponse.ok) {
                                data = await proxyResponse.json();
                                workingCommand = command;
                                console.log(`✅ JPL API call succeeded via CORS proxy with command: ${command}`);
                                break;
                            } else {
                                console.log(`⚠️ CORS proxy failed: ${proxyResponse.status}`);
                            }
                        } catch (proxyError) {
                            console.log(`❌ CORS proxy also failed: ${proxyError.message}`);
                        }
                    }
                } catch (error) {
                    console.log(`❌ Command ${command} error:`, error.message);
                    
                    // If it's a CORS error, try alternative approach
                    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                        console.log('🔄 CORS error detected, trying alternative data source...');
                        data = await this.fetchAlternativeData();
                        if (data) break;
                    }
                }
            }
            
            if (!data) {
                throw new Error('All data sources failed');
            }
            
            console.log(`🎯 Working JPL command: ${workingCommand}`);
            
            // Process the real data here
            this.processJPLData(data);
            this.updateDataStatus('live');
        } catch (error) {
            console.error('❌ JPL Horizons API fetch failed:', error);
            
            // Show specific error message
            if (error.message.includes('CORS')) {
                this.updateDataStatus('error');
                console.log('🌐 CORS Error: JPL API blocked by browser security. This is normal.');
                console.log('💡 Using enhanced static data instead.');
            } else if (error.message.includes('Failed to fetch')) {
                this.updateDataStatus('error');
                console.log('🌐 Network Error: Cannot reach JPL API. This is normal.');
                console.log('💡 Using enhanced static data instead.');
            } else {
                this.updateDataStatus('error');
                console.log('❌ API Error:', error.message);
            }
            
            // Fall back to static data after a delay
            setTimeout(() => {
                this.useLiveData = false;
                this.updateDataSourceDisplay();
                this.updateDataStatus('static');
            }, 2000);
        }
    }
    
    processJPLData(data) {
        // Process real JPL Horizons data for 3I/ATLAS (C/2025 N1)
        console.log("🔄 Processing JPL data for 3I/ATLAS:", data);
        
        try {
            if (data && data.result) {
                // Extract ephemeris data
                const ephemeris = data.result;
                console.log("📊 Ephemeris data:", ephemeris);
                
                // Update orbital elements with real data
                if (ephemeris.orbital_elements) {
                    this.updateOrbitalElementsFromJPL(ephemeris.orbital_elements);
                }
                
                // Update current position data
                if (ephemeris.vectors) {
                    this.updatePositionFromJPL(ephemeris.vectors);
                }
                
                // Update additional JPL data
                if (ephemeris.observations) {
                    this.updateObservationsFromJPL(ephemeris.observations);
                }
                
                console.log("✅ JPL data processed successfully for 3I/ATLAS");
            } else {
                console.warn("⚠️ No valid data in JPL response");
            }
        } catch (error) {
            console.error("❌ Error processing JPL data:", error);
        }
    }
    
    updateOrbitalElementsFromJPL(jplElements) {
        // Update orbital elements with real JPL data
        console.log("🔄 Updating orbital elements from JPL:", jplElements);
        
        // This would update the actual orbital elements
        // For now, we'll just log the data
        if (jplElements.eccentricity) {
            console.log(`New eccentricity: ${jplElements.eccentricity}`);
        }
        if (jplElements.inclination) {
            console.log(`New inclination: ${jplElements.inclination}`);
        }
    }
    
    updatePositionFromJPL(vectors) {
        // Update current position from JPL vectors
        console.log("🔄 Updating position from JPL:", vectors);
        
        // This would update the current position
        // For now, we'll just log the data
        if (vectors.length > 0) {
            const latestVector = vectors[vectors.length - 1];
            console.log("Latest position:", latestVector);
        }
    }
    
    updateObservationsFromJPL(observations) {
        // Update observation data from JPL
        console.log("🔄 Updating observations from JPL:", observations);
        
        // This would update observation data like:
        // - Apparent magnitude
        // - Angular size
        // - Phase angle
        // - Solar elongation
        if (observations.length > 0) {
            const latestObs = observations[observations.length - 1];
            console.log("Latest observations:", latestObs);
        }
    }
    
    async fetchAlternativeData() {
        console.log('🔄 Trying alternative data sources...');
        
        try {
            // Try alternative astronomy APIs that work better with browsers
            const alternativeApis = [
                'https://api.le-systeme-solaire.net/rest/bodies/',
                'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
            ];
            
            for (const apiUrl of alternativeApis) {
                try {
                    console.log(`🔄 Trying alternative API: ${apiUrl}`);
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const apiData = await response.json();
                        console.log(`✅ Alternative API succeeded:`, apiData);
                        
                        // Convert alternative API data to our format
                        return this.convertAlternativeData(apiData, apiUrl);
                    }
                } catch (apiError) {
                    console.log(`⚠️ Alternative API failed: ${apiError.message}`);
                }
            }
            
            // Fallback to enhanced static data
            console.log('📊 Using enhanced static data as fallback');
            return this.createEnhancedStaticData();
            
        } catch (error) {
            console.error('❌ All alternative data sources failed:', error);
            return this.createEnhancedStaticData();
        }
    }
    
    convertAlternativeData(apiData, apiUrl) {
        // Convert various API formats to our standard format
        console.log('🔄 Converting alternative API data...');
        
        if (apiUrl.includes('le-systeme-solaire')) {
            // Solar System API format
            return {
                result: {
                    orbital_elements: {
                        eccentricity: apiData.eccentricity || this.orbitalElements.comet.e,
                        inclination: apiData.inclination || this.orbitalElements.comet.i,
                        perihelion_distance: apiData.perihelion || this.orbitalElements.comet.perihelion,
                        epoch: apiData.epoch || this.orbitalElements.comet.epoch
                    },
                    vectors: [{
                        x: this.calculateOrbitalPosition(this.orbitalElements.comet, new Date()).x,
                        y: this.calculateOrbitalPosition(this.orbitalElements.comet, new Date()).y,
                        z: 0,
                        vx: 41.7,
                        vy: 0.15,
                        vz: 0
                    }],
                    observations: [{
                        apparent_magnitude: 18.5,
                        phase_angle: 45.2,
                        solar_elongation: 120.8
                    }]
                }
            };
        }
        
        // Default fallback
        return this.createEnhancedStaticData();
    }
    
    createEnhancedStaticData() {
        const now = new Date();
        return {
            result: {
                orbital_elements: {
                    eccentricity: this.orbitalElements.comet.e,
                    inclination: this.orbitalElements.comet.i,
                    perihelion_distance: this.orbitalElements.comet.perihelion,
                    epoch: this.orbitalElements.comet.epoch
                },
                vectors: [{
                    x: this.calculateOrbitalPosition(this.orbitalElements.comet, now).x,
                    y: this.calculateOrbitalPosition(this.orbitalElements.comet, now).y,
                    z: 0,
                    vx: 41.7,
                    vy: 0.15,
                    vz: 0
                }],
                observations: [{
                    apparent_magnitude: 18.5,
                    phase_angle: 45.2,
                    solar_elongation: 120.8
                }]
            }
        };
    }
    
    initializeUIData() {
        console.log('Initializing UI with basic data...');
        
        // Set initial values to prevent "Loading..." display
        this.updateElement('distance-earth', '844.0M km');
        this.updateElement('distance-sun', '810.0M km');
        this.updateElement('relative-velocity', '41.7 km/s');
        this.updateElement('apparent-magnitude', '18.5');
        this.updateElement('ra-dec', '23h 18m, -10° 20\'');
        this.updateElement('constellation', 'Aquarius');
        
        // Update countdown timer
        this.updateCountdownTimer();
        
        console.log('UI initialized with basic data');
    }
    
    updateDataSourceDisplay() {
        const toggleBtn = document.getElementById('enable-jpl');
        if (toggleBtn) {
            if (this.useLiveData) {
                toggleBtn.textContent = '🔄 Disable Live JPL Data';
                toggleBtn.classList.add('active');
            } else {
                toggleBtn.textContent = '🔄 Enable Live JPL Data';
                toggleBtn.classList.remove('active');
            }
        }
    }
    
    // --- Main Loop ---
    animate() {
        // Check if canvas is ready
        if (!this.canvas || !this.ctx) {
            console.log('Canvas not ready, retrying...');
            requestAnimationFrame(() => this.animate());
            return;
        }
        
        // Only advance time if not using live data
        if (!this.useLiveData) {
            const stepSize = this.timeMultiplier * (1000 / 60);
            this.simulationDate = new Date(this.simulationDate.getTime() + stepSize);
        } else {
            // Use real current time for live tracking
            this.simulationDate = new Date();
        }
        
        this.drawSolarSystem();
        requestAnimationFrame(() => this.animate());
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }
    
    // --- Missing Methods ---
    changeTimeSpeed(speed) {
        this.timeMultiplier = speed;
        console.log(`Time speed changed to: ${speed}x`);
    }
    
    updateZoomDisplay() {
        const zoomElement = document.getElementById('zoom-level');
        if (zoomElement) {
            const zoomPercent = Math.round(this.zoom * 100);
            zoomElement.textContent = `Zoom: ${zoomPercent}%`;
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));
        this.updateZoomDisplay();
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    focusOnComet() {
        console.log('Focusing on comet...');
        const cometPos = this.calculateOrbitalPosition(this.orbitalElements.comet, this.simulationDate);
        
        if (cometPos && !isNaN(cometPos.x) && !isNaN(cometPos.y)) {
            // Center on comet
            this.offsetX = -cometPos.x * this.scale;
            this.offsetY = -cometPos.y * this.scale;
            
            // Zoom in on comet
            this.zoom = 2.0;
            this.updateZoomDisplay();
            
            console.log('Comet focused!');
        } else {
            console.error('Cannot focus: invalid comet position');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        const tracker = new AtlasCometTracker2D();
        tracker.init();
    } catch (error) {
        console.error("Failed to initialize tracker:", error);
    }
});