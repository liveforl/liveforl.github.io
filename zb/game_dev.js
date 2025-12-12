// ==================== 开发者模式功能（增强专业版） ====================

// 全局倒计时追踪器
window.devCountdowns = {
    randomEvent: { nextTime: 0, interval: 30000 },
    fanFluctuation: { nextTime: 0, baseInterval: 20000, probability: 0.05 },
    inactivityCheck: { nextTime: 0, interval: VIRTUAL_DAY_MS },
    chartUpdate: { nextTime: 0, interval: VIRTUAL_DAY_MS },
    interactionGen: { nextTime: 0, interval: 5000 }
};

// 启用开发者模式
function enableDevMode() {
    gameState.devMode = true;
    document.getElementById('devFloatButton').style.display = 'block';
    showNotification('开发者模式', '开发者模式已启用，悬浮按钮已显示');
    
    // 启动倒计时追踪
    devStartCountdownTracker();
    saveGame();
}

// 启动倒计时追踪器
function devStartCountdownTracker() {
    if (window.devCountdownInterval) {
        clearInterval(window.devCountdownInterval);
    }
    
    // 初始化下次触发时间
    const now = Date.now();
    devCountdowns.randomEvent.nextTime = now + devCountdowns.randomEvent.interval;
    devCountdowns.fanFluctuation.nextTime = now + devCountdowns.fanFluctuation.baseInterval;
    devCountdowns.inactivityCheck.nextTime = now + devCountdowns.inactivityCheck.interval;
    devCountdowns.chartUpdate.nextTime = now + devCountdowns.chartUpdate.interval;
    devCountdowns.interactionGen.nextTime = now + devCountdowns.interactionGen.interval;
    
    // 每秒更新倒计时显示
    window.devCountdownInterval = setInterval(() => {
        if (gameState.devMode) {
            devUpdateCountdowns();
        } else {
            clearInterval(window.devCountdownInterval);
        }
    }, 100);
}

// 更新倒计时显示
function devUpdateCountdowns() {
    const now = Date.now();
    
    // 更新随机事件倒计时
    const randomEventTimeLeft = Math.max(0, devCountdowns.randomEvent.nextTime - now);
    if (randomEventTimeLeft === 0) {
        devCountdowns.randomEvent.nextTime = now + devCountdowns.randomEvent.interval;
    }
    
    // 更新粉丝波动倒计时（概率累积）
    const fanFluctuationTimeLeft = Math.max(0, devCountdowns.fanFluctuation.nextTime - now);
    if (fanFluctuationTimeLeft === 0) {
        devCountdowns.fanFluctuation.nextTime = now + devCountdowns.fanFluctuation.baseInterval;
    }
    
    // 更新不更新检测倒计时
    const daysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
    const inactivityTimeLeft = Math.max(0, (7 - daysSinceLastWork) * VIRTUAL_DAY_MS);
    
    // 更新虚拟天数
    const virtualDays = Math.floor(getVirtualDaysPassed());
    
    // 获取UI元素并更新
    const randomEventEl = document.getElementById('devRandomEventCountdown');
    const fanFluctuationEl = document.getElementById('devFanFluctuationCountdown');
    const inactivityEl = document.getElementById('devInactivityCountdown');
    const virtualDaysEl = document.getElementById('devVirtualDays');
    const gameTimerEl = document.getElementById('devGameTimer');
    
    if (randomEventEl) {
        randomEventEl.textContent = `[随机事件] ${(randomEventTimeLeft / 1000).toFixed(1)}秒`;
    }
    if (fanFluctuationEl) {
        fanFluctuationEl.textContent = `[粉丝波动] ${(fanFluctuationTimeLeft / 1000).toFixed(1)}秒`;
    }
    if (inactivityEl) {
        if (daysSinceLastWork < 7) {
            inactivityEl.textContent = `[不更新检测] ${Math.floor(inactivityTimeLeft / 60000)}分${Math.floor((inactivityTimeLeft % 60000) / 1000)}秒`;
        } else {
            inactivityEl.textContent = `[掉粉中] 已超时${Math.floor(daysSinceLastWork - 7)}天`;
        }
    }
    if (virtualDaysEl) {
        virtualDaysEl.textContent = virtualDays;
    }
    if (gameTimerEl) {
        gameTimerEl.textContent = `${(gameTimer / 1000).toFixed(1)}秒`;
    }
    
    // 更新特殊状态倒计时
    devUpdateSpecialStatusCountdowns();
}

