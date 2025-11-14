// 天体データベース（直径はkm単位）
const celestialBodies = {
    moon: {
        name: '月',
        diameter: 3474,
        color: '#c0c0c0',
        type: '衛星'
    },
    mercury: {
        name: '水星',
        diameter: 4879,
        color: '#8c7853',
        type: '惑星'
    },
    mars: {
        name: '火星',
        diameter: 6779,
        color: '#cd5c5c',
        type: '惑星'
    },
    venus: {
        name: '金星',
        diameter: 12104,
        color: '#ffd700',
        type: '惑星'
    },
    earth: {
        name: '地球',
        diameter: 12742,
        color: '#4169e1',
        type: '惑星'
    },
    neptune: {
        name: '海王星',
        diameter: 49528,
        color: '#4169ff',
        type: '惑星'
    },
    uranus: {
        name: '天王星',
        diameter: 51118,
        color: '#4fd0e0',
        type: '惑星'
    },
    saturn: {
        name: '土星',
        diameter: 120536,
        color: '#fad5a5',
        type: '惑星'
    },
    jupiter: {
        name: '木星',
        diameter: 142984,
        color: '#daa520',
        type: '惑星'
    },
    sun: {
        name: '太陽',
        diameter: 1392700,
        color: '#ffcc00',
        type: '恒星'
    },
    betelgeuse: {
        name: 'ベテルギウス',
        diameter: 887000000,
        color: '#ff4500',
        type: '赤色超巨星'
    },
    antares: {
        name: 'アンタレス',
        diameter: 883000000,
        color: '#ff6347',
        type: '赤色超巨星'
    },
    rigel: {
        name: 'リゲル',
        diameter: 109000000,
        color: '#87ceeb',
        type: '青色超巨星'
    },
    aldebaran: {
        name: 'アルデバラン',
        diameter: 61400000,
        color: '#ff8c00',
        type: '赤色巨星'
    }
};

// アプリケーション状態
class SpaceComparison {
    constructor() {
        this.canvas = document.getElementById('space-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');
        this.selectElement = document.getElementById('celestial-select');
        this.addButton = document.getElementById('add-button');
        this.resetButton = document.getElementById('reset-button');
        this.scaleValue = document.getElementById('scale-value');
        this.countValue = document.getElementById('count-value');

        // 表示中の天体リスト
        this.displayedBodies = [];

        // キャンバスの設定
        this.padding = 100; // 天体間のパディング
        this.baseScale = 1; // 基準スケール（ピクセル/km）

        // ドラッグスクロール用の変数
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;

        // 天体のユニークIDカウンター
        this.bodyCounter = 0;

        this.init();
    }

