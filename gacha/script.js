// ======================================================
// ガチャガチャ アニメーションコントローラ
//   🦞  ZARIGANI Edition
// ======================================================
console.log('%c🦞 ZARIGANI %cガチャガチャ起動', 'font-size:18px;', 'font-size:14px;color:#d63b3b;');

// ======================================================
// 効果音（Web Audio API でシンセサイズ）
// ======================================================
const sfx = {
  muted: false,
  ctx: null,

  _ctx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // 単音オシレータの便利ラッパ
  _tone(type, freq, startTime, duration, peakGain) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    if (typeof freq === 'function') freq(osc, startTime);
    else osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  },

  // ノブのカチカチ音
  knobClicks() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      this._tone('square', 800 + Math.random() * 500, t0 + i * 0.1, 0.05, 0.08);
    }
  },

  // カプセルが転がる音（バンドパスかけたノイズ）
  rolling() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const dur = 1.5;

    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, t0);
    filter.frequency.linearRampToValueAtTime(550, t0 + dur * 0.7);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
    gain.gain.linearRampToValueAtTime(0.18, t0 + dur - 0.25);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(t0);
    noise.stop(t0 + dur);
  },

  // カプセルが「ポンッ！」と開く音
  pop() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    this._tone(
      'sine',
      (osc, t) => {
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
      },
      t0,
      0.22,
      0.35,
    );
  },

  // アイテム出現の「ジャラララーン♪」
  reveal() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    // C5, E5, G5, C6（明るいCメジャーアルペジオ）
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this._tone('triangle', f, t0 + i * 0.07, 0.5, 0.18);
    });
    // 後半にキラキラ（高音）
    const sparkles = [1568, 1760, 2093, 2349];
    sparkles.forEach((f, i) => {
      this._tone('sine', f, t0 + 0.32 + i * 0.04, 0.18, 0.08);
    });
  },

  // ノイズ検出時のピン音
  ping() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    this._tone('sine', 1200, ctx.currentTime, 0.12, 0.18);
  },

  // 3回そろった時のチャージ完了音
  ready() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [880, 1318.5].forEach((f, i) => {
      this._tone('triangle', f, t0 + i * 0.08, 0.2, 0.2);
    });
  },

  // マイク開始のチャイム
  micStart() {
    if (this.muted) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [659.25, 880].forEach((f, i) => {
      this._tone('sine', f, t0 + i * 0.1, 0.18, 0.15);
    });
  },
};

