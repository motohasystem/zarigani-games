// 天体データベース（直径はkm単位）
const celestialBodies = {
    moon: {
        name: '月',
        hiraganaName: 'つき',
        diameter: 3474,
        color: '#c0c0c0',
        type: '衛星',
        hiraganaType: 'えいせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg'
    },
    mercury: {
        name: '水星',
        hiraganaName: 'すいせい',
        diameter: 4879,
        color: '#8c7853',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Mercury_in_color_-_Prockter07-edit.jpg'
    },
    mars: {
        name: '火星',
        hiraganaName: 'かせい',
        diameter: 6779,
        color: '#cd5c5c',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg'
    },
    venus: {
        name: '金星',
        hiraganaName: 'きんせい',
        diameter: 12104,
        color: '#ffd700',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg'
    },
    earth: {
        name: '地球',
        hiraganaName: 'ちきゅう',
        diameter: 12742,
        color: '#4169e1',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg'
    },
    neptune: {
        name: '海王星',
        hiraganaName: 'かいおうせい',
        diameter: 49528,
        color: '#4169ff',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg'
    },
    uranus: {
        name: '天王星',
        hiraganaName: 'てんのうせい',
        diameter: 51118,
        color: '#4fd0e0',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg'
    },
    saturn: {
        name: '土星',
        hiraganaName: 'どせい',
        diameter: 120536,
        color: '#fad5a5',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg'
    },
    jupiter: {
        name: '木星',
        hiraganaName: 'もくせい',
        diameter: 142984,
        color: '#daa520',
        type: '惑星',
        hiraganaType: 'わくせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg'
    },
    sun: {
        name: '太陽',
        hiraganaName: 'たいよう',
        diameter: 1392700,
        color: '#ffcc00',
        type: '恒星',
        hiraganaType: 'こうせい',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg'
    },
    betelgeuse: {
        name: 'ベテルギウス',
        hiraganaName: 'べてるぎうす',
        diameter: 887000000,
        color: '#ff4500',
        type: '赤色超巨星',
        hiraganaType: 'せきしょくちょうきょせい',
        imageUrl: null  // 実際の画像がないため色で描画
    },
    antares: {
        name: 'アンタレス',
        hiraganaName: 'あんたれす',
        diameter: 883000000,
        color: '#ff6347',
        type: '赤色超巨星',
        hiraganaType: 'せきしょくちょうきょせい',
        imageUrl: null
    },
    rigel: {
        name: 'リゲル',
        hiraganaName: 'りげる',
        diameter: 109000000,
        color: '#87ceeb',
        type: '青色超巨星',
        hiraganaType: 'せいしょくちょうきょせい',
        imageUrl: null
    },
    aldebaran: {
        name: 'アルデバラン',
        hiraganaName: 'あるでばらん',
        diameter: 61400000,
        color: '#ff8c00',
        type: '赤色巨星',
        hiraganaType: 'せきしょくきょせい',
        imageUrl: null
    }
};

// 天体の表示順序
const celestialOrder = [
    'moon', 'mercury', 'mars', 'venus', 'earth',
    'neptune', 'uranus', 'saturn', 'jupiter', 'sun',
    'betelgeuse', 'antares', 'rigel', 'aldebaran'
];

// アプリケーション状態
class SpaceComparison {
    constructor() {
        this.canvas = document.getElementById('space-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');
        this.selectElement = document.getElementById('celestial-select');
        this.selectLabel = document.getElementById('select-label');
        this.addButton = document.getElementById('add-button');
        this.resetButton = document.getElementById('reset-button');
        this.scaleValue = document.getElementById('scale-value');
        this.countValue = document.getElementById('count-value');
        this.scaleLabel = document.getElementById('scale-label');
        this.countLabel = document.getElementById('count-label');
        this.mainTitle = document.getElementById('main-title');
        this.subtitle = document.getElementById('subtitle');
        this.kanjiModeRadio = document.getElementById('kanji-mode');
        this.hiraganaModeRadio = document.getElementById('hiragana-mode');

        // 表示中の天体リスト
        this.displayedBodies = [];

        // 表示モード（false: 漢字, true: ひらがな）
        this.isHiraganaMode = false;

        // キャンバスの設定
        this.padding = 100; // 天体間のパディング
        this.baseScale = 1; // 基準スケール（ピクセル/km）

        // ドラッグスクロール用の変数
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;

        // 天体のユニークIDカウンター
        this.bodyCounter = 0;

        // 画像キャッシュ
        this.imageCache = {};
        this.loadImages();

        this.init();
    }

