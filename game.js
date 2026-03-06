/*
    Pong Classic 1972 - Game Logic
    Fidelity to 1972 mechanics
*/

const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const overlay = document.getElementById('overlay');
const winnerText = document.getElementById('winner-text');

// Audio setup (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'square') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// Game Settings
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 10;
const WINNING_SCORE = 11;
const INITIAL_BALL_SPEED = 4;
const PADDLE_SPEED = 7;

// Game State
let p1Score = 0;
let p2Score = 0;
let gameRunning = true;

const player1 = {
    x: 20,
    y: (canvas.height / 2) - (PADDLE_HEIGHT / 2),
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const player2 = {
    x: canvas.width - 20 - PADDLE_WIDTH,
    y: (canvas.height / 2) - (PADDLE_HEIGHT / 2),
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
    speed: INITIAL_BALL_SPEED
};

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function handleInput() {
    // Player 1 (W/S)
    if (keys['w']) player1.dy = -PADDLE_SPEED;
    else if (keys['s']) player1.dy = PADDLE_SPEED;
    else player1.dy = 0;

    // Player 2 (Arrows)
    if (keys['arrowup']) player2.dy = -PADDLE_SPEED;
    else if (keys['arrowdown']) player2.dy = PADDLE_SPEED;
    else player2.dy = 0;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = INITIAL_BALL_SPEED;
    ball.dx = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
}

function update() {
    if (!gameRunning) return;

    handleInput();

    // Move paddles
    player1.y += player1.dy;
    player2.y += player2.dy;

    // Boundary constraints for paddles
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Y collision (Walls)
    if (ball.y <= 0 || ball.y + ball.size >= canvas.height) {
        ball.dy *= -1;
        playSound(220, 0.1, 'square'); // Low wall beep
    }

    // Paddle collision
    if (checkCollision(ball, player1)) {
        ball.dx = Math.abs(ball.speed); // Go right
        increaseSpeed();
        playSound(440, 0.1, 'square'); // High paddle beep
    }

    if (checkCollision(ball, player2)) {
        ball.dx = -Math.abs(ball.speed); // Go left
        increaseSpeed();
        playSound(440, 0.1, 'square'); // High paddle beep
    }

    // Scoring
    if (ball.x < 0) {
        p2Score++;
        p2ScoreEl.textContent = p2Score;
        playSound(110, 0.3, 'square'); // Low score boop
        checkWinner();
        resetBall();
    } else if (ball.x > canvas.width) {
        p1Score++;
        p1ScoreEl.textContent = p1Score;
        playSound(110, 0.3, 'square'); // Low score boop
        checkWinner();
        resetBall();
    }
}

function checkCollision(b, p) {
    return b.x < p.x + p.width &&
           b.x + b.size > p.x &&
           b.y < p.y + p.height &&
           b.y + b.size > p.y;
}

function increaseSpeed() {
    ball.speed *= 1.05; // 5% increase as per GDD
    // Maintain proportional dx/dy with new speed
    const angle = Math.atan2(ball.dy, ball.dx);
    ball.dx = Math.cos(angle) * ball.speed;
    ball.dy = Math.sin(angle) * ball.speed;
}

function checkWinner() {
    if (p1Score >= WINNING_SCORE) {
        showWinScreen('PLAYER 1 WINS');
    } else if (p2Score >= WINNING_SCORE) {
        showWinScreen('PLAYER 2 WINS');
    }
}

function showWinScreen(text) {
    gameRunning = false;
    winnerText.textContent = text;
    overlay.style.display = 'block';
}

function draw() {
    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Divider
    ctx.setLineDash([10, 15]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset for other drawings

    // Draw Paddles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    // Draw Ball
    ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start game
resetBall();
loop();
