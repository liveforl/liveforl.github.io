// ==================== 设置、个人主页与账号管理 ====================

// ==================== 账号设置 ====================
function showSettings() {
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    const content = document.getElementById('settingsPageContent');
    content.innerHTML = `
        <div class="settings-item" onclick="changeUsername()">
            <div><div class="settings-label">修改昵称</div><div class="settings-value">${gameState.username}</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="changeUserId()">
            <div><div class="settings-label">用户ID</div><div class="settings-value">${gameState.userId}</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="changeAvatar()">
            <div><div class="settings-label">修改头像</div><div class="settings-value">点击修改</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="clearData()" style="background:#ff0050">
            <div><div class="settings-label">清除数据</div><div class="settings-value">谨慎操作</div></div>
        </div>
    `;
    
    const headerTitle = document.getElementById('settingsHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = '账号设置';
        headerTitle.onclick = handleDevSettingsClick;
    }
    
    document.getElementById('settingsPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 游戏设置 ====================
function showGameSettings() {
    const headerTitle = document.getElementById('settingsHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = '游戏设置';
        headerTitle.onclick = null;
    }
    
    const content = document.getElementById('settingsPageContent');
    content.innerHTML = `
        <div class="settings-item" onclick="showPlayTime()">
            <div><div class="settings-label">游玩时间</div><div class="settings-value">查看统计</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="showQQGroup()">
            <div><div class="settings-label">加入QQ交流群</div><div class="settings-value">交流讨论</div></div>
            <div>></div>
        </div>
    `;
    
    document.getElementById('settingsPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 显示游玩时间 ====================
function showPlayTime() {
    const totalMinutes = Math.floor(gameTimer / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(getVirtualDaysPassed());
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">游玩时间统计</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="font-size: 24px; color: #667eea; margin-bottom: 10px;">${hours}小时 ${minutes}分钟</div>
                <div style="font-size: 14px; color: #999;">实际游玩时间</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 24px; color: #00f2ea; margin-bottom: 10px;">${days}天</div>
                <div style="font-size: 14px; color: #999;">虚拟时间流逝</div>
            </div>
            <div style="background: #161823; padding: 15px; border-radius: 10px; font-size: 12px; color: #999; line-height: 1.5;">
                <p>• 虚拟时间：1分钟 = 1虚拟天</p>
                <p>• 游戏从2025年1月1日开始</p>
                <p>• 当前时间：${formatVirtualDate(true)}</p>
            </div>
            <button class="btn" onclick="closeModal()" style="margin-top: 20px;">确定</button>
        </div>
    `;
    showModal(modalContent);
}

// ==================== 显示QQ群号 ====================
function showQQGroup() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">加入QQ交流群</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">主播模拟器交流群</div>
                <div style="font-size: 14px; color: #999; margin-bottom: 20px;">欢迎加入QQ群与其他玩家交流</div>
            </div>
            <div style="background: #161823; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="font-size: 16px; color: #667eea; margin-bottom: 10px;">群号</div>
                <div style="font-size: 32px; font-weight: bold; color: #fff; letter-spacing: 3px; margin-bottom: 10px;">816068043</div>
                <div style="font-size: 12px; color: #999;">点击号码可复制</div>
            </div>
            <div style="font-size: 12px; color: #999; line-height: 1.5; margin-bottom: 20px;">
                <p>• 分享游戏心得</p>
                <p>• 反馈游戏问题</p>
                <p>• 获取最新资讯</p>
            </div>
            <button class="btn" onclick="copyQQGroup()">复制群号</button>
        </div>
    `;
    showModal(modalContent);
}

// ==================== 复制QQ群号 ====================
function copyQQGroup() {
    const groupNumber = '816068043';
    const textarea = document.createElement('textarea');
    textarea.value = groupNumber;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功', 'QQ群号已复制到剪贴板');
    } catch (err) {
        showWarning('复制失败，请手动输入：816068043');
    }
    
    document.body.removeChild(textarea);
    closeModal();
}

// ==================== 开发者设置点击处理 ====================
function handleDevSettingsClick() {
    const now = Date.now();
    if (now - lastSettingsClickTime > 3000) {
        settingsClickCount = 0;
    }
    lastSettingsClickTime = now;
    
    settingsClickCount++;
    if (settingsClickCount >= 15) {
        showDevPasswordModal();
    }
}

// ==================== 显示密码输入框 ====================
function showDevPasswordModal() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">开发者模式</div>
            <div class="close-btn" onclick="closeDevPasswordModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px; font-size: 14px; color: #999;">
                请输入开发者密码
            </div>
            <input type="password" class="text-input" id="devPasswordInput" placeholder="输入密码" maxlength="20" 
                   style="margin-bottom: 15px; background: #222; border: 1px solid #333; color: #fff;">
            <button class="btn" onclick="devVerifyPassword()">确定</button>
        </div>
    `;
    showModal(modalContent);
    
    setTimeout(() => {
        const input = document.getElementById('devPasswordInput');
        if (input) input.focus();
    }, 100);
}

// ==================== 关闭密码输入框 ====================
function closeDevPasswordModal() {
    closeModal();
    settingsClickCount = 0;
}

// ==================== 个人主页 ====================
function showProfile() {
    const content = document.getElementById('profilePageContent');
    content.innerHTML = `
        <div style="text-align:center;padding:20px">
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 10px">${gameState.avatar}</div>
            <div style="font-size:20px;font-weight:bold;margin-bottom:5px">${gameState.username}</div>
            <div style="font-size:14px;color:#999;margin-bottom:20px">${gameState.userId}</div>
            <div style="display:flex;justify-content:space-around;margin-bottom:20px">
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.fans}</div><div style="font-size:12px;color:#999">粉丝</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.works}</div><div style="font-size:12px;color:#999">作品</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.likes}</div><div style="font-size:12px;color:#999">获赞</div></div>
            </div>
            <button class="btn" onclick="showAllWorks()">查看所有作品</button>
        </div>
    `;
    
    document.getElementById('profilePage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 显示所有作品 ====================
function showAllWorks() {
    const worksHtml = gameState.worksList.map(work => {
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
        const trafficBadge = isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">推广中</span>' : '';
        const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">🔒 私密</span>' : '';
        
        return `
            <div class="work-item" onclick="showWorkDetail(${JSON.stringify(work).replace(/"/g, '&quot;')})">
                <div class="work-header">
                    <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${privacyBadge}</span>
                    <span class="work-time">${formatTime(work.time)} ${adBadge} ${trafficBadge}</span>
                </div>
                <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
                <div class="work-stats">
                    <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${work.comments.toLocaleString()}</span>
                    <span>🔄 ${work.shares.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
    
    const content = document.getElementById('worksPageContent');
    content.innerHTML = worksHtml.length === 0 ? 
        '<div style="text-align:center;color:#999;padding:20px;">还没有作品，快去创作吧！</div>' : worksHtml;
    
    document.getElementById('worksPage').classList.add('active');
    document.getElementById('profilePage').classList.remove('active');
}

