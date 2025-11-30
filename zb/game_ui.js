// ==================== 主界面更新 ====================
function updateDisplay() {
  document.getElementById('usernameDisplay').textContent = gameState.username;
  document.getElementById('userAvatar').textContent = gameState.avatar;
  
  // 只统计非私密作品
  const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
  const totalViews = publicWorks.reduce((sum, w) => sum + w.views, 0);
  const totalLikes = publicWorks.reduce((sum, w) => sum + w.likes, 0);
  
  document.getElementById('fansCount').textContent = formatNumber(gameState.fans);
  document.getElementById('likesCount').textContent = formatNumber(totalLikes);
  document.getElementById('viewsCount').textContent = formatNumber(totalViews);
  document.getElementById('worksCount').textContent = publicWorks.length;
  
  // 修改：直接显示累计收益，不重新计算
  document.getElementById('moneyCount').textContent = Math.floor(gameState.money);
  
  document.getElementById('warningCount').textContent = `${gameState.warnings}/20`;
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
    const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
    const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
    const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒 私密</span>' : '';
    const trafficIndicator = isTrafficActive ? '<div class="traffic-indicator">🔥 推送中</div>' : '';
    const workItem = document.createElement('div');
    workItem.className = 'work-item';
    workItem.innerHTML = `<div class="work-header"><span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${privacyBadge}</span><span class="work-time">${formatTime(work.time)} ${adBadge}</span></div><div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div><div class="work-stats"><span>▶️ <span class="stat-number" id="work-views-${work.id}">${work.views.toLocaleString()}</span></span><span>❤️ <span class="stat-number" id="work-likes-${work.id}">${work.likes.toLocaleString()}</span></span><span>💬 <span class="stat-number" id="work-comments-${work.id}">${work.comments.toLocaleString()}</span></span><span>🔄 <span class="stat-number" id="work-shares-${work.id}">${work.shares.toLocaleString()}</span></span></div>${trafficIndicator}`;
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
      if (work.isPrivate) return; // 跳过私密作品的自动更新
      const viewsGrowth = Math.floor(Math.random() * 50);
      const likesGrowth = Math.floor(Math.random() * 20);
      const commentsGrowth = Math.floor(Math.random() * 10);
      const sharesGrowth = Math.floor(Math.random() * 5);
      const oldViews = work.views;
      work.views += viewsGrowth;
      gameState.views += viewsGrowth;
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

// ==================== 设置页面 ====================
function showSettings() {
  showModal(`<div class="modal-header"><div class="modal-title">账号设置</div><div class="close-btn" onclick="closeModal()">✕</div></div><div class="settings-item" onclick="changeUsername()"><div><div class="settings-label">修改昵称</div><div class="settings-value">${gameState.username}</div></div><div>></div></div><div class="settings-item" onclick="changeUserId()"><div><div class="settings-label">用户ID</div><div class="settings-value">${gameState.userId}</div></div><div>></div></div><div class="settings-item" onclick="changeAvatar()"><div><div class="settings-label">修改头像</div><div class="settings-value">点击修改</div></div><div>></div></div><div class="settings-item" onclick="showProfile()"><div><div class="settings-label">个人主页</div><div class="settings-value">查看主页</div></div><div>></div></div><div class="settings-item" onclick="clearData()" style="background:#ff0050"><div class="settings-label">清除数据</div><div class="settings-value">谨慎操作</div></div>`);
}

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
    localStorage.removeItem('streamerGameState');
    location.reload();
  }
}

// ==================== 个人主页 ====================
function showProfile() {
  showModal(`<div class="modal-header"><div class="modal-title">个人主页</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="text-align:center;padding:20px"><div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 10px">${gameState.avatar}</div><div style="font-size:20px;font-weight:bold;margin-bottom:5px">${gameState.username}</div><div style="font-size:14px;color:#999;margin-bottom:20px">${gameState.userId}</div><div style="display:flex;justify-content:space-around;margin-bottom:20px"><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.fans}</div><div style="font-size:12px;color:#999">粉丝</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.works}</div><div style="font-size:12px;color:#999">作品</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.likes}</div><div style="font-size:12px;color:#999">获赞</div></div></div><button class="btn" onclick="showAllWorks()">查看所有作品</button></div>`);
}

