"""
Game Theory Agent Architectures:
- Tabular Q-Learning Agent
- PyTorch Deep Q-Network (DQN) Agent
- Rule-based Strategies (Axelrod Classic Suite)
- Population Replicator Dynamics (Evolutionary Game Theory)
"""

import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
from typing import List, Dict, Any, Tuple

# ==========================================
# 1. Base Strategy Interface
# ==========================================

class Strategy:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.history = []  # List of tuples: (my_action, opp_action)
        self.total_score = 0
        
    def reset(self):
        self.history = []
        self.total_score = 0
        
    def act(self, round_num: int, noise_prob: float = 0.0) -> int:
        """
        Returns action index: 0 for Cooperate / Action A, 1 for Defect / Action B.
        Applies trembling-hand noise if noise_prob > 0.
        """
        raw_act = self._decide(round_num)
        if noise_prob > 0 and random.random() < noise_prob:
            return 1 - raw_act
        return raw_act
        
    def _decide(self, round_num: int) -> int:
        raise NotImplementedError
        
    def update(self, my_act: int, opp_act: int, payoff: float):
        self.history.append((my_act, opp_act))
        self.total_score += payoff


# ==========================================
# 2. Classic Rule-Based Strategies
# ==========================================

class AlwaysCooperate(Strategy):
    def __init__(self):
        super().__init__("Always Cooperate", "Pure altruist: always cooperates, regardless of opponent behavior.")
    def _decide(self, round_num: int) -> int:
        return 0

class AlwaysDefect(Strategy):
    def __init__(self):
        super().__init__("Always Defect", "Pure egoist: always defects. Exploit naive cooperators.")
    def _decide(self, round_num: int) -> int:
        return 1

class TitForTat(Strategy):
    def __init__(self):
        super().__init__("Tit-For-Tat", "Anatol Rapoport's legendary strategy. Cooperates on round 1, then copies the opponent's previous move.")
    def _decide(self, round_num: int) -> int:
        if round_num == 0 or len(self.history) == 0:
            return 0
        return self.history[-1][1]

class GrimTrigger(Strategy):
    def __init__(self):
        super().__init__("Grim Trigger", "Starts cooperative, but if the opponent ever defects even once, it defects forever (infinite retaliation).")
        self.triggered = False
    def reset(self):
        super().reset()
        self.triggered = False
    def _decide(self, round_num: int) -> int:
        if self.triggered:
            return 1
        if len(self.history) > 0 and self.history[-1][1] == 1:
            self.triggered = True
            return 1
        return 0

class Pavlov(Strategy):
    def __init__(self):
        super().__init__("Pavlov (Win-Stay, Lose-Shift)", "Repeats previous move if it received a high payoff (R or T); switches move if it received a low payoff (P or S).")
    def _decide(self, round_num: int) -> int:
        if round_num == 0 or len(self.history) == 0:
            return 0
        last_my, last_opp = self.history[-1]
        # In standard PD: (0,0)->Reward(win), (1,0)->Temptation(win), (0,1)->Sucker(lose), (1,1)->Punishment(lose)
        # Win condition: agreement on action (both coop 0,0 or both defect 1,1) -> repeat!
        # If both agreed (0,0 or 1,1), stay with 0.
        if (last_my == 0 and last_opp == 0) or (last_my == 1 and last_opp == 0):
            return last_my
        else:
            return 1 - last_my

class GenerousTitForTat(Strategy):
    def __init__(self, forgiveness: float = 0.25):
        super().__init__("Generous TFT", "Like Tit-for-Tat, but occasionally forgives defections to prevent endless retaliatory death-spirals under noise.")
        self.forgiveness = forgiveness
    def _decide(self, round_num: int) -> int:
        if round_num == 0 or len(self.history) == 0:
            return 0
        if self.history[-1][1] == 1:
            return 0 if random.random() < self.forgiveness else 1
        return 0

class RandomStrategy(Strategy):
    def __init__(self):
        super().__init__("Random / Noise", "Flips a fair 50/50 coin on every round. Unpredictable.")
    def _decide(self, round_num: int) -> int:
        return 0 if random.random() < 0.5 else 1

class Detective(Strategy):
    def __init__(self):
        super().__init__("Detective", "Tests opponent with [Coop, Defect, Coop, Coop]. If opponent never retaliates, exploits them forever; otherwise plays Tit-For-Tat.")
        self.exploiting = False
        self.probed = False
    def reset(self):
        super().reset()
        self.exploiting = False
        self.probed = False
    def _decide(self, round_num: int) -> int:
        probe = [0, 1, 0, 0]
        if round_num < 4:
            return probe[round_num]
        if not self.probed:
            # check if opponent ever defected in the first 4 rounds
            opp_defected = any(h[1] == 1 for h in self.history[:4])
            self.exploiting = not opp_defected
            self.probed = True
        if self.exploiting:
            return 1
        return self.history[-1][1]


