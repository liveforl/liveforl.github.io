// ==================== 评论互动系统 ====================

// 获取排序后的评论
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

// 生成评论
function generateComments(work, count, workTime) {
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
    const existingComments = work.commentsList || [];
    
    for (let i = 0; i < actualCount; i++) {
        const maxOffset = Math.max(0, now - workTime);
        const randomFactor = Math.random() * Math.random();
        const offset = Math.floor(randomFactor * maxOffset);
        const commentTime = Math.min(workTime + offset, now);
        
        const stableId = existingComments[i] && existingComments[i].id 
            ? existingComments[i].id 
            : generateStableCommentId(work.id, i);
        
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        const initialLikes = Math.floor(Math.random() * 5000) + Math.floor(Math.random() * 1000);
        
        comments.push({ 
            user: username,
            avatar: avatarChar,
            id: stableId,
            content: contents[Math.floor(Math.random() * contents.length)], 
            likes: initialLikes,
            time: commentTime,
            isNegative: false,
            replies: [],
            replyCount: 0
        });
    }
    
    return comments;
}

// 点赞评论
function likeComment(workId, commentIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) return;
    
    if (!work.commentsList) {
        work.commentsList = generateComments(work, work.comments, work.time);
        saveGame();
    }
    
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const comment = sortedComments[commentIndex];
    if (!comment || !comment.id) {
        console.error('评论或评论ID无效:', comment);
        return;
    }
    
    const commentKey = comment.id;
    
    if (!gameState.commentLikes) {
        gameState.commentLikes = {};
    }
    
    if (gameState.commentLikes[commentKey]) {
        showWarning('你已经点赞过这条评论了！');
        return;
    }
    
    gameState.commentLikes[commentKey] = true;
    comment.likes = (comment.likes || 0) + 1;
    work.likes += 1;
    gameState.likes += 1;
    
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

// 回复评论
function replyComment(workId, commentIndex, username) {
    window.showCommentDetail(workId, commentIndex);
}