// ======================================================
// BGM（ドラム入りのノリノリ4小節ループ）
//   130 BPM / C → Am → F → G / キック+スネア+ハット
// ======================================================
const bgm = {
  playing: false,
  timerId: null,
  masterGain: null,
  bpm: 130,
  _targetGain: 0.42,

  // ノート → 周波数(Hz)
  _f: {
    C1: 32.7,
    D1: 36.71,
    E1: 41.2,
    F1: 43.65,
    G1: 49.0,
    A1: 55.0,
    B1: 61.74,
    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    G2: 98.0,
    A2: 110.0,
    B2: 123.47,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,
    C6: 1046.5,
  },

  // 32ステップ (8分音符×8拍×4小節)
  // Bar 1: C / Bar 2: Am / Bar 3: F / Bar 4: G
  _melody: [
    'E5',
    'G5',
    null,
    'C6',
    null,
    'G5',
    'E5',
    'D5', // C
    'C5',
    'E5',
    null,
    'A5',
    null,
    'E5',
    'C5',
    'B4', // Am
    'A4',
    'C5',
    null,
    'F5',
    null,
    'C5',
    'A4',
    'G4', // F
    'B4',
    'D5',
    null,
    'G5',
    null,
    'D5',
    'B4',
    'A4', // G
  ],
  _bass: [
    'C2',
    null,
    'G2',
    null,
    'C3',
    null,
    'G2',
    'E2', // C (walking)
    'A1',
    null,
    'E2',
    null,
    'A2',
    null,
    'E2',
    'C2', // Am
    'F1',
    null,
    'C2',
    null,
    'F2',
    null,
    'C2',
    'A1', // F
    'G1',
    null,
    'D2',
    null,
    'G2',
    null,
    'D2',
    'B1', // G
  ],
  // ドラム（4つ打ち＋裏拍ハット＋2/4拍スネア）
  _kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
  _snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  _hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],

  start() {
    if (this.playing) return;
    const ctx = sfx._ctx();
    if (!ctx) return;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    const target = sfx.muted ? 0 : this._targetGain;
    this.masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.5);
    this.masterGain.connect(ctx.destination);
    this.playing = true;
    this._scheduleLoop(ctx.currentTime + 0.1);
  },

  stop() {
    if (!this.playing) return;
    const ctx = sfx._ctx();
    this.playing = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.masterGain && ctx) {
      const g = this.masterGain;
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.3);
      setTimeout(() => g.disconnect(), 400);
      this.masterGain = null;
    }
  },

  setMuted(muted) {
    if (!this.masterGain) return;
    const ctx = sfx._ctx();
    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : this._targetGain, now + 0.2);
  },

  _scheduleLoop(startTime) {
    if (!this.playing) return;
    const ctx = sfx._ctx();
    const eighth = 60 / this.bpm / 2; // 8分音符
    for (let i = 0; i < 32; i++) {
      const t = startTime + i * eighth;
      // メロディ（スクエア＝チップチューン感、ステイカート気味）
      const m = this._melody[i];
      if (m) this._tone(t, this._f[m], eighth * 0.65, 0.05, 'square');
      // ベース（三角波の太い音、長めのサスティン）
      const b = this._bass[i];
      if (b) this._tone(t, this._f[b], eighth * 1.6, 0.1, 'triangle');
      // ドラム
      if (this._kick[i]) this._kickHit(t);
      if (this._snare[i]) this._snareHit(t);
      if (this._hat[i]) this._hatHit(t);
    }
    const loopEnd = startTime + 32 * eighth;
    const wakeMs = Math.max(20, (loopEnd - ctx.currentTime - 0.4) * 1000);
    this.timerId = setTimeout(() => this._scheduleLoop(loopEnd), wakeMs);
  },

  _tone(time, freq, dur, peak, type) {
    if (!this.masterGain) return;
    const ctx = sfx._ctx();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    osc.connect(env).connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.04);
  },

  // キック: サイン波の急降下＋短いエンベロープ
  _kickHit(time) {
    if (!this.masterGain) return;
    const ctx = sfx._ctx();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.1);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.55, time + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(env).connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.18);
  },

  // スネア: ハイパスノイズ＋トーン成分
  _snareHit(time) {
    if (!this.masterGain) return;
    const ctx = sfx._ctx();
    const dur = 0.14;
    // ノイズ
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.22, time + 0.003);
    env.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noise.connect(filter).connect(env).connect(this.masterGain);
    noise.start(time);
    noise.stop(time + dur);
    // トーン成分（パンッという胴鳴り）
    const tone = ctx.createOscillator();
    tone.type = 'triangle';
    tone.frequency.value = 220;
    const tEnv = ctx.createGain();
    tEnv.gain.setValueAtTime(0, time);
    tEnv.gain.linearRampToValueAtTime(0.12, time + 0.003);
    tEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    tone.connect(tEnv).connect(this.masterGain);
    tone.start(time);
    tone.stop(time + 0.06);
  },

  // ハイハット: 高域ノイズの極短バースト
  _hatHit(time) {
    if (!this.masterGain) return;
    const ctx = sfx._ctx();
    const dur = 0.04;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.06, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noise.connect(filter).connect(env).connect(this.masterGain);
    noise.start(time);
    noise.stop(time + dur);
  },
};

const CAPSULE_COLORS = ['#ffd84d', '#66c2ff', '#ff8cb4', '#9ce37d', '#c88fff', '#ffa95c', '#7de0d0', '#ff7a7a'];

// images/manifest.json の "items" に書いたファイル名を読み込みます。
// png / jpg / svg など拡張子は何でもOK。
// 新しい画像を置いたら manifest.json に追記してください（ブラウザから
// ディレクトリ走査はできないため手動一覧が必要です）。
const MANIFEST_URL = 'images/manifest.json';
let ITEM_IMAGES = [];

async function loadManifest() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest fetch failed');
    const data = await res.json();
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('manifest has no items');
    }
    ITEM_IMAGES = data.items.map((name) => 'images/' + encodeURI(name).replace(/#/g, '%23'));
  } catch (err) {
    console.warn('[gacha] manifest load failed, using fallback list:', err);
    ITEM_IMAGES = ['images/item1.svg', 'images/item2.svg', 'images/item3.svg', 'images/item4.svg', 'images/item5.svg'];
  }
}

