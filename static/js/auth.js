/**
 * 登录/注册页面交互逻辑
 * 处理表单提交和错误显示
 */

/**
 * 处理登录表单提交
 */
async function handleLogin(event) {
    event.preventDefault();
    clearErrors();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // 客户端验证
    if (!username) {
        showFieldError('usernameError', '请输入用户名');
        return false;
    }
    if (!password) {
        showFieldError('passwordError', '请输入密码');
        return false;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner"></div> 登录中...';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            showToast('登录成功！欢迎回来 ' + data.username, 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 800);
        } else {
            showFieldError('globalError', data.error || '登录失败');
            btn.disabled = false;
            btn.innerHTML = '🎮 登录';
        }
    } catch (e) {
        showFieldError('globalError', '网络错误，请稍后重试');
        btn.disabled = false;
        btn.innerHTML = '🎮 登录';
    }

    return false;
}

/**
 * 处理注册表单提交
 */
async function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // 客户端验证
    if (!username) {
        showFieldError('usernameError', '请输入用户名');
        return false;
    }
    if (username.length < 2 || username.length > 20) {
        showFieldError('usernameError', '用户名长度应在 2-20 个字符之间');
        return false;
    }
    if (!password) {
        showFieldError('passwordError', '请输入密码');
        return false;
    }
    if (password.length < 4) {
        showFieldError('passwordError', '密码长度不能少于 4 个字符');
        return false;
    }
    if (password !== confirmPassword) {
        showFieldError('confirmError', '两次密码输入不一致');
        return false;
    }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner"></div> 注册中...';

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            showToast('注册成功！请登录', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            showFieldError('globalError', data.error || '注册失败');
            btn.disabled = false;
            btn.innerHTML = '🚀 注册';
        }
    } catch (e) {
        showFieldError('globalError', '网络错误，请稍后重试');
        btn.disabled = false;
        btn.innerHTML = '🚀 注册';
    }

    return false;
}

/**
 * 显示字段错误
 */
function showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('visible');
    }
}

/**
 * 清除所有错误
 */
function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
}
