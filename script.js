const SYMBOLS = [
    { name: 'cherry', img: 'assets/images/cherry.png' },
    { name: 'lemon', img: 'assets/images/lemon.png' },
    { name: 'diamond', img: 'assets/images/diamond.png' },
    { name: 'star', img: 'assets/images/star.png' },
    { name: 'bell', img: 'assets/images/bell.png' },
    { name: 'seven', img: 'assets/images/seven.png' }
];

let balance = 1000;
let isSpinning = false;
let soundEnabled = true;

const spinSound = new Audio('assets/sounds/spin.mp3');
const winSound = new Audio('assets/sounds/win.mp3');
const jackpotSound = new Audio('assets/sounds/jackpot.mp3');
const backgroundSound = new Audio('assets/sounds/background.mp3');
backgroundSound.loop = true;
backgroundSound.volume = 0.3;

const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const balanceSpan = document.getElementById('balance');
const betSelect = document.getElementById('bet');
const spinButton = document.getElementById('spin');
const toggleSoundButton = document.getElementById('toggle-sound');
const resultDiv = document.getElementById('result');
const leaderboardSpins = document.getElementById('leaderboard-spins');
const leaderboardWinnings = document.getElementById('leaderboard-winnings');

const tg = window.Telegram.WebApp;
tg.ready();

balanceSpan.textContent = balance;
spinButton.addEventListener('click', spinReels);
toggleSoundButton.addEventListener('click', toggleSound);
if (soundEnabled) backgroundSound.play();

function spinReels() {
    if (isSpinning) return;

    const bet = parseInt(betSelect.value);
    if (bet > balance) {
        resultDiv.textContent = "Недостаточно фишек!";
        return;
    }

    isSpinning = true;
    spinButton.disabled = true;
    resultDiv.textContent = '';
    if (soundEnabled) spinSound.play();

    balance -= bet;
    balanceSpan.textContent = balance;

    reel1.classList.add('spinning');
    reel2.classList.add('spinning');
    reel3.classList.add('spinning');

    let spins = 0;
    const spinInterval = setInterval(() => {
        reel1.innerHTML = `<img src="${SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img}" alt="Symbol">`;
        reel2.innerHTML = `<img src="${SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img}" alt="Symbol">`;
        reel3.innerHTML = `<img src="${SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img}" alt="Symbol">`;
        spins++;
        if (spins > 30) {
            clearInterval(spinInterval);
            setTimeout(() => reel1.classList.remove('spinning'), 500);
            setTimeout(() => reel2.classList.remove('spinning'), 1000);
            setTimeout(() => {
                reel3.classList.remove('spinning');
                finishSpin(bet);
            }, 1500);
        }
    }, 50);
}

function finishSpin(bet) {
    const symbols = [
        SYMBOLS.find(s => reel1.querySelector('img').src.includes(s.img)),
        SYMBOLS.find(s => reel2.querySelector('img').src.includes(s.img)),
        SYMBOLS.find(s => reel3.querySelector('img').src.includes(s.img))
    ];

    tg.sendData(JSON.stringify({
        action: 'spin',
        bet: bet,
        symbols: symbols.map(s => s.name)
    }));

    let win = 0;
    if (symbols[0].name === symbols[1].name && symbols[1].name === symbols[2].name) {
        win = bet * 5;
        resultDiv.textContent = `🎉 Джекпот! Выигрыш: ${win} фишек!`;
        if (soundEnabled) jackpotSound.play();
        reel1.classList.add('winning');
        reel2.classList.add('winning');
        reel3.classList.add('winning');
    } else if (symbols[0].name === symbols[1].name || symbols[1].name === symbols[2].name || symbols[0].name === symbols[2].name) {
        win = bet * 2;
        resultDiv.textContent = `🥳 Неплохо! Выигрыш: ${win} фишек!`;
        if (soundEnabled) winSound.play();
        reel1.classList.add('winning');
        reel2.classList.add('winning');
        reel3.classList.add('winning');
    } else {
        resultDiv.textContent = "😢 Увы, проигрыш. Попробуй еще раз!";
    }

    balance += win;
    balanceSpan.textContent = balance;

    updateLeaderboard(1, win);
    isSpinning = false;
    spinButton.disabled = false;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    toggleSoundButton.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) {
        backgroundSound.play();
    } else {
        backgroundSound.pause();
        spinSound.pause();
        winSound.pause();
        jackpotSound.pause();
    }
}

let leaderboardData = {
    spins: [],
    winnings: []
};

function updateLeaderboard(spins, winnings) {
    const username = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username || 'Player' : 'Player';
    leaderboardData.spins.push({ username, value: spins });
    leaderboardData.winnings.push({ username, value: winnings });

    leaderboardData.spins.sort((a, b) => b.value - a.value);
    leaderboardData.winnings.sort((a, b) => b.value - a.value);

    leaderboardData.spins = leaderboardData.spins.slice(0, 10);
    leaderboardData.winnings = leaderboardData.winnings.slice(0, 10);

    displayLeaderboard();
}

function displayLeaderboard() {
    leaderboardSpins.innerHTML = leaderboardData.spins.map((entry, i) =>
        `<p>${i + 1}. ${entry.username}: ${entry.value} прокрутов</p>`
    ).join('');
    leaderboardWinnings.innerHTML = leaderboardData.winnings.map((entry, i) =>
        `<p>${i + 1}. ${entry.username}: ${entry.value} фишек</p>`
    ).join('');
}

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.leaderboard-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
    document.getElementById(`leaderboard-${tab}`).classList.add('active');
}

displayLeaderboard();