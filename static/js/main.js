/**
 * 主页交互逻辑
 * 加载排行榜数据和个人状态
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 加载首页排行榜（前5名）
    loadHomeLeaderboard();
    // 加载个人状态
    loadMyStatus();
});

/**
 * 加载首页迷你排行榜
 */
async function loadHomeLeaderboard() {
    const container = document.getElementById('homeLeaderboard');
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🏆</div>
                    <p>还没有记录，快去玩一局吧！</p>
                </div>`;
            return;
        }

        // 只显示前5名
        const top5 = data.slice(0, 5);
        let html = '<table class="data-table"><thead><tr><th>排名</th><th>玩家</th><th>分数</th></tr></thead><tbody>';
        top5.forEach((item, idx) => {
            const rankClass = idx < 3 ? `rank-${idx + 1}` : 'rank-other';
            const medals = ['🥇', '🥈', '🥉'];
            const rankDisplay = idx < 3 ? medals[idx] : `<span class="rank-badge rank-other">${idx + 1}</span>`;
            html += `<tr>
                <td>${rankDisplay}</td>
                <td style="font-weight:700;">${escapeHtml(item.username)}</td>
                <td style="font-weight:800; color:var(--candy-green-dark);">${item.score}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p style="color:var(--text-light); text-align:center; padding:16px;">加载失败</p>';
    }
}

/**
 * 加载个人状态
 */
async function loadMyStatus() {
    const container = document.getElementById('myStatus');
    const challengeBar = document.getElementById('challengeBar');

    try {
        const res = await fetch('/api/me');
        const me = await res.json();

        if (!me.logged_in) {
            container.innerHTML = `<p style="color:var(--text-secondary); font-weight:600; font-size:0.9rem;">
                <a href="/login" style="color:var(--candy-green-dark); font-weight:700;">登录</a> 后查看你的状态
            </p>`;
            // 显示游客提示
            const guestHint = document.getElementById('guestHint');
            if (guestHint) guestHint.style.display = 'block';
            return;
        }

        // 获取个人记录
        const recordsRes = await fetch('/api/my-records');
        const records = await recordsRes.json();

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:600; color:var(--text-secondary); font-size:0.9rem;">最高分</span>
                    <span style="font-weight:900; color:var(--candy-green-dark); font-size:1.2rem;">${records.best_score}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:600; color:var(--text-secondary); font-size:0.9rem;">总场次</span>
                    <span style="font-weight:900; color:var(--candy-blue-dark); font-size:1.2rem;">${records.total_games}</span>
                </div>
            </div>
        `;

        // 更新挑战进度条（基于最高分/50）
        const progress = Math.min(100, (records.best_score / 50) * 100);
        setTimeout(() => {
            challengeBar.style.width = progress + '%';
        }, 500);

    } catch (e) {
        // 未登录或请求失败
        container.innerHTML = `<p style="color:var(--text-secondary); font-weight:600; font-size:0.9rem;">
            <a href="/login" style="color:var(--candy-green-dark); font-weight:700;">登录</a> 后查看你的状态
        </p>`;
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
