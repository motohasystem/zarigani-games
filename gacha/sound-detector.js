/**
 * SoundDetector v1.0
 * 
 * サンプリングアプリで生成したプロファイルJSONを使って
 * マイク入力からリアルタイムで特定の音を検出するライブラリ。
 * 
 * 使い方:
 *   const detector = new SoundDetector()
 *   await detector.loadProfile('./my-sound-profile.json')
 *   await detector.start()
 *   detector.onDetect = (score) => console.log('検出！', score)
 *   // 停止: detector.stop()
 */

class SoundDetector {
  constructor(options = {}) {
    /**
     * @param {Object} options
     * @param {number} [options.cooldownMs=300]   - 連続検出を防ぐクールダウン時間(ms)
     * @param {number} [options.checkIntervalMs=30] - 検出チェック間隔(ms)
     * @param {number} [options.minVolume=0.001]  - 無音無視の最低音量閾値
     */
    this._options = {
      cooldownMs: options.cooldownMs ?? 300,
      checkIntervalMs: options.checkIntervalMs ?? 30,
      minVolume: options.minVolume ?? 0.001,
      maxDetectDurationMs: options.maxDetectDurationMs ?? 120,
    };

    this._profile = null;
    this._audioCtx = null;
    this._analyser = null;
    this._micStream = null;
    this._intervalId = null;
    this._lastDetectTime = 0;
    this._detectStartTime = null;
    this._detectPeakScore = 0;
    this._thresholdOverride = null;
    this._running = false;

    /** 検出時に呼ばれるコールバック (score: number) */
    this.onDetect = null;

    /** 毎フレームのスコアを受け取るコールバック (score: number) — デバッグ用 */
    this.onScore = null;
  }

  // ----------------------------------------------------------
  //  プロファイル読み込み
  // ----------------------------------------------------------

  /**
   * URLまたはオブジェクトからプロファイルを読み込む
   * @param {string|Object} source - JSONのURLまたはプロファイルオブジェクト
   */
  async loadProfile(source) {
    if (typeof source === 'string') {
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Failed to load profile: ${res.status} ${res.statusText}`);
      this._profile = await res.json();
    } else if (typeof source === 'object' && source !== null) {
      this._profile = source;
    } else {
      throw new Error('loadProfile: source must be a URL string or profile object');
    }

    this._validateProfile(this._profile);
    console.log(`[SoundDetector] Profile loaded: "${this._profile.name}" (${this._profile.samplesCount} samples, threshold=${this._profile.threshold})`);
  }

  _validateProfile(p) {
    if (!p.feature || !Array.isArray(p.feature)) throw new Error('Invalid profile: missing feature array');
    if (!p.numBands || p.feature.length !== p.numBands) throw new Error('Invalid profile: feature length mismatch');
    if (typeof p.threshold !== 'number') throw new Error('Invalid profile: missing threshold');
  }

  // ----------------------------------------------------------
  //  開始 / 停止
  // ----------------------------------------------------------

  /**
   * マイク取得・検出ループ開始
   */
  async start() {
    if (!this._profile) throw new Error('Call loadProfile() before start()');
    if (this._running) return;

    this._micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this._analyser = this._audioCtx.createAnalyser();
    this._analyser.fftSize = this._profile.fftSize ?? 2048;
    this._analyser.smoothingTimeConstant = 0.3;

    const source = this._audioCtx.createMediaStreamSource(this._micStream);
    source.connect(this._analyser);

    this._running = true;
    this._loop();
    console.log('[SoundDetector] Started');
  }

  /**
   * 検出停止・リソース解放
   */
  stop() {
    this._running = false;
    if (this._intervalId) { clearTimeout(this._intervalId); this._intervalId = null; }
    if (this._micStream) { this._micStream.getTracks().forEach(t => t.stop()); this._micStream = null; }
    if (this._audioCtx) { this._audioCtx.close(); this._audioCtx = null; }
    console.log('[SoundDetector] Stopped');
  }

  // ----------------------------------------------------------
  //  検出ループ
  // ----------------------------------------------------------

  _loop() {
    if (!this._running) return;

    const score = this._computeScore();

    // onScore コールバック（デバッグ用）
    if (typeof this.onScore === 'function') {
      this.onScore(score);
    }

    const now = Date.now();
    const threshold = this._thresholdOverride ?? this._profile.threshold;
    const aboveThreshold = score >= threshold;

    if (aboveThreshold) {
      // 立ち上がり開始を記録
      if (this._detectStartTime === null) {
        this._detectStartTime = now;
        this._detectPeakScore = 0;
      }
      if (score > this._detectPeakScore) this._detectPeakScore = score;
      // 長く続きすぎたらリセット（せき込み等を除外）
      if (now - this._detectStartTime > this._options.maxDetectDurationMs) {
        this._detectStartTime = null;
        this._detectPeakScore = 0;
      }
    } else {
      // スコアが閾値を下回った = 音が終わった
      if (
        this._detectStartTime !== null &&
        now - this._lastDetectTime > this._options.cooldownMs
      ) {
        this._lastDetectTime = now;
        if (typeof this.onDetect === 'function') {
          this.onDetect(this._detectPeakScore);
        }
      }
      this._detectStartTime = null;
      this._detectPeakScore = 0;
    }

    this._intervalId = setTimeout(() => this._loop(), this._options.checkIntervalMs);
  }

  // ----------------------------------------------------------
  //  特徴量抽出 & コサイン類似度
  // ----------------------------------------------------------

  _computeScore() {
    const numBands = this._profile.numBands;
    const bufLen = this._analyser.frequencyBinCount;
    const freqData = new Float32Array(bufLen);
    this._analyser.getFloatFrequencyData(freqData);

    // バンドごとに線形エネルギーを集計
    const feature = new Array(numBands).fill(0);
    for (let i = 0; i < numBands; i++) {
      const start = Math.floor(i * bufLen / numBands);
      const end = Math.floor((i + 1) * bufLen / numBands);
      let sum = 0;
      for (let j = start; j < end; j++) {
        const db = freqData[j];
        sum += db > -Infinity ? Math.pow(10, db / 20) : 0;
      }
      feature[i] = sum / (end - start);
    }

    // 音量チェック（無音無視）
    const totalEnergy = feature.reduce((a, v) => a + v, 0);
    if (totalEnergy < this._options.minVolume) return 0;

    // L2正規化
    const norm = Math.sqrt(feature.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? feature.map(v => v / norm) : feature;

    // コサイン類似度（プロファイルは事前正規化済み）
    const ref = this._profile.feature;
    let dot = 0;
    for (let i = 0; i < numBands; i++) dot += normalized[i] * ref[i];

    // 0〜1にクランプ
    return Math.max(0, Math.min(1, dot));
  }

  // ----------------------------------------------------------
  //  ユーティリティ
  // ----------------------------------------------------------

  /** 現在読み込まれているプロファイル情報を返す */
  get profileInfo() {
    if (!this._profile) return null;
    const { name, version, createdAt, samplesCount, threshold } = this._profile;
    return { name, version, createdAt, samplesCount, threshold };
  }

  /** 現在動作中かどうか */
  get running() {
    return this._running;
  }
}

// ES module / CommonJS / グローバル の各環境に対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundDetector;
} else if (typeof define === 'function' && define.amd) {
  define([], () => SoundDetector);
} else {
  window.SoundDetector = SoundDetector;
}
