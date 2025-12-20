// ==================== 消息中心系统 ====================

// 全局变量
window.currentMessageFilter = 'all';
window.currentCommentPage = 1;
window.commentsPerPage = 10;

// 更新消息页面顶部的小红点（新增函数）
function updateMessageFilterBadges() {
    const unreadCounts = {
        all: gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0,
        like: gameState.messages ? gameState.messages.filter(msg => msg.type === 'like' && !msg.read).length : 0,
        comment: gameState.messages ? gameState.messages.filter(msg => msg.type === 'comment' && !msg.read).length : 0,
        share: gameState.messages ? gameState.messages.filter(msg => msg.type === 'share' && !msg.read).length : 0
    };
    
    // 更新四个按钮的小红点
    Object.keys(unreadCounts).forEach(type => {
        const button = document.querySelector(`[onclick="openMessagesFullscreenPage('${type}')"]`);
        if (!button) return;
        
        let badge = button.querySelector('.filter-badge');
        const count = unreadCounts[type];
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.style.cssText = `
                    background: #ff0050;
                    color: #fff;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    margin-left: 4px;
                    display: inline-block;
                    min-width: 16px;
                    text-align: center;
                `;
                button.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    });
}

// 全屏消息页
function showMessagesFullscreen() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    const privateUnreadCount = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    
    // 构建带下方私信横条的筛选栏（移除旧版数字显示）
    const filterButtons = `
        <div style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
            <button class="message-filter-btn active" onclick="openMessagesFullscreenPage('all')">
                💬 全部消息
                <span class="filter-badge" style="display:none;"></span>
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('like')">
                ❤️ 点赞
                <span class="filter-badge" style="display:none;"></span>
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('comment')">
                💭 评论
                <span class="filter-badge" style="display:none;"></span>
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('share')">
                🔄 转发
                <span class="filter-badge" style="display:none;"></span>
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
    
    // 立即更新小红点
    updateMessageFilterBadges();
    
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

// 更新导航栏消息徽章（包含私信）- 动态实时版
function updateNavMessageBadge() {
    // 计算普通消息未读数
    const normalUnread = gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0;
    
    // 计算私信未读数
    const privateUnread = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    
    // 总未读数
    const totalUnread = normalUnread + privateUnread;
    
    const navItem = document.querySelector('.nav-item:nth-child(3)');
    if (!navItem) return;
    
    let badge = navItem.querySelector('.nav-badge');
    
    // 如果总未读数大于0，显示徽章
    if (totalUnread > 0) {
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
        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        badge.style.display = 'block';
    } else if (badge) {
        // 如果总未读数为0，隐藏徽章
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

// 全部已读（修复版 - 同时处理私信）
function markAllRead() {
    // 标记普通消息已读
    gameState.messages.forEach(msg => msg.read = true);
    gameState.notifications.forEach(n => n.read = true);
    
    // ✅ 修复：同时标记所有私信为已读
    if (gameState.privateMessageSystem && gameState.privateMessageSystem.conversations) {
        gameState.privateMessageSystem.conversations.forEach(conv => {
            conv.unreadCount = 0;
        });
        gameState.privateMessageSystem.unreadCount = 0;
    }
    
    // 立即更新UI
    updateNavMessageBadge();
    updatePrivateMessageUI();
    updateMessageFilterBadges(); // ✅ 新增：更新顶部四个按钮的小红点
    
    // 如果当前在消息页面，刷新显示
    if (typeof showMessagesFullscreen === 'function') {
        showMessagesFullscreen();
    }
    
    saveGame();
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

// ==================== 新增：消息实时更新系统 ====================

// 启动消息实时更新
function startMessagesRealtimeUpdate() {
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
    }
    
    window.messagesUpdateInterval = setInterval(() => {
        // 检查是否在消息全屏页面
        const activePage = document.querySelector('.fullscreen-page.active');
        if (activePage && activePage.id.startsWith('messages')) {
            // 获取当前消息类型
            const pageId = activePage.id; // messagesAllPage, messagesLikePage等
            const type = pageId.replace('messages', '').replace('Page', '').toLowerCase();
            
            // 重新渲染当前页面
            renderMessagesFullscreenPage(type);
        }
        
        // ✅ 更新消息页面的四个按钮小红点
        updateMessageFilterBadges();
        
        // 更新导航栏消息徽章
        updateNavMessageBadge();
    }, 1000); // 每秒检查一次
}

// 停止消息实时更新
function stopMessagesRealtimeUpdate() {
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
        window.messagesUpdateInterval = null;
    }
}

// 页面切换时自动停止/启动更新
const originalSwitchTab = window.switchTab;
window.switchTab = function(tab) {
    // 先执行原始逻辑
    originalSwitchTab(tab);
    
    // 如果切换到消息页，启动更新
    if (tab === 'messages') {
        startMessagesRealtimeUpdate();
    } else {
        // 切换到其他页面时停止更新（节省性能）
        stopMessagesRealtimeUpdate();
    }
};

// 打开全屏消息页时启动更新
const originalOpenMessagesFullscreenPage = window.openMessagesFullscreenPage;
window.openMessagesFullscreenPage = function(type) {
    originalOpenMessagesFullscreenPage(type);
    startMessagesRealtimeUpdate();
};

// 关闭全屏消息页时停止更新
const originalCloseMessagesFullscreenPage = window.closeMessagesFullscreenPage;
window.closeMessagesFullscreenPage = function(pageName) {
    originalCloseMessagesFullscreenPage(pageName);
    stopMessagesRealtimeUpdate();
};

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
