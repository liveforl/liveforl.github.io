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
    alert('请填写完整信息'); 
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
    time: Date.now(), 
    revenue: Math.floor(views / 1000), 
    isPrivate: false 
  };
  
  gameState.worksList.push(work);
  gameState.works++;
  gameState.views += views;
  gameState.likes += likes;
  gameState.money += work.revenue;
  const newFans = Math.floor(views / 1000 * (Math.random() * 2 + 0.5));
  gameState.fans += newFans;
  
  // 更新总互动数据（视频观看+评论+点赞+转发）
  const interactionBoost = views + comments + likes + shares;
  gameState.totalInteractions += interactionBoost;
  gameState.activeFans += Math.floor(newFans * 0.6);
  
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
    alert('请输入动态内容'); 
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
    time: Date.now(), 
    isPrivate: false 
  };
  
  gameState.worksList.push(work);
  gameState.works++;
  gameState.views += views;
  gameState.likes += likes;
  const newFans = Math.floor(views / 2000 * (Math.random() * 1.5 + 0.3));
  gameState.fans += newFans;
  
  // 更新总互动数据（浏览+评论+点赞+转发）
  const interactionBoost = views + comments + likes + shares;
  gameState.totalInteractions += interactionBoost;
  gameState.activeFans += Math.floor(newFans * 0.4);
  
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
  
  // 直播使用全屏页面
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
  let liveData = { viewers: Math.floor(Math.random() * 1000) + 100, likes: 0, comments: 0, shares: 0, revenue: 0, duration: 0 };
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
      gameState.interactions.likesGiven += likeGain;
    }
    if (Math.random() < 0.1) {
      const commentGain = Math.floor(Math.random() * 10) + 1;
      liveData.comments += commentGain;
      gameState.interactions.comments += commentGain;
    }
    if (Math.random() < 0.05) {
      const shareGain = Math.floor(Math.random() * 5) + 1;
      liveData.shares += shareGain;
      gameState.interactions.shares += shareGain;
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
      time: Date.now(), 
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
    gameState.worksList.push(gameState.currentLive);
    gameState.works++;
    gameState.views += totalViews;
    gameState.likes += liveData.likes;
    
    // 更新总互动数据（观看+评论+点赞+转发）
    gameState.totalInteractions += totalViews + liveData.comments + liveData.likes + liveData.shares;
    
    if (totalViews >= 1000) {
      const achievement = achievements.find(a => a.id === 8);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        gameState.achievements.push(8);
        showNotification('成就解锁！', `${achievement.name}：${achievement.desc}`);
      }
    }
    showNotification('直播结束', `本次直播获得${totalViews.toLocaleString()}观看，打赏收入${liveData.revenue}元`);
  }
  gameState.lastUpdateTime = Date.now();
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
    startTime: Date.now(),
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
  
  const daysLeft = Math.ceil(gameState.banDaysCount - getVirtualDaysPassed(gameState.banStartTime));
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
  
  if (confirm(`是否进行申诉？
当前剩余封禁：${daysLeft}天
申诉成功率：${successRate}%
注意：申诉失败将失去再次申诉的机会`)) {
    
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
}

// ==================== 商单系统（改为全屏） ====================
function generateAdOrder() {
  const ad = adOrdersDB[Math.floor(Math.random() * adOrdersDB.length)];
  return { ...ad, actualReward: Math.floor(Math.random() * (100000 - 500) + 500), method: null, time: Date.now(), status: 'pending' };
}

function showAdOrders() {
  if (gameState.isBanned) { 
    showWarning('账号被封禁，无法接单'); 
    return; 
  }
  
  const ad = generateAdOrder();
  gameState.currentAdOrder = ad;
  const riskText = { 
    0: '风险等级：低', 
    0.4: '风险等级：中低', 
    0.5: '风险等级：中', 
    0.6: '风险等级：中高', 
    0.65: '风险等级：中高', 
    0.7: '风险等级：高', 
    0.85: '风险等级：很高', 
    0.9: '风险等级：极高' 
  };
  const riskColor = ad.risk > 0.6 ? '#ff0050' : ad.risk > 0.3 ? '#ff6b00' : '#00f2ea';
  
  const content = document.getElementById('adOrdersPageContent');
  content.innerHTML = `
    <div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${ad.title}</div>
      <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${ad.content}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${ad.actualReward}元</div>
        <div style="font-size:12px;color:${riskColor}">${riskText[ad.risk] || '风险等级：低'}</div>
      </div>
    </div>
    <div style="margin-bottom:15px;">
      <div class="input-label">选择发布方式</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        <div class="action-btn" onclick="selectMethod('video')" style="padding:10px">
          <div class="action-icon">🎬</div>
          <div class="action-text">视频</div>
        </div>
        <div class="action-btn" onclick="selectMethod('post')" style="padding:10px">
          <div class="action-icon">📝</div>
          <div class="action-text">动态</div>
        </div>
        <div class="action-btn" onclick="selectMethod('live')" style="padding:10px">
          <div class="action-icon">📱</div>
          <div class="action-text">直播</div>
        </div>
      </div>
    </div>
    <div id="publishForm" style="display:none">
      <div class="input-group">
        <div class="input-label">内容创作</div>
        <textarea class="text-input" id="adContent" rows="4" placeholder="根据商单要求创作内容..." maxlength="200"></textarea>
      </div>
      <button class="btn" onclick="publishAd()">发布并领取报酬</button>
    </div>
    <div style="margin-top:15px;font-size:12px;color:#999;text-align:center">⚠️ 违规内容将导致警告甚至封号</div>
  `;
  
  document.getElementById('adOrdersPage').classList.add('active');
  document.getElementById('mainContent').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';
}