# ==========================================
# 3. Tabular Q-Learning Agent (Reinforcement Learning)
# ==========================================

class QLearningAgent(Strategy):
    """
    Q-Learning Agent observing state = (last_k_my_moves, last_k_opp_moves).
    Learns state-action value Q(s, a) via Bellman Equation:
    Q(s, a) <- Q(s, a) + alpha * [reward + gamma * max_a' Q(s', a') - Q(s, a)]
    """
    def __init__(self, memory_len: int = 1, alpha: float = 0.15, gamma: float = 0.9, epsilon: float = 0.1):
        super().__init__("Tabular Q-Learner", "Reinforcement Learning agent learning optimal policy through temporal-difference Bellman updates.")
        self.memory_len = memory_len
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.q_table = {}  # state tuple -> np.array([q0, q1])
        self.last_state = None
        self.last_action = None

    def get_state(self) -> Tuple:
        if len(self.history) < self.memory_len:
            pad = [(-1, -1)] * (self.memory_len - len(self.history))
            return tuple(pad + self.history)
        return tuple(self.history[-self.memory_len:])

    def _decide(self, round_num: int) -> int:
        state = self.get_state()
        if state not in self.q_table:
            self.q_table[state] = np.zeros(2, dtype=float)
            
        if random.random() < self.epsilon:
            action = random.choice([0, 1])
        else:
            action = int(np.argmax(self.q_table[state]))
            
        self.last_state = state
        self.last_action = action
        return action

    def update(self, my_act: int, opp_act: int, payoff: float):
        super().update(my_act, opp_act, payoff)
        if self.last_state is not None and self.last_action is not None:
            new_state = self.get_state()
            if new_state not in self.q_table:
                self.q_table[new_state] = np.zeros(2, dtype=float)
            best_future_q = np.max(self.q_table[new_state])
            td_target = payoff + self.gamma * best_future_q
            td_error = td_target - self.q_table[self.last_state][self.last_action]
            self.q_table[self.last_state][self.last_action] += self.alpha * td_error


# ==========================================
# 4. PyTorch Deep Q-Network (DQN) Agent (Deep Learning)
# ==========================================

class DQNNetwork(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 32, output_dim: int = 2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
    def forward(self, x):
        return self.net(x)

class DQNAgent(Strategy):
    """
    Deep Q-Network Agent using PyTorch neural network to approximate Q(s, a)
    with experience replay buffer and target network.
    """
    def __init__(self, memory_len: int = 3, lr: float = 0.005, gamma: float = 0.95, epsilon: float = 0.15):
        super().__init__("Deep Q-Network (DQN)", "Deep Reinforcement Learning agent with multi-layer neural network and experience replay.")
        self.memory_len = memory_len
        self.gamma = gamma
        self.epsilon = epsilon
        # Input dimension: memory_len * 2 moves, one-hot encoded or numeric
        self.input_dim = memory_len * 2
        self.policy_net = DQNNetwork(self.input_dim, hidden_dim=32, output_dim=2)
        self.target_net = DQNNetwork(self.input_dim, hidden_dim=32, output_dim=2)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=lr)
        self.criterion = nn.MSELoss()
        self.replay_buffer = deque(maxlen=2000)
        self.batch_size = 32
        self.train_step = 0
        self.last_state_tensor = None
        self.last_action = None

    def _state_to_tensor(self) -> torch.Tensor:
        feat = []
        for i in range(self.memory_len):
            idx = len(self.history) - 1 - i
            if idx >= 0:
                feat.extend([float(self.history[idx][0]), float(self.history[idx][1])])
            else:
                feat.extend([0.5, 0.5])
        return torch.tensor(feat, dtype=torch.float32)

    def _decide(self, round_num: int) -> int:
        state_t = self._state_to_tensor()
        self.last_state_tensor = state_t
        if random.random() < self.epsilon:
            act = random.choice([0, 1])
        else:
            with torch.no_grad():
                q_vals = self.policy_net(state_t.unsqueeze(0))
                act = int(torch.argmax(q_vals).item())
        self.last_action = act
        return act

    def update(self, my_act: int, opp_act: int, payoff: float):
        super().update(my_act, opp_act, payoff)
        if self.last_state_tensor is not None and self.last_action is not None:
            next_state_t = self._state_to_tensor()
            self.replay_buffer.append((self.last_state_tensor, self.last_action, payoff, next_state_t))
            self._train_step()

    def _train_step(self):
        if len(self.replay_buffer) < self.batch_size:
            return
        batch = random.sample(self.replay_buffer, self.batch_size)
        states, actions, rewards, next_states = zip(*batch)
        
        states_t = torch.stack(states)
        actions_t = torch.tensor(actions, dtype=torch.int64).unsqueeze(1)
        rewards_t = torch.tensor(rewards, dtype=torch.float32).unsqueeze(1)
        next_states_t = torch.stack(next_states)
        
        # Compute Q(s, a)
        current_q = self.policy_net(states_t).gather(1, actions_t)
        
        # Compute target: r + gamma * max Q_target(s')
        with torch.no_grad():
            max_next_q = self.target_net(next_states_t).max(1)[0].unsqueeze(1)
            target_q = rewards_t + self.gamma * max_next_q
            
        loss = self.criterion(current_q, target_q)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        self.train_step += 1
        if self.train_step % 20 == 0:
            self.target_net.load_state_dict(self.policy_net.state_dict())