// 更新特殊状态倒计时
function devUpdateSpecialStatusCountdowns() {
    // 热搜倒计时
    const hotSearchEl = document.getElementById('devHotSearchCountdown');
    if (hotSearchEl) {
        if (gameState.isHotSearch && gameState.hotSearchStartTime !== null) {
            const timePassed = gameTimer - gameState.hotSearchStartTime;
            const daysLeft = Math.max(0, gameState.hotSearchDaysCount - (timePassed / VIRTUAL_DAY_MS));
            hotSearchEl.textContent = `[热搜] ${daysLeft.toFixed(2)}天`;
        } else {
            hotSearchEl.textContent = '[热搜] 未激活';
        }
    }
    
    // 舆论危机倒计时
    const publicOpinionEl = document.getElementById('devPublicOpinionCountdown');
    if (publicOpinionEl) {
        if (gameState.isPublicOpinionCrisis && gameState.publicOpinionStartTime !== null) {
            const timePassed = gameTimer - gameState.publicOpinionStartTime;
            const daysLeft = Math.max(0, gameState.publicOpinionDaysCount - (timePassed / VIRTUAL_DAY_MS));
            publicOpinionEl.textContent = `[舆论] ${daysLeft.toFixed(2)}天`;
        } else {
            publicOpinionEl.textContent = '[舆论] 未激活';
        }
    }
    
    // 封禁倒计时
    const banEl = document.getElementById('devBanCountdown');
    if (banEl) {
        if (gameState.isBanned && gameState.banStartTime !== null) {
            const timePassed = gameTimer - gameState.banStartTime;
            const daysLeft = Math.max(0, gameState.banDaysCount - (timePassed / VIRTUAL_DAY_MS));
            banEl.textContent = `[封禁] ${daysLeft.toFixed(2)}天`;
        } else {
            banEl.textContent = '[封禁] 未激活';
        }
    }
    
    // 流量推广倒计时
    const trafficEl = document.getElementById('devTrafficCountdown');
    if (trafficEl) {
        const activeTraffics = [];
        Object.keys(gameState.trafficWorks).forEach(workId => {
            const trafficData = gameState.trafficWorks[workId];
            if (trafficData && trafficData.isActive) {
                const timePassed = gameTimer - trafficData.startTime;
                const daysLeft = Math.max(0, trafficData.days - (timePassed / VIRTUAL_DAY_MS));
                activeTraffics.push(`${daysLeft.toFixed(1)}天`);
            }
        });
        
        if (activeTraffics.length > 0) {
            trafficEl.textContent = `[流量] ${activeTraffics.join(', ')}`;
        } else {
            trafficEl.textContent = '[流量] 未激活';
        }
    }
}

// 密码验证
function devVerifyPassword() {
  const input = document.getElementById('devPasswordInput').value;
  if (input === '7890liuliu') {
    enableDevMode();
    closeDevPasswordModal();
  } else {
    // ✅ 已修改：替换浏览器弹窗
    showAlert('密码错误！', '错误');
  }
}

