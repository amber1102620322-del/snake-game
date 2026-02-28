"""\n贪吃蛇网页游戏 - Flask 主应用\n提供用户认证、游戏分数记录和排行榜等 API\n"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import models

app = Flask(__name__)
app.secret_key = 'snake-game-secret-key-2026'

# 初始化数据库
models.init_db()


# ==================== 辅助函数 ====================

def login_required(f):
    """登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': '请先登录'}), 401
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function


# ==================== 页面路由 ====================

@app.route('/')
def index_page():
    """主页"""
    return render_template('index.html')


@app.route('/login')
def login_page():
    """登录页"""
    return render_template('login.html')


@app.route('/register')
def register_page():
    """注册页"""
    return render_template('register.html')


@app.route('/game')
def game_page():
    """游戏页面（支持游客模式）"""
    return render_template('game.html')


@app.route('/records')
@login_required
def records_page():
    """数据记录页面"""
    return render_template('records.html')


# ==================== API 路由 ====================

@app.route('/api/register', methods=['POST'])
def api_register():
    """用户注册"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    # 验证
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    if len(username) < 2 or len(username) > 20:
        return jsonify({'error': '用户名长度应在 2-20 个字符之间'}), 400
    if len(password) < 4:
        return jsonify({'error': '密码长度不能少于 4 个字符'}), 400

    # 创建用户
    password_hash = generate_password_hash(password)
    success = models.create_user(username, password_hash)

    if success:
        return jsonify({'message': '注册成功！请登录'}), 201
    else:
        return jsonify({'error': '用户名已存在'}), 409


@app.route('/api/login', methods=['POST'])
def api_login():
    """用户登录"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    user = models.get_user_by_username(username)
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        # 记录登录时间
        models.log_login(user['id'])
        return jsonify({
            'message': '登录成功',
            'username': user['username']
        })
    else:
        return jsonify({'error': '用户名或密码错误'}), 401


@app.route('/api/logout', methods=['POST'])
def api_logout():
    """用户登出"""
    session.clear()
    return jsonify({'message': '已登出'})


@app.route('/api/me')
def api_me():
    """获取当前用户信息"""
    if 'user_id' in session:
        user = models.get_user_by_id(session['user_id'])
        if user:
            return jsonify({
                'logged_in': True,
                'username': user['username'],
                'created_at': user['created_at']
            })
    return jsonify({'logged_in': False})


@app.route('/api/score', methods=['POST'])
def api_save_score():
    """保存游戏分数（游客模式不保存）"""
    data = request.get_json()
    score = data.get('score', 0)

    if not isinstance(score, int) or score < 0:
        return jsonify({'error': '无效的分数'}), 400

    if 'user_id' in session:
        models.save_score(session['user_id'], score)
        return jsonify({'message': '分数已保存', 'score': score, 'saved': True})
    else:
        return jsonify({'message': '游客模式，分数未保存', 'score': score, 'saved': False})


@app.route('/api/leaderboard')
def api_leaderboard():
    """获取排行榜"""
    leaderboard = models.get_leaderboard(20)
    return jsonify(leaderboard)


@app.route('/api/my-records')
@login_required
def api_my_records():
    """获取个人游戏记录"""
    records = models.get_user_records(session['user_id'])
    return jsonify(records)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
