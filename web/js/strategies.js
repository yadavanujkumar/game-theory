/**
 * Strategies Library for Game Theory Simulations
 * Includes Rule-based, Reinforcement Learning (Q-learning), and Neural Net Agents.
 */

class BaseStrategy {
    constructor(id, name, color, icon, description) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.icon = icon;
        this.description = description;
        this.history = []; // Array of {myAct, oppAct}
        this.score = 0;
    }

    reset() {
        this.history = [];
        this.score = 0;
    }

    act(round, noise = 0) {
        const raw = this.decide(round);
        if (noise > 0 && Math.random() < noise) {
            return 1 - raw;
        }
        return raw;
    }

    decide(round) {
        return 0;
    }

    update(myAct, oppAct, payoff) {
        this.history.push({ myAct, oppAct });
        this.score += payoff;
    }

    clone() {
        throw new Error("Clone not implemented");
    }
}

class AlwaysCooperateStrategy extends BaseStrategy {
    constructor() {
        super("always_coop", "The Angel (Always Cooperate)", "#10b981", "🕊️", "Pure kindness: Always trusts and plays nice, but easily exploited by cheaters.");
    }
    decide(round) { return 0; }
    clone() { return new AlwaysCooperateStrategy(); }
}

class AlwaysDefectStrategy extends BaseStrategy {
    constructor() {
        super("always_defect", "The Cheater (Always Defect)", "#f43f5e", "😈", "Pure selfishness: Never trusts, always betrays. Tries to steal maximum points.");
    }
    decide(round) { return 1; }
    clone() { return new AlwaysDefectStrategy(); }
}

class TitForTatStrategy extends BaseStrategy {
    constructor() {
        super("tit_for_tat", "The Copycat (Tit-for-Tat)", "#6366f1", "🤝", "Starts with trust, then copies whatever you did last turn. Fair, simple, and legendary.");
    }
    decide(round) {
        if (round === 0 || this.history.length === 0) return 0;
        return this.history[this.history.length - 1].oppAct;
    }
    clone() { return new TitForTatStrategy(); }
}

class GrimTriggerStrategy extends BaseStrategy {
    constructor() {
        super("grim_trigger", "The Grudge (Grim Trigger)", "#8b5cf6", "⚡", "Starts friendly, but betray it even once and it hates you forever, defecting on every turn!");
        this.triggered = false;
    }
    reset() {
        super.reset();
        this.triggered = false;
    }
    decide(round) {
        if (this.triggered) return 1;
        if (this.history.length > 0 && this.history[this.history.length - 1].oppAct === 1) {
            this.triggered = true;
            return 1;
        }
        return 0;
    }
    clone() { return new GrimTriggerStrategy(); }
}

class PavlovStrategy extends BaseStrategy {
    constructor() {
        super("pavlov", "The Simpleton (Pavlov / Win-Stay)", "#f59e0b", "🐶", "Repeats its move if it scored well; switches moves if it scored poorly.");
    }
    decide(round) {
        if (round === 0 || this.history.length === 0) return 0;
        const last = this.history[this.history.length - 1];
        if (last.myAct === last.oppAct) {
            return 0; // Cooperate
        } else {
            return 1; // Defect
        }
    }
    clone() { return new PavlovStrategy(); }
}

class GenerousTFTStrategy extends BaseStrategy {
    constructor(forgiveness = 0.25) {
        super("generous_tft", "The Peacemaker (Generous TFT)", "#34d399", "🌸", "Like the Copycat, but forgives 25% of betrayals to stop endless revenge spirals.");
        this.forgiveness = forgiveness;
    }
    decide(round) {
        if (round === 0 || this.history.length === 0) return 0;
        const lastOpp = this.history[this.history.length - 1].oppAct;
        if (lastOpp === 1) {
            return Math.random() < this.forgiveness ? 0 : 1;
        }
        return 0;
    }
    clone() { return new GenerousTFTStrategy(this.forgiveness); }
}

class SuspiciousTFTStrategy extends BaseStrategy {
    constructor() {
        super("suspicious_tft", "The Cynic (Suspicious TFT)", "#eab308", "🕵️", "Like Copycat, but assumes the worst and starts by betraying you on Round 1.");
    }
    decide(round) {
        if (round === 0 || this.history.length === 0) return 1;
        return this.history[this.history.length - 1].oppAct;
    }
    clone() { return new SuspiciousTFTStrategy(); }
}

class RandomStrategy extends BaseStrategy {
    constructor() {
        super("random", "The Wildcard (Random Coin)", "#94a3b8", "🎲", "Flips a 50/50 coin on every round. Completely chaotic and unpredictable.");
    }
    decide(round) {
        return Math.random() < 0.5 ? 0 : 1;
    }
    clone() { return new RandomStrategy(); }
}

class DetectiveStrategy extends BaseStrategy {
    constructor() {
        super("detective", "The Detective (Tester)", "#f97316", "🔍", "Tests you with 4 tricky moves. If you let it bully you, it cheats forever; if you retaliate, it behaves!");
        this.exploiting = false;
        this.probed = false;
    }
    reset() {
        super.reset();
        this.exploiting = false;
        this.probed = false;
    }
    decide(round) {
        const probe = [0, 1, 0, 0];
        if (round < 4) return probe[round];
        if (!this.probed) {
            const opponentRetaliated = this.history.slice(0, 4).some(h => h.oppAct === 1);
            this.exploiting = !opponentRetaliated;
            this.probed = true;
        }
        if (this.exploiting) return 1;
        return this.history[this.history.length - 1].oppAct;
    }
    clone() { return new DetectiveStrategy(); }
}

