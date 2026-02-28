# 🐍 贪吃蛇大冒险

一款基于 **Flask + Canvas** 的清新可爱风格贪吃蛇网页游戏，支持用户注册登录、分数记录、排行榜、游客模式等功能。

---

## ✨ 功能特性

- 🎮 **经典贪吃蛇玩法** — Canvas 渲染，流畅的游戏体验
- 🧑‍💻 **用户系统** — 注册、登录、登出，密码安全哈希存储
- 🎭 **游客模式** — 无需登录即可体验游戏（分数不保存）
- 🏆 **排行榜** — 全服玩家最高分实时排名
- 📊 **个人数据中心** — 查看历史战绩、最高分、游戏次数
- 📱 **多端适配** — 同时支持键盘方向键和触屏滑动操作
- ⏸️ **暂停/继续** — 按空格键随时暂停游戏

---

## 🛠️ 技术栈

| 层级   | 技术                           |
| ------ | ------------------------------ |
| 后端   | Python 3.9 + Flask             |
| 数据库 | SQLite                         |
| 前端   | HTML5 Canvas + Vanilla JS + CSS |
| 模板   | Jinja2                         |
| 包管理 | uv                             |

---

## 📁 项目结构

```
snake-game/
├── app.py              # Flask 主应用（路由 & API）
├── models.py           # 数据库模型（用户、分数、登录记录）
├── main.py             # 入口脚本
├── pyproject.toml      # 项目配置 & 依赖
├── uv.lock             # 依赖锁文件
├── snake_game.db       # SQLite 数据库（运行后自动生成）
├── static/
│   ├── css/
│   │   └── style.css   # 全局样式
│   └── js/
│       ├── auth.js     # 登录/注册逻辑
│       ├── game.js     # 贪吃蛇游戏核心逻辑
│       ├── main.js     # 首页脚本
│       └── records.js  # 数据记录页脚本
└── templates/
    ├── base.html       # 基础模板（导航栏、通用脚本）
    ├── index.html      # 首页
    ├── login.html      # 登录页
    ├── register.html   # 注册页
    ├── game.html       # 游戏页
    └── records.html    # 数据记录页
```

---

## 🚀 快速开始

### 前置条件

- **Python** >= 3.9
- **uv**（Python 包管理工具）

> 如果尚未安装 uv，可参考 [uv 官方文档](https://docs.astral.sh/uv/getting-started/installation/) 进行安装。

### 安装与运行

```bash
# 1. 克隆项目
git clone <仓库地址>
cd snake-game

# 2. 安装依赖
uv sync

# 3. 启动开发服务器
uv run python app.py
```

启动后访问 **http://localhost:5000** 即可开始游戏 🎉

---

## 📡 API 接口

| 方法   | 路径               | 说明             | 认证   |
| ------ | ------------------ | ---------------- | ------ |
| POST   | `/api/register`    | 用户注册         | ❌     |
| POST   | `/api/login`       | 用户登录         | ❌     |
| POST   | `/api/logout`      | 用户登出         | ❌     |
| GET    | `/api/me`          | 获取当前用户信息 | ❌     |
| POST   | `/api/score`       | 保存游戏分数     | 可选   |
| GET    | `/api/leaderboard` | 获取排行榜       | ❌     |
| GET    | `/api/my-records`  | 获取个人游戏记录 | ✅     |

---

## 🎮 游戏操作

| 操作       | 键位 / 手势              |
| ---------- | ------------------------ |
| 移动方向   | `↑` `↓` `←` `→` 方向键  |
| 暂停/继续  | `Space` 空格键           |
| 触屏控制   | 在屏幕上滑动对应方向     |

---

## 📝 开发说明

### 数据库

项目使用 SQLite，数据库文件 `snake_game.db` 在首次运行时自动创建，包含以下数据表：

- **users** — 用户信息（用户名、密码哈希、注册时间）
- **scores** — 游戏分数记录（关联用户、分数、游玩时间）
- **login_logs** — 登录日志（关联用户、登录时间）

### 添加依赖

```bash
uv add <包名>
```

---

## 📄 许可证

本项目仅供学习交流使用。
