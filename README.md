# ⚡ Game Theory Simulation Studio (AI & Evolutionary Lab)

An interactive, visual, and multi-paradigm Game Theory simulation studio featuring **Classical Game Theory**, **Evolutionary Game Theory (2D Cellular Automata & Replicator Dynamics)**, **Reinforcement Learning (Tabular Q-Learning & PyTorch Deep Q-Networks)**, and **Interactive Play**.

---

## 🚀 Quick Start

You can run the simulation studio in two ways:

### Option 1: Instant Browser Launch (Zero Installation)
Simply open `web/index.html` in any modern web browser (Chrome, Edge, Firefox, Safari):
- Double click `web/index.html` or drag it into your browser.
- Full client-side simulation, 2D spatial arena, sound effects, Q-learning, and Nash solvers run 100% locally with zero setup!

### Option 2: Full Python + PyTorch + FastAPI Backend
Run the launcher from your terminal:
```bash
python run.py
```
This boots the FastAPI server at `http://127.0.0.1:8000`, loads the PyTorch AI backend, and automatically opens your web browser.

---

## 🎮 Core Features & Scenarios

### 🌟 0. 🎮 3D Interactive Playable Arena (Three.js WebGL Engine)
Experience Game Theory in an immersive 3D world with real-time WebGL rendering, custom camera presets, and particle physics:
* **🦅 3D Brinkmanship Highway (Hawk-Dove Speed Duel)**:
  * Two 3D cyber-craft hurtle toward each other along a neon-lit runway at extreme speed.
  * You control your ship in real time: **SWERVE (Dove)** to save face $(+1 \text{ or } +3)$, or **STAY ON COURSE (Hawk)** to seek glory $(+5)$.
  * If both stay on course: **3D head-on collision with physical debris particle explosions, camera shake, and mutual destruction $(-10, -10)$!**