function selectMethod(m) { 
  window.selectedMethod = m; 
  const form = document.getElementById('publishForm');
  if (form) form.style.display = 'block'; 
}

function publishAd() {
  const content = document.getElementById('adContent').value.trim();
  const ad = gameState.currentAdOrder;
  if (!content) { 
    alert('请输入内容'); 
    return; 
  }
  
  let hasViolation = violationKeywords.some(k => content.includes(k)) || Math.random() < ad.risk;
  if (ad.keyword && content.includes(ad.keyword)) hasViolation = true;
  
  if (hasViolation) {
    gameState.warnings = Math.min(20, gameState.warnings + Math.floor(Math.random() * 2) + 1);
    showWarning(`商单内容违规，警告${gameState.warnings}/20次`);
    if (gameState.warnings >= 20) typeof banAccount === 'function' && banAccount('商单违规');
    gameState.rejectedAdOrders++;
  } else {
    const views = Math.floor(Math.random() * 15000 + 5000);
    const likes = Math.floor(Math.random() * 1500 + 100);
    const comments = Math.floor(Math.random() * 200 + 20);
    const shares = Math.floor(Math.random() * 100 + 10);
    const work = { 
      id: Date.now(), 
      type: window.selectedMethod, 
      content: content, 
      views: views, 
      likes: likes, 
      comments: comments, 
      shares: shares, 
      time: Date.now(), 
      isAd: true, 
      revenue: Math.floor((Math.random() * 15000 + 5000) / 1000), 
      isPrivate: false 
    };
    gameState.worksList.push(work);
    gameState.works++;
    gameState.views += work.views;
    gameState.likes += work.likes;
    gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5));
    gameState.money += ad.actualReward;
    gameState.adOrdersCount++;
    
    // 更新总互动数据（观看+评论+点赞+转发）
    gameState.totalInteractions += views + comments + likes + shares;
    
    if (gameState.adOrdersCount % 10 === 0) {
      const fanLoss = Math.floor(Math.random() * 1000) + 500;
      gameState.fans = Math.max(0, gameState.fans - fanLoss);
      showNotification('粉丝疲劳', `长期接商单导致粉丝流失：${fanLoss}`);
    }
    showNotification('商单完成', `获得${ad.actualReward}元`);
  }
  
  closeFullscreenPage('adOrders');
  updateDisplay();
}

// ==================== 检查违规 ====================
function checkViolation(content) {
  const hasViolation = violationKeywords.some(keyword => content.includes(keyword));
  if (hasViolation) {
    if (gameState.warnings < 20) gameState.warnings++;
    showWarning(`内容包含违规信息，警告${gameState.warnings}/20次`);
    if (!gameState.isBanned && gameState.warnings >= 20) typeof banAccount === 'function' && banAccount('多次违反社区规定');
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
    const timePassed = getVirtualDaysPassed(trafficData.startTime);
    if (timePassed >= trafficData.days) {
      if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
      return;
    }
    const viewsBoost = Math.floor(Math.random() * 4000) + 1000;
    const fanBoost = Math.floor(Math.random() * 40) + 10;
    const commentBoost = Math.floor(Math.random() * 50) + 10;
    const shareBoost = Math.floor(Math.random() * 30) + 5;
    
    work.views += viewsBoost;
    gameState.views += viewsBoost;
    gameState.fans += fanBoost;
    work.comments += commentBoost;
    gameState.totalInteractions += viewsBoost + commentBoost + shareBoost;
    
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

// ==================== 图表显示（保留全屏） ====================
function showCharts() {
  // 切换到全屏页面
  document.getElementById('mainContent').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';
  document.getElementById('chartsPage').classList.add('active');
  
  // 渲染图表容器（添加独立ID用于实时更新）
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
      <!-- 新增粉丝互动数据分析 -->
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

// 修改：清理函数增加停止数字更新
function stopChartsRefresh() {
  if (window.chartRefreshInterval) {
    clearInterval(window.chartRefreshInterval);
    window.chartRefreshInterval = null;
  }
}

// 保留备用绘制函数
function drawFallbackChart(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), width = canvas.width = canvas.offsetWidth, height = canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, width, height);
  const maxValue = Math.max(...data, 1), step = width / (data.length - 1);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, color + '40'); gradient.addColorStop(1, color + '10');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(0, height);
  data.forEach((value, index) => {
    const x = index * step, y = height - (value / maxValue) * height;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(width, height); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  data.forEach((value, index) => {
    const x = index * step, y = height - (value / maxValue) * height;
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = color;
  data.forEach((value, index) => {
    const x = index * step, y = height - (value / maxValue) * height;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  });
}

// 全局函数绑定
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
window.showAdOrders = showAdOrders;
window.selectMethod = selectMethod;
window.publishAd = publishAd;
window.generateAdOrder = generateAdOrder;
window.showAppeal = showAppeal;
window.checkViolation = checkViolation;
window.showCharts = showCharts;
window.stopChartsRefresh = stopChartsRefresh;
