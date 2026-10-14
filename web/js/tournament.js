/**
 * Axelrod Tournament & Evolutionary Replicator Dynamics
 */

class AxelrodTournament {
    static runTournament(strategies, payoffMatrix, rounds = 100, noise = 0) {
        const n = strategies.length;
        const totalScores = new Array(n).fill(0);
        const pairwiseMatrix = Array.from({ length: n }, () => new Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                const s1 = strategies[i].clone();
                const s2 = strategies[j].clone();
                const match = GameEngine.runMatch(s1, s2, payoffMatrix, rounds, noise);

                if (i === j) {
                    totalScores[i] += match.p1Score;
                    pairwiseMatrix[i][j] = match.p1Score / rounds;
                } else {
                    totalScores[i] += match.p1Score;
                    totalScores[j] += match.p2Score;
                    pairwiseMatrix[i][j] = match.p1Score / rounds;
                    pairwiseMatrix[j][i] = match.p2Score / rounds;
                }
            }
        }

        const leaderboard = strategies.map((strat, idx) => ({
            rank: 0,
            id: strat.id,
            name: strat.name,
            icon: strat.icon,
            color: strat.color,
            description: strat.description,
            totalScore: Math.round(totalScores[idx]),
            avgPerRound: +(totalScores[idx] / (rounds * n)).toFixed(2)
        }));

        leaderboard.sort((a, b) => b.totalScore - a.totalScore);
        leaderboard.forEach((item, idx) => item.rank = idx + 1);

        return {
            leaderboard,
            pairwiseMatrix,
            strategyNames: strategies.map(s => s.name),
            strategyColors: strategies.map(s => s.color),
            strategyIcons: strategies.map(s => s.icon)
        };
    }

    /**
     * Evolutionary Game Theory: Replicator Dynamics Simulation
     * dx_i / dt = x_i * (f_i - f_avg)
     */
    static runReplicatorDynamics(pairwiseMatrix, initialProportions, generations = 50) {
        const n = initialProportions.length;
        let x = [...initialProportions];
        const sum = x.reduce((a, b) => a + b, 0);
        x = x.map(val => val / (sum || 1));

        const history = [[...x]];

        for (let g = 0; g < generations; g++) {
            const fitness = new Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    fitness[i] += pairwiseMatrix[i][j] * x[j];
                }
            }

            // Shift fitness if negative values exist
            const minFit = Math.min(...fitness);
            const shiftedFit = fitness.map(f => (minFit <= 0 ? f - minFit + 1.0 : f));

            let avgFitness = 0;
            for (let i = 0; i < n; i++) {
                avgFitness += x[i] * shiftedFit[i];
            }

            if (avgFitness < 1e-9) break;

            const nextX = new Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                nextX[i] = x[i] * (shiftedFit[i] / avgFitness);
            }

            const nextSum = nextX.reduce((a, b) => a + b, 0);
            x = nextX.map(v => v / (nextSum || 1));
            history.push([...x]);
        }

        return history;
    }
}

window.AxelrodTournament = AxelrodTournament;
