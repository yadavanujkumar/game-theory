/**
 * 2D Spatial Evolutionary Arena (Cellular Automata Game Theory)
 * Visualizes how strategies survive, cluster, invade, and form spatial boundaries.
 */

class SpatialArena {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = options.width || 40;
        this.height = options.height || 40;
        this.grid = [];
        this.scores = [];
        this.running = false;
        this.animationFrame = null;
        this.speed = 15; // FPS
        this.lastFrameTime = 0;
        this.generation = 0;
        this.mutationRate = 0.01;
        this.activeBrush = "always_defect";
        this.isPainting = false;

        // Active strategies in the ecosystem
        this.availableKeys = [
            "always_coop",
            "always_defect",
            "tit_for_tat",
            "pavlov",
            "grim_trigger",
            "generous_tft"
        ];

        // Payoff matrix: 2x2x2 [act1][act2] -> [u1, u2]
        this.payoffMatrix = [
            [[3, 3], [0, 5]],
            [[5, 0], [1, 1]]
        ];

        this.initGrid("random_soup");
        this._setupEvents();
    }

    setPayoffMatrix(matrix) {
        this.payoffMatrix = matrix;
    }

    initGrid(preset = "random_soup") {
        this.grid = Array.from({ length: this.height }, () => new Array(this.width).fill("always_coop"));
        this.scores = Array.from({ length: this.height }, () => new Array(this.width).fill(0));
        this.generation = 0;

        if (preset === "random_soup") {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const k = this.availableKeys[Math.floor(Math.random() * this.availableKeys.length)];
                    this.grid[y][x] = k;
                }
            }
        } else if (preset === "tft_fortress") {
            // Defectors everywhere except a 8x8 cluster of Tit-for-Tat in the center
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.grid[y][x] = "always_defect";
                }
            }
            const cx = Math.floor(this.width / 2);
            const cy = Math.floor(this.height / 2);
            for (let dy = -4; dy <= 4; dy++) {
                for (let dx = -4; dx <= 4; dx++) {
                    if (cy + dy >= 0 && cy + dy < this.height && cx + dx >= 0 && cx + dx < this.width) {
                        this.grid[cy + dy][cx + dx] = "tit_for_tat";
                    }
                }
            }
        } else if (preset === "coop_vs_defect") {
            // Left half Cooperators, right half Defectors
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.grid[y][x] = x < this.width / 2 ? "always_coop" : "always_defect";
                }
            }
        } else if (preset === "three_way") {
            // Defectors, Cooperators, and Pavlov
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x < this.width / 3) this.grid[y][x] = "always_coop";
                    else if (x < (2 * this.width) / 3) this.grid[y][x] = "always_defect";
                    else this.grid[y][x] = "pavlov";
                }
            }
        }

        this.draw();
        if (this.onStatsUpdate) this.onStatsUpdate(this.getPopulationStats());
    }

    _setupEvents() {
        const getCell = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;
            const cellW = this.canvas.width / this.width;
            const cellH = this.canvas.height / this.height;
            const gx = Math.floor(px / cellW);
            const gy = Math.floor(py / cellH);
            return { gx: Math.max(0, Math.min(this.width - 1, gx)), gy: Math.max(0, Math.min(this.height - 1, gy)) };
        };

        this.canvas.addEventListener("mousedown", (e) => {
            this.isPainting = true;
            const { gx, gy } = getCell(e);
            this.paintCell(gx, gy);
        });

        window.addEventListener("mouseup", () => {
            this.isPainting = false;
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (this.isPainting) {
                const { gx, gy } = getCell(e);
                this.paintCell(gx, gy);
            }
        });
    }

    paintCell(gx, gy) {
        if (this.activeBrush && STRATEGY_REGISTRY[this.activeBrush]) {
            this.grid[gy][gx] = this.activeBrush;
            this.draw();
            if (this.onStatsUpdate) this.onStatsUpdate(this.getPopulationStats());
        }
    }

    step() {
        // 1. Play matches with 8 Moore neighbors
        const newScores = Array.from({ length: this.height }, () => new Array(this.width).fill(0));

        // Evaluate pair matches
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const stratKeyA = this.grid[y][x];

                // Play with 8 neighbors (toroidal wrap-around)
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = (x + dx + this.width) % this.width;
                        const ny = (y + dy + this.height) % this.height;
                        const stratKeyB = this.grid[ny][nx];

                        // Play a 3-round encounter between these 2 strategies
                        const sA = STRATEGY_REGISTRY[stratKeyA]();
                        const sB = STRATEGY_REGISTRY[stratKeyB]();
                        const match = GameEngine.runMatch(sA, sB, this.payoffMatrix, 3, 0);

                        newScores[y][x] += match.p1Score;
                    }
                }
            }
        }
        this.scores = newScores;

        // 2. Evolutionary Replacement (Survival of the highest scoring neighbor)
        const nextGrid = Array.from({ length: this.height }, () => new Array(this.width).fill(""));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Check if random mutation occurs
                if (Math.random() < this.mutationRate) {
                    const rnd = this.availableKeys[Math.floor(Math.random() * this.availableKeys.length)];
                    nextGrid[y][x] = rnd;
                    continue;
                }

                let bestScore = this.scores[y][x];
                let bestStrategy = this.grid[y][x];

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = (x + dx + this.width) % this.width;
                        const ny = (y + dy + this.height) % this.height;
                        if (this.scores[ny][nx] > bestScore) {
                            bestScore = this.scores[ny][nx];
                            bestStrategy = this.grid[ny][nx];
                        }
                    }
                }
                nextGrid[y][x] = bestStrategy;
            }
        }

        this.grid = nextGrid;
        this.generation++;
        this.draw();
        if (this.onStatsUpdate) this.onStatsUpdate(this.getPopulationStats());
    }

    start() {
        if (this.running) return;
        this.running = true;
        const loop = (timestamp) => {
            if (!this.running) return;
            const elapsed = timestamp - this.lastFrameTime;
            if (elapsed > 1000 / this.speed) {
                this.step();
                this.lastFrameTime = timestamp;
            }
            this.animationFrame = requestAnimationFrame(loop);
        };
        this.animationFrame = requestAnimationFrame(loop);
    }

    stop() {
        this.running = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    getPopulationStats() {
        const counts = {};
        const total = this.width * this.height;
        this.availableKeys.forEach(k => counts[k] = 0);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const k = this.grid[y][x];
                counts[k] = (counts[k] || 0) + 1;
            }
        }

        return {
            generation: this.generation,
            counts,
            percentages: Object.fromEntries(
                Object.entries(counts).map(([k, v]) => [k, ((v / total) * 100).toFixed(1)])
            )
        };
    }

    draw() {
        const cw = this.canvas.width / this.width;
        const ch = this.canvas.height / this.height;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const key = this.grid[y][x];
                const inst = STRATEGY_REGISTRY[key] ? STRATEGY_REGISTRY[key]() : null;
                this.ctx.fillStyle = inst ? inst.color : "#2d3748";
                this.ctx.fillRect(x * cw, y * ch, cw - 0.5, ch - 0.5);
            }
        }
    }
}

window.SpatialArena = SpatialArena;