// ==================== 成就显示 ====================
function showAchievements() {
    const achievementHtml = achievements.map(achievement => `<div class="achievement-item">
        <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
        <div class="achievement-info"><div class="achievement-name">${achievement.name}</div><div class="achievement-desc">${achievement.desc}</div></div>
        <div style="color:${achievement.unlocked ? '#667eea' : '#999'};font-size:12px">${achievement.unlocked ? '已解锁' : '未解锁'}</div>
    </div>`).join('');
    showModal(`<div class="modal-header"><div class="modal-title">成就系统</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="max-height:60vh;overflow-y:auto">${achievementHtml}</div>`);
}

// ==================== 成就帮助 ====================
function showAchievementsHelp() {
    showModal(`<div class="modal-header"><div class="modal-title">成就说明</div><div class="close-btn" onclick="closeModal()">✕</div></div>
        <div style="padding: 20px; line-height: 1.6;">
            <p style="margin-bottom: 15px;">🏆 完成成就可以获得游戏内的荣誉标识</p>
            <p style="margin-bottom: 15px;">📊 每个成就都有对应的进度条，完成目标即可解锁</p>
            <p style="margin-bottom: 15px;">💡 部分成就需要特定条件才能解锁，请多尝试不同玩法</p>
            <p style="color: #667eea;">🎯 努力成为传奇主播吧！</p>
        </div>
    `);
}

