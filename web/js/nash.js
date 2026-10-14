/**
 * Nash Equilibrium & Game Theory Matrix Solver in JavaScript
 * Computes:
 * - Pure Strategy Nash Equilibria
 * - Mixed Strategy Nash Equilibria (indifference principle)
 * - Dominant Strategies (Strict / Weak)
 * - Pareto Optimal Set
 */

class NashSolver {
    /**
     * Solves a 2x2 normal-form game.
     * @param {Array<Array<number>>} R - 2x2 payoffs for Player 1 (Row)
     * @param {Array<Array<number>>} C - 2x2 payoffs for Player 2 (Col)
     * @param {Array<string>} actionsP1 - [Action 0, Action 1]
     * @param {Array<string>} actionsP2 - [Action 0, Action 1]
     */
    static solve2x2(R, C, actionsP1 = ["Action 1", "Action 2"], actionsP2 = ["Action 1", "Action 2"]) {
        // 1. Pure Nash Equilibria
        const pureEquilibria = [];
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const isRBest = R[r][c] >= R[1 - r][c];
                const isCBest = C[r][c] >= C[r][1 - c];
                if (isRBest && isCBest) {
                    pureEquilibria.push({
                        row: r,
                        col: c,
                        actionP1: actionsP1[r],
                        actionP2: actionsP2[c],
                        payoffP1: R[r][c],
                        payoffP2: C[r][c]
                    });
                }
            }
        }

        // 2. Mixed Nash Equilibrium
        // Player 1 plays action 0 with prob p, action 1 with prob 1-p
        // Player 2 plays action 0 with prob q, action 1 with prob 1-q
        // For Player 2 to be indifferent between col 0 and col 1:
        // p * C[0][0] + (1-p) * C[1][0] = p * C[0][1] + (1-p) * C[1][1]
        const denomP = (C[0][0] - C[1][0] - C[0][1] + C[1][1]);
        let pStar = null;
        if (Math.abs(denomP) > 1e-9) {
            const valP = (C[1][1] - C[1][0]) / denomP;
            if (valP > 0 && valP < 1) {
                pStar = valP;
            }
        }

        // For Player 1 to be indifferent between row 0 and row 1:
        // q * R[0][0] + (1-q) * R[0][1] = q * R[1][0] + (1-q) * R[1][1]
        const denomQ = (R[0][0] - R[0][1] - R[1][0] + R[1][1]);
        let qStar = null;
        if (Math.abs(denomQ) > 1e-9) {
            const valQ = (R[1][1] - R[0][1]) / denomQ;
            if (valQ > 0 && valQ < 1) {
                qStar = valQ;
            }
        }

        let mixedEquilibrium = null;
        if (pStar !== null && qStar !== null) {
            const expR = pStar * qStar * R[0][0] + pStar * (1 - qStar) * R[0][1] +
                         (1 - pStar) * qStar * R[1][0] + (1 - pStar) * (1 - qStar) * R[1][1];
            const expC = pStar * qStar * C[0][0] + pStar * (1 - qStar) * C[0][1] +
                         (1 - pStar) * qStar * C[1][0] + (1 - pStar) * (1 - qStar) * C[1][1];

            mixedEquilibrium = {
                p1_prob0: pStar,
                p1_prob1: 1 - pStar,
                p2_prob0: qStar,
                p2_prob1: 1 - qStar,
                expectedP1: expR,
                expectedP2: expC
            };
        }

        // 3. Dominant Strategies
        const dominantP1 = this._checkDominance(R[0][0], R[0][1], R[1][0], R[1][1], actionsP1);
        const dominantP2 = this._checkDominance(C[0][0], C[1][0], C[0][1], C[1][1], actionsP2);

        // 4. Pareto Optimal Outcomes
        const allOutcomes = [
            { row: 0, col: 0, u1: R[0][0], u2: C[0][0], a1: actionsP1[0], a2: actionsP2[0] },
            { row: 0, col: 1, u1: R[0][1], u2: C[0][1], a1: actionsP1[0], a2: actionsP2[1] },
            { row: 1, col: 0, u1: R[1][0], u2: C[1][0], a1: actionsP1[1], a2: actionsP2[0] },
            { row: 1, col: 1, u1: R[1][1], u2: C[1][1], a1: actionsP1[1], a2: actionsP2[1] }
        ];

        const pareto = [];
        for (const candidate of allOutcomes) {
            let dominated = false;
            for (const other of allOutcomes) {
                if (candidate === other) continue;
                if ((other.u1 >= candidate.u1 && other.u2 >= candidate.u2) &&
                    (other.u1 > candidate.u1 || other.u2 > candidate.u2)) {
                    dominated = true;
                    break;
                }
            }
            if (!dominated) pareto.push(candidate);
        }

        return {
            pureEquilibria,
            mixedEquilibrium,
            dominantP1,
            dominantP2,
            pareto
        };
    }

    static _checkDominance(u00, u01, u10, u11, actions) {
        // Action 0 dominates Action 1 if u00 >= u10 and u01 >= u11
        if (u00 > u10 && u01 > u11) return { action: actions[0], type: "Strictly Dominant" };
        if (u00 >= u10 && u01 >= u11 && (u00 > u10 || u01 > u11)) return { action: actions[0], type: "Weakly Dominant" };

        if (u10 > u00 && u11 > u01) return { action: actions[1], type: "Strictly Dominant" };
        if (u10 >= u00 && u11 >= u01 && (u10 > u00 || u11 > u01)) return { action: actions[1], type: "Weakly Dominant" };

        return { action: "None", type: "No Dominant Strategy" };
    }
}

window.NashSolver = NashSolver;
