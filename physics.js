export class Physics {
    constructor() {
        this.elements = {
            mercury: { a: 1.0, e: 0.206, i: 7.0, omega: 29.1, Omega: 48.3, M0: 174.8, period: 88.0 },
            venus: { a: 1.8, e: 0.007, i: 3.4, omega: 54.9, Omega: 76.7, M0: 50.4, period: 224.7 },
            earth: { a: 2.5, e: 0.017, i: 0.0, omega: 102.94, Omega: 0.0, M0: -2.48, period: 365.2 },
            mars: { a: 3.3, e: 0.093, i: 1.9, omega: 286.5, Omega: 49.6, M0: 19.4, period: 687.0 },
            
            // --- JUPITER AND SATURN REMOVED ---

            comet: {
                // Real JPL orbital elements for 3I/ATLAS (C/2025 N1)
                q: 1.356419,         // perihelion distance in AU
                e: 6.139587,         // eccentricity (hyperbolic!)
                i: 175.1131,         // inclination (nearly retrograde)
                omega: 128.0099,     // argument of perihelion
                Omega: 322.1568,     // longitude of ascending node
                T_perihelion: 2460977.981439, // Time of perihelion passage (JD)
                perihelionDate: new Date('2025-10-29T11:33:16Z'), //
                closestToEarth: new Date('2025-12-19T00:00:00Z'), //
                closestDistanceToEarth: 1.797478 // in AU
            }
        };
        for (const planet in this.elements) {
            if (this.elements[planet].period) this.elements[planet].epoch = 2451545.0;
        }
    }

    dateToJulianDay(date) { 
        return (date.getTime() / 86400000) + 2440587.5; 
    }

    calculateOrbitalPosition(elements, date) {
        try {
            const jd = this.dateToJulianDay(date);
            let x_orb, y_orb;
            
            if (elements.e >= 1.0) {
                // === HYPERBOLIC CALCULATION ===
                const a = elements.q / (elements.e - 1); 
                const k = 0.01720209895; // Gaussian gravitational constant
                const n = k / Math.pow(a, 1.5); // Mean motion
                const M = n * (jd - elements.T_perihelion);

                let H = M; // Initial guess
                for (let i = 0; i < 15; i++) {
                    const f_H = elements.e * Math.sinh(H) - H - M;
                    const f_H_prime = elements.e * Math.cosh(H) - 1;
                    if (Math.abs(f_H) < 1e-10) break; // Converged
                    const delta = f_H / f_H_prime;
                    H = H - delta;
                }
                
                const r = a * (elements.e * Math.cosh(H) - 1);
                const v = 2 * Math.atan(Math.sqrt((elements.e + 1) / (elements.e - 1)) * Math.tanh(H / 2));
                
                x_orb = r * Math.cos(v);
                y_orb = r * Math.sin(v);
                
            } else {
                // Elliptical orbit for planets
                const n = (2 * Math.PI) / elements.period;
                const M = (elements.M0 * Math.PI / 180) + n * (jd - elements.epoch);
                let E = M;
                for (let i = 0; i < 10; i++) { 
                    E = M + elements.e * Math.sin(E); 
                }
                const r = elements.a * (1 - elements.e * Math.cos(E));
                const f = 2 * Math.atan2(Math.sqrt(1 + elements.e) * Math.sin(E / 2), Math.sqrt(1 - elements.e) * Math.cos(E / 2));
                x_orb = r * Math.cos(f); 
                y_orb = r * Math.sin(f);
            }
            
            return this.applyOrbitalTransformations(x_orb, y_orb, elements);
        } catch (error) {
            console.error('Orbital calculation error:', error, {elements, date});
            return { x: 0, y: 0, z: 0 };
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
        const z_ecl = y_prime * Math.sin(i_rad);
        
        const x = x_ecl * Math.cos(Omega_rad) - y_ecl * Math.sin(Omega_rad);
        const y = x_ecl * Math.sin(Omega_rad) + y_ecl * Math.cos(Omega_rad);
        const z = z_ecl;
        
        return { x, y, z };
    }
}