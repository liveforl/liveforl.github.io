// ==================== 作品管理与作品列表 ====================

// 全局变量
window.worksUpdateInterval = null;
window.currentWorksPage = 1;
window.worksPerPage = 10;
window.currentWorksCategory = 'all';
window.currentWorksSort = 'latest'; // 默认按最新发布排序
window.currentDetailWork = null;
window.commentsPerPage = 10;

// 作品排序函数
function getSortedWorks(works, sortType) {
    const sorted = [...works];
    switch(sortType) {
        case 'latest':
            return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
        case 'oldest':
            return sorted.sort((a, b) => (a.time || 0) - (b.time || 0));
        case 'mostViews':
            return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        case 'mostLikes':
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        case 'mostComments':
            return sorted.sort((a, b) => (b.comments || 0) - (a.comments || 0));
        case 'mostShares':
            return sorted.sort((a, b) => (b.shares || 0) - (a.shares || 0));
        default:
            return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
    }
}

// 切换作品排序
function changeWorksSort(sortType) {
    window.currentWorksSort = sortType;
    
    // 更新排序按钮状态
    const sortSelect = document.getElementById('worksSortSelect');
    if (sortSelect) {
        sortSelect.value = sortType;
    }
    
    // 重置到第一页
    window.currentWorksPage = 1;
    
    // 重新渲染作品列表
    renderWorksPage();
    
    // 显示通知
    const sortNames = {
        'latest': '最新发布',
        'oldest': '最早发布',
        'mostViews': '最多播放',
        'mostLikes': '最多点赞',
        'mostComments': '最多评论',
        'mostShares': '最多转发'
    };
    showNotification('排序已切换', `当前按${sortNames[sortType] || '最新发布'}显示`);
}