    init() {
        // イベントリスナーの設定
        this.addButton.addEventListener('click', () => this.addCelestialBody());
        this.resetButton.addEventListener('click', () => this.reset());

        // Enterキーでも追加できるように
        this.selectElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addCelestialBody();
            }
        });

        // マウスドラッグでスクロール
        this.container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startX = e.pageX - this.container.offsetLeft;
            this.scrollLeft = this.container.scrollLeft;
            this.container.style.cursor = 'grabbing';
        });

        this.container.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.container.style.cursor = 'grab';
        });

        this.container.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.container.style.cursor = 'grab';
        });

        this.container.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            const x = e.pageX - this.container.offsetLeft;
            const walk = (x - this.startX) * 2; // スクロール速度調整
            this.container.scrollLeft = this.scrollLeft - walk;
        });

        // 初期状態：地球を表示
        this.reset();
    }

    reset() {
        this.bodyCounter = 0;
        this.displayedBodies = [
            { uniqueId: this.bodyCounter++, id: 'earth', ...celestialBodies.earth }
        ];
        this.render();
        this.updateInfo();
    }

    addCelestialBody() {
        const selectedId = this.selectElement.value;

        if (!selectedId) {
            alert('天体を選択してください');
            return;
        }

        const body = celestialBodies[selectedId];
        this.displayedBodies.push({ uniqueId: this.bodyCounter++, id: selectedId, ...body });

        this.render();
        this.updateInfo();

        // 最後に追加した天体を中央に表示
        this.scrollToLastBody();

        // 選択をリセット
        this.selectElement.value = '';
    }

    calculateScale() {
        // 最大の天体の直径を取得
        const maxDiameter = Math.max(...this.displayedBodies.map(b => b.diameter));

        // キャンバスの高さの70%を最大天体のサイズとする
        const maxPixelSize = this.container.clientHeight * 0.7;

        // スケールを計算（ピクセル/km）
        this.baseScale = maxPixelSize / maxDiameter;

        return this.baseScale;
    }

    render() {
        const scale = this.calculateScale();

        // キャンバスのサイズを計算
        const canvasHeight = this.container.clientHeight;
        let canvasWidth = this.padding;

        // 各天体の表示サイズと位置を計算
        const bodiesWithPositions = this.displayedBodies.map((body, index) => {
            const pixelDiameter = body.diameter * scale;
            const radius = pixelDiameter / 2;
            const x = canvasWidth + radius;
            const y = canvasHeight / 2;

            canvasWidth += pixelDiameter + this.padding;

            return {
                ...body,
                x,
                y,
                radius,
                pixelDiameter
            };
        });

        // キャンバスのサイズを設定
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // 背景をクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 各天体を描画
        bodiesWithPositions.forEach((body, index) => {
            this.drawCelestialBody(body);

            // 接続線を描画（最初の天体以外）
            if (index > 0) {
                const prevBody = bodiesWithPositions[index - 1];
                this.drawConnectionLine(prevBody, body);
            }
        });

        // 最後の天体の位置を保存（スクロール用）
        this.lastBodyX = bodiesWithPositions[bodiesWithPositions.length - 1].x;
    }

    drawCelestialBody(body) {
        const { x, y, radius, name, color, diameter, type, pixelDiameter } = body;

        // 影を追加
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // グラデーションで球体を描画
        const gradient = this.ctx.createRadialGradient(
            x - radius * 0.3,
            y - radius * 0.3,
            radius * 0.1,
            x,
            y,
            radius
        );

        // 明るい部分
        gradient.addColorStop(0, this.lightenColor(color, 40));
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 影をリセット
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // ラベルを描画
        this.drawLabel(body);
    }

    drawLabel(body) {
        const { x, y, radius, name, diameter, type } = body;

        // ラベルの位置（天体の下）
        const labelY = y + radius + 30;

        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.strokeStyle = '#4a90e2';
        this.ctx.lineWidth = 2;

        const padding = 10;
        const fontSize = Math.min(16, Math.max(12, radius / 5));
        this.ctx.font = `bold ${fontSize}px sans-serif`;

        const nameText = name;
        const diameterText = `直径: ${diameter.toLocaleString()} km`;
        const typeText = type;

        const nameWidth = this.ctx.measureText(nameText).width;
        const diameterWidth = this.ctx.measureText(diameterText).width;
        const typeWidth = this.ctx.measureText(typeText).width;
        const maxWidth = Math.max(nameWidth, diameterWidth, typeWidth);

        const boxWidth = maxWidth + padding * 2;
        const boxHeight = fontSize * 3.5 + padding * 2;

        this.ctx.fillRect(x - boxWidth / 2, labelY, boxWidth, boxHeight);
        this.ctx.strokeRect(x - boxWidth / 2, labelY, boxWidth, boxHeight);

        // テキスト
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        this.ctx.fillText(nameText, x, labelY + padding);
        this.ctx.font = `${fontSize - 2}px sans-serif`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText(diameterText, x, labelY + padding + fontSize + 2);
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillText(typeText, x, labelY + padding + fontSize * 2 + 4);
    }

    drawConnectionLine(body1, body2) {
        const x1 = body1.x + body1.radius;
        const x2 = body2.x - body2.radius;
        const y = body1.y;

        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y);
        this.ctx.lineTo(x2, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    scrollToLastBody() {
        // 最後に追加した天体を画面中央に配置
        setTimeout(() => {
            const scrollLeft = this.lastBodyX - this.container.clientWidth / 2;
            this.container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }, 100);
    }

    updateInfo() {
        // スケール情報を更新
        const scale = this.baseScale;
        const kmPerPixel = 1 / scale;

        if (kmPerPixel >= 1000) {
            this.scaleValue.textContent = `1ピクセル = ${(kmPerPixel / 1000).toFixed(2)} km`;
        } else if (kmPerPixel >= 1) {
            this.scaleValue.textContent = `1ピクセル = ${kmPerPixel.toFixed(2)} km`;
        } else {
            this.scaleValue.textContent = `${(1/kmPerPixel).toFixed(2)} ピクセル = 1 km`;
        }

        // 天体数を更新
        this.countValue.textContent = this.displayedBodies.length;
    }

    // ユーティリティ関数：色を明るくする
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    // ユーティリティ関数：色を暗くする
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }
}

// ウィンドウリサイズ時の再描画
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new SpaceComparison();

    window.addEventListener('resize', () => {
        app.render();
    });
});
