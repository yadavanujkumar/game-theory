"""
Unit & Integration Test Suite for Game Theory Simulation
Tests Nash Equilibrium solvers, Pareto optimality, strategies,
Q-learning, PyTorch DQN, and Replicator Dynamics.
"""

import unittest
import numpy as np
import torch
from game_engine import GAMES, compute_nash_equilibrium_2x2, find_pareto_optimal_outcomes
from models import (
    AlwaysCooperate, AlwaysDefect, TitForTat, GrimTrigger, Pavlov,
    GenerousTitForTat, RandomStrategy, Detective, QLearningAgent, DQNAgent,
    play_match, run_round_robin_tournament, simulate_replicator_dynamics
)

class TestGameTheoryEngine(unittest.TestCase):

    def test_prisoners_dilemma_nash(self):
        """Verify Prisoner's Dilemma unique pure Nash equilibrium is (Defect, Defect)."""
        pd = GAMES["prisoners_dilemma"]
        res = compute_nash_equilibrium_2x2(pd["matrix"], pd["actions"])
        self.assertEqual(len(res["pure_equilibria"]), 1)
        eq = res["pure_equilibria"][0]
        self.assertEqual(eq["action_p1"], "Defect")
        self.assertEqual(eq["action_p2"], "Defect")
        self.assertEqual(eq["payoff_p1"], 1)
        self.assertEqual(eq["payoff_p2"], 1)

    def test_prisoners_dilemma_pareto(self):
        """Verify Pareto optimal outcomes in Prisoner's Dilemma."""
        pd = GAMES["prisoners_dilemma"]
        pareto = find_pareto_optimal_outcomes(pd["matrix"], pd["actions"])
        # (Coop, Coop) -> (3,3), (Coop, Defect) -> (0,5), (Defect, Coop) -> (5,0) are all Pareto optimal
        # (Defect, Defect) -> (1,1) is strictly dominated by (Coop, Coop) -> (3,3)
        pareto_tuples = set((p["action_p1"], p["action_p2"]) for p in pareto)
        self.assertIn(("Cooperate", "Cooperate"), pareto_tuples)
        self.assertIn(("Cooperate", "Defect"), pareto_tuples)
        self.assertIn(("Defect", "Cooperate"), pareto_tuples)
        self.assertNotIn(("Defect", "Defect"), pareto_tuples)

    def test_hawk_dove_equilibria(self):
        """Verify Hawk-Dove has 2 pure equilibria: (Hawk, Dove) and (Dove, Hawk)."""
        hd = GAMES["hawk_dove"]
        res = compute_nash_equilibrium_2x2(hd["matrix"], hd["actions"])
        pure_pairs = set((eq["action_p1"], eq["action_p2"]) for eq in res["pure_equilibria"])
        self.assertEqual(len(pure_pairs), 2)
        self.assertIn(("Hawk (Stay)", "Dove (Swerve)"), pure_pairs)
        self.assertIn(("Dove (Swerve)", "Hawk (Stay)"), pure_pairs)
        # And has a valid mixed strategy equilibrium
        self.assertIsNotNone(res["mixed_equilibrium"])
        p1_prob = res["mixed_equilibrium"]["p1_prob_action0"]
        self.assertTrue(0 < p1_prob < 1)

    def test_matching_pennies_zero_sum(self):
        """Matching pennies has no pure equilibrium, only mixed (0.5, 0.5)."""
        mp = GAMES["matching_pennies"]
        res = compute_nash_equilibrium_2x2(mp["matrix"], mp["actions"])
        self.assertEqual(len(res["pure_equilibria"]), 0)
        self.assertIsNotNone(res["mixed_equilibrium"])
        self.assertAlmostEqual(res["mixed_equilibrium"]["p1_prob_action0"], 0.5, places=2)
        self.assertAlmostEqual(res["mixed_equilibrium"]["p2_prob_action0"], 0.5, places=2)

    def test_tit_for_tat_behavior(self):
        """Verify Tit-For-Tat copies opponent move and cooperates with cooperator."""
        tft = TitForTat()
        coop = AlwaysCooperate()
        mat = np.array([[[3, 3], [0, 5]], [[5, 0], [1, 1]]])
        s1, s2, logs = play_match(tft, coop, mat, rounds=10)
        self.assertEqual(s1, 30)
        self.assertEqual(s2, 30)
        for log in logs:
            self.assertEqual(log["p1_act"], 0)
            self.assertEqual(log["p2_act"], 0)

    def test_grim_trigger_retaliation(self):
        """Verify Grim Trigger retaliates permanently after a defection."""
        gt = GrimTrigger()
        defect = AlwaysDefect()
        mat = np.array([[[3, 3], [0, 5]], [[5, 0], [1, 1]]])
        s1, s2, logs = play_match(gt, defect, mat, rounds=5)
        # Round 1: GT coops (0), Defect defects (1). Payoff GT=0, Defect=5.
        # Rounds 2-5: GT detects defection, plays 1. Payoffs: 1, 1.
        self.assertEqual(logs[0]["p1_act"], 0)
        self.assertEqual(logs[1]["p1_act"], 1)
        self.assertEqual(logs[2]["p1_act"], 1)
        self.assertEqual(s1, 0 + 1 * 4)

    def test_q_learning_agent(self):
        """Verify Tabular Q-Learning updates its Q-table values."""
        ql = QLearningAgent(memory_len=1, alpha=0.5, gamma=0.9, epsilon=0.0)
        defect = AlwaysDefect()
        mat = np.array([[[3, 3], [0, 5]], [[5, 0], [1, 1]]])
        s1, s2, _ = play_match(ql, defect, mat, rounds=50, inplace=True)
        self.assertGreater(len(ql.q_table), 0)

    def test_pytorch_dqn_agent(self):
        """Verify PyTorch DQN forward pass and training loop."""
        dqn = DQNAgent(memory_len=2, lr=0.01, gamma=0.9, epsilon=0.1)
        coop = AlwaysCooperate()
        mat = np.array([[[3, 3], [0, 5]], [[5, 0], [1, 1]]])
        s1, s2, logs = play_match(dqn, coop, mat, rounds=40, inplace=True)
        self.assertEqual(len(logs), 40)
        self.assertGreaterEqual(len(dqn.replay_buffer), 32)
        # Test state tensor shape
        sample_tensor = dqn._state_to_tensor()
        self.assertEqual(sample_tensor.shape[0], 4)

    def test_replicator_dynamics(self):
        """Verify replicator dynamics preserves sum of probabilities to 1."""
        payoff_matrix = np.array([
            [3.0, 0.0],
            [5.0, 1.0]
        ])
        initial_pop = [0.5, 0.5]
        history = simulate_replicator_dynamics(payoff_matrix, initial_pop, generations=20)
        self.assertEqual(len(history), 21)
        for pop in history:
            self.assertAlmostEqual(sum(pop), 1.0, places=4)

    def test_tournament(self):
        """Verify Round Robin tournament execution and leaderboard sorting."""
        strats = [AlwaysCooperate(), AlwaysDefect(), TitForTat()]
        mat = np.array([[[3, 3], [0, 5]], [[5, 0], [1, 1]]])
        res = run_round_robin_tournament(strats, mat, rounds=20)
        self.assertEqual(len(res["leaderboard"]), 3)
        self.assertEqual(res["leaderboard"][0]["rank"], 1)
        self.assertEqual(res["leaderboard"][1]["rank"], 2)
        self.assertEqual(res["leaderboard"][2]["rank"], 3)
        # AlwaysDefect typically scores highest in a small naive pool with Coop
        self.assertEqual(res["leaderboard"][0]["name"], "Always Defect")


if __name__ == "__main__":
    unittest.main()
