const HUB_URL = "https://aaa-gasen-hub.ddssk-m.workers.dev";
function submitToHub(score) {
    const gameUrl = window.location.origin + window.location.pathname;
    window.location.href = `${HUB_URL}/submit?url=${encodeURIComponent(gameUrl)}&score=${score}`;
}

// ゲーム状態管理
const GameState = {
    TITLE: 'title',
    PLAYING: 'playing',
    RESULT: 'result'
};

// ゲームの基本設定
const GAME_CONFIG = {
    GAME_TIME: 20, // 秒
    SURUME_SPAWN_INTERVAL: 500, // ミリ秒
    SURUME_MIN_SIZE: 10,
    SURUME_MAX_SIZE: 300,
    ZARIGANI_MIN_SIZE: 2,
    CANVAS_PADDING: 50
};

// ゲーム変数
let gameState = GameState.TITLE;
let canvas, ctx;
let score = 0;
let timeLeft = GAME_CONFIG.GAME_TIME;
let highScore = 0;
let gameTimer = null;
let surumeSpawnTimer = null;
let animationId = null;

// 画像リソース
const images = {
    zarigani: null,
    surume: null
};

// ゲームオブジェクト
let zariganis = [];
let surumes = [];
let effects = [];
let bubbles = [];
let comboTexts = [];

// マウス操作用変数
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragEnd = { x: 0, y: 0 };

// DOM要素
const screens = {
    title: null,
    game: null,
    result: null
};

const ui = {
    startButton: null,
    retryButton: null,
    submitScoreButton: null,
    scoreDisplay: null,
    timerDisplay: null,
    highScoreValue: null,
    finalScore: null,
    resultHighScore: null,
    newHighScore: null,
    dragIndicator: null
};

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    loadHighScore();
    loadImages(() => {
        setupEventListeners();
        initializeCanvas();
        showScreen(GameState.TITLE);
    });
});

// DOM要素の初期化
function initializeDOM() {
    screens.title = document.getElementById('titleScreen');
    screens.game = document.getElementById('gameScreen');
    screens.result = document.getElementById('resultScreen');
    
    ui.startButton = document.getElementById('startButton');
    ui.retryButton = document.getElementById('retryButton');
    ui.submitScoreButton = document.getElementById('submitScoreButton');
    ui.scoreDisplay = document.getElementById('score');
    ui.timerDisplay = document.getElementById('timer');
    ui.highScoreValue = document.getElementById('highScoreValue');
    ui.finalScore = document.getElementById('finalScore');
    ui.resultHighScore = document.getElementById('resultHighScore');
    ui.newHighScore = document.getElementById('newHighScore');
    ui.dragIndicator = document.getElementById('dragIndicator');
    
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
}

