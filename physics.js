export class Physics {
    constructor() {
        this.elements = {
            // Inner Planets
            mercury: {
                a: 0.387, e: 0.2056, i: 7.0, omega: 29.124,
                Omega: 48.331, M0: 174.794, period: 87.97, epoch: 2451545.0
            },
            venus: {
                a: 0.723, e: 0.0068, i: 3.4, omega: 54.852,
                Omega: 76.680, M0: 50.416, period: 224.70, epoch: 2451545.0
            },
            earth: {
                a: 1.0, e: 0.0167, i: 0.0, omega: 102.94719,
                Omega: 0.0, M0: 357.529, period: 365.25, epoch: 2451545.0
            },
            mars: {
                a: 1.524, e: 0.0934, i: 1.9, omega: 286.496,
                Omega: 49.558, M0: 18.602, period: 686.98, epoch: 2451545.0
            },
            
            // Outer Planets
            jupiter: {
                a: 5.203, e: 0.0484, i: 1.3, omega: 273.867,
                Omega: 100.556, M0: 19.804, period: 4332.59, epoch: 2451545.0
            },
            saturn: {
                a: 9.537, e: 0.0542, i: 2.5, omega: 339.391,
                Omega: 113.715, M0: 317.020, period: 10759.22, epoch: 2451545.0
            },
            uranus: {
                a: 19.191, e: 0.0472, i: 0.8, omega: 96.734,
                Omega: 74.229, M0: 142.238, period: 30685.4, epoch: 2451545.0
            },
            neptune: {
                a: 30.069, e: 0.0086, i: 1.8, omega: 273.249,
                Omega: 131.721, M0: 256.228, period: 60189.0, epoch: 2451545.0
            },
            
            // Interstellar Comet
            comet: {
                a: -1.5, e: 1.001, i: 72.9, omega: 87.2,
                Omega: 31.6, M0: 0.0, epoch: 2460855.5, // July 1, 2025
                perihelion: 1.4, perihelionDate: new Date('2025-10-29'),
                closestToEarth: new Date('2025-12-19')
            }
        };
    }

    dateToJulianDay(date) {
        return (date.getTime() / 86400000) + 2440587.5;
    }

    calculateOrbitalPosition(elements, date) {
        if (!elements || !date) return { x: 0, y: 0 };
        try {
            const jd = this.dateToJulianDay(date);
            let x_orb, y_orb;
            
            if (elements.e >= 1.0) { // Hyperbolic (Comet)
                // Simplified hyperbolic calculation for 3I/ATLAS
                const daysSincePerihelion = (jd - this.dateToJulianDay(elements.perihelionDate));
                
                // For August 2025, use realistic positioning
                let distance, angle;
                
                if (daysSincePerihelion < -70) { // Before perihelion (August 2025)
                    // Start from far out (~2.6 AU from Earth)
                    distance = 2.6 + (Math.abs(daysSincePerihelion) - 70) * 0.01;
                    angle = Math.PI * 0.7; // Position in Aquarius constellation
                } else if (daysSincePerihelion >= -70 && daysSincePerihelion < 0) {
                    // Approaching perihelion
                    distance = 2.6 - (Math.abs(daysSincePerihelion) - 70) * 0.02;
                    angle = Math.PI * 0.7 + (daysSincePerihelion + 70) * 0.01;
                } else {
                    // After perihelion
                    distance = 1.8 + Math.abs(daysSincePerihelion) * 0.02;
                    angle = Math.PI * 0.7 + Math.abs(daysSincePerihelion) * 0.01;
                }
                
                x_orb = distance * Math.cos(angle);
                y_orb = distance * Math.sin(angle);
                
            } else { // Elliptical (Earth)
                const n = (2 * Math.PI) / elements.period;
                const M = (elements.M0 * Math.PI / 180) + n * (jd - elements.epoch);
                let E = M;
                for (let i = 0; i < 7; i++) { E = M + elements.e * Math.sin(E); }
                const r = elements.a * (1 - elements.e * Math.cos(E));
                const f = 2 * Math.atan2(Math.sqrt(1 + elements.e) * Math.sin(E / 2), Math.sqrt(1 - elements.e) * Math.cos(E / 2));
                x_orb = r * Math.cos(f); y_orb = r * Math.sin(f);
            }
            
            if (isNaN(x_orb) || isNaN(y_orb)) {
                console.error('Invalid orbital coordinates:', { x_orb, y_orb, elements, date });
                return { x: 0, y: 0 };
            }
            
            return this.applyOrbitalTransformations(x_orb, y_orb, elements);
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
}