    loadImages() {
        // 各天体の画像を事前に読み込む
        Object.keys(celestialBodies).forEach(id => {
            const body = celestialBodies[id];
            if (body.imageUrl) {
                const img = new Image();
                img.crossOrigin = 'anonymous';  // CORS対策
                img.src = body.imageUrl;
                img.onload = () => {
                    this.imageCache[id] = img;
                    // 画像が読み込まれたら再描画
                    if (this.displayedBodies.some(b => b.id === id)) {
                        this.render();
                    }
                };
                img.onerror = () => {
                    console.warn(`画像の読み込みに失敗しました: ${body.name}`);
                };
            }
        });
    }

    updateText() {
        // タイトルと説明を更新
        if (this.isHiraganaMode) {
            this.mainTitle.textContent = 'うちゅうくらべ';
            this.subtitle.textContent = 'てんたいのおおきさをくらべてみよう！';
            this.scaleLabel.textContent = 'しゅくしゃく';
            this.countLabel.textContent = 'ひょうじちゅうのてんたい';
            this.addButton.textContent = 'ついか';
            this.resetButton.textContent = 'りせっと';
        } else {
            this.mainTitle.textContent = 'ウチュークラベ';
            this.subtitle.textContent = '天体のサイズを比較してみよう！';
            this.scaleLabel.textContent = '縮尺';
            this.countLabel.textContent = '表示中の天体';
            this.addButton.textContent = '追加';
            this.resetButton.textContent = 'リセット';
        }
    }

    updateDropdown() {
        // プレースホルダー以外のオプションを削除
        while (this.selectElement.options.length > 1) {
            this.selectElement.remove(1);
        }

        // プレースホルダーを更新
        this.selectElement.options[0].text = this.isHiraganaMode
            ? '-- てんたいをえらんでください --'
            : '-- 天体を選んでください --';

        // ラベルを更新
        this.selectLabel.textContent = this.isHiraganaMode
            ? 'てんたいをせんたく:'
            : '天体を選択:';

        // 天体のオプションを追加
        celestialOrder.forEach(id => {
            const body = celestialBodies[id];
            const option = document.createElement('option');
            option.value = id;

            if (this.isHiraganaMode) {
                // ひらがなモード
                option.text = `${body.hiraganaName}（${body.hiraganaType}）`;
            } else {
                // 漢字モード
                option.text = body.name;
                // 恒星の場合は種別を表示
                if (body.type.includes('星')) {
                    option.text += `（${body.type}）`;
                }
            }

            this.selectElement.add(option);
        });
    }