// キャンバスの初期化
function initializeCanvas() {
    function resizeCanvas() {
        const gameArea = document.getElementById('gameArea');
        canvas.width = gameArea.clientWidth;
        canvas.height = gameArea.clientHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// イベントリスナーの設定
function setupEventListeners() {
    ui.startButton.addEventListener('click', () => {
        // サウンドシステムを初期化（ユーザー操作が必要）
        soundManager.init();
        startGame();
    });
    ui.retryButton.addEventListener('click', () => {
        showScreen(GameState.TITLE);
    });
    ui.submitScoreButton.addEventListener('click', () => {
        submitToHub(score);
    });
    
    // マウスイベント
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // タッチイベント
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
}

// 画面切り替え
function showScreen(state) {
    gameState = state;
    
    screens.title.style.display = state === GameState.TITLE ? 'flex' : 'none';
    screens.game.style.display = state === GameState.PLAYING ? 'flex' : 'none';
    screens.result.style.display = state === GameState.RESULT ? 'flex' : 'none';
    
    if (state === GameState.TITLE) {
        ui.highScoreValue.textContent = highScore;
    }
}

// ゲーム開始
function startGame() {
    score = 0;
    timeLeft = GAME_CONFIG.GAME_TIME;
    zariganis = [];
    surumes = [];
    effects = [];
    bubbles = [];
    comboTexts = [];
    
    updateScore();
    updateTimer();
    
    showScreen(GameState.PLAYING);
    
    // Canvas のサイズを再設定
    setTimeout(() => {
        const gameArea = document.getElementById('gameArea');
        canvas.width = gameArea.clientWidth;
        canvas.height = gameArea.clientHeight;
        console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    }, 10);
    
    // タイマー開始
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // スルメ生成開始
    spawnSurume();
    surumeSpawnTimer = setInterval(spawnSurume, GAME_CONFIG.SURUME_SPAWN_INTERVAL);
    
    // 泡エフェクト生成
    setInterval(createBubble, 2000);
    
    // ゲームループ開始
    gameLoop();
}

// ゲーム終了
function endGame() {
    clearInterval(gameTimer);
    clearInterval(surumeSpawnTimer);
    cancelAnimationFrame(animationId);
    
    ui.finalScore.textContent = score;
    ui.resultHighScore.textContent = highScore;
    
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        ui.newHighScore.style.display = 'block';
    } else {
        ui.newHighScore.style.display = 'none';
    }
    
    showScreen(GameState.RESULT);
}

// スコア更新
function updateScore() {
    ui.scoreDisplay.textContent = score;
}

// タイマー更新
function updateTimer() {
    ui.timerDisplay.textContent = timeLeft;
    
    if (timeLeft <= 5) {
        ui.timerDisplay.style.color = '#ff6b35';
        if (timeLeft === 5) {
            playSound('warning');
        }
    } else {
        ui.timerDisplay.style.color = '#ffd700';
    }
}

// ハイスコア読み込み
function loadHighScore() {
    const saved = localStorage.getItem('zariganiHighScore');
    if (saved) {
        highScore = parseInt(saved);
    }
}

// ハイスコア保存
function saveHighScore() {
    localStorage.setItem('zariganiHighScore', highScore);
}

// 画像読み込み
function loadImages(callback) {
    let loadedCount = 0;
    const totalImages = 2;
    
    function checkAllLoaded() {
        loadedCount++;
        if (loadedCount === totalImages) {
            console.log('Images loaded successfully');
            console.log('Zarigani image size:', images.zarigani.width, 'x', images.zarigani.height);
            console.log('Surume image size:', images.surume.width, 'x', images.surume.height);
            callback();
        }
    }
    
    function handleError(e) {
        console.error('Failed to load image:', e.target.src);
        checkAllLoaded(); // Continue even if image fails to load
    }
    
    // ザリガニ画像
    images.zarigani = new Image();
    images.zarigani.onload = checkAllLoaded;
    images.zarigani.onerror = handleError;
    images.zarigani.src = 'resource/zarigani.png';
    
    // スルメ画像
    images.surume = new Image();
    images.surume.onload = checkAllLoaded;
    images.surume.onerror = handleError;
    images.surume.src = 'resource/surume.png';
}

// マウス操作
function handleMouseDown(e) {
    if (gameState !== GameState.PLAYING) return;
    
    const rect = canvas.getBoundingClientRect();
    isDragging = true;
    dragStart.x = e.clientX - rect.left;
    dragStart.y = e.clientY - rect.top;
    dragEnd.x = dragStart.x;
    dragEnd.y = dragStart.y;
}

function handleMouseMove(e) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    dragEnd.x = e.clientX - rect.left;
    dragEnd.y = e.clientY - rect.top;
}

