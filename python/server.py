"""
FastAPI Server for Game Theory Simulation Suite
Serves the web application and provides high-performance API endpoints for
Nash Equilibrium solving, AI / PyTorch DQN training, and Axelrod tournaments.
"""

import os
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from game_engine import GAMES, compute_nash_equilibrium_2x2, find_pareto_optimal_outcomes
from models import (
    AlwaysCooperate, AlwaysDefect, TitForTat, GrimTrigger, Pavlov,
    GenerousTitForTat, RandomStrategy, Detective, QLearningAgent, DQNAgent,
    play_match, run_round_robin_tournament, simulate_replicator_dynamics
)

app = FastAPI(title="Game Theory Simulator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registry of strategy constructors
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


class MatrixAnalysisRequest(BaseModel):
    actions_p1: List[str]
    actions_p2: List[str]
    payoffs_p1: List[List[float]]  # 2x2
    payoffs_p2: List[List[float]]  # 2x2


class MatchRequest(BaseModel):
    p1_strategy: str
    p2_strategy: str
    payoff_matrix: List[List[List[float]]]  # 2x2x2
    rounds: int = 100
    noise: float = 0.0


class TournamentRequest(BaseModel):
    strategies: List[str]
    payoff_matrix: List[List[List[float]]]
    rounds: int = 100
    noise: float = 0.0
    generations: int = 40


class TrainDQNRequest(BaseModel):
    opponent_strategy: str = "tit_for_tat"
    episodes: int = 60
    rounds_per_episode: int = 30
    lr: float = 0.005
    gamma: float = 0.95
    epsilon_decay: float = 0.97


@app.get("/api/health")
def health():
    return {"status": "ok", "torch_available": True, "cuda": torch.cuda.is_available()}


@app.get("/api/scenarios")
def get_scenarios():
    response = {}
    for key, data in GAMES.items():
        nash = compute_nash_equilibrium_2x2(data["matrix"], data["actions"])
        pareto = find_pareto_optimal_outcomes(data["matrix"], data["actions"])
        # Format matrix for JSON
        formatted_matrix = {
            f"{k[0]}|{k[1]}": [float(v[0]), float(v[1])] for k, v in data["matrix"].items()
        }
        response[key] = {
            "key": key,
            "name": data["name"],
            "description": data["description"],
            "actions": data["actions"],
            "matrix": formatted_matrix,
            "details": data["details"],
            "nash": nash,
            "pareto": pareto
        }
    return response


@app.post("/api/analyze_matrix")
def analyze_custom_matrix(req: MatrixAnalysisRequest):
    if len(req.actions_p1) != 2 or len(req.actions_p2) != 2:
        raise HTTPException(status_code=400, detail="Only 2x2 matrices supported currently.")
        
    matrix_dict = {}
    for r in range(2):
        for c in range(2):
            matrix_dict[(req.actions_p1[r], req.actions_p2[c])] = (
                req.payoffs_p1[r][c],
                req.payoffs_p2[r][c]
            )
            
    nash = compute_nash_equilibrium_2x2(matrix_dict, req.actions_p1)
    pareto = find_pareto_optimal_outcomes(matrix_dict, req.actions_p1)
    return {"nash": nash, "pareto": pareto}


@app.post("/api/simulate_match")
def simulate_match(req: MatchRequest):
    if req.p1_strategy not in STRATEGY_MAP or req.p2_strategy not in STRATEGY_MAP:
        raise HTTPException(status_code=400, detail="Invalid strategy key.")
        
    p1 = STRATEGY_MAP[req.p1_strategy]()
    p2 = STRATEGY_MAP[req.p2_strategy]()
    mat = np.array(req.payoff_matrix, dtype=float)
    
    score1, score2, log = play_match(p1, p2, mat, rounds=req.rounds, noise=req.noise, inplace=True)
    return {
        "p1_name": p1.name,
        "p2_name": p2.name,
        "p1_total": float(score1),
        "p2_total": float(score2),
        "rounds": log
    }


@app.post("/api/tournament")
def run_tournament(req: TournamentRequest):
    selected_strategies = []
    for s_key in req.strategies:
        if s_key in STRATEGY_MAP:
            selected_strategies.append(STRATEGY_MAP[s_key]())
            
    if len(selected_strategies) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 strategies.")
        
    mat = np.array(req.payoff_matrix, dtype=float)
    tournament_result = run_round_robin_tournament(
        selected_strategies, mat, rounds=req.rounds, noise=req.noise
    )
    
    # Run replicator dynamics
    pairwise = np.array(tournament_result["pairwise_matrix"])
    init_pop = [1.0 / len(selected_strategies)] * len(selected_strategies)
    replicator_hist = simulate_replicator_dynamics(pairwise, init_pop, generations=req.generations)
    
    tournament_result["replicator_dynamics"] = replicator_hist
    return tournament_result


@app.post("/api/train_dqn")
def train_dqn_endpoint(req: TrainDQNRequest):
    if req.opponent_strategy not in STRATEGY_MAP:
        raise HTTPException(status_code=400, detail="Invalid opponent strategy.")
        
    dqn = DQNAgent(memory_len=2, lr=req.lr, gamma=req.gamma, epsilon=0.4)
    mat = np.array([[[3.0, 3.0], [0.0, 5.0]], [[5.0, 0.0], [1.0, 1.0]]])
    
    training_curve = []
    epsilon = 0.4
    
    for ep in range(req.episodes):
        opp = STRATEGY_MAP[req.opponent_strategy]()
        dqn.epsilon = epsilon
        s1, s2, log = play_match(dqn, opp, mat, rounds=req.rounds_per_episode, inplace=True)
        avg_reward = s1 / req.rounds_per_episode
        training_curve.append({
            "episode": ep + 1,
            "avg_reward": round(avg_reward, 3),
            "epsilon": round(epsilon, 3),
            "total_score": round(s1, 1)
        })
        epsilon = max(0.05, epsilon * req.epsilon_decay)
        
    return {
        "status": "success",
        "opponent": req.opponent_strategy,
        "episodes": req.episodes,
        "curve": training_curve
    }


# Mount static web directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
web_dir = os.path.join(parent_dir, "web")

if os.path.exists(web_dir):
    app.mount("/", StaticFiles(directory=web_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
