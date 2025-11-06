# ☄️ 3I/ATLAS (C/2025 N1) Interstellar Comet Tracker

This project visualizes the trajectory of **3I/ATLAS**, the third confirmed interstellar object to pass through our solar system.  
The goal is to provide a **clear, accurate, and real-time view** of its orbit relative to the Sun and planets as it approaches perihelion in late 2025.

---

## Features

- **Live orbital simulation** based on real JPL Horizons orbital elements  
- Correct handling of **hyperbolic trajectory** (e > 1)
- Shows **current distance from Earth and Sun**
- Displays **velocity** and closest-approach countdown
- **Zoom & pan** to inspect the solar system layout
- Clean UI designed for web and desktop screens

---

## Data & Accuracy

- Orbital elements are taken from the **JPL Small-Body Database**
- Distances are computed using standard two-body orbital mechanics
- Perihelion date and position match published ephemeris
- Earth close-approach: **December 19th, 2025 (~1.8 AU)**

This is **not** a simplified or game-style orbit; it uses:
- Kepler equation solving
- Correct transformation into ecliptic coordinates
- Hyperbolic anomaly iteration

---

## Running Locally

```bash
git clone https://github.com/YOUR-USERNAME/31tracker.git
cd 31tracker

# Start a simple local web server
python3 -m http.server 8000
```

Then open:

```
http://localhost:8000
```

---

## Controls

| Action | Input |
|-------|-------|
| Zoom | Scroll wheel |
| Pan | Click + drag |
| Reset view (if added later) | R key |

---

## Project Structure

```
/31tracker
 ├─ index.html
 ├─ styles.css
 ├─ main.js               # UI + simulation loop
 ├─ physics.js            # Orbital mechanics + position solver
 ├─ sceneManager.js       # Rendering
 ├─ data/
 │   └─ atlas_ephemeris.json
``

---

## Why This Matters

3I/ATLAS is interesting because:

- It does **not** originate from our solar system
- Its orbit is **hyperbolic**, meaning it will not return
- It provides physical clues about interstellar material

This project is intended for:
- Amateur astronomers
- Students learning orbital mechanics
- Anyone curious about interstellar visitors

---

## TODO / Future Work

- Improve mobile controls
- Add star background / constellation overlay
- Add brightness estimation curve (optional)
- Optional real-time data fetch from APIs

---

## License

MIT License.  
Feel free to fork, modify, and build on this.




