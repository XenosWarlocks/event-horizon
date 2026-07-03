# Event Horizon — Interactive Black Hole Simulator

A scientifically accurate, interactive 3D and 2D simulator modeling Schwarzschild and Kerr black hole physics, stellar structure, star cluster dynamics, and relativistic orbital disruption. Built with React, TypeScript, Three.js, and GLSL.

---

## 🌌 Overview

**Event Horizon** allows users to explore the extreme physics of black holes and stars. From ray-marching light paths bending through Schwarzschild spacetime in real-time, to modeling the final fates of massive stars and watching a black hole devour the Earth, the application bridges educational visualization with rigorous textbook calculations.

---

## 🚀 Key Features

### 1. Observatory Mode (3D Geodesic Renderer)

- **Exact Ray-Marching**: Integrates spatial null geodesics in the Schwarzschild metric in real-time.
- **Visual Phenomena**: Models gravitational lensing, the photon sphere, the black hole shadow, and Doppler beaming.
- **Accretion Disk Physics**: Uses the Shakura–Sunyaev thin-disk temperature profile to model disk emission.
- **Adaptive Performance**: Measures frame times and adjusts ray integration steps dynamically to guarantee a smooth framerate.

### 2. Cosmic Devourer Simulator (What If? Mode)

An interactive 2D orbital canvas modeling gravity and general relativity across three scales:

- **Near Earth (Moon Scale)**: Features a stellar-mass black hole. Demonstrates extreme tidal forces stretching and spaghettifying the Moon and Earth outside the event horizon before swallowing them.
- **Solar System (AU Scale)**: Features a supermassive black hole. Models orbital perturbations, outer planet ejection, and the inner planets crossing the event horizon intact without prior spaghettification.
- **Galactic Core (Milky Way Scale)**: Models high-velocity stellar orbits (inspired by the S-stars orbiting Sagittarius A\*), demonstrating extreme precession and tidal gas stripping.
- **Physical Mechanics**:
  - **Relativistic Time Dilation**: Bodies slow down visually as they approach the event horizon ($d\tau/dt \to 0$).
  - **Gravitational Redshift**: Emitted light from infalling bodies is red-shifted and then fades to absolute black at the event horizon boundary.
  - **Event Horizon Swell**: Emitted mass is conserved—ingesting a body increases the black hole's mass, swelling the event horizon ($r_s$) in real-time.
  - **Logarithmic Time Warp**: Features speed adjustments from $0.1\times$ to $10^{10}\times$ to allow viewing across astronomical time scales.

### 3. Famous Black Holes

- Presets for historically and scientifically significant objects, such as **M87\***, **Sagittarius A\***, **Cygnus X-1**, and **GW150914** (the first detected binary black hole merger).

### 4. Stellar Evolution Lab

- Models core temperatures, main-sequence lifetimes, and fusion fuel consumption rates.
- Simulates final fates based on ZAMS mass, including White Dwarf formation, Neutron Stars, Stellar Black Holes, Pair-Instability Supernovae (no remnant), and Direct Collapse.

### 5. Cluster Simulator (N Suns)

- Simulates packing $N$ solar-mass stars into a compact cluster.
- Computes virial velocity, relaxation times, collision frequencies, and predicts the ultimate fate of the cluster (collapse into an Intermediate-Mass Black Hole vs. evaporation).

---

## 🧮 Physics & Mathematics Reference