// 作品自动更新
function startWorkUpdates() {
    setInterval(() => {
        if (gameState.worksList.length === 0) return;
        gameState.worksList.forEach(work => {
            if (work.isPrivate) return;
            const viewsGrowth = Math.floor(Math.random() * 50);
            const likesGrowth = Math.floor(Math.random() * 20);
            const commentsGrowth = Math.floor(Math.random() * 10);
            const sharesGrowth = Math.floor(Math.random() * 5);
            
            // 消息生成逻辑（修复版：支持点赞、评论和转发消息）
            if (likesGrowth > 0 && Math.random() < 0.05) {
                gameState.messages.push({
                    id: Date.now() + Math.random(),
                    type: 'like',
                    user: generateRandomUsername(),
                    workId: work.id,
                    workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
                    time: gameTimer,
                    read: false
                });
            }
            
            // ✅ 评论消息
            if (commentsGrowth > 0 && Math.random() < 0.05) {
                gameState.messages.push({
                    id: Date.now() + Math.random(),
                    type: 'comment',
                    user: generateRandomUsername(),
                    workId: work.id,
                    workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
                    time: gameTimer,
                    read: false
                });
            }
            
            // ✅ 转发消息
            if (sharesGrowth > 0 && Math.random() < 0.03) {
                gameState.messages.push({
                    id: Date.now() + Math.random(),
                    type: 'share',
                    user: generateRandomUsername(),
                    workId: work.id,
                    workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
                    time: gameTimer,
                    read: false
                });
            }
            
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
            
            // Update view elements
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
        
        if (gameState.messages.length > 200) {
            gameState.messages = gameState.messages.slice(-150);
        }
        
        updateDisplay();
    }, 3000);
}

// 作品详情显示
function showWorkDetail(work) {
    currentDetailWork = work;
    window.currentCommentPage = 1;
    
    // 确保评论列表已生成
    if (!work.commentsList) {
        work.commentsList = window.generateComments(work, work.comments, work.time);
        saveGame();
    } else if (work.commentsList.length < work.comments) {
        const existingCount = work.commentsList.length;
        const newComments = window.generateComments(work, work.comments - existingCount, work.time);
        work.commentsList = work.commentsList.concat(newComments);
        saveGame();
    }
    
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
    
    const sortControls = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: bold">评论区</div>
            <div style="display: flex; gap: 10px; font-size: 12px;">
                <select id="commentSortSelect" onchange="window.changeCommentSort('${work.id}', this.value)" style="background: #222; border: 1px solid #333; color: #fff; border-radius: 4px; padding: 4px 8px;">
                    <option value="hottest" ${window.currentCommentSort === 'hottest' ? 'selected' : ''}>🔥 最火的</option>
                    <option value="asc" ${window.currentCommentSort === 'asc' ? 'selected' : ''}>⬆️ 正序</option>
                    <option value="desc" ${window.currentCommentSort === 'desc' ? 'selected' : ''}>⬇️ 倒序</option>
                </select>
            </div>
        </div>
    `;
    
    const comments = work.commentsList || [];
    const totalPages = Math.max(1, Math.ceil(comments.length / window.commentsPerPage));
    const commentsHtml = window.renderPaginatedComments(work, comments);
    const paginationHtml = window.renderCommentsPagination(totalPages, comments.length);
    
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
            ${sortControls}
            <div style="font-size:12px;color:#999;margin-bottom:10px;text-align:right;">
                ${comments.length > window.commentsPerPage ? `显示第${(window.currentCommentPage-1)*window.commentsPerPage+1}-${Math.min(window.currentCommentPage*window.commentsPerPage, comments.length)}条，共${comments.length}条` : `共${comments.length}条`}
            </div>
            <div id="commentsList">${commentsHtml}</div>
            ${paginationHtml}
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn" onclick="togglePrivate(${work.id})" style="${work.isPrivate ? '#667eea' : '#333'}; flex: 1;">
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

// 删除作品
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

// 切换私密状态
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

// 全屏作品页
function showWorksFullscreen() {
    const content = document.getElementById('worksListTab');
    if (!content) return;
    
    window.currentWorksPage = 1;
    window.currentWorksCategory = 'all';
    window.currentWorksSort = 'latest'; // 重置为默认排序
    
    const categoryTabs = `
        <div style="display: flex; padding: 10px; gap: 10px; background: #161823; border-radius: 10px; margin: 10px;">
            <div class="category-tab active" data-category="all" onclick="filterWorksByCategory('all')">全部</div>
            <div class="category-tab" data-category="video" onclick="filterWorksByCategory('video')">视频</div>
            <div class="category-tab" data-category="post" onclick="filterWorksByCategory('post')">动态</div>
            <div class="category-tab" data-category="live" onclick="filterWorksByCategory('live')">直播</div>
        </div>
        <div style="display: flex; padding: 0 10px; margin-bottom: 15px;">
            <select id="worksSortSelect" onchange="changeWorksSort(this.value)" style="flex: 1; background: #222; border: 1px solid #333; color: #fff; border-radius: 8px; padding: 10px; font-size: 14px;">
                <option value="latest">📅 最新发布</option>
                <option value="oldest">📅 最早发布</option>
                <option value="mostViews">▶️ 最多播放</option>
                <option value="mostLikes">❤️ 最多点赞</option>
                <option value="mostComments">💬 最多评论</option>
                <option value="mostShares">🔄 最多转发</option>
            </select>
        </div>
        <div id="filteredWorksList" style="padding: 0 10px;"></div>
        <div id="worksPagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; padding: 15px 10px; background: #161823; margin: 10px; border-radius: 10px; border: 1px solid #333; flex-wrap: wrap; max-width: 100%;"></div>
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
    
    // 应用排序
    filteredWorks = getSortedWorks(filteredWorks, window.currentWorksSort);
    
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
        const statusBar = statusBadges.length > 0 ? `<div style="margin-bottom:8px;">${statusBadges.join('')}</div>` : '';
        
        return `
            <div class="work-item" onclick="showWorkDetail(${JSON.stringify(work).replace(/"/g, '&quot;')})">
                ${statusBar}
                <div class="work-header">
                    <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒私密</span>' : ''}</span>
                    <span class="work-time">${formatTime(work.time)} ${work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : ''} ${isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">推广中</span>' : ''}</span>
                </div>
                <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
                <div class="work-stats">
                    <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${(work.comments || 0).toLocaleString()}</span>
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
    
    // 清理之前的分页内容
    paginationEl.innerHTML = '';
    
    // 创建分页容器（启用flex-wrap）
    paginationEl.style.display = 'flex';
    paginationEl.style.justifyContent = 'center';
    paginationEl.style.alignItems = 'center';
    paginationEl.style.flexWrap = 'wrap';
    paginationEl.style.gap = '5px';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = () => changeWorksPage(currentPage - 1);
    if (currentPage === 1) prevBtn.disabled = true;
    paginationEl.appendChild(prevBtn);
    
    // 计算要显示的页码范围
    const maxVisibleButtons = 5; // 最大可见页码按钮数
    let startPage, endPage;
    
    if (totalPages <= maxVisibleButtons) {
        // 如果总页数小于等于最大可见按钮数，显示所有页码
        startPage = 1;
        endPage = totalPages;
    } else {
        // 计算起始和结束页码
        const halfVisible = Math.floor(maxVisibleButtons / 2);
        startPage = Math.max(1, currentPage - halfVisible);
        endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
        
        // 调整起始页码，确保显示的页码数量正确
        if (endPage - startPage + 1 < maxVisibleButtons) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }
    }
    
    // 显示第一页
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-btn';
        firstBtn.innerHTML = '1';
        firstBtn.onclick = () => changeWorksPage(1);
        paginationEl.appendChild(firstBtn);
        
        // 如果第一页和起始页之间有间隔，显示省略号
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.style.color = '#666';
            dots.style.padding = '0 5px';
            dots.innerHTML = '...';
            paginationEl.appendChild(dots);
        }
    }
    
    // 显示中间的页码
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerHTML = i;
        pageBtn.onclick = () => changeWorksPage(i);
        paginationEl.appendChild(pageBtn);
    }
    
    // 显示最后一页
    if (endPage < totalPages) {
        // 如果结束页和最后一页之间有间隔，显示省略号
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.style.color = '#666';
            dots.style.padding = '0 5px';
            dots.innerHTML = '...';
            paginationEl.appendChild(dots);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-btn';
        lastBtn.innerHTML = totalPages;
        lastBtn.onclick = () => changeWorksPage(totalPages);
        paginationEl.appendChild(lastBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '›';
    nextBtn.onclick = () => changeWorksPage(currentPage + 1);
    if (currentPage === totalPages) nextBtn.disabled = true;
    paginationEl.appendChild(nextBtn);
    
    // 页码信息显示
    const startItem = totalWorks > 0 ? (currentPage - 1) * window.worksPerPage + 1 : 0;
    const endItem = Math.min(currentPage * window.worksPerPage, totalWorks);
    const infoSpan = document.createElement('span');
    infoSpan.style.marginLeft = '10px';
    infoSpan.style.fontSize = '12px';
    infoSpan.style.color = '#999';
    infoSpan.style.whiteSpace = 'nowrap';
    infoSpan.innerHTML = `${startItem}-${endItem} / ${totalWorks}`;
    paginationEl.appendChild(infoSpan);
}

function changeWorksPage(page) {
    const filteredWorks = window.currentWorksCategory === 'all' 
        ? gameState.worksList 
        : gameState.worksList.filter(work => work.type === window.currentWorksCategory);
    
    // 应用排序
    const sortedWorks = getSortedWorks(filteredWorks, window.currentWorksSort);
    
    const totalPages = Math.max(1, Math.ceil(sortedWorks.length / window.worksPerPage));
    
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

// 作品列表更新
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
                <span>💬 ${(work.comments || 0).toLocaleString()}</span>
                <span>🔄 ${work.shares.toLocaleString()}</span>
            </div>
        `;
        workItem.onclick = () => showWorkDetail(work);
        worksList.appendChild(workItem);
    });
    if (recentWorks.length === 0) worksList.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">还没有作品，快去创作吧！</div>';
}