// 显示开发者选项（专业版UI增强）
function showDevOptions() {
  const modalContent = `
    <div class="modal-header">
      <div class="modal-title">开发者控制台</div>
      <div class="close-btn" onclick="closeDevOptions()">✕</div>
    </div>
    
    <!-- 实时统计面板 -->
    <div style="margin: 15px 20px 20px;">
      <div class="dev-stats-grid">
        <div class="dev-stat-card">
          <div class="dev-stat-value">${formatNumber(gameState.fans)}</div>
          <div class="dev-stat-label">粉丝数</div>
        </div>
        <div class="dev-stat-card">
          <div class="dev-stat-value">${formatNumber(gameState.money)}</div>
          <div class="dev-stat-label">零钱</div>
        </div>
        <div class="dev-stat-card">
          <div class="dev-stat-value">${gameState.warnings}/20</div>
          <div class="dev-stat-label">警告</div>
        </div>
      </div>
    </div>

    <!-- 新增：实时状态监控面板 -->
    <div style="margin: 0 20px 20px; background: #0a0a0a; border: 1px solid #333; border-radius: 12px; padding: 15px;">
      <div class="dev-section-title">📡 实时状态监控</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; color: #ccc; margin-top: 10px;">
        <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #222;">
          <div style="color: #667eea; margin-bottom: 4px;">虚拟时间</div>
          <div id="devVirtualDays" style="font-weight: bold; font-size: 12px;">0天</div>
          <div id="devGameTimer" style="font-size: 10px; color: #999;">0秒</div>
        </div>
      </div>
      <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
        <div id="devRandomEventCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #00f2ea;">[随机事件] 0.0秒</div>
        <div id="devFanFluctuationCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #667eea;">[粉丝波动] 0.0秒</div>
        <div id="devInactivityCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff6b00;">[不更新检测] 0分0秒</div>
        <div id="devTrafficCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0050;">[流量] 未激活</div>
        <div id="devHotSearchCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #FFD700;">[热搜] 未激活</div>
        <div id="devPublicOpinionCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #8B0000;">[舆论] 未激活</div>
        <div id="devBanCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0050;">[封禁] 未激活</div>
      </div>
      <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
        💡 点击数值卡片可快速复制数据
      </div>
    </div>

    <!-- 功能分类区域 -->
    <div style="padding: 0 20px 20px; display: grid; gap: 20px;">
      
      <!-- 测试工具 -->
      <div class="dev-section">
        <div class="dev-section-title">🧪 测试工具</div>
        <div class="dev-grid">
          <button class="dev-btn dev-btn-test" onclick="devTestHotSearch()">
            <span class="dev-btn-icon">🔥</span>
            <span class="dev-btn-text">触发热搜</span>
          </button>
          <button class="dev-btn dev-btn-test" onclick="devTestPublicOpinion()">
            <span class="dev-btn-icon">⚠️</span>
            <span class="dev-btn-text">触发舆论</span>
          </button>
          <button class="dev-btn dev-btn-test" onclick="devTestBan()">
            <span class="dev-btn-icon">🚫</span>
            <span class="dev-btn-text">测试封禁</span>
          </button>
        </div>
      </div>

      <!-- 数据修改 -->
      <div class="dev-section">
        <div class="dev-section-title">✏️ 数据修改</div>
        <div class="dev-grid">
          <button class="dev-btn dev-btn-edit" onclick="devAddFans()">
            <span class="dev-btn-icon">👥</span>
            <span class="dev-btn-text">增加粉丝</span>
          </button>
          <button class="dev-btn dev-btn-edit" onclick="devAddMoney()">
            <span class="dev-btn-icon">💵</span>
            <span class="dev-btn-text">增加零钱</span>
          </button>
          <button class="dev-btn dev-btn-edit" onclick="devResetWarnings()">
            <span class="dev-btn-icon">🔄</span>
            <span class="dev-btn-text">重置警告</span>
          </button>
        </div>
      </div>

      <!-- 账号管理 -->
      <div class="dev-section">
        <div class="dev-section-title">🔧 账号管理</div>
        <div class="dev-grid">
          <button class="dev-btn dev-btn-manage" onclick="devClearBans()">
            <span class="dev-btn-icon">✅</span>
            <span class="dev-btn-text">解除封禁</span>
          </button>
          <button class="dev-btn dev-btn-manage" onclick="devUnlockAllAchievements()">
            <span class="dev-btn-icon">🏆</span>
            <span class="dev-btn-text">解锁成就</span>
          </button>
          <button class="dev-btn dev-btn-manage" onclick="devAddRandomWork()">
            <span class="dev-btn-icon">📹</span>
            <span class="dev-btn-text">添加作品</span>
          </button>
          <button class="dev-btn dev-btn-manage" onclick="devClearEvents()">
            <span class="dev-btn-icon">🧹</span>
            <span class="dev-btn-text">清除事件</span>
          </button>
        </div>
      </div>

      <!-- 危险操作 -->
      <div class="dev-section">
        <div class="dev-section-title" style="color: #ff0050;">⚠️ 危险操作</div>
        <div style="display: grid; gap: 10px;">
          <button class="dev-btn dev-btn-danger" onclick="devClearDevMode()">
            <span class="dev-btn-icon">🗑️</span>
            <span class="dev-btn-text">清除开发者模式</span>
          </button>
        </div>
      </div>

    </div>
  `;
  
  showModal(modalContent);
  
  // 立即执行一次倒计时更新
  devUpdateCountdowns();
  
  // 添加ESC关闭支持
  document.addEventListener('keydown', handleDevModalEscape);
}

