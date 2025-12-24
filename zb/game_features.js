// ==================== 发布视频（改为全屏） ====================
function showCreateVideo() {
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法发布作品'); 
        return; 
    }
    
    const content = document.getElementById('createVideoPageContent');
    content.innerHTML = `
        <div class="input-group">
            <div class="input-label">视频标题</div>
            <input type="text" class="text-input" id="videoTitle" placeholder="给你的视频起个标题" maxlength="50">
        </div>
        <div class="input-group">
            <div class="input-label">视频内容</div>
            <textarea class="text-input" id="videoContent" rows="6" placeholder="描述你的视频内容" maxlength="200"></textarea>
        </div>
    `;
    
    document.getElementById('createVideoPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function createVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const content = document.getElementById('videoContent').value.trim();
    if (!title || !content) { 
        showAlert('请填写完整信息', '提示');
        return; 
    }
    if (typeof checkViolation === 'function' && checkViolation(title + content)) return;
    
    const views = Math.floor(Math.random() * 10000) + 1000;
    const likes = Math.floor(views * (Math.random() * 0.1 + 0.01));
    const comments = Math.floor(likes * (Math.random() * 0.3 + 0.1));
    const shares = Math.floor(likes * (Math.random() * 0.2 + 0.05));
    const work = { 
        id: Date.now(), 
        type: 'video', 
        title: title, 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: gameTimer,
        revenue: Math.floor(views / 1000), 
        isPrivate: false,
        isRecommended: false,
        recommendEndTime: null,
        recommendInterval: null,
        isControversial: false,
        controversyEndTime: null,
        controversyInterval: null
    };
    
    gameState.worksList.push(work);
    gameState.works++;
    gameState.views += views;
    gameState.likes += likes;
    gameState.money += work.revenue;
    const newFans = Math.floor(views / 1000 * (Math.random() * 2 + 0.5));
    gameState.fans += newFans;
    
    const interactionBoost = comments + likes + shares;
    gameState.totalInteractions += interactionBoost;
    gameState.activeFans += Math.floor(newFans * 0.6);
    
    resetInactivityDropState();
    
    closeFullscreenPage('createVideo');
    updateDisplay();
    showNotification('视频发布成功！', `获得${views.toLocaleString()}播放量，${newFans}新粉丝，${interactionBoost}次互动`);
}

// ==================== 发布动态（改为全屏） ====================
function showCreatePost() {
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法发布作品'); 
        return; 
    }
    
    const content = document.getElementById('createPostPageContent');
    content.innerHTML = `
        <div class="input-group">
            <div class="input-label">动态内容</div>
            <textarea class="text-input" id="postContent" rows="8" placeholder="分享你的想法..." maxlength="500"></textarea>
        </div>
    `;
    
    document.getElementById('createPostPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function createPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content) { 
        showAlert('请输入动态内容', '提示');
        return; 
    }
    if (typeof checkViolation === 'function' && checkViolation(content)) return;
    
    const views = Math.floor(Math.random() * 5000) + 500;
    const likes = Math.floor(views * (Math.random() * 0.15 + 0.02));
    const comments = Math.floor(likes * (Math.random() * 0.4 + 0.15));
    const shares = Math.floor(likes * (Math.random() * 0.3 + 0.1));
    const work = { 
        id: Date.now(), 
        type: 'post', 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: gameTimer,
        isPrivate: false,
        isHot: false,
        hotEndTime: null,
        hotInterval: null
    };
    
    gameState.worksList.push(work);
    gameState.works++;
    gameState.likes += likes;
    const newFans = Math.floor(views / 2000 * (Math.random() * 1.5 + 0.3));
    gameState.fans += newFans;
    
    const interactionBoost = comments + likes + shares;
    gameState.totalInteractions += interactionBoost;
    gameState.activeFans += Math.floor(newFans * 0.4);
    
    resetInactivityDropState();
    
    closeFullscreenPage('createPost');
    updateDisplay();
    showNotification('动态发布成功！', `获得${views.toLocaleString()}浏览，${newFans}新粉丝，${interactionBoost}次互动`);
}

