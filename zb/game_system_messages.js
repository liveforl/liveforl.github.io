// ==================== 系统消息模块 ====================
// 本模块包含热搜话题邀请、月度总结等系统推送功能
// 依赖: game_core.js, game_ui_core.js

// ==================== 系统消息数据结构 ====================
/*
gameState.systemMessages = {
    unreadCount: 0,
    messages: [], // { id, type, title, content, time, read, data }
    hotSearchActiveWorks: [] // 当前参与热搜的作品ID列表
};
*/

// ==================== 热搜话题库 ====================
const hotSearchTopics = [
    '#春节特别策划#',
    '#美食探店挑战#',
    '#日常Vlog打卡#',
    '#游戏技巧分享#',
    '#美妆教程大赛#',
    '#健身打卡挑战#',
    '#旅行日记分享#',
    '#萌宠日常记录#',
    '#夏季穿搭指南#',
    '#读书分享会#',
    '#手工DIY教程#',
    '#音乐翻唱挑战#'
];

// ==================== 生成热搜话题邀请 ====================
function generateHotSearchInvite() {
    if (!gameState.systemMessages) {
        initSystemMessages();
    }
    
    // 避免同时存在多个未处理的热搜邀请
    const existingInvite = gameState.systemMessages.messages.find(msg => 
        msg.type === 'hotSearchInvite' && !msg.data?.accepted && !msg.data?.expired
    );
    
    if (existingInvite) {
        console.log('已存在未处理的热搜邀请，跳过生成');
        return;
    }
    
    const topic = hotSearchTopics[Math.floor(Math.random() * hotSearchTopics.length)];
    const inviteMessage = {
        id: Date.now(),
        type: 'hotSearchInvite',
        title: '🚀 热搜话题邀请',
        content: `平台邀请你参与热门话题：${topic}`,
        time: gameTimer,
        read: false,
        data: {
            topic: topic,
            duration: 3, // 持续3虚拟天
            accepted: false,
            expired: false
        }
    };
    
    gameState.systemMessages.messages.push(inviteMessage);
    gameState.systemMessages.unreadCount++;
    
    showNotification('系统消息', `你收到了一个热搜话题邀请：${topic}`);
    
    // 更新UI
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    saveGame();
}

// ==================== 生成月度收入总结 ====================
function generateMonthlySummary() {
    if (!gameState.systemMessages) {
        initSystemMessages();
    }
    
    const currentDate = getVirtualDate();
    const currentMonth = `${currentDate.year}-${currentDate.month}`;
    
    // 检查本月是否已生成总结
    const hasSummaryThisMonth = gameState.systemMessages.messages.some(msg => 
        msg.type === 'monthlySummary' && msg.data?.month === currentMonth
    );
    
    if (hasSummaryThisMonth) {
        console.log(`本月(${currentMonth})已生成过收入总结，跳过`);
        return;
    }
    
    // 计算本月收入（只统计已发布的公开作品）
    const thirtyDaysAgo = gameTimer - (30 * VIRTUAL_DAY_MS);
    const monthlyWorks = gameState.worksList.filter(work => 
        work.time >= thirtyDaysAgo && !work.isPrivate
    );
    
    const videoWorks = monthlyWorks.filter(work => work.type === 'video');
    const postWorks = monthlyWorks.filter(work => work.type === 'post');
    const liveWorks = monthlyWorks.filter(work => work.type === 'live');
    
    const videoRevenue = videoWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    const postRevenue = postWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    const liveRevenue = liveWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    const totalRevenue = videoRevenue + postRevenue + liveRevenue;
    
    // 计算商单收入
    const adWorks = monthlyWorks.filter(work => work.isAd);
    const adRevenue = adWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    
    const summaryMessage = {
        id: Date.now(),
        type: 'monthlySummary',
        title: `${currentDate.month}月收入总结`,
        content: `你在${currentDate.month}月份共发布${monthlyWorks.length}个作品，总收入${totalRevenue.toLocaleString()}元`,
        time: gameTimer,
        read: false,
        data: {
            month: currentMonth,
            monthName: currentDate.month,
            workCount: monthlyWorks.length,
            videoCount: videoWorks.length,
            postCount: postWorks.length,
            liveCount: liveWorks.length,
            totalRevenue: totalRevenue,
            videoRevenue: videoRevenue,
            postRevenue: postRevenue,
            liveRevenue: liveRevenue,
            adRevenue: adRevenue,
            adCount: adWorks.length
        }
    };
    
    gameState.systemMessages.messages.push(summaryMessage);
    gameState.systemMessages.unreadCount++;
    
    showNotification('系统消息', '你的月度收入总结已生成');
    
    // 更新UI
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    saveGame();
}