const $trigger = document.getElementById('trigger-btn');
const $reset = document.getElementById('reset-btn');
const $machine = document.querySelector('.machine');
const $stage = document.querySelector('.stage');
const $capsule = document.getElementById('capsule');
const $capsuleTop = $capsule.querySelector('.capsule-top');
const $item = document.getElementById('item');
const $itemImg = document.getElementById('item-img');
const $confetti = document.getElementById('confetti');
const $speech = document.getElementById('speech-bubble');

// 喜びの吹き出しメッセージ（毎回ランダム）
const CHEER_MESSAGES = [
  'やったね！',
  'すごい！',
  'ラッキー！',
  'わーい！',
  'おめでとう！',
  'キラキラ！',
  'ピカイチ！',
  'いいね！',
];

// コンフェッティの色
const CONFETTI_COLORS = ['#ff4757', '#ffd93d', '#6dd5a8', '#6fc3df', '#ff8fb3', '#b56cff', '#ff9f43', '#ffffff'];

let isRunning = false;

// ランダムにアイテム画像を選ぶ（有効プリセット + ユーザー写真）
function pickRandomItem() {
  const enabledPresets = ITEM_IMAGES.filter((url) => !disabledPresets.has(url));
  const userUrls = USER_PHOTOS.map((p) => p.url);
  const all = enabledPresets.concat(userUrls);
  if (all.length === 0) return null;
  return all[Math.floor(Math.random() * all.length)];
}

function pickRandomColor() {
  return CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)];
}

// 状態リセット
function resetCapsule() {
  // トランジション/アニメを一時停止して瞬時に初期状態へ戻す
  $capsule.classList.add('no-transition');
  $capsule.classList.remove('rolling', 'stopped', 'opening', 'revealing');
  // インライン opacity はクラスルールより強いので設定しない
  // （.capsule { opacity: 0 } が基底で効く）
  $capsule.style.removeProperty('opacity');
  // reveal用オフセット変数をクリア（次回再計算）
  $item.style.removeProperty('--reveal-offset-x');
  $itemImg.removeAttribute('src');
  // 強制 reflow してスタイル適用を即時反映
  void $capsule.offsetWidth;
  $capsule.classList.remove('no-transition');
  $reset.hidden = true;
  $trigger.disabled = false;

  // 吹き出し・コンフェッティもクリア
  hideSpeechBubble();
  clearConfetti();
}

// ====================================================
//  コンフェッティ（カプセルから飛び散る紙吹雪）
// ====================================================

function spawnConfetti(count = 36) {
  // カプセルの中心を起点にする（stage 内座標）
  const stageRect = $confetti.getBoundingClientRect();
  const capRect = $capsule.getBoundingClientRect();
  const cx = capRect.left - stageRect.left + capRect.width / 2;
  const cy = capRect.top - stageRect.top + capRect.height / 2;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';

    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 180;
    const dx = Math.cos(angle) * distance;
    // 上向きに飛びやすくする
    const dy = Math.sin(angle) * distance - 120;
    const rot = Math.random() * 720 - 360 + 'deg';
    const size = 10 + Math.random() * 10;
    const isCircle = Math.random() < 0.4;
    const duration = 1.2 + Math.random() * 0.8;
    const delay = Math.random() * 0.18;

    piece.style.left = cx + 'px';
    piece.style.top = cy + 'px';
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    piece.style.background = color;
    piece.style.borderRadius = isCircle ? '50%' : '3px';
    piece.style.setProperty('--dx', dx + 'px');
    piece.style.setProperty('--dy', dy + 'px');
    piece.style.setProperty('--rot', rot);
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = delay + 's';

    // アニメ終了後に削除
    piece.addEventListener('animationend', () => piece.remove(), { once: true });
    frag.appendChild(piece);
  }
  $confetti.appendChild(frag);
}

function clearConfetti() {
  $confetti.innerHTML = '';
}

// ====================================================
//  喜びの吹き出し
// ====================================================

function showSpeechBubble() {
  const msg = CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
  $speech.textContent = msg;
  $speech.hidden = false;
  // 強制リフローでアニメをリスタートさせる
  void $speech.offsetWidth;
  $speech.classList.add('show');
}