// ==================== 全屏成就页 ====================
function showAchievementsFullscreen() {
    const content = document.getElementById('achievementsListTab');
    if (!content) return;
    
    const progressMap = {
        1: { current: () => gameState.fans, target: 1 },
        2: { current: () => gameState.fans, target: 1000 },
        3: { current: () => gameState.fans, target: 100000 },
        4: { current: () => gameState.fans, target: 10000000 },
        5: { current: () => Math.max(...gameState.worksList.filter(w => !w.isPrivate).map(w => w.views), 0), target: 1000000 },
        6: { current: () => gameState.likes, target: 100000 },
        7: { current: () => gameState.worksList.filter(w => !w.isPrivate).length, target: 100 },
        8: { current: () => Math.max(...gameState.worksList.filter(w => w.type === 'live' && !w.isPrivate).map(w => w.views), 0), target: 1000 },
        9: { current: () => gameState.money, target: 1 },
        10: { current: () => gameState.money, target: 1000000 },
        11: { current: () => Math.max(...gameState.worksList.filter(w => !w.isPrivate).map(w => w.shares), 0), target: 10000 },
        12: { current: () => Math.max(...gameState.worksList.filter(w => !w.isPrivate).map(w => w.comments), 0), target: 5000 },
        13: { current: () => Math.floor((Date.now() - gameState.gameStartTime) / (24 * 60 * 60 * 1000)), target: 30 },
        21: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 1 },
        22: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 10 },
        23: { current: () => Math.max(...gameState.worksList.filter(w => w.isAd && !w.isPrivate).map(w => w.revenue), 0), target: 50000 },
        24: { current: () => gameState.rejectedAdOrders, target: 5 },
        25: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 50 }
    };
    
    const achievementHtml = achievements.map(achievement => {
        const progress = progressMap[achievement.id];
        let progressHtml = '';
        if (progress && !achievement.unlocked) {
            const current = progress.current();
            const percentage = Math.min(100, Math.floor((current / progress.target) * 100));
            progressHtml = `
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="achievement-progress-text">
                    ${current.toLocaleString()} / ${progress.target.toLocaleString()} (${percentage}%)
                </div>
            `;
        } else if (achievement.unlocked) {
            progressHtml = '<div style="color: #667eea; font-size: 12px; margin-top: 5px;">✅ 已完成</div>';
        } else {
            progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
        }
        
        return `
            <div class="achievement-item">
                <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                    ${progressHtml}
                </div>
                <div style="color:${achievement.unlocked ? '#667eea' : '#999'};font-size:12px">
                    ${achievement.unlocked ? '已解锁' : '未解锁'}
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = achievementHtml;
}

// ==================== 账号设置相关函数 ====================
function changeUsername() {
    showPrompt('请输入新昵称（最多10个字符）', gameState.username, function(newName) {
        if (newName && newName.trim()) {
            gameState.username = newName.trim().substring(0, 10);
            gameState.avatar = gameState.username.charAt(0).toUpperCase();
            updateDisplay();
            showNotification('修改成功', '昵称已更新');
        }
    });
}

function changeUserId() {
    showPrompt('请输入新ID（最多20个字符）', gameState.userId, function(newId) {
        if (newId && newId.trim()) {
            gameState.userId = newId.trim().substring(0, 20);
            showNotification('修改成功', 'ID已更新');
        }
    });
}

function changeAvatar() {
    showPrompt('请输入头像文字（1个字符）', gameState.avatar, function(avatar) {
        if (avatar && avatar.trim()) {
            gameState.avatar = avatar.trim().substring(0, 1);
            updateDisplay();
            showNotification('修改成功', '头像已更新');
        }
    });
}

function clearData() {
    showConfirm('确定要清除所有数据吗？此操作不可恢复！', function(confirmed) {
        if (confirmed) {
            try {
                if (typeof resetGame === 'function') {
                    resetGame();
                }
                localStorage.removeItem('streamerGameState');
                showAlert('数据已清除！页面将刷新。', '提示');
                setTimeout(() => {
                    location.reload(true);
                }, 100);
            } catch (error) {
                console.error('清除数据失败:', error);
                showAlert('清除数据失败，请手动清除浏览器缓存。', '错误');
            }
        }
    });
}

// ==================== 开发者模式相关变量 ====================
let settingsClickCount = 0;
let lastSettingsClickTime = 0;

// ==================== 缺失的全局函数 ====================
window.toggleWorkPrivacy = function() {
    if (currentDetailWork) {
        togglePrivate(currentDetailWork.id);
    }
};

// ==================== 全局函数绑定 ====================
window.showSettings = showSettings;
window.showGameSettings = showGameSettings;
window.showPlayTime = showPlayTime;
window.showQQGroup = showQQGroup;
window.copyQQGroup = copyQQGroup;
window.showProfile = showProfile;
window.showAllWorks = showAllWorks;
window.showAchievements = showAchievements;
window.showAchievementsHelp = showAchievementsHelp;
window.showAchievementsFullscreen = showAchievementsFullscreen;
window.changeUsername = changeUsername;
window.changeUserId = changeUserId;
window.changeAvatar = changeAvatar;
window.clearData = clearData;
window.handleDevSettingsClick = handleDevSettingsClick;
window.showDevPasswordModal = showDevPasswordModal;
window.closeDevPasswordModal = closeDevPasswordModal;
window.settingsClickCount = settingsClickCount;
window.lastSettingsClickTime = lastSettingsClickTime;