// ==================== 直播控制 ====================
function startLive() {
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法直播'); 
        return; 
    }
    if (gameState.liveStatus) { 
        showNotification('提示', '你正在直播中'); 
        return; 
    }
    
    const content = document.getElementById('workDetailPageContent');
    content.innerHTML = `
        <div class="live-container">
            <div class="live-header">
                <div>
                    <div style="font-size:16px;font-weight:bold">${gameState.username}的直播间</div>
                    <div style="font-size:12px;color:#999">直播分类：娱乐</div>
                </div>
                <div class="live-viewers">👥 0</div>
            </div>
            <div class="live-content">
                <div class="live-avatar">${gameState.avatar}</div>
            </div>
            <div class="live-controls">
                <button class="live-btn live-btn-start" onclick="startLiveStream()">开始直播</button>
                <button class="live-btn live-btn-end" onclick="endLiveStream()">结束直播</button>
            </div>
        </div>
    `;
    
    gameState.liveStatus = true;
    updateDisplay();
    document.getElementById('workDetailTitle').textContent = '直播间';
    document.getElementById('workDetailPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function startLiveStream() {
    let liveData = { 
        viewers: Math.floor(Math.random() * 1000) + 100, 
        likes: 0, 
        comments: 0, 
        shares: 0, 
        revenue: 0, 
        duration: 0,
        startTime: Date.now(), // ✅ 记录真实时间用于成就判断
        startVirtualTime: gameTimer // ✅ 记录虚拟时间用于其他逻辑
    };
    
    // ✅ 记录直播历史
    if (!gameState.liveHistory) gameState.liveHistory = [];
    
    gameState.liveInterval = setInterval(() => {
        if (!gameState.liveStatus) { 
            clearInterval(gameState.liveInterval); 
            return; 
        }
        liveData.duration++;
        const viewerChange = Math.floor(Math.random() * 100) - 50;
        liveData.viewers = Math.max(50, liveData.viewers + viewerChange);
        if (Math.random() < 0.3) {
            const likeGain = Math.floor(Math.random() * 50) + 10;
            liveData.likes += likeGain;
        }
        if (Math.random() < 0.1) {
            const commentGain = Math.floor(Math.random() * 10) + 1;
            liveData.comments += commentGain;
        }
        if (Math.random() < 0.05) {
            const shareGain = Math.floor(Math.random() * 5) + 1;
            liveData.shares += shareGain;
        }
        if (Math.random() < 0.2) {
            const revenue = Math.floor(Math.random() * 100) + 10;
            liveData.revenue += revenue;
            gameState.money += revenue;
        }
        if (Math.random() < 0.1) {
            const newFans = Math.floor(Math.random() * 20) + 1;
            gameState.fans += newFans;
        }
        const viewersElement = document.querySelector('.live-viewers');
        if (viewersElement) viewersElement.textContent = `👥 ${liveData.viewers.toLocaleString()}`;
        gameState.currentLive = { 
            id: Date.now(), 
            type: 'live', 
            content: `${gameState.username}的直播间`, 
            views: liveData.viewers, 
            likes: liveData.likes, 
            comments: liveData.comments, 
            shares: liveData.shares, 
            time: gameTimer,
            liveData: liveData, 
            isPrivate: false 
        };
        if (Math.random() < 0.02) showNotification('直播事件', ['用户「直播达人」赠送了火箭礼物！', '用户「小可爱123」加入了直播间', '直播间登上了热门推荐！', '收到了大量弹幕互动！'][Math.floor(Math.random() * 4)]);
        updateDisplay();
    }, 2000);
    showNotification('直播开始', '祝你直播顺利！');
}

