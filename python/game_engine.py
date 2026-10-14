"""
Game Theory Simulation Engine & Test Cases
Contains core logic for standard matrix games, payoff structures,
Nash Equilibrium computation, and classic strategies.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional

# Standard Games Definition
GAMES = {
    "prisoners_dilemma": {
        "name": "Prisoner's Dilemma",
        "description": "Two suspects are interrogated. Mutual cooperation yields a fair outcome, but individual temptation encourages betrayal, leading to a collectively worse outcome (Pareto-suboptimal Nash Equilibrium).",
        "actions": ["Cooperate", "Defect"],
        "matrix": {
            ("Cooperate", "Cooperate"): (3, 3),
            ("Cooperate", "Defect"): (0, 5),
            ("Defect", "Cooperate"): (5, 0),
            ("Defect", "Defect"): (1, 1),
        },
        "details": "R=3 (Reward), T=5 (Temptation), S=0 (Sucker's payoff), P=1 (Punishment). T > R > P > S and 2R > T + S."
    },
    "hawk_dove": {
        "name": "Hawk-Dove / Chicken Game",
        "description": "Two competitors dispute a shared resource. Hawks fight fiercely; Doves share peacefully. If both are Hawks, disaster strikes (-10, -10). The key is brinkmanship and anti-coordination.",
        "actions": ["Dove (Swerve)", "Hawk (Stay)"],
        "matrix": {
            ("Dove (Swerve)", "Dove (Swerve)"): (3, 3),
            ("Dove (Swerve)", "Hawk (Stay)"): (1, 5),
            ("Hawk (Stay)", "Dove (Swerve)"): (5, 1),
            ("Hawk (Stay)", "Hawk (Stay)"): (-10, -10),
        },
        "details": "Two pure Nash equilibria: (Hawk, Dove) and (Dove, Hawk). Plus one mixed Nash equilibrium."
    },
    "stag_hunt": {
        "name": "Stag Hunt (Coordination & Social Trust)",
        "description": "Two hunters can cooperate to hunt a high-value Stag, or independently hunt a low-risk Hare. Trusting each other yields the best payoff, but distrust leads to hunting Hare safely.",
        "actions": ["Hunt Stag", "Hunt Hare"],
        "matrix": {
            ("Hunt Stag", "Hunt Stag"): (5, 5),
            ("Hunt Stag", "Hunt Hare"): (0, 3),
            ("Hunt Hare", "Hunt Stag"): (3, 0),
            ("Hunt Hare", "Hunt Hare"): (3, 3),
        },
        "details": "(Stag, Stag) is Payoff-Dominant; (Hare, Hare) is Risk-Dominant."
    },
    "battle_of_sexes": {
        "name": "Battle of the Sexes / Bach or Stravinsky",
        "description": "Two partners want to spend the evening together, but have different preferences for Opera vs Football. Being together is preferred over being apart, requiring coordination.",
        "actions": ["Option A (Opera)", "Option B (Football)"],
        "matrix": {
            ("Option A (Opera)", "Option A (Opera)"): (3, 2),
            ("Option A (Opera)", "Option B (Football)"): (0, 0),
            ("Option B (Football)", "Option A (Opera)"): (0, 0),
            ("Option B (Football)", "Option B (Football)"): (2, 3),
        },
        "details": "Two pure Nash equilibria: (A, A) and (B, B). Mixed strategy equilibrium exists."
    },
    "matching_pennies": {
        "name": "Matching Pennies (Zero-Sum)",
        "description": "Player 1 wants matching sides (Heads-Heads or Tails-Tails), Player 2 wants mismatching sides. Pure zero-sum conflict with NO pure strategy Nash equilibrium.",
        "actions": ["Heads", "Tails"],
        "matrix": {
            ("Heads", "Heads"): (1, -1),
            ("Heads", "Tails"): (-1, 1),
            ("Tails", "Heads"): (-1, 1),
            ("Tails", "Tails"): (1, -1),
        },
        "details": "Pure conflict. Unique Nash equilibrium is mixed: (50% Heads, 50% Tails) for both players."
    },
    "public_goods": {
        "name": "Tragedy of the Commons / Public Goods",
        "description": "Players decide how much to contribute to a shared common pool, which gets multiplied by a bonus factor and redistributed equally. Free riders benefit without paying.",
        "actions": ["Contribute Full", "Keep (Free Ride)"],
        "matrix": {
            ("Contribute Full", "Contribute Full"): (4, 4),
            ("Contribute Full", "Keep (Free Ride)"): (1, 6),
            ("Keep (Free Ride)", "Contribute Full"): (6, 1),
            ("Keep (Free Ride)", "Keep (Free Ride)"): (2, 2),
        },
        "details": "Free riding is individually dominant, but collective cooperation maximizes social welfare."
    }
}


def compute_nash_equilibrium_2x2(matrix_dict: Dict[Tuple[str, str], Tuple[float, float]], actions: List[str]):
    """
    Computes Pure and Mixed Nash Equilibria for any 2x2 normal-form game.
    Actions: [A1, A2] for Player 1 (rows) and Player 2 (columns).
    Returns dict with pure_equilibria and mixed_equilibrium.
    """
    a1, a2 = actions[0], actions[1]
    
    # Payoff matrices
    # Row player payoffs
    R = np.array([
        [matrix_dict[(a1, a1)][0], matrix_dict[(a1, a2)][0]],
        [matrix_dict[(a2, a1)][0], matrix_dict[(a2, a2)][0]]
    ], dtype=float)
    
    # Column player payoffs
    C = np.array([
        [matrix_dict[(a1, a1)][1], matrix_dict[(a1, a2)][1]],
        [matrix_dict[(a2, a1)][1], matrix_dict[(a2, a2)][1]]
    ], dtype=float)
    
    # 1. Pure Nash Equilibria
    pure_eq = []
    for r in range(2):
        for c in range(2):
            # Check if r is best response to c for Player 1
            is_r_best = (R[r, c] >= R[1 - r, c])
            # Check if c is best response to r for Player 2
            is_c_best = (C[r, c] >= C[r, 1 - c])
            if is_r_best and is_c_best:
                pure_eq.append({
                    "action_p1": actions[r],
                    "action_p2": actions[c],
                    "payoff_p1": float(R[r, c]),
                    "payoff_p2": float(C[r, c])
                })
                
    # 2. Mixed Nash Equilibrium
    # Player 1 plays action 1 with prob p, action 2 with prob 1-p
    # Player 2 plays action 1 with prob q, action 2 with prob 1-q
    # To make Player 2 indifferent:
    # Expected payoff for P2 playing a1 = q_not: p*C[0,0] + (1-p)*C[1,0]
    # Expected payoff for P2 playing a2 = p*C[0,1] + (1-p)*C[1,1]
    # p*(C[0,0] - C[1,0] - C[0,1] + C[1,1]) = C[1,1] - C[1,0]
    denom_p = (C[0, 0] - C[1, 0] - C[0, 1] + C[1, 1])
    p_star = None
    if abs(denom_p) > 1e-9:
        val_p = (C[1, 1] - C[1, 0]) / denom_p
        if 0 < val_p < 1:
            p_star = float(val_p)
            
    denom_q = (R[0, 0] - R[0, 1] - R[1, 0] + R[1, 1])
    q_star = None
    if abs(denom_q) > 1e-9:
        val_q = (R[1, 1] - R[0, 1]) / denom_q
        if 0 < val_q < 1:
            q_star = float(val_q)
            
    mixed_eq = None
    if p_star is not None and q_star is not None:
        mixed_eq = {
            "p1_prob_action0": round(p_star, 4),
            "p1_prob_action1": round(1 - p_star, 4),
            "p2_prob_action0": round(q_star, 4),
            "p2_prob_action1": round(1 - q_star, 4),
            "expected_payoff_p1": round(float(p_star * q_star * R[0, 0] + p_star * (1 - q_star) * R[0, 1] + (1 - p_star) * q_star * R[1, 0] + (1 - p_star) * (1 - q_star) * R[1, 1]), 4),
            "expected_payoff_p2": round(float(p_star * q_star * C[0, 0] + p_star * (1 - q_star) * C[0, 1] + (1 - p_star) * q_star * C[1, 0] + (1 - p_star) * (1 - q_star) * C[1, 1]), 4),
        }
        
    return {
        "pure_equilibria": pure_eq,
        "mixed_equilibrium": mixed_eq
    }


def find_pareto_optimal_outcomes(matrix_dict: Dict[Tuple[str, str], Tuple[float, float]], actions: List[str]):
    """
    Finds outcomes that are Pareto Optimal:
    An outcome is Pareto optimal if no other outcome improves one player's payoff without worsening the other's.
    """
    all_outcomes = []
    for a1 in actions:
        for a2 in actions:
            u1, u2 = matrix_dict[(a1, a2)]
            all_outcomes.append((a1, a2, u1, u2))
            
    pareto = []
    for candidate in all_outcomes:
        dominated = False
        for other in all_outcomes:
            if candidate == other:
                continue
            # other dominates candidate if other >= candidate in all and > in at least one
            if (other[2] >= candidate[2] and other[3] >= candidate[3]) and (other[2] > candidate[2] or other[3] > candidate[3]):
                dominated = True
                break
        if not dominated:
            pareto.append({
                "action_p1": candidate[0],
                "action_p2": candidate[1],
                "payoff_p1": candidate[2],
                "payoff_p2": candidate[3]
            })
    return pareto
