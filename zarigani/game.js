const HUB_URL = "https://aaa-gasen-hub.ddssk-m.workers.dev";
function submitToHub(score) {
    const gameUrl = window.location.origin + window.location.pathname;
    window.location.href = `${HUB_URL}/submit?url=${encodeURIComponent(gameUrl)}&score=${score}`;
}

class ZariganiGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.startButton = document.getElementById('startButton');
        this.resetButton = document.getElementById('resetButton');
        
        this.gameState = 'menu';
        this.score = 0;
        this.timeLeft = 30;
        this.gameTimer = null;
        
        this.stage = {
            circles: [],
            width: 800,
            height: 600
        };
        
        this.zariganiList = [];
        this.baitList = [];
        this.pointEffects = [];
        this.zariganiImage = new Image();
        this.zariganiImage.src = 'resource/zarigani.png';
        this.baitImage = new Image();
        this.baitImage.src = 'resource/surume.png';
        
        this.initializeSounds();
        
        this.initializeEventListeners();
        this.generateStage();
        this.initializeZarigani();
        this.gameLoop();
    }
    
    initializeSounds() {
        // Web Audio APIを使用してサウンドを生成
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.sounds = {
            placeBait: () => this.playTone(220, 0.1, 'sine'),      // 餌を置いた音
            zariganiHook: () => this.playTone(330, 0.2, 'triangle'), // ザリガニが食いついた音
            success: () => this.playSuccessSound()                   // 成功音
        };
    }
    
    playTone(frequency, duration, waveType = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = waveType;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSuccessSound() {
        if (!this.audioContext) return;
        
        // 成功音：短い上昇音階
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.15, 'triangle');
            }, index * 80);
        });
    }
    
    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleCanvasClick(touch);
        });
    }
    
    generateStage() {
        this.stage.circles = [];
        const numCircles = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < numCircles; i++) {
            const circle = {
                x: Math.random() * (this.stage.width - 200) + 100,
                y: Math.random() * (this.stage.height - 200) + 100,
                radius: Math.random() * 80 + 60,
                color: `rgba(70, 130, 180, ${0.3 + Math.random() * 0.4})`
            };
            this.stage.circles.push(circle);
        }
    }
    
    initializeZarigani() {
        this.zariganiList = [];
        const numZarigani = Math.floor(Math.random() * 8) + 5;
        
        for (let i = 0; i < numZarigani; i++) {
            const size = Math.floor(Math.random() * 5) + 1;
            const zarigani = new Zarigani(
                Math.random() * (this.stage.width - 100) + 50,
                Math.random() * (this.stage.height - 100) + 50,
                size,
                this.zariganiImage,
                this
            );
            this.zariganiList.push(zarigani);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.timeLeft = 30;
        this.baitList = [];
        this.startButton.disabled = true;
        this.updateUI();
        
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    endGame() {
        this.gameState = 'gameOver';
        clearInterval(this.gameTimer);
        this.startButton.disabled = false;
        
        // 全てのザリガニの状態をnormalに戻してインジケーターを非表示
        this.zariganiList.forEach(zarigani => {
            zarigani.state = 'normal';
            zarigani.targetBait = null;
            zarigani.nibblingTimer = 0;
        });
        
        // 全ての餌を削除
        this.baitList = [];
        
        // ゲームオーバーオーバーレイを表示
        const overlay = document.getElementById('gameOverOverlay');
        document.getElementById('finalScore').textContent = this.score;
        overlay.style.display = 'flex';

        document.getElementById('submitScoreButton').onclick = () => {
            submitToHub(this.score);
        };
        document.getElementById('retryButton').onclick = () => {
            overlay.style.display = 'none';
            this.resetGame();
            this.startGame();
        };
    }

    resetGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.timeLeft = 30;
        this.baitList = [];
        clearInterval(this.gameTimer);
        this.startButton.disabled = false;
        this.generateStage();
        this.initializeZarigani();
        this.updateUI();
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.timerElement.textContent = this.timeLeft;
    }
    
    handleCanvasClick(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        let clickedBait = false;
        
        // ザリガニを直接チェック
        for (let i = this.zariganiList.length - 1; i >= 0; i--) {
            const zarigani = this.zariganiList[i];
            const distance = Math.sqrt((x - zarigani.x) ** 2 + (y - zarigani.y) ** 2);
            const hitRadius = (zarigani.state === 'biting' || zarigani.state === 'nibbling') ? 500 : 20;
            
            if (distance < hitRadius) {
                if (zarigani.state === 'biting') {
                    const points = zarigani.size;
                    this.score += points;
                    this.updateUI();
                    
                    // 成功音を再生
                    this.sounds.success();
                    
                    // ポイントエフェクトを追加
                    this.pointEffects.push(new PointEffect(zarigani.x, zarigani.y, points));
                    
                    // 関連する餌を削除
                    this.baitList = this.baitList.filter(bait => bait.attachedZarigani !== zarigani);
                    this.zariganiList.splice(i, 1);
                    
                    const newZarigani = new Zarigani(
                        Math.random() * (this.stage.width - 100) + 50,
                        Math.random() * (this.stage.height - 100) + 50,
                        Math.floor(Math.random() * 5) + 1,
                        this.zariganiImage,
                        this
                    );
                    this.zariganiList.push(newZarigani);
                    
                    clickedBait = true;
                    break;
                } else if (zarigani.state === 'approaching' || zarigani.state === 'nibbling') {
                    zarigani.state = 'normal';
                    zarigani.targetBait = null;
                    // 関連する餌を削除
                    this.baitList = this.baitList.filter(bait => bait.attachedZarigani !== zarigani);
                    clickedBait = true;
                    break;
                }
            }
        }
        
        if (!clickedBait) {
            // 既存の餌を全て削除
            this.baitList.forEach(bait => {
                if (bait.attachedZarigani) {
                    bait.attachedZarigani.state = 'normal';
                    bait.attachedZarigani.targetBait = null;
                }
            });
            this.baitList = [];
            
            // 全てのザリガニの状態をリセット
            this.zariganiList.forEach(zarigani => {
                if (zarigani.state !== 'normal') {
                    zarigani.state = 'normal';
                    zarigani.targetBait = null;
                    zarigani.nibblingTimer = 0;
                }
            });
            
            const bait = new Bait(x, y, this.baitImage);
            this.baitList.push(bait);
            
            // 餌を置いた音を再生
            this.sounds.placeBait();
            
            this.zariganiList.forEach(zarigani => {
                if (zarigani.state === 'normal') {
                    const distance = Math.sqrt((x - zarigani.x) ** 2 + (y - zarigani.y) ** 2);
                    if (distance < 150) {
                        zarigani.state = 'approaching';
                        zarigani.targetBait = bait;
                    }
                }
            });
        }
    }
    
    update() {
        this.zariganiList.forEach(zarigani => zarigani.update());
        this.baitList.forEach(bait => bait.update());
        
        // ポイントエフェクトの更新
        this.pointEffects = this.pointEffects.filter(effect => {
            effect.update();
            return effect.timer < 60;
        });
        
        this.zariganiList.forEach(zarigani => {
            if (zarigani.state === 'approaching' && zarigani.targetBait) {
                const distance = Math.sqrt(
                    (zarigani.x - zarigani.targetBait.x) ** 2 + 
                    (zarigani.y - zarigani.targetBait.y) ** 2
                );
                
                if (distance < 20) {
                    zarigani.state = 'nibbling';
                    zarigani.targetBait.attachedZarigani = zarigani;
                    
                    // ザリガニが食いついた音を再生
                    this.sounds.zariganiHook();
                }
            }
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.stage.width, this.stage.height);
        
        const gradient = this.ctx.createLinearGradient(0, 0, this.stage.width, this.stage.height);
        gradient.addColorStop(0, '#4682B4');
        gradient.addColorStop(1, '#5F9EA0');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.stage.width, this.stage.height);
        
        this.stage.circles.forEach(circle => {
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = circle.color;
            this.ctx.fill();
        });
        
        this.zariganiList.forEach(zarigani => zarigani.draw(this.ctx));
        this.baitList.forEach(bait => bait.draw(this.ctx));
        this.pointEffects.forEach(effect => effect.draw(this.ctx));
        
        if (this.gameState === 'menu') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.stage.width, this.stage.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ザリガニ釣りゲーム', this.stage.width / 2, this.stage.height / 2 - 50);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('「ゲーム開始」ボタンを押してスタート！', this.stage.width / 2, this.stage.height / 2 + 20);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Zarigani {
    constructor(x, y, size, image, game) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.image = image;
        this.game = game;
        this.processedImage = null;
        this.state = 'normal';
        this.targetBait = null;
        this.speed = 0.25 + Math.random() * 0.5;
        this.direction = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        this.nibblingTimer = 0;
        this.scale = 0.03 + (size - 1) * 0.015;
        this.processImage();
    }
    
    processImage() {
        if (!this.image.complete) {
            setTimeout(() => this.processImage(), 100);
            return;
        }
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.image.width;
        tempCanvas.height = this.image.height;
        
        tempCtx.drawImage(this.image, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r > 220 && g > 220 && b > 220) {
                data[i + 3] = 0;
            }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        this.processedImage = tempCanvas;
    }
    
    update() {
        switch (this.state) {
            case 'normal':
                this.wander();
                break;
            case 'approaching':
                this.approachBait();
                break;
            case 'nibbling':
                this.nibble();
                break;
            case 'biting':
                break;
        }
        
        this.x = Math.max(30, Math.min(770, this.x));
        this.y = Math.max(30, Math.min(570, this.y));
    }
    
    wander() {
        this.wanderTimer++;
        if (this.wanderTimer > 60) {
            this.direction = Math.random() * Math.PI * 2;
            this.wanderTimer = 0;
        }
        
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
    }
    
    approachBait() {
        if (!this.targetBait) {
            this.state = 'normal';
            return;
        }
        
        const dx = this.targetBait.x - this.x;
        const dy = this.targetBait.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            this.direction = Math.atan2(dy, dx);
            this.x += (dx / distance) * this.speed * 1;
            this.y += (dy / distance) * this.speed * 1;
        }
    }
    
    nibble() {
        this.nibblingTimer++;
        this.maxNibblingTime = this.maxNibblingTime || (60 + (this.size * 60) + Math.random() * (this.size * 30));
        
        if (this.nibblingTimer > this.maxNibblingTime) {
            this.state = 'biting';
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        let drawX = this.x;
        let drawY = this.y;
        
        // nibbling状態の時に振動エフェクト
        if (this.state === 'nibbling') {
            const vibrationIntensity = 2;
            drawY += Math.sin(this.nibblingTimer * 0.5) * vibrationIntensity;
        }
        // biting状態の時にゆっくりとした振動エフェクト
        else if (this.state === 'biting') {
            const vibrationIntensity = 1.5;
            drawY += Math.sin(Date.now() * 0.005) * vibrationIntensity;
        }
        
        ctx.translate(drawX, drawY);
        ctx.rotate(this.direction + Math.PI / 2);
        ctx.scale(this.scale, this.scale);
        
        if (this.processedImage) {
            ctx.drawImage(this.processedImage, -this.processedImage.width / 2, -this.processedImage.height / 2);
        } else {
            ctx.fillStyle = this.state === 'biting' ? '#FF6347' : '#8B4513';
            ctx.fillRect(-20, -10, 40, 20);
        }
        
        // ゲーム中のみインジケーターを表示
        if (this.game && this.game.gameState === 'playing') {
            if (this.state === 'nibbling') {
                const progress = this.nibblingTimer / this.maxNibblingTime;
                const radius = 500;
                
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 120;
                ctx.beginPath();
                ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
                ctx.stroke();
                
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.lineWidth = 60;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.state === 'biting') {
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 120;
                ctx.beginPath();
                ctx.arc(0, 0, 500, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.beginPath();
                ctx.arc(0, 0, 500, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

class Bait {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.rotation = Math.random() * Math.PI * 2;
        this.attachedZarigani = null;
        this.timer = 0;
    }
    
    update() {
        this.timer++;
        
        if (this.timer > 600 && !this.attachedZarigani) {
            this.timer = 600;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.image && this.image.complete) {
            const scale = 0.06;
            ctx.scale(scale, scale);
            ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class PointEffect {
    constructor(x, y, points) {
        this.x = x;
        this.y = y;
        this.points = points;
        this.timer = 0;
        this.startY = y;
    }
    
    update() {
        this.timer++;
        this.y = this.startY - this.timer * 2;
    }
    
    draw(ctx) {
        const alpha = Math.max(0, 1 - this.timer / 60);
        ctx.save();
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.strokeText(`+${this.points}`, this.x, this.y);
        ctx.fillText(`+${this.points}`, this.x, this.y);
        ctx.restore();
    }
}

window.addEventListener('load', () => {
    new ZariganiGame();
});