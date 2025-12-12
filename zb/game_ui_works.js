// ==================== 作品管理与作品列表 ====================

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
        const statusBar = statusBadges.length > 0 ? `<div style="margin-bottom:8px;">${statusBadges.join('')}</div>` : '';
        
        const workItem = document.createElement('div');
        workItem.className = 'work-item';
        workItem.innerHTML = `
            ${statusBar}
            <div class="work-header">
                <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒私密</span>' : ''}</span>
                <span class="work-time">${formatTime(work.time)} ${work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : ''} ${isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">推广中</span>' : ''}</span>
            </div>
            <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
            <div class="work-stats">
                <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
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
            if (viewsEl) {
                const icon = work.type === 'post' ? '👁️' : '▶️';
                viewsEl.textContent = `${icon} ${work.views.toLocaleString()}`;
                animateNumberUpdate(viewsEl);
            }
            if (likesEl) { likesEl.textContent = work.likes.toLocaleString(); animateNumberUpdate(likesEl); }
            if (commentsEl) { commentsEl.textContent = work.comments.toLocaleString(); animateNumberUpdate(commentsEl); }
            if (sharesEl) { sharesEl.textContent = work.shares.toLocaleString(); animateNumberUpdate(sharesEl); }
        });
        updateDisplay();
    }, 3000);
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
    
    const comments = typeof generateComments === 'function' ? generateComments(work.comments, work.time) : [];
    
    const content = document.getElementById('workDetailPageContent');
    content.innerHTML = `
        <div style="margin-bottom:20px">
            ${statusIndicators.join('')}
            ${trafficStatus}
            ${work.isAd ? '<div style="background:#ff0050;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🎯 商单合作</div>' : ''}
            ${work.isPrivate ? '<div style="background:#999;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🔒 私密作品</div>' : ''}
            <div style="font-size:16px;margin-bottom:10px">${work.content}</div>
            <div style="font-size:12px;color:#999;margin-bottom:15px">${formatTime(work.time)}</div>
            <div style="display:flex;justify-content:space-around;padding:15px;background:#161823;border-radius:10px;margin-bottom:20px">
                <div style="text-align:center">
                    <div style="font-size:18px;font-weight:bold">${work.views.toLocaleString()}</div>
                    <div style="font-size:12px;color:#999">${work.type === 'post' ? '👁️ 查阅' : work.type === 'live' ? '📱 观看' : '▶️ 播放'}</div>
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
    
    showConfirm(`确定要删除这个${work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态'}吗？此操作不可恢复！`, function(confirmed) {
        if (confirmed) {
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
    });
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

// ==================== 全屏作品页（实时动态 + 分页） ====================
window.currentWorksPage = 1;
window.worksPerPage = 10;
window.currentWorksCategory = 'all';
window.worksUpdateInterval = null;

function showWorksFullscreen() {
    const content = document.getElementById('worksListTab');
    if (!content) return;
    
    window.currentWorksPage = 1;
    window.currentWorksCategory = 'all';
    
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
    
    const totalCountEl = document.getElementById('worksTotalCount');
    if (totalCountEl) {
        const totalWorks = gameState.worksList.length;
        totalCountEl.textContent = `共${totalWorks}个作品`;
    }
}

function renderWorksPage() {
    const filteredListEl = document.getElementById('filteredWorksList');
    const paginationEl = document.getElementById('worksPagination');
    if (!filteredListEl || !paginationEl) return;
    
    let filteredWorks = gameState.worksList;
    if (window.currentWorksCategory !== 'all') {
        filteredWorks = gameState.worksList.filter(work => work.type === window.currentWorksCategory);
    }
    
    const totalWorks = filteredWorks.length;
    const totalPages = Math.max(1, Math.ceil(totalWorks / window.worksPerPage));
    
    if (window.currentWorksPage > totalPages) {
        window.currentWorksPage = totalPages;
    }
    if (window.currentWorksPage < 1) {
        window.currentWorksPage = 1;
    }
    
    const startIndex = (window.currentWorksPage - 1) * window.worksPerPage;
    const endIndex = startIndex + window.worksPerPage;
    const pageWorks = filteredWorks.slice(startIndex, endIndex);
    
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
                    <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${work.comments.toLocaleString()}</span>
                    <span>🔄 ${work.shares.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
    
    filteredListEl.innerHTML = worksHtml.length === 0 ? 
        '<div style="text-align:center;color:#999;padding:20px;">暂无作品，快去创作吧！</div>' : worksHtml;
    
    renderWorksPagination(totalPages, totalWorks);
}

function renderWorksPagination(totalPages, totalWorks) {
    const paginationEl = document.getElementById('worksPagination');
    if (!paginationEl) return;
    
    const currentPage = window.currentWorksPage;
    let paginationHtml = '';
    
    const prevDisabled = currentPage === 1;
    paginationHtml += `<button class="page-btn ${prevDisabled ? 'disabled' : ''}" onclick="changeWorksPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''}>‹</button>`;
    
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
    
    const nextDisabled = currentPage === totalPages;
    paginationHtml += `<button class="page-btn ${nextDisabled ? 'disabled' : ''}" onclick="changeWorksPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''}>›</button>`;
    
    const startItem = totalWorks > 0 ? (currentPage - 1) * window.worksPerPage + 1 : 0;
    const endItem = Math.min(currentPage * window.worksPerPage, totalWorks);
    paginationHtml += `<span style="margin-left: 10px; font-size: 12px; color: #999;">${startItem}-${endItem} / ${totalWorks}</span>`;
    
    paginationEl.innerHTML = paginationHtml;
}

function changeWorksPage(page) {
    const filteredWorks = window.currentWorksCategory === 'all' 
        ? gameState.worksList 
        : gameState.worksList.filter(work => work.type === window.currentWorksCategory);
    
    const totalPages = Math.max(1, Math.ceil(filteredWorks.length / window.worksPerPage));
    
    if (page < 1 || page > totalPages) return;
    
    window.currentWorksPage = page;
    renderWorksPage();
}

function filterWorksByCategory(category) {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    window.currentWorksCategory = category;
    window.currentWorksPage = 1;
    
    renderWorksPage();
}

function startWorksRealtimeUpdate() {
    if (window.worksUpdateInterval) {
        clearInterval(window.worksUpdateInterval);
    }
    
    window.worksUpdateInterval = setInterval(() => {
        const worksPage = document.getElementById('worksListTab');
        if (worksPage && worksPage.offsetParent !== null) {
            const activeTab = document.querySelector('.nav-item.active');
            if (activeTab && activeTab.textContent.includes('作品')) {
                renderWorksPage();
            }
        }
    }, 1000);
}

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

// ==================== 消息全部已读 ====================
function markAllRead() {
    gameState.notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
    showNotification('操作成功', '所有消息已标记为已读');
}

// ==================== 全局函数绑定 ====================
window.updateWorksList = updateWorksList;
window.startWorkUpdates = startWorkUpdates;
window.showWorkDetail = showWorkDetail;
window.deleteWork = deleteWork;
window.togglePrivate = togglePrivate;
window.generateComments = generateComments;
window.showWorksFullscreen = showWorksFullscreen;
window.renderWorksPage = renderWorksPage;
window.renderWorksPagination = renderWorksPagination;
window.changeWorksPage = changeWorksPage;
window.filterWorksByCategory = filterWorksByCategory;
window.startWorksRealtimeUpdate = startWorksRealtimeUpdate;
window.showMessagesFullscreen = showMessagesFullscreen;
window.markAllRead = markAllRead;
window.currentDetailWork = currentDetailWork;
