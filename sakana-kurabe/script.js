const fishListEl = document.getElementById("fishList");
const mySlider = document.getElementById("myLengthSlider");
const myLabel = document.getElementById("myLengthLabel");
const commentMain = document.getElementById("commentMain");
const commentSub = document.getElementById("commentSub");
const quickButtons = document.querySelectorAll(".chip-btn[data-length]");
const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

// 参考魚たち（“データベース”）
const referenceFish = [
    { id: "tuna", name: "クロマグロ", emoji: "💙", length: 250 },
    { id: "sake", name: "サケ", emoji: "🧡", length: 80 },
    { id: "seabream", name: "マダイ", emoji: "🎀", length: 40 },
    { id: "mackerel", name: "サバ", emoji: "💚", length: 30 },
    { id: "aji", name: "アジ", emoji: "💛", length: 25 },
    { id: "sardine", name: "イワシ", emoji: "💧", length: 15 },
    { id: "fugu", name: "フグ", emoji: "🎈", length: 30 },
    { id: "hirame", name: "ヒラメ", emoji: "🤎", length: 60 }
];

// 最初に水槽にいる魚（id）
let activeReferenceIds = new Set(["tuna", "seabream", "sardine"]);

let myFish = {
    id: "mine",
    name: "キミの魚",
    emoji: "✨",
    length: parseFloat(mySlider.value)
};

function renderFish() {
    fishListEl.innerHTML = "";

    const activeRefs = referenceFish.filter(f => activeReferenceIds.has(f.id));
    const allFish = [...activeRefs, myFish];

    const maxLength = Math.max(...allFish.map(f => f.length));
    const minWidth = 60;
    const maxWidth = 260;

    // 表示順（上から）
    const order = ["tuna", "sake", "hirame", "seabream", "mackerel", "aji", "sardine", "fugu", "mine"];
    allFish.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

    allFish.forEach(fish => {
        const row = document.createElement("div");
        row.className = "fish-row";

        const tag = document.createElement("div");
        tag.className = "fish-tag";

        const tagName = document.createElement("div");
        tagName.className = "fish-tag-name";
        const emojiSpan = document.createElement("span");
        emojiSpan.textContent = fish.emoji;
        const nameSpan = document.createElement("span");
        nameSpan.textContent = fish.name;
        tagName.appendChild(emojiSpan);
        tagName.appendChild(nameSpan);

        const tagLength = document.createElement("div");
        tagLength.className = "fish-tag-length";
        tagLength.textContent = `${fish.length.toFixed(1)} cm`;

        tag.appendChild(tagName);
        tag.appendChild(tagLength);

        const lane = document.createElement("div");
        lane.className = "fish-lane";

        const shadowLine = document.createElement("div");
        shadowLine.className = "fish-shadow-line";

        const body = document.createElement("div");
        body.className = `fish-body fish-${fish.id}`;

        const ratio = fish.length / maxLength;
        const width = minWidth + (maxWidth - minWidth) * ratio;
        body.style.width = `${width.toFixed(0)}px`;

        const labelInside = document.createElement("div");
        labelInside.className = "fish-label-inside";

        const iconSpan = document.createElement("span");
        iconSpan.textContent = fish.emoji;

        const insideName = document.createElement("span");
        insideName.textContent = fish.id === "mine" ? "キミの魚" : fish.name;

        labelInside.appendChild(iconSpan);
        labelInside.appendChild(insideName);
        body.appendChild(labelInside);

        lane.appendChild(shadowLine);
        lane.appendChild(body);

        row.appendChild(tag);
        row.appendChild(lane);
        fishListEl.appendChild(row);
    });

    updateComment();
}

function updateMyFishLength(newLength) {
    myFish.length = parseFloat(newLength);
    myLabel.textContent = `${myFish.length.toFixed(0)} cm`;
    renderFish();
}