* **⚡ 3D Cyber Vault Duel (Prisoner's Dilemma Hologram Matrix)**:
  * Two floating cyber-crystals face off on opposite neon podiums.
  * Choose **🛡️ RAISE SHIELD (Cooperate)** or **⚡ FIRE LASER (Defect)**.
  * Watch physical 3D high-energy laser beams cut across the arena or deflect off translucent plasma shields!
* **🌐 3D Voxel Biosphere (3D Evolutionary God Mode)**:
  * An interactive 3D voxel grid where strategy agents compete in 3D space.
  * **Interactive 3D Raycasting**: Click on any 3D voxel in the world to inspect its AI policy and mutate it directly!
  * **3D Camera Control**: Orbit smoothly in full 3D, switch to *Cockpit Cam*, *Orbit Cam*, or *Top-down Tactical Cam*.

### 1. 📚 Scenarios & Lab
Explore classical and advanced game theory paradigms with detailed historical context, mathematical proofs, and live interactive play:
- **Prisoner's Dilemma**: Non-zero-sum cooperation paradox where individual dominance leads to collective ruin $(1, 1)$, contrasted against Axelrod's shadow of the future $(3, 3)$.
- **Hawk-Dove / Chicken Game**: Anti-coordination and brinkmanship. Explains animal combat rituals, Cold War deterrence (MAD), and mixed equilibria.
- **Stag Hunt (Coordination & Social Trust)**: Jean-Jacques Rousseau's trust dilemma. Highlights the contrast between **Payoff Dominance** (Stag, Stag) and **Risk Dominance** (Hare, Hare).
- **Battle of the Sexes / Coordination**: Conflicting preferences with mutual desire to coordinate; illustrates Thomas Schelling's **Focal Points**.
- **Matching Pennies (Zero-Sum Conflict)**: Pure adversarial conflict with no pure strategy equilibrium; demonstrates why mixed-strategy randomization is mathematically necessary.
- **Tragedy of the Commons / Public Goods**: Explains free-rider exploitation in environmental accords and shared resources.

### 2. 🌐 2D Spatial Evolutionary Arena (Cellular Automata)
Watch strategies battle across a 2D spatial grid (toroidal Moore neighborhood):
- **Spatial Darwinism**: Cells play matches against their 8 neighbors; the strategy yielding highest neighborhood fitness replicates into the cell.
- **Interactive Brush**: Paint strategies directly onto the canvas in real-time (inject defectors into peaceful populations or establish a Tit-for-Tat fortress!).
- **Colony Formation**: Discover why cooperative clusters survive defectors on a 2D spatial lattice, defying well-mixed population extinction.
- **Presets**: *Tit-for-Tat Fortress*, *Cooperator vs Defector Frontlines*, *Three-Way Battle*, and *Primordial Soup*.

### 3. 🏆 Axelrod Tournament & Replicator Dynamics
Run comprehensive round-robin tournaments across 12 strategies:
- **Leaderboard & Ranks**: Complete tally of total scores, per-round averages, and ranks.
- **Head-to-Head Payoff Heatmap**: Color-coded matrix detailing pairwise interactions.
- **Replicator Dynamics**: Multi-generational evolutionary trajectory simulation using Taylor & Jonker's replicator equation:
  $$\frac{dx_i}{dt} = x_i \cdot \left(f_i(\vec{x}) - \bar{f}(\vec{x})\right)$$
- **Trembling Hand Noise**: Simulate human or communication errors ($\epsilon_{noise}$), demonstrating why unforgiving strategies like Grim Trigger collapse while Generous Tit-for-Tat and Pavlov thrive.

### 4. 🤖 AI & Deep Reinforcement Learning Lab
Observe AI discovering game theory strategies from scratch:
- **Tabular Q-Learning**: Learns state-action values $Q(s, a)$ using the Bellman Optimality Equation:
  $$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$
- **Live State Inspection**: View real-time Q-values across historical states:
  - $(C, C)$ Both Cooperated
  - $(C, D)$ Sucker's state
  - $(D, C)$ Temptation state
  - $(D, D)$ Punishment state
- **PyTorch Deep Q-Network (DQN)**: Deep learning agent with experience replay buffer and target networks implemented in `python/models.py` and `train_rl.py`.

### 5. 🧪 Custom 2x2 Matrix Sandbox & Payoff Geometry
- Edit any custom payoff matrix.
- Real-time **Pure Strategy Nash Equilibria** computation.
- Real-time **Mixed Strategy Nash Equilibria** computation (via the indifference principle).
- **Dominant Strategy Detection** (Strict vs Weak dominance).
- **Pareto Optimal Set** identification.
- **2D Payoff Space Scatter Plot**: Visualizes the geometric boundary and Pareto frontier in utility space.

---

## 🛠️ Project Structure

```
├── web/
│   ├── index.html          # Cyberpunk glassmorphic UI
│   ├── css/
│   │   └── style.css       # Neon styling, responsive grids, animations
│   └── js/
│       ├── audio.js        # Web Audio API sound synthesizer
│       ├── nash.js         # Nash equilibrium & Pareto solver in JS
│       ├── strategies.js   # 12+ strategies + Q-learning + Neural agent
│       ├── engine.js       # Game definitions & match runner
│       ├── spatial.js      # 2D cellular automata canvas simulation
│       ├── tournament.js   # Axelrod round-robin & replicator dynamics
│       └── app.js          # Main UI coordinator, charts, and duel mode
├── python/
│   ├── game_engine.py      # Core games, 2x2 Nash solver, Pareto optimizer
│   ├── models.py           # PyTorch DQN, Q-Learner, Axelrod suite
│   ├── server.py           # FastAPI backend server with REST endpoints
│   └── test_suite.py       # Comprehensive unit & integration test suite
├── run.py                  # One-click desktop launcher (Server + Browser)
├── train_rl.py             # PyTorch DQN CLI training script
└── README.md               # Documentation & Theory Guide
```

---

## 🧪 Running Automated Tests

Run the test suite to verify all game matrices, Nash calculations, strategies, PyTorch DQN, and replicator dynamics:
```bash
python python/test_suite.py
```
Output:
```
..........
----------------------------------------------------------------------
Ran 10 tests in 2.548s

OK
```

---

## 🧠 Training PyTorch DQN Agent from CLI

To train the PyTorch Deep Q-Network agent from the command line against any opponent:
```bash
python train_rl.py tit_for_tat 60
python train_rl.py always_defect 50
python train_rl.py pavlov 60
```
