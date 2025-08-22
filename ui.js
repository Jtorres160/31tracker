export class UI {
    constructor() {
        this.elements = {
            earthDist: document.getElementById('distance-earth'),
            sunDist: document.getElementById('distance-sun'),
            velocity: document.getElementById('relative-velocity'),
            magnitude: document.getElementById('apparent-magnitude'),
            radec: document.getElementById('ra-dec'),
            constellation: document.getElementById('constellation'),
            countdown: document.getElementById('countdown-timer'),
            dataSourceText: document.getElementById('data-source-text'),
            statusDot: document.querySelector('.status-dot')
        };
    }

    startClock() {
        setInterval(() => {
            const timeElement = document.getElementById('current-time');
            if (timeElement) timeElement.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }

    bindTimeControls(callback) {
        const timeControls = document.querySelector('.time-controls');
        timeControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('time-btn')) {
                // Remove active class from all buttons
                timeControls.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
                // Add active class to the clicked button
                e.target.classList.add('active');
                // Call the function in main.js to update the speed
                const speed = parseInt(e.target.dataset.speed);
                callback(speed);
            }
        });
    }
    
    updateDataSource(statusText, detailsText, isError = false) {
        if (this.elements.dataSourceText) {
            this.elements.dataSourceText.textContent = statusText;
        }
        if (this.elements.statusDot) {
            this.elements.statusDot.classList.remove('live', 'error');
            if (statusText === 'Live') {
                this.elements.statusDot.classList.add('live');
            } else if (isError) {
                this.elements.statusDot.classList.add('error');
            }
        }
    }

    update(earthPos, cometPos, currentDate, cometElements) {
        const AU_TO_KM = 149597870.7;
        
        // Add debugging
        console.log('UI Update - Positions:', { earthPos, cometPos });
        
        const sunDistAU = Math.hypot(cometPos.x, cometPos.y);
        const earthDistAU = Math.hypot(cometPos.x - earthPos.x, cometPos.y - earthPos.y);
        
        console.log('UI Update - Distances:', { sunDistAU, earthDistAU });
        
        // Check for invalid distances and provide fallbacks
        if (isNaN(sunDistAU) || isNaN(earthDistAU)) {
            console.error('Invalid distances calculated:', { sunDistAU, earthDistAU });
            this.elements.sunDist.textContent = '4.0M km';  // Fallback value
            this.elements.earthDist.textContent = '2.6M km'; // Fallback value
        } else {
            this.elements.sunDist.textContent = `${(sunDistAU * AU_TO_KM / 1e6).toFixed(1)}M km`;
            this.elements.earthDist.textContent = `${(earthDistAU * AU_TO_KM / 1e6).toFixed(1)}M km`;
        }

        const timeUntilPass = cometElements.closestToEarth.getTime() - currentDate.getTime();
        if (timeUntilPass > 0) {
            const days = Math.floor(timeUntilPass / 86400000);
            this.elements.countdown.textContent = `${days} days`;
        } else {
            this.elements.countdown.textContent = 'Passed Earth!';
        }
        
        // Static placeholders
        this.elements.velocity.textContent = '41.7 km/s';
        this.elements.magnitude.textContent = '18.5';
        this.elements.radec.textContent = '23h 18m, -10° 20\'';
        this.elements.constellation.textContent = 'Aquarius';
    }
}
