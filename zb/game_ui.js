// ==================== 主界面更新 ====================
function updateDisplay() {
    document.getElementById('usernameDisplay').textContent = gameState.username;
    document.getElementById('userAvatar').textContent = gameState.avatar;
    
    // 更新虚拟日期显示（包含完整时间）
    const dateDisplay = document.getElementById('virtualDateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = formatVirtualDate(true);
        dateDisplay.classList.add('updating');
        setTimeout(() => dateDisplay.classList.remove('updating'), 300);
    }
    
    // 只统计非私密作品
    const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
    
    // 只统计视频和直播的播放量
    const videoAndLiveWorks = publicWorks.filter(w => w.type === 'video' || w.type === 'live');
    const totalViews = videoAndLiveWorks.reduce((sum, w) => sum + w.views, 0);
    
    const totalLikes = publicWorks.reduce((sum, w) => sum + w.likes, 0);
    
    document.getElementById('fansCount').textContent = formatNumber(gameState.fans);
    document.getElementById('likesCount').textContent = formatNumber(totalLikes);
    document.getElementById('viewsCount').textContent = formatNumber(totalViews);
    document.getElementById('worksCount').textContent = publicWorks.length;
    
    // ========== 修改：零钱单位转换 ==========
    document.getElementById('moneyCount').textContent = formatNumber(Math.floor(gameState.money));
    // ========== 结束修改 ==========
    
    document.getElementById('warningCount').textContent = `${gameState.warnings}/20`;
    
    // 虚拟时间统计
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
    
    if (hotSearchNotice) gameState.isHotSearch ? hotSearchNotice.classList.add('show') : hotSearchNotice.classList.remove('show');
    if (banNotice) gameState.isBanned ? banNotice.classList.add('show') : banNotice.classList.remove('show');
    if (publicOpinionNotice) gameState.isPublicOpinionCrisis ? publicOpinionNotice.classList.add('show') : publicOpinionNotice.classList.remove('show');
    
    if (typeof showHotSearchNotice === 'function') showHotSearchNotice();
    if (typeof showBanNotice === 'function') showBanNotice();
    if (typeof showPublicOpinionNotice === 'function') showPublicOpinionNotice();
    
    updateWorksList();
    if (typeof checkAchievements === 'function') checkAchievements();
    saveGame();
    
    // 恢复开发者模式状态
    if (gameState.devMode) {
        document.getElementById('devFloatButton').style.display = 'block';
    } else {
        document.getElementById('devFloatButton').style.display = 'none';
    }
    
    // ========== 新增：作品标签页实时更新 ==========
    const activeTab = document.querySelector('.nav-item.active');
    if (activeTab && activeTab.textContent.includes('作品')) {
        const worksContent = document.getElementById('worksContent');
        if (worksContent && worksContent.style.display !== 'none') {
            if (typeof renderWorksPage === 'function') {
                renderWorksPage();
            }
        }
    }
    // ========== 结束修改 ==========
}

// ==================== 模态框 ====================
function showModal(content) { 
    document.getElementById('modalContent').innerHTML = content; 
    document.getElementById('modal').style.display = 'block'; 
}

function closeModal() { 
    document.getElementById('modal').style.display = 'none'; 
}

