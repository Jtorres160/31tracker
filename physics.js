export class Physics {
    constructor() {
        this.elements = {
            mercury: { a: 0.387, e: 0.206, i: 7.0, omega: 29.1, Omega: 48.3, M0: 174.8, period: 88.0 },
            venus: { a: 0.723, e: 0.007, i: 3.4, omega: 54.9, Omega: 76.7, M0: 50.4, period: 224.7 },
            earth: { a: 1.0, e: 0.017, i: 0.0, omega: 102.9, Omega: -11.3, M0: 100.5, period: 365.2 },
            mars: { a: 1.524, e: 0.093, i: 1.9, omega: 286.5, Omega: 49.6, M0: 19.4, period: 687.0 },
            jupiter: { a: 5.204, e: 0.048, i: 1.3, omega: 273.9, Omega: 100.5, M0: 20.0, period: 4332.6 },
            comet: {
                a: -1.5, e: 1.001, i: 72.9, omega: 87.2,
                Omega: 31.6, M0: 0.0, epoch: 2460855.5, // July 1, 2025
                perihelion: 1.4, perihelionDate: new Date('2025-10-29'),
                closestToEarth: new Date('2025-12-19')
            }
        };
        // Set a common epoch for planets
        for (const planet in this.elements) {
            if (this.elements[planet].period) this.elements[planet].epoch = 2451545.0;
        }
    }

    dateToJulianDay(date) { return (date.getTime() / 86400000) + 2440587.5; }

    calculateOrbitalPosition(elements, date) {
        try {
            const jd = this.dateToJulianDay(date);
            let x_orb, y_orb;
            if (elements.e >= 1.0) { // Hyperbolic
                const daysSinceEpoch = jd - elements.epoch;
                const M = (0.01720209895 * Math.sqrt(1 / Math.abs(Math.pow(elements.a, 3)))) * daysSinceEpoch;
                let H = M;
                for (let i = 0; i < 7; i++) { H = M + elements.e * Math.sinh(H); }
                const r = elements.a * (1 - elements.e * Math.cosh(H));
                const f = 2 * Math.atan(Math.sqrt((elements.e + 1) / (elements.e - 1)) * Math.tanh(H / 2));
                x_orb = r * Math.cos(f); y_orb = r * Math.sin(f);
            } else { // Elliptical
                const n = (2 * Math.PI) / elements.period;
                const M = (elements.M0 * Math.PI / 180) + n * (jd - elements.epoch);
                let E = M;
                for (let i = 0; i < 7; i++) { E = M + elements.e * Math.sin(E); }
                const r = elements.a * (1 - elements.e * Math.cos(E));
                const f = 2 * Math.atan2(Math.sqrt(1 + elements.e) * Math.sin(E / 2), Math.sqrt(1 - elements.e) * Math.cos(E / 2));
                x_orb = r * Math.cos(f); y_orb = r * Math.sin(f);
            }
            return this.applyOrbitalTransformations(x_orb, y_orb, elements);
        } catch (error) {
            return { x: 0, y: 0, z: 0 };
        }
    }

    applyOrbitalTransformations(x_orb, y_orb, elements) {
        const i_rad = elements.i * Math.PI / 180;
        const omega_rad = elements.omega * Math.PI / 180;
        const Omega_rad = elements.Omega * Math.PI / 180;
        // Rotate by argument of periapsis
        const x_prime = x_orb * Math.cos(omega_rad) - y_orb * Math.sin(omega_rad);
        const y_prime = x_orb * Math.sin(omega_rad) + y_orb * Math.cos(omega_rad);
        // **NEW 3D STEP**: Rotate by inclination to get Z coordinate
        const x_ecl = x_prime;
        const y_ecl = y_prime * Math.cos(i_rad);
        const z_ecl = y_prime * Math.sin(i_rad);
        // Rotate by longitude of ascending node
        const x = x_ecl * Math.cos(Omega_rad) - y_ecl * Math.sin(Omega_rad);
        const y = x_ecl * Math.sin(Omega_rad) + y_ecl * Math.cos(Omega_rad);
        const z = z_ecl;
        return { x, y, z };
    }
}
}