function hideSpeechBubble() {
  $speech.classList.remove('show');
  $speech.hidden = true;
}

// ガチャ実行
async function runGacha() {
  if (isRunning) return;
  isRunning = true;

  // 前回のカプセル状態を確実にクリア（2回目以降の残像対策）
  resetCapsule();

  $trigger.disabled = true;
  $reset.hidden = true;

  // カプセルの色をランダムに
  const color = pickRandomColor();
  $capsuleTop.style.background = color;

  // 1. ノブ回転
  $machine.classList.add('spinning');
  sfx.knobClicks();
  await wait(600);
  $machine.classList.remove('spinning');

  // 2. カプセルが転がり出る
  $capsule.classList.add('rolling');
  sfx.rolling();
  await wait(1800);

  // 3. 停止
  $capsule.classList.remove('rolling');
  $capsule.classList.add('stopped');
  await wait(400);

  // 4. アイテムを準備（ロード完了を確認してから表示）
  const itemSrc = pickRandomItem();
  const resolvedSrc = await preloadImage(itemSrc);
  $itemImg.src = resolvedSrc;

  // 5. カプセルを開く
  $capsule.classList.add('opening');
  sfx.pop();
  await wait(600);

  // 6. アイテム出現＋演出
  // ステージ中央に出すため、カプセル中心からのオフセットを動的に計算
  const stageRect = $stage.getBoundingClientRect();
  const capRect = $capsule.getBoundingClientRect();
  const offsetX =
    stageRect.left + stageRect.width / 2 - (capRect.left + capRect.width / 2);
  $item.style.setProperty('--reveal-offset-x', offsetX + 'px');

  $capsule.classList.add('revealing');
  sfx.reveal();
  spawnConfetti();
  showSpeechBubble();
  await wait(1000);

  $reset.hidden = false;
  isRunning = false;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 画像をプリロードし、失敗したら絵文字SVGを返す
function preloadImage(src) {
  const fallback = makeEmojiSvg('🎁');
  return new Promise((resolve) => {
    if (!src) {
      resolve(fallback);
      return;
    }
    const img = new Image();
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    img.onload = () => done(src);
    img.onerror = () => done(fallback);
    // 最長 3 秒で諦めてフォールバック
    setTimeout(() => done(fallback), 3000);
    img.src = src;
  });
}

// 絵文字を入れた SVG をデータ URI で生成（画像が足りないとき用）
function makeEmojiSvg(emoji) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
    <text x='50%' y='50%' font-size='96' text-anchor='middle' dominant-baseline='central'>${emoji}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

$trigger.addEventListener('click', runGacha);
$reset.addEventListener('click', resetCapsule);

// ミュート切替（SFX + BGM 両方を制御）
const $muteBtn = document.getElementById('mute-btn');
$muteBtn.addEventListener('click', () => {
  sfx.muted = !sfx.muted;
  $muteBtn.classList.toggle('muted', sfx.muted);
  $muteBtn.textContent = sfx.muted ? '🔇' : '🔊';
  bgm.setMuted(sfx.muted);
  // 解除時に小さくチャイムを鳴らして「音が出るよ」と分かるように
  if (!sfx.muted) sfx.ping();
});

// BGM 再生切替
const $bgmBtn = document.getElementById('bgm-btn');
$bgmBtn.addEventListener('click', () => {
  if (bgm.playing) {
    bgm.stop();
    $bgmBtn.classList.remove('playing');
    $bgmBtn.textContent = '🎵';
  } else {
    bgm.start();
    $bgmBtn.classList.add('playing');
    $bgmBtn.textContent = '🎶';
  }
});

// 起動時にマニフェストをロード（失敗時はフォールバック）
const manifestReady = loadManifest();

// ======================================================
// SoundDetector によるノイズ3回トリガー
// ======================================================

const PROFILE_URL = 'wired-mic-profile.json';
const DETECTIONS_TO_TRIGGER = 3;

const $micBtn = document.getElementById('mic-btn');
const $meterBar = document.getElementById('meter-bar');
const $meterThreshold = document.getElementById('meter-threshold');
const $meterValue = document.getElementById('meter-value');
const $countDots = document.querySelectorAll('#count-dots .dot');
const $countValue = document.getElementById('count-value');

let detector = null;
let detectionCount = 0;

function updateCount(n) {
  detectionCount = n;
  $countValue.textContent = `${n} / ${DETECTIONS_TO_TRIGGER}`;
  $countDots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < n);
  });
}