    init() {
        // ドロップダウンとテキストを初期化
        this.updateDropdown();
        this.updateText();

        // イベントリスナーの設定
        this.addButton.addEventListener('click', () => this.addCelestialBody());
        this.resetButton.addEventListener('click', () => this.reset());

        // ラジオボタンの変更イベント
        this.kanjiModeRadio.addEventListener('change', () => {
            this.isHiraganaMode = false;
            this.updateText();
            this.updateDropdown();
            this.render();
        });
        this.hiraganaModeRadio.addEventListener('change', () => {
            this.isHiraganaMode = true;
            this.updateText();
            this.updateDropdown();
            this.render();
        });

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

            // 直前の天体との比較情報を計算
            let comparison = null;
            if (index > 0) {
                const prevBody = this.displayedBodies[index - 1];
                const diameterRatio = body.diameter / prevBody.diameter;
                const volumeRatio = Math.pow(diameterRatio, 3);
                comparison = {
                    diameterRatio,
                    volumeRatio,
                    prevName: prevBody.name,
                    prevHiraganaName: prevBody.hiraganaName
                };
            }

            return {
                ...body,
                x,
                y,
                radius,
                pixelDiameter,
                index,
                comparison
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
        const { x, y, radius, id, color } = body;
        const image = this.imageCache[id];

        // 影を追加
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // 画像がある場合は画像を使って描画、ない場合はグラデーション
        if (image && image.complete) {
            // 円形にクリップして画像を描画
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.clip();

            // 画像を円内に描画
            this.ctx.drawImage(
                image,
                x - radius,
                y - radius,
                radius * 2,
                radius * 2
            );

            this.ctx.restore();

            // 円の輪郭を描画（オプション）
            this.ctx.shadowColor = 'transparent';
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            // グラデーションで球体を描画（フォールバック）
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
        }

        // 影をリセット
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // ラベルを描画
        this.drawLabel(body);
    }

    drawLabel(body) {
        const { x, y, radius, name, hiraganaName, diameter, type, hiraganaType } = body;

        // ラベルの位置（天体の下）
        const labelY = y + radius + 30;

        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.strokeStyle = '#4a90e2';
        this.ctx.lineWidth = 2;

        const padding = 10;
        const fontSize = Math.min(16, Math.max(12, radius / 5));
        this.ctx.font = `bold ${fontSize}px sans-serif`;

        const nameText = this.isHiraganaMode ? hiraganaName : name;
        const diameterText = this.isHiraganaMode
            ? `ちょっけい: ${diameter.toLocaleString()} km`
            : `直径: ${diameter.toLocaleString()} km`;
        const typeText = this.isHiraganaMode ? hiraganaType : type;

        // テキスト幅を計算
        const nameWidth = this.ctx.measureText(nameText).width;
        const diameterWidth = this.ctx.measureText(diameterText).width;
        const typeWidth = this.ctx.measureText(typeText).width;

        this.ctx.font = `${fontSize - 2}px sans-serif`;

        const maxWidth = Math.max(nameWidth, diameterWidth, typeWidth);

        // ボックスのサイズを計算
        const boxWidth = maxWidth + padding * 2;
        const boxHeight = fontSize * 3.5 + padding * 2;

        this.ctx.fillRect(x - boxWidth / 2, labelY, boxWidth, boxHeight);
        this.ctx.strokeRect(x - boxWidth / 2, labelY, boxWidth, boxHeight);

        // テキスト
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        let currentY = labelY + padding;

        // 名前
        this.ctx.font = `bold ${fontSize}px sans-serif`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(nameText, x, currentY);
        currentY += fontSize * 1.2;

        // 直径
        this.ctx.font = `${fontSize - 2}px sans-serif`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText(diameterText, x, currentY);
        currentY += fontSize * 1.2;

        // 種別
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillText(typeText, x, currentY);
    }

    drawConnectionLine(body1, body2) {
        const x1 = body1.x + body1.radius;
        const x2 = body2.x - body2.radius;
        const y = body1.y;

        // 接続線を描画
        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y);
        this.ctx.lineTo(x2, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 比較情報を線の上に表示
        if (body2.comparison) {
            const centerX = (x1 + x2) / 2;
            const centerY = y - 40;  // 線の上に表示

            const comparison = body2.comparison;

            // テキストを作成（絵文字と掛け算記号で表現、5桁以上は指数表示）
            const diameterRatioStr = this.formatRatio(comparison.diameterRatio, 2);
            const volumeRatioStr = this.formatRatio(comparison.volumeRatio, 1);
            const diameterText = `📏 × ${diameterRatioStr}`;
            const volumeText = `🧊 × ${volumeRatioStr}`;

            // フォントサイズ
            const fontSize = 16;
            this.ctx.font = `bold ${fontSize}px sans-serif`;

            // テキスト幅を計算
            const diameterWidth = this.ctx.measureText(diameterText).width;
            const volumeWidth = this.ctx.measureText(volumeText).width;
            const maxWidth = Math.max(diameterWidth, volumeWidth);

            // 背景ボックスを描画
            const padding = 8;
            const boxWidth = maxWidth + padding * 2;
            const boxHeight = fontSize * 2.5 + padding * 2;

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);
            this.ctx.strokeRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);

            // テキストを描画
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // 直径倍率
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillText(diameterText, centerX, centerY - fontSize * 0.6);

            // 体積倍率
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText(volumeText, centerX, centerY + fontSize * 0.6);
        }
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

    // ユーティリティ関数：小数を分数に変換
    decimalToFraction(decimal) {
        // 最大分母を20に制限して、よく使われる分数を見つける
        const maxDenominator = 20;
        let bestNumerator = 1;
        let bestDenominator = 1;
        let minError = Math.abs(decimal - 1);

        for (let denominator = 1; denominator <= maxDenominator; denominator++) {
            const numerator = Math.round(decimal * denominator);
            const value = numerator / denominator;
            const error = Math.abs(decimal - value);

            if (error < minError) {
                minError = error;
                bestNumerator = numerator;
                bestDenominator = denominator;
            }
        }

        // 分子と分母を最大公約数で約分
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(bestNumerator, bestDenominator);
        bestNumerator /= divisor;
        bestDenominator /= divisor;

        return `${bestNumerator}/${bestDenominator}`;
    }

    // ユーティリティ関数：倍率を表示用にフォーマット
    formatRatio(ratio, decimals = 2) {
        if (ratio < 1) {
            // 1未満の場合は分数表示
            return this.decimalToFraction(ratio);
        } else if (ratio >= 10000) {
            // 5桁以上の場合は指数表示
            const exponent = Math.floor(Math.log10(ratio));
            const mantissa = ratio / Math.pow(10, exponent);
            // 上付き文字を使用
            const superscriptMap = {
                '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
                '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
            };
            const expStr = exponent.toString().split('').map(d => superscriptMap[d]).join('');
            return `${mantissa.toFixed(1)} × 10${expStr}`;
        } else {
            // 1以上10000未満の場合は通常表示
            return ratio.toFixed(decimals);
        }
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