// 关闭开发者选项
function closeDevOptions() {
  closeModal();
  document.removeEventListener('keydown', handleDevModalEscape);
}

// ESC键关闭处理
function handleDevModalEscape(e) {
  if (e.key === 'Escape') {
    closeDevOptions();
  }
}

// 测试功能
function devTestHotSearch() {
  startHotSearch('🔥 开发者测试热搜');
  showNotification('测试功能', '已触发测试热搜');
}

function devTestPublicOpinion() {
  startPublicOpinionCrisis('⚠️ 开发者测试舆论风波');
  showNotification('测试功能', '已触发测试舆论风波');
}

function devTestBan() {
  banAccount('开发者测试封禁');
  showNotification('测试功能', '已触发测试封禁');
}

function devAddFans() {
  // ✅ 已修改：替换浏览器弹窗
  showPrompt('请输入要增加的粉丝数量', '1000', function(amount) {
    if (!isNaN(amount) && amount > 0) {
      gameState.fans += parseInt(amount);
      updateDisplay();
      showNotification('修改数据', `已增加${amount}个粉丝`);
    }
  });
}

function devAddMoney() {
  // ✅ 已修改：替换浏览器弹窗
  showPrompt('请输入要增加的零钱金额', '100000', function(amount) {
    if (!isNaN(amount) && amount > 0) {
      gameState.money += parseInt(amount);
      updateDisplay();
      showNotification('修改数据', `已增加${amount}元`);
    }
  });
}

function devResetWarnings() {
  gameState.warnings = 0;
  updateDisplay();
  showNotification('修改数据', '警告次数已清零');
}

function devClearBans() {
  gameState.isBanned = false;
  gameState.banReason = '';
  gameState.banDaysCount = 0;
  gameState.warnings = 0;
  if (gameState.banInterval) {
    clearInterval(gameState.banInterval);
    gameState.banInterval = null;
  }
  if (gameState.banDropInterval) {
    clearInterval(gameState.banDropInterval);
    gameState.banDropInterval = null;
  }
  updateDisplay();
  showNotification('修改数据', '封禁状态已清除');
}

function devUnlockAllAchievements() {
  let unlockedCount = 0;
  achievements.forEach(achievement => {
    if (!achievement.unlocked) {
      achievement.unlocked = true;
      gameState.achievements.push(achievement.id);
      unlockedCount++;
    }
  });
  updateDisplay();
  showNotification('修改数据', `已解锁${unlockedCount}个成就`);
}

// 修复：只统计主动互动行为（点赞、评论、转发），去掉播放量
function devAddRandomWork() {
  const types = ['video', 'post', 'live'];
  const type = types[Math.floor(Math.random() * types.length)];
  const views = Math.floor(Math.random() * 50000) + 1000;
  const likes = Math.floor(views * (Math.random() * 0.1 + 0.01));
  const comments = Math.floor(likes * (Math.random() * 0.3 + 0.1));
  const shares = Math.floor(likes * (Math.random() * 0.2 + 0.05));
  
  const work = {
    id: Date.now(), 
    type: type, 
    title: '开发者测试作品', 
    content: '这是由开发者模式生成的测试作品', 
    views: views, 
    likes: likes, 
    comments: comments, 
    shares: shares, 
    time: gameTimer, // 使用游戏计时器
    revenue: Math.floor(views / 1000), 
    isPrivate: false,
    isAd: Math.random() < 0.3
  };
  
  gameState.worksList.push(work);
  gameState.works++;
  gameState.views += views;
  gameState.likes += likes;
  gameState.money += work.revenue;
  const newFans = Math.floor(views / 1000 * (Math.random() * 2 + 0.5));
  gameState.fans += newFans;
  
  // 修复：只统计主动互动行为（点赞、评论、转发），去掉播放量
  gameState.totalInteractions += comments + likes + shares;
  gameState.activeFans += Math.floor(newFans * 0.5);
  
  updateDisplay();
  showNotification('添加作品', `已添加${type}类型测试作品`);
}

