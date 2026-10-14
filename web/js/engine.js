/**
 * Core Game Engine: Scenarios with Plain-English Intuitive Explanations
 * Designed so that ANYONE (beginners, students, kids, experts) can instantly understand!
 */

const SCENARIOS = {
    prisoners_dilemma: {
        id: "prisoners_dilemma",
        title: "The Prisoner's Dilemma",
        tagline: "Why smart people end up hurting each other even when teamwork is better",
        category: "Trust & Betrayal",
        icon: "🤝",
        actionsP1: ["Trust (Cooperate)", "Betray (Defect)"],
        actionsP2: ["Trust (Cooperate)", "Betray (Defect)"],
        matrix: [
            [[3, 3], [0, 5]],
            [[5, 0], [1, 1]]
        ],
        outcomesText: {
            "0,0": { title: "🤝 Win-Win (Both Loyal)", desc: "You both stayed loyal. Minor fine, both go home happy (+3 each)!" },
            "0,1": { title: "😭 You Got Sucker Punched!", desc: "You trusted them, but they betrayed you! They walk free (+5), you do hard time (0)." },
            "1,0": { title: "😈 You Stole The Win!", desc: "They trusted you, but you betrayed them! You go free (+5), they do hard time (0)." },
            "1,1": { title: "💀 The Trap (Both Greedy)", desc: "You both ratted each other out! Both of you go to jail (+1 each)." }
        },
        theory: `
            <div class="story-card">
                <h4>📖 The Everyday Story: Two Friends in Trouble</h4>
                <p>You and your friend are arrested for a small crime. The police put you in separate rooms and make each of you an offer:</p>
                <div class="story-quote">
                    "If you rat out your friend and your friend stays quiet, you go completely free today, and your friend gets 5 years in prison. If you both stay quiet, you both only get 1 month. But if you both rat each other out, you both get 2 years!"
                </div>
                
                <h4>⚡ The Crazy Trap: Why Common Sense Fails</h4>
                <p>Think about what you should do:</p>
                <ul>
                    <li>If your friend stays loyal: you can rat them out and walk away completely free!</li>
                    <li>If your friend rats you out: you <em>have</em> to rat them out too, or you become the total sucker!</li>
                </ul>
                <p>No matter what your friend does, <strong>betraying them seems like the safer selfish move</strong>. But here's the tragedy: <strong>your friend is thinking the exact same thing!</strong></p>
                <p>So you <em>both</em> betray each other, and you <em>both</em> rot in prison for 2 years! If you had simply trusted each other, you would both be free in 1 month.</p>

                <div class="theory-callout">
                    💡 <strong>The Big Life Lesson:</strong> This happens everywhere in real life!
                    <br>&bull; <strong>Price Wars:</strong> Two grocery stores both slash prices to steal customers, until both go bankrupt.
                    <br>&bull; <strong>Climate Change:</strong> Every country wants other countries to cut emissions while keeping their own factories running.
                    <br>&bull; <strong>The Solution:</strong> When people play <em>repeatedly</em> (tomorrow, next week), kindness and reputation win over greed!
                </div>
            </div>
        `
    },
    hawk_dove: {
        id: "hawk_dove",
        title: "The Game of Chicken (Hawk vs Dove)",
        tagline: "Who blinks first? The dangerous game of threats, egos, and car crashes",
        category: "Brinkmanship & Dare",
        icon: "🦅",
        actionsP1: ["Swerve (Dove / Peaceful)", "Stay Straight (Hawk / Aggressive)"],
        actionsP2: ["Swerve (Dove / Peaceful)", "Stay Straight (Hawk / Aggressive)"],
        matrix: [
            [[3, 3], [1, 5]],
            [[5, 1], [-10, -10]]
        ],
        outcomesText: {
            "0,0": { title: "🕊️ Peaceful Compromise", desc: "Both swerved safely. A little embarrassed, but both alive (+3 each)!" },
            "0,1": { title: "🐔 You Chickened Out", desc: "You swerved, they sped through! They look tough (+5), you lose face (+1)." },
            "1,0": { title: "🦅 You Won The Dare!", desc: "You charged straight, they swerved! You win maximum glory (+5)!" },
            "1,1": { title: "💥 CATASTROPHIC CRASH!", desc: "Neither backed down! Total head-on disaster (-10 each)!" }
        },
        theory: `
            <div class="story-card">
                <h4>📖 The Everyday Story: Two Speeding Cars</h4>
                <p>Two teenagers drive cars toward each other at top speed down the middle of a narrow road. The first one to swerve out of the way is called the "Chicken" (Dove), and the one who stays straight is the hero (Hawk).</p>
                
                <h4>⚡ The Big Dilemma: Brinkmanship</h4>
                <p>If you know for a fact the other driver will swerve, you should stay straight and take all the glory. But if you know the other driver refuses to move, staying straight means <strong>literal death in a head-on crash</strong>!</p>

                <div class="theory-callout">
                    💡 <strong>The Big Life Lesson:</strong> This explains dangerous world conflicts!
                    <br>&bull; <strong>Nuclear Superpowers:</strong> In the Cold War, the US and Soviet Union kept threatening nuclear strikes, hoping the other side would "swerve" first.
                    <br>&bull; <strong>Madman Theory:</strong> Leaders sometimes pretend to be crazy or rip off their own steering wheel, proving to the opponent: <em>"I literally cannot swerve, so you better swerve first!"</em>
                </div>
            </div>
        `
    },
    stag_hunt: {
        id: "stag_hunt",
        title: "The Stag Hunt (Trust vs Safety)",
        tagline: "Can we build a rocket together, or should I just bake a muffin alone?",
        category: "Teamwork & Social Trust",
        icon: "🦌",
        actionsP1: ["Hunt Stag (Teamwork)", "Catch Rabbit (Play It Safe)"],
        actionsP2: ["Hunt Stag (Teamwork)", "Catch Rabbit (Play It Safe)"],
        matrix: [
            [[5, 5], [0, 3]],
            [[3, 0], [3, 3]]
        ],
        outcomesText: {
            "0,0": { title: "🎉 Huge Feast (Teamwork Won!)", desc: "Both worked together and bagged the giant Stag! (+5 feast for both)!" },
            "0,1": { title: "😭 Abandoned in the Woods", desc: "You waited for them to hunt the Stag, but they flaked and caught a rabbit! (You get 0, they get +3)." },
            "1,0": { title: "🐰 You Flaked on Them", desc: "You grabbed a safe rabbit while they were waiting for you! (You get +3, they get 0)." },
            "1,1": { title: "🥪 Mediocre Snack", desc: "Neither of you trusted each other. Both got a small rabbit (+3 each)." }
        },
        theory: `
            <div class="story-card">
                <h4>📖 The Everyday Story: The Big Hunt</h4>
                <p>Two ancient hunters are in the forest. Together, they can surround and bring down a giant Stag, which will feed both families for weeks (+5). But hunting the Stag requires <em>both</em> hunters working together.</p>
                <p>Alternatively, either hunter can wander off on their own and easily catch a small rabbit (+3) with zero risk.</p>
                
                <h4>⚡ The Dilemma: Trust vs Playing It Safe</h4>
                <p>If you trust your partner 100%, you should hunt the Stag—it's the best outcome for everyone! But if you have even a 10% doubt that your partner might abandon you to chase an easy rabbit, you could starve with nothing (0).</p>

                <div class="theory-callout">
                    💡 <strong>The Big Life Lesson:</strong> Teamwork vs Cynicism!
                    <br>&bull; <strong>Startups & Companies:</strong> Creating an incredible breakthrough product requires everyone to give 100%. If teammates suspect others are slacking, everyone defaults to the bare minimum.
                    <br>&bull; <strong>Social Trust:</strong> High-trust societies are wealthy because people collaborate on massive projects without fear of being abandoned.
                </div>
            </div>
        `
    },
    battle_of_sexes: {
        id: "battle_of_sexes",
        title: "The Date Night Dilemma (Coordination)",
        tagline: "We disagree on where to go, but we love each other and want to be together",
        category: "Coordination & Love",
        icon: "🎭",
        actionsP1: ["Go to Concert", "Go to Football Game"],
        actionsP2: ["Go to Concert", "Go to Football Game"],
        matrix: [
            [[3, 2], [0, 0]],
            [[0, 0], [2, 3]]
        ],
        outcomesText: {
            "0,0": { title: "🎶 Happy at Concert", desc: "You both went to the concert! Partner 1 is thrilled (+3), Partner 2 enjoys the company (+2)." },
            "0,1": { title: "💔 Crossed Wires (Alone)", desc: "One went to the concert, one went to the game. You're alone and miserable (0, 0)." },
            "1,0": { title: "💔 Crossed Wires (Alone)", desc: "One went to the game, one went to the concert. Zero fun alone (0, 0)." },
            "1,1": { title: "⚽ Happy at Stadium", desc: "You both went to the football game! Partner 2 is thrilled (+3), Partner 1 enjoys the company (+2)." }
        },
        theory: `
            <div class="story-card">
                <h4>📖 The Everyday Story: Where are we meeting?</h4>
                <p>Two best friends forgot to coordinate where to meet tonight before their phones died. One loves classical concerts; the other loves football games.</p>
                <p>They prefer different events, but <strong>being together is 100x better than spending Friday night alone</strong>. If they end up in different places, both get 0 fun.</p>

                <div class="theory-callout">
                    💡 <strong>The Big Life Lesson:</strong> Shared Conventions & Focal Points!
                    <br>&bull; <strong>Driving on the Right vs Left:</strong> It doesn't matter whether a country picks the left or right side of the road—what matters is that <em>everyone coordinates on the same choice</em>!
                    <br>&bull; <strong>Tech Standards:</strong> Bluetooth, USB-C, and Wi-Fi exist because competing tech companies realized agreeing on one standard makes everyone richer than arguing alone.
                </div>
            </div>
        `
    },
    matching_pennies: {
        id: "matching_pennies",
        title: "Matching Pennies (Pure Poker / Bluffing)",
        tagline: "Pure competition where one person's gain is the other person's exact loss",
        category: "Zero-Sum Conflict",
        icon: "🪙",
        actionsP1: ["Show Heads", "Show Tails"],
        actionsP2: ["Show Heads", "Show Tails"],
        matrix: [
            [[1, -1], [-1, 1]],
            [[-1, 1], [1, -1]]
        ],
        outcomesText: {
            "0,0": { title: "🎯 Match! (Player 1 Wins)", desc: "Both picked Heads! Player 1 takes the penny (+1), Player 2 loses (-1)." },
            "0,1": { title: "🔀 Mismatch! (Player 2 Wins)", desc: "Heads vs Tails! Player 2 takes the penny (+1), Player 1 loses (-1)." },
            "1,0": { title: "🔀 Mismatch! (Player 2 Wins)", desc: "Tails vs Heads! Player 2 takes the penny (+1), Player 1 loses (-1)." },
            "1,1": { title: "🎯 Match! (Player 1 Wins)", desc: "Both picked Tails! Player 1 takes the penny (+1), Player 2 loses (-1)." }
        },
        theory: `
            <div class="story-card">
                <h4>📖 The Everyday Story: The Mind-Reader Duel</h4>
                <p>Two players secretly turn a penny to Heads or Tails, then reveal them at the same time. Player 1 wants the coins to <strong>MATCH</strong>. Player 2 wants the coins to <strong>MISMATCH</strong>.</p>
                
                <h4>⚡ Why It's Impossible to have a "Best Move":</h4>
                <p>If Player 1 always plays Heads, Player 2 will simply play Tails to win. But if Player 2 always plays Tails, Player 1 will switch to Tails to win! There is no fixed winning answer.</p>

                <div class="theory-callout">
                    💡 <strong>The Big Life Lesson:</strong> Randomness is a Weapon!
                    <br>&bull; <strong>Soccer Penalty Kicks:</strong> If a striker always kicks to the left corner, the goalie dives left and saves it. The only mathematical defense is to be <strong>random</strong> (50% left, 50% right).
                    <br>&bull; <strong>Cybersecurity & Auditing:</strong> Tax auditors and security guards inspect people at random intervals so bad actors cannot predict when to cheat!
                </div>
            </div>
        `
    },
    public_goods: {
        id: "public_goods",
        title: "The Tragedy of the Commons",
        tagline: "Why the office fridge gets gross and oceans get overfished",
        category: "Shared Resources",
        icon: "🌍",
        actionsP1: ["Contribute to Community", "Free Ride (Keep Money)"],
        actionsP2: ["Contribute to Community", "Free Ride (Keep Money)"],
        matrix: [
            [[4, 4], [1, 6]],
            [[6, 1], [2, 2]]
        ],
        outcomesText: {
            "0,0": { title: "🌟 Beautiful Thriving Community", desc: "Both invested in the shared resource! High happiness and prosperity (+4 each)!" },
            "0,1": { title: "😤 You Were Exploited", desc: "You paid for maintenance while they leeched off your hard work for free! (+1 you, +6 them)." },
            "1,0": { title: "🤑 You Free-Rided!", desc: "You kept all your cash while enjoying their free community service! (+6 you, +1 them)." },
            "1,1": { title: "🏚️ Complete Collapse", desc: "Nobody contributed. The park is trashed and the lake is dried up (+2 each)." }
        },
        theory: `
            <div class="story-card">
                <h4>📖 The Everyday Story: The Shared Pasture</h4>
                <p>Farmers share a common grassy field for their cows. If everyone only brings 2 cows, the grass regrows nicely and everyone stays wealthy (+4).</p>
                <p>But one farmer thinks: <em>"If I secretly sneak 1 extra cow in, I get richer (+6), and the grass barely notices!"</em></p>
                <p>Soon, every farmer has the same thought. The field is overgrazed, turns to dust, and all cows starve (+2)!</p>

                <div class="theory-callout">
                    💡 <strong>The Big Life Lesson:</strong> The Free-Rider Problem!
                    <br>&bull; <strong>Open Source & Wikipedia:</strong> Millions read Wikipedia for free, but only a tiny fraction donate to keep servers running.
                    <br>&bull; <strong>Clean Air & Oceans:</strong> Without shared rules and enforcement, selfish actors pollute shared rivers because the cost is spread among everyone while the profit is kept by them.
                </div>
            </div>
        `
    }
};

class GameEngine {
    static runMatch(strat1, strat2, payoffMatrix, rounds = 50, noise = 0) {
        const p1 = strat1.clone();
        const p2 = strat2.clone();
        p1.reset();
        p2.reset();

        const roundsLog = [];
        let p1Cum = 0;
        let p2Cum = 0;

        for (let r = 0; r < rounds; r++) {
            const a1 = p1.act(r, noise);
            const a2 = p2.act(r, noise);

            const [u1, u2] = payoffMatrix[a1][a2];
            p1.update(a1, a2, u1);
            p2.update(a2, a1, u2);

            p1Cum += u1;
            p2Cum += u2;

            roundsLog.push({
                round: r + 1,
                p1Act: a1,
                p2Act: a2,
                p1Payoff: u1,
                p2Payoff: u2,
                p1CumScore: p1Cum,
                p2CumScore: p2Cum
            });
        }

        return {
            p1Name: p1.name,
            p2Name: p2.name,
            p1Score: p1.score,
            p2Score: p2.score,
            p1Avg: p1.score / rounds,
            p2Avg: p2.score / rounds,
            roundsLog
        };
    }
}

window.SCENARIOS = SCENARIOS;
window.GameEngine = GameEngine;
