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

// 显示开发者选项
function showDevOptions() {
  document.getElementById('devModal').style.display = 'block';
}

// 关闭开发者选项
function closeDevOptions() {
  document.getElementById('devModal').style.display = 'none';
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
  achievements.forEach(achievement => {
    if (!achievement.unlocked) {
      achievement.unlocked = true;
      gameState.achievements.push(achievement.id);
    }
  });
  updateDisplay();
  showNotification('修改数据', '所有成就已解锁');
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