// 用户主页显示
function showUserProfile(username, avatar) {
    const userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const joinDays = Math.floor(Math.random() * 365) + 1;
    const fanCount = Math.floor(Math.random() * 50000) + 100;
    const workCount = Math.floor(Math.random() * 500) + 10;
    const likeCount = Math.floor(Math.random() * 100000) + 1000;
    const following = Math.floor(Math.random() * 500) + 50;
    const level = Math.floor(Math.random() * 50) + 1;
    const vipLevel = Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 1 : 0;
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">用户主页</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold; margin: 0 auto 15px;">
                ${avatar}
            </div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
                ${username}
                ${vipLevel > 0 ? `<span style="background: linear-gradient(135deg, #FFD700 0%, #ff6b00 100%); color: #000; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 8px;">VIP${vipLevel}</span>` : ''}
            </div>
            <div style="font-size: 12px; color: #999; margin-bottom: 20px;">${userId}</div>
            
            <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(fanCount)}</div>
                    <div style="font-size: 12px; color: #999;">粉丝</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(following)}</div>
                    <div style="font-size: 12px; color: #999;">关注</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(workCount)}</div>
                    <div style="font-size: 12px; color: #999;">作品</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(likeCount)}</div>
                    <div style="font-size: 12px; color: #999;">获赞</div>
                </div>
            </div>
            
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #999;">等级</span>
                    <span style="font-weight: bold;">Lv.${level}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #999;">加入平台</span>
                    <span style="font-weight: bold;">${joinDays}天</span>
                </div>
            </div>
            
            <div style="background: #161823; border-radius: 10px; padding: 15px;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">简介</div>
                <div style="font-size: 12px; color: #999; line-height: 1.5;">
                    ${getRandomUserBio()}
                </div>
            </div>
            
            <button class="btn" onclick="closeModal()" style="margin-top: 20px;">关闭</button>
        </div>
    `;
    
    showModal(modalContent);
}

function getRandomUserBio() {
    const bios = [
        '热爱生活，喜欢分享',
        '专业主播，认真创作',
        '记录生活中的美好瞬间',
        '努力学习，不断进步',
        '做一个有趣的人',
        '分享快乐，传递正能量',
        '专注内容创作',
        '感谢每一个支持我的人',
        '用心做好每一个作品',
        '梦想成为一名优秀的主播',
        '在平凡的日子里闪闪发光',
        '创作源于生活',
        '记录成长的点点滴滴',
        '感谢您的关注和支持',
        '用心创作，用爱分享'
    ];
    return bios[Math.floor(Math.random() * bios.length)];
}

// 生成随机用户名
function generateRandomUsername() {
    const users = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'];
    const randomNum = Math.floor(Math.random() * 9999);
    return users[Math.floor(Math.random() * users.length)] + randomNum;
}

// 生成稳定的评论ID
function generateStableCommentId(workId, index) {
    return `comment_${workId}_${index}`;
}

// 绑定全局函数
window.updateWorksList = updateWorksList;
window.startWorkUpdates = startWorkUpdates;
window.showWorkDetail = showWorkDetail;
window.deleteWork = deleteWork;
window.togglePrivate = togglePrivate;
window.showWorksFullscreen = showWorksFullscreen;
window.renderWorksPage = renderWorksPage;
window.renderWorksPagination = renderWorksPagination;
window.changeWorksPage = changeWorksPage;
window.filterWorksByCategory = filterWorksByCategory;
window.startWorksRealtimeUpdate = startWorksRealtimeUpdate;
window.showUserProfile = showUserProfile;
window.getRandomUserBio = getRandomUserBio;
window.generateRandomUsername = generateRandomUsername;
window.generateStableCommentId = generateStableCommentId;
window.currentDetailWork = currentDetailWork;
window.changeWorksSort = changeWorksSort;
window.getSortedWorks = getSortedWorks;
window.currentWorksSort = window.currentWorksSort || 'latest';
