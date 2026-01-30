export class AudioManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    async playTone(frequency, duration, type = 'sine') {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);

        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    async playSound(soundName) {
        switch (soundName) {
            case 'BEEP':
                await this.playTone(800, 0.2);
                break;
            case 'SUCCESS':
                await this.playTone(600, 0.1);
                await this.playTone(800, 0.2);
                break;
            case 'ALERT':
                await this.playTone(300, 0.3, 'square');
                break;
            default:
                await this.playTone(440, 0.2);
        }
    }
}
