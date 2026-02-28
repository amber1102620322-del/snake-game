/**
 * 数据中心页面逻辑
 * 加载排行榜、个人记录和登录时间线
 */

document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    loadMyRecords();
});

/**
 * 加载排行榜
 */
async function loadLeaderboard() {
    const container = document.getElementById('leaderboardTable');
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🏆</div>
                    <p>还没有任何记录</p>
                </div>`;
            return;
        }

        let html = `<table class="data-table">
            <thead><tr>
                <th>排名</th>
                <th>玩家</th>
                <th>分数</th>
                <th>时间</th>
            </tr></thead><tbody>`;

        data.forEach((item, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            let rankDisplay;
            if (idx < 3) {
                rankDisplay = medals[idx];
            } else {
                rankDisplay = `<span class="rank-badge rank-other">${idx + 1}</span>`;
            }

            html += `<tr>
                <td>${rankDisplay}</td>
                <td style="font-weight:700;">${escapeHtml(item.username)}</td>
                <td style="font-weight:800; color:var(--candy-green-dark);">${item.score}</td>
                <td style="color:var(--text-secondary); font-size:0.85rem;">${formatTime(item.played_at)}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p style="color:var(--text-light); text-align:center; padding:24px;">加载失败</p>';
    }
}

/**
 * 加载个人记录
 */
async function loadMyRecords() {
    const scoresContainer = document.getElementById('myScores');
    const timelineContainer = document.getElementById('loginTimeline');
    const statBest = document.getElementById('statBest');
    const statGames = document.getElementById('statGames');
    const statLogins = document.getElementById('statLogins');

    try {
        const res = await fetch('/api/my-records');
        if (!res.ok) throw new Error('未登录');
        const data = await res.json();

        // 更新统计
        statBest.textContent = data.best_score;
        statGames.textContent = data.total_games;
        statLogins.textContent = data.logins.length;

        // 渲染得分记录
        if (data.scores.length === 0) {
            scoresContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🎮</div>
                    <p>还没有游戏记录，快去玩一局吧！</p>
                </div>`;
        } else {
            let html = `<table class="data-table">
                <thead><tr>
                    <th>#</th>
                    <th>分数</th>
                    <th>时间</th>
                </tr></thead><tbody>`;

            data.scores.forEach((item, idx) => {
                html += `<tr>
                    <td style="color:var(--text-light);">${idx + 1}</td>
                    <td style="font-weight:800; color:var(--candy-green-dark);">${item.score}</td>
                    <td style="color:var(--text-secondary); font-size:0.85rem;">${formatTime(item.played_at)}</td>
                </tr>`;
            });

            html += '</tbody></table>';
            scoresContainer.innerHTML = html;
        }

        // 渲染登录时间线
        if (data.logins.length === 0) {
            timelineContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🕐</div>
                    <p>暂无登录记录</p>
                </div>`;
        } else {
            let html = '<ul class="timeline">';
            data.logins.slice(0, 15).forEach(item => {
                html += `<li class="timeline-item">
                    <div class="timeline-time">${formatTime(item.login_time)}</div>
                </li>`;
            });
            html += '</ul>';
            timelineContainer.innerHTML = html;
        }

    } catch (e) {
        scoresContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔒</div>
                <p>请先登录查看记录</p>
            </div>`;
        timelineContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔒</div>
                <p>请先登录查看记录</p>
            </div>`;
    }
}

/**
 * 格式化时间
 */
function formatTime(timeStr) {
    if (!timeStr) return '-';
    try {
        const date = new Date(timeStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins} 分钟前`;
        if (diffHours < 24) return `${diffHours} 小时前`;
        if (diffDays < 7) return `${diffDays} 天前`;

        // 超过7天显示具体日期
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${month}-${day} ${hour}:${min}`;
    } catch (e) {
        return timeStr;
    }
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