function endLiveStream() {
    gameState.liveStatus = false;
    if (gameState.liveInterval) {
        clearInterval(gameState.liveInterval);
        gameState.liveInterval = null;
    }
    if (gameState.currentLive && gameState.currentLive.liveData) {
        const liveData = gameState.currentLive.liveData;
        const totalViews = Math.floor(liveData.viewers * 10 + Math.random() * 10000);
        gameState.currentLive.views = totalViews;
        gameState.currentLive.likes = liveData.likes;
        gameState.currentLive.comments = liveData.comments;
        gameState.currentLive.shares = liveData.shares;
        gameState.currentLive.revenue = liveData.revenue;
        
        // ✅ 记录直播历史用于成就判断
        const endTime = Date.now();
        const liveRecord = {
            startTime: liveData.startTime,
            endTime: endTime,
            duration: liveData.duration,
            views: totalViews,
            peakViewers: Math.max(liveData.viewers, 100),
            // 计算虚拟时间的小时数
            startVirtualHour: Math.floor((liveData.startVirtualTime % VIRTUAL_DAY_MS) / VIRTUAL_HOUR_MS),
            endVirtualHour: Math.floor((gameTimer % VIRTUAL_DAY_MS) / VIRTUAL_HOUR_MS)
        };
        
        if (!gameState.liveHistory) gameState.liveHistory = [];
        gameState.liveHistory.push(liveRecord);
        
        gameState.worksList.push(gameState.currentLive);
        gameState.works++;
        gameState.views += totalViews;
        gameState.likes += liveData.likes;
        
        // ✅ 修复：累加互动数（不包括播放量）
        gameState.totalInteractions += liveData.comments + liveData.likes + liveData.shares;
        
        // ✅ 检查夜猫子成就（凌晨3点直播）
        if (gameState.liveHistory.some(live => live.startVirtualHour === 3)) {
            const nightOwlAchievement = achievements.find(a => a.id === 17);
            if (nightOwlAchievement && !nightOwlAchievement.unlocked) {
                nightOwlAchievement.unlocked = true;
                gameState.achievements.push(17);
                showAchievementPopup(nightOwlAchievement);
                showNotification('🏆 成就解锁', `夜猫子：凌晨3点还在直播`);
            }
        }
        
        // ✅ 检查早起鸟儿成就（早上6点直播）
        if (gameState.liveHistory.some(live => live.startVirtualHour === 6)) {
            const earlyBirdAchievement = achievements.find(a => a.id === 18);
            if (earlyBirdAchievement && !earlyBirdAchievement.unlocked) {
                earlyBirdAchievement.unlocked = true;
                gameState.achievements.push(18);
                showAchievementPopup(earlyBirdAchievement);
                showNotification('🏆 成就解锁', `早起鸟儿：早上6点开始直播`);
            }
        }
        
        // ✅ 检查直播新星成就
        if (totalViews >= 1000) {
            const liveStarAchievement = achievements.find(a => a.id === 8);
            if (liveStarAchievement && !liveStarAchievement.unlocked) {
                liveStarAchievement.unlocked = true;
                gameState.achievements.push(8);
                showAchievementPopup(liveStarAchievement);
                showNotification('🏆 成就解锁', `${liveStarAchievement.name}：${liveStarAchievement.desc}`);
            }
        }
        
        showNotification('直播结束', `本次直播获得${totalViews.toLocaleString()}观看，打赏收入${liveData.revenue}元`);
    }
    
    // ✅ 检查并触发一次成就检查
    if (typeof checkAchievements === 'function') {
        checkAchievements();
    }
    
    gameState.lastWorkTime = gameTimer;
    closeFullscreenPage('workDetail');
    updateDisplay();
}

function toggleLive() {
    if (!gameState.liveStatus) startLive(); 
    else endLiveStream();
}