async function startDetection() {
  if (detector && detector.running) return;

  $micBtn.disabled = true;
  $micBtn.textContent = 'じゅんびちゅう…';

  try {
    detector = new SoundDetector({ cooldownMs: 350 });
    await detector.loadProfile(PROFILE_URL);

    // 閾値ラインをメーター上に配置
    const threshold = detector.profileInfo.threshold;
    $meterThreshold.style.left = `${threshold * 100}%`;

    detector.onScore = (score) => {
      $meterBar.style.width = `${Math.min(score, 1) * 100}%`;
      $meterValue.textContent = score.toFixed(2);
    };

    detector.onDetect = (score) => {
      // ガチャ実行中は新規トリガーを受け付けない
      if (isRunning) return;
      const next = detectionCount + 1;
      updateCount(next);
      if (next >= DETECTIONS_TO_TRIGGER) {
        sfx.ready();
        updateCount(0);
        runGacha();
      } else {
        sfx.ping();
      }
    };

    await detector.start();
    sfx.micStart();

    $micBtn.disabled = false;
    $micBtn.textContent = '🛑 とめる';
    $micBtn.classList.add('active');
  } catch (err) {
    console.error('[gacha] detector start failed:', err);
    alert('マイクの起動に失敗しました:\n' + (err.message || err));
    $micBtn.disabled = false;
    $micBtn.textContent = 'おとを ひろう';
    $micBtn.classList.remove('active');
    detector = null;
  }
}

function stopDetection() {
  if (detector) {
    detector.stop();
    detector = null;
  }
  updateCount(0);
  $meterBar.style.width = '0%';
  $meterValue.textContent = '0.00';
  $micBtn.textContent = 'おとを ひろう';
  $micBtn.classList.remove('active');
}

$micBtn.addEventListener('click', () => {
  if (detector && detector.running) {
    stopDetection();
  } else {
    startDetection();
  }
});

// 初期化
updateCount(0);

// ======================================================
// 将来: noise-picker と連携する拡張ポイント
// window.triggerGacha() を外部から呼べば同じ挙動になります
// ======================================================
window.triggerGacha = runGacha;

// ======================================================
// マイ写真（IndexedDBに保存・取り出し）
// ======================================================

const PHOTO_DB_NAME = 'gachagacha';
const PHOTO_DB_VERSION = 1;
const PHOTO_STORE = 'photos';
const MAX_DIMENSION = 800; // px：保存前にリサイズ
const JPEG_QUALITY = 0.85;