// ==================== 接受热搜邀请 ====================
function acceptHotSearchInvite(messageId, contentType) {
    const message = gameState.systemMessages.messages.find(m => m.id == messageId);
    if (!message || message.data?.accepted || message.data?.expired) {
        console.log('热搜邀请无效或已过期');
        return;
    }
    
    // 标记为已接受
    message.data.accepted = true;
    message.data.acceptedAt = gameTimer;
    message.data.contentType = contentType;
    
    // 标记为已读
    if (!message.read) {
        message.read = true;
        gameState.systemMessages.unreadCount = Math.max(0, gameState.systemMessages.unreadCount - 1);
    }
    
    // 创建热搜作品
    const topic = message.data.topic;
    const workId = Date.now();
    
    const hotWork = {
        id: workId,
        type: contentType,
        title: contentType === 'video' ? `${topic} - 视频创作` : topic,
        content: `参与热搜话题：${topic} ${contentType === 'video' ? '- 我的创作视频' : '- 我的动态分享'}`,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        time: gameTimer,
        isPrivate: false,
        isHotSearchWork: true,
        hotSearchData: {
            topic: topic,
            duration: message.data.duration,
            startTime: gameTimer,
            endTime: gameTimer + (message.data.duration * VIRTUAL_DAY_MS)
        },
        revenue: 0
    };
    
    gameState.worksList.push(hotWork);
    gameState.works++;
    
    // 添加到活跃热搜作品列表
    if (!gameState.systemMessages.hotSearchActiveWorks) {
        gameState.systemMessages.hotSearchActiveWorks = [];
    }
    gameState.systemMessages.hotSearchActiveWorks.push(workId);
    
    // 启动热搜效果
    startHotSearchWorkEffect(workId);
    
    showNotification('发布成功', `你已参与热搜话题：${topic}`);
    
    // 更新UI
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    saveGame();
    
    // 关闭系统消息页面
    closeSystemMessagesList();
}

// ==================== 启动热搜作品效果（爆炸式增长） ====================
function startHotSearchWorkEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHotSearchWork) {
        console.error('热搜作品无效:', workId);
        return;
    }
    
    if (work.hotSearchInterval) {
        clearInterval(work.hotSearchInterval);
    }
    
    work.hotSearchInterval = setInterval(() => {
        // 检查是否到期
        if (gameTimer >= work.hotSearchData.endTime) {
            endHotSearchWorkEffect(workId);
            return;
        }
        
        // 爆炸式增长（比正常作品高5-10倍）
        const viewsBoost = Math.floor(Math.random() * 15000) + 10000;
        const likesBoost = Math.floor(Math.random() * 3000) + 1500;
        const commentsBoost = Math.floor(Math.random() * 800) + 400;
        const sharesBoost = Math.floor(Math.random() * 300) + 150;
        const fanBoost = Math.floor(Math.random() * 2000) + 1000;
        
        work.views += viewsBoost;
        if (work.type === 'video' || work.type === 'live') {
            gameState.views += viewsBoost;
        }
        work.likes += likesBoost;
        gameState.likes += likesBoost;
        work.comments += commentsBoost;
        work.shares += sharesBoost;
        gameState.fans += fanBoost;
        
        // 更新总互动数
        gameState.totalInteractions += likesBoost + commentsBoost + sharesBoost;
        
        // 收益翻倍
        const oldRevenue = work.revenue || 0;
        const newRevenue = Math.floor(work.views / 500); // 播放量/500，比正常/1000翻倍
        const revenueBoost = newRevenue - oldRevenue;
        if (revenueBoost > 0) {
            work.revenue = newRevenue;
            gameState.money += revenueBoost;
        }
        
        // 更新显示
        updateDisplay();
        
        // 每15秒显示一次增长通知（避免刷屏）
        if (Math.random() < 0.067) { // 约15秒一次
            showNotification('🔥 热搜爆发', `${work.hotSearchData.topic} 正在爆火中！`);
        }
    }, 1000);
    
    // 立即显示开始通知
    showNotification('🔥 热搜启动', `${work.hotSearchData.topic} 开始获得爆炸式增长！`);
    updateDisplay();
}

