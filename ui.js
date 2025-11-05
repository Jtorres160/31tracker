export class UI {
    constructor() {
        this.elements = {
            earthDist: document.getElementById('distance-earth'),
            sunDist: document.getElementById('distance-sun'),
            velocity: document.getElementById('velocity'),
            countdown: document.getElementById('countdown-timer'),
            currentTime: document.getElementById('current-time')
        };
    }

    startClock() {
        const updateTime = () => {
            if (this.elements.currentTime) {
                const now = new Date();
                // Format: MM/DD/YYYY, HH:MM:SS AM/PM
                this.elements.currentTime.textContent = now.toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
            }
        };
        updateTime();
        setInterval(updateTime, 100); // Update every 100ms for real-time feel
    }

    update(earthPos, cometPos, currentDate, cometElements) {
        const AU_TO_KM = 149597870.7;

        // Validate positions before calculating
        if (!cometPos || isNaN(cometPos.x) || isNaN(cometPos.y) || isNaN(cometPos.z)) {
            console.warn('Invalid comet position');
            return;
        }
        
        if (!earthPos || isNaN(earthPos.x) || isNaN(earthPos.y) || isNaN(earthPos.z)) {
            console.warn('Invalid Earth position');
            return;
        }

        const sunDistAU = Math.sqrt(cometPos.x * cometPos.x + cometPos.y * cometPos.y + cometPos.z * cometPos.z);
        const dx = cometPos.x - earthPos.x;
        const dy = cometPos.y - earthPos.y;
        const dz = cometPos.z - earthPos.z;
        const earthDistAU = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (this.elements.sunDist && !isNaN(sunDistAU) && isFinite(sunDistAU)) {
            this.elements.sunDist.textContent = `${(sunDistAU * AU_TO_KM / 1e6).toFixed(2)}M km`;
        }
        if (this.elements.earthDist && !isNaN(earthDistAU) && isFinite(earthDistAU)) {
            this.elements.earthDist.textContent = `${(earthDistAU * AU_TO_KM / 1e6).toFixed(2)}M km`;
        }
        
        // --- REVISED VELOCITY CALCULATION ---
        if (this.elements.velocity && !isNaN(sunDistAU) && isFinite(sunDistAU) && sunDistAU > 0) {
            // Using correct vis-viva equation for a hyperbolic orbit
            // v = sqrt(GM * (2/r + 1/a))
            const q = cometElements.q;
            const e = cometElements.e;
            const a = q / (e - 1); // Semi-major axis (positive value for this formula)
            
            // v in km/s = 29.78 * sqrt(2/r + 1/a), where r and a are in AU
            const v_km_s = 29.78 * Math.sqrt((2 / sunDistAU) + (1 / a));

            this.elements.velocity.textContent = `${v_km_s.toFixed(1)} km/s`;
        }
        // --- END OF FIX ---

        if (this.elements.countdown) {
            const timeUntilPass = cometElements.closestToEarth.getTime() - currentDate.getTime();
            if (timeUntilPass > 0) {
                const days = Math.floor(timeUntilPass / 86400000);
                this.elements.countdown.textContent = `${days} days`;
            } else {
                this.elements.countdown.textContent = 'Passed Earth!';
            }
        }
    }
}