// ==================== 作品列表更新 ====================
function updateWorksList() {
    const worksList = document.getElementById('worksList');
    if (!worksList) return;
    worksList.innerHTML = '';
    const recentWorks = gameState.worksList.slice(-5).reverse();
    recentWorks.forEach((work) => {
        const statusBadges = [];
        
        if (work.isRecommended) {
            const timeLeft = Math.max(0, work.recommendEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusBadges.push(`<span style="background:linear-gradient(135deg, #00f2ea 0%, #667eea 100%);color:#000;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">🔥推荐${timeLeft.toFixed(1)}天</span>`);
        }
        
        if (work.isControversial) {
            const timeLeft = Math.max(0, work.controversyEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusBadges.push(`<span style="background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">⚠️争议${timeLeft.toFixed(1)}天</span>`);
        }
        
        if (work.isHot) {
            const timeLeft = Math.max(0, work.hotEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusBadges.push(`<span style="background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">🔥热搜${timeLeft.toFixed(1)}天</span>`);
        }
        
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        if (isTrafficActive) {
            statusBadges.push('<span style="background:#667eea;color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">📈推广</span>');
        }
        
        const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">商单</span>' : '';
        const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">🔒私密</span>' : '';
        
        const statusBar = statusBadges.length > 0 ? `<div style="margin-bottom:8px;">${statusBadges.join('')}</div>` : '';
        
        const workItem = document.createElement('div');
        workItem.className = 'work-item';
        workItem.innerHTML = `
            ${statusBar}
            <div class="work-header">
                <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${privacyBadge}</span>
                <span class="work-time">${formatTime(work.time)} ${adBadge}</span>
            </div>
            <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
            <div class="work-stats">
                <span>▶️ ${work.views.toLocaleString()}</span>
                <span>❤️ ${work.likes.toLocaleString()}</span>
                <span>💬 ${work.comments.toLocaleString()}</span>
                <span>🔄 ${work.shares.toLocaleString()}</span>
            </div>
        `;
        workItem.onclick = () => showWorkDetail(work);
        worksList.appendChild(workItem);
    });
    if (recentWorks.length === 0) worksList.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">还没有作品，快去创作吧！</div>';
}

// ==================== 作品自动更新 ====================
function startWorkUpdates() {
    setInterval(() => {
        if (gameState.worksList.length === 0) return;
        gameState.worksList.forEach(work => {
            if (work.isPrivate) return;
            const viewsGrowth = Math.floor(Math.random() * 50);
            const likesGrowth = Math.floor(Math.random() * 20);
            const commentsGrowth = Math.floor(Math.random() * 10);
            const sharesGrowth = Math.floor(Math.random() * 5);
            const oldViews = work.views;
            work.views += viewsGrowth;
            
            if (work.type === 'video' || work.type === 'live') {
                gameState.views += viewsGrowth;
            }
            
            const oldRevenue = work.revenue || 0;
            const newRevenue = Math.floor(work.views / 1000);
            const revenueGrowth = newRevenue - oldRevenue;
            if (revenueGrowth > 0) {
                work.revenue = newRevenue;
                gameState.money += revenueGrowth;
            }
            work.likes += likesGrowth;
            gameState.likes += likesGrowth;
            work.comments += commentsGrowth;
            work.shares += sharesGrowth;
            
            gameState.totalInteractions += commentsGrowth + sharesGrowth;
            
            const viewsEl = document.getElementById(`work-views-${work.id}`);
            const likesEl = document.getElementById(`work-likes-${work.id}`);
            const commentsEl = document.getElementById(`work-comments-${work.id}`);
            const sharesEl = document.getElementById(`work-shares-${work.id}`);
            if (viewsEl) { viewsEl.textContent = work.views.toLocaleString(); animateNumberUpdate(viewsEl); }
            if (likesEl) { likesEl.textContent = work.likes.toLocaleString(); animateNumberUpdate(likesEl); }
            if (commentsEl) { commentsEl.textContent = work.comments.toLocaleString(); animateNumberUpdate(commentsEl); }
            if (sharesEl) { sharesEl.textContent = work.shares.toLocaleString(); animateNumberUpdate(sharesEl); }
        });
        updateDisplay();
    }, 3000);
}

// ==================== 数字动画 ====================
function animateNumberUpdate(element) { 
    element.classList.add('updating'); 
    setTimeout(() => element.classList.remove('updating'), 300); 
}

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

// ==================== 游戏设置（仅保留2个选项） ====================
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

// ==================== 处理开发者设置点击 ====================
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

// ==================== 账号设置相关函数 ====================
function changeUsername() {
    const newName = prompt('请输入新昵称（最多10个字符）', gameState.username);
    if (newName && newName.trim()) {
        gameState.username = newName.trim().substring(0, 10);
        gameState.avatar = gameState.username.charAt(0).toUpperCase();
        updateDisplay();
        showNotification('修改成功', '昵称已更新');
    }
}

function changeUserId() {
    const newId = prompt('请输入新ID（最多20个字符）', gameState.userId);
    if (newId && newId.trim()) {
        gameState.userId = newId.trim().substring(0, 20);
        showNotification('修改成功', 'ID已更新');
    }
}

function changeAvatar() {
    const avatar = prompt('请输入头像文字（1个字符）', gameState.avatar);
    if (avatar && avatar.trim()) {
        gameState.avatar = avatar.trim().substring(0, 1);
        updateDisplay();
        showNotification('修改成功', '头像已更新');
    }
}

function clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        try {
            if (typeof resetGame === 'function') {
                resetGame();
            }
            localStorage.removeItem('streamerGameState');
            alert('数据已清除！页面将刷新。');
            setTimeout(() => {
                location.reload(true);
            }, 100);
        } catch (error) {
            console.error('清除数据失败:', error);
            alert('清除数据失败，请手动清除浏览器缓存。');
        }
    }
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

function showAllWorks() {
    const worksHtml = gameState.worksList.map(work => {
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
        const trafficBadge = isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">推广中</span>' : '';
        const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">🔒 私密</span>' : '';
        return `
            <div class="work-item" onclick="showWorkDetail(${JSON.stringify(work).replace(/"/g, '&quot;')})">
                <div class="work-header">
                    <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${privacyBadge}</span>
                    <span class="work-time">${formatTime(work.time)} ${adBadge} ${trafficBadge}</span>
                </div>
                <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
                <div class="work-stats">
                    <span>▶️ ${work.views.toLocaleString()}</span>
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

// ==================== 作品详情 ====================
let currentDetailWork = null;

function showWorkDetail(work) {
    currentDetailWork = work;
    const trafficData = gameState.trafficWorks[work.id];
    const isTrafficActive = trafficData && trafficData.isActive;
    
    const statusIndicators = [];
    
    if (work.isRecommended) {
        const timeLeft = Math.max(0, work.recommendEndTime - gameTimer) / VIRTUAL_DAY_MS;
        statusIndicators.push(`<div style="background:linear-gradient(135deg, #00f2ea 0%, #667eea 100%);color:#000;padding:8px;border-radius:5px;text-align:center;font-weight:bold;margin-bottom:10px;animation:pulse 1s infinite;">🔥推荐中...（剩余${timeLeft.toFixed(1)}天）</div>`);
    }
    
    if (work.isControversial) {
        const timeLeft = Math.max(0, work.controversyEndTime - gameTimer) / VIRTUAL_DAY_MS;
        statusIndicators.push(`<div style="background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;padding:8px;border-radius:5px;text-align:center;font-weight:bold;margin-bottom:10px;animation:pulse 1s infinite;">⚠️争议中（剩余${timeLeft.toFixed(1)}天）</div>`);
    }
    
    if (work.isHot) {
        const timeLeft = Math.max(0, work.hotEndTime - gameTimer) / VIRTUAL_DAY_MS;
        statusIndicators.push(`<div style="background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;padding:8px;border-radius:5px;text-align:center;font-weight:bold;margin-bottom:10px;animation:pulse 1s infinite;">🔥热搜中（剩余${timeLeft.toFixed(1)}天）</div>`);
    }
    
    const trafficStatus = isTrafficActive ? `
        <div style="background: linear-gradient(135deg,#ff6b00 0%,#ff0050 100%); color: #fff; padding: 8px; border-radius: 5px; text-align: center; font-weight: bold; margin-bottom: 15px; animation: pulse 1s infinite;">
            📈 推送中...（剩余${Math.ceil(Math.max(0, trafficData.days - ((gameTimer - trafficData.startTime) / VIRTUAL_DAY_MS)))}天）
        </div>
    ` : '';
    
    const adBadge = work.isAd ? '<div style="background:#ff0050;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🎯 商单合作</div>' : '';
    const privacyBadge = work.isPrivate ? '<div style="background:#999;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🔒 私密作品</div>' : '';
    const comments = typeof generateComments === 'function' ? generateComments(work.comments, work.time) : [];
    
    const viewsLabel = work.type === 'post' ? '查阅' : '播放/观看';
    
    const content = document.getElementById('workDetailPageContent');
    content.innerHTML = `
        <div style="margin-bottom:20px">
            ${statusIndicators.join('')}
            ${trafficStatus}${adBadge}${privacyBadge}
            <div style="font-size:16px;margin-bottom:10px">${work.content}</div>
            <div style="font-size:12px;color:#999;margin-bottom:15px">${formatTime(work.time)}</div>
            <div style="display:flex;justify-content:space-around;padding:15px;background:#161823;border-radius:10px;margin-bottom:20px">
                <div style="text-align:center">
                    <div style="font-size:18px;font-weight:bold">${work.views.toLocaleString()}</div>
                    <div style="font-size:12px;color:#999">${viewsLabel}</div>
                </div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.likes.toLocaleString()}</div><div style="font-size:12px;color:#999">点赞</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.comments.toLocaleString()}</div><div style="font-size:12px;color:#999">评论</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.shares.toLocaleString()}</div><div style="font-size:12px;color:#999">转发</div></div>
            </div>
            ${work.revenue ? `<div style="font-size:14px;color:#667eea;margin-bottom:15px">💰 收益：${work.revenue}元</div>` : ''}
            <div style="margin-bottom:10px;font-weight:bold">评论区</div>
            <div id="commentsList">${comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-user">${comment.user}</span>
                        <span class="comment-time">${formatTime(comment.time)}</span>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-actions">
                        <span class="comment-action">👍 ${comment.likes}</span>
                        <span class="comment-action">回复</span>
                    </div>
                </div>
            `).join('')}</div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn" onclick="togglePrivate(${work.id})" style="background: ${work.isPrivate ? '#667eea' : '#333'}; flex: 1;">
                    ${work.isPrivate ? '🔓 取消私密' : '🔒 设为私密'}
                </button>
                <button class="btn btn-danger" onclick="deleteWork(${work.id})" style="flex: 1; background: #ff0050;">
                    🗑️ 删除作品
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('workDetailTitle').textContent = work.type === 'video' ? '视频详情' : work.type === 'live' ? '直播详情' : '动态详情';
    document.getElementById('workDetailPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 删除作品 ====================
function deleteWork(workId) {
    const workIndex = gameState.worksList.findIndex(w => w.id === workId);
    if (workIndex === -1) return;
    
    const work = gameState.worksList[workIndex];
    
    if (confirm(`确定要删除这个${work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态'}吗？此操作不可恢复！`)) {
        if (work.isRecommended && work.recommendInterval) {
            clearInterval(work.recommendInterval);
        }
        if (work.isControversial && work.controversyInterval) {
            clearInterval(work.controversyInterval);
        }
        if (work.isHot && work.hotInterval) {
            clearInterval(work.hotInterval);
        }
        
        if (work.type === 'video' || work.type === 'live') {
            gameState.views = Math.max(0, gameState.views - work.views);
        }
        gameState.likes = Math.max(0, gameState.likes - work.likes);
        
        gameState.worksList.splice(workIndex, 1);
        
        if (gameState.trafficWorks[workId]) {
            if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
        }
        
        const interactionCount = work.comments + work.likes + work.shares;
        gameState.totalInteractions = Math.max(0, gameState.totalInteractions - interactionCount);
        
        gameState.works = gameState.worksList.filter(w => !w.isPrivate).length;
        
        closeFullscreenPage('workDetail');
        updateDisplay();
        showNotification('删除成功', '作品已删除');
    }
}

// ==================== 切换私密状态 ====================
function togglePrivate(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work) return;
    
    work.isPrivate = !work.isPrivate;
    
    const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
    gameState.works = publicWorks.length;
    gameState.views = publicWorks.filter(w => w.type === 'video' || w.type === 'live').reduce((sum, w) => sum + w.views, 0);
    gameState.likes = publicWorks.reduce((sum, w) => sum + w.likes, 0);
    
    gameState.totalInteractions = publicWorks.reduce((sum, w) => {
        return sum + w.comments + w.likes + w.shares;
    }, 0);
    
    showNotification('设置成功', work.isPrivate ? '作品已设为私密' : '作品已取消私密');
    showWorkDetail(work);
    updateDisplay();
}

// ==================== 评论生成 ====================
function generateComments(count, workTime) {
    const comments = [], 
          users = ['小可爱123', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'], 
          contents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油', '很好看', '不错不错', '学习了', '收藏了', '转发支持', '期待更新', '主播最美', '最棒的主播', '今天状态真好', '这个内容有意思', '讲得很详细', '受益匪浅', '主播人真好', '互动很棒', '直播很有趣'];
    
    const commentCount = Math.min(count, 20);
    const now = gameTimer;
    
    for (let i = 0; i < commentCount; i++) {
        const maxOffset = Math.max(0, now - workTime);
        const randomFactor = Math.random() * Math.random();
        const offset = Math.floor(randomFactor * maxOffset);
        const commentTime = Math.min(workTime + offset, now);
        
        comments.push({ 
            user: users[Math.floor(Math.random() * users.length)] + Math.floor(Math.random() * 999), 
            content: contents[Math.floor(Math.random() * contents.length)], 
            likes: Math.floor(Math.random() * 100), 
            time: commentTime
        });
    }
    
    return comments;
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

// ==================== 通知显示 ====================
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

// ==================== 全屏页面关闭 ====================
function closeFullscreenPage(pageName) {
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    if (pageName === 'workDetail') {
        currentDetailWork = null;
    }
    
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
}

// ==================== 全屏作品页（核心修改：实时动态 + 分页） ====================
// ========== 新增：分页状态变量 ==========
window.currentWorksPage = 1;
window.worksPerPage = 10;
window.currentWorksCategory = 'all';
window.worksUpdateInterval = null;
// ========== 结束修改 ==========

function showWorksFullscreen() {
    const content = document.getElementById('worksListTab');
    if (!content) return;
    
    // ========== 新增：初始化分页状态 ==========
    window.currentWorksPage = 1;
    window.currentWorksCategory = 'all';
    // ========== 结束修改 ==========
    
    const categoryTabs = `
        <div style="display: flex; padding: 10px; gap: 10px; background: #161823; border-radius: 10px; margin: 10px;">
            <div class="category-tab active" data-category="all" onclick="filterWorksByCategory('all')">全部</div>
            <div class="category-tab" data-category="video" onclick="filterWorksByCategory('video')">视频</div>
            <div class="category-tab" data-category="post" onclick="filterWorksByCategory('post')">动态</div>
            <div class="category-tab" data-category="live" onclick="filterWorksByCategory('live')">直播</div>
        </div>
        <div id="filteredWorksList" style="padding: 0 10px;"></div>
        <div id="worksPagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; padding: 15px 10px; background: #161823; margin: 10px; border-radius: 10px; border: 1px solid #333;"></div>
    `;
    
    content.innerHTML = categoryTabs;
    renderWorksPage();
    
    // ========== 新增：启动实时更新 ==========
    startWorksRealtimeUpdate();
    // ========== 结束修改 ==========
    
    const totalCountEl = document.getElementById('worksTotalCount');
    if (totalCountEl) {
        const totalWorks = gameState.worksList.length;
        totalCountEl.textContent = `共${totalWorks}个作品`;
    }
}

// ========== 新增：渲染作品分页函数 ==========
function renderWorksPage() {
    const filteredListEl = document.getElementById('filteredWorksList');
    const paginationEl = document.getElementById('worksPagination');
    if (!filteredListEl || !paginationEl) return;
    
    // 获取当前分类的作品
    let filteredWorks = gameState.worksList;
    if (window.currentWorksCategory !== 'all') {
        filteredWorks = gameState.worksList.filter(work => work.type === window.currentWorksCategory);
    }
    
    // 计算分页
    const totalWorks = filteredWorks.length;
    const totalPages = Math.max(1, Math.ceil(totalWorks / window.worksPerPage));
    
    // 确保当前页码有效
    if (window.currentWorksPage > totalPages) {
        window.currentWorksPage = totalPages;
    }
    if (window.currentWorksPage < 1) {
        window.currentWorksPage = 1;
    }
    
    // 获取当前页的作品
    const startIndex = (window.currentWorksPage - 1) * window.worksPerPage;
    const endIndex = startIndex + window.worksPerPage;
    const pageWorks = filteredWorks.slice(startIndex, endIndex);
    
    // 渲染作品列表
    const worksHtml = pageWorks.map(work => {
        const statusBadges = [];
        
        if (work.isRecommended) {
            const timeLeft = Math.max(0, work.recommendEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusBadges.push(`<span style="background:linear-gradient(135deg, #00f2ea 0%, #667eea 100%);color:#000;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">🔥推荐${timeLeft.toFixed(1)}天</span>`);
        }
        
        if (work.isControversial) {
            const timeLeft = Math.max(0, work.controversyEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusBadges.push(`<span style="background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">⚠️争议${timeLeft.toFixed(1)}天</span>`);
        }
        
        if (work.isHot) {
            const timeLeft = Math.max(0, work.hotEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusBadges.push(`<span style="background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">🔥热搜${timeLeft.toFixed(1)}天</span>`);
        }
        
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        if (isTrafficActive) {
            statusBadges.push('<span style="background:#667eea;color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;">📈推广</span>');
        }
        
        const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">商单</span>' : '';
        const trafficBadge = isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">推广中</span>' : '';
        const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">🔒 私密</span>' : '';
        
        const statusBar = statusBadges.length > 0 ? `<div style="margin-bottom:8px;">${statusBadges.join('')}</div>` : '';
        
        return `
            <div class="work-item" onclick="showWorkDetail(${JSON.stringify(work).replace(/"/g, '&quot;')})">
                ${statusBar}
                <div class="work-header">
                    <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${privacyBadge}</span>
                    <span class="work-time">${formatTime(work.time)} ${adBadge} ${trafficBadge}</span>
                </div>
                <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
                <div class="work-stats">
                    <span>▶️ ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${work.comments.toLocaleString()}</span>
                    <span>🔄 ${work.shares.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
    
    filteredListEl.innerHTML = worksHtml.length === 0 ? 
        '<div style="text-align:center;color:#999;padding:20px;">暂无作品，快去创作吧！</div>' : worksHtml;
    
    // 渲染分页控件
    renderWorksPagination(totalPages, totalWorks);
}
// ========== 结束修改 ==========

// ========== 新增：渲染分页控件函数 ==========
function renderWorksPagination(totalPages, totalWorks) {
    const paginationEl = document.getElementById('worksPagination');
    if (!paginationEl) return;
    
    const currentPage = window.currentWorksPage;
    let paginationHtml = '';
    
    // 上一页按钮
    const prevDisabled = currentPage === 1;
    paginationHtml += `<button class="page-btn ${prevDisabled ? 'disabled' : ''}" onclick="changeWorksPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''}>‹</button>`;
    
    // 页码按钮
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        paginationHtml += `<button class="page-btn" onclick="changeWorksPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changeWorksPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
        paginationHtml += `<button class="page-btn" onclick="changeWorksPage(${totalPages})">${totalPages}</button>`;
    }
    
    // 下一页按钮
    const nextDisabled = currentPage === totalPages;
    paginationHtml += `<button class="page-btn ${nextDisabled ? 'disabled' : ''}" onclick="changeWorksPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''}>›</button>`;
    
    // 统计信息
    const startItem = totalWorks > 0 ? (currentPage - 1) * window.worksPerPage + 1 : 0;
    const endItem = Math.min(currentPage * window.worksPerPage, totalWorks);
    paginationHtml += `<span style="margin-left: 10px; font-size: 12px; color: #999;">${startItem}-${endItem} / ${totalWorks}</span>`;
    
    paginationEl.innerHTML = paginationHtml;
}
// ========== 结束修改 ==========

// ========== 新增：切换页面函数 ==========
function changeWorksPage(page) {
    const filteredWorks = window.currentWorksCategory === 'all' 
        ? gameState.worksList 
        : gameState.worksList.filter(work => work.type === window.currentWorksCategory);
    
    const totalPages = Math.max(1, Math.ceil(filteredWorks.length / window.worksPerPage));
    
    if (page < 1 || page > totalPages) return;
    
    window.currentWorksPage = page;
    renderWorksPage();
}
// ========== 结束修改 ==========

// ========== 修改：分类过滤函数 ==========
function filterWorksByCategory(category) {
    // 更新分类按钮状态
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // 重置分页状态
    window.currentWorksCategory = category;
    window.currentWorksPage = 1;
    
    // 重新渲染
    renderWorksPage();
}
// ========== 结束修改 ==========

// ========== 新增：启动作品实时更新 ==========
function startWorksRealtimeUpdate() {
    // 先清理之前的定时器
    if (window.worksUpdateInterval) {
        clearInterval(window.worksUpdateInterval);
    }
    
    // 每秒更新一次（与主界面同步）
    window.worksUpdateInterval = setInterval(() => {
        const worksPage = document.getElementById('worksListTab');
        if (worksPage && worksPage.offsetParent !== null) {
            // 作品标签页处于激活状态
            const activeTab = document.querySelector('.nav-item.active');
            if (activeTab && activeTab.textContent.includes('作品')) {
                renderWorksPage();
            }
        }
    }, 1000);
}
// ========== 结束修改 ==========

// ==================== 全屏消息页 ====================
function showMessagesFullscreen() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    gameState.notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    
    const notificationHtml = gameState.notifications.slice(-50).reverse().map(notification => `
        <div class="comment-item" style="${!notification.read ? 'border-left: 3px solid #667eea;' : ''}">
            <div class="comment-header">
                <span class="comment-user">${notification.title}</span>
                <span class="comment-time">${formatTime(notification.time)}</span>
            </div>
            <div class="comment-content">${notification.content}</div>
        </div>
    `).join('');
    
    content.innerHTML = gameState.notifications.length === 0 ? 
        '<div style="text-align:center;color:#999;padding:20px;">暂无通知</div>' : notificationHtml;
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

// ==================== 消息全部已读 ====================
function markAllRead() {
    gameState.notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
    showNotification('操作成功', '所有消息已标记为已读');
}

// ==================== 警告显示 ====================
function showWarning(message) {
    const toast = document.getElementById('warningToast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ==================== 全局函数绑定 ====================
window.updateDisplay = updateDisplay;
window.showModal = showModal;
window.closeModal = closeModal;
window.showDevPasswordModal = showDevPasswordModal;
window.closeDevPasswordModal = closeDevPasswordModal;
window.handleDevSettingsClick = handleDevSettingsClick;
window.showSettings = showSettings;
window.showGameSettings = showGameSettings;
window.showPlayTime = showPlayTime;
window.showQQGroup = showQQGroup;
window.copyQQGroup = copyQQGroup;
window.showProfile = showProfile;
window.showAllWorks = showAllWorks;
window.showWorkDetail = showWorkDetail;
window.showAchievements = showAchievements;
window.showNotifications = showNotifications;
window.updateNotificationBadge = updateNotificationBadge;
window.switchTab = switchTab;
window.closeFullscreenPage = closeFullscreenPage;
window.showWorksFullscreen = showWorksFullscreen;
window.showMessagesFullscreen = showMessagesFullscreen;
window.showAchievementsFullscreen = showAchievementsFullscreen;
window.markAllRead = markAllRead;
window.showAchievementsHelp = showAchievementsHelp;
window.showWarning = showWarning;
window.deleteWork = deleteWork;
window.togglePrivate = togglePrivate;
window.changeUsername = changeUsername;
window.changeUserId = changeUserId;
window.changeAvatar = changeAvatar;
window.clearData = clearData;
window.generateComments = generateComments;
window.filterWorksByCategory = filterWorksByCategory;

// ========== 新增：绑定分页相关函数 ==========
window.renderWorksPage = renderWorksPage;
window.renderWorksPagination = renderWorksPagination;
window.changeWorksPage = changeWorksPage;
window.startWorksRealtimeUpdate = startWorksRealtimeUpdate;
// ========== 结束修改 ==========

// 开发者模式相关
let settingsClickCount = 0;
let lastSettingsClickTime = 0;
