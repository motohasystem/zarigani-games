// Web Audio APIを使用した音響効果生成

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.initialized = false;
    }

    // 初期化（ユーザー操作後に呼ぶ必要がある）
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // 各種サウンドを生成
            this.createSounds();
        } catch (e) {
            console.error('Web Audio APIの初期化に失敗しました:', e);
        }
    }

    // サウンド生成
    createSounds() {
        // ザリガニ発射音（水中のブクブク音）
        this.sounds.shoot = () => this.createShootSound();
        
        // スルメ捕獲音
        this.sounds.hit = () => this.createHitSound();
        
        // コンボ音
        this.sounds.combo = () => this.createComboSound();
        
        // ミス音
        this.sounds.miss = () => this.createMissSound();
        
        // 残り時間警告音
        this.sounds.warning = () => this.createWarningSound();
    }

    // ザリガニ発射音を生成
    createShootSound() {
        const now = this.audioContext.currentTime;
        
        // メインの発射音（低周波のバブル音）
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // フィルター設定（水中感を出す）
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 10;
        
        // 音源設定
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        
        // 音量エンベロープ
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        // 接続
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 泡のポップ音を追加
        for (let i = 0; i < 3; i++) {
            const popTime = now + 0.05 * i;
            const popOsc = this.audioContext.createOscillator();
            const popGain = this.audioContext.createGain();
            
            popOsc.type = 'sine';
            popOsc.frequency.setValueAtTime(1000 + Math.random() * 500, popTime);
            
            popGain.gain.setValueAtTime(0, popTime);
            popGain.gain.linearRampToValueAtTime(0.1, popTime + 0.005);
            popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.05);
            
            popOsc.connect(popGain);
            popGain.connect(this.audioContext.destination);
            
            popOsc.start(popTime);
            popOsc.stop(popTime + 0.05);
        }
        
        // 再生
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // スルメ捕獲音を生成
    createHitSound() {
        const now = this.audioContext.currentTime;
        
        // 吸い込み音
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 5;
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        
        // キラキラ音
        const sparkleOsc = this.audioContext.createOscillator();
        const sparkleGain = this.audioContext.createGain();
        
        sparkleOsc.type = 'sine';
        sparkleOsc.frequency.setValueAtTime(2000, now);
        sparkleOsc.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
        
        sparkleGain.gain.setValueAtTime(0, now);
        sparkleGain.gain.linearRampToValueAtTime(0.1, now + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(this.audioContext.destination);
        
        sparkleOsc.start(now);
        sparkleOsc.stop(now + 0.2);
    }

    // コンボ音を生成
    createComboSound() {
        const now = this.audioContext.currentTime;
        
        // アルペジオ風の音階
        const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C (高)
        
        frequencies.forEach((freq, index) => {
            const startTime = now + index * 0.05;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            filter.Q.value = 10;
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
            
            // ハーモニクスを追加
            const harmonic = this.audioContext.createOscillator();
            const harmonicGain = this.audioContext.createGain();
            
            harmonic.type = 'sine';
            harmonic.frequency.setValueAtTime(freq * 2, startTime);
            
            harmonicGain.gain.setValueAtTime(0, startTime);
            harmonicGain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
            harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
            
            harmonic.connect(harmonicGain);
            harmonicGain.connect(this.audioContext.destination);
            
            harmonic.start(startTime);
            harmonic.stop(startTime + 0.2);
        });
    }

    // ミス音を生成
    createMissSound() {
        const now = this.audioContext.currentTime;
        
        // 不協和音
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        
        osc1.frequency.setValueAtTime(200, now);
        osc2.frequency.setValueAtTime(210, now);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.1);
        osc2.stop(now + 0.1);
    }

    // 警告音を生成
    createWarningSound() {
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(880, now + 0.1);
        oscillator.frequency.setValueAtTime(440, now + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.setValueAtTime(0, now + 0.05);
        gainNode.gain.setValueAtTime(0.3, now + 0.1);
        gainNode.gain.setValueAtTime(0, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // サウンド再生
    play(soundName) {
        if (!this.initialized) {
            console.warn('サウンドシステムが初期化されていません');
            return;
        }
        
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (e) {
                console.error(`サウンド再生エラー (${soundName}):`, e);
            }
        }
    }
}

// グローバルなサウンドマネージャーインスタンス
const soundManager = new SoundManager();