function showAllWorks() {
  const worksHtml = gameState.worksList.map(work => {
    const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
    const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
    const trafficBadge = isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">推广中</span>' : '';
    const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒 私密</span>' : '';
    return `<div class="work-item" onclick="showWorkDetail(${JSON.stringify(work).replace(/"/g, '&quot;')})">
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
    </div>`;
  }).join('');
  showModal(`<div class="modal-header"><div class="modal-title">所有作品</div><div class="close-btn" onclick="closeModal()">✕</div></div>
    <div style="max-height:60vh;overflow-y:auto">${worksHtml.length === 0 ? '<div style="text-align:center;color:#999;padding:20px;">还没有作品</div>' : worksHtml}</div>`);
}

// ==================== 作品详情 ====================
function showWorkDetail(work) {
  const trafficData = gameState.trafficWorks[work.id];
  const isTrafficActive = trafficData && trafficData.isActive;
  const trafficStatus = isTrafficActive ? `<div style="background: linear-gradient(135deg,#ff6b00 0%,#ff0050 100%); color: #fff; padding: 8px; border-radius: 5px; text-align: center; font-weight: bold; margin-bottom: 15px; animation: pulse 1s infinite;">🔥 推送中...（剩余${Math.ceil(Math.max(0, trafficData.days - getVirtualDaysPassed(trafficData.startTime)))}天）</div>` : '';
  const adBadge = work.isAd ? '<div style="background:#ff0050;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🎯 商单合作</div>' : '';
  const privacyBadge = work.isPrivate ? '<div style="background:#999;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🔒 私密作品</div>' : '';
  const comments = typeof generateComments === 'function' ? generateComments(work.comments) : [];
  
  // 创建操作按钮HTML
  const buttonHtml = `
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button class="btn" onclick="togglePrivate(${work.id})" style="background: ${work.isPrivate ? '#667eea' : '#333'}; flex: 1;">
        ${work.isPrivate ? '🔓 取消私密' : '🔒 设为私密'}
      </button>
      <button class="btn btn-danger" onclick="deleteWork(${work.id})" style="flex: 1; background: #ff0050;">
        🗑️ 删除作品
      </button>
    </div>
  `;
  
  showModal(`<div class="modal-header"><div class="modal-title">${work.type === 'video' ? '视频详情' : work.type === 'live' ? '直播详情' : '动态详情'}</div><div class="close-btn" onclick="closeModal()">✕</div></div>
    <div style="margin-bottom:20px">${trafficStatus}${adBadge}${privacyBadge}<div style="font-size:16px;margin-bottom:10px">${work.content}</div><div style="font-size:12px;color:#999;margin-bottom:15px">${formatTime(work.time)}</div>
      <div style="display:flex;justify-content:space-around;padding:15px;background:#161823;border-radius:10px;margin-bottom:20px"><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.views.toLocaleString()}</div><div style="font-size:12px;color:#999">播放/观看</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.likes.toLocaleString()}</div><div style="font-size:12px;color:#999">点赞</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.comments.toLocaleString()}</div><div style="font-size:12px;color:#999">评论</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.shares.toLocaleString()}</div><div style="font-size:12px;color:#999">转发</div></div></div>${work.revenue ? `<div style="font-size:14px;color:#667eea;margin-bottom:15px">💰 收益：${work.revenue}元</div>` : ''}
      <div style="margin-bottom:10px;font-weight:bold">评论区</div><div id="commentsList">${comments.map(comment => `<div class="comment-item"><div class="comment-header"><span class="comment-user">${comment.user}</span><span class="comment-time">${comment.time}</span></div><div class="comment-content">${comment.content}</div><div class="comment-actions"><span class="comment-action">👍 ${comment.likes}</span><span class="comment-action">回复</span></div></div>`).join('')}</div>
      ${buttonHtml}
    </div>`);
}

// ==================== 删除作品 ====================
function deleteWork(workId) {
  const workIndex = gameState.worksList.findIndex(w => w.id === workId);
  if (workIndex === -1) return;
  
  const work = gameState.worksList[workIndex];
  
  if (confirm(`确定要删除这个${work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态'}吗？此操作不可恢复！`)) {
    // 减去该作品对总数据的贡献
    gameState.views = Math.max(0, gameState.views - work.views);
    gameState.likes = Math.max(0, gameState.likes - work.likes);
    
    // 从列表中移除
    gameState.worksList.splice(workIndex, 1);
    
    // 停止流量推广
    if (gameState.trafficWorks[workId]) {
      if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
    }
    
    // 更新作品数
    gameState.works = gameState.worksList.filter(w => !w.isPrivate).length;
    
    // 更新总互动数据
    const interactionCount = work.views + work.comments + work.likes + work.shares;
    gameState.totalInteractions = Math.max(0, gameState.totalInteractions - interactionCount);
    
    closeModal();
    updateDisplay();
    showNotification('删除成功', '作品已删除');
  }
}

