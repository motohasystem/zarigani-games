class ZariganiGrowthGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.gameState = 'menu';
        this.score = 0;
        this.timeLeft = 60;
        this.playerLife = 3;
        this.highScore = localStorage.getItem('zariganiHighScore') || 0;
        
        this.player = null;
        this.enemies = [];
        this.camera = { x: 0, y: 0, scale: 1 };
        this.mouse = { x: 0, y: 0 };
        
        this.gameLoop = null;
        this.audioContext = null;
        
        this.worldSize = 2000;
        this.maxEnemies = 30;
        this.lastEatTime = 0;
        this.currentMapScale = 10;
        this.targetMapScale = 10;
        
        this.initializeAudio();
        this.initializeEventListeners();
        this.updateUI();
        this.preloadImages();
    }
    
    preloadImages() {
        this.zariganiImage = new Image();
        this.zariganiImage.src = 'resource/zarigani.png';
        
        this.zariganiImage.onload = () => {
            console.log('ザリガニ画像を読み込みました');
        };
        
        this.zariganiImage.onerror = () => {
            console.log('ザリガニ画像の読み込みに失敗しました');
        };
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playEatingSound() {
        if (!this.audioContext) return;
        
        // ムシャムシャムシャという音を3回連続で再生
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 周波数を変化させてムシャムシャ感を演出
            oscillator.frequency.value = 300 + Math.random() * 200;
            oscillator.type = 'sawtooth';
            
            // 音量を徐々に変化させる
            gainNode.gain.value = 0;
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.1);
            gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + i * 0.1 + 0.02);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + i * 0.1 + 0.08);
            
            oscillator.start(this.audioContext.currentTime + i * 0.1);
            oscillator.stop(this.audioContext.currentTime + i * 0.1 + 0.08);
        }
    }
    
    initializeEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('backToMenuButton').addEventListener('click', () => {
            this.showMenu();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) / this.camera.scale + this.camera.x;
            this.mouse.y = (e.clientY - rect.top) / this.camera.scale + this.camera.y;
            
            // マウス座標を世界の境界内に制限
            this.mouse.x = Math.max(0, Math.min(this.worldSize, this.mouse.x));
            this.mouse.y = Math.max(0, Math.min(this.worldSize, this.mouse.y));
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.timeLeft = 60;
        this.playerLife = 3;
        
        this.player = new Zarigani(this.worldSize / 2, this.worldSize / 2, 20, true);
        this.enemies = [];
        this.lastEatTime = Date.now();
        this.currentMapScale = 10;
        this.targetMapScale = 10;
        
        this.camera = { x: 0, y: 0, scale: 1 };
        
        this.generateEnemies();
        this.updateUI();
        this.showGameHUD();
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 1000 / 60);
        
        this.timeLoop = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    generateEnemies() {
        this.enemies = [];
        for (let i = 0; i < this.maxEnemies; i++) {
            let x, y, size;
            let attempts = 0;
            
            do {
                x = Math.random() * this.worldSize;
                y = Math.random() * this.worldSize;
                // より大きなザリガニも混ざるように範囲を拡大
                const rand = Math.random();
                if (rand < 0.01) {
                    // 1%の確率で超巨大ザリガニ（150-200px）
                    size = 150 + Math.random() * 50;
                } else if (rand < 0.11) {
                    // 10%の確率で巨大ザリガニ（80-120px）
                    size = 80 + Math.random() * 40;
                } else if (rand < 0.31) {
                    // 20%の確率で大きなザリガニ（50-80px）
                    size = 50 + Math.random() * 30;
                } else {
                    // 69%の確率で通常サイズ（15-50px）
                    size = 15 + Math.random() * 35;
                }
                attempts++;
            } while (this.getDistance(x, y, this.player.x, this.player.y) < 200 && attempts < 50);
            
            this.enemies.push(new Zarigani(x, y, size, false));
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.player.update(this.mouse.x, this.mouse.y);
        
        this.enemies.forEach(enemy => {
            enemy.update();
            
            if (this.checkCollision(this.player, enemy)) {
                if (this.player.size > enemy.size) {
                    this.eatEnemy(enemy);
                } else if (enemy.size > this.player.size) {
                    this.playerHit();
                }
            }
        });
        
        this.updateCamera();
        this.updateMapScale();
        
        if (this.enemies.length < this.maxEnemies) {
            this.spawnNewEnemy();
        }
        
        // 5秒以上食べられなかったら、食べられるサイズのザリガニを追加
        if (Date.now() - this.lastEatTime > 5000) {
            this.spawnEdibleZarigani();
            this.lastEatTime = Date.now();
        }
    }
    
    checkCollision(obj1, obj2) {
        const distance = this.getDistance(obj1.x, obj1.y, obj2.x, obj2.y);
        return distance < (obj1.size + obj2.size) / 2;
    }
    
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    eatEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            
            // 食べたザリガニのサイズに応じて成長量を決定（1.5倍速に半減）
            const sizeGrowth = Math.floor(enemy.size / 8) * 1.5; // 敵のサイズの1/8を成長量とし、1.5倍にする
            const minGrowth = 3; // 最小成長量も1.5倍に
            const actualGrowth = Math.max(minGrowth, Math.floor(sizeGrowth));
            
            this.player.size += actualGrowth;
            
            // スコアも敵のサイズに比例して増加
            const baseScore = Math.floor(enemy.size);
            const bonusScore = Math.floor(enemy.size / 5); // サイズボーナス
            this.score += baseScore + bonusScore;
            
            this.playEatingSound();
            this.lastEatTime = Date.now();
            this.updateUI();
        }
    }
    
    playerHit() {
        this.playerLife--;
        this.playSound(200, 0.3);
        this.updateUI();
        
        if (this.playerLife <= 0) {
            this.endGame();
        }
        
        document.getElementById('gameInfo').classList.add('shake');
        setTimeout(() => {
            document.getElementById('gameInfo').classList.remove('shake');
        }, 500);
    }
    
    spawnNewEnemy() {
        let x, y, size;
        let attempts = 0;
        
        do {
            x = Math.random() * this.worldSize;
            y = Math.random() * this.worldSize;
            // より大きなザリガニも混ざるように範囲を拡大
            const rand = Math.random();
            if (rand < 0.01) {
                // 1%の確率で超巨大ザリガニ（150-200px）
                size = 150 + Math.random() * 50;
            } else if (rand < 0.11) {
                // 10%の確率で巨大ザリガニ（80-120px）
                size = 80 + Math.random() * 40;
            } else if (rand < 0.31) {
                // 20%の確率で大きなザリガニ（50-80px）
                size = 50 + Math.random() * 30;
            } else {
                // 69%の確率で通常サイズ（15-50px）
                size = 15 + Math.random() * 35;
            }
            attempts++;
        } while (this.getDistance(x, y, this.player.x, this.player.y) < 300 && attempts < 50);
        
        this.enemies.push(new Zarigani(x, y, size, false));
    }
    
    spawnEdibleZarigani() {
        // プレイヤーの近くに、食べられるサイズのザリガニを追加
        const edibleSize = Math.max(15, this.player.size * 0.7); // プレイヤーより小さいサイズ
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100; // プレイヤーの周りに配置
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 世界の境界内に収める
        const clampedX = Math.max(edibleSize, Math.min(this.worldSize - edibleSize, x));
        const clampedY = Math.max(edibleSize, Math.min(this.worldSize - edibleSize, y));
        
        this.enemies.push(new Zarigani(clampedX, clampedY, edibleSize, false));
    }
    
    updateCamera() {
        const targetScale = Math.max(0.3, 1 - (this.player.size - 20) / 200);
        this.camera.scale += (targetScale - this.camera.scale) * 0.05;
        
        const targetX = this.player.x - this.canvas.width / 2 / this.camera.scale;
        const targetY = this.player.y - this.canvas.height / 2 / this.camera.scale;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        this.camera.x = Math.max(0, Math.min(this.worldSize - this.canvas.width / this.camera.scale, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.worldSize - this.canvas.height / this.camera.scale, this.camera.y));
    }
    
    updateMapScale() {
        // プレイヤーのサイズに応じて目標スケールを計算（縮小速度をさらに半分に）
        this.targetMapScale = Math.max(0.5, 40 / (this.player.size / 20));
        
        // スムーズにアニメーション（さらにゆっくり）
        this.currentMapScale += (this.targetMapScale - this.currentMapScale) * 0.01;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.drawBackground();
        
        this.enemies.forEach(enemy => {
            if (this.isInView(enemy)) {
                const canEat = this.player.size > enemy.size;
                enemy.draw(this.ctx, this.zariganiImage, canEat);
            }
        });
        
        this.player.draw(this.ctx, this.zariganiImage);
        
        this.ctx.restore();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldSize);
        gradient.addColorStop(0, '#4da6ff');
        gradient.addColorStop(1, '#0066cc');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldSize, this.worldSize);
        
        // 日本地図を描画
        this.drawJapanMap();
        
        // 泡エフェクト
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.worldSize;
            const y = Math.random() * this.worldSize;
            const size = Math.random() * 3 + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawJapanMap() {
        this.ctx.save();
        
        // 日本地図の中心を世界の中心に配置
        const mapCenterX = this.worldSize / 2;
        const mapCenterY = this.worldSize / 2;
        
        // スムーズにアニメーションされたスケールを使用
        const mapScale = this.currentMapScale;
        
        this.ctx.translate(mapCenterX, mapCenterY);
        this.ctx.scale(mapScale, mapScale);
        
        // 朝鮮半島
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillStyle = 'rgba(120, 180, 120, 0.2)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-180, -80);
        this.ctx.lineTo(-160, -100);
        this.ctx.lineTo(-150, -60);
        this.ctx.lineTo(-160, -20);
        this.ctx.lineTo(-170, 0);
        this.ctx.lineTo(-180, -40);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 中国大陸の一部
        this.ctx.beginPath();
        this.ctx.moveTo(-250, -50);
        this.ctx.lineTo(-220, -80);
        this.ctx.lineTo(-200, -60);
        this.ctx.lineTo(-180, -40);
        this.ctx.lineTo(-180, 20);
        this.ctx.lineTo(-200, 40);
        this.ctx.lineTo(-250, 30);
        this.ctx.lineTo(-280, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 台湾
        this.ctx.beginPath();
        this.ctx.moveTo(-120, 100);
        this.ctx.lineTo(-110, 90);
        this.ctx.lineTo(-105, 110);
        this.ctx.lineTo(-115, 120);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // フィリピン（一部）
        this.ctx.beginPath();
        this.ctx.moveTo(-80, 140);
        this.ctx.lineTo(-70, 130);
        this.ctx.lineTo(-65, 150);
        this.ctx.lineTo(-75, 160);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 簡易的な日本地図を描画
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
        this.ctx.lineWidth = 2;
        
        // 本州
        this.ctx.beginPath();
        this.ctx.moveTo(-100, -80);
        this.ctx.lineTo(-80, -100);
        this.ctx.lineTo(-40, -110);
        this.ctx.lineTo(0, -100);
        this.ctx.lineTo(40, -90);
        this.ctx.lineTo(80, -70);
        this.ctx.lineTo(100, -40);
        this.ctx.lineTo(100, 0);
        this.ctx.lineTo(80, 40);
        this.ctx.lineTo(40, 60);
        this.ctx.lineTo(0, 70);
        this.ctx.lineTo(-40, 60);
        this.ctx.lineTo(-80, 40);
        this.ctx.lineTo(-100, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 北海道
        this.ctx.beginPath();
        this.ctx.moveTo(20, -140);
        this.ctx.lineTo(60, -150);
        this.ctx.lineTo(80, -140);
        this.ctx.lineTo(80, -120);
        this.ctx.lineTo(60, -110);
        this.ctx.lineTo(40, -115);
        this.ctx.lineTo(20, -120);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 九州
        this.ctx.beginPath();
        this.ctx.moveTo(-100, 40);
        this.ctx.lineTo(-80, 30);
        this.ctx.lineTo(-70, 50);
        this.ctx.lineTo(-80, 70);
        this.ctx.lineTo(-100, 60);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 四国
        this.ctx.beginPath();
        this.ctx.moveTo(-40, 30);
        this.ctx.lineTo(-20, 25);
        this.ctx.lineTo(-10, 35);
        this.ctx.lineTo(-20, 45);
        this.ctx.lineTo(-40, 40);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // サハリン（樺太）
        this.ctx.beginPath();
        this.ctx.moveTo(60, -180);
        this.ctx.lineTo(70, -200);
        this.ctx.lineTo(80, -190);
        this.ctx.lineTo(75, -170);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // ロシア極東の一部
        this.ctx.beginPath();
        this.ctx.moveTo(100, -150);
        this.ctx.lineTo(150, -160);
        this.ctx.lineTo(180, -140);
        this.ctx.lineTo(160, -120);
        this.ctx.lineTo(120, -130);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    isInView(obj) {
        const margin = 50;
        return obj.x + obj.size > this.camera.x - margin &&
               obj.x - obj.size < this.camera.x + this.canvas.width / this.camera.scale + margin &&
               obj.y + obj.size > this.camera.y - margin &&
               obj.y - obj.size < this.camera.y + this.canvas.height / this.camera.scale + margin;
    }
    
    endGame() {
        this.gameState = 'gameOver';
        clearInterval(this.gameLoop);
        clearInterval(this.timeLoop);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('zariganiHighScore', this.highScore);
        }
        
        this.showGameOver();
    }
    
    showMenu() {
        this.gameState = 'menu';
        document.getElementById('titleScreen').classList.remove('hidden');
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.updateUI();
    }
    
    showGameHUD() {
        document.getElementById('titleScreen').classList.add('hidden');
        document.getElementById('gameHUD').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    showGameOver() {
        document.getElementById('titleScreen').classList.add('hidden');
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        document.getElementById('finalScoreValue').textContent = this.score;
        
        // 指数関数的にサイズを計算（updateUIと同じロジック）
        const baseSize = 400; // 調整値
        const growthFactor = this.player.size / 20;
        const exponentialSize = baseSize * Math.pow(growthFactor, 2); // 二乗で成長（メートル単位）
        
        let displaySize;
        let unit;
        
        if (exponentialSize < 1) {
            displaySize = exponentialSize.toFixed(1);
            unit = 'm';
        } else if (exponentialSize < 1000) {
            displaySize = exponentialSize.toFixed(0);
            unit = 'm';
        } else if (exponentialSize < 1000000) {
            displaySize = (exponentialSize / 1000).toFixed(1);
            unit = 'km';
        } else {
            displaySize = (exponentialSize / 1000).toFixed(0);
            unit = 'km';
        }
        
        document.getElementById('finalSizeValue').textContent = displaySize;
        document.getElementById('finalSize').innerHTML = `最終サイズ: <span id="finalSizeValue">${displaySize}</span>${unit}`;
    }
    
    updateUI() {
        document.getElementById('timeValue').textContent = this.timeLeft;
        document.getElementById('lifeValue').textContent = this.playerLife;
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('highScoreValue').textContent = this.highScore;
        
        if (this.player) {
            // 指数関数的にサイズを計算
            // 目標: 1000px = 1000km になるように調整
            // 計算: 1000km = 1000000m = baseSize * (1000/20)^2 = baseSize * 2500
            // baseSize = 1000000m / 2500 = 400m
            const baseSize = 400; // 初期サイズ 400m（調整値）
            const growthFactor = this.player.size / 20; // 成長倍率
            const exponentialSize = baseSize * Math.pow(growthFactor, 2); // 二乗で成長（メートル単位）
            
            // 単位を適切に選択
            let displaySize;
            let unit;
            
            if (exponentialSize < 1) {
                displaySize = exponentialSize.toFixed(1);
                unit = 'm';
            } else if (exponentialSize < 1000) {
                displaySize = exponentialSize.toFixed(0);
                unit = 'm';
            } else if (exponentialSize < 1000000) {
                displaySize = (exponentialSize / 1000).toFixed(1);
                unit = 'km';
            } else {
                displaySize = (exponentialSize / 1000).toFixed(0);
                unit = 'km';
            }
            
            document.getElementById('sizeValue').textContent = displaySize;
            document.getElementById('sizeDisplay').innerHTML = `サイズ: <span id="sizeValue">${displaySize}</span>${unit}`;
        }
    }
}

class Zarigani {
    constructor(x, y, size, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.isPlayer = isPlayer;
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        this.speed = isPlayer ? 3 : 1;
        this.direction = Math.random() * Math.PI * 2;
        this.changeDirectionTimer = 0;
        this.color = isPlayer ? '#ff4444' : this.getRandomColor();
    }
    
    getRandomColor() {
        const colors = ['#ff6666', '#ff9966', '#ffcc66', '#66ff66', '#6666ff', '#ff66ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(mouseX, mouseY) {
        if (this.isPlayer && mouseX !== undefined && mouseY !== undefined) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                this.vx = (dx / distance) * this.speed;
                this.vy = (dy / distance) * this.speed;
            } else {
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
        } else {
            this.changeDirectionTimer++;
            if (this.changeDirectionTimer > 60) {
                this.direction = Math.random() * Math.PI * 2;
                this.changeDirectionTimer = 0;
            }
            
            this.vx = Math.cos(this.direction) * this.speed;
            this.vy = Math.sin(this.direction) * this.speed;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        const margin = this.size / 2; // サイズの半分をマージンとして使用
        this.x = Math.max(margin, Math.min(2000 - margin, this.x));
        this.y = Math.max(margin, Math.min(2000 - margin, this.y));
    }
    
    draw(ctx, image, canEat = false) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.vx !== 0 || this.vy !== 0) {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle + Math.PI / 2); // 右90度回転
        }
        
        if (image && image.complete) {
            ctx.drawImage(image, -this.size/2, -this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(-this.size/6, -this.size/6, this.size/8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.isPlayer) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        } else if (canEat) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

window.addEventListener('load', () => {
    new ZariganiGrowthGame();
});