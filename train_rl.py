"""
Standalone PyTorch Deep Q-Network (DQN) Training Script
Trains a Deep RL neural agent on the Iterated Prisoner's Dilemma
against various classic Axelrod strategies and tracks learning progress.
"""

import os
import sys
import numpy as np
import torch

# Ensure python directory is in path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "python"))

from models import (
    DQNAgent, AlwaysCooperate, AlwaysDefect, TitForTat, Pavlov,
    play_match, STRATEGY_MAP
)

def run_experiment(opponent_name="tit_for_tat", episodes=100, rounds_per_ep=30):
    print("=" * 60)
    print(f" Training PyTorch DQN Agent against: {opponent_name.upper()}")
    print("=" * 60)
    
    dqn = DQNAgent(memory_len=2, lr=0.005, gamma=0.95, epsilon=0.4)
    payoff_matrix = np.array([[[3.0, 3.0], [0.0, 5.0]], [[5.0, 0.0], [1.0, 1.0]]])
    
    epsilon = 0.4
    rewards = []
    
    for ep in range(episodes):
        opp = STRATEGY_MAP[opponent_name]()
        dqn.epsilon = epsilon
        s1, s2, log = play_match(dqn, opp, payoff_matrix, rounds=rounds_per_ep, inplace=True)
        avg_reward = s1 / rounds_per_ep
        rewards.append(avg_reward)
        
        if (ep + 1) % 10 == 0 or ep == episodes - 1:
            recent_avg = np.mean(rewards[-10:])
            print(f" Episode {ep + 1:3d}/{episodes} | Avg Payoff: {avg_reward:.2f} | 10-Ep Rolling Mean: {recent_avg:.2f} | Epsilon: {epsilon:.2f}")
            
        epsilon = max(0.05, epsilon * 0.97)
        
    print("\n[+] Training Complete.")
    print(f"[+] Final Replay Buffer Size: {len(dqn.replay_buffer)}")
    print(f"[+] Final 10-episode mean score: {np.mean(rewards[-10:]):.2f} / round")
    return rewards

if __name__ == "__main__":
    opp = sys.argv[1] if len(sys.argv) > 1 else "tit_for_tat"
    eps = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    run_experiment(opp, episodes=eps)
