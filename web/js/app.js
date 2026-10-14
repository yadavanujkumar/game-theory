/**
 * Main Application Controller
 * Handles Navigation, Charts, Human vs AI Duel, Spatial Arena, Tournaments, RL Lab, and Sandbox
 */

document.addEventListener("DOMContentLoaded", () => {
    // Current state
    let currentScenarioId = "prisoners_dilemma";
    let duelOpponentStrategy = STRATEGY_REGISTRY.tit_for_tat();
    let duelRound = 0;
    let duelHumanScore = 0;
    let duelOpponentScore = 0;
    let duelHistory = [];

    // Spatial Arena instance
    const spatialCanvas = document.getElementById("spatialCanvas");
    let spatialArena = null;
    if (spatialCanvas) {
        spatialArena = new SpatialArena(spatialCanvas, { width: 36, height: 36 });
    }

    // Chart instances
    let replicatorChart = null;
    let rlTrainingChart = null;
    let payoffSpaceChart = null;

    // ==========================================
    // 1. Navigation & Sound Setup
    // ==========================================
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            soundFX.click();
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.getAttribute("data-tab");
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add("active");

            // Handle tab-specific activations
            if (targetId === "tab-3d-arena" && arena3D) {
                setTimeout(() => arena3D.onWindowResize(), 60);
            } else if (targetId === "tab-spatial" && spatialArena) {
                spatialArena.draw();
            } else if (targetId === "tab-sandbox") {
                analyzeSandboxMatrix();
            }
        });
    });

    const muteBtn = document.getElementById("muteBtn");
    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            const enabled = soundFX.toggle();
            muteBtn.innerHTML = enabled ? "🔊" : "🔇";
            muteBtn.title = enabled ? "Sound Enabled" : "Sound Muted";
        });
    }

    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            soundFX.click();
            document.body.classList.toggle("theme-light");
            const isLight = document.body.classList.contains("theme-light");
            themeToggleBtn.innerHTML = isLight ? "☀️" : "🌓";
        });
    }

    // ==========================================
    // 1B. 3D Playable Arena Setup & Controllers
    // ==========================================
    let arena3D = null;
    const arena3DContainer = document.getElementById("arena3DContainer");
    if (arena3DContainer && window.Arena3D && window.THREE) {
        try {
            arena3D = new Arena3D("arena3DContainer");
        } catch (e) {
            console.error("Three.js 3D initialization error:", e);
        }
    }

    // 3D Mode switcher buttons
    const btn3DHawk = document.getElementById("btn3DModeHawk");
    const btn3DVault = document.getElementById("btn3DModeVault");
    const btn3DVoxel = document.getElementById("btn3DModeVoxel");
    const controls3DHawk = document.getElementById("controls3DHawk");
    const controls3DVault = document.getElementById("controls3DVault");
    const controls3DVoxel = document.getElementById("controls3DVoxel");

    function set3DMode(mode) {
        soundFX.click();
        [btn3DHawk, btn3DVault, btn3DVoxel].forEach(b => {
            if (b) {
                b.classList.remove("active");
                b.style.borderColor = "var(--border-color)";
            }
        });

        if (controls3DHawk) controls3DHawk.style.display = "none";
        if (controls3DVault) controls3DVault.style.display = "none";
        if (controls3DVoxel) controls3DVoxel.style.display = "none";

        if (mode === 'hawk_dove') {
            if (btn3DHawk) { btn3DHawk.classList.add("active"); btn3DHawk.style.borderColor = "var(--cyan)"; }
            if (controls3DHawk) controls3DHawk.style.display = "flex";
        } else if (mode === 'matrix_duel') {
            if (btn3DVault) { btn3DVault.classList.add("active"); btn3DVault.style.borderColor = "var(--cyan)"; }
            if (controls3DVault) controls3DVault.style.display = "flex";
        } else if (mode === 'voxel_biosphere') {
            if (btn3DVoxel) { btn3DVoxel.classList.add("active"); btn3DVoxel.style.borderColor = "var(--cyan)"; }
            if (controls3DVoxel) controls3DVoxel.style.display = "flex";
        }

        if (arena3D) arena3D.loadMode(mode);
    }

    if (btn3DHawk) btn3DHawk.addEventListener("click", () => set3DMode('hawk_dove'));
    if (btn3DVault) btn3DVault.addEventListener("click", () => set3DMode('matrix_duel'));
    if (btn3DVoxel) btn3DVoxel.addEventListener("click", () => set3DMode('voxel_biosphere'));

    // Camera presets
    const btnCamOrbit = document.getElementById("btnCamOrbit");
    const btnCamDriver = document.getElementById("btnCamDriver");
    const btnCamTop = document.getElementById("btnCamTop");

    if (btnCamOrbit && arena3D) {
        btnCamOrbit.addEventListener("click", () => {
            soundFX.click();
            arena3D.camera.position.set(0, 18, 50);
            if (arena3D.controls) arena3D.controls.target.set(0, 4, 0);
        });
    }
    if (btnCamDriver && arena3D) {
        btnCamDriver.addEventListener("click", () => {
            soundFX.click();
            arena3D.camera.position.set(0, 3.5, 66);
            if (arena3D.controls) arena3D.controls.target.set(0, 2, -20);
        });
    }
    if (btnCamTop && arena3D) {
        btnCamTop.addEventListener("click", () => {
            soundFX.click();
            arena3D.camera.position.set(0, 75, 0.1);
            if (arena3D.controls) arena3D.controls.target.set(0, 0, 0);
        });
    }

    // Populate 3D Opponent dropdowns
    const hawkOppSelect = document.getElementById("hawkOpponentSelect");
    const vaultOppSelect = document.getElementById("vaultOpponentSelect");

    const stratOptionsHTML = Object.keys(STRATEGY_REGISTRY).map(k => {
        const inst = STRATEGY_REGISTRY[k]();
        return `<option value="${k}">${inst.icon} ${inst.name}</option>`;
    }).join("");

    if (hawkOppSelect) hawkOppSelect.innerHTML = stratOptionsHTML;
    if (vaultOppSelect) vaultOppSelect.innerHTML = stratOptionsHTML;

    // 3D Hawk-Dove Playable Buttons
    const btn3DHawkSwerve = document.getElementById("btn3DHawkSwerve");
    const btn3DHawkStay = document.getElementById("btn3DHawkStay");

    if (btn3DHawkSwerve && arena3D) {
        btn3DHawkSwerve.addEventListener("click", () => {
            arena3D.startHawkDoveMatch(0, hawkOppSelect ? hawkOppSelect.value : "tit_for_tat");
        });
    }
    if (btn3DHawkStay && arena3D) {
        btn3DHawkStay.addEventListener("click", () => {
            arena3D.startHawkDoveMatch(1, hawkOppSelect ? hawkOppSelect.value : "tit_for_tat");
        });
    }

    // 3D Cyber Vault Buttons
    const btn3DVaultCoop = document.getElementById("btn3DVaultCoop");
    const btn3DVaultDefect = document.getElementById("btn3DVaultDefect");

    function playVaultDuel3D(p1Action) {
        if (!arena3D) return;
        const oppKey = vaultOppSelect ? vaultOppSelect.value : "tit_for_tat";
        const oppStrategy = STRATEGY_REGISTRY[oppKey]();
        const p2Action = oppStrategy.act(0, 0);

        const m = SCENARIOS.prisoners_dilemma.matrix;
        const [u1, u2] = m[p1Action][p2Action];

        let text = "";
        if (p1Action === 0 && p2Action === 0) text = "Mutual Cooperation! Shields holding.";
        else if (p1Action === 1 && p2Action === 0) text = "You fired laser through their shield!";
        else if (p1Action === 0 && p2Action === 1) text = "Opponent laser breached your shield!";
        else text = "Crossfire laser clash! Heavy penalties.";

        arena3D.triggerVaultDuel(p1Action, p2Action, { u1, u2, text });
    }

    if (btn3DVaultCoop) btn3DVaultCoop.addEventListener("click", () => playVaultDuel3D(0));
    if (btn3DVaultDefect) btn3DVaultDefect.addEventListener("click", () => playVaultDuel3D(1));

    // 3D Voxel Biosphere Buttons
    const btn3DVoxelStep = document.getElementById("btn3DVoxelStep");
    const btn3DVoxelReset = document.getElementById("btn3DVoxelReset");

    if (btn3DVoxelStep && arena3D) {
        btn3DVoxelStep.addEventListener("click", () => arena3D.stepBiosphere());
    }
    if (btn3DVoxelReset && arena3D) {
        btn3DVoxelReset.addEventListener("click", () => {
            soundFX.click();
            arena3D.loadMode('voxel_biosphere');
        });
    }

    // ==========================================
    // 2. Scenario Strip & Payoff Display
    // ==========================================
    const scenarioStrip = document.getElementById("scenarioStrip");

    function renderScenarioStrip() {
        if (!scenarioStrip) return;
        scenarioStrip.innerHTML = "";
        Object.values(SCENARIOS).forEach(sc => {
            const pill = document.createElement("div");
            pill.className = `scenario-pill ${sc.id === currentScenarioId ? "active" : ""}`;
            pill.innerHTML = `
                <div class="scenario-pill-icon">${sc.icon}</div>
                <div>
                    <div class="scenario-pill-name">${sc.title.split("(")[0]}</div>
                    <div class="scenario-pill-cat">${sc.category}</div>
                </div>
            `;
            pill.addEventListener("click", () => {
                soundFX.click();
                selectScenario(sc.id);
            });
            scenarioStrip.appendChild(pill);
        });
    }

    function selectScenario(scenarioId) {
        currentScenarioId = scenarioId;
        const sc = SCENARIOS[scenarioId];
        if (!sc) return;

        // Update pills
        document.querySelectorAll(".scenario-pill").forEach(p => {
            p.classList.toggle("active", p.textContent.includes(sc.title.split("(")[0]));
        });

        // Update theory view
        document.getElementById("scenarioTitle").textContent = `${sc.icon} ${sc.title}`;
        document.getElementById("scenarioTagline").textContent = sc.tagline;
        document.getElementById("scenarioTheory").innerHTML = sc.theory;

        // Update Matrix Table
        renderMatrixTable(sc);

        // Solve Nash & Pareto
        const R = [
            [sc.matrix[0][0][0], sc.matrix[0][1][0]],
            [sc.matrix[1][0][0], sc.matrix[1][1][0]]
        ];
        const C = [
            [sc.matrix[0][0][1], sc.matrix[0][1][1]],
            [sc.matrix[1][0][1], sc.matrix[1][1][1]]
        ];
        const solution = NashSolver.solve2x2(R, C, sc.actionsP1, sc.actionsP2);
        renderEquilibriumBadges(solution, sc);

        // Update Spatial Arena matrix
        if (spatialArena) {
            spatialArena.setPayoffMatrix(sc.matrix);
        }

        // Reset duel for new scenario
        resetDuel();
    }

    function renderMatrixTable(sc) {
        const table = document.getElementById("scenarioMatrixTable");
        if (!table) return;

        const a1 = sc.actionsP1;
        const a2 = sc.actionsP2;
        const m = sc.matrix;
        const out = sc.outcomesText || {};

        const getCellHTML = (r, c) => {
            const info = out[`${r},${c}`] || { title: "Outcome", desc: "" };
            return `
                <div class="matrix-cell-title">${info.title}</div>
                <div class="matrix-cell-payoffs">
                    <span class="payoff-p1">You: +${m[r][c][0]}</span> &bull; <span class="payoff-p2">AI: +${m[r][c][1]}</span>
                </div>
                <div class="matrix-cell-desc">${info.desc}</div>
            `;
        };

        table.innerHTML = `
            <thead>
                <tr>
                    <th rowspan="2" class="matrix-col-header" style="border-right: 1px solid var(--border-subtle); width: 22%;">Your Move &darr;</th>
                    <th colspan="2" class="matrix-col-header">Opponent's Move &rarr;</th>
                </tr>
                <tr>
                    <th class="matrix-header-act0">${a2[0]}</th>
                    <th class="matrix-header-act1">${a2[1]}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th class="matrix-header-act0" style="border-right: 1px solid var(--border-subtle);">${a1[0]}</th>
                    <td class="matrix-cell" id="cell-0-0">
                        ${getCellHTML(0, 0)}
                    </td>
                    <td class="matrix-cell" id="cell-0-1">
                        ${getCellHTML(0, 1)}
                    </td>
                </tr>
                <tr>
                    <th class="matrix-header-act1" style="border-right: 1px solid var(--border-subtle);">${a1[1]}</th>
                    <td class="matrix-cell" id="cell-1-0">
                        ${getCellHTML(1, 0)}
                    </td>
                    <td class="matrix-cell" id="cell-1-1">
                        ${getCellHTML(1, 1)}
                    </td>
                </tr>
            </tbody>
        `;
    }

    function renderEquilibriumBadges(solution, sc) {
        // Clear old cell markings
        document.querySelectorAll(".matrix-cell").forEach(cell => {
            cell.classList.remove("nash-eq", "pareto-opt");
            const oldBadge = cell.querySelector(".matrix-cell-badge");
            if (oldBadge) oldBadge.remove();
        });

        // Mark Pure Nash Equilibria
        solution.pureEquilibria.forEach(eq => {
            const cell = document.getElementById(`cell-${eq.row}-${eq.col}`);
            if (cell) {
                cell.classList.add("nash-eq");
                const b = document.createElement("span");
                b.className = "matrix-cell-badge badge-nash";
                b.textContent = "Equilibrium Trap";
                cell.appendChild(b);
            }
        });

        // Mark Pareto Optimal
        solution.pareto.forEach(p => {
            const cell = document.getElementById(`cell-${p.row}-${p.col}`);
            if (cell) {
                cell.classList.add("pareto-opt");
            }
        });

        // Update cards with plain English explanations
        const pureCard = document.getElementById("pureNashSummary");
        if (pureCard) {
            if (solution.pureEquilibria.length === 0) {
                pureCard.innerHTML = `<span style="color:var(--text-muted)">None (Constant Mind-Reading Cycle)</span>`;
            } else {
                pureCard.innerHTML = solution.pureEquilibria.map(eq =>
                    `<div style="color:var(--accent-primary-light); font-weight:700;">⚠️ Mutual Trap: (${eq.actionP1}, ${eq.actionP2})</div>
                     <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Neither side can safely switch moves alone without getting hurt worse.</div>`
                ).join("");
            }
        }

        const mixedCard = document.getElementById("mixedNashSummary");
        if (mixedCard) {
            if (solution.mixedEquilibrium) {
                const m = solution.mixedEquilibrium;
                mixedCard.innerHTML = `
                    <div style="font-weight:600;">🎲 Bluffing Strategy</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Randomize: ${(m.p1_prob0 * 100).toFixed(0)}% ${sc.actionsP1[0]}, ${(m.p1_prob1 * 100).toFixed(0)}% ${sc.actionsP1[1]} to prevent being predicted!</div>
                `;
            } else {
                mixedCard.innerHTML = `<span style="color:var(--text-muted)">Fixed choices dominate</span>`;
            }
        }

        const dominantCard = document.getElementById("dominantSummary");
        if (dominantCard) {
            dominantCard.innerHTML = `
                <div><strong style="color:var(--text-primary);">${solution.dominantP1.action}</strong></div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${solution.dominantP1.type === "Strictly Dominant" ? "Always gives you a higher score individually, which creates the trap!" : "No single move always wins."}</div>
            `;
        }
    }

    // ==========================================
    // 3. Human vs AI Duel Arena
    // ==========================================
    const duelSelect = document.getElementById("duelOpponentSelect");
    const btnAct0 = document.getElementById("btnDuelAct0");
    const btnAct1 = document.getElementById("btnDuelAct1");
    const btnResetDuel = document.getElementById("btnResetDuel");
    const duelHumanScoreEl = document.getElementById("duelHumanScore");
    const duelOppScoreEl = document.getElementById("duelOpponentScore");
    const duelMindText = document.getElementById("duelMindText");
    const duelHistoryList = document.getElementById("duelHistoryList");

    if (duelSelect) {
        duelSelect.innerHTML = Object.keys(STRATEGY_REGISTRY).map(k => {
            const inst = STRATEGY_REGISTRY[k]();
            return `<option value="${k}">${inst.icon} ${inst.name}</option>`;
        }).join("");

        duelSelect.addEventListener("change", () => {
            duelOpponentStrategy = STRATEGY_REGISTRY[duelSelect.value]();
            resetDuel();
        });
    }

    function resetDuel() {
        duelRound = 0;
        duelHumanScore = 0;
        duelOpponentScore = 0;
        duelHistory = [];
        if (duelOpponentStrategy) duelOpponentStrategy.reset();

        const sc = SCENARIOS[currentScenarioId];
        if (btnAct0 && btnAct1 && sc) {
            btnAct0.querySelector(".btn-action-title").textContent = sc.actionsP1[0];
            btnAct1.querySelector(".btn-action-title").textContent = sc.actionsP1[1];
            const sub0 = btnAct0.querySelector(".btn-action-subtitle");
            const sub1 = btnAct1.querySelector(".btn-action-subtitle");
            if (sub0) sub0.textContent = "Play cooperative / safe move";
            if (sub1) sub1.textContent = "Play selfish / high-stakes move";
        }

        if (duelHumanScoreEl) duelHumanScoreEl.textContent = "0";
        if (duelOppScoreEl) duelOppScoreEl.textContent = "0";
        if (duelMindText) duelMindText.textContent = "Opponent is waiting for your move. Pick an option below!";
        if (duelHistoryList) duelHistoryList.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:1rem;">Make your first move below!</div>`;
    }

    function playDuelRound(humanAction) {
        const sc = SCENARIOS[currentScenarioId];
        if (!sc || !duelOpponentStrategy) return;

        const oppAction = duelOpponentStrategy.act(duelRound, 0);
        const [uHuman, uOpp] = sc.matrix[humanAction][oppAction];

        duelOpponentStrategy.update(oppAction, humanAction, uOpp);

        duelRound++;
        duelHumanScore += uHuman;
        duelOpponentScore += uOpp;

        if (duelHumanScoreEl) duelHumanScoreEl.textContent = duelHumanScore;
        if (duelOppScoreEl) duelOppScoreEl.textContent = duelOpponentScore;

        // Play sound effects
        if (humanAction === 0) soundFX.cooperate();
        else soundFX.defect();

        // Psychological reaction analysis
        let thought = "";
        const stratId = duelOpponentStrategy.id;
        const outInfo = (sc.outcomesText && sc.outcomesText[`${humanAction},${oppAction}`]) || null;
        const outcomeTitle = outInfo ? outInfo.title : "Round Outcome";

        if (stratId === "tit_for_tat") {
            thought = humanAction === 0
                ? "🤝 Tit-for-Tat: You cooperated! It will happily cooperate next round."
                : "⚡ Tit-for-Tat: You defected! It will immediately punish you next round!";
        } else if (stratId === "grim_trigger") {
            thought = duelOpponentStrategy.triggered
                ? "🔥 Grim Trigger: Trust was broken once. It will NEVER cooperate again!"
                : "🕊️ Grim Trigger: Maintaining peace. But make 1 mistake and it's permanent war!";
        } else if (stratId === "pavlov") {
            thought = uOpp >= 3
                ? "🐶 Pavlov (Win-Stay): It enjoyed that high score and will repeat that move."
                : "🐶 Pavlov (Lose-Shift): It got a low score and will switch moves next round.";
        } else if (stratId === "always_defect") {
            thought = "😈 Pure Defector: Self-interest only. It will never cooperate.";
        } else if (stratId === "detective") {
            thought = duelOpponentStrategy.exploiting
                ? "🔍 Detective: It detected you don't fight back and is exploiting you!"
                : "🔍 Detective: You fought back! It is respecting you and copying your moves.";
        } else if (stratId === "q_learner") {
            thought = `🤖 Q-Learner: Updated neural value estimates. Learned ${Object.keys(duelOpponentStrategy.qTable).length} state-action combinations so far.`;
        } else {
            thought = `Round ${duelRound} complete. AI is calculating expected payoffs.`;
        }
        if (duelMindText) duelMindText.textContent = `${thought}`;

        // Render friendly round row
        const row = document.createElement("div");
        row.className = "history-row";
        const hBadgeColor = humanAction === 0 ? "var(--payoff-p1)" : "var(--payoff-p2)";
        const oBadgeColor = oppAction === 0 ? "var(--payoff-p1)" : "var(--payoff-p2)";
        row.innerHTML = `
            <div style="font-weight:700;">R${duelRound}: ${outcomeTitle}</div>
            <div style="display:flex; gap:0.75rem; font-family:'JetBrains Mono', monospace; font-size:0.84rem;">
                <span style="color:${hBadgeColor}; font-weight:700;">You: +${uHuman}</span>
                <span style="color:${oBadgeColor}; font-weight:700;">AI: +${uOpp}</span>
            </div>
        `;
        if (duelHistoryList) {
            if (duelRound === 1) duelHistoryList.innerHTML = "";
            duelHistoryList.prepend(row);
        }
    }

    if (btnAct0) btnAct0.addEventListener("click", () => playDuelRound(0));
    if (btnAct1) btnAct1.addEventListener("click", () => playDuelRound(1));
    if (btnResetDuel) btnResetDuel.addEventListener("click", () => {
        soundFX.click();
        resetDuel();
    });

    // ==========================================
    // 4. 2D Spatial Arena Controls
    // ==========================================
    const btnSpatialPlay = document.getElementById("btnSpatialPlay");
    const btnSpatialStep = document.getElementById("btnSpatialStep");
    const btnSpatialReset = document.getElementById("btnSpatialReset");
    const spatialSpeed = document.getElementById("spatialSpeed");
    const spatialPresetSelect = document.getElementById("spatialPresetSelect");
    const spatialBrushBtns = document.querySelectorAll(".brush-btn");
    const spatialGenCount = document.getElementById("spatialGenCount");
    const spatialPopBar = document.getElementById("spatialPopBar");
    const spatialPopStats = document.getElementById("spatialPopStats");

    if (spatialArena) {
        spatialArena.onStatsUpdate = (stats) => {
            if (spatialGenCount) spatialGenCount.textContent = stats.generation;
            if (spatialPopBar) {
                spatialPopBar.innerHTML = Object.entries(stats.counts).map(([k, count]) => {
                    const inst = STRATEGY_REGISTRY[k] ? STRATEGY_REGISTRY[k]() : null;
                    const pct = stats.percentages[k] || 0;
                    if (pct <= 0) return "";
                    return `<div class="pop-bar-segment" style="width: ${pct}%; background: ${inst ? inst.color : '#444'};" title="${inst ? inst.name : k}: ${pct}%"></div>`;
                }).join("");
            }
            if (spatialPopStats) {
                spatialPopStats.innerHTML = Object.entries(stats.counts).map(([k, count]) => {
                    const inst = STRATEGY_REGISTRY[k] ? STRATEGY_REGISTRY[k]() : null;
                    const pct = stats.percentages[k] || 0;
                    return `
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:3px;">
                            <span><span style="color:${inst ? inst.color : '#fff'}">●</span> ${inst ? inst.name : k}</span>
                            <strong>${pct}%</strong>
                        </div>
                    `;
                }).join("");
            }
        };

        if (btnSpatialPlay) {
            btnSpatialPlay.addEventListener("click", () => {
                soundFX.click();
                if (spatialArena.running) {
                    spatialArena.stop();
                    btnSpatialPlay.innerHTML = "▶ Start Evolution";
                    btnSpatialPlay.classList.remove("btn-danger");
                    btnSpatialPlay.classList.add("btn-primary");
                } else {
                    spatialArena.start();
                    btnSpatialPlay.innerHTML = "⏸ Pause";
                    btnSpatialPlay.classList.remove("btn-primary");
                    btnSpatialPlay.classList.add("btn-danger");
                }
            });
        }

        if (btnSpatialStep) {
            btnSpatialStep.addEventListener("click", () => {
                soundFX.click();
                spatialArena.step();
            });
        }

        if (btnSpatialReset) {
            btnSpatialReset.addEventListener("click", () => {
                soundFX.click();
                spatialArena.stop();
                if (btnSpatialPlay) {
                    btnSpatialPlay.innerHTML = "▶ Start Evolution";
                    btnSpatialPlay.classList.remove("btn-danger");
                    btnSpatialPlay.classList.add("btn-primary");
                }
                const preset = spatialPresetSelect ? spatialPresetSelect.value : "random_soup";
                spatialArena.initGrid(preset);
            });
        }

        if (spatialSpeed) {
            spatialSpeed.addEventListener("input", (e) => {
                spatialArena.speed = parseInt(e.target.value);
            });
        }

        if (spatialPresetSelect) {
            spatialPresetSelect.addEventListener("change", (e) => {
                soundFX.click();
                spatialArena.stop();
                if (btnSpatialPlay) {
                    btnSpatialPlay.innerHTML = "▶ Start Evolution";
                    btnSpatialPlay.classList.remove("btn-danger");
                    btnSpatialPlay.classList.add("btn-primary");
                }
                spatialArena.initGrid(e.target.value);
            });
        }

        spatialBrushBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                soundFX.click();
                spatialBrushBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                spatialArena.activeBrush = btn.getAttribute("data-brush");
            });
        });
    }

    // ==========================================
    // 5. Axelrod Tournament & Replicator Dynamics
    // ==========================================
    const tournamentStratList = document.getElementById("tournamentStratList");
    const btnRunTournament = document.getElementById("btnRunTournament");
    const tournamentLeaderboard = document.getElementById("tournamentLeaderboard");
    const heatmapContainer = document.getElementById("tournamentHeatmap");

    function initTournamentList() {
        if (!tournamentStratList) return;
        tournamentStratList.innerHTML = Object.keys(STRATEGY_REGISTRY).map(k => {
            const inst = STRATEGY_REGISTRY[k]();
            // Default selected: classic set
            const checked = ["tit_for_tat", "always_coop", "always_defect", "grim_trigger", "pavlov", "generous_tft", "detective"].includes(k) ? "checked" : "";
            return `
                <label class="strat-checkbox-item">
                    <input type="checkbox" value="${k}" ${checked}>
                    <span>${inst.icon}</span>
                    <div>
                        <div style="font-weight:700; font-size:0.88rem;">${inst.name}</div>
                        <div style="font-size:0.74rem; color:var(--text-muted);">${inst.description.slice(0, 52)}...</div>
                    </div>
                </label>
            `;
        }).join("");
    }
    initTournamentList();

    if (btnRunTournament) {
        btnRunTournament.addEventListener("click", () => {
            soundFX.click();
            runTournamentUI();
        });
    }

    function runTournamentUI() {
        const checkedInputs = tournamentStratList.querySelectorAll("input:checked");
        const keys = Array.from(checkedInputs).map(cb => cb.value);

        if (keys.length < 2) {
            alert("Please select at least 2 strategies for the tournament.");
            return;
        }

        const strategies = keys.map(k => STRATEGY_REGISTRY[k]());
        const sc = SCENARIOS[currentScenarioId];
        const rounds = parseInt(document.getElementById("tournamentRounds").value) || 100;
        const noise = parseFloat(document.getElementById("tournamentNoise").value) || 0.0;

        const result = AxelrodTournament.runTournament(strategies, sc.matrix, rounds, noise);
        soundFX.roundWin();

        // Render Leaderboard
        if (tournamentLeaderboard) {
            tournamentLeaderboard.innerHTML = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">Rank</th>
                            <th>Strategy</th>
                            <th style="text-align: right;">Total Score</th>
                            <th style="text-align: right;">Avg / Round</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.leaderboard.map(item => `
                            <tr>
                                <td><span class="rank-pill rank-${item.rank}">${item.rank}</span></td>
                                <td>
                                    <strong>${item.icon} ${item.name}</strong>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${item.description}</div>
                                </td>
                                <td style="text-align: right; font-weight:800; font-family:monospace; color:var(--cyan);">${item.totalScore.toLocaleString()}</td>
                                <td style="text-align: right; font-weight:700; font-family:monospace; color:var(--text-primary);">${item.avgPerRound}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }

        // Render Heatmap Matrix
        if (heatmapContainer) {
            const n = strategies.length;
            let html = `<table class="matrix-table" style="font-size:0.8rem;"><thead><tr><th>vs</th>`;
            strategies.forEach(s => html += `<th>${s.icon} ${s.name.split(" ")[0]}</th>`);
            html += `</tr></thead><tbody>`;

            for (let i = 0; i < n; i++) {
                html += `<tr><th>${strategies[i].icon} ${strategies[i].name.split(" ")[0]}</th>`;
                for (let j = 0; j < n; j++) {
                    const val = result.pairwiseMatrix[i][j].toFixed(1);
                    const hue = Math.min(120, Math.max(0, (val / 5.0) * 120));
                    html += `<td style="background: hsla(${hue}, 80%, 25%, 0.4); font-weight:700; font-family:monospace;">${val}</td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table>`;
            heatmapContainer.innerHTML = html;
        }

        // Run Replicator Dynamics Chart
        const initialPop = new Array(strategies.length).fill(1 / strategies.length);
        const replicatorHistory = AxelrodTournament.runReplicatorDynamics(result.pairwiseMatrix, initialPop, 40);
        renderReplicatorChart(strategies, replicatorHistory);
    }

    function renderReplicatorChart(strategies, history) {
        const ctx = document.getElementById("replicatorChartCanvas");
        if (!ctx) return;

        if (replicatorChart) replicatorChart.destroy();

        const labels = history.map((_, i) => `Gen ${i}`);
        const datasets = strategies.map((s, idx) => ({
            label: `${s.icon} ${s.name}`,
            data: history.map(h => (h[idx] * 100).toFixed(1)),
            borderColor: s.color,
            backgroundColor: s.color + "22",
            fill: false,
            tension: 0.3
        }));

        replicatorChart = new Chart(ctx, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: "#94a3b8" } }
                },
                scales: {
                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#64748b" } },
                    y: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#64748b" },
                        title: { display: true, text: "Population Share (%)", color: "#94a3b8" },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // ==========================================
    // 6. AI & Reinforcement Learning Lab
    // ==========================================
    const btnTrainRL = document.getElementById("btnTrainRL");
    const rlOpponentSelect = document.getElementById("rlOpponentSelect");
    const rlAlphaInput = document.getElementById("rlAlpha");
    const rlGammaInput = document.getElementById("rlGamma");
    const rlEpisodesInput = document.getElementById("rlEpisodes");
    const qTableBody = document.getElementById("qTableBody");

    if (rlOpponentSelect) {
        rlOpponentSelect.innerHTML = Object.keys(STRATEGY_REGISTRY)
            .filter(k => k !== "q_learner")
            .map(k => {
                const inst = STRATEGY_REGISTRY[k]();
                return `<option value="${k}">${inst.icon} ${inst.name}</option>`;
            }).join("");
    }

    if (btnTrainRL) {
        btnTrainRL.addEventListener("click", () => {
            soundFX.click();
            trainQLearningLive();
        });
    }

    function trainQLearningLive() {
        const oppKey = rlOpponentSelect ? rlOpponentSelect.value : "tit_for_tat";
        const alpha = parseFloat(rlAlphaInput.value) || 0.2;
        const gamma = parseFloat(rlGammaInput.value) || 0.9;
        const episodes = parseInt(rlEpisodesInput.value) || 60;

        const sc = SCENARIOS.prisoners_dilemma;
        const qAgent = new QLearningStrategy(alpha, gamma, 0.35);

        const rewardsCurve = [];
        let epsilon = 0.35;
        const roundsPerEp = 25;

        for (let ep = 0; ep < episodes; ep++) {
            const opp = STRATEGY_REGISTRY[oppKey]();
            qAgent.epsilon = epsilon;
            qAgent.reset();
            opp.reset();
            let epReward = 0;

            for (let r = 0; r < roundsPerEp; r++) {
                const a1 = qAgent.act(r, 0);
                const a2 = opp.act(r, 0);
                const [u1, u2] = sc.matrix[a1][a2];
                qAgent.update(a1, a2, u1);
                opp.update(a2, a1, u2);
                epReward += u1;
            }

            rewardsCurve.push(epReward / roundsPerEp);
            epsilon = Math.max(0.05, epsilon * 0.96);
        }

        soundFX.roundWin();

        // Render Q-Table
        if (qTableBody) {
            const states = [
                { s: "-1,-1", desc: "Initial / Start Game" },
                { s: "0,0", desc: "Both Cooperated (CC)" },
                { s: "0,1", desc: "You Cooperated, Opp Defected (CD)" },
                { s: "1,0", desc: "You Defected, Opp Cooperated (DC)" },
                { s: "1,1", desc: "Both Defected (DD)" }
            ];

            qTableBody.innerHTML = states.map(st => {
                const q = qAgent.qTable[st.s] || [0.0, 0.0];
                const bestAction = q[0] > q[1] ? "Cooperate (0)" : (q[1] > q[0] ? "Defect (1)" : "Indifferent");
                const bestColor = q[0] > q[1] ? "var(--cyan)" : (q[1] > q[0] ? "var(--rose)" : "var(--text-primary)");
                return `
                    <tr>
                        <td><strong>${st.desc}</strong> <div style="font-size:0.75rem; color:var(--text-muted);">${st.s}</div></td>
                        <td style="font-family:monospace; font-weight:700;">${q[0].toFixed(2)}</td>
                        <td style="font-family:monospace; font-weight:700;">${q[1].toFixed(2)}</td>
                        <td style="color:${bestColor}; font-weight:800;">${bestAction}</td>
                    </tr>
                `;
            }).join("");
        }

        // Render RL chart
        renderRLChart(rewardsCurve);
    }

    function renderRLChart(rewards) {
        const ctx = document.getElementById("rlChartCanvas");
        if (!ctx) return;

        if (rlTrainingChart) rlTrainingChart.destroy();

        rlTrainingChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: rewards.map((_, i) => `Ep ${i + 1}`),
                datasets: [{
                    label: "Average Reward per Round",
                    data: rewards.map(r => r.toFixed(2)),
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: "#94a3b8" } }
                },
                scales: {
                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#64748b" } },
                    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#64748b" } }
                }
            }
        });
    }

    // ==========================================
    // 7. Custom Matrix Sandbox & Payoff Space
    // ==========================================
    const btnAnalyzeMatrix = document.getElementById("btnAnalyzeMatrix");
    const sandboxInputs = document.querySelectorAll(".sandbox-val");

    if (btnAnalyzeMatrix) {
        btnAnalyzeMatrix.addEventListener("click", () => {
            soundFX.click();
            analyzeSandboxMatrix();
        });
    }

    sandboxInputs.forEach(input => {
        input.addEventListener("input", analyzeSandboxMatrix);
    });

    function analyzeSandboxMatrix() {
        const r00_1 = parseFloat(document.getElementById("sb_r00_1")?.value) || 0;
        const r00_2 = parseFloat(document.getElementById("sb_r00_2")?.value) || 0;
        const r01_1 = parseFloat(document.getElementById("sb_r01_1")?.value) || 0;
        const r01_2 = parseFloat(document.getElementById("sb_r01_2")?.value) || 0;
        const r10_1 = parseFloat(document.getElementById("sb_r10_1")?.value) || 0;
        const r10_2 = parseFloat(document.getElementById("sb_r10_2")?.value) || 0;
        const r11_1 = parseFloat(document.getElementById("sb_r11_1")?.value) || 0;
        const r11_2 = parseFloat(document.getElementById("sb_r11_2")?.value) || 0;

        const R = [[r00_1, r01_1], [r10_1, r11_1]];
        const C = [[r00_2, r01_2], [r10_2, r11_2]];

        const solution = NashSolver.solve2x2(R, C, ["Action A", "Action B"], ["Action A", "Action B"]);

        // Render summary
        const out = document.getElementById("sandboxResults");
        if (out) {
            let pureText = solution.pureEquilibria.length > 0
                ? solution.pureEquilibria.map(e => `(${e.actionP1}, ${e.actionP2}) with payoffs (${e.payoffP1}, ${e.payoffP2})`).join("<br>")
                : "None (Cycle / Zero-Sum)";

            let mixedText = solution.mixedEquilibrium
                ? `P1: ${(solution.mixedEquilibrium.p1_prob0 * 100).toFixed(1)}% Act A, ${(solution.mixedEquilibrium.p1_prob1 * 100).toFixed(1)}% Act B<br>P2: ${(solution.mixedEquilibrium.p2_prob0 * 100).toFixed(1)}% Act A, ${(solution.mixedEquilibrium.p2_prob1 * 100).toFixed(1)}% Act B`
                : "None";

            let paretoText = solution.pareto.map(p => `(${p.a1}, ${p.a2}) &rarr; (${p.u1}, ${p.u2})`).join(", ");

            out.innerHTML = `
                <div style="margin-bottom:0.8rem;"><strong>Pure Nash:</strong> ${pureText}</div>
                <div style="margin-bottom:0.8rem;"><strong>Mixed Nash:</strong> ${mixedText}</div>
                <div style="margin-bottom:0.8rem;"><strong>Pareto Optimal:</strong> ${paretoText}</div>
                <div><strong>Dominance:</strong> P1: ${solution.dominantP1.type} (${solution.dominantP1.action}) | P2: ${solution.dominantP2.type} (${solution.dominantP2.action})</div>
            `;
        }

        // Render Payoff Geometry Scatter
        renderPayoffSpaceChart([
            { x: r00_1, y: r00_2, label: "(A, A)" },
            { x: r01_1, y: r01_2, label: "(A, B)" },
            { x: r10_1, y: r10_2, label: "(B, A)" },
            { x: r11_1, y: r11_2, label: "(B, B)" }
        ]);
    }

    function renderPayoffSpaceChart(points) {
        const ctx = document.getElementById("payoffSpaceCanvas");
        if (!ctx) return;

        if (payoffSpaceChart) payoffSpaceChart.destroy();

        payoffSpaceChart = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: [{
                    label: "Outcome Payoffs (u1, u2)",
                    data: points,
                    backgroundColor: "#00f2fe",
                    borderColor: "#fff",
                    pointRadius: 8,
                    pointHoverRadius: 11
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const pt = points[context.dataIndex];
                                return `${pt.label}: P1=${pt.x}, P2=${pt.y}`;
                            }
                        }
                    },
                    legend: { labels: { color: "#94a3b8" } }
                },
                scales: {
                    x: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#64748b" },
                        title: { display: true, text: "Player 1 Payoff", color: "#00f2fe" }
                    },
                    y: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#64748b" },
                        title: { display: true, text: "Player 2 Payoff", color: "#ff0054" }
                    }
                }
            }
        });
    }

    // ==========================================
    // Initial Boot
    // ==========================================
    renderScenarioStrip();
    selectScenario("prisoners_dilemma");
    setTimeout(() => {
        if (spatialArena) spatialArena.initGrid("random_soup");
    }, 100);
});
