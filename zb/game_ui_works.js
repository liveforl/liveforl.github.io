// ==================== 作品管理与作品列表 ====================

// 全局变量
window.worksUpdateInterval = null;
window.currentCommentPage = 1;
window.commentsPerPage = 10;
window.currentWorksPage = 1;
window.worksPerPage = 10;
window.currentWorksCategory = 'all';
window.currentCommentSort = 'hottest'; // 新增：当前评论排序方式

// 当前消息筛选类型
window.currentMessageFilter = 'all';

// 生成随机用户名
function generateRandomUsername() {
    const users = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'];
    const randomNum = Math.floor(Math.random() * 9999);
    return users[Math.floor(Math.random() * users.length)] + randomNum;
}

// ==================== 生成稳定的评论ID（修复点赞状态问题） ====================
function generateStableCommentId(workId, index) {
    return `comment_${workId}_${index}`;
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
            
            // 记录点赞消息
            if (likesGrowth > 0) {
                for (let i = 0; i < likesGrowth; i++) {
                    if (Math.random() < 0.1) { // 10%概率生成消息
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
                }
            }
            
            // 记录评论消息
            if (commentsGrowth > 0) {
                for (let i = 0; i < commentsGrowth; i++) {
                    if (Math.random() < 0.05) { // 5%概率生成消息
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
                }
            }
            
            // 记录转发消息
            if (sharesGrowth > 0) {
                for (let i = 0; i < sharesGrowth; i++) {
                    if (Math.random() < 0.08) { // 8%概率生成消息
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
                }
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
        
        // 限制消息数量，避免无限增长
        if (gameState.messages.length > 200) {
            gameState.messages = gameState.messages.slice(-150);
        }
        
        updateDisplay();
    }, 3000);
}

// ==================== ✅ 获取排序后的评论 ====================
function getSortedComments(comments, sortType) {
    const sorted = [...comments];
    switch(sortType) {
        case 'hottest':
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        case 'asc':
            return sorted.sort((a, b) => (a.time || 0) - (b.time || 0));
        case 'desc':
            return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
        default:
            return sorted;
    }
}

// ==================== 作品详情（修复：评论数据持久化） ====================
let currentDetailWork = null;

function showWorkDetail(work) {
    currentDetailWork = work;
    window.currentCommentPage = 1; // 重置评论页码
    
    // ✅ 关键修复：确保评论列表只生成一次并持久化
    // 原逻辑：只要数量不匹配就重新生成，导致ID变化
    // 新逻辑：仅在首次进入时生成
    if (!work.commentsList) {
        // 首次生成评论列表
        work.commentsList = generateComments(work, work.comments, work.time);
        // ✅ 保存到本地存储，确保持久化
        saveGame();
    } else if (work.commentsList.length < work.comments) {
        // 如果有新增评论（通过其他机制），补充生成
        const existingCount = work.commentsList.length;
        const newComments = generateComments(work, work.comments - existingCount, work.time);
        // 为新评论生成稳定ID（基于已有数量）
        newComments.forEach((comment, idx) => {
            comment.id = generateStableCommentId(work.id, existingCount + idx);
        });
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
    
    // 添加排序控件
    const sortControls = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: bold">评论区</div>
            <div style="display: flex; gap: 10px; font-size: 12px;">
                <select id="commentSortSelect" onchange="changeCommentSort('${work.id}', this.value)" style="background: #222; border: 1px solid #333; color: #fff; border-radius: 4px; padding: 4px 8px;">
                    <option value="hottest" ${window.currentCommentSort === 'hottest' ? 'selected' : ''}>🔥 最火的</option>
                    <option value="asc" ${window.currentCommentSort === 'asc' ? 'selected' : ''}>⬆️ 正序</option>
                    <option value="desc" ${window.currentCommentSort === 'desc' ? 'selected' : ''}>⬇️ 倒序</option>
                </select>
            </div>
        </div>
    `;
    
    const comments = work.commentsList || [];
    const totalPages = Math.max(1, Math.ceil(comments.length / window.commentsPerPage));
    
    // 渲染评论区域（带分页）
    const commentsHtml = renderPaginatedComments(work, comments);
    const paginationHtml = renderCommentsPagination(totalPages, comments.length);
    
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
            
            <!-- 评论区标题和排序控件 -->
            ${sortControls}
            
            <!-- 评论统计信息 -->
            <div style="font-size:12px;color:#999;margin-bottom:10px;text-align:right;">
                ${comments.length > window.commentsPerPage ? `显示第${(window.currentCommentPage-1)*window.commentsPerPage+1}-${Math.min(window.currentCommentPage*window.commentsPerPage, comments.length)}条，共${comments.length}条` : `共${comments.length}条`}
            </div>
            
            <!-- 评论列表 -->
            <div id="commentsList">${commentsHtml}</div>
            
            <!-- 分页控件 -->
            ${paginationHtml}
            
            <!-- 操作按钮 -->
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

// ==================== ✅ 切换评论排序方式 ====================
function changeCommentSort(workId, sortType) {
    window.currentCommentSort = sortType;
    
    // 重新渲染评论区域
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    const comments = work.commentsList;
    const totalPages = Math.max(1, Math.ceil(comments.length / window.commentsPerPage));
    window.currentCommentPage = 1; // 切换排序时重置到第一页
    
    const commentsHtml = renderPaginatedComments(work, comments);
    const paginationHtml = renderCommentsPagination(totalPages, comments.length);
    
    const commentsListEl = document.getElementById('commentsList');
    const paginationEl = document.querySelector('#commentsList + div[style*="flex-wrap"]');
    
    if (commentsListEl) {
        commentsListEl.innerHTML = commentsHtml;
    }
    
    if (paginationEl) {
        paginationEl.outerHTML = paginationHtml;
    }
    
    showNotification('排序已切换', `当前按${sortType === 'hottest' ? '最火的' : sortType === 'asc' ? '正序' : '倒序'}显示`);
}

// ==================== ✅ 渲染分页评论（修复：使用稳定ID） ====================
function renderPaginatedComments(work, comments) {
    // 根据当前排序方式排序
    const sortedComments = getSortedComments(comments, window.currentCommentSort || 'hottest');
    
    const totalPages = Math.max(1, Math.ceil(sortedComments.length / window.commentsPerPage));
    const startIndex = (window.currentCommentPage - 1) * window.commentsPerPage;
    const endIndex = startIndex + window.commentsPerPage;
    const pageComments = sortedComments.slice(startIndex, endIndex);
    
    return pageComments.map((comment, index) => {
        // ✅ 修复：使用评论的稳定ID作为键
        const commentKey = comment.id;
        if (!commentKey) {
            console.error('评论缺少ID:', comment);
            return '';
        }
        
        const hasLiked = gameState.commentLikes && gameState.commentLikes[commentKey];
        const replyCount = comment.replyCount || 0;
        
        return `
            <div class="comment-item" style="${comment.isNegative ? 'border-left: 3px solid #ff0050;' : ''}" data-comment-id="${commentKey}">
                <div class="comment-header">
                    <div class="comment-user-avatar">${comment.avatar}</div>
                    <span class="comment-user" onclick="showUserProfile('${comment.user}', '${comment.avatar}')">${comment.user}</span>
                    <span class="comment-time">${formatTime(comment.time)}</span>
                </div>
                <div class="comment-content" style="${comment.isNegative ? 'color: #ff6b00; font-weight: bold;' : ''}">${comment.content}</div>
                <div class="comment-actions">
                    <span class="comment-action ${hasLiked ? 'liked' : ''}" 
                          onclick="likeComment('${work.id}', '${startIndex + index}')">
                        ${hasLiked ? '❤️' : '🤍'} <span>${comment.likes}</span>
                    </span>
                    <span class="comment-action" onclick="showCommentDetail('${work.id}', '${startIndex + index}')">
                        回复 ${replyCount > 0 ? `(${replyCount})` : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== ✅ 渲染评论分页控件 ====================
function renderCommentsPagination(totalPages, totalComments) {
    if (totalPages <= 1) return ''; // 只有一页时不显示分页
    
    let paginationHtml = '<div style="display: flex; justify-content: center; align-items: center; gap: 5px; margin: 20px 0; flex-wrap: wrap;">';
    
    // 上一页按钮
    const prevDisabled = window.currentCommentPage === 1;
    paginationHtml += `<button class="page-btn ${prevDisabled ? 'disabled' : ''}" onclick="changeCommentPage(${window.currentCommentPage - 1})" ${prevDisabled ? 'disabled' : ''}>‹</button>`;
    
    // 页码按钮（最多显示7个）
    const maxButtons = 7;
    let startPage = Math.max(1, window.currentCommentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // 第一页和省略号
    if (startPage > 1) {
        paginationHtml += `<button class="page-btn" onclick="changeCommentPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
    }
    
    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<button class="page-btn ${i === window.currentCommentPage ? 'active' : ''}" onclick="changeCommentPage(${i})">${i}</button>`;
    }
    
    // 省略号和最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
        paginationHtml += `<button class="page-btn" onclick="changeCommentPage(${totalPages})">${totalPages}</button>`;
    }
    
    // 下一页按钮
    const nextDisabled = window.currentCommentPage === totalPages;
    paginationHtml += `<button class="page-btn ${nextDisabled ? 'disabled' : ''}" onclick="changeCommentPage(${window.currentCommentPage + 1})" ${nextDisabled ? 'disabled' : ''}>›</button>`;
    
    paginationHtml += '</div>';
    return paginationHtml;
}

// ==================== ✅ 切换评论页码 ====================
function changeCommentPage(page) {
    const work = currentDetailWork;
    if (!work || !work.commentsList) return;
    
    const totalPages = Math.max(1, Math.ceil(work.commentsList.length / window.commentsPerPage));
    
    if (page < 1 || page > totalPages) return;
    
    window.currentCommentPage = page;
    
    // 重新渲染评论区域
    const commentsHtml = renderPaginatedComments(work, work.commentsList);
    const paginationHtml = renderCommentsPagination(totalPages, work.commentsList.length);
    
    const commentsListEl = document.getElementById('commentsList');
    const paginationEl = document.querySelector('#commentsList + div[style*="flex-wrap"]');
    
    if (commentsListEl) {
        commentsListEl.innerHTML = commentsHtml;
    }
    
    if (paginationEl) {
        paginationEl.outerHTML = paginationHtml;
    }
    
    // 滚动到评论区顶部
    if (commentsListEl) {
        commentsListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== ✅ 生成评论（修复：使用稳定ID和更大点赞范围） ====================
function generateComments(work, count, workTime) {
    // 如果被暴露是虚假商单，使用混合评论
    if (work.hasNegativeComments && typeof window.generateCommentsWithNegative === 'function') {
        return window.generateCommentsWithNegative(work, count, work.time);
    }
    
    const actualCount = count || 0;
    const comments = [];
    const users = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子', 
                   '快乐小天使', '追星族', '游戏迷', '文艺青年', '美食家', '旅行达人', '摄影师', '音乐人'];
    const contents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油', 
                      '很好看', '不错不错', '学习了', '收藏了', '转发支持', '期待更新', '主播最美', '最棒的主播', 
                      '今天状态真好', '这个内容有意思', '讲得很详细', '受益匪浅', '主播人真好', '互动很棒', '直播很有趣'];
    
    const now = gameTimer;
    
    // ✅ 修复：确保评论ID稳定且唯一
    // 如果已存在评论列表，保留原有的ID
    const existingComments = work.commentsList || [];
    
    for (let i = 0; i < actualCount; i++) {
        const maxOffset = Math.max(0, now - workTime);
        const randomFactor = Math.random() * Math.random();
        const offset = Math.floor(randomFactor * maxOffset);
        const commentTime = Math.min(workTime + offset, now);
        
        // ✅ 修复：使用稳定的ID生成方式（基于作品ID和索引）
        // 如果已存在对应索引的评论，复用其ID
        const stableId = existingComments[i] && existingComments[i].id 
            ? existingComments[i].id 
            : generateStableCommentId(work.id, i);
        
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        // ✅ 修复：扩大初始点赞数范围（移除99上限）
        // 原代码：Math.floor(Math.random() * 100) 
        // 新代码：Math.floor(Math.random() * 5000) + Math.floor(Math.random() * 1000)
        const initialLikes = Math.floor(Math.random() * 5000) + Math.floor(Math.random() * 1000);
        
        comments.push({ 
            user: username,
            avatar: avatarChar,
            id: stableId,  // ✅ 使用稳定ID
            content: contents[Math.floor(Math.random() * contents.length)], 
            likes: initialLikes,  // ✅ 更大的初始点赞数
            time: commentTime,
            isNegative: false,
            replies: [],
            replyCount: 0
        });
    }
    
    return comments;
}

// ==================== ✅ 点赞评论（修复：使用稳定ID和状态管理） ====================
function likeComment(workId, commentIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) return;
    
    if (!work.commentsList) {
        // 如果评论列表不存在，生成它（不应该发生）
        work.commentsList = generateComments(work, work.comments, work.time);
        saveGame();
    }
    
    // 获取排序后的评论列表以找到正确的评论
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const comment = sortedComments[commentIndex];
    if (!comment || !comment.id) {
        console.error('评论或评论ID无效:', comment);
        return;
    }
    
    // ✅ 修复：使用稳定的评论ID
    const commentKey = comment.id;
    
    // 初始化 commentLikes 对象
    if (!gameState.commentLikes) {
        gameState.commentLikes = {};
    }
    
    // 检查是否已点赞
    if (gameState.commentLikes[commentKey]) {
        showWarning('你已经点赞过这条评论了！');
        return;
    }
    
    // 更新点赞状态
    gameState.commentLikes[commentKey] = true;
    comment.likes = (comment.likes || 0) + 1;
    work.likes += 1;
    gameState.likes += 1;
    
    // 只更新DOM，不重新渲染整个页面
    const commentElement = document.querySelector(`[data-comment-id="${commentKey}"]`);
    if (commentElement) {
        const likeButton = commentElement.querySelector('.comment-action');
        const likeCount = commentElement.querySelector('.comment-action span');
        if (likeButton && likeCount) {
            likeButton.classList.add('liked');
            likeCount.textContent = comment.likes;
        }
    }
    
    showNotification('点赞成功', '你点赞了一条评论');
    updateDisplay();
    saveGame();
}

// ==================== ✅ 回复评论 ====================
function replyComment(workId, commentIndex, username) {
    showCommentDetail(workId, commentIndex);
}

// ==================== ✅ 删除作品 ====================
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

// ==================== ✅ 切换私密状态 ====================
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

// ==================== ✅ 关闭评论详情页（修复导航栏bug） ====================
function closeCommentDetail() {
    // 关闭评论详情页
    document.getElementById('commentDetailPage').classList.remove('active');
    
    // 检查是否有其他全屏页面处于激活状态
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length > 0) {
        // 如果有其他全屏页面激活（如作品详情页），不显示底部导航
        return;
    }
    
    // 否则恢复主内容显示
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 清理评论详情页内容
    document.getElementById('commentDetailPageContent').innerHTML = '';
    
    // 重置导航栏状态
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    // 重置评论页码
    window.currentCommentPage = 1;
}

// ==================== ✅ 全屏评论详情页（修复：主评论点赞状态检查） ====================
window.showCommentDetail = function(workId, commentIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) return;
    
    if (!work.commentsList) {
        work.commentsList = generateComments(work, work.comments, work.time);
    }
    
    // 获取排序后的评论列表以找到正确的评论
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const mainComment = sortedComments[commentIndex];
    if (!mainComment) return;
    
    // 生成回复列表
    if (!mainComment.replies) {
        mainComment.replies = generateReplies(mainComment, 2 + Math.floor(Math.random() * 3));
        mainComment.replyCount = mainComment.replies.length;
    }
    
    // ✅ 修复：检查主评论的点赞状态
    const mainCommentKey = mainComment.id;
    const hasLikedMainComment = gameState.commentLikes && gameState.commentLikes[mainCommentKey];
    const mainCommentLikeIcon = hasLikedMainComment ? '❤️' : '🤍';
    const mainCommentLikeClass = hasLikedMainComment ? 'liked' : '';
    
    // 渲染主评论（包含动态点赞状态）
    const mainCommentHtml = `
        <div style="background: linear-gradient(135deg, #222 0%, #161823 100%); border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #667eea;">
            <div class="comment-header">
                <div class="comment-user-avatar">${mainComment.avatar}</div>
                <span class="comment-user" onclick="showUserProfile('${mainComment.user}', '${mainComment.avatar}')">${mainComment.user}</span>
                <span class="comment-time">${formatTime(mainComment.time)}</span>
            </div>
            <div class="comment-content" style="font-size: 16px; font-weight: bold; margin: 10px 0;">${mainComment.content}</div>
            <div class="comment-actions">
                <span class="comment-action ${mainCommentLikeClass}" 
                      onclick="likeComment('${work.id}', '${commentIndex}')">
                    ${mainCommentLikeIcon} ${mainComment.likes}
                </span>
                <span style="font-size: 12px; color: #999;">${mainComment.replyCount || 0}条回复</span>
            </div>
        </div>
    `;
    
    // 渲染回复列表
    const repliesHtml = mainComment.replies.map((reply, idx) => `
        <div class="comment-item" style="margin-left: 20px; background: #161823; border-left: 3px solid #667eea;">
            <div class="comment-header">
                <div class="comment-user-avatar">${reply.avatar}</div>
                <span class="comment-user" onclick="showUserProfile('${reply.user}', '${reply.avatar}')">${reply.user}</span>
                <span class="comment-time">${formatTime(reply.time)}</span>
            </div>
            <div class="comment-content">${reply.content}</div>
            <div class="comment-actions">
                <span class="comment-action ${reply.isLiked ? 'liked' : ''}" 
                      onclick="likeReply('${workId}', ${commentIndex}, ${idx})">
                    ${reply.isLiked ? '❤️' : '🤍'} ${reply.likes}
                </span>
                <span class="comment-action" onclick="replyToReply('${workId}', ${commentIndex}, ${idx})">回复</span>
            </div>
        </div>
    `).join('');
    
    const content = document.getElementById('commentDetailPageContent');
    content.innerHTML = `
        <div style="margin-bottom: 80px;">
            ${mainCommentHtml}
            <div style="font-size: 14px; font-weight: bold; margin: 15px 0; color: #667eea;">回复列表</div>
            <div id="repliesList">${repliesHtml || '<div style="text-align:center;color:#999;padding:20px;">暂无回复</div>'}</div>
        </div>
    `;
    
    // 底部回复框
    const replyBoxHtml = `
        <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #161823; border-top: 1px solid #333; padding: 10px; z-index: 100;">
            <div style="display: flex; gap: 10px; align-items: flex-bottom;">
                <textarea class="text-input" id="replyInput" rows="2" placeholder="写下你的回复..." style="flex: 1; margin: 0;"></textarea>
                <button class="btn" onclick="submitReply('${work.id}', ${commentIndex})" style="width: auto; margin: 0; padding: 10px 20px;">回复</button>
            </div>
        </div>
    `;
    content.innerHTML += replyBoxHtml;
    
    // 显示全屏页面
    document.getElementById('commentDetailPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== ✅ 提交回复（修复：使用稳定ID） ====================
function submitReply(workId, commentIndex) {
    const input = document.getElementById('replyInput');
    const content = input.value.trim();
    if (!content) {
        showAlert('请输入回复内容', '提示');
        return;
    }
    
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    // 获取排序后的评论列表
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const mainComment = sortedComments[commentIndex];
    if (!mainComment) return;
    
    // 生成稳定ID
    const replyIndex = mainComment.replies ? mainComment.replies.length : 0;
    const replyId = `${mainComment.id}_reply_${replyIndex}`;
    
    const reply = {
        user: gameState.username,
        avatar: gameState.avatar || '😊',
        id: replyId,  // ✅ 添加稳定ID
        content: content,
        likes: 0,
        time: gameTimer,
        isReply: true,
        isLiked: false,
        replyTo: mainComment.user
    };
    
    if (!mainComment.replies) {
        mainComment.replies = [];
    }
    mainComment.replies.push(reply);
    mainComment.replyCount = (mainComment.replyCount || 0) + 1;
    
    work.comments += 1;
    gameState.totalInteractions += 1;
    
    input.value = '';
    
    showNotification('回复成功', '你的回复已发布');
    showCommentDetail(workId, commentIndex);
    updateDisplay();
    saveGame();
}

// ==================== ✅ 点赞回复 ====================
function likeReply(workId, commentIndex, replyIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    // 获取排序后的评论列表
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const mainComment = sortedComments[commentIndex];
    if (!mainComment || !mainComment.replies) return;
    
    const reply = mainComment.replies[replyIndex];
    if (!reply || reply.isLiked) return;
    
    reply.likes += 1;
    reply.isLiked = true;
    
    showNotification('点赞成功', '你点赞了一条回复');
    showCommentDetail(workId, commentIndex);
    updateDisplay();
    saveGame();
}

// ==================== ✅ 回复回复（嵌套回复） ====================
function replyToReply(workId, commentIndex, replyIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    // 获取排序后的评论列表
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const mainComment = sortedComments[commentIndex];
    if (!mainComment || !mainComment.replies) return;
    
    const targetReply = mainComment.replies[replyIndex];
    if (!targetReply) return;
    
    showPrompt(`回复 @${targetReply.user}`, '', function(content) {
        if (!content || !content.trim()) {
            showAlert('请输入回复内容', '提示');
            return;
        }
        
        const newReply = {
            user: gameState.username,
            avatar: gameState.avatar || '😊',
            content: `@${targetReply.user} ${content.trim()}`,
            likes: 0,
            time: gameTimer,
            isReply: true,
            isLiked: false,
            replyTo: targetReply.user
        };
        
        mainComment.replies.push(newReply);
        mainComment.replyCount += 1;
        
        work.comments += 1;
        gameState.totalInteractions += 1;
        
        showNotification('回复成功', '你的回复已发布');
        showCommentDetail(workId, commentIndex);
        updateDisplay();
        saveGame();
    });
}

// ==================== ✅ 生成回复 ====================
function generateReplies(comment, count) {
    const replies = [];
    const users = ['小可爱', '直播达人', '热心网友', '粉丝一号', '吃瓜群众', '匿名用户'];
    const contents = ['说得对！', '支持！', '有道理', '学习了', '感谢分享', '😂😂😂', '好有道理', '确实如此'];
    
    const now = gameTimer;
    
    for (let i = 0; i < count; i++) {
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        // 确保回复时间在主评论之后
        const minTime = comment.time;
        const offset = Math.floor(Math.random() * (now - minTime));
        const replyTime = Math.min(minTime + offset, now);
        
        replies.push({
            user: username,
            avatar: avatarChar,
            content: contents[Math.floor(Math.random() * contents.length)],
            likes: Math.floor(Math.random() * 20),
            time: replyTime,
            isReply: true,
            isLiked: false
        });
    }
    
    return replies;
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

// ==================== ✅ 全屏消息页（改造后的消息界面） ====================
function showMessagesFullscreen() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    // 计算各类消息的未读数量
    const unreadCounts = {
        all: gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0,
        like: gameState.messages ? gameState.messages.filter(msg => msg.type === 'like' && !msg.read).length : 0,
        comment: gameState.messages ? gameState.messages.filter(msg => msg.type === 'comment' && !msg.read).length : 0,
        share: gameState.messages ? gameState.messages.filter(msg => msg.type === 'share' && !msg.read).length : 0
    };
    
    // 创建一个函数来生成带小红点的按钮HTML
    function createNavButton(icon, label, type, count) {
        const badgeStyle = count > 0 ? 
            'background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; margin-left: 4px;' : 
            'display: none;';
        const badgeText = count > 99 ? '99+' : count;
        
        return `
            <div class="message-nav-button" onclick="openMessagesFullscreenPage('${type}')" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; background: #222; border: 1px solid #333; border-radius: 8px; cursor: pointer; transition: all 0.3s; position: relative;">
                <div style="font-size: 18px; margin-bottom: 4px;">${icon}</div>
                <div style="font-size: 12px; display: flex; align-items: center;">
                    ${label}
                    <span style="${badgeStyle}">${badgeText}</span>
                </div>
            </div>
        `;
    }
    
    // 创建导航按钮栏
    const filterButtons = `
        <div style="display: flex; gap: 10px; margin-bottom: 15px; padding: 0 10px;">
            ${createNavButton('💬', '全部消息', 'all', unreadCounts.all)}
            ${createNavButton('❤️', '点赞', 'like', unreadCounts.like)}
            ${createNavButton('💭', '评论', 'comment', unreadCounts.comment)}
            ${createNavButton('🔄', '转发', 'share', unreadCounts.share)}
        </div>
        <div id="messagesListContainer"></div>
    `;
    
    content.innerHTML = filterButtons;
    
    // 同时在导航栏的消息图标上显示总未读数
    updateNavMessageBadge();
}

// 新增：打开对应的全屏消息页面
function openMessagesFullscreenPage(type) {
    // 标记当前打开的页面类型
    window.currentMessagePageType = type;
    
    // 关闭主内容，显示全屏页面
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    // 显示对应的全屏页面
    document.getElementById(`messages${type.charAt(0).toUpperCase() + type.slice(1)}Page`).classList.add('active');
    
    // 渲染该页面的内容
    renderMessagesFullscreenPage(type);
    
    // 标记该类型消息为已读
    markMessagesAsReadByType(type);
    
    // 更新小红点
    updateNavMessageBadge();
}

// 新增：关闭全屏消息页面
function closeMessagesFullscreenPage(pageName) {
    // 从页面名称中提取类型
    // 'messagesAll', 'messagesLike', 'messagesComment', 'messagesShare'
    const type = pageName.replace('messages', '').toLowerCase();
    
    // 关闭页面
    document.getElementById(pageName + 'Page').classList.remove('active');
    
    // 恢复主内容显示
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 检查是否有其他全屏页面处于激活状态
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.nav-item').classList.add('active');
    }
    
    // 刷新消息界面
    if (typeof showMessagesFullscreen === 'function') {
        showMessagesFullscreen();
    }
    
    updateDisplay();
}

// 新增：渲染全屏消息页面内容
function renderMessagesFullscreenPage(type) {
    const contentId = `messages${type.charAt(0).toUpperCase() + type.slice(1)}PageContent`;
    const content = document.getElementById(contentId);
    if (!content) return;
    
    // 筛选消息
    let messages = gameState.messages || [];
    if (type !== 'all') {
        messages = messages.filter(msg => msg.type === type);
    }
    
    // 按时间倒序排列，限制100条
    messages = messages.slice(-100).reverse();
    
    if (messages.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">暂无消息</div>';
        return;
    }
    
    const messagesHtml = messages.map(msg => {
        const typeIcons = {
            like: '❤️',
            comment: '💬',
            share: '🔄'
        };
        const typeTexts = {
            like: '点赞了你的作品',
            comment: '评论了你的作品',
            share: '转发了你的作品'
        };
        
        return `
            <div class="comment-item" style="${!msg.read ? 'border-left: 3px solid #667eea;' : ''}; margin-bottom: 10px;">
                <div class="comment-header">
                    <div class="comment-user-avatar">${msg.user ? msg.user.charAt(0) : '👤'}</div>
                    <span class="comment-user" onclick="showUserProfile('${msg.user || '匿名用户'}', '${msg.user ? msg.user.charAt(0) : '👤'}')">${msg.user || '匿名用户'}</span>
                    <span class="comment-time">${formatTime(msg.time)}</span>
                </div>
                <div class="comment-content">
                    ${typeIcons[msg.type] || '🔔'} ${typeTexts[msg.type] || '互动了你的作品'}
                </div>
                <div style="font-size: 11px; color: #999; margin-top: 5px; padding: 8px; background: #1a1a1a; border-radius: 5px;">
                    作品：${msg.workContent || '未知作品'}
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = messagesHtml;
}

// 新增：按类型标记消息为已读
function markMessagesAsReadByType(type) {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    gameState.messages.forEach(msg => {
        if (type === 'all' || msg.type === type) {
            msg.read = true;
        }
    });
    
    // 同时更新通知中心的已读状态
    if (gameState.notifications) {
        gameState.notifications.forEach(n => n.read = true);
    }
    
    saveGame();
    updateNavMessageBadge();
}

// 新增：更新导航栏消息图标的小红点
function updateNavMessageBadge() {
    const unreadCount = gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0;
    const navItem = document.querySelector('.nav-item:nth-child(3)'); // 消息导航项
    if (!navItem) return;
    
    // 查找或创建小红点
    let badge = navItem.querySelector('.nav-badge');
    if (unreadCount > 0) {
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'nav-badge';
            badge.style.cssText = `
                position: absolute;
                top: 2px;
                right: 8px;
                background: #ff0050;
                color: #fff;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                min-width: 16px;
                text-align: center;
                z-index: 10;
            `;
            navItem.style.position = 'relative';
            navItem.appendChild(badge);
        }
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
    } else if (badge) {
        badge.style.display = 'none';
    }
}

// 新增：按类型清空消息
function clearMessagesByType(type) {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    showConfirm(`确定要清空${type === 'all' ? '所有' : type === 'like' ? '点赞' : type === 'comment' ? '评论' : '转发'}消息吗？`, function(confirmed) {
        if (confirmed) {
            if (type === 'all') {
                gameState.messages = [];
            } else {
                gameState.messages = gameState.messages.filter(msg => msg.type !== type);
            }
            saveGame();
            updateNavMessageBadge();
            renderMessagesFullscreenPage(type);
            showNotification('清空成功', '消息已清空');
        }
    });
}

// 修改原有的 updateNotificationBadge 函数，只更新顶部通知中心
function updateNotificationBadge() {
    const unreadCount = gameState.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
    // 同时更新导航栏消息小红点
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
}

// 修改原有的 renderMessagesList 函数，保持其原有功能
function renderMessagesList(type = 'all') {
    const container = document.getElementById('messagesListContainer');
    if (!container) return;
    
    // 筛选消息
    let messages = gameState.messages || [];
    if (type !== 'all') {
        messages = messages.filter(msg => msg.type === type);
    }
    
    // 按时间倒序排列，限制50条
    messages = messages.slice(-50).reverse();
    
    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">暂无消息</div>';
        return;
    }
    
    const messagesHtml = messages.map(msg => {
        const typeIcons = {
            like: '❤️',
            comment: '💬',
            share: '🔄'
        };
        const typeTexts = {
            like: '点赞了你的视频',
            comment: '评论了你的视频',
            share: '转发了你的视频'
        };
        
        return `
            <div class="comment-item" style="${!msg.read ? 'border-left: 3px solid #667eea;' : ''}; margin-bottom: 8px;">
                <div class="comment-header">
                    <div class="comment-user-avatar">${msg.user ? msg.user.charAt(0) : '👤'}</div>
                    <span class="comment-user" onclick="showUserProfile('${msg.user || '匿名用户'}', '${msg.user ? msg.user.charAt(0) : '👤'}')">${msg.user || '匿名用户'}</span>
                    <span class="comment-time">${formatTime(msg.time)}</span>
                </div>
                <div class="comment-content">
                    ${typeIcons[msg.type] || '🔔'} ${typeTexts[msg.type] || '互动了你的视频'}
                </div>
                <div style="font-size: 11px; color: #999; margin-top: 5px; padding: 8px; background: #1a1a1a; border-radius: 5px;">
                    作品：${msg.workContent || '未知作品'}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = messagesHtml;
    
    // 标记为已读
    if (gameState.messages) {
        gameState.messages.forEach(msg => msg.read = true);
    }
    updateNavMessageBadge();
    saveGame();
}

// ==================== 全屏作品页（实时动态 + 分页） ====================
window.currentWorksPage = 1;
window.worksPerPage = 10;
window.currentWorksCategory = 'all';

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

// ==================== ✅ 消息全部已读 ====================
function markAllRead() {
    gameState.messages.forEach(msg => msg.read = true);
    gameState.notifications.forEach(n => n.read = true);
    updateNavMessageBadge();
    if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
    showNotification('操作成功', '所有消息已标记为已读');
}

// ==================== ✅ 显示用户主页 ====================
window.showUserProfile = function(username, avatar) {
    const userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const joinDays = Math.floor(Math.random() * 365) + 1;
    const fanCount = Math.floor(Math.random() * 50000) + 100;
    const workCount = Math.floor(Math.random() * 500) + 10;
    const likeCount = Math.floor(Math.random() * 100000) + 1000;
    const level = Math.floor(Math.random() * 50) + 1;
    const vipLevel = Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 1 : 0;
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">用户主页</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 15px;">
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

// ==================== ✅ 随机生成用户简介 ====================
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

// ==================== 全局函数绑定 ====================
window.updateWorksList = updateWorksList;
window.startWorkUpdates = startWorkUpdates;
window.showWorkDetail = showWorkDetail;
window.deleteWork = deleteWork;
window.togglePrivate = togglePrivate;
window.generateComments = generateComments;
window.likeComment = likeComment;
window.replyComment = replyComment;
window.showWorksFullscreen = showWorksFullscreen;
window.renderWorksPage = renderWorksPage;
window.renderWorksPagination = renderWorksPagination;
window.changeWorksPage = changeWorksPage;
window.filterWorksByCategory = filterWorksByCategory;
window.startWorksRealtimeUpdate = startWorksRealtimeUpdate;
window.showMessagesFullscreen = showMessagesFullscreen;
window.markAllRead = markAllRead;
window.currentDetailWork = currentDetailWork;
window.showUserProfile = window.showUserProfile;
window.getRandomUserBio = window.getRandomUserBio;
window.changeCommentPage = changeCommentPage;
window.showCommentDetail = window.showCommentDetail;
window.submitReply = window.submitReply;
window.likeReply = window.likeReply;
window.replyToReply = window.replyToReply;
window.closeCommentDetail = closeCommentDetail;
window.changeCommentSort = window.changeCommentSort;
window.generateReplies = window.generateReplies;
window.getSortedComments = window.getSortedComments;
// 新增的全屏消息相关函数
window.openMessagesFullscreenPage = openMessagesFullscreenPage;
window.closeMessagesFullscreenPage = closeMessagesFullscreenPage;
window.renderMessagesFullscreenPage = renderMessagesFullscreenPage;
window.markMessagesAsReadByType = markMessagesAsReadByType;
window.updateNavMessageBadge = updateNavMessageBadge;
window.clearMessagesByType = clearMessagesByType;
