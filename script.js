const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

const difficulties = {
    easy: { speed: 200 },
    medium: { speed: 150 },
    hard: { speed: 100 }
};

let snake = [];
let food = { x: 0, y: 0 };
let bonusFood = null;
let speedFood = null;
let dx = 10;
let dy = 0;
let score = 0;
let level = 1;
let gameSpeed = 150;
let gameLoop = null;
let isGameRunning = false;
let isPaused = false;
let changingDirection = false;
let currentDifficulty = 'medium';

let highScores = [];
try {
    const saved = localStorage.getItem('snakeHighScores');
    highScores = saved ? JSON.parse(saved) : [];
} catch (e) {
    highScores = [];
}

function initGame() {
    snake = [
        { x: 200, y: 200 },
        { x: 190, y: 200 },
        { x: 180, y: 200 },
        { x: 170, y: 200 },
        { x: 160, y: 200 }
    ];
    dx = 10;
    dy = 0;
    score = 0;
    level = 1;
    gameSpeed = difficulties[currentDifficulty].speed;
    bonusFood = null;
    speedFood = null;
    changingDirection = false;
    updateStats();
    createFood();
}

function isOnSnake(x, y) {
    return snake.some(part => part.x === x && part.y === y);
}

function createFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount) * gridSize,
            y: Math.floor(Math.random() * tileCount) * gridSize
        };
    } while (isOnSnake(newFood.x, newFood.y));
    
    food = newFood;
    
    if (Math.random() < 0.1 && bonusFood === null) {
        createBonusFood();
    }
    
    if (Math.random() < 0.05 && speedFood === null) {
        createSpeedFood();
    }
}

function createBonusFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCount) * gridSize,
            y: Math.floor(Math.random() * tileCount) * gridSize
        };
    } while (isOnSnake(pos.x, pos.y));
    
    bonusFood = { x: pos.x, y: pos.y, timer: 100 };
}

function createSpeedFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * tileCount) * gridSize,
            y: Math.floor(Math.random() * tileCount) * gridSize
        };
    } while (isOnSnake(pos.x, pos.y));
    
    speedFood = { x: pos.x, y: pos.y, timer: 80 };
}

function draw() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    snake.forEach((part, index) => {
        const gradient = ctx.createLinearGradient(
            part.x, part.y,
            part.x + gridSize, part.y + gridSize
        );
        
        if (index === 0) {
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#45a049');
        } else {
            gradient.addColorStop(0, '#8BC34A');
            gradient.addColorStop(1, '#7CB342');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
        
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (dx !== 0) {
                ctx.fillRect(part.x + eyeOffset, part.y + 5, eyeSize, eyeSize);
                ctx.fillRect(part.x + eyeOffset, part.y + 12, eyeSize, eyeSize);
            } else {
                ctx.fillRect(part.x + 5, part.y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(part.x + 12, part.y + eyeOffset, eyeSize, eyeSize);
            }
        }
    });
    
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x + 2, food.y + 2, gridSize - 4, gridSize - 4);
    
    if (bonusFood !== null) {
        ctx.fillStyle = 'gold';
        ctx.fillRect(bonusFood.x + 2, bonusFood.y + 2, gridSize - 4, gridSize - 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(bonusFood.x + 5, bonusFood.y + 5, gridSize - 10, gridSize - 10);
    }
    
    if (speedFood !== null) {
        ctx.fillStyle = 'cyan';
        ctx.fillRect(speedFood.x + 2, speedFood.y + 2, gridSize - 4, gridSize - 4);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('⚡', speedFood.x + 5, speedFood.y + 15);
    }
    
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'start';
    }
}

function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    if (didEatFood) {
        score += 10;
        if (score % 100 === 0) {
            level++;
            gameSpeed = Math.max(50, gameSpeed - 10);
        }
        updateStats();
        createFood();
    } else {
        snake.pop();
    }
    
    if (bonusFood !== null && snake[0].x === bonusFood.x && snake[0].y === bonusFood.y) {
        score += 50;
        updateStats();
        bonusFood = null;
    }
    
    if (speedFood !== null && snake[0].x === speedFood.x && snake[0].y === speedFood.y) {
        gameSpeed = Math.max(50, gameSpeed - 30);
        speedFood = null;
    }
    
    if (bonusFood !== null) {
        bonusFood.timer--;
        if (bonusFood.timer <= 0) {
            bonusFood = null;
        }
    }
    
    if (speedFood !== null) {
        speedFood.timer--;
        if (speedFood.timer <= 0) {
            speedFood = null;
        }
    }
}

function didGameEnd() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= canvas.width;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= canvas.height;
    
    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

function changeDirection(event) {
    if (!isGameRunning || isPaused) return;
    if (changingDirection) return;
    
    const key = event.key;
    
    const goingUp = dy === -10;
    const goingDown = dy === 10;
    const goingRight = dx === 10;
    const goingLeft = dx === -10;
    
    if (key === 'ArrowLeft' && !goingRight) {
        dx = -10;
        dy = 0;
    } else if (key === 'ArrowUp' && !goingDown) {
        dx = 0;
        dy = -10;
    } else if (key === 'ArrowRight' && !goingLeft) {
        dx = 10;
        dy = 0;
    } else if (key === 'ArrowDown' && !goingUp) {
        dx = 0;
        dy = 10;
    } else {
        return;
    }
    
    changingDirection = true;
    event.preventDefault();
}