function handleMouseUp(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // ザリガニ発射
    const distance = Math.hypot(dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
    if (distance > 10) {
        shootZarigani();
    }
}

// ザリガニ発射
function shootZarigani() {
    const dx = dragEnd.x - dragStart.x;
    const dy = dragEnd.y - dragStart.y;
    const distance = Math.hypot(dx, dy);
    // ドラッグと逆方向に発射するため、角度を180度回転
    const angle = Math.atan2(-dy, -dx);
    
    // ドラッグ距離をそのままザリガニのサイズにする
    const size = Math.max(GAME_CONFIG.ZARIGANI_MIN_SIZE, distance);
    const speed = size * 0.3;
    
    const zarigani = {
        x: dragStart.x,
        y: dragStart.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        angle: angle,
        active: true,
        combo: 0  // コンボカウンター
    };
    
    zariganis.push(zarigani);
    
    // 発射音
    playSound('shoot');
}

// スルメ生成
function spawnSurume() {
    const size = Math.random() * (GAME_CONFIG.SURUME_MAX_SIZE - GAME_CONFIG.SURUME_MIN_SIZE) + GAME_CONFIG.SURUME_MIN_SIZE;
    const padding = size / 2 + GAME_CONFIG.CANVAS_PADDING;
    
    const surume = {
        x: Math.random() * (canvas.width - padding * 2) + padding,
        y: Math.random() * (canvas.height - padding * 2) + padding,
        size: size,
        rotation: Math.random() * Math.PI * 2,
        wobbleOffset: Math.random() * Math.PI * 2,
        active: true
    };
    
    surumes.push(surume);
}

// 泡生成
function createBubble() {
    if (gameState !== GameState.PLAYING) return;
    
    const bubble = {
        x: Math.random() * canvas.width,
        y: canvas.height + 50,
        size: Math.random() * 20 + 10,
        speed: Math.random() * 2 + 1,
        wobble: Math.random() * 50 - 25
    };
    
    bubbles.push(bubble);
}

// 衝突判定
function checkCollision(zarigani, surume) {
    // ザリガニのハサミの位置を計算（進行方向の前方）
    const clawOffset = zarigani.size * 0.8; // ハサミは前方80%の位置
    const clawX = zarigani.x + Math.cos(zarigani.angle) * clawOffset;
    const clawY = zarigani.y + Math.sin(zarigani.angle) * clawOffset;
    
    // ハサミとスルメの距離を計算
    const dx = clawX - surume.x;
    const dy = clawY - surume.y;
    const distance = Math.hypot(dx, dy);
    
    // ハサミの判定半径はザリガニサイズの30%程度
    const clawRadius = zarigani.size * 0.3;
    
    return distance < (clawRadius + surume.size / 2);
}

// 泡との衝突判定
function checkBubbleCollision(zarigani, bubble) {
    const dx = zarigani.x - bubble.x;
    const dy = zarigani.y - bubble.y;
    const distance = Math.hypot(dx, dy);
    
    // ザリガニの半径と泡の半径の合計より小さければ衝突
    const zariganiRadius = zarigani.size * 0.5;
    const bubbleRadius = bubble.size * 0.5;
    
    return distance < (zariganiRadius + bubbleRadius);
}

// 食べられるサイズかチェック
function canEat(zariganiSize, surumeSize) {
    // ザリガニサイズの50%〜150%の範囲のスルメのみ食べられる
    const minSize = zariganiSize * 0.5;
    const maxSize = zariganiSize * 1.5;
    
    return surumeSize >= minSize && surumeSize <= maxSize;
}

// ゲームループ
function gameLoop() {
    if (gameState !== GameState.PLAYING) return;
    
    // キャンバスクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新と描画
    updateAndDrawBubbles();
    updateAndDrawSurumes();
    updateAndDrawZariganis();
    updateAndDrawEffects();
    updateAndDrawComboTexts();
    
    // ドラッグ中のザリガニプレビュー
    if (isDragging) {
        drawDragPreview();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// 泡の更新と描画
function updateAndDrawBubbles() {
    bubbles = bubbles.filter(bubble => {
        bubble.y -= bubble.speed;
        bubble.x += Math.sin(bubble.y * 0.01) * bubble.wobble * 0.1;
        
        if (bubble.y < -50) return false;
        
        // 泡を描画
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        return true;
    });
}

// スルメの更新と描画
function updateAndDrawSurumes() {
    const time = Date.now() * 0.001;
    
    // ドラッグ中の場合、プレビューサイズを取得
    let previewSize = 0;
    if (isDragging) {
        const distance = Math.hypot(dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
        previewSize = Math.max(GAME_CONFIG.ZARIGANI_MIN_SIZE, distance);
    }
    
    surumes = surumes.filter(surume => {
        if (!surume.active) return false;
        
        // ゆらゆら動き
        surume.rotation += 0.01;
        const wobbleX = Math.sin(time + surume.wobbleOffset) * 10;
        const wobbleY = Math.cos(time * 0.7 + surume.wobbleOffset) * 5;
        
        // 透明度の設定
        let opacity = 0.3; // 基本は半透明
        if (isDragging && canEat(previewSize, surume.size)) {
            opacity = 1.0; // 食べられるサイズは不透明
        }
        
        // スルメを描画
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(surume.x + wobbleX, surume.y + wobbleY);
        ctx.rotate(surume.rotation);
        
        // 画像が読み込まれていない場合は代替描画
        if (!images.surume || images.surume.width === 0) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-surume.size/2, -surume.size/2, surume.size, surume.size);
        } else {
            // 画像のアスペクト比を保ちながら描画
            const aspectRatio = images.surume.width / images.surume.height;
            const drawWidth = surume.size;
            const drawHeight = drawWidth / aspectRatio;
            
            ctx.drawImage(
                images.surume,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );
        }
        
        ctx.restore();
        
        return true;
    });
}

// ザリガニの更新と描画
function updateAndDrawZariganis() {
    zariganis = zariganis.filter(zarigani => {
        if (!zarigani.active) return false;
        
        // 位置更新
        zarigani.x += zarigani.vx;
        zarigani.y += zarigani.vy;
        
        // 画面外チェック
        if (zarigani.x < -zarigani.size || zarigani.x > canvas.width + zarigani.size ||
            zarigani.y < -zarigani.size || zarigani.y > canvas.height + zarigani.size) {
            return false;
        }
        
        // 泡との衝突判定
        bubbles.forEach((bubble, bubbleIndex) => {
            if (checkBubbleCollision(zarigani, bubble)) {
                // 泡を消す
                bubbles.splice(bubbleIndex, 1);
                
                // ランダムに方向変更
                const randomAngle = Math.random() * Math.PI * 2;
                const speed = Math.hypot(zarigani.vx, zarigani.vy);
                zarigani.vx = Math.cos(randomAngle) * speed;
                zarigani.vy = Math.sin(randomAngle) * speed;
                zarigani.angle = randomAngle;
                
                // 泡破裂音を再生
                playSound('hit');
                
                // 泡破裂エフェクト
                createBubblePopEffect(bubble.x, bubble.y, bubble.size);
            }
        });

        // スルメとの衝突判定
        surumes.forEach(surume => {
            if (surume.active && checkCollision(zarigani, surume)) {
                // サイズ判定
                if (canEat(zarigani.size, surume.size)) {
                    // 食べられるサイズの場合
                    surume.active = false;
                    
                    // コンボ計算
                    zarigani.combo++;
                    const multiplier = Math.pow(2, zarigani.combo - 1); // 1倍、2倍、4倍、8倍...
                    const baseScore = 100; // 固定得点
                    const comboScore = baseScore * multiplier;
                    
                    score += comboScore;
                    updateScore();
                    
                    // エフェクト生成
                    createHitEffect(surume.x, surume.y, surume.size);
                    
                    // コンボエフェクト
                    if (zarigani.combo > 1) {
                        createComboEffect(surume.x, surume.y, zarigani.combo, comboScore);
                    }
                    
                    // サウンド再生（コンボ数に応じて音を変える）
                    if (zarigani.combo > 2) {
                        playSound('combo');
                    } else {
                        playSound('hit');
                    }
                } else {
                    // 食べられないサイズの場合
                    createMissEffect(surume.x, surume.y, zarigani.size > surume.size);
                    // 音は鳴らさない
                }
            }
        });
        
        // ザリガニを描画
        drawZarigani(zarigani);
        
        return true;
    });
}

// ザリガニ描画
function drawZarigani(zarigani) {
    ctx.save();
    ctx.translate(zarigani.x, zarigani.y);
    // 元の角度に90度（π/2ラジアン）を追加して右に回転
    ctx.rotate(zarigani.angle + Math.PI / 2);
    
    // 画像が読み込まれていない場合は代替描画
    if (!images.zarigani || images.zarigani.width === 0) {
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(-zarigani.size/2, -zarigani.size/2, zarigani.size, zarigani.size);
    } else {
        // 画像のアスペクト比を保ちながら描画
        const aspectRatio = images.zarigani.width / images.zarigani.height;
        const drawHeight = zarigani.size * 2; // ザリガニの高さベースでサイズ調整
        const drawWidth = drawHeight * aspectRatio;
        
        ctx.drawImage(
            images.zarigani,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
    }
    
    ctx.restore();
}

// エフェクトの更新と描画
function updateAndDrawEffects() {
    effects = effects.filter(effect => {
        effect.life--;
        
        if (effect.life <= 0) return false;
        
        const alpha = effect.life / effect.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (effect.type === 'combo') {
            // コンボエフェクト
            effect.x += effect.vx * 0.95;
            effect.y += effect.vy * 0.95;
            effect.vx *= 0.95;
            effect.vy *= 0.95;
            
            const size = effect.size * (1 + (1 - alpha) * 2);
            
            ctx.fillStyle = effect.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = effect.color;
            
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else if (effect.type === 'bubble_pop') {
            // 泡破裂エフェクト
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.vx *= 0.95; // 減速
            effect.vy *= 0.95;
            
            const size = effect.size * alpha;
            
            ctx.fillStyle = effect.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 通常のヒットエフェクト
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            
            const radius = (1 - alpha) * effect.size;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 吸い込みエフェクト
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + effect.life * 0.1;
                const x = effect.x + Math.cos(angle) * radius;
                const y = effect.y + Math.sin(angle) * radius;
                
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
        
        return true;
    });
}

// ヒットエフェクト生成
function createHitEffect(x, y, size) {
    const effect = {
        x: x,
        y: y,
        size: size,
        life: 30,
        maxLife: 30
    };
    
    effects.push(effect);
}

// 泡破裂エフェクト生成
function createBubblePopEffect(x, y, size) {
    // 小さな泡の破片エフェクトを複数生成
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const speed = size * 0.3;
        
        const effect = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size * 0.3,
            life: 20,
            maxLife: 20,
            type: 'bubble_pop',
            color: 'rgba(255, 255, 255, 0.8)'
        };
        
        effects.push(effect);
    }
}

// サウンド再生
function playSound(type) {
    soundManager.play(type);
}

// タッチイベントハンドラー
function handleTouchStart(e) {
    if (gameState !== GameState.PLAYING) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDragging = true;
    dragStart.x = touch.clientX - rect.left;
    dragStart.y = touch.clientY - rect.top;
    dragEnd.x = dragStart.x;
    dragEnd.y = dragStart.y;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dragEnd.x = touch.clientX - rect.left;
    dragEnd.y = touch.clientY - rect.top;
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    isDragging = false;
    
    // ザリガニ発射
    const distance = Math.hypot(dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
    if (distance > 10) {
        shootZarigani();
    }
}

// コンボエフェクト生成
function createComboEffect(x, y, combo, score) {
    const comboText = {
        x: x,
        y: y,
        combo: combo,
        score: score,
        life: 60,
        maxLife: 60,
        vx: (Math.random() - 0.5) * 2,
        vy: -3
    };
    
    comboTexts.push(comboText);
    
    // 派手なエフェクトを複数生成
    for (let i = 0; i < combo * 3; i++) {
        const angle = (Math.PI * 2 * i) / (combo * 3);
        const speed = combo * 15;
        
        const effect = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: combo * 10,
            life: 40,
            maxLife: 40,
            type: 'combo',
            color: `hsl(${combo * 30}, 100%, 50%)`
        };
        
        effects.push(effect);
    }
}

// コンボテキストの更新と描画
function updateAndDrawComboTexts() {
    comboTexts = comboTexts.filter(text => {
        text.life--;
        
        if (text.life <= 0) return false;
        
        // 位置更新
        if (text.vx !== undefined) {
            text.x += text.vx;
        }
        text.y += text.vy;
        if (text.vx !== undefined) {
            text.vy += 0.1; // 重力（コンボテキストのみ）
        }
        
        const alpha = text.life / text.maxLife;
        const scale = 1 + (1 - alpha) * 0.5;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(text.x, text.y);
        ctx.scale(scale, scale);
        
        if (text.text) {
            // ミステキスト表示
            ctx.font = 'bold 24px Arial';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.strokeText(text.text, 0, 0);
            ctx.fillText(text.text, 0, 0);
        } else {
            // コンボ数表示
            ctx.font = `bold ${20 + text.combo * 5}px Arial`;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.fillStyle = `hsl(${text.combo * 30}, 100%, 50%)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.strokeText(`${text.combo} COMBO!`, 0, -20);
            ctx.fillText(`${text.combo} COMBO!`, 0, -20);
            
            // スコア表示
            ctx.font = `bold ${16 + text.combo * 3}px Arial`;
            ctx.fillStyle = '#FFD700';
            ctx.strokeText(`+${text.score}`, 0, 5);
            ctx.fillText(`+${text.score}`, 0, 5);
        }
        
        ctx.restore();
        
        return true;
    });
}

// ミスエフェクト生成
function createMissEffect(x, y, tooSmall) {
    const missText = {
        x: x,
        y: y,
        text: tooSmall ? "Too Small!" : "Too Big!",
        life: 30,
        maxLife: 30,
        vy: -2
    };
    
    comboTexts.push(missText);
}

// ドラッグプレビュー描画
function drawDragPreview() {
    const dx = dragEnd.x - dragStart.x;
    const dy = dragEnd.y - dragStart.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance < 10) return;
    
    // ドラッグと逆方向の角度
    const angle = Math.atan2(-dy, -dx);
    const size = Math.max(GAME_CONFIG.ZARIGANI_MIN_SIZE, distance);
    
    // 半透明でプレビュー
    ctx.save();
    ctx.globalAlpha = 0.5;
    
    // ザリガニプレビューを描画
    const previewZarigani = {
        x: dragStart.x,
        y: dragStart.y,
        angle: angle,
        size: size
    };
    drawZarigani(previewZarigani);
    
    // 食べられるサイズ範囲を表示
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // 最小サイズ円
    ctx.beginPath();
    ctx.arc(dragStart.x, dragStart.y, size * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // 最大サイズ円
    ctx.beginPath();
    ctx.arc(dragStart.x, dragStart.y, size * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // ドラッグライン描画
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(dragStart.x, dragStart.y);
    ctx.lineTo(dragEnd.x, dragEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.restore();
}