// ==================== 结束热搜效果 ====================
function endHotSearchWorkEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHotSearchWork) {
        console.error('热搜作品无效:', workId);
        return;
    }
    
    if (work.hotSearchInterval) {
        clearInterval(work.hotSearchInterval);
        work.hotSearchInterval = null;
    }
    
    work.isHotSearchWork = false;
    
    // 从活跃列表中移除
    if (gameState.systemMessages.hotSearchActiveWorks) {
        const index = gameState.systemMessages.hotSearchActiveWorks.indexOf(workId);
        if (index > -1) {
            gameState.systemMessages.hotSearchActiveWorks.splice(index, 1);
        }
    }
    
    // 标记邀请过期
    const inviteMessage = gameState.systemMessages.messages.find(msg => 
        msg.type === 'hotSearchInvite' && msg.data?.topic === work.hotSearchData.topic
    );
    if (inviteMessage && !inviteMessage.data.expired) {
        inviteMessage.data.expired = true;
    }
    
    showNotification('热搜结束', `话题 ${work.hotSearchData.topic} 的热度已下降`);
    updateDisplay();
}

// ==================== 检查并清理过期的热搜 ====================
function checkExpiredHotSearchWorks() {
    if (!gameState.systemMessages || !gameState.systemMessages.hotSearchActiveWorks) return;
    
    const expiredWorks = [];
    gameState.systemMessages.hotSearchActiveWorks.forEach(workId => {
        const work = gameState.worksList.find(w => w.id === workId);
        if (work && work.hotSearchData && gameTimer >= work.hotSearchData.endTime) {
            expiredWorks.push(workId);
        }
    });
    
    expiredWorks.forEach(workId => {
        endHotSearchWorkEffect(workId);
    });
}

// ==================== 初始化系统消息状态 ====================
function initSystemMessages() {
    if (!gameState.systemMessages) {
        gameState.systemMessages = {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: []
        };
    }
}

// ==================== 更新系统消息UI（小红点） ====================
function updateSystemMessagesUI() {
    if (!gameState.systemMessages) return;
    
    // 更新导航栏消息徽章
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    // 如果系统消息列表打开，刷新内容
    const systemMessagesPage = document.getElementById('systemMessagesPage');
    if (systemMessagesPage && systemMessagesPage.classList.contains('active')) {
        renderSystemMessagesList();
    }
}

// ==================== 显示系统消息列表（全屏） ====================
function showSystemMessagesList() {
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    const page = document.getElementById('systemMessagesPage');
    if (page) {
        page.classList.add('active');
        renderSystemMessagesList();
    }
}

