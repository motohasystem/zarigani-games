const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 800;

const TILE_SIZE = 40;
const MAP_WIDTH = 60; // 4画面分の横幅
const MAP_HEIGHT = 40; // 4画面分の縦幅

const sprites = {
    player: null,
    goblin: null,
    boss: null,
    potion: null,
    wall: null,
    rock: null,
    loaded: false
};

function loadSprites() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalSprites = 6; // スプライト数を増加
        
        function checkLoaded() {
            loadedCount++;
            if (loadedCount === totalSprites) {
                sprites.loaded = true;
                resolve();
            }
        }
        
        sprites.player = new Image();
        sprites.player.onload = checkLoaded;
        sprites.player.onerror = () => {
            console.log('Player sprite failed to load, using fallback');
            checkLoaded();
        };
        sprites.player.src = 'resource/player.png';
        
        sprites.goblin = new Image();
        sprites.goblin.onload = checkLoaded;
        sprites.goblin.onerror = () => {
            console.log('Goblin sprite failed to load, using fallback');
            checkLoaded();
        };
        sprites.goblin.src = 'resource/goblin.png';
        
        sprites.boss = new Image();
        sprites.boss.onload = checkLoaded;
        sprites.boss.onerror = () => {
            console.log('Boss sprite failed to load, using fallback');
            checkLoaded();
        };
        sprites.boss.src = 'resource/boss.png';
        
        sprites.potion = new Image();
        sprites.potion.onload = checkLoaded;
        sprites.potion.onerror = () => {
            console.log('Potion sprite failed to load, using fallback');
            checkLoaded();
        };
        sprites.potion.src = 'resource/potion.png';
        
        sprites.wall = new Image();
        sprites.wall.onload = checkLoaded;
        sprites.wall.onerror = () => {
            console.log('Wall sprite failed to load, using fallback');
            checkLoaded();
        };
        sprites.wall.src = 'resource/wall.png';
        
        sprites.rock = new Image();
        sprites.rock.onload = checkLoaded;
        sprites.rock.onerror = () => {
            console.log('Rock sprite failed to load, using fallback');
            checkLoaded();
        };
        sprites.rock.src = 'resource/rock.png';
    });
}

const game = {
    camera: { x: 0, y: 0 },
    enemyCount: 0,
    bossDefeated: false,
    gameOver: false,
    victory: false,
    started: false
};

const player = {
    x: 400,
    y: 400,
    size: 40,
    hp: 100,
    maxHp: 100,
    speed: 4,
    attackRange: 80,
    attackDamage: 20,
    attackCooldown: 0,
    attackDuration: 0,
    attackAngle: 0,
    invulnerable: 0,
    facing: 'right',
    knockbackX: 0,
    knockbackY: 0,
    level: 1,
    exp: 0,
    expToNext: 3,
    defeatedEnemies: 0
};

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const enemies = [];
const projectiles = [];
const items = [];
const meteors = [];
const walls = [];

// 効果音システム
const sounds = {
    attack: null,
    damage: null,
    heal: null,
    enemyHit: null,
    bgm: null,
    victory: null,
    gameOver: null,
    levelUp: null,
    muted: false
};

function initSounds() {
    sounds.attack = document.getElementById('attackSound');
    sounds.damage = document.getElementById('damageSound');
    sounds.heal = document.getElementById('healSound');
    sounds.enemyHit = document.getElementById('enemyHitSound');
    sounds.bgm = document.getElementById('bgmSound');
    sounds.victory = document.getElementById('victorySound');
    sounds.gameOver = document.getElementById('gameOverSound');
    sounds.levelUp = document.getElementById('levelUpSound');
    
    // ボリューム調整
    if (sounds.attack) sounds.attack.volume = 0.3;
    if (sounds.damage) sounds.damage.volume = 0.4;
    if (sounds.heal) sounds.heal.volume = 0.3;
    if (sounds.enemyHit) sounds.enemyHit.volume = 0.3;
    if (sounds.bgm) sounds.bgm.volume = 0.2;
    if (sounds.victory) sounds.victory.volume = 0.5;
    if (sounds.gameOver) sounds.gameOver.volume = 0.5;
    if (sounds.levelUp) sounds.levelUp.volume = 0.4;
}

function playSound(soundName) {
    if (sounds.muted || !sounds[soundName]) return;
    
    try {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {
            console.log('Could not play sound:', soundName);
        });
    } catch (e) {
        console.log('Sound error:', e);
    }
}

