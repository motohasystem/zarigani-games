class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'menu';
        this.score = 0;
        this.timeLeft = 30.0;
        this.gameStartTime = 0;

        this.player = new Player(this);
        this.stage = new Stage(this);
        this.audioManager = new AudioManager();

        this.keys = {};
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.player.jump();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('retryButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.startGame();
        });
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.timeLeft = 30.0;
        this.gameStartTime = Date.now();
        this.player.reset();
        this.stage.reset();
        this.hideAllScreens();
        this.updateUI();
    }

    update(deltaTime) {
        if (this.state === 'playing') {
            this.timeLeft -= deltaTime / 1000;

            if (this.timeLeft <= 0) {
                this.gameOver();
                return;
            }

            this.player.update(deltaTime);
            this.stage.update(deltaTime);
            this.checkCollisions();
            this.updateUI();

            if (this.stage.isGoalReached()) {
                this.goal();
            }
        }
    }

    checkCollisions() {
        const playerBounds = this.player.getBounds();

        // Check collision with each block
        this.stage.blocks.forEach((block, index) => {
            const blockBounds = block.getBounds();

            // Adjust block bounds for stage offset
            const adjustedBlockBounds = {
                x: blockBounds.x - this.stage.offsetX,
                y: blockBounds.y,
                width: blockBounds.width,
                height: blockBounds.height
            };

            if (this.rectIntersects(playerBounds, adjustedBlockBounds)) {
                this.player.handleBlockCollision(block, this.stage.offsetX);
            }
        });

        // Check collision with items
        this.stage.items.forEach((item, index) => {
            if (!item.collected) {
                const itemBounds = item.getBounds();
                const adjustedItemBounds = {
                    x: itemBounds.x - this.stage.offsetX,
                    y: itemBounds.y,
                    width: itemBounds.width,
                    height: itemBounds.height
                };
                if (this.rectIntersects(playerBounds, adjustedItemBounds)) {
                    item.collected = true;
                    this.score += item.points;

                    // Play appropriate sound based on item value
                    if (item.points >= 30) {
                        this.audioManager.playHighValueItem();
                    } else {
                        this.audioManager.playItem();
                    }

                    this.stage.items.splice(index, 1);
                }
            }
        });

        // Check if player fell off screen
        if (this.player.y > this.canvas.height) {
            this.player.handleFallLoop();
        }
    }

    rectIntersects(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    gameOver() {
        this.state = 'gameOver';
        this.audioManager.playGameOver();
        document.getElementById('resultMessage').textContent = '時間切れ！';
        document.getElementById('finalScore').textContent = `最終スコア: ${this.score}`;
        document.getElementById('gameOver').classList.remove('hidden');
    }

    goal() {
        this.state = 'goal';
        this.audioManager.playGoal();
        const clearTime = (30 - this.timeLeft).toFixed(1);
        document.getElementById('goalTime').textContent = `クリア時間: ${clearTime}秒`;
        document.getElementById('goalScore').textContent = `スコア: ${this.score}`;
        document.getElementById('goal').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('timer').textContent = this.timeLeft.toFixed(1);
        document.getElementById('score').textContent = `Score: ${this.score}`;

        const progress = this.stage.getProgress();
        document.getElementById('progressFill').style.width = `${progress * 100}%`;
    }

    hideAllScreens() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('goal').classList.add('hidden');
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'playing') {
            this.stage.render(this.ctx);
            this.player.render(this.ctx);
        }
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - (this.lastTime || currentTime);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.x = 100;
        this.width = 30;
        this.height = 40;
        this.groundY = 500;
        this.y = this.groundY - this.height;
        this.velocityY = 0;
        this.velocityX = 3;
        this.onGround = true;
        this.canDoubleJump = true;
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.stopped = false;
    }

    update(deltaTime) {
        if (!this.stopped) {
            // Apply gravity
            this.velocityY += this.gravity;
            this.y += this.velocityY;

            // Check ground collision
            if (this.y >= this.groundY - this.height) {
                this.y = this.groundY - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.canDoubleJump = true;
            } else {
                // Only set to false if not on ground - blocks will set this to true in collision
                if (this.y < this.groundY - this.height - 5) {
                    this.onGround = false;
                }
            }
        }
    }

    jump() {
        if (this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
            this.canDoubleJump = true;
            this.game.audioManager.playJump();
        } else if (this.canDoubleJump) {
            this.velocityY = this.jumpPower * 0.8;
            this.canDoubleJump = false;
            this.game.audioManager.playJump();
        }
    }

    handleBlockCollision(block, stageOffsetX) {
        const playerLeft = this.x;
        const playerRight = this.x + this.width;
        const playerTop = this.y;
        const playerBottom = this.y + this.height;

        // Adjust block position for screen coordinates
        const blockLeft = block.x - stageOffsetX;
        const blockRight = block.x - stageOffsetX + block.width;
        const blockTop = block.y;
        const blockBottom = block.y + block.height;

        // Calculate overlaps
        const overlapLeft = playerRight - blockLeft;
        const overlapRight = blockRight - playerLeft;
        const overlapTop = playerBottom - blockTop;
        const overlapBottom = blockBottom - playerTop;

        // Find minimum overlap to determine collision direction
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.velocityY > 0) {
            // Landing on top
            this.y = blockTop - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.canDoubleJump = true;
        } else if (minOverlap === overlapBottom && this.velocityY < 0) {
            // Hit from below
            this.y = blockBottom;
            this.velocityY = 0;
        }
        // Side collision - allow pass through (no action taken)
    }

    handleFallLoop() {
        this.y = -this.height;
        this.velocityY = 0;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    render(ctx) {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
        ctx.fillRect(this.x + 20, this.y + 5, 5, 5);

        if (!this.onGround) {
            ctx.fillStyle = '#FFD93D';
            ctx.fillRect(this.x + 10, this.y + 15, 10, 3);
        }
    }
}