// ==================== 渲染系统消息列表 ====================
function renderSystemMessagesList() {
    const content = document.getElementById('systemMessagesPageContent');
    if (!content) {
        console.error('系统消息内容容器未找到');
        return;
    }
    
    if (!gameState.systemMessages || gameState.systemMessages.messages.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">暂无系统消息</div>';
        return;
    }
    
    // 按时间排序（最新的在前）
    const messages = [...gameState.systemMessages.messages]
        .sort((a, b) => b.time - a.time);
    
    const messagesHtml = messages.map(msg => {
        const isUnread = !msg.read;
        const unreadStyle = isUnread ? 
            'border-left: 4px solid #00f2ea; background: #222;' : '';
        const unreadBadge = isUnread ? 
            `<span style="background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; margin-left: 5px;">
                新
            </span>` : '';
        
        let actionHtml = '';
        if (msg.type === 'hotSearchInvite' && !msg.data?.accepted && !msg.data?.expired) {
            // 未过期的热搜邀请显示操作按钮
            actionHtml = `
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn" style="flex: 1; padding: 8px; font-size: 12px; background: #667eea;" 
                            onclick="acceptHotSearchInvite('${msg.id}', 'video')">
                        🎬 用视频发布
                    </button>
                    <button class="btn" style="flex: 1; padding: 8px; font-size: 12px; background: #ff6b00;" 
                            onclick="acceptHotSearchInvite('${msg.id}', 'post')">
                        📝 用动态发布
                    </button>
                </div>
            `;
        } else if (msg.type === 'monthlySummary') {
            // 月度总结显示详细信息
            actionHtml = `
                <div style="background: #111; border-radius: 5px; padding: 10px; margin-top: 10px; font-size: 11px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; color: #ccc;">
                        <div>💰 总收入：<span style="color: #00f2ea; font-weight: bold;">${msg.data.totalRevenue.toLocaleString()}元</span></div>
                        <div>📹 视频：<span style="color: #667aea;">${msg.data.videoRevenue.toLocaleString()}元</span></div>
                        <div>📝 动态：<span style="color: #ff6b00;">${msg.data.postRevenue.toLocaleString()}元</span></div>
                        <div>📱 直播：<span style="color: #ff0050;">${msg.data.liveRevenue.toLocaleString()}元</span></div>
                        ${msg.data.adRevenue > 0 ? `<div>💼 商单：<span style="color: #FFD700;">${msg.data.adRevenue.toLocaleString()}元</span></div>` : ''}
                        <div>📊 作品数：<span style="color: #999;">${msg.data.workCount}个</span></div>
                    </div>
                </div>
            `;
        }
        
        // 计算剩余时间（针对热搜）
        let timeInfo = '';
        if (msg.type === 'hotSearchInvite' && !msg.data.expired) {
            if (msg.data.accepted) {
                timeInfo = '✅ 已接受';
            } else {
                const hoursLeft = Math.max(0, (msg.time + (24 * VIRTUAL_DAY_MS) - gameTimer) / VIRTUAL_HOUR_MS);
                timeInfo = `⏰ 剩余${Math.floor(hoursLeft)}小时`;
            }
        }
        
        return `
            <div class="system-message-item" style="${unreadStyle}" data-message-id="${msg.id}" 
                 onclick="readSystemMessage('${msg.id}')">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                            ${msg.title} ${unreadBadge}
                            ${timeInfo ? `<span style="font-size: 10px; color: #999; margin-left: 8px;">${timeInfo}</span>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #999; line-height: 1.5;">
                            ${msg.content}
                        </div>
                        <div style="font-size: 10px; color: #666; margin-top: 5px;">
                            ${formatTime(msg.time)}
                        </div>
                        ${actionHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = messagesHtml;
}

// ==================== 标记系统消息为已读 ====================
function readSystemMessage(messageId) {
    const message = gameState.systemMessages.messages.find(m => m.id == messageId);
    if (!message || message.read) return;
    
    message.read = true;
    gameState.systemMessages.unreadCount = Math.max(0, gameState.systemMessages.unreadCount - 1);
    
    saveGame();
    
    // 更新UI
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    
    // 如果是月度总结，重新渲染以显示详细信息
    if (message.type === 'monthlySummary') {
        renderSystemMessagesList();
    }
}

// ==================== 关闭系统消息列表 ====================
function closeSystemMessagesList() {
    const page = document.getElementById('systemMessagesPage');
    if (page) {
        page.classList.remove('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.nav-item').classList.add('active');
    }
    
    updateDisplay();
}

// ==================== 启动系统消息定时器 ====================
function startSystemMessagesTimer() {
    // 每虚拟天检查一次是否需要生成月度总结
    if (window.monthlySummaryInterval) {
        clearInterval(window.monthlySummaryInterval);
    }
    
    window.monthlySummaryInterval = setInterval(() => {
        const currentDate = getVirtualDate();
        // 在每月30号生成总结
        if (currentDate.day === 30) {
            generateMonthlySummary();
        }
        
        // 检查并清理过期的热搜
        checkExpiredHotSearchWorks();
    }, VIRTUAL_DAY_MS);
    
    // 每5秒检查一次过期的热搜（更频繁）
    if (window.hotSearchCheckInterval) {
        clearInterval(window.hotSearchCheckInterval);
    }
    
    window.hotSearchCheckInterval = setInterval(() => {
        checkExpiredHotSearchWorks();
    }, 5000);
}

// ==================== 停止系统消息定时器 ====================
function stopSystemMessagesTimer() {
    if (window.monthlySummaryInterval) {
        clearInterval(window.monthlySummaryInterval);
        window.monthlySummaryInterval = null;
    }
    if (window.hotSearchCheckInterval) {
        clearInterval(window.hotSearchCheckInterval);
        window.hotSearchCheckInterval = null;
    }
}

// ==================== 游戏加载时恢复热搜效果 ====================
function resumeHotSearchEffects() {
    if (!gameState.systemMessages || !gameState.systemMessages.hotSearchActiveWorks) {
        return;
    }
    
    console.log(`[恢复] 检测到${gameState.systemMessages.hotSearchActiveWorks.length}个活跃热搜作品`);
    
    gameState.systemMessages.hotSearchActiveWorks.forEach(workId => {
        const work = gameState.worksList.find(w => w.id === workId);
        if (work && work.isHotSearchWork && gameTimer < work.hotSearchData.endTime) {
            console.log(`[恢复] 重启热搜效果 - 作品ID: ${workId}, 剩余时间: ${(work.hotSearchData.endTime - gameTimer) / VIRTUAL_DAY_MS}天`);
            startHotSearchWorkEffect(workId);
        } else {
            console.log(`[清理] 移除无效热搜作品ID: ${workId}`);
            // 清理无效ID
            const index = gameState.systemMessages.hotSearchActiveWorks.indexOf(workId);
            if (index > -1) {
                gameState.systemMessages.hotSearchActiveWorks.splice(index, 1);
            }
        }
    });
}

// ==================== 全局函数绑定 ====================
window.gameSystemMessages = {
    initSystemMessages,
    generateHotSearchInvite,
    generateMonthlySummary,
    acceptHotSearchInvite,
    startHotSearchWorkEffect,
    endHotSearchWorkEffect,
    checkExpiredHotSearchWorks,
    showSystemMessagesList,
    renderSystemMessagesList,
    readSystemMessage,
    closeSystemMessagesList,
    updateSystemMessagesUI,
    startSystemMessagesTimer,
    stopSystemMessagesTimer,
    resumeHotSearchEffects
};

// 将函数绑定到全局
window.initSystemMessages = initSystemMessages;
window.generateHotSearchInvite = generateHotSearchInvite;
window.generateMonthlySummary = generateMonthlySummary;
window.acceptHotSearchInvite = acceptHotSearchInvite;
window.startHotSearchWorkEffect = startHotSearchWorkEffect;
window.endHotSearchWorkEffect = endHotSearchWorkEffect;
window.checkExpiredHotSearchWorks = checkExpiredHotSearchWorks;
window.showSystemMessagesList = showSystemMessagesList;
window.renderSystemMessagesList = renderSystemMessagesList;
window.readSystemMessage = readSystemMessage;
window.closeSystemMessagesList = closeSystemMessagesList;
window.updateSystemMessagesUI = updateSystemMessagesUI;
window.startSystemMessagesTimer = startSystemMessagesTimer;
window.stopSystemMessagesTimer = stopSystemMessagesTimer;
window.resumeHotSearchEffects = resumeHotSearchEffects;
