export class UI {
    constructor() {
        this.elements = {
            earthDist: document.getElementById('distance-earth'),
            sunDist: document.getElementById('distance-sun'),
            countdown: document.getElementById('countdown-timer')
        };
    }

    startClock() {
        setInterval(() => {
            const timeElement = document.getElementById('current-time');
            if (timeElement) timeElement.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }

    update(earthPos, cometPos, currentDate, cometElements) {
        const AU_TO_KM = 149597870.7;

        const sunDistAU = Math.hypot(cometPos.x, cometPos.y, cometPos.z);
        const earthDistAU = Math.hypot(cometPos.x - earthPos.x, cometPos.y - earthPos.y, cometPos.z - earthPos.z);

        if (this.elements.sunDist) {
            this.elements.sunDist.textContent = `${(sunDistAU * AU_TO_KM / 1e6).toFixed(1)}M km`;
        }
        if (this.elements.earthDist) {
            this.elements.earthDist.textContent = `${(earthDistAU * AU_TO_KM / 1e6).toFixed(1)}M km`;
        }

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