// 切换评论排序
function changeCommentSort(workId, sortType) {
    window.currentCommentSort = sortType;
    
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    const comments = work.commentsList;
    const totalPages = Math.max(1, Math.ceil(comments.length / window.commentsPerPage));
    window.currentCommentPage = 1;
    
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

// 渲染分页评论
function renderPaginatedComments(work, comments) {
    const sortedComments = getSortedComments(comments, window.currentCommentSort || 'hottest');
    
    const totalPages = Math.max(1, Math.ceil(sortedComments.length / window.commentsPerPage));
    const startIndex = (window.currentCommentPage - 1) * window.commentsPerPage;
    const endIndex = startIndex + window.commentsPerPage;
    const pageComments = sortedComments.slice(startIndex, endIndex);
    
    return pageComments.map((comment, index) => {
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
                    <span class="comment-user" onclick="window.showUserProfile('${comment.user}', '${comment.avatar}')">${comment.user}</span>
                    <span class="comment-time">${formatTime(comment.time)}</span>
                </div>
                <div class="comment-content" style="${comment.isNegative ? 'color: #ff6b00; font-weight: bold;' : ''}">${comment.content}</div>
                <div class="comment-actions">
                    <span class="comment-action ${hasLiked ? 'liked' : ''}" 
                          onclick="likeComment('${work.id}', '${startIndex + index}')">
                        ${hasLiked ? '❤️' : '🤍'} <span>${comment.likes}</span>
                    </span>
                    <span class="comment-action" onclick="replyComment('${work.id}', '${startIndex + index}')">
                        回复 ${replyCount > 0 ? `(${replyCount})` : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染评论分页控件
function renderCommentsPagination(totalPages, totalComments) {
    if (totalPages <= 1) return '';
    
    let paginationHtml = '<div style="display: flex; justify-content: center; align-items: center; gap: 5px; margin: 20px 0; flex-wrap: wrap;">';
    
    const prevDisabled = window.currentCommentPage === 1;
    paginationHtml += `<button class="page-btn ${prevDisabled ? 'disabled' : ''}" onclick="window.changeCommentPage(${window.currentCommentPage - 1})" ${prevDisabled ? 'disabled' : ''}>‹</button>`;
    
    const maxButtons = 7;
    let startPage = Math.max(1, window.currentCommentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        paginationHtml += `<button class="page-btn" onclick="window.changeCommentPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<button class="page-btn ${i === window.currentCommentPage ? 'active' : ''}" onclick="window.changeCommentPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
        paginationHtml += `<button class="page-btn" onclick="window.changeCommentPage(${totalPages})">${totalPages}</button>`;
    }
    
    const nextDisabled = window.currentCommentPage === totalPages;
    paginationHtml += `<button class="page-btn ${nextDisabled ? 'disabled' : ''}" onclick="window.changeCommentPage(${window.currentCommentPage + 1})" ${nextDisabled ? 'disabled' : ''}>›</button>`;
    
    paginationHtml += '</div>';
    return paginationHtml;
}

// 切换评论页码
function changeCommentPage(page) {
    const work = window.currentDetailWork;
    if (!work || !work.commentsList) return;
    
    const totalPages = Math.max(1, Math.ceil(work.commentsList.length / window.commentsPerPage));
    
    if (page < 1 || page > totalPages) return;
    
    window.currentCommentPage = page;
    
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
    
    if (commentsListEl) {
        commentsListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 关闭评论详情页
function closeCommentDetail() {
    document.getElementById('commentDetailPage').classList.remove('active');
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length > 0) {
        return;
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.getElementById('commentDetailPageContent').innerHTML = '';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    window.currentCommentPage = 1;
}

// 评论详情页
function showCommentDetail(workId, commentIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) return;
    
    if (!work.commentsList) {
        work.commentsList = generateComments(work, work.comments, work.time);
    }
    
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const mainComment = sortedComments[commentIndex];
    if (!mainComment) return;
    
    if (!mainComment.replies) {
        mainComment.replies = generateReplies(mainComment, 2 + Math.floor(Math.random() * 3));
        mainComment.replyCount = mainComment.replies.length;
    }
    
    const mainCommentKey = mainComment.id;
    const hasLikedMainComment = gameState.commentLikes && gameState.commentLikes[mainCommentKey];
    const mainCommentLikeIcon = hasLikedMainComment ? '❤️' : '🤍';
    const mainCommentLikeClass = hasLikedMainComment ? 'liked' : '';
    
    const mainCommentHtml = `
        <div style="background: linear-gradient(135deg, #222 0%, #161823 100%); border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #667eea;">
            <div class="comment-header">
                <div class="comment-user-avatar">${mainComment.avatar}</div>
                <span class="comment-user" onclick="window.showUserProfile('${mainComment.user}', '${mainComment.avatar}')">${mainComment.user}</span>
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
    
    const repliesHtml = mainComment.replies.map((reply, idx) => `
        <div class="comment-item" style="margin-left: 20px; background: #161823; border-left: 3px solid #667eea;">
            <div class="comment-header">
                <div class="comment-user-avatar">${reply.avatar}</div>
                <span class="comment-user" onclick="window.showUserProfile('${reply.user}', '${reply.avatar}')">${reply.user}</span>
                <span class="comment-time">${formatTime(reply.time)}</span>
            </div>
            <div class="comment-content">${reply.content}</div>
            <div class="comment-actions">
                <span class="comment-action ${reply.isLiked ? 'liked' : ''}" 
                      onclick="likeReply('${work.id}', ${commentIndex}, ${idx})">
                    ${reply.isLiked ? '❤️' : '🤍'} ${reply.likes}
                </span>
                <span class="comment-action" onclick="replyToReply('${work.id}', ${commentIndex}, ${idx})">回复</span>
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
    
    const replyBoxHtml = `
        <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #161823; border-top: 1px solid #333; padding: 10px; z-index: 100;">
            <div style="display: flex; gap: 10px; align-items: flex-bottom;">
                <textarea class="text-input" id="replyInput" rows="2" placeholder="写下你的回复..." style="flex: 1; margin: 0;"></textarea>
                <button class="btn" onclick="submitReply('${work.id}', ${commentIndex})" style="width: auto; margin: 0; padding: 10px 20px;">回复</button>
            </div>
        </div>
    `;
    content.innerHTML += replyBoxHtml;
    
    document.getElementById('commentDetailPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// 提交回复
function submitReply(workId, commentIndex) {
    const input = document.getElementById('replyInput');
    const content = input.value.trim();
    if (!content) {
        showAlert('请输入回复内容', '提示');
        return;
    }
    
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    const sortedComments = getSortedComments(work.commentsList, window.currentCommentSort || 'hottest');
    const mainComment = sortedComments[commentIndex];
    if (!mainComment) return;
    
    const replyIndex = mainComment.replies ? mainComment.replies.length : 0;
    const replyId = `${mainComment.id}_reply_${replyIndex}`;
    
    const reply = {
        user: gameState.username,
        avatar: gameState.avatar || '😊',
        id: replyId,
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
    // ✅ 修复：累加互动数
    gameState.totalInteractions += 1;
    
    // ✅ 修复：累加宠粉狂魔成就计数
    if (!gameState.commentRepliesCount) gameState.commentRepliesCount = 0;
    gameState.commentRepliesCount += 1;
    
    input.value = '';
    
    showNotification('回复成功', '你的回复已发布');
    showCommentDetail(workId, commentIndex);
    
    // ✅ 检查宠粉狂魔成就
    if (gameState.commentRepliesCount >= 1000) {
        const fanLoveAchievement = achievements.find(a => a.id === 19);
        if (fanLoveAchievement && !fanLoveAchievement.unlocked) {
            fanLoveAchievement.unlocked = true;
            gameState.achievements.push(19);
            showAchievementPopup(fanLoveAchievement);
            showNotification('🏆 成就解锁', `宠粉狂魔：回复1000条评论`);
        }
    }
    
    updateDisplay();
    saveGame();
}

// 点赞回复
function likeReply(workId, commentIndex, replyIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
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

// 回复回复
function replyToReply(workId, commentIndex, replyIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
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
        // ✅ 修复：累加互动数
        gameState.totalInteractions += 1;
        
        // ✅ 修复：累加宠粉狂魔成就计数
        if (!gameState.commentRepliesCount) gameState.commentRepliesCount = 0;
        gameState.commentRepliesCount += 1;
        
        showNotification('回复成功', '你的回复已发布');
        showCommentDetail(workId, commentIndex);
        
        // ✅ 检查宠粉狂魔成就
        if (gameState.commentRepliesCount >= 1000) {
            const fanLoveAchievement = achievements.find(a => a.id === 19);
            if (fanLoveAchievement && !fanLoveAchievement.unlocked) {
                fanLoveAchievement.unlocked = true;
                gameState.achievements.push(19);
                showAchievementPopup(fanLoveAchievement);
                showNotification('🏆 成就解锁', `宠粉狂魔：回复1000条评论`);
            }
        }
        
        updateDisplay();
        saveGame();
    });
}

// 生成回复
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

// 绑定全局函数
window.getSortedComments = getSortedComments;
window.generateComments = generateComments;
window.likeComment = likeComment;
window.replyComment = replyComment;
window.changeCommentSort = changeCommentSort;
window.renderPaginatedComments = renderPaginatedComments;
window.renderCommentsPagination = renderCommentsPagination;
window.changeCommentPage = changeCommentPage;
window.closeCommentDetail = closeCommentDetail;
window.showCommentDetail = showCommentDetail;
window.submitReply = submitReply;
window.likeReply = likeReply;
window.replyToReply = replyToReply;
window.generateReplies = generateReplies;