function main() {
    if (!isGameRunning || isPaused) return;
    
    if (didGameEnd()) {
        endGame();
        return;
    }
    
    advanceSnake();
    draw();
    
    changingDirection = false;
    
    gameLoop = setTimeout(main, gameSpeed);
}

function updateStats() {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const highScoreEl = document.getElementById('highScore');
    
    if (scoreEl) scoreEl.textContent = score;
    if (levelEl) levelEl.textContent = level;
    
    const currentHighScore = highScores.length > 0 ? highScores[0] : 0;
    if (highScoreEl) highScoreEl.textContent = currentHighScore;
}

function endGame() {
    isGameRunning = false;
    if (gameLoop !== null) {
        clearTimeout(gameLoop);
    }
    
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 10);
    
    try {
        localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    } catch (e) {
        console.warn('Не удалось сохранить рекорды');
    }
    
    const finalScoreEl = document.getElementById('finalScore');
    const finalLengthEl = document.getElementById('finalLength');
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalLengthEl) finalLengthEl.textContent = snake.length;
    
    const highScoresList = document.getElementById('highScoresList');
    if (highScoresList) {
        highScoresList.innerHTML = '';
        highScores.slice(0, 5).forEach((s) => {
            const li = document.createElement('li');
            li.textContent = `${s} очков`;
            highScoresList.appendChild(li);
        });
    }
    
    const overlay = document.getElementById('overlay');
    const gameOver = document.getElementById('gameOver');
    if (overlay) overlay.classList.add('show');
    if (gameOver) gameOver.classList.add('show');
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

function startGame() {
    if (isGameRunning) return;
    
    initGame();
    isGameRunning = true;
    isPaused = false;
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const overlay = document.getElementById('overlay');
    const gameOver = document.getElementById('gameOver');
    
    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) {
        pauseBtn.disabled = false;
        pauseBtn.textContent = 'Пауза';
    }
    if (overlay) overlay.classList.remove('show');
    if (gameOver) gameOver.classList.remove('show');
    
    main();
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = isPaused ? 'Продолжить' : 'Пауза';
    }
    
    if (!isPaused) {
        main();
    } else {
        draw();
    }
}

function resetGame() {
    isGameRunning = false;
    isPaused = false;
    if (gameLoop !== null) {
        clearTimeout(gameLoop);
    }
    
    initGame();
    draw();
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const overlay = document.getElementById('overlay');
    const gameOver = document.getElementById('gameOver');
    
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.textContent = 'Пауза';
    }
    if (overlay) overlay.classList.remove('show');
    if (gameOver) gameOver.classList.remove('show');
}

document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentDifficulty = this.dataset.difficulty;
        
        if (!isGameRunning) {
            gameSpeed = difficulties[currentDifficulty].speed;
        }
    });
});

function handleSwipe(direction) {
    const keyMap = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    };
    changeDirection({ key: keyMap[direction], preventDefault: () => {} });
}

const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

if (upBtn) upBtn.addEventListener('click', () => handleSwipe('up'));
if (downBtn) downBtn.addEventListener('click', () => handleSwipe('down'));
if (leftBtn) leftBtn.addEventListener('click', () => handleSwipe('left'));
if (rightBtn) rightBtn.addEventListener('click', () => handleSwipe('right'));

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        handleSwipe(diffX > 0 ? 'right' : 'left');
    } else {
        handleSwipe(diffY > 0 ? 'down' : 'up');
    }
});

const startBtnEl = document.getElementById('startBtn');
const pauseBtnEl = document.getElementById('pauseBtn');
const resetBtnEl = document.getElementById('resetBtn');
const playAgainBtnEl = document.getElementById('playAgainBtn');
const closeBtnEl = document.getElementById('closeBtn');

if (startBtnEl) startBtnEl.addEventListener('click', startGame);
if (pauseBtnEl) pauseBtnEl.addEventListener('click', togglePause);
if (resetBtnEl) resetBtnEl.addEventListener('click', resetGame);
if (playAgainBtnEl) playAgainBtnEl.addEventListener('click', () => {
    const overlay = document.getElementById('overlay');
    const gameOver = document.getElementById('gameOver');
    if (overlay) overlay.classList.remove('show');
    if (gameOver) gameOver.classList.remove('show');
    startGame();
});

if (closeBtnEl) {
    closeBtnEl.addEventListener('click', () => {
        const overlay = document.getElementById('overlay');
        const gameOver = document.getElementById('gameOver');
        if (overlay) overlay.classList.remove('show');
        if (gameOver) gameOver.classList.remove('show');
    });
}

document.addEventListener('keydown', changeDirection);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
    }
});

initGame();
draw();
updateStats();