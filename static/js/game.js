/**
 * 贪吃蛇游戏核心逻辑
 * 使用 Canvas 渲染，支持键盘和触屏操作
 */

// ==================== 游戏常量 ====================
const CANVAS_SIZE = 500;        // 画布尺寸
const GRID_COUNT = 20;          // 网格数量
const CELL_SIZE = CANVAS_SIZE / GRID_COUNT;  // 每格尺寸
const INITIAL_SPEED = 150;      // 初始速度（毫秒/帧）
const SPEED_INCREMENT = 2;      // 每吃一个食物加速（毫秒）
const MIN_SPEED = 60;           // 最大速度限制

// ==================== 颜色常量 ====================
const COLORS = {
    // 背景
    bgDark: '#0f172a',
    bgGrid: '#1e293b',
    gridLine: 'rgba(148, 163, 184, 0.08)',

    // 蛇身
    snakeHead: '#4ade80',
    snakeHeadGlow: 'rgba(74, 222, 128, 0.4)',
    snakeBody: '#22c55e',
    snakeBodyAlt: '#16a34a',
    snakeTail: '#15803d',

    // 食物
    food: '#f43f5e',
    foodGlow: 'rgba(244, 63, 94, 0.5)',
    foodHighlight: '#fda4af',

    // 文字
    textWhite: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.5)',
};

// ==================== 游戏状态 ====================
let canvas, ctx;
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };    // 初始方向：向右
let nextDirection = { x: 1, y: 0 };
let score = 0;
let bestScore = 0;
let gameLoop = null;
let gameState = 'idle';  // idle / playing / paused / gameover
let speed = INITIAL_SPEED;
let animFrame = 0;
let foodPulse = 0;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 加载最高分
    loadBestScore();

    // 绘制初始画面
    drawBackground();
    drawIdleScreen();

    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyDown);

    // 绑定触屏事件
    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 20) return; // 最小滑动距离

        if (absDx > absDy) {
            // 水平滑动
            if (dx > 0 && direction.x !== -1) nextDirection = { x: 1, y: 0 };
            else if (dx < 0 && direction.x !== 1) nextDirection = { x: -1, y: 0 };
        } else {
            // 垂直滑动
            if (dy > 0 && direction.y !== -1) nextDirection = { x: 0, y: 1 };
            else if (dy < 0 && direction.y !== 1) nextDirection = { x: 0, y: -1 };
        }
    }, { passive: false });
});

/**
 * 加载最高分
 */
async function loadBestScore() {
    try {
        const res = await fetch('/api/my-records');
        if (res.ok) {
            const data = await res.json();
            bestScore = data.best_score || 0;
            document.getElementById('bestScore').textContent = bestScore;
        }
    } catch (e) {
        // 忽略错误
    }
}

// ==================== 游戏控制 ====================

/**
 * 开始游戏
 */
function startGame() {
    // 初始化蛇
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    animFrame = 0;

    // 更新 UI
    updateScoreDisplay();
    document.getElementById('gameLength').textContent = snake.length;

    // 隐藏遮罩
    const overlay = document.getElementById('gameOverlay');
    overlay.classList.add('hidden');

    // 生成食物
    spawnFood();

    // 设置游戏状态
    gameState = 'playing';

    // 启动游戏循环
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, speed);
}

/**
 * 暂停/继续游戏
 */
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        clearInterval(gameLoop);
        drawPauseScreen();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        gameLoop = setInterval(gameTick, speed);
    }
}

/**
 * 游戏结束
 */
async function gameOver() {
    gameState = 'gameover';
    clearInterval(gameLoop);

    // 更新最高分
    if (score > bestScore) {
        bestScore = score;
        document.getElementById('bestScore').textContent = bestScore;
    }

    // 保存分数到服务器
    try {
        const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        const data = await res.json();
        if (data.saved === false) {
            showToast('游客模式，分数未保存。登录后可记录成绩！', 'error');
        }
    } catch (e) {
        console.error('保存分数失败', e);
    }

    // 显示结束遮罩
    const overlay = document.getElementById('gameOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlaySubtitle = document.getElementById('overlaySubtitle');
    const finalScore = document.getElementById('finalScore');
    const startBtn = document.getElementById('startBtn');

    overlayTitle.textContent = '游戏结束';
    overlaySubtitle.textContent = `你获得了`;
    finalScore.style.display = 'block';
    finalScore.textContent = score + ' 分';
    startBtn.textContent = '🔄 再玩一局';
    overlay.classList.remove('hidden');
}

// ==================== 键盘处理 ====================

function handleKeyDown(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
        case ' ':
            e.preventDefault();
            if (gameState === 'idle' || gameState === 'gameover') {
                startGame();
            } else {
                togglePause();
            }
            break;
    }
}

// ==================== 游戏逻辑 ====================

/**
 * 游戏主循环
 */