STRATEGY_MAP = {
    "tit_for_tat": lambda: TitForTat(),
    "always_cooperate": lambda: AlwaysCooperate(),
    "always_defect": lambda: AlwaysDefect(),
    "grim_trigger": lambda: GrimTrigger(),
    "pavlov": lambda: Pavlov(),
    "generous_tft": lambda: GenerousTitForTat(forgiveness=0.25),
    "random": lambda: RandomStrategy(),
    "detective": lambda: Detective(),
    "q_learner": lambda: QLearningAgent(alpha=0.2, gamma=0.9, epsilon=0.1),
    "dqn_agent": lambda: DQNAgent(memory_len=2, lr=0.01, gamma=0.9, epsilon=0.1)
}


import copy

def play_match(p1: Strategy, p2: Strategy, payoff_matrix: np.ndarray, rounds: int = 100, noise: float = 0.0, inplace: bool = False) -> Tuple[float, float, List[Dict[str, Any]]]:
    """
    Simulates a match between two strategies over a specified number of rounds.
    Payoff matrix shape (2, 2, 2): payoff_matrix[act1, act2] -> [u1, u2].
    """
    if inplace:
        agent1 = p1
        agent2 = copy.deepcopy(p2) if p1 is p2 else p2
    else:
        agent1 = copy.deepcopy(p1)
        agent2 = copy.deepcopy(p2)
        
    agent1.reset()
    agent2.reset()
    round_log = []
    
    for r in range(rounds):
        a1 = agent1.act(r, noise_prob=noise)
        a2 = agent2.act(r, noise_prob=noise)
        
        u1, u2 = payoff_matrix[a1, a2]
        agent1.update(a1, a2, u1)
        agent2.update(a2, a1, u2)
        
        round_log.append({
            "round": r + 1,
            "p1_act": a1,
            "p2_act": a2,
            "p1_payoff": float(u1),
            "p2_payoff": float(u2)
        })
        
    return agent1.total_score, agent2.total_score, round_log


def run_round_robin_tournament(strategies: List[Strategy], payoff_matrix: np.ndarray, rounds: int = 100, noise: float = 0.0):
    """
    Executes a complete round-robin tournament among all registered strategies.
    Returns tournament table, rank, and pairwise head-to-head matrix.
    """
    n = len(strategies)
    scores = np.zeros(n)
    pairwise = np.zeros((n, n))
    
    for i in range(n):
        for j in range(i, n):
            # Play i against j
            s1, s2, _ = play_match(strategies[i], strategies[j], payoff_matrix, rounds=rounds, noise=noise)
            if i == j:
                # Self-play: score recorded once
                scores[i] += s1
                pairwise[i, j] = s1 / rounds
            else:
                scores[i] += s1
                scores[j] += s2
                pairwise[i, j] = s1 / rounds
                pairwise[j, i] = s2 / rounds
                
    results = []
    for i in range(n):
        results.append({
            "rank": 0,
            "name": strategies[i].name,
            "description": strategies[i].description,
            "total_score": float(scores[i]),
            "avg_per_round": float(scores[i] / (rounds * n))
        })
    results.sort(key=lambda x: x["total_score"], reverse=True)
    for idx, r in enumerate(results):
        r["rank"] = idx + 1
        
    return {
        "leaderboard": results,
        "pairwise_matrix": pairwise.tolist(),
        "strategy_names": [s.name for s in strategies]
    }


def simulate_replicator_dynamics(payoff_matrix_strategies: np.ndarray, initial_proportions: np.ndarray, generations: int = 50) -> List[List[float]]:
    """
    Evolutionary Game Theory: Replicator Dynamics
    x_i(t+1) = x_i(t) * (f_i(t) / f_avg(t))
    where f_i is the fitness of strategy i against current population distribution.
    """
    x = np.array(initial_proportions, dtype=float)
    x = x / np.sum(x)
    history = [x.tolist()]
    
    for _ in range(generations):
        fitness = np.dot(payoff_matrix_strategies, x)
        # Shift fitness to be strictly positive if necessary
        min_fit = np.min(fitness)
        if min_fit <= 0:
            fitness = fitness - min_fit + 1.0
        avg_fitness = np.dot(x, fitness)
        if avg_fitness <= 1e-9:
            break
        x = x * (fitness / avg_fitness)
        x = x / np.sum(x)  # normalize
        history.append(x.tolist())
        
    return history
