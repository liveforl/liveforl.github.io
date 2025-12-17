// ==================== 核心UI框架与弹窗系统 ====================

// ==================== 主界面更新 ====================
function updateDisplay() {
    document.getElementById('usernameDisplay').textContent = gameState.username;
    
    // 头像显示逻辑（支持图片和文字）
    const avatarEl = document.getElementById('userAvatar');
    if (gameState.avatarImage) {
        // 显示图片头像
        avatarEl.innerHTML = `<img src="${gameState.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        // 显示文字头像
        avatarEl.textContent = gameState.avatar;
    }
    
    const dateDisplay = document.getElementById('virtualDateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = formatVirtualDate(true);
        dateDisplay.classList.add('updating');
        setTimeout(() => dateDisplay.classList.remove('updating'), 300);
    }
    
    document.getElementById('fansCount').textContent = formatNumber(gameState.fans);
    document.getElementById('likesCount').textContent = formatNumber(gameState.likes);
    document.getElementById('viewsCount').textContent = formatNumber(gameState.views);
    document.getElementById('worksCount').textContent = formatNumber(gameState.works);
    document.getElementById('moneyCount').textContent = formatNumber(Math.floor(gameState.money));
    document.getElementById('warningCount').textContent = `${gameState.warnings}/20`;
    
    // ✅ 新增功能：更新关注数显示
    document.getElementById('followingCount').textContent = formatNumber(gameState.following ? gameState.following.length : 0);
    
    const virtualDate = getVirtualDate();
    const timeStat = document.getElementById('virtualTimeStat');
    if (timeStat) {
        timeStat.textContent = `${virtualDate.totalDays}天`;
        timeStat.parentElement.title = `${virtualDate.year}年${virtualDate.month}月${virtualDate.day}日 ${virtualDate.formattedTime}`;
    }
    
    const liveBtn = document.getElementById('liveControlBtn');
    if (liveBtn) {
        liveBtn.style.display = 'block';
        liveBtn.classList.toggle('active', gameState.liveStatus);
    }
    
    const hotSearchNotice = document.getElementById('hotSearchNotice');
    const banNotice = document.getElementById('banNotice');
    const publicOpinionNotice = document.getElementById('publicOpinionNotice');
    
    // ✅ 修复：使用明确的add/remove替代toggle(undefined)防止反复切换
    if (hotSearchNotice) {
        if (gameState.isHotSearch) {
            hotSearchNotice.classList.add('show');
        } else {
            hotSearchNotice.classList.remove('show');
        }
    }
    if (banNotice) {
        if (gameState.isBanned) {
            banNotice.classList.add('show');
        } else {
            banNotice.classList.remove('show');
        }
    }
    if (publicOpinionNotice) {
        if (gameState.isPublicOpinionCrisis) {
            publicOpinionNotice.classList.add('show');
        } else {
            publicOpinionNotice.classList.remove('show');
        }
    }
    
    if (typeof showHotSearchNotice === 'function') showHotSearchNotice();
    if (typeof showBanNotice === 'function') showBanNotice();
    if (typeof showPublicOpinionNotice === 'function') showPublicOpinionNotice();
    
    updateWorksList();
    if (typeof checkAchievements === 'function') checkAchievements();
    saveGame();
    
    if (gameState.devMode) {
        document.getElementById('devFloatButton').style.display = 'block';
        if (typeof devUpdateCountdowns === 'function') devUpdateCountdowns();
    } else {
        document.getElementById('devFloatButton').style.display = 'none';
    }
    
    const activeTab = document.querySelector('.nav-item.active');
    if (activeTab && activeTab.textContent.includes('作品')) {
        const worksContent = document.getElementById('worksContent');
        if (worksContent && worksContent.style.display !== 'none') {
            if (typeof renderWorksPage === 'function') {
                renderWorksPage();
            }
        }
    }
    
    // ✅ 新增：更新导航栏消息小红点
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
}

// ==================== 数字动画 ====================
function animateNumberUpdate(element) { 
    element.classList.add('updating'); 
    setTimeout(() => element.classList.remove('updating'), 300); 
}

// ==================== 标签页切换 ====================
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('.nav-item').classList.add('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    switch (tab) {
        case 'home':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
            break;
        case 'works':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
            document.getElementById('worksContent').style.display = 'block';
            if (typeof showWorksFullscreen === 'function') showWorksFullscreen();
            break;
        case 'messages':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
            document.getElementById('messagesContent').style.display = 'block';
            if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
            break;
        case 'achievements':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
            document.getElementById('achievementsContent').style.display = 'block';
            if (typeof showAchievementsFullscreen === 'function') showAchievementsFullscreen();
            break;
    }
}

// ==================== 全屏页面关闭（修复版 - 只在关闭作品页时清除缓存） ====================
function closeFullscreenPage(pageName) {
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    // 只在关闭作品页时清除用户数据缓存
    if (pageName === 'workDetail') {
        currentDetailWork = null;
        window.cachedUserProfile = null; // 清除用户主页缓存
    } else if (pageName === 'userProfile') {
        // 关闭用户主页时不清除缓存，保留数据
        // 注释掉清除缓存的代码
        // window.cachedUserProfile = null;
    }
    
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
}

// ==================== 模态框基础 ====================
function showModal(content) { 
    document.getElementById('modalContent').innerHTML = content; 
    document.getElementById('modal').style.display = 'block'; 
}

function closeModal() { 
    document.getElementById('modal').style.display = 'none'; 
}

// ==================== 通知系统 ====================
function showNotification(title, content) {
    const notification = { id: Date.now(), title: title, content: content, time: gameTimer, read: false }; 
    gameState.notifications.push(notification);
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const unreadCount = gameState.notifications.filter(n => !n.read).length, badge = document.getElementById('notificationBadge');
    if (!badge) return;
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
    } else badge.style.display = 'none';
}

function showNotifications() {
    gameState.notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    const notificationHtml = gameState.notifications.slice(-20).reverse().map(notification => `<div class="comment-item"><div class="comment-header"><span class="comment-user">${notification.title}</span><span class="comment-time">${formatTime(notification.time)}</span></div><div class="comment-content">${notification.content}</div></div>`).join('');
    showModal(`<div class="modal-header"><div class="modal-title">通知中心</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="max-height:60vh;overflow-y:auto">${gameState.notifications.length === 0 ? '<div style="text-align:center;color:#999;padding:20px;">暂无通知</div>' : notificationHtml}</div>`);
}

// ==================== 游戏内弹窗系统 ====================
function showAlert(message, title = '提示') {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.5;">${message}</div>
            <button class="btn" onclick="closeModal()">确定</button>
        </div>
    `;
    showModal(modalContent);
}

function showConfirm(message, onConfirm, title = '请确认') {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.5;">${message}</div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button class="btn" onclick="handleConfirmCallback()">确定</button>
            </div>
        </div>
    `;
    showModal(modalContent);
    window._confirmCallback = onConfirm;
}

function handleConfirmCallback() {
    closeModal();
    if (window._confirmCallback) {
        window._confirmCallback(true);
        window._confirmCallback = null;
    }
}

function showPrompt(message, defaultValue, onSubmit, title = '请输入') {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
            <div class="close-btn" onclick="closeModal(); window._promptCallback = null;">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px; font-size: 14px;">${message}</div>
            <input type="text" class="text-input" id="promptInput" placeholder="" value="${defaultValue}" maxlength="50">
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-secondary" onclick="closeModal(); window._promptCallback = null;">取消</button>
                <button class="btn" onclick="handlePromptCallback()">确定</button>
            </div>
        </div>
    `;
    showModal(modalContent);
    window._promptCallback = onSubmit;
    
    setTimeout(() => {
        const input = document.getElementById('promptInput');
        if (input) input.focus();
    }, 100);
}

function handlePromptCallback() {
    const input = document.getElementById('promptInput');
    const value = input ? input.value : null;
    closeModal();
    if (window._promptCallback) {
        window._promptCallback(value);
        window._promptCallback = null;
    }
}

// ==================== 成就弹窗控制 ====================
let achievementPopupTimeout = null;

function showAchievementPopup(achievement) {
    const popup = document.getElementById('achievementPopup');
    const icon = document.getElementById('achievementPopupIcon');
    const name = document.getElementById('achievementPopupName');
    
    if (!popup || !icon || !name) {
        console.error('成就弹窗元素未找到');
        return;
    }
    
    if (achievementPopupTimeout) {
        clearTimeout(achievementPopupTimeout);
    }
    
    icon.textContent = achievement.icon || '🏆';
    name.textContent = achievement.name || '未知成就';
    
    popup.classList.add('show');
    
    achievementPopupTimeout = setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// ==================== 警告显示 ====================
function showWarning(message) {
    const toast = document.getElementById('warningToast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ==================== 随机事件弹窗通知 ====================
function showEventPopup(title, content) {
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.className = 'event-popup';
    popup.innerHTML = `
        <div class="event-popup-header">${title}</div>
        <div class="event-popup-content">${content}</div>
    `;
    document.body.appendChild(popup);
    
    // 触发动画（滑入）
    setTimeout(() => {
        popup.classList.add('show');
    }, 100);
    
    // 3.5秒后自动消失
    setTimeout(() => {
        popup.classList.remove('show');
        // 动画结束后移除元素
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 400);
    }, 3500);
}

// ==================== 全局函数绑定 ====================
window.updateDisplay = updateDisplay;
window.showModal = showModal;
window.closeModal = closeModal;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.handleConfirmCallback = handleConfirmCallback;
window.showPrompt = showPrompt;
window.handlePromptCallback = handlePromptCallback;
window.showNotification = showNotification;
window.updateNotificationBadge = updateNotificationBadge;
window.showNotifications = showNotifications;
window.showAchievementPopup = showAchievementPopup;
window.showWarning = showWarning;
window.showEventPopup = showEventPopup;
window.switchTab = switchTab;
window.closeFullscreenPage = closeFullscreenPage;
window.animateNumberUpdate = animateNumberUpdate;
window.updateNavMessageBadge = updateNavMessageBadge;