// ==================== 切换私密状态 ====================
function togglePrivate(workId) {
  const work = gameState.worksList.find(w => w.id === workId);
  if (!work) return;
  
  work.isPrivate = !work.isPrivate;
  
  // 重新计算统计数据
  const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
  gameState.works = publicWorks.length;
  gameState.views = publicWorks.reduce((sum, w) => sum + w.views, 0);
  gameState.likes = publicWorks.reduce((sum, w) => sum + w.likes, 0);
  
  // 修改：不要重新计算收益，保持累计值不变
  // gameState.money = publicWorks.reduce((sum, w) => sum + (w.revenue || 0), 0);
  
  // 重新计算总互动数
  gameState.totalInteractions = publicWorks.reduce((sum, w) => {
    return sum + w.views + w.comments + w.likes + w.shares;
  }, 0);
  
  showNotification('设置成功', work.isPrivate ? '作品已设为私密' : '作品已取消私密');
  showWorkDetail(work); // 刷新详情页
  updateDisplay();
}

// ==================== 评论生成 ====================
function generateComments(count) {
  const comments = [], users = ['小可爱123', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'], contents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油', '很好看', '不错不错', '学习了', '收藏了', '转发支持', '期待更新', '主播最美', '最棒的主播', '今天状态真好', '这个内容有意思', '讲得很详细', '受益匪浅', '主播人真好', '互动很棒', '直播很有趣'];
  const commentCount = Math.min(count, 20);
  for (let i = 0; i < commentCount; i++) comments.push({ user: users[Math.floor(Math.random() * users.length)] + Math.floor(Math.random() * 999), content: contents[Math.floor(Math.random() * contents.length)], likes: Math.floor(Math.random() * 100), time: `${Math.floor(Math.random() * 60)}分钟前` });
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

// ==================== 通知显示 ====================
function showNotification(title, content) {
  const notification = { id: Date.now(), title: title, content: content, time: Date.now(), read: false };
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

// ==================== 全屏页面切换 ====================
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (event && event.target) event.target.closest('.nav-item').classList.add('active');
  document.getElementById('mainContent').style.display = 'none';
  document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
  
  switch (tab) {
    case 'home':
      document.getElementById('mainContent').style.display = 'block';
      break;
    case 'works':
      if (typeof showWorksFullscreen === 'function') showWorksFullscreen();
      break;
    case 'messages':
      if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
      break;
    case 'achievements':
      if (typeof showAchievementsFullscreen === 'function') showAchievementsFullscreen();
      break;
  }
}

function closeFullscreenPage(pageName) {
  document.getElementById(pageName + 'Page').classList.remove('active');
  document.getElementById('mainContent').style.display = 'block';
  document.querySelector('.bottom-nav').style.display = 'flex'; // 恢复导航栏显示
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector('.nav-item').classList.add('active');
}

// ==================== 全屏作品页 ====================
function showWorksFullscreen() {
  const worksPage = document.getElementById('worksPage');
  const content = document.getElementById('worksPageContent');
  if (!worksPage || !content) return;
  
  const worksHtml = gameState.worksList.map(work => {
    const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
    const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
    const trafficBadge = isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">推广中</span>' : '';
    const privacyBadge = work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒 私密</span>' : '';
    
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
  
  content.innerHTML = worksHtml.length === 0 ? 
    '<div style="text-align:center;color:#999;padding:20px;">还没有作品，快去创作吧！</div>' : worksHtml;
  
  worksPage.classList.add('active');
}

// ==================== 全屏消息页 ====================
function showMessagesFullscreen() {
  const messagesPage = document.getElementById('messagesPage');
  const content = document.getElementById('messagesPageContent');
  if (!messagesPage || !content) return;
  
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
  
  messagesPage.classList.add('active');
}

// ==================== 全屏成就页 ====================
function showAchievementsFullscreen() {
  const achievementsPage = document.getElementById('achievementsPage');
  const content = document.getElementById('achievementsPageContent');
  if (!achievementsPage || !content) return;
  
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
  achievementsPage.classList.add('active');
}

// ==================== 消息全部已读 ====================
function markAllRead() {
  gameState.notifications.forEach(n => n.read = true);
  updateNotificationBadge();
  if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
  showNotification('操作成功', '所有消息已标记为已读');
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
window.showSettings = showSettings;
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
