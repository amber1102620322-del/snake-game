"""\n数据库模型模块\n使用 SQLite 管理用户、分数和登录记录\n"""

import sqlite3
import os
from datetime import datetime

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snake_game.db')


def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """初始化数据库，创建所有表"""
    conn = get_db()
    cursor = conn.cursor()

    # 用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 分数记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # 登录记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()


def create_user(username, password_hash):
    """创建新用户"""
    conn = get_db()
    try:
        conn.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, password_hash)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_user_by_username(username):
    """根据用户名查询用户"""
    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()
    return user


def get_user_by_id(user_id):
    """根据 ID 查询用户"""
    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE id = ?', (user_id,)
    ).fetchone()
    conn.close()
    return user


def log_login(user_id):
    """记录用户登录时间"""
    conn = get_db()
    conn.execute(
        'INSERT INTO login_logs (user_id) VALUES (?)',
        (user_id,)
    )
    conn.commit()
    conn.close()


def save_score(user_id, score):
    """保存游戏分数"""
    conn = get_db()
    conn.execute(
        'INSERT INTO scores (user_id, score) VALUES (?, ?)',
        (user_id, score)
    )
    conn.commit()
    conn.close()


def get_leaderboard(limit=20):
    """获取排行榜（最高分排序）"""
    conn = get_db()
    rows = conn.execute('''
        SELECT u.username, s.score, s.played_at
        FROM scores s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.score DESC
        LIMIT ?
    ''', (limit,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_user_records(user_id):
    """获取用户的所有游戏记录"""
    conn = get_db()
    scores = conn.execute('''
        SELECT score, played_at
        FROM scores
        WHERE user_id = ?
        ORDER BY played_at DESC
        LIMIT 50
    ''', (user_id,)).fetchall()

    logins = conn.execute('''
        SELECT login_time
        FROM login_logs
        WHERE user_id = ?
        ORDER BY login_time DESC
        LIMIT 50
    ''', (user_id,)).fetchall()

    # 获取最高分
    best = conn.execute('''
        SELECT MAX(score) as best_score, COUNT(*) as total_games
        FROM scores
        WHERE user_id = ?
    ''', (user_id,)).fetchone()

    conn.close()
    return {
        'scores': [dict(s) for s in scores],
        'logins': [dict(l) for l in logins],
        'best_score': best['best_score'] or 0,
        'total_games': best['total_games'] or 0
    }