function gameTick() {
    animFrame++;
    foodPulse += 0.15;

    // 更新方向
    direction = { ...nextDirection };

    // 计算新头部位置
    const head = snake[0];
    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    };

    // 碰撞检测：墙壁
    if (newHead.x < 0 || newHead.x >= GRID_COUNT || newHead.y < 0 || newHead.y >= GRID_COUNT) {
        gameOver();
        return;
    }

    // 碰撞检测：自身
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
            gameOver();
            return;
        }
    }

    // 移动蛇
    snake.unshift(newHead);

    // 吃食物判定
    if (newHead.x === food.x && newHead.y === food.y) {
        score += 1;
        updateScoreDisplay();
        document.getElementById('gameLength').textContent = snake.length;
        spawnFood();

        // 加速
        if (speed > MIN_SPEED) {
            speed -= SPEED_INCREMENT;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameTick, speed);
        }
    } else {
        // 没吃到食物，删除尾巴
        snake.pop();
    }

    // 绘制画面
    draw();
}

/**
 * 生成食物
 */
function spawnFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
}

/**
 * 更新分数显示
 */
function updateScoreDisplay() {
    document.getElementById('currentScore').textContent = score;
}

// ==================== 绘制函数 ====================

/**
 * 主绘制函数
 */
function draw() {
    drawBackground();
    drawFood();
    drawSnake();
}

/**
 * 绘制背景和网格
 */
function drawBackground() {
    // 填充背景
    ctx.fillStyle = COLORS.bgDark;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 绘制网格线
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_COUNT; i++) {
        const pos = i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
    }
}

/**
 * 绘制蛇身
 */
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const padding = 2;

        if (index === 0) {
            // 蛇头：带发光效果
            ctx.shadowColor = COLORS.snakeHeadGlow;
            ctx.shadowBlur = 12;

            // 渐变填充
            const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
            gradient.addColorStop(0, COLORS.snakeHead);
            gradient.addColorStop(1, COLORS.snakeBody);
            ctx.fillStyle = gradient;

            roundRect(ctx, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 6);
            ctx.fill();

            // 添加眼睛
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            const eyeSize = 3;
            let eye1X, eye1Y, eye2X, eye2Y;

            if (direction.x === 1) { // 向右
                eye1X = x + CELL_SIZE - 8; eye1Y = y + 7;
                eye2X = x + CELL_SIZE - 8; eye2Y = y + CELL_SIZE - 7;
            } else if (direction.x === -1) { // 向左
                eye1X = x + 8; eye1Y = y + 7;
                eye2X = x + 8; eye2Y = y + CELL_SIZE - 7;
            } else if (direction.y === -1) { // 向上
                eye1X = x + 7; eye1Y = y + 8;
                eye2X = x + CELL_SIZE - 7; eye2Y = y + 8;
            } else { // 向下
                eye1X = x + 7; eye1Y = y + CELL_SIZE - 8;
                eye2X = x + CELL_SIZE - 7; eye2Y = y + CELL_SIZE - 8;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // 瞳孔
            ctx.fillStyle = COLORS.bgDark;
            ctx.beginPath();
            ctx.arc(eye1X + direction.x, eye1Y + direction.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X + direction.x, eye2Y + direction.y, 1.5, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // 蛇身：交替颜色
            ctx.shadowBlur = 0;
            const progress = index / snake.length;
            const bodyColor = index % 2 === 0 ? COLORS.snakeBody : COLORS.snakeBodyAlt;

            // 尾部渐变效果
            const alpha = 1 - progress * 0.4;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = bodyColor;

            const bodyPadding = padding + progress * 2;
            roundRect(ctx, x + bodyPadding, y + bodyPadding,
                CELL_SIZE - bodyPadding * 2, CELL_SIZE - bodyPadding * 2, 5);
            ctx.fill();

            // 身体高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            roundRect(ctx, x + bodyPadding, y + bodyPadding,
                CELL_SIZE - bodyPadding * 2, (CELL_SIZE - bodyPadding * 2) * 0.4, 5);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    });
}

/**
 * 绘制食物
 */
function drawFood() {
    const x = food.x * CELL_SIZE + CELL_SIZE / 2;
    const y = food.y * CELL_SIZE + CELL_SIZE / 2;
    const baseRadius = CELL_SIZE / 2 - 4;
    const pulse = Math.sin(foodPulse) * 2;

    // 外发光
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 16 + pulse * 2;

    // 主体
    const gradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, baseRadius + pulse);
    gradient.addColorStop(0, COLORS.foodHighlight);
    gradient.addColorStop(0.5, COLORS.food);
    gradient.addColorStop(1, '#e11d48');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius + pulse, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, baseRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * 绘制暂停画面
 */
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 28px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ 游戏暂停', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '16px Nunito, sans-serif';
    ctx.fillText('按空格键继续', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
}

/**
 * 绘制空闲画面
 */
function drawIdleScreen() {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '16px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('点击"开始游戏"按钮或按空格键', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

// ==================== 工具函数 ====================

/**
 * 绘制圆角矩形
 */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