// ==================== 流量购买（改为全屏） ====================
function showBuyTraffic() {
    const availableWorks = gameState.worksList.filter(w => w.type === 'video' || w.type === 'post');
    if (availableWorks.length === 0) { 
        showWarning('暂无作品可推广，请先发布作品'); 
        return; 
    }
    
    window.selectedWorkIds = [];
    window.selectedTrafficDays = 1;
    
    const worksHtml = availableWorks.map(work => {
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        const statusText = isTrafficActive ? '（推广中）' : '';
        
        return `
            <div class="work-item traffic-select-item" onclick="toggleTrafficSelection(${work.id})" data-work-id="${work.id}">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <div class="traffic-checkbox" id="checkbox-${work.id}" style="width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 5px; flex-shrink: 0; margin-top: 2px;"></div>
                    <div style="flex: 1;">
                        <div class="work-header">
                            <span class="work-type">${work.type === 'video' ? '🎬 视频' : '📝 动态'}</span>
                            <span class="work-time">${formatTime(work.time)}</span>
                        </div>
                        <div class="work-content" style="font-size: 14px;">${work.content.substring(0, 50)}${work.content.length > 50 ? '...' : ''} ${statusText}</div>
                        <div class="work-stats" style="font-size: 11px;">
                            <span>▶️ ${work.views.toLocaleString()}</span>
                            <span>❤️ ${work.likes.toLocaleString()}</span>
                            <span>💬 ${work.comments.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    const daysOptions = Array.from({length: 30}, (_, i) => {
        const day = i + 1;
        return `<div class="day-option ${day === 1 ? 'selected' : ''}" onclick="selectTrafficDays(this, ${day})">${day}天<br><small>${day * 1000}元</small></div>`;
    }).join('');
    
    const content = document.getElementById('buyTrafficPageContent');
    content.innerHTML = `
        <div style="margin-bottom: 15px;">
            <div class="input-label">选择推广天数</div>
            <div class="days-selector">${daysOptions}</div>
        </div>
        <div style="margin-bottom: 15px;">
            <div class="input-label">选择要推广的作品（可多选）</div>
            <div style="max-height: 40vh; overflow-y: auto; border-radius: 10px; background: #161823; padding: 10px;">
                ${worksHtml}
            </div>
            <div id="selectedCount" style="margin-top: 10px; font-size: 14px; color: #667eea;">已选择：0个作品</div>
        </div>
        <div style="font-size: 12px; color: #999; margin-bottom: 15px; text-align: center;">
            推广期间：播放量疯狂增长，每秒随机涨粉
        </div>
        <button class="btn" id="confirmTrafficBtn" onclick="confirmBuyTraffic()">批量购买并启动推广</button>
    `;
    
    updateTrafficTotalPrice();
    updateSelectedCount();
    
    document.getElementById('buyTrafficPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function toggleTrafficSelection(workId) {
    const index = window.selectedWorkIds.indexOf(workId);
    const checkbox = document.getElementById(`checkbox-${workId}`);
    const item = document.querySelector(`[data-work-id="${workId}"]`);
    
    if (index > -1) {
        window.selectedWorkIds.splice(index, 1);
        checkbox.style.background = '';
        item.style.border = '';
        item.style.background = '#161823';
    } else {
        window.selectedWorkIds.push(workId);
        checkbox.style.background = '#667eea';
        item.style.border = '2px solid #667eea';
        item.style.background = '#222';
    }
    
    updateTrafficTotalPrice();
    updateSelectedCount();
}

function updateTrafficTotalPrice() {
    const days = window.selectedTrafficDays || 1;
    const selectedCount = window.selectedWorkIds.length;
    const totalPrice = selectedCount * days * 1000;
    const priceEl = document.getElementById('trafficPriceDisplay');
    if (priceEl) priceEl.textContent = `${totalPrice.toLocaleString()}元`;
}

function updateSelectedCount() {
    const countEl = document.getElementById('selectedCount');
    if (countEl) countEl.textContent = `已选择：${window.selectedWorkIds.length}个作品`;
}

function selectTrafficDays(element, days) {
    document.querySelectorAll('.day-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    window.selectedTrafficDays = days;
    updateTrafficTotalPrice();
}

function confirmBuyTraffic() {
    if (!window.selectedWorkIds || window.selectedWorkIds.length === 0) { 
        showWarning('请先选择要推广的作品'); 
        return; 
    }
    
    const days = window.selectedTrafficDays || 1;
    const selectedCount = window.selectedWorkIds.length;
    const totalPrice = selectedCount * days * 1000;
    
    if (gameState.money < totalPrice) { 
        showWarning(`零钱不足！需要${totalPrice.toLocaleString()}元`); 
        return; 
    }
    
    const activeWorks = window.selectedWorkIds.filter(id => 
        gameState.trafficWorks[id] && gameState.trafficWorks[id].isActive
    );
    
    if (activeWorks.length > 0) {
        showWarning(`有${activeWorks.length}个作品已在推广中！`);
        return;
    }
    
    gameState.money -= totalPrice;
    window.selectedWorkIds.forEach(workId => {
        startNewTraffic(workId, days);
    });
    
    closeFullscreenPage('buyTraffic');
    showNotification('购买成功', `已为${selectedCount}个作品购买${days}天流量推送！`);
    updateDisplay();
}

function startNewTraffic(workId, days) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work) return;
    gameState.trafficWorks[workId] = {
        workId: workId,
        days: days,
        startTime: gameTimer,
        isActive: true,
        remainingTime: days
    };
    if (typeof startTrafficProcess === 'function') startTrafficProcess(workId);
    updateDisplay();
}

// ==================== 申诉功能 ====================
function showAppeal() {
    if (!gameState.isBanned || !gameState.appealAvailable) {
        showWarning('当前无法申诉');
        return;
    }
    
    const timePassed = gameTimer - gameState.banStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    const daysLeft = Math.ceil(gameState.banDaysCount - daysPassed);
    
    if (daysLeft <= 0) {
        showWarning('账号已解封，无需申诉');
        return;
    }
    
    let successRate = 0;
    if (daysLeft <= 7) successRate = 30;
    else if (daysLeft <= 15) successRate = 10;
    else {
        showWarning('封禁超过15天，无法申诉');
        return;
    }
    
    showConfirm(`是否进行申诉？
当前剩余封禁：${daysLeft}天
申诉成功率：${successRate}%
注意：申诉失败将失去再次申诉的机会`, function(confirmed) {
        if (confirmed) {
            const success = Math.random() * 100 < successRate;
            if (success) {
                gameState.isBanned = false;
                gameState.warnings = Math.max(0, gameState.warnings - 5);
                gameState.appealAvailable = true;
                
                const achievement = achievements.find(a => a.id === 14);
                if (achievement && !achievement.unlocked) {
                    achievement.unlocked = true;
                    gameState.achievements.push(14);
                    showNotification('🏆 成就解锁', `${achievement.name}：${achievement.desc}`);
                }
                
                if (gameState.banInterval) {
                    clearInterval(gameState.banInterval);
                    gameState.banInterval = null;
                }
                if (gameState.banDropInterval) {
                    clearInterval(gameState.banDropInterval);
                    gameState.banDropInterval = null;
                }
                
                showNotification('✅ 申诉成功', '账号已解封，警告次数减少5次');
            } else {
                gameState.appealAvailable = false;
                showWarning('申诉失败，无法再次申诉');
            }
            
            const appealBtn = document.getElementById('appealBtn');
            if (appealBtn) appealBtn.style.display = 'none';
            
            saveGame();
            updateDisplay();
        }
    });
}

// ==================== 检查违规 ====================
function checkViolation(content) {
    const hasViolation = violationKeywords.some(keyword => content.includes(keyword));
    if (hasViolation) {
        if (gameState.warnings < 20) gameState.warnings++;
        showWarning(`内容包含违规信息，警告${gameState.warnings}/20次`);
        if (!gameState.isBanned && gameState.warnings >= 20) banAccount('多次违反社区规定');
        return true;
    }
    return false;
}

// ==================== 流量推广核心 ====================
function startTrafficProcess(workId) {
    workId = Number(workId);
    const trafficData = gameState.trafficWorks[workId];
    if (!trafficData || !trafficData.isActive) return;
    if (trafficData.interval) {
        clearInterval(trafficData.interval);
    }
    trafficData.interval = setInterval(() => {
        const work = gameState.worksList.find(w => w.id === workId);
        if (!work) return;
        
        const timePassed = gameTimer - trafficData.startTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        const timeLeft = Math.max(0, trafficData.days - daysPassed);
        
        if (timeLeft <= 0) {
            if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
            return;
        }
        
        const viewsBoost = Math.floor(Math.random() * 4000) + 1000;
        const fanBoost = Math.floor(Math.random() * 40) + 10;
        const commentBoost = Math.floor(Math.random() * 50) + 10;
        const shareBoost = Math.floor(Math.random() * 30) + 5;
        
        work.views += viewsBoost;
        if (work.type === 'video' || work.type === 'live') {
            gameState.views += viewsBoost;
        }
        gameState.fans += fanBoost;
        work.comments += commentBoost;
        
        // ✅ 修复：只统计主动互动行为
        gameState.totalInteractions += commentBoost + shareBoost;
        
        const oldRevenue = work.revenue || 0;
        const newRevenue = Math.floor(work.views / 1000);
        const revenueBoost = newRevenue - oldRevenue;
        if (revenueBoost > 0) {
            work.revenue = newRevenue;
            gameState.money += revenueBoost;
        }
        const viewsEl = document.getElementById(`work-views-${work.id}`);
        if (viewsEl) {
            viewsEl.textContent = work.views.toLocaleString();
            animateNumberUpdate(viewsEl);
        }
        updateDisplay();
    }, 1000);
    updateDisplay();
}

function stopTrafficForWork(workId) {
    workId = Number(workId);
    const trafficData = gameState.trafficWorks[workId];
    if (!trafficData) return;
    if (trafficData.interval) {
        clearInterval(trafficData.interval);
        trafficData.interval = null;
    }
    trafficData.isActive = false;
    delete gameState.trafficWorks[workId];
    showNotification('流量推广结束', '本次推广已结束，效果非常显著！');
    updateDisplay();
}

// ==================== 图表显示（修复版） ====================
function showCharts() {
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('chartsPage').classList.add('active');
    
    if (!gameState.chartData.currentIndex && gameState.chartData.fans.length > 0) {
        const virtualDays = Math.floor(getVirtualDaysPassed());
        gameState.chartData.currentIndex = (virtualDays - 1) % 60;
        gameState.chartData.currentDay = virtualDays - 1;
    }
    
    const content = document.getElementById('chartsPageContent');
    content.innerHTML = `
        <div class="chart-container">
            <div class="chart-item">
                <div class="chart-header">
                    <div class="chart-title">粉丝增长趋势</div>
                    <div class="chart-value" id="fansStatValue">${gameState.fans.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="fansChart"></canvas>
            </div>
            <div class="chart-item">
                <div class="chart-header">
                    <div class="chart-title">点赞增长趋势</div>
                    <div class="chart-value" id="likesStatValue">${gameState.likes.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="likesChart"></canvas>
            </div>
            <div class="chart-item">
                <div class="chart-header">
                    <div class="chart-title">播放增长趋势</div>
                    <div class="chart-value" id="viewsStatValue">${gameState.views.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="viewsChart"></canvas>
            </div>
            <div class="chart-item">
                <div class="chart-header">
                    <div class="chart-title">粉丝互动趋势</div>
                    <div class="chart-value" id="interactionsStatValue">${gameState.totalInteractions.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="interactionsChart"></canvas>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        drawChart('fansChart', gameState.chartData.fans, '#667eea', '粉丝数');
        drawChart('likesChart', gameState.chartData.likes, '#ff0050', '点赞数');
        drawChart('viewsChart', gameState.chartData.views, '#00f2ea', '播放量');
        drawChart('interactionsChart', gameState.chartData.interactions, '#FFD700', '互动次数');
    }, 100);
    
    if (window.chartRefreshInterval) {
        clearInterval(window.chartRefreshInterval);
    }
    
    window.chartRefreshInterval = setInterval(() => {
        const chartsPage = document.getElementById('chartsPage');
        if (chartsPage && chartsPage.classList.contains('active')) {
            updateChartsRealtime();
            updateChartStatsRealtime();
        }
    }, 5000);
}

function stopChartsRefresh() {
    if (window.chartRefreshInterval) {
        clearInterval(window.chartRefreshInterval);
        window.chartRefreshInterval = null;
    }
}

// ==================== 不更新掉粉机制控制函数 ====================
function resetInactivityDropState() {
    gameState.lastWorkTime = gameTimer;
    if (gameState.isDroppingFansFromInactivity) {
        gameState.isDroppingFansFromInactivity = false;
        if (gameState.inactivityDropInterval) {
            clearInterval(gameState.inactivityDropInterval);
            gameState.inactivityDropInterval = null;
        }
    }
    gameState.inactivityWarningShown = false;
}

// ==================== 全局函数绑定 ====================
window.showCreateVideo = showCreateVideo;
window.showCreatePost = showCreatePost;
window.startLive = startLive;
window.toggleLive = toggleLive;
window.endLiveStream = endLiveStream;
window.startLiveStream = startLiveStream;
window.showBuyTraffic = showBuyTraffic;
window.toggleTrafficSelection = toggleTrafficSelection;
window.selectTrafficDays = selectTrafficDays;
window.confirmBuyTraffic = confirmBuyTraffic;
window.updateTrafficTotalPrice = updateTrafficTotalPrice;
window.updateSelectedCount = updateSelectedCount;
window.startNewTraffic = startNewTraffic;
window.startTrafficProcess = startTrafficProcess;
window.stopTrafficForWork = stopTrafficForWork;
window.showAppeal = showAppeal;
window.checkViolation = checkViolation;
window.showCharts = showCharts;
window.stopChartsRefresh = stopChartsRefresh;
window.resetInactivityDropState = resetInactivityDropState;

// ==================== 已删除的旧版 showWorkDetail 函数和其他重复代码 ====================
// 这些代码已被移除，因为它们在 game_ui_works_core.js 中有更新更完整的实现