// IndexedDB ラッパー
const photoDB = {
  _db: null,
  _open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(PHOTO_DB_NAME, PHOTO_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          db.createObjectStore(PHOTO_STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async getAll() {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const req = tx.objectStore(PHOTO_STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async add(record) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const req = tx.objectStore(PHOTO_STORE).add({ ...record, addedAt: Date.now() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async delete(id) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const req = tx.objectStore(PHOTO_STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  },
};

// 画像を 800px 以下にリサイズして Blob を返す（保存容量を抑える）
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not an image'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        outType,
        outType === 'image/jpeg' ? JPEG_QUALITY : undefined,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

// 現在ロードされているユーザー写真（{id, name, url}）
let USER_PHOTOS = [];

async function loadUserPhotos() {
  // 既存 URL を解放
  USER_PHOTOS.forEach((p) => URL.revokeObjectURL(p.url));
  USER_PHOTOS = [];
  try {
    const records = await photoDB.getAll();
    USER_PHOTOS = records.map((r) => ({
      id: r.id,
      name: r.name,
      url: URL.createObjectURL(r.blob),
    }));
  } catch (err) {
    console.warn('[gacha] user photos load failed:', err);
  }
}

// ======================================================
// マイ写真 モーダル UI
// ======================================================

const $photoBtn = document.getElementById('photo-btn');
const $photoModal = document.getElementById('photo-modal');
const $photoInput = document.getElementById('photo-input');
const $photoGrid = document.getElementById('photo-grid');
const $photoCount = document.getElementById('photo-count');
const $photoEmpty = document.getElementById('photo-empty');

function updatePhotoButtonBadge() {
  $photoBtn.classList.toggle('has-photos', USER_PHOTOS.length > 0);
}

function renderPhotoGrid() {
  $photoCount.textContent = USER_PHOTOS.length;
  $photoEmpty.hidden = USER_PHOTOS.length > 0;
  $photoGrid.innerHTML = '';
  for (const p of USER_PHOTOS) {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';

    const img = document.createElement('img');
    img.src = p.url;
    img.alt = p.name || 'user photo';
    thumb.appendChild(img);

    const del = document.createElement('button');
    del.className = 'thumb-delete';
    del.textContent = '×';
    del.setAttribute('aria-label', '削除');
    del.addEventListener('click', async () => {
      del.disabled = true;
      try {
        await photoDB.delete(p.id);
        await loadUserPhotos();
        renderPhotoGrid();
        updatePhotoButtonBadge();
      } catch (e) {
        console.error('delete failed:', e);
        del.disabled = false;
      }
    });
    thumb.appendChild(del);

    $photoGrid.appendChild(thumb);
  }
}

async function openPhotoModal() {
  await manifestReady; // プリセット一覧が確実に揃ってから開く
  await loadUserPhotos();
  renderPhotoGrid();
  renderPresetGrid();
  $photoModal.hidden = false;
}

function closePhotoModal() {
  if (typeof cameraStream !== 'undefined' && cameraStream) closeCamera();
  $photoModal.hidden = true;
}

// ======================================================
// プリセット写真の有効/無効（localStorage に保存）
// ======================================================

const PRESET_DISABLED_KEY = 'gacha:disabled-presets';
let disabledPresets = new Set();

function loadDisabledPresets() {
  try {
    const stored = localStorage.getItem(PRESET_DISABLED_KEY);
    disabledPresets = new Set(stored ? JSON.parse(stored) : []);
  } catch {
    disabledPresets = new Set();
  }
}

function saveDisabledPresets() {
  try {
    localStorage.setItem(PRESET_DISABLED_KEY, JSON.stringify([...disabledPresets]));
  } catch (e) {
    console.warn('[gacha] saveDisabledPresets failed:', e);
  }
}

const $presetGrid = document.getElementById('preset-grid');
const $presetEnabledCount = document.getElementById('preset-enabled-count');
const $presetTotalCount = document.getElementById('preset-total-count');
const $presetAll = document.getElementById('preset-all');
const $presetNone = document.getElementById('preset-none');

function updatePresetCount() {
  const enabled = ITEM_IMAGES.filter((url) => !disabledPresets.has(url)).length;
  $presetEnabledCount.textContent = enabled;
  $presetTotalCount.textContent = ITEM_IMAGES.length;
}

function renderPresetGrid() {
  $presetGrid.innerHTML = '';
  updatePresetCount();
  for (const url of ITEM_IMAGES) {
    const enabled = !disabledPresets.has(url);

    const label = document.createElement('label');
    label.className = 'preset-thumb' + (enabled ? '' : ' disabled');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = enabled;
    input.addEventListener('change', () => {
      if (input.checked) {
        disabledPresets.delete(url);
        label.classList.remove('disabled');
      } else {
        disabledPresets.add(url);
        label.classList.add('disabled');
      }
      saveDisabledPresets();
      updatePresetCount();
    });

    const img = document.createElement('img');
    img.src = url;
    img.alt = decodeURIComponent(url.replace(/^images\//, ''));
    img.loading = 'lazy';

    const badge = document.createElement('span');
    badge.className = 'check-badge';
    badge.textContent = '✓';

    label.appendChild(input);
    label.appendChild(img);
    label.appendChild(badge);
    $presetGrid.appendChild(label);
  }
}

$presetAll.addEventListener('click', () => {
  disabledPresets.clear();
  saveDisabledPresets();
  renderPresetGrid();
});
$presetNone.addEventListener('click', () => {
  disabledPresets = new Set(ITEM_IMAGES);
  saveDisabledPresets();
  renderPresetGrid();
});

// 起動時に保存済みの設定を復元
loadDisabledPresets();

$photoBtn.addEventListener('click', openPhotoModal);
$photoModal.addEventListener('click', (e) => {
  if (e.target.dataset.close !== undefined) closePhotoModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$photoModal.hidden) closePhotoModal();
});

// ファイルリストを処理して IndexedDB に追加（ファイル選択／ペースト共通）
async function addPhotoFiles(files) {
  let added = 0;
  let errors = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const blob = await resizePhoto(file);
      // ペースト由来などで意味のあるファイル名がないときは自動生成
      const name =
        file.name && file.name !== 'image.png'
          ? file.name
          : `paste-${Date.now()}.${blob.type === 'image/png' ? 'png' : 'jpg'}`;
      await photoDB.add({ name, type: blob.type, blob });
      added++;
    } catch (err) {
      console.error('[gacha] add photo failed:', file.name, err);
      errors++;
    }
  }
  if (added > 0) {
    await loadUserPhotos();
    renderPhotoGrid();
    updatePhotoButtonBadge();
  }
  if (errors > 0) {
    alert(`${errors}まいの しゃしんを ついかできませんでした`);
  }
  return added;
}

$photoInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  e.target.value = ''; // 同じファイルを再選択できるように
  await addPhotoFiles(files);
});

// ======================================================
// カメラ撮影（getUserMedia → canvas → Blob → IndexedDB）
// ======================================================

const $cameraBtn = document.getElementById('camera-btn');
const $cameraView = document.getElementById('camera-view');
const $cameraVideo = document.getElementById('camera-video');
const $cameraFlash = document.getElementById('camera-flash');
const $cameraShoot = document.getElementById('camera-shoot');
const $cameraCancel = document.getElementById('camera-cancel');
const $cameraFlip = document.getElementById('camera-flip');
const $cameraHint = document.getElementById('camera-hint');

let cameraStream = null;
let cameraFacing = 'environment'; // 初期は背面（モバイル）。失敗したら自動でフロントに

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('このブラウザは カメラに たいおうしていません');
    return;
  }
  $cameraView.hidden = false;
  $cameraShoot.disabled = true;
  $cameraHint.textContent = 'じゅんびちゅう…';
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: cameraFacing }, width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
    $cameraVideo.srcObject = cameraStream;
    await $cameraVideo.play().catch(() => {});
    $cameraShoot.disabled = false;
    $cameraHint.textContent = 'シャッターボタンを おしてね';
  } catch (err) {
    console.error('[gacha] camera start failed:', err);
    $cameraHint.textContent = 'カメラを ひらけませんでした';
    alert('カメラの きどうに しっぱい:\n' + (err.message || err));
    closeCamera();
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  $cameraVideo.srcObject = null;
  $cameraView.hidden = true;
}