// 新增：清除热搜和舆论危机
function devClearEvents() {
  // 清除热搜
  if (gameState.isHotSearch) {
    if (typeof endHotSearch === 'function') {
      endHotSearch();
    } else {
      gameState.isHotSearch = false;
      gameState.hotSearchDaysCount = 0;
      gameState.hotSearchStartTime = null;
      gameState.hotSearchTitle = '';
    }
  }
  
  // 清除舆论危机
  if (gameState.isPublicOpinionCrisis) {
    if (typeof endPublicOpinionCrisis === 'function') {
      endPublicOpinionCrisis();
    } else {
      gameState.isPublicOpinionCrisis = false;
      gameState.publicOpinionDaysCount = 0;
      gameState.publicOpinionStartTime = null;
      gameState.publicOpinionTitle = '';
    }
  }
  
  // 清除相关定时器
  if (gameState.hotSearchInterval) {
    clearInterval(gameState.hotSearchInterval);
    gameState.hotSearchInterval = null;
  }
  
  if (gameState.publicOpinionInterval) {
    clearInterval(gameState.publicOpinionInterval);
    gameState.publicOpinionInterval = null;
  }
  
  // 隐藏相关通知元素
  const hotSearchNotice = document.getElementById('hotSearchNotice');
  const publicOpinionNotice = document.getElementById('publicOpinionNotice');
  if (hotSearchNotice) hotSearchNotice.classList.remove('show');
  if (publicOpinionNotice) publicOpinionNotice.classList.remove('show');
  
  updateDisplay();
  showNotification('事件清除', '已清除所有热搜和舆论危机');
  saveGame();
}

function devClearDevMode() {
  // ✅ 已修改：替换浏览器弹窗
  showConfirm('确定要清除开发者模式吗？这将隐藏开发者选项且不可恢复。', function(confirmed) {
    if (confirmed) {
      gameState.devMode = false;
      document.getElementById('devFloatButton').style.display = 'none';
      closeDevOptions();
      
      // 清除点击计数
      if (window.settingsClickCount) {
        window.settingsClickCount = 0;
      }
      
      // 清除倒计时追踪
      if (window.devCountdownInterval) {
        clearInterval(window.devCountdownInterval);
        window.devCountdownInterval = null;
      }
      
      // 清除本地存储中的开发者模式状态
      saveGame();
      
      showNotification('开发者模式', '开发者模式已清除');
    }
  });
}

// ==================== 全局函数绑定 ====================
window.devVerifyPassword = devVerifyPassword;
window.showDevOptions = showDevOptions;
window.closeDevOptions = closeDevOptions;
window.devTestHotSearch = devTestHotSearch;
window.devTestPublicOpinion = devTestPublicOpinion;
window.devTestBan = devTestBan;
window.devAddFans = devAddFans;
window.devAddMoney = devAddMoney;
window.devResetWarnings = devResetWarnings;
window.devClearBans = devClearBans;
window.devUnlockAllAchievements = devUnlockAllAchievements;
window.devAddRandomWork = devAddRandomWork;
window.devClearDevMode = devClearDevMode;
window.devClearEvents = devClearEvents;
window.devStartCountdownTracker = devStartCountdownTracker;
window.devUpdateCountdowns = devUpdateCountdowns;
window.devUpdateSpecialStatusCountdowns = devUpdateSpecialStatusCountdowns;
