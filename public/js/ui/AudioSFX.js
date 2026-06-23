export class AudioSFX {
    constructor() {
        this.muted = localStorage.getItem("sfxMuted") === "true";
        this.ctx = null;
    }

    init() {
        if (!this.ctx && !this.muted) {
            this.ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem("sfxMuted", this.muted);
        return this.muted;
    }

    playPop() {
        if (this.muted) return;
        this.init();
        if(this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playCoin() {
        if (this.muted) return;
        this.init();
        if(this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "square";
        osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
        osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    playMention() {
        if (this.muted) return;
        this.init();
        if(this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}