class GradualStrategy extends BaseStrategy {
    constructor() {
        super("gradual", "Gradual Retaliator", "#9f7aea", "📈", "Cooperates until defected against. Then defects N times (where N = total opponent defections) and then calms with 2 cooperations.");
        this.oppDefections = 0;
        this.punishmentQueue = 0;
    }
    reset() {
        super.reset();
        this.oppDefections = 0;
        this.punishmentQueue = 0;
    }
    decide(round) {
        if (round === 0) return 0;
        const last = this.history[this.history.length - 1];
        if (last.oppAct === 1) {
            this.oppDefections++;
            if (this.punishmentQueue === 0) {
                this.punishmentQueue = this.oppDefections;
            }
        }
        if (this.punishmentQueue > 0) {
            this.punishmentQueue--;
            return 1;
        }
        return 0;
    }
    clone() { return new GradualStrategy(); }
}

/**
 * Tabular Q-Learning Agent (Reinforcement Learning)
 * Learns state-action values Q(s, a) directly through trial and error.
 */
class QLearningStrategy extends BaseStrategy {
    constructor(alpha = 0.2, gamma = 0.9, epsilon = 0.15) {
        super("q_learner", "The AI Brain (Q-Learning)", "#38bdf8", "🤖", "Starts knowing nothing, learns by trial & error, and figures out how to beat you from experience!");
        this.alpha = alpha;
        this.gamma = gamma;
        this.epsilon = epsilon;
        this.qTable = {}; // key: "myLast,oppLast" -> [q0, q1]
        this.lastState = null;
        this.lastAction = null;
    }

    getState() {
        if (this.history.length === 0) return "-1,-1";
        const last = this.history[this.history.length - 1];
        return `${last.myAct},${last.oppAct}`;
    }

    decide(round) {
        const state = this.getState();
        if (!this.qTable[state]) {
            this.qTable[state] = [0.0, 0.0];
        }

        let action;
        if (Math.random() < this.epsilon) {
            action = Math.random() < 0.5 ? 0 : 1;
        } else {
            const [q0, q1] = this.qTable[state];
            if (q0 === q1) action = Math.random() < 0.5 ? 0 : 1;
            else action = q0 > q1 ? 0 : 1;
        }

        this.lastState = state;
        this.lastAction = action;
        return action;
    }

    update(myAct, oppAct, payoff) {
        super.update(myAct, oppAct, payoff);
        if (this.lastState !== null && this.lastAction !== null) {
            const nextState = this.getState();
            if (!this.qTable[nextState]) {
                this.qTable[nextState] = [0.0, 0.0];
            }
            const maxNextQ = Math.max(this.qTable[nextState][0], this.qTable[nextState][1]);
            const tdTarget = payoff + this.gamma * maxNextQ;
            const currentQ = this.qTable[this.lastState][this.lastAction];
            this.qTable[this.lastState][this.lastAction] += this.alpha * (tdTarget - currentQ);
        }
    }

    clone() {
        const c = new QLearningStrategy(this.alpha, this.gamma, this.epsilon);
        c.qTable = JSON.parse(JSON.stringify(this.qTable));
        return c;
    }
}

/**
 * Neural Network Agent (Deep/Evolutionary AI)
 * Uses a perceptron network: Input = [myLast, oppLast, bias] -> Sigmoid -> Decision.
 */
class NeuralStrategy extends BaseStrategy {
    constructor(weights = null) {
        super("neural_net", "Neural Network Agent", "#f43f5e", "🧠", "Single-layer neural decision maker with differentiable synaptic weights.");
        // weights: [w_my, w_opp, bias]
        this.weights = weights || [
            (Math.random() * 2 - 1).toFixed(3),
            (Math.random() * 2 - 1).toFixed(3),
            (Math.random() * 2 - 1).toFixed(3)
        ].map(Number);
    }

    decide(round) {
        if (round === 0 || this.history.length === 0) {
            // Sigmoid on bias
            const act = 1 / (1 + Math.exp(-this.weights[2]));
            return act > 0.5 ? 1 : 0;
        }
        const last = this.history[this.history.length - 1];
        const z = this.weights[0] * last.myAct + this.weights[1] * last.oppAct + this.weights[2];
        const probDefect = 1 / (1 + Math.exp(-z));
        return Math.random() < probDefect ? 1 : 0;
    }

    clone() {
        return new NeuralStrategy([...this.weights]);
    }
}

// Strategy Catalog
const STRATEGY_REGISTRY = {
    tit_for_tat: () => new TitForTatStrategy(),
    always_coop: () => new AlwaysCooperateStrategy(),
    always_defect: () => new AlwaysDefectStrategy(),
    grim_trigger: () => new GrimTriggerStrategy(),
    pavlov: () => new PavlovStrategy(),
    generous_tft: () => new GenerousTFTStrategy(),
    suspicious_tft: () => new SuspiciousTFTStrategy(),
    detective: () => new DetectiveStrategy(),
    gradual: () => new GradualStrategy(),
    random: () => new RandomStrategy(),
    q_learner: () => new QLearningStrategy(),
    neural_net: () => new NeuralStrategy()
};

window.STRATEGY_REGISTRY = STRATEGY_REGISTRY;
window.BaseStrategy = BaseStrategy;