async function shootCamera() {
  if (!cameraStream || $cameraShoot.disabled) return;
  $cameraShoot.disabled = true;

  // フラッシュ演出
  $cameraFlash.classList.remove('flash');
  void $cameraFlash.offsetWidth;
  $cameraFlash.classList.add('flash');

  const w = $cameraVideo.videoWidth;
  const h = $cameraVideo.videoHeight;
  if (!w || !h) {
    $cameraShoot.disabled = false;
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // フロントカメラのときは鏡像になるよう左右反転して保存
  if (cameraFacing === 'user') {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage($cameraVideo, 0, 0, w, h);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) {
    $cameraShoot.disabled = false;
    return;
  }
  const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
  await addPhotoFiles([file]);
  $cameraShoot.disabled = false;
}

async function flipCamera() {
  cameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  await openCamera();
}

$cameraBtn.addEventListener('click', openCamera);
$cameraCancel.addEventListener('click', closeCamera);
$cameraShoot.addEventListener('click', shootCamera);
$cameraFlip.addEventListener('click', flipCamera);

// フロントカメラ表示は鏡像のほうが自然
function applyVideoMirror() {
  $cameraVideo.style.transform = cameraFacing === 'user' ? 'scaleX(-1)' : 'none';
}
$cameraVideo.addEventListener('playing', applyVideoMirror);


// クリップボードからのペースト（モーダルが開いているときのみ反応）
document.addEventListener('paste', async (e) => {
  if ($photoModal.hidden) return;
  const items = e.clipboardData?.items || [];
  const files = [];
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  if (files.length === 0) return;
  e.preventDefault();
  // 視覚フィードバック（モーダルが一瞬黄色く光る）
  const panel = $photoModal.querySelector('.modal-panel');
  panel.classList.remove('paste-flash');
  void panel.offsetWidth;
  panel.classList.add('paste-flash');
  await addPhotoFiles(files);
});

// 起動時にユーザー写真をロード
loadUserPhotos().then(updatePhotoButtonBadge);