function updateComment() {
    const tuna = referenceFish.find(f => f.id === "tuna");
    const ratio = myFish.length / tuna.length;
    const percent = ratio * 100;

    let mainText = "";
    let subText = "";

    if (percent < 10) {
        mainText = `クロマグロの${percent.toFixed(1)}%くらい。小さめかわいいサイズ🐣`;
        subText = "イワシ・アジゾーンに近い感じ。小型水槽でも余裕そうなスケール感だね。";
    } else if (percent < 40) {
        mainText = `クロマグロの約${percent.toFixed(0)}%。中型で扱いやすいサイズ！`;
        subText = "マダイ・サバ・アジあたりと同じラインで、釣りでも現実的に狙えそうなクラス。";
    } else if (percent < 80) {
        mainText = `クロマグロにかなり近い…約${percent.toFixed(0)}%！`;
        subText = "サケやヒラメと並べると迫力ゴリゴリ。写真撮ったら絶対自慢したくなるサイズ感。";
    } else if (percent < 120) {
        mainText = `ほぼクロマグロ級！？約${percent.toFixed(0)}%🌊`;
        subText = "水槽の主役どころかボス。ほかの魚が完全にモブキャラ化してるのが分かると思う。";
    } else {
        mainText = `クロマグロ超えのモンスター…約${percent.toFixed(0)}%😱`;
        subText = "現実世界ではほぼ伝説級。画面いっぱいにシルエットが広がるのを楽しんで！";
    }

    commentMain.textContent = mainText;
    commentSub.textContent = subText;
}

mySlider.addEventListener("input", e => {
    updateMyFishLength(e.target.value);
});

quickButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const length = btn.getAttribute("data-length");
        mySlider.value = length;
        updateMyFishLength(length);
    });
});

// ───── Web Speech API まわり ─────

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (!SpeechRecognition) {
    // 非対応ブラウザ（Safari iOS とか）はボタンを無効化
    voiceBtn.disabled = true;
    voiceBtn.style.opacity = "0.6";
    voiceStatus.textContent = "このブラウザは音声入力に対応していないみたい…（Chrome 推奨）";
} else {
    recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener("click", () => {
        try {
            recognition.start();
            voiceBtn.classList.add("listening");
            voiceStatus.textContent = "🎧 聞き取り中…「マグロ」「サケ」「アジ」みたいに言ってみてね";
        } catch (err) {
            // start 多重呼び出し対策とか
            console.error(err);
        }
    });

    recognition.addEventListener("result", (event) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log("recognized:", transcript);
        handleRecognizedWord(transcript);
    });

    recognition.addEventListener("end", () => {
        voiceBtn.classList.remove("listening");
        if (!voiceStatus.textContent.startsWith("🎧")) {
            // 何か別のメッセージがすでにセットされているならそれを維持
        } else {
            voiceStatus.textContent = "もう一度試したいときは、もう一回ボタンを押してね。";
        }
    });

    recognition.addEventListener("error", (e) => {
        console.error("speech error:", e);
        voiceStatus.textContent = "音声認識でエラーが起きたみたい…環境音とかマイク設定をチェックしてみてね。";
    });
}

// 音声 → データベース照合
const voiceKeywordMap = {
    tuna: ["クロマグロ", "まぐろ", "マグロ", "本マグロ", "ほんまぐろ"],
    sake: ["サケ", "鮭", "しゃけ", "シャケ"],
    seabream: ["マダイ", "真鯛", "まだい", "鯛", "タイ"],
    mackerel: ["サバ", "鯖", "さば"],
    aji: ["アジ", "鰺", "あじ"],
    sardine: ["イワシ", "鰯", "いわし"],
    fugu: ["フグ", "河豚", "ふぐ"],
    hirame: ["ヒラメ", "平目", "ひらめ", "カレイ", "かれい"]
};

function findFishIdFromSpeech(text) {
    const normalized = text.replace(/\s+/g, "");
    for (const [id, keywords] of Object.entries(voiceKeywordMap)) {
        for (const kw of keywords) {
            if (normalized.includes(kw)) {
                return id;
            }
        }
    }
    return null;
}

function handleRecognizedWord(text) {
    const fishId = findFishIdFromSpeech(text);
    if (!fishId) {
        voiceStatus.textContent = `「${text}」は、まだ登録されてない魚みたい…（対応例：マグロ / サケ / アジ / フグ / ヒラメ）`;
        return;
    }

    const fishInfo = referenceFish.find(f => f.id === fishId);
    if (!fishInfo) {
        voiceStatus.textContent = "データベースにあるはずの魚が見つからない…コードを確認してね。";
        return;
    }

    if (activeReferenceIds.has(fishId)) {
        voiceStatus.textContent = `${fishInfo.name}は、もう水槽の中を泳いでるよ〜`;
    } else {
        activeReferenceIds.add(fishId);
        renderFish();
        voiceStatus.textContent = `✅ 「${fishInfo.name}」を水槽に追加したよ！`;
    }
}

// 初期描画
updateMyFishLength(mySlider.value);