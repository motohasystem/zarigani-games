const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 800;

const TILE_SIZE = 40;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;

const game = {
    camera: { x: 0, y: 0 },
    enemyCount: 0,
    bossDefeated: false,
    gameOver: false,
    victory: false
};

const player = {
    x: 400,
    y: 400,
    size: 20,
    hp: 100,
    maxHp: 100,
    speed: 4,
    attackRange: 60,
    attackDamage: 20,
    attackCooldown: 0,
    attackDuration: 0,
    attackAngle: 0,
    invulnerable: 0
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

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.hp = type === 'boss' ? 200 : (type === 'sword' ? 40 : 30);
        this.maxHp = this.hp;
        this.size = type === 'boss' ? 40 : 15;
        this.speed = type === 'sword' ? 2 : 1;
        this.attackCooldown = 0;
        this.color = type === 'boss' ? '#8b008b' : (type === 'sword' ? '#ff4444' : type === 'stone' ? '#888888' : '#44ff44');
    }

    update() {
        if (this.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.attackCooldown > 0) this.attackCooldown--;

        if (this.type === 'sword') {
            if (dist > 30) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            } else if (this.attackCooldown === 0) {
                if (player.invulnerable === 0) {
                    player.hp -= 10;
                    player.invulnerable = 60;
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
            if (dist > 100 && dist < 500) {
                this.x += (dx / dist) * this.speed * 0.5;
                this.y += (dy / dist) * this.speed * 0.5;
            }
            if (this.attackCooldown === 0) {
                if (dist < 60) {
                    if (player.invulnerable === 0) {
                        player.hp -= 25;
                        player.invulnerable = 60;
                        updateUI();
                    }
                    this.attackCooldown = 120;
                } else if (Math.random() < 0.5) {
                    for (let i = 0; i < 5; i++) {
                        meteors.push({
                            x: player.x + (Math.random() - 0.5) * 200,
                            y: player.y + (Math.random() - 0.5) * 200,
                            targetY: player.y + (Math.random() - 0.5) * 200,
                            size: 30,
                            falling: true,
                            height: 300,
                            damage: 20
                        });
                    }
                    this.attackCooldown = 180;
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
            ctx.fillStyle = 'rgba(139, 0, 139, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);

        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(-this.size, -this.size - 10, this.size * 2, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-this.size, -this.size - 10, (this.size * 2) * (this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0 && this.type === 'boss') {
            game.bossDefeated = true;
        }
    }
}

function checkWallCollision(entity) {
    for (const wall of walls) {
        const left = entity.x - entity.size;
        const right = entity.x + entity.size;
        const top = entity.y - entity.size;
        const bottom = entity.y + entity.size;

        const wallLeft = wall.x;
        const wallRight = wall.x + TILE_SIZE;
        const wallTop = wall.y;
        const wallBottom = wall.y + TILE_SIZE;

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

    for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE });
    }

    for (let i = 0; i < 8; i++) {
        items.push({
            x: Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            y: Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            type: 'health',
            value: 30
        });
    }

    enemies.push(new Enemy(800, 400, 'boss'));

    for (let i = 0; i < 5; i++) {
        enemies.push(new Enemy(
            Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            'sword'
        ));
    }
    for (let i = 0; i < 4; i++) {
        enemies.push(new Enemy(
            Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            'stone'
        ));
    }
    for (let i = 0; i < 4; i++) {
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
    if (game.gameOver || game.victory) return;

    let dx = 0, dy = 0;
    if (keys.w) dy = -player.speed;
    if (keys.s) dy = player.speed;
    if (keys.a) dx = -player.speed;
    if (keys.d) dx = player.speed;

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
            updateUI();
        }
    }

    if (player.hp <= 0) {
        game.gameOver = true;
        document.getElementById('gameOver').style.display = 'block';
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
                player.invulnerable = 30;
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
                        player.invulnerable = 60;
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
        ctx.fillStyle = '#444444';
        ctx.fillRect(
            wall.x - game.camera.x,
            wall.y - game.camera.y,
            TILE_SIZE,
            TILE_SIZE
        );
    }

    for (const item of items) {
        ctx.save();
        ctx.translate(item.x - game.camera.x, item.y - game.camera.y);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', 0, 5);
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
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x - game.camera.x, proj.y - game.camera.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.translate(player.x - game.camera.x, player.y - game.camera.y);
    
    if (player.invulnerable > 0 && Math.floor(player.invulnerable / 5) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = '#4444ff';
    ctx.fillRect(-player.size, -player.size, player.size * 2, player.size * 2);
    
    if (player.attackDuration > 0) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.attackRange, 
            player.attackAngle - 0.5, 
            player.attackAngle + 0.5);
        ctx.stroke();
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

    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        
        const dist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (dist <= player.attackRange + enemy.size) {
            enemy.takeDamage(player.attackDamage);
            if (enemy.hp <= 0) {
                game.enemyCount--;
                updateUI();
                
                if (game.bossDefeated && game.enemyCount === 0) {
                    game.victory = true;
                    document.getElementById('victory').style.display = 'block';
                }
            }
        }
    }
}

function updateUI() {
    document.getElementById('hpText').textContent = Math.max(0, player.hp);
    document.getElementById('hpFill').style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
    document.getElementById('enemyCount').textContent = game.enemyCount;
}

function gameLoop() {
    updatePlayer();
    enemies.forEach(enemy => enemy.update());
    updateProjectiles();
    updateMeteors();
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

initMap();
gameLoop();