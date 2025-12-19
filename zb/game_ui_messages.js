// ==================== 消息中心系统 ====================

// 全局变量
window.currentMessageFilter = 'all';
window.currentCommentPage = 1;
window.commentsPerPage = 10;

// 全屏消息页
function showMessagesFullscreen() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    const unreadCounts = {
        all: gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0,
        like: gameState.messages ? gameState.messages.filter(msg => msg.type === 'like' && !msg.read).length : 0,
        comment: gameState.messages ? gameState.messages.filter(msg => msg.type === 'comment' && !msg.read).length : 0,
        share: gameState.messages ? gameState.messages.filter(msg => msg.type === 'share' && !msg.read).length : 0
    };
    
    // 私信未读数
    const privateUnreadCount = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    
    // 构建带下方私信横条的筛选栏
    const filterButtons = `
        <div style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
            <button class="message-filter-btn active" onclick="openMessagesFullscreenPage('all')">
                💬 全部消息
                ${unreadCounts.all > 0 ? `<span class="nav-badge" style="display:inline-block;margin-left:4px;">${unreadCounts.all > 99 ? '99+' : unreadCounts.all}</span>` : ''}
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('like')">
                ❤️ 点赞
                ${unreadCounts.like > 0 ? `<span class="nav-badge" style="display:inline-block;margin-left:4px;">${unreadCounts.like > 99 ? '99+' : unreadCounts.like}</span>` : ''}
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('comment')">
                💭 评论
                ${unreadCounts.comment > 0 ? `<span class="nav-badge" style="display:inline-block;margin-left:4px;">${unreadCounts.comment > 99 ? '99+' : unreadCounts.comment}</span>` : ''}
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('share')">
                🔄 转发
                ${unreadCounts.share > 0 ? `<span class="nav-badge" style="display:inline-block;margin-left:4px;">${unreadCounts.share > 99 ? '99+' : unreadCounts.share}</span>` : ''}
            </button>
        </div>
        
        <!-- 新增的私信横条 -->
        <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 15px; cursor: pointer; border: 1px solid #333; transition: all 0.3s;" 
             onclick="showPrivateMessageList()"
             onmouseover="this.style.borderColor='#667eea';"
             onmouseout="this.style.borderColor='#333';">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-size: 20px;">📨</div>
                    <div style="font-weight: bold; font-size: 14px;">来自陌生人的私信</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${privateUnreadCount > 0 ? 
                        `<span class="private-unread-badge" style="display: block; background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px;">
                            ${privateUnreadCount > 99 ? '99+' : privateUnreadCount}
                        </span>` : 
                        `<span class="private-unread-badge" style="display: none;">0</span>`
                    }
                    <div style="color: #999; font-size: 18px;">›</div>
                </div>
            </div>
        </div>
        
        <div id="messagesListContainer"></div>
    `;
    
    content.innerHTML = filterButtons;
    
    // 更新导航栏消息小红点
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
}

// 打开全屏消息页面
function openMessagesFullscreenPage(type) {
    window.currentMessageFilter = type;
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    document.getElementById(`messages${type.charAt(0).toUpperCase() + type.slice(1)}Page`).classList.add('active');
    
    renderMessagesFullscreenPage(type);
    
    markMessagesAsReadByType(type);
    
    updateNavMessageBadge();
}

// 关闭全屏消息页面
function closeMessagesFullscreenPage(pageName) {
    const type = pageName.replace('messages', '').toLowerCase();
    
    document.getElementById(pageName + 'Page').classList.remove('active');
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.nav-item').classList.add('active');
    }
    
    if (typeof showMessagesFullscreen === 'function') {
        showMessagesFullscreen();
    }
    
    updateDisplay();
}

// 渲染全屏消息页面内容
function renderMessagesFullscreenPage(type) {
    const contentId = `messages${type.charAt(0).toUpperCase() + type.slice(1)}PageContent`;
    const content = document.getElementById(contentId);
    if (!content) return;
    
    let messages = gameState.messages || [];
    if (type !== 'all') {
        messages = messages.filter(msg => msg.type === type);
    }
    
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
                    <span class="comment-user" onclick="openUserProfileFromMessage('${msg.user || '匿名用户'}', '${msg.user ? msg.user.charAt(0) : '👤'}', '${type}')">${msg.user || '匿名用户'}</span>
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

// 标记消息为已读
function markMessagesAsReadByType(type) {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    gameState.messages.forEach(msg => {
        if (type === 'all' || msg.type === type) {
            msg.read = true;
        }
    });
    
    if (gameState.notifications) {
        gameState.notifications.forEach(n => n.read = true);
    }
    
    saveGame();
    updateNavMessageBadge();
}

// 更新导航栏消息图标的小红点
function updateNavMessageBadge() {
    const unreadCount = gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0;
    const navItem = document.querySelector('.nav-item:nth-child(3)');
    if (!navItem) return;
    
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

// 按类型清空消息
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

// 全部已读
function markAllRead() {
    gameState.messages.forEach(msg => msg.read = true);
    gameState.notifications.forEach(n => n.read = true);
    updateNavMessageBadge();
    if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
    showNotification('操作成功', '所有消息已标记为已读');
}

// 从消息打开用户主页
function openUserProfileFromMessage(username, avatar, messageType) {
    closeMessagesFullscreenPage(`messages${messageType.charAt(0).toUpperCase() + messageType.slice(1)}`);
    setTimeout(() => {
        window.showUserProfile(username, avatar);
    }, 100);
}

// 从评论打开用户主页
function openUserProfileFromComment(username, avatar) {
    closeCommentDetail();
    setTimeout(() => {
        window.showUserProfile(username, avatar);
    }, 100);
}

// 绑定全局函数
window.showMessagesFullscreen = showMessagesFullscreen;
window.openMessagesFullscreenPage = openMessagesFullscreenPage;
window.closeMessagesFullscreenPage = closeMessagesFullscreenPage;
window.renderMessagesFullscreenPage = renderMessagesFullscreenPage;
window.markMessagesAsReadByType = markMessagesAsReadByType;
window.updateNavMessageBadge = updateNavMessageBadge;
window.clearMessagesByType = clearMessagesByType;
window.markAllRead = markAllRead;
window.openUserProfileFromMessage = openUserProfileFromMessage;
window.openUserProfileFromComment = openUserProfileFromComment;
