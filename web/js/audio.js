/*
Audio Synthesizer using HTML5 Web Audio API
Provides retro futuristic sound effects without external audio files.
*/

class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    _init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
        if (!this.enabled) return;
        try {
            this._init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio context not allowed before user gesture
        }
    }

    click() {
        this.playTone(800, 'triangle', 0.04, 0.08);
    }

    cooperate() {
        this.playTone(587.33, 'sine', 0.12, 0.12); // D5
        setTimeout(() => this.playTone(880, 'sine', 0.18, 0.15), 60); // A5
    }

    defect() {
        this.playTone(311.13, 'sawtooth', 0.15, 0.1); // Eb4
        setTimeout(() => this.playTone(207.65, 'sawtooth', 0.22, 0.12), 70); // Ab3
    }

    roundWin() {
        this.playTone(523.25, 'triangle', 0.1, 0.12); // C5
        setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.12), 80); // E5
        setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.15), 160); // G5
    }

    roundDraw() {
        this.playTone(440, 'sine', 0.15, 0.1);
    }

    alert() {
        this.playTone(880, 'square', 0.08, 0.08);
        setTimeout(() => this.playTone(440, 'square', 0.1, 0.08), 90);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

window.soundFX = new SoundFX();
