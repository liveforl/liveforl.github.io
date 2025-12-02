// ==================== 开发者模式功能 ====================
// 密码验证
function devVerifyPassword() {
  const input = document.getElementById('devPasswordInput').value;
  if (input === '7890liuliu') {
    enableDevMode();
    closeDevPasswordModal();
  } else {
    alert('密码错误！');
  }
}

// 启用开发者模式
function enableDevMode() {
  gameState.devMode = true;
  document.getElementById('devFloatButton').style.display = 'block';
  showNotification('开发者模式', '开发者模式已启用，悬浮按钮已显示');
  saveGame();
}

// 显示开发者选项（专业版UI）
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
  const amount = parseInt(prompt('请输入要增加的粉丝数量', '1000'));
  if (!isNaN(amount) && amount > 0) {
    gameState.fans += amount;
    updateDisplay();
    showNotification('修改数据', `已增加${amount}个粉丝`);
  }
}

function devAddMoney() {
  const amount = parseInt(prompt('请输入要增加的零钱金额', '100000'));
  if (!isNaN(amount) && amount > 0) {
    gameState.money += amount;
    updateDisplay();
    showNotification('修改数据', `已增加${amount}元`);
  }
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
    time: Date.now(),
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
  
  gameState.totalInteractions += views + comments + likes + shares;
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
  if (confirm('确定要清除开发者模式吗？这将隐藏开发者选项且不可恢复。')) {
    gameState.devMode = false;
    document.getElementById('devFloatButton').style.display = 'none';
    closeDevOptions();
    
    // 清除点击计数
    if (window.settingsClickCount) {
      window.settingsClickCount = 0;
    }
    
    // 清除本地存储中的开发者模式状态
    saveGame();
    
    showNotification('开发者模式', '开发者模式已清除');
  }
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