function playBGM() {
    if (sounds.muted || !sounds.bgm) return;
    
    try {
        sounds.bgm.play().catch(e => {
            console.log('Could not play BGM');
        });
    } catch (e) {
        console.log('BGM error:', e);
    }
}

function stopBGM() {
    if (sounds.bgm) {
        sounds.bgm.pause();
        sounds.bgm.currentTime = 0;
    }
}

// レベルアップシステム
function levelUp() {
    player.level++;
    player.exp = 0;
    player.expToNext = 3; // 次のレベルまでの敵数は固定
    
    // ステータスアップ
    player.attackDamage += 5;
    player.attackRange += 10;
    player.maxHp += 20;
    // 体力は回復しない
    
    playSound('levelUp');
    console.log(`レベルアップ! レベル ${player.level}`);
}

function gainExp() {
    player.exp++;
    player.defeatedEnemies++;
    
    if (player.exp >= player.expToNext) {
        levelUp();
    }
    
    updateUI();
}

function drawSprite(ctx, image, x, y, size, flipX = false) {
    if (!image || !sprites.loaded) {
        return false;
    }
    
    ctx.save();
    
    if (flipX) {
        ctx.scale(-1, 1);
        ctx.drawImage(image, -x - size, y - size, size * 2, size * 2);
    } else {
        ctx.drawImage(image, x - size, y - size, size * 2, size * 2);
    }
    
    ctx.restore();
    return true;
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.hp = type === 'boss' ? 2000 : (type === 'sword' ? 40 : 30);
        this.maxHp = this.hp;
        this.size = type === 'boss' ? 80 : 30;
        this.speed = type === 'sword' ? 2 : 1;
        this.attackCooldown = 0;
        this.color = type === 'boss' ? '#8b008b' : (type === 'sword' ? '#ff4444' : type === 'stone' ? '#888888' : '#44ff44');
        this.facing = 'left';
        this.knockbackX = 0;
        this.knockbackY = 0;
        // ボス用の追加プロパティ
        this.meleeAttackDuration = 0;
        this.meleeAttackAngle = 0;
    }

    update() {
        if (this.hp <= 0) return;

        // ノックバック処理
        if (this.knockbackX !== 0 || this.knockbackY !== 0) {
            this.x += this.knockbackX;
            this.y += this.knockbackY;
            this.knockbackX *= 0.8;
            this.knockbackY *= 0.8;
            if (Math.abs(this.knockbackX) < 0.5) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 0.5) this.knockbackY = 0;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dx > 0) {
            this.facing = 'right';
        } else {
            this.facing = 'left';
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        if (this.type === 'sword') {
            if (dist > 50) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            } else if (this.attackCooldown === 0) {
                if (player.invulnerable === 0) {
                    player.hp -= 10;
                    player.invulnerable = 90; // 90フレーム = 1.5秒（60FPS想定）
                    // プレイヤーをノックバック
                    const knockbackForce = 20;
                    player.knockbackX = (dx / dist) * knockbackForce;
                    player.knockbackY = (dy / dist) * knockbackForce;
                    playSound('damage');
                    updateUI();
                }
                this.attackCooldown = 90;
            }
        } else if (this.type === 'stone' && dist < 300) {
            if (this.attackCooldown === 0) {
                projectiles.push({
                    x: this.x,
                    y: this.y,
                    vx: (dx / dist) * 4,
                    vy: (dy / dist) * 4,
                    size: 8,
                    damage: 8,
                    color: '#666666'
                });
                this.attackCooldown = 120;
            }
        } else if (this.type === 'arrow' && dist < 400) {
            if (this.attackCooldown === 0) {
                projectiles.push({
                    x: this.x,
                    y: this.y,
                    vx: (dx / dist) * 6,
                    vy: (dy / dist) * 6,
                    size: 6,
                    damage: 12,
                    color: '#8b4513'
                });
                this.attackCooldown = 100;
            }
        } else if (this.type === 'boss') {
            // ボスの移動AI
            if (dist > 120 && dist < 500) {
                this.x += (dx / dist) * this.speed * 0.5;
                this.y += (dy / dist) * this.speed * 0.5;
            }
            
            // 近接攻撃の持続時間を更新
            if (this.meleeAttackDuration > 0) {
                this.meleeAttackDuration--;
            }
            
            if (this.attackCooldown === 0) {
                if (dist < 120) {
                    // 近距離攻撃：旋回斬りと衝撃波
                    const attackType = Math.random();
                    
                    if (attackType < 0.6) {
                        // 旋回斬り攻撃
                        this.meleeAttackDuration = 20;
                        this.meleeAttackAngle = Math.atan2(dy, dx);
                        this.attackCooldown = 90;
                        
                        // 近くのプレイヤーにダメージ
                        if (player.invulnerable === 0) {
                            player.hp -= 30;
                            player.invulnerable = 90;
                            const knockbackForce = 40;
                            player.knockbackX = (dx / dist) * knockbackForce;
                            player.knockbackY = (dy / dist) * knockbackForce;
                            playSound('damage');
                            updateUI();
                        }
                    } else {
                        // 衝撃波攻撃
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                            projectiles.push({
                                x: this.x + Math.cos(angle) * 50,
                                y: this.y + Math.sin(angle) * 50,
                                vx: Math.cos(angle) * 3,
                                vy: Math.sin(angle) * 3,
                                size: 12,
                                damage: 15,
                                color: '#8b008b',
                                type: 'shockwave'
                            });
                        }
                        this.attackCooldown = 120;
                    }
                } else if (dist < 400 && Math.random() < 0.4) {
                    // 遠距離攻撃：瘴気隕石
                    const meteorCount = Math.min(3 + Math.floor(player.level / 2), 8);
                    for (let i = 0; i < meteorCount; i++) {
                        meteors.push({
                            x: player.x + (Math.random() - 0.5) * 300,
                            y: player.y + (Math.random() - 0.5) * 300,
                            targetY: player.y + (Math.random() - 0.5) * 300,
                            size: 25 + Math.random() * 15,
                            falling: true,
                            height: 250 + Math.random() * 100,
                            damage: 18 + Math.random() * 8
                        });
                    }
                    this.attackCooldown = 200;
                }
            }
        }

        checkWallCollision(this);
    }

    draw() {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(this.x - game.camera.x, this.y - game.camera.y);

        if (this.type === 'boss') {
            // 瘴気オーラ
            ctx.fillStyle = 'rgba(139, 0, 139, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(75, 0, 130, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 近接攻撃エフェクト
            if (this.meleeAttackDuration > 0) {
                // 旋回斬りエフェクト
                const progress = 1 - (this.meleeAttackDuration / 20);
                const attackRadius = this.size + 60;
                
                ctx.strokeStyle = `rgba(255, 0, 255, ${0.8 - progress * 0.5})`;
                ctx.lineWidth = 8;
                ctx.beginPath();
                const startAngle = this.meleeAttackAngle - Math.PI / 3;
                const endAngle = this.meleeAttackAngle + Math.PI / 3;
                ctx.arc(0, 0, attackRadius, startAngle, endAngle);
                ctx.stroke();
                
                // キラキラエフェクト
                for (let i = 0; i < 8; i++) {
                    const sparkAngle = startAngle + (endAngle - startAngle) * (i / 7);
                    const sparkX = Math.cos(sparkAngle) * attackRadius;
                    const sparkY = Math.sin(sparkAngle) * attackRadius;
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 内側の衝撃波
                ctx.strokeStyle = `rgba(139, 0, 139, ${0.6 - progress * 0.4})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, attackRadius * 0.7, startAngle, endAngle);
                ctx.stroke();
            }
        }

        const spriteImage = this.type === 'boss' ? sprites.boss : sprites.goblin;
        const spriteDrawn = drawSprite(ctx, spriteImage, 0, 0, this.size, this.facing === 'left');
        
        if (!spriteDrawn) {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        }

        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(-this.size, -this.size - 10, this.size * 2, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-this.size, -this.size - 10, (this.size * 2) * (this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }

    takeDamage(damage, fromX, fromY) {
        this.hp -= damage;
        if (this.hp <= 0 && this.type === 'boss') {
            game.bossDefeated = true;
        } else if (this.hp > 0) {
            // 敵をノックバック
            const dx = this.x - fromX;
            const dy = this.y - fromY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const knockbackForce = this.type === 'boss' ? 10 : 15;
                this.knockbackX = (dx / dist) * knockbackForce;
                this.knockbackY = (dy / dist) * knockbackForce;
            }
        }
    }
}

function checkWallCollision(entity) {
    const collisionPadding = 15; // 壁の当たり判定を小さくする
    for (const wall of walls) {
        const left = entity.x - entity.size;
        const right = entity.x + entity.size;
        const top = entity.y - entity.size;
        const bottom = entity.y + entity.size;

        const wallLeft = wall.x + collisionPadding;
        const wallRight = wall.x + TILE_SIZE - collisionPadding;
        const wallTop = wall.y + collisionPadding;
        const wallBottom = wall.y + TILE_SIZE - collisionPadding;

        if (right > wallLeft && left < wallRight && bottom > wallTop && top < wallBottom) {
            const overlapX = Math.min(right - wallLeft, wallRight - left);
            const overlapY = Math.min(bottom - wallTop, wallBottom - top);

            if (overlapX < overlapY) {
                if (entity.x < wall.x + TILE_SIZE / 2) {
                    entity.x = wallLeft - entity.size;
                } else {
                    entity.x = wallRight + entity.size;
                }
            } else {
                if (entity.y < wall.y + TILE_SIZE / 2) {
                    entity.y = wallTop - entity.size;
                } else {
                    entity.y = wallBottom + entity.size;
                }
            }
        }
    }
}

function initMap() {
    for (let i = 0; i < MAP_WIDTH; i++) {
        walls.push({ x: i * TILE_SIZE, y: 0 });
        walls.push({ x: i * TILE_SIZE, y: (MAP_HEIGHT - 1) * TILE_SIZE });
    }
    for (let i = 1; i < MAP_HEIGHT - 1; i++) {
        walls.push({ x: 0, y: i * TILE_SIZE });
        walls.push({ x: (MAP_WIDTH - 1) * TILE_SIZE, y: i * TILE_SIZE });
    }

    // マップが大きくなったので障害物も増加
    for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'wall' });
    }
    
    // 岩の障害物を追加
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, type: 'rock' });
    }

    // アイテム数も増加
    for (let i = 0; i < 20; i++) {
        items.push({
            x: Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            y: Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            type: 'health',
            value: 30
        });
    }

    // マップを大きくしたのでボスの初期位置も変更
    enemies.push(new Enemy(MAP_WIDTH * TILE_SIZE * 0.8, MAP_HEIGHT * TILE_SIZE * 0.8, 'boss'));

    // 敵の数も増加
    for (let i = 0; i < 12; i++) {
        enemies.push(new Enemy(
            Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            'sword'
        ));
    }
    for (let i = 0; i < 10; i++) {
        enemies.push(new Enemy(
            Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            'stone'
        ));
    }
    for (let i = 0; i < 10; i++) {
        enemies.push(new Enemy(
            Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            'arrow'
        ));
    }

    game.enemyCount = enemies.length;
    updateUI();
}

function updatePlayer() {
    if (game.gameOver || game.victory || !game.started) return;

    // ノックバック処理
    if (player.knockbackX !== 0 || player.knockbackY !== 0) {
        player.x += player.knockbackX;
        player.y += player.knockbackY;
        player.knockbackX *= 0.8;
        player.knockbackY *= 0.8;
        if (Math.abs(player.knockbackX) < 0.5) player.knockbackX = 0;
        if (Math.abs(player.knockbackY) < 0.5) player.knockbackY = 0;
    }

    let dx = 0, dy = 0;
    if (keys.w) dy = -player.speed;
    if (keys.s) dy = player.speed;
    if (keys.a) {
        dx = -player.speed;
        player.facing = 'left';
    }
    if (keys.d) {
        dx = player.speed;
        player.facing = 'right';
    }

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.x += dx;
    player.y += dy;

    checkWallCollision(player);

    player.x = Math.max(player.size, Math.min(MAP_WIDTH * TILE_SIZE - player.size, player.x));
    player.y = Math.max(player.size, Math.min(MAP_HEIGHT * TILE_SIZE - player.size, player.y));

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.attackDuration > 0) player.attackDuration--;
    if (player.invulnerable > 0) player.invulnerable--;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);
        if (dist < 30) {
            player.hp = Math.min(player.maxHp, player.hp + item.value);
            items.splice(i, 1);
            playSound('heal');
            updateUI();
        }
    }

    if (player.hp <= 0) {
        game.gameOver = true;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('retryButton').style.display = 'block';
        stopBGM();
        playSound('gameOver');
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;

        const dist = Math.sqrt((player.x - proj.x) ** 2 + (player.y - proj.y) ** 2);
        if (dist < player.size + proj.size) {
            if (player.invulnerable === 0) {
                player.hp -= proj.damage;
                player.invulnerable = 90; // 90フレーム = 1.5秒（60FPS想定）
                // プレイヤーをノックバック
                const knockbackForce = 15;
                player.knockbackX = proj.vx / Math.abs(proj.vx || 1) * knockbackForce;
                player.knockbackY = proj.vy / Math.abs(proj.vy || 1) * knockbackForce;
                playSound('damage');
                updateUI();
            }
            projectiles.splice(i, 1);
            continue;
        }

        if (proj.x < 0 || proj.x > MAP_WIDTH * TILE_SIZE || 
            proj.y < 0 || proj.y > MAP_HEIGHT * TILE_SIZE) {
            projectiles.splice(i, 1);
        }
    }
}

function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        
        if (meteor.falling) {
            meteor.height -= 8;
            if (meteor.height <= 0) {
                meteor.falling = false;
                meteor.impactTime = 30;
            }
        } else if (meteor.impactTime > 0) {
            meteor.impactTime--;
            
            if (meteor.impactTime === 29) {
                const dist = Math.sqrt((player.x - meteor.x) ** 2 + (player.y - meteor.targetY) ** 2);
                if (dist < meteor.size + player.size) {
                    if (player.invulnerable === 0) {
                        player.hp -= meteor.damage;
                        player.invulnerable = 90; // 90フレーム = 1.5秒（60FPS想定）
                        // プレイヤーをノックバック
                        const dx = player.x - meteor.x;
                        const dy = player.y - meteor.targetY;
                        const knockDist = Math.sqrt(dx * dx + dy * dy);
                        if (knockDist > 0) {
                            const knockbackForce = 25;
                            player.knockbackX = (dx / knockDist) * knockbackForce;
                            player.knockbackY = (dy / knockDist) * knockbackForce;
                        }
                        playSound('damage');
                        updateUI();
                    }
                }
            }
            
            if (meteor.impactTime === 0) {
                meteors.splice(i, 1);
            }
        }
    }
}

function drawGame() {
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    game.camera.x = player.x - canvas.width / 2;
    game.camera.y = player.y - canvas.height / 2;
    game.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, game.camera.x));
    game.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, game.camera.y));

    for (const wall of walls) {
        const spriteImage = wall.type === 'rock' ? sprites.rock : sprites.wall;
        const spriteDrawn = drawSprite(ctx, spriteImage, wall.x + TILE_SIZE/2 - game.camera.x, wall.y + TILE_SIZE/2 - game.camera.y, TILE_SIZE/2, false);
        
        if (!spriteDrawn) {
            ctx.fillStyle = wall.type === 'rock' ? '#777777' : '#444444';
            ctx.fillRect(
                wall.x - game.camera.x,
                wall.y - game.camera.y,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }

    for (const item of items) {
        ctx.save();
        ctx.translate(item.x - game.camera.x, item.y - game.camera.y);
        
        const spriteDrawn = drawSprite(ctx, sprites.potion, 0, 0, 20, false);
        
        if (!spriteDrawn) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-10, -10, 20, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+', 0, 5);
        }
        
        ctx.restore();
    }

    for (const meteor of meteors) {
        ctx.save();
        ctx.translate(meteor.x - game.camera.x, meteor.targetY - game.camera.y);
        
        if (meteor.falling) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(0, -meteor.height, meteor.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(0, 0, meteor.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    enemies.forEach(enemy => enemy.draw());

    for (const proj of projectiles) {
        ctx.save();
        ctx.translate(proj.x - game.camera.x, proj.y - game.camera.y);
        
        if (proj.type === 'shockwave') {
            // ボスの衝撃波エフェクト
            ctx.fillStyle = proj.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, proj.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 光る縁
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, proj.size, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // 通常の弾丸
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(0, 0, proj.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    ctx.save();
    ctx.translate(player.x - game.camera.x, player.y - game.camera.y);
    
    if (player.invulnerable > 0 && Math.floor(player.invulnerable / 5) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    const playerSpriteDrawn = drawSprite(ctx, sprites.player, 0, 0, player.size, player.facing === 'left');
    
    if (!playerSpriteDrawn) {
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(-player.size, -player.size, player.size * 2, player.size * 2);
    }
    
    if (player.attackDuration > 0) {
        // レベルに応じた攻撃エフェクト
        const level = player.level;
        
        // レベル1: 基本攻撃
        ctx.strokeStyle = level >= 3 ? '#ff00ff' : level >= 2 ? '#ff8800' : '#ffff00';
        ctx.lineWidth = Math.min(level * 2 + 1, 8);
        ctx.beginPath();
        ctx.arc(0, 0, player.attackRange, 
            player.attackAngle - 0.5, 
            player.attackAngle + 0.5);
        ctx.stroke();
        
        // レベル2+: 追加エフェクト
        if (level >= 2) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, player.attackRange * 0.8, 
                player.attackAngle - 0.3, 
                player.attackAngle + 0.3);
            ctx.stroke();
        }
        
        // レベル3+: キラキラエフェクト
        if (level >= 3) {
            for (let i = 0; i < 5; i++) {
                const sparkAngle = player.attackAngle + (Math.random() - 0.5) * 1.5;
                const sparkDist = player.attackRange * (0.5 + Math.random() * 0.5);
                const sparkX = Math.cos(sparkAngle) * sparkDist;
                const sparkY = Math.sin(sparkAngle) * sparkDist;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // レベル4+: 衝撃波エフェクト
        if (level >= 4) {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, player.attackRange * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

function attack(mouseX, mouseY) {
    if (player.attackCooldown > 0 || game.gameOver || game.victory) return;

    const worldX = mouseX + game.camera.x;
    const worldY = mouseY + game.camera.y;
    
    player.attackAngle = Math.atan2(worldY - player.y, worldX - player.x);
    player.attackDuration = 10;
    player.attackCooldown = 30;
    playSound('attack');

    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        
        const dist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (dist <= player.attackRange + enemy.size) {
            enemy.takeDamage(player.attackDamage, player.x, player.y);
            playSound('enemyHit');
            if (enemy.hp <= 0) {
                game.enemyCount--;
                gainExp(); // 経験値取得
                updateUI();
                
                if (game.bossDefeated && game.enemyCount === 0) {
                    game.victory = true;
                    document.getElementById('victory').style.display = 'block';
                    document.getElementById('victoryRetryButton').style.display = 'block';
                    stopBGM();
                    playSound('victory');
                }
            }
        }
    }
}

function updateUI() {
    document.getElementById('hpText').textContent = Math.max(0, player.hp);
    document.getElementById('maxHpText').textContent = player.maxHp;
    document.getElementById('hpFill').style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
    document.getElementById('enemyCount').textContent = game.enemyCount;
    document.getElementById('levelText').textContent = player.level;
    document.getElementById('expText').textContent = `${player.exp}/${player.expToNext}`;
}

function gameLoop() {
    if (game.started) {
        updatePlayer();
        enemies.forEach(enemy => enemy.update());
        updateProjectiles();
        updateMeteors();
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = false;
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    attack(e.clientX - rect.left, e.clientY - rect.top);
});

function resetGame() {
    // ゲーム状態をリセット
    game.enemyCount = 0;
    game.bossDefeated = false;
    game.gameOver = false;
    game.victory = false;
    game.started = true;
    
    // BGMを再生
    playBGM();
    
    // プレイヤーをリセット（マップ中央付近）
    player.x = MAP_WIDTH * TILE_SIZE * 0.3;
    player.y = MAP_HEIGHT * TILE_SIZE * 0.3;
    player.hp = 100;
    player.maxHp = 100;
    player.level = 1;
    player.exp = 0;
    player.expToNext = 3;
    player.defeatedEnemies = 0;
    player.attackDamage = 20;
    player.attackRange = 80;
    player.invulnerable = 0;
    player.knockbackX = 0;
    player.knockbackY = 0;
    player.attackCooldown = 0;
    player.attackDuration = 0;
    
    // ボスのリセットも必要
    enemies.forEach(enemy => {
        if (enemy.type === 'boss') {
            enemy.meleeAttackDuration = 0;
            enemy.meleeAttackAngle = 0;
        }
    });
    
    // 配列をクリア
    enemies.length = 0;
    projectiles.length = 0;
    items.length = 0;
    meteors.length = 0;
    walls.length = 0;
    
    // UIをリセット
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('retryButton').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('victoryRetryButton').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    
    // マップを再初期化
    initMap();
}

// スタートボタン
document.getElementById('startButton').addEventListener('click', () => {
    resetGame();
});

// リトライボタン
document.getElementById('retryButton').addEventListener('click', () => {
    resetGame();
});

// 勝利後のリトライボタン
document.getElementById('victoryRetryButton').addEventListener('click', () => {
    resetGame();
});

// 初期化
initSounds();

loadSprites().then(() => {
    console.log('Sprites loaded');
    gameLoop();
}).catch((error) => {
    console.log('Starting game without sprites');
    gameLoop();
});