class Block {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, offsetX) {
        const renderX = this.x - offsetX;

        // Main block
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(renderX, this.y, this.width, this.height);

        // Border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(renderX, this.y, this.width, this.height);

        // Highlight top edge
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(renderX + 2, this.y + 2, this.width - 4, 4);
    }
}

class Item {
    constructor(x, y, points = 10) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.points = points;
        this.collected = false;
        this.animationTime = 0;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    update(deltaTime) {
        this.animationTime += deltaTime / 1000;
    }

    render(ctx, offsetX) {
        if (!this.collected) {
            const bounce = Math.sin(this.animationTime * 5) * 3;
            const centerX = this.x - offsetX + this.width/2;
            const centerY = this.y + this.height/2 + bounce;

            if (this.points >= 30) {
                // High-value item (3x points) - special appearance
                ctx.fillStyle = '#FF1493'; // Deep pink outer ring
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width/2 + 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFD700'; // Gold middle
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FF6B6B'; // Red center
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width/3, 0, Math.PI * 2);
                ctx.fill();

                // Sparkle effect
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(centerX - 3, centerY - 3, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Normal item
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width/3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

class Stage {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.offsetX = 0;
        this.totalLength = 3000;
        this.blocks = [];
        this.items = [];
        this.generateLevel();
    }

    generateLevel() {
        this.groundY = 500;

        // Create jumpable obstacles on the ground
        this.blocks = [
            new Block(300, 450, 40, 50),   // Low obstacle
            new Block(500, 420, 40, 80),   // Medium obstacle
            new Block(700, 400, 40, 100),  // High obstacle (requires double jump)
            new Block(900, 460, 60, 40),   // Wide low obstacle
            new Block(1100, 430, 40, 70),  // Medium obstacle
            new Block(1300, 350, 40, 150), // Very high obstacle
            new Block(1500, 440, 50, 60),  // Medium-wide obstacle
            new Block(1750, 410, 40, 90),  // High obstacle
            new Block(2000, 470, 80, 30),  // Wide very low obstacle
            new Block(2200, 400, 40, 100), // High obstacle
            new Block(2400, 450, 40, 50),  // Low obstacle
            new Block(2600, 430, 40, 70),  // Medium obstacle
            new Block(2800, 460, 40, 40)   // Low obstacle before goal
        ];

        // Place items above obstacles and in air
        this.items = [
            new Item(320, 400),      // Above first obstacle (normal)
            new Item(520, 370),      // Above medium obstacle (normal)
            new Item(720, 300, 20),  // High above tall obstacle (double jump needed)
            new Item(920, 420),      // Above wide obstacle (normal)
            new Item(1120, 380),     // Above medium obstacle (normal)
            new Item(1320, 250, 30), // Very high (double jump needed)
            new Item(1520, 390),     // Above medium obstacle (normal)
            new Item(1770, 360),     // Above high obstacle (normal)
            new Item(2020, 440),     // Above low wide obstacle (normal)
            new Item(2220, 350),     // Above high obstacle (normal)
            new Item(2420, 400),     // Above low obstacle (normal)
            new Item(2620, 380),     // Above medium obstacle (normal)

            // High-value items requiring double jump from obstacle tops (3x points = 30)
            // Positioned high enough that ground-based double jump cannot reach (y < 230)
            // Moved further right to require forward momentum from block tops
            new Item(400, 200, 30),  // High right of first obstacle (only reachable from block top + forward jump)
            new Item(600, 190, 30),  // High right of medium obstacle (only reachable from block top + forward jump)
            new Item(1000, 210, 30), // High right of wide obstacle (only reachable from block top + forward jump)
            new Item(1200, 195, 30), // High right of medium obstacle (only reachable from block top + forward jump)
            new Item(1600, 200, 30), // High right of medium-wide obstacle (only reachable from block top + forward jump)
            new Item(1850, 180, 30), // High right of high obstacle (only reachable from block top + forward jump)
            new Item(2300, 185, 30), // High right of high obstacle (only reachable from block top + forward jump)
            new Item(2500, 205, 30), // High right of low obstacle (only reachable from block top + forward jump)
            new Item(2700, 195, 30)  // High right of medium obstacle (only reachable from block top + forward jump)
        ];
    }

    update(deltaTime) {
        if (!this.game.player.stopped) {
            this.offsetX += this.game.player.velocityX;
        }

        this.items.forEach(item => {
            item.update(deltaTime);
        });
    }

    getProgress() {
        return Math.min(this.offsetX / this.totalLength, 1);
    }

    isGoalReached() {
        return this.offsetX >= this.totalLength;
    }

    render(ctx) {
        // Draw ground/floor
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.offsetX, this.groundY, ctx.canvas.width + this.offsetX, ctx.canvas.height - this.groundY);

        // Draw ground pattern
        ctx.fillStyle = '#654321';
        for (let x = Math.floor(-this.offsetX / 40) * 40; x < ctx.canvas.width + this.offsetX; x += 40) {
            ctx.fillRect(x - this.offsetX, this.groundY, 2, ctx.canvas.height - this.groundY);
        }

        this.blocks.forEach(block => {
            if (block.x - this.offsetX > -block.width && block.x - this.offsetX < ctx.canvas.width) {
                block.render(ctx, this.offsetX);
            }
        });

        this.items.forEach(item => {
            if (item.x - this.offsetX > -item.width && item.x - this.offsetX < ctx.canvas.width) {
                item.render(ctx, this.offsetX);
            }
        });
    }
}

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    playJump() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playItem() {
        // Normal item collection sound - pleasant chime
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    playHighValueItem() {
        // High-value item collection sound - special triumphant sound
        const notes = [800, 1000, 1200, 1500];

        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
            }, index * 50);
        });
    }

    playGoal() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        let time = 0;

        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, time);
            time += 150;
        });
    }

    playGameOver() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
}

window.addEventListener('load', () => {
    new Game();
});