The simulator uses formulas cited directly from astrophysics textbooks (e.g., Misner, Thorne & Wheeler's _Gravitation_) and peer-reviewed journals.

| Metric / Phenomenon                         | Mathematical Formulation                                                                                                          | Code Location                                                     |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Schwarzschild Radius ($r_s$)**            | $$r_s = \frac{2GM}{c^2}$$                                                                                                         | [blackhole.ts](/src/physics/blackhole.ts#L19-L21)                 |
| **Photon Sphere ($r_{\text{ph}}$)**         | $$r_{\text{ph}} = 1.5 r_s = \frac{3GM}{c^2}$$                                                                                     | [blackhole.ts](/src/physics/blackhole.ts#L27-L29)                 |
| **Schwarzschild ISCO**                      | $$r_{\text{ISCO}} = 3 r_s = \frac{6GM}{c^2}$$                                                                                     | [blackhole.ts](/src/physics/blackhole.ts#L35-L37)                 |
| **Kerr ISCO ($r_{\text{isco}}$)**           | Bardeen, Press & Teukolsky (1972) equations using auxiliary variables $Z_1, Z_2$                                                  | [blackhole.ts](/src/physics/blackhole.ts#L47-L54)                 |
| **Kerr Event Horizon ($r_+$)**              | $$r_+ = \frac{GM}{c^2} \left(1 + \sqrt{1 - a^{*2}}\right)$$                                                                       | [blackhole.ts](/src/physics/blackhole.ts#L60-L64)                 |
| **Time Dilation Factor**                    | $$\frac{d\tau}{dt} = \sqrt{1 - \frac{r_s}{r}}$$                                                                                   | [blackhole.ts](/src/physics/blackhole.ts#L98-L102)                |
| **Gravitational Redshift ($z$)**            | $$1 + z = \frac{1}{\sqrt{1 - r_s/r}}$$                                                                                            | [blackhole.ts](/src/physics/blackhole.ts#L108-L112)               |
| **Tidal Acceleration ($\Delta a$)**         | $$\Delta a = \frac{2GML}{r^3}$$                                                                                                   | [blackhole.ts](/src/physics/blackhole.ts#L142-L144)               |
| **Hawking Temperature ($T_H$)**             | $$T_H = \frac{\hbar c^3}{8\pi G M k_B}$$                                                                                          | [blackhole.ts](/event-horizon/src/physics/blackhole.ts#L147-L150) |
| **Eddington Luminosity ($L_{\text{Edd}}$)** | $$L_{\text{Edd}} = \frac{4\pi G M m_p c}{\sigma_T}$$                                                                              | [blackhole.ts](/event-horizon/src/physics/blackhole.ts#L173-L175) |
| **Geodesic Light Raymarching**              | $$\frac{d^2\vec{x}}{d\lambda^2} = -\frac{3}{2} h^2 \frac{\hat{x}}{r^5} \quad \text{where } h = \vert\vec{x} \times \vec{v}\vert$$ | [shaders.ts](/event-horizon/src/render/shaders.ts#L4-L11)         |

---

## 📂 Codebase Structure

```
event-horizon/
├── src/
│   ├── physics/               # Rigorous physical equations & constants
│   │   ├── constants.ts       # Physical constants (G, c, hbar, solar/Earth units)
│   │   ├── blackhole.ts       # Schwarzschild & Kerr geometries, thermodynamics, accretion
│   │   ├── stellar.ts         # Stellar mass-luminosity scaling, fusion, & fates
│   │   ├── cluster.ts         # Dynamics & lifetimes of stellar clusters under gravity
│   │   └── comparison.ts      # Risk assessment / Earth safety metrics
│   ├── render/                # WebGL geodesic shader integration
│   │   ├── BlackHoleScene.tsx # Three.js canvas setup, orbit controls, quality loops
│   │   └── shaders.ts         # Ray-marching GLSL (Binet forms, accretion disks, redshift)
│   ├── ui/                    # Front-end panels and controls
│   │   ├── CosmicDevourer.tsx # 2D orbital disintegration sandbox (What If? Mode)
│   │   ├── ObservatoryPanel.ts# Controls for black hole mass, spin, and disk accretion
│   │   ├── App.tsx            # Main shell, states, layout elements
│   │   └── styles.css         # UI design system & glassmorphic layouts
│   └── main.tsx               # Application entry point
├── tests/
│   └── physics.test.ts        # Automated verification suite validating calculations against papers
├── index.html                 # HTML frame & fonts loading
├── vite.config.ts             # Vite configuration and test options
└── package.json               # Dependencies and script definitions
```

---

## 🛠️ Getting Started

To run the application locally, you will need Node.js installed.

1. **Clone the repository and install dependencies**:

   ```bash
   npm install
   ```

2. **Start the local development server**:

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173/` in your browser.

3. **Run the physics test suite**:
   ```bash
   npm run test
   ```
   This runs the Vitest validation tests verifying that the physical formulas match benchmark values.

---

## 📜 Code of Conduct for Code Base Mistakes

_(The "No-Blame Blunder" Policy)_

Simulating general relativity, stellar thermodynamics, and N-body dynamics is complex. A sign flip, a coordinate misalignment, or a floating-point truncation error can easily make it into the codebase.

To handle mistakes constructively, we enforce the following principles:

1. **Psychological Safety**: No developer will be blamed, shamed, or questioned for introducing an incorrect physics equation, numerical bug, or UI glitch. We view mistakes as natural steps in learning and refining the project.
2. **Academic Verification**: If you notice a mathematical or physical inconsistency (e.g., incorrect Kerr ISCO limits or wrong scaling constants), raise it constructively. If possible, cite the relevant academic literature (e.g., textbook chapters, arxiv preprints, or DOIs) so the community can learn the correct derivation.
3. **Collaboration Over Criticism**: File a detailed issue explaining the mismatch, or directly submit a corrective Pull Request. Every bug is an educational opportunity for everyone involved.
4. **Constructive Discourse**: Keep discussions, comments, and reviews friendly, welcoming, and centered around technical and scientific correctness.

---

## 🤝 How to Raise a Pull Request (PR)

We welcome contributions to expand the physics suite, optimize GLSL raymarching, or refine UI panels! Follow this workflow to propose changes:

1. **Fork the Repository**: Create a fork of the repo under your GitHub account.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/refine-accretion-precession
   ```
3. **Make Modifications**:
   - Keep components modular.
   - Do not change third-party dependencies without opening an issue for discussion first.
   - If you modify any equations, update any corresponding variables/comments to keep documentation accurate.
4. **Write/Update Tests**:
   - If you modify, refine, or add new physics equations, you **must** add matching tests to [tests/physics.test.ts](/event-horizon/tests/physics.test.ts).
   - Verify your test calculations against published paper benchmarks or physics textbooks and document the citation inline in the test file.
5. **Verify Code Correctness**:
   - Make sure the project builds and all tests pass cleanly:
     ```bash
     npm run build
     npm run test
     ```
6. **Commit & Push**: Commit your changes using clear, descriptive messages:
   ```bash
   git commit -m "fix(physics): corrected prograde Kerr ISCO sign index"
   git push origin feature/refine-accretion-precession
   ```
7. **Submit the PR**: Open a Pull Request from your branch against the `main` branch. In the description, summarize the change, state which tests verify it, and link to any relevant issues or academic publications.
