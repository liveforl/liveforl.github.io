// 虚拟时间机制
const VIRTUAL_DAY_MS = 1 * 60 * 1000;
function getVirtualDaysPassed(startRealTime) { 
  const realMsPassed = Date.now() - startRealTime; 
  return realMsPassed / VIRTUAL_DAY_MS; 
}

// 游戏状态
let gameState = {
  username: '', userId: '', avatar: '', fans: 0, likes: 0, views: 0, works: 0, money: 0, warnings: 0, adOrders: [], currentAdOrder: null, rejectedAdOrders: 0, isBanned: false, banReason: '', banDaysCount: 0, banStartTime: null, isHotSearch: false, hotSearchDaysCount: 0, hotSearchStartTime: null, hotSearchInterval: null, hotSearchTitle: '', achievements: [], worksList: [], notifications: [], liveStatus: false, lastUpdateTime: Date.now(), gameStartTime: Date.now(), chartData: { fans: [], likes: [], views: [] }, liveInterval: null, workUpdateIntervals: [], banInterval: null, banDropInterval: null, trafficWorks: {}, 
  // 新增状态
  appealAvailable: true, // 是否可以申诉
  adOrdersCount: 0, // 累计完成商单数
  isPublicOpinionCrisis: false, // 是否处于舆论风波
  publicOpinionDaysCount: 0, // 舆论风波持续天数
  publicOpinionStartTime: null, // 舆论风波开始时间
  publicOpinionInterval: null, // 舆论风波定时器
  publicOpinionTitle: '' // 舆论风波标题
};

// 成就列表
const achievements = [
  { id: 1, name: '初入江湖', desc: '获得第一个粉丝', icon: '🌱', unlocked: false }, { id: 2, name: '小有名气', desc: '粉丝达到1000', icon: '🌟', unlocked: false }, { id: 3, name: '网红达人', desc: '粉丝达到10万', icon: '⭐', unlocked: false }, { id: 4, name: '顶级流量', desc: '粉丝达到1000万', icon: '🌟', unlocked: false }, { id: 5, name: '爆款制造机', desc: '单条视频播放量破百万', icon: '🔥', unlocked: false }, { id: 6, name: '点赞狂魔', desc: '累计获得10万个赞', icon: '👍', unlocked: false }, { id: 7, name: '高产创作者', desc: '发布100个作品', icon: '📹', unlocked: false }, { id: 8, name: '直播新星', desc: '首次直播获得1000观看', icon: '📱', unlocked: false }, { id: 9, name: '收益第一桶金', desc: '获得首次收益', icon: '💰', unlocked: false }, { id: 10, name: '百万富翁', desc: '累计收益达到100万', icon: '💎', unlocked: false }, { id: 11, name: '话题之王', desc: '单条动态获得1万转发', icon: '🔁', unlocked: false }, { id: 12, name: '评论互动达人', desc: '单条作品获得5000评论', icon: '💬', unlocked: false }, { id: 13, name: '全勤主播', desc: '连续30天更新', icon: '📅', unlocked: false }, { id: 14, name: '逆风翻盘', desc: '从封号中申诉成功', icon: '🔄', unlocked: false }, { id: 15, name: '幸运儿', desc: '触发50次随机事件', icon: '🍀', unlocked: false }, { id: 16, name: '社交达人', desc: '关注1000个用户', icon: '👥', unlocked: false }, { id: 17, name: '夜猫子', desc: '凌晨3点还在直播', icon: '🦉', unlocked: false }, { id: 18, name: '早起鸟儿', desc: '早上6点开始直播', icon: '🐦', unlocked: false }, { id: 19, name: '宠粉狂魔', desc: '回复1000条评论', icon: '💝', unlocked: false }, { id: 20, name: '传奇主播', desc: '解锁所有成就', icon: '👑', unlocked: false }, { id: 21, name: '商单新人', desc: '完成首个商单', icon: '💼', unlocked: false }, { id: 22, name: '广告达人', desc: '完成10个商单', icon: '📢', unlocked: false }, { id: 23, name: '百万单王', desc: '单次商单收入超50万', icon: '💎', unlocked: false }, { id: 24, name: '火眼金睛', desc: '识别并拒绝5个违规商单', icon: '👁️', unlocked: false }, { id: 25, name: '商单大师', desc: '完成50个商单且未违规', icon: '👑', unlocked: false }
];

// 商单数据库（隐蔽的负面商单设计）
const adOrdersDB = [
  { id: 1, title: "健康饮品推广", content: "某知名品牌健康饮品，口感清爽，适合运动后的水分补充", reward: 5000, risk: 0, keyword: "" }, { id: 2, title: "学习APP推荐", content: "高效学习工具，帮助提升记忆力", reward: 8000, risk: 0, keyword: "" }, { id: 3, title: "生活用品测评", content: "日常好物分享，提升生活品质", reward: 12000, risk: 0, keyword: "" }, { id: 4, title: "投资理财课程", content: "零基础学理财，分享年化20%+的实战技巧", reward: 50000, risk: 0.7, keyword: "收益" }, { id: 5, title: "传统草本精华", content: "调节身体机能，效果因人而异，坚持服用见效", reward: 30000, risk: 0.6, keyword: "见效" }, { id: 6, title: "资金周转方案", content: "快速审批，灵活还款，解决短期资金需求", reward: 80000, risk: 0.9, keyword: "资金周转" }, { id: 7, title: "数字资产机遇", content: "新兴区块链项目，把握时代机遇", reward: 100000, risk: 0.85, keyword: "区块链" }, { id: 8, title: "美容护肤产品", content: "7天见证肌肤改变，独家生物科技配方", reward: 25000, risk: 0.65, keyword: "7天" }, { id: 9, title: "游戏陪玩平台", content: "边娱乐边创收，时间自由多劳多得", reward: 40000, risk: 0.5, keyword: "多劳多得" }, { id: 10, title: "海外好物分享", content: "原装进口，价格优惠，支持专柜验货", reward: 15000, risk: 0.4, keyword: "验货" }
];

// 随机事件（新增舆论风波事件）
const randomEvents = [
  { type: 'good', title: '视频爆了！', desc: '你的视频被推荐到首页，播放量暴涨', effect: { views: 50000, fans: 5000, likes: 3000 } }, { type: 'good', title: '话题热搜', desc: '你的动态登上热搜榜', effect: { views: 20000, fans: 2000, likes: 1500 } }, { type: 'good', title: '大V转发', desc: '知名博主转发了你的作品', effect: { views: 30000, fans: 3000, likes: 2000 } }, { type: 'good', title: '粉丝福利', desc: '粉丝们给你刷了礼物', effect: { money: 1000, likes: 500 } }, { type: 'good', title: '品牌合作', desc: '有品牌找你合作推广', effect: { money: 5000, fans: 1000 } }, { type: 'bad', title: '内容争议', desc: '你的内容引发争议，有人举报', effect: { fans: -500, warnings: 1 } }, { type: 'bad', title: '黑粉攻击', desc: '有人组织黑粉攻击你的账号', effect: { fans: -1000, likes: -500 } }, { type: 'bad', title: '系统误判', desc: '系统误判你的内容违规', effect: { warnings: 1 } }, { type: 'bad', title: '竞争对手', desc: '同类型主播抢走了你的流量', effect: { views: -10000, fans: -800 } }, { type: 'bad', title: '网络暴力', desc: '你被网暴了，心情低落', effect: { fans: -300, likes: -200 } }, { type: 'neutral', title: '平淡一天', desc: '今天没什么特别的事情发生', effect: {} }, { type: 'neutral', title: '粉丝互动', desc: '和粉丝们聊得很开心', effect: { likes: 100 } }, { type: 'neutral', title: '灵感枯竭', desc: '今天没有创作灵感', effect: {} }, { type: 'good', title: '技能提升', desc: '你学会了新的剪辑技巧', effect: { views: 5000 } }, { type: 'good', title: '设备升级', desc: '你购买了新的直播设备', effect: { fans: 800 } }, { type: 'bad', title: '设备故障', desc: '直播设备出现故障', effect: { fans: -200 } }, { type: 'good', title: '粉丝见面会', desc: '举办了粉丝见面会', effect: { fans: 2000, money: 2000 } }, { type: 'bad', title: '恶意投诉', desc: '有人恶意投诉你的直播', effect: { warnings: 1 } }, { type: 'good', title: '平台推荐', desc: '平台给你提供了推荐位', effect: { views: 40000, fans: 4000 } }, { type: 'bad', title: '算法调整', desc: '平台算法调整，流量下降', effect: { views: -15000 } }, { type: 'good', title: '病毒传播', desc: '你的视频成为病毒式传播', effect: { views: 100000, fans: 10000 } }, { type: 'bad', title: '版权争议', desc: '你的视频涉及版权问题', effect: { warnings: 2, views: -5000 } }, { type: 'good', title: '登上热搜', desc: '你的内容登上平台热搜榜，获得海量曝光', effect: { hotSearch: true } }, { type: 'good', title: '话题引爆', desc: '你制造的话题引发全网讨论', effect: { hotSearch: true } }, { type: 'good', title: '热搜第一', desc: '你的内容登上热搜榜第一名！', effect: { hotSearch: true } },
  // 新增舆论风波事件
  { type: 'bad', title: '舆论风波', desc: '你被卷入舆论风波，粉丝开始流失', effect: { publicOpinion: true } },
  { type: 'bad', title: '负面新闻', desc: '关于你的负面新闻在网上传播', effect: { publicOpinion: true } },
  { type: 'bad', title: '争议言论', desc: '你的言论引发争议', effect: { publicOpinion: true } }
];

// 违规关键词
const violationKeywords = ['暴力', '色情', '政治', '谣言', '诈骗', '盗版', '侵权', '辱骂', '歧视', '毒品'];

// 初始化游戏
function initGame() {
  const saved = localStorage.getItem('streamerGameState');
  if (saved) {
    gameState = JSON.parse(saved);
    // 重置定时器引用（关键！）
    gameState.liveInterval = null; 
    gameState.workUpdateIntervals = []; 
    gameState.banInterval = null; 
    gameState.banDropInterval = null; 
    gameState.hotSearchInterval = null;
    gameState.publicOpinionInterval = null; // 新增舆情定时器重置
    
    // 恢复缺失的状态
    if (gameState.trafficWorks === undefined) gameState.trafficWorks = {};
    if (gameState.adOrders === undefined) gameState.adOrders = [];
    if (gameState.rejectedAdOrders === undefined) gameState.rejectedAdOrders = 0;
    if (gameState.currentAdOrder === undefined) gameState.currentAdOrder = null;
    
    // 新增状态初始化
    if (gameState.appealAvailable === undefined) gameState.appealAvailable = true;
    if (gameState.adOrdersCount === undefined) gameState.adOrdersCount = 0;
    if (gameState.isPublicOpinionCrisis === undefined) gameState.isPublicOpinionCrisis = false;
    if (gameState.publicOpinionDaysCount === undefined) gameState.publicOpinionDaysCount = 0;
    if (gameState.publicOpinionStartTime === undefined) gameState.publicOpinionStartTime = null;
    if (gameState.publicOpinionInterval === undefined) gameState.publicOpinionInterval = null;
    if (gameState.publicOpinionTitle === undefined) gameState.publicOpinionTitle = '';
    
    // 恢复UI状态
    if (gameState.isBanned && gameState.banStartTime) showBanNotice();
    if (gameState.isHotSearch && gameState.hotSearchStartTime) {
      showHotSearchNotice();
      // 修复：重启热搜定时器
      if (!gameState.hotSearchInterval) {
        gameState.hotSearchInterval = setInterval(() => {
          if (gameState.isHotSearch) {
            const fanGrowth = Math.floor(Math.random() * 100) + 50;
            gameState.fans += fanGrowth;
            showNotification('热搜效应', `热搜期间获得${fanGrowth}新粉丝`);
            updateDisplay();
          }
        }, 1000);
      }
    }
    if (gameState.isPublicOpinionCrisis && gameState.publicOpinionStartTime) {
      showPublicOpinionNotice();
      // 重启舆情定时器
      if (!gameState.publicOpinionInterval) {
        gameState.publicOpinionInterval = setInterval(() => {
          if (gameState.isPublicOpinionCrisis && gameState.fans > 0) {
            const fanLoss = Math.floor(Math.random() * 50) + 10;
            gameState.fans = Math.max(0, gameState.fans - fanLoss);
            showNotification('舆论风波', `舆论风波中，粉丝流失：${fanLoss}`);
            updateDisplay();
          }
        }, 1000);
      }
    }
    
    // 修复：恢复流量推广定时器（核心修复）
    // 关键修改：将字符串键转换为数字键
    Object.keys(gameState.trafficWorks).forEach(workIdStr => {
      const workId = Number(workIdStr); // 强制转换为数字
      const trafficData = gameState.trafficWorks[workIdStr];
      if (trafficData && trafficData.isActive) {
        // 清除旧的interval ID（页面刷新后已失效），直接重启
        trafficData.interval = null;
        startTrafficProcess(workId);
      }
    });
  }
  
  if (!gameState.userId) gameState.userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
  if (gameState.chartData.fans.length === 0) {
    for (let i = 0; i < 20; i++) { 
      gameState.chartData.fans.push(0); 
      gameState.chartData.likes.push(0); 
      gameState.chartData.views.push(0); 
    }
  }
  
  const liveBtn = document.getElementById('liveControlBtn');
  liveBtn.style.display = 'block';
  liveBtn.classList.toggle('active', gameState.liveStatus);
  
  updateDisplay();
  startWorkUpdates();
  startGameLoop();
  
  // 确保所有状态都保存一次
  saveGame();
}

// 开始游戏
function startGame() {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) { alert('请输入你的名字'); return; }
  gameState.username = username;
  gameState.avatar = username.charAt(0).toUpperCase();
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'flex';
  initGame();
}

// 更新显示
function updateDisplay() {
  document.getElementById('usernameDisplay').textContent = gameState.username;
  document.getElementById('userAvatar').textContent = gameState.avatar;
  document.getElementById('fansCount').textContent = formatNumber(gameState.fans);
  document.getElementById('likesCount').textContent = formatNumber(gameState.likes);
  document.getElementById('viewsCount').textContent = formatNumber(gameState.views);
  document.getElementById('worksCount').textContent = gameState.works;
  document.getElementById('moneyCount').textContent = Math.floor(gameState.money);
  document.getElementById('warningCount').textContent = `${gameState.warnings}/10`;
  const liveBtn = document.getElementById('liveControlBtn');
  liveBtn.classList.toggle('active', gameState.liveStatus);
  const hotSearchNotice = document.getElementById('hotSearchNotice');
  const banNotice = document.getElementById('banNotice');
  const publicOpinionNotice = document.getElementById('publicOpinionNotice');
  gameState.isHotSearch ? hotSearchNotice.classList.add('show') : hotSearchNotice.classList.remove('show');
  gameState.isBanned ? banNotice.classList.add('show') : banNotice.classList.remove('show');
  gameState.isPublicOpinionCrisis ? publicOpinionNotice.classList.add('show') : publicOpinionNotice.classList.remove('show');
  showHotSearchNotice();
  showBanNotice();
  showPublicOpinionNotice();
  updateWorksList();
  checkAchievements();
  saveGame();
}

// 格式化数字
function formatNumber(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toString();
}

// 作品列表
function updateWorksList() {
  const worksList = document.getElementById('worksList');
  worksList.innerHTML = '';
  const recentWorks = gameState.worksList.slice(-5).reverse();
  recentWorks.forEach((work) => {
    const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
    const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
    const trafficIndicator = isTrafficActive ? '<div class="traffic-indicator">🔥 推送中</div>' : '';
    const workItem = document.createElement('div');
    workItem.className = 'work-item';
    workItem.innerHTML = `<div class="work-header"><span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'}</span><span class="work-time">${formatTime(work.time)} ${adBadge}</span></div><div class="work-content">${work.content}</div><div class="work-stats"><span>▶️ <span class="stat-number" id="work-views-${work.id}">${work.views.toLocaleString()}</span></span><span>❤️ <span class="stat-number" id="work-likes-${work.id}">${work.likes.toLocaleString()}</span></span><span>💬 <span class="stat-number" id="work-comments-${work.id}">${work.comments.toLocaleString()}</span></span><span>🔄 <span class="stat-number" id="work-shares-${work.id}">${work.shares.toLocaleString()}</span></span></div>${trafficIndicator}`;
    workItem.onclick = () => showWorkDetail(work);
    worksList.appendChild(workItem);
  });
  if (recentWorks.length === 0) worksList.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">还没有作品，快去创作吧！</div>';
}

// 作品更新
function startWorkUpdates() {
  setInterval(() => {
    if (gameState.worksList.length === 0) return;
    gameState.worksList.forEach(work => {
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

// 数字动画
function animateNumberUpdate(element) { 
  element.classList.add('updating'); 
  setTimeout(() => element.classList.remove('updating'), 300); 
}

// 格式化时间
function formatTime(timestamp) {
  const diff = Date.now() - timestamp, minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return `${Math.floor(minutes / 1440)}天前`;
}

// 模态框
function showModal(content) { 
  document.getElementById('modalContent').innerHTML = content; 
  document.getElementById('modal').style.display = 'block'; 
}
function closeModal() { 
  document.getElementById('modal').style.display = 'none'; 
}

// 发布视频
function showCreateVideo() {
  if (gameState.isBanned) { showWarning('账号被封禁，无法发布作品'); return; }
  showModal(`<div class="modal-header"><div class="modal-title">发布视频</div><div class="close-btn" onclick="closeModal()">✕</div></div><div class="input-group"><div class="input-label">视频标题</div><input type="text" class="text-input" id="videoTitle" placeholder="给你的视频起个标题" maxlength="50"></div><div class="input-group"><div class="input-label">视频内容</div><textarea class="text-input" id="videoContent" rows="4" placeholder="描述你的视频内容" maxlength="200"></textarea></div><button class="btn" onclick="createVideo()">发布视频</button>`);
}

function createVideo() {
  const title = document.getElementById('videoTitle').value.trim(), content = document.getElementById('videoContent').value.trim();
  if (!title || !content) { alert('请填写完整信息'); return; }
  if (checkViolation(title + content)) return;
  const views = Math.floor(Math.random() * 10000) + 1000, likes = Math.floor(views * (Math.random() * 0.1 + 0.01)), comments = Math.floor(likes * (Math.random() * 0.3 + 0.1)), shares = Math.floor(likes * (Math.random() * 0.2 + 0.05)), work = { id: Date.now(), type: 'video', title: title, content: content, views: views, likes: likes, comments: comments, shares: shares, time: Date.now(), revenue: Math.floor(views / 1000) };
  gameState.worksList.push(work); gameState.works++; gameState.views += views; gameState.likes += likes; gameState.money += work.revenue;
  const newFans = Math.floor(views / 1000 * (Math.random() * 2 + 0.5)); gameState.fans += newFans;
  closeModal(); updateDisplay(); showNotification('视频发布成功！', `获得${views.toLocaleString()}播放量，${newFans}新粉丝`);
}

// 发布动态
function showCreatePost() {
  if (gameState.isBanned) { showWarning('账号被封禁，无法发布作品'); return; }
  showModal(`<div class="modal-header"><div class="modal-title">发布动态</div><div class="close-btn" onclick="closeModal()">✕</div></div><div class="input-group"><div class="input-label">动态内容</div><textarea class="text-input" id="postContent" rows="6" placeholder="分享你的想法..." maxlength="500"></textarea></div><button class="btn" onclick="createPost()">发布动态</button>`);
}

function createPost() {
  const content = document.getElementById('postContent').value.trim();
  if (!content) { alert('请输入动态内容'); return; }
  if (checkViolation(content)) return;
  const views = Math.floor(Math.random() * 5000) + 500, likes = Math.floor(views * (Math.random() * 0.15 + 0.02)), comments = Math.floor(likes * (Math.random() * 0.4 + 0.15)), shares = Math.floor(likes * (Math.random() * 0.3 + 0.1)), work = { id: Date.now(), type: 'post', content: content, views: views, likes: likes, comments: comments, shares: shares, time: Date.now() };
  gameState.worksList.push(work); gameState.works++; gameState.views += views; gameState.likes += likes;
  const newFans = Math.floor(views / 2000 * (Math.random() * 1.5 + 0.3)); gameState.fans += newFans;
  closeModal(); updateDisplay(); showNotification('动态发布成功！', `获得${views.toLocaleString()}浏览，${newFans}新粉丝`);
}

// 购买流量功能 - 修改为多选版本
function showBuyTraffic() {
  const availableWorks = gameState.worksList.filter(w => w.type === 'video' || w.type === 'post');
  if (availableWorks.length === 0) { showWarning('暂无作品可推广，请先发布作品'); return; }
  
  // 初始化多选数组
  window.selectedWorkIds = [];
  window.selectedTrafficDays = 1;
  
  // 生成作品列表HTML，支持多选
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
  
  showModal(`
    <div class="modal-header">
      <div class="modal-title">批量购买推送流量</div>
      <div class="close-btn" onclick="closeModal()">✕</div>
    </div>
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
    <div style="text-align: center; margin: 15px 0; font-size: 18px; color: #667eea;">
      总价：<span id="trafficTotalPrice">0</span>元
    </div>
    <div style="font-size: 12px; color: #999; margin-bottom: 15px; text-align: center;">
      推广期间：播放量疯狂增长，每秒随机涨粉
    </div>
    <button class="btn" id="confirmTrafficBtn" onclick="confirmBuyTraffic()">批量购买并启动推广</button>
  `);
  
  updateTrafficTotalPrice();
}

// 切换作品选择状态
function toggleTrafficSelection(workId) {
  const index = window.selectedWorkIds.indexOf(workId);
  const checkbox = document.getElementById(`checkbox-${workId}`);
  const item = document.querySelector(`[data-work-id="${workId}"]`);
  
  if (index > -1) {
    // 取消选择
    window.selectedWorkIds.splice(index, 1);
    checkbox.style.background = '';
    item.style.border = '';
    item.style.background = '#161823';
  } else {
    // 添加选择
    window.selectedWorkIds.push(workId);
    checkbox.style.background = '#667eea';
    item.style.border = '2px solid #667eea';
    item.style.background = '#222';
  }
  
  updateTrafficTotalPrice();
  updateSelectedCount();
}

// 更新总价
function updateTrafficTotalPrice() {
  const days = window.selectedTrafficDays || 1;
  const selectedCount = window.selectedWorkIds.length;
  const totalPrice = selectedCount * days * 1000;
  
  const priceEl = document.getElementById('trafficTotalPrice');
  if (priceEl) {
    priceEl.textContent = totalPrice.toLocaleString();
  }
}

// 更新已选数量
function updateSelectedCount() {
  const countEl = document.getElementById('selectedCount');
  if (countEl) {
    countEl.textContent = `已选择：${window.selectedWorkIds.length}个作品`;
  }
}

// 选择天数
function selectTrafficDays(element, days) {
  document.querySelectorAll('.day-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  window.selectedTrafficDays = days;
  updateTrafficTotalPrice();
}

// 确认购买流量 - 批量版本
function confirmBuyTraffic() {
  if (!window.selectedWorkIds || window.selectedWorkIds.length === 0) { 
    showWarning('请先选择要推广的作品'); 
    return; 
  }
  
  const days = window.selectedTrafficDays || 1;
  const selectedCount = window.selectedWorkIds.length;
  const totalPrice = selectedCount * days * 1000;
  
  // 检查余额
  if (gameState.money < totalPrice) { 
    showWarning(`零钱不足！需要${totalPrice.toLocaleString()}元`); 
    return; 
  }
  
  // 检查是否有已在推广中的作品
  const activeWorks = window.selectedWorkIds.filter(id => 
    gameState.trafficWorks[id] && gameState.trafficWorks[id].isActive
  );
  
  if (activeWorks.length > 0) {
    showWarning(`有${activeWorks.length}个作品已在推广中！`);
    return;
  }
  
  // 扣除费用
  gameState.money -= totalPrice;
  
  // 批量启动流量推广
  window.selectedWorkIds.forEach(workId => {
    startNewTraffic(workId, days);
  });
  
  closeModal();
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
  startTrafficProcess(workId);
  updateDisplay();
}

// 流量推广核心逻辑
// 关键修复：添加类型转换确保workId为数字
function startTrafficProcess(workId) {
  workId = Number(workId); // 确保workId是数字类型
  
  const trafficData = gameState.trafficWorks[workId];
  if (!trafficData || !trafficData.isActive) return;
  
  // 清除可能存在的旧定时器（保险措施）
  if (trafficData.interval) {
    clearInterval(trafficData.interval);
  }
  
  trafficData.interval = setInterval(() => {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work) return;
    
    const timePassed = getVirtualDaysPassed(trafficData.startTime);
    if (timePassed >= trafficData.days) {
      stopTrafficForWork(workId);
      return;
    }
    
    const viewsBoost = Math.floor(Math.random() * 4000) + 1000;
    const fanBoost = Math.floor(Math.random() * 40) + 10;
    
    work.views += viewsBoost;
    gameState.views += viewsBoost;
    gameState.fans += fanBoost;
    
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

function restartTraffic(workId, trafficData) {
  gameState.trafficWorks[workId] = trafficData;
  startTrafficProcess(workId);
}

// 关键修复：添加类型转换确保workId为数字
function stopTrafficForWork(workId) {
  workId = Number(workId); // 确保workId是数字类型
  
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

// 启动热搜
function startHotSearch(title) {
  if (gameState.isHotSearch) return;
  gameState.isHotSearch = true;
  gameState.hotSearchDaysCount = Math.floor(Math.random() * 3) + 1;
  gameState.hotSearchStartTime = Date.now();
  gameState.hotSearchTitle = title || '🔥 话题热议中';
  if (!gameState.hotSearchInterval) gameState.hotSearchInterval = setInterval(() => {
    if (gameState.isHotSearch) {
      const fanGrowth = Math.floor(Math.random() * 100) + 50;
      gameState.fans += fanGrowth;
      showNotification('热搜效应', `热搜期间获得${fanGrowth}新粉丝`);
      updateDisplay();
    }
  }, 1000);
  showNotification('🎉 热搜上榜', `恭喜！${title}，将持续${gameState.hotSearchDaysCount}虚拟天！`);
  updateDisplay();
}

// 显示热搜通知
function showHotSearchNotice() {
  if (!gameState.isHotSearch) return;
  const hotSearchNotice = document.getElementById('hotSearchNotice');
  const timeLeft = Math.max(0, gameState.hotSearchDaysCount - getVirtualDaysPassed(gameState.hotSearchStartTime));
  hotSearchNotice.innerHTML = `<div style="font-size:14px;font-weight:bold">${gameState.hotSearchTitle}</div><div style="font-size:12px;">热搜剩余：${Math.ceil(timeLeft)}天</div>`;
  if (timeLeft <= 0) endHotSearch();
}

// 结束热搜
function endHotSearch() {
  gameState.isHotSearch = false;
  gameState.hotSearchTitle = '';
  if (gameState.hotSearchInterval) {
    clearInterval(gameState.hotSearchInterval);
    gameState.hotSearchInterval = null;
  }
  showNotification('📉 热搜结束', '热搜期已结束，期待下次上榜！');
  updateDisplay();
}

// 检查违规
function checkViolation(content) {
  const hasViolation = violationKeywords.some(keyword => content.includes(keyword));
  if (hasViolation) {
    if (gameState.warnings < 10) gameState.warnings++;
    showWarning(`内容包含违规信息，警告${gameState.warnings}/10次`);
    if (gameState.warnings >= 10) banAccount('多次违反社区规定');
    return true;
  }
  return false;
}

// 显示警告
function showWarning(message) {
  const toast = document.getElementById('warningToast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

// 封号
function banAccount(reason) {
  if (gameState.isBanned) return;
  gameState.isBanned = true;
  gameState.banReason = reason;
  gameState.banDaysCount = Math.floor(Math.random() * 30) + 1;
  gameState.banStartTime = Date.now();
  // 封号时重置申诉状态
  gameState.appealAvailable = true;
  if (gameState.liveStatus) {
    endLiveStream();
    showNotification('直播中断', '账号被封禁，直播已强制结束');
  }
  Object.keys(gameState.trafficWorks).forEach(workId => stopTrafficForWork(workId));
  saveGame();
  showBanNotice();
  updateDisplay();
}

// 显示封禁通知
function showBanNotice() {
  if (!gameState.isBanned) return;
  const banDays = document.getElementById('banDays'), banNotice = document.getElementById('banNotice');
  const appealBtn = document.getElementById('appealBtn');
  const timeLeft = Math.max(0, gameState.banDaysCount - getVirtualDaysPassed(gameState.banStartTime));
  banDays.textContent = Math.ceil(timeLeft);
  
  // 显示/隐藏申诉按钮
  if (timeLeft > 0 && gameState.appealAvailable) {
    appealBtn.style.display = 'block';
  } else {
    appealBtn.style.display = 'none';
  }
  
  if (timeLeft <= 0) {
    gameState.isBanned = false;
    gameState.warnings = 0;
    gameState.appealAvailable = true; // 解封后重置申诉状态
    if (gameState.banInterval) {
      clearInterval(gameState.banInterval);
      gameState.banInterval = null;
    }
    if (gameState.banDropInterval) {
      clearInterval(gameState.banDropInterval);
      gameState.banDropInterval = null;
    }
    showNotification('封禁结束', '恭喜你，账号已恢复正常使用，警告次数已清空');
    updateDisplay();
  }
  if (!gameState.banInterval) gameState.banInterval = setInterval(() => showBanNotice(), VIRTUAL_DAY_MS);
  if (!gameState.banDropInterval) gameState.banDropInterval = setInterval(() => {
    if (gameState.isBanned && gameState.fans > 0) {
      const fanLoss = Math.floor(Math.random() * 90) + 10;
      gameState.fans = Math.max(0, gameState.fans - fanLoss);
      showNotification('粉丝流失', `封禁期间粉丝流失：${fanLoss}`);
      updateDisplay();
    }
  }, 1000);
}

// 申诉功能
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
      // 申诉成功
      gameState.isBanned = false;
      gameState.warnings = Math.max(0, gameState.warnings - 5);
      gameState.appealAvailable = true;
      
      // 解锁成就
      const achievement = achievements.find(a => a.id === 14);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        gameState.achievements.push(14);
        showNotification('🏆 成就解锁', `${achievement.name}：${achievement.desc}`);
      }
      
      // 清除封禁相关定时器
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
      // 申诉失败
      gameState.appealAvailable = false;
      showWarning('申诉失败，无法再次申诉');
    }
    
    // 隐藏申诉按钮
    document.getElementById('appealBtn').style.display = 'none';
    
    // 立即保存状态
    saveGame();
    updateDisplay();
  }
}

// 直播控制
function toggleLive() {
  if (!gameState.liveStatus) startLive(); else endLiveStream();
}

// 开始直播
function startLive() {
  if (gameState.isBanned) { showWarning('账号被封禁，无法直播'); return; }
  if (gameState.liveStatus) { showNotification('提示', '你正在直播中'); return; }
  gameState.liveStatus = true;
  updateDisplay();
  showModal(`<div class="live-container"><div class="live-header"><div><div style="font-size:16px;font-weight:bold">${gameState.username}的直播间</div><div style="font-size:12px;color:#999">直播分类：娱乐</div></div><div class="live-viewers">👥 0</div></div><div class="live-content"><div class="live-avatar">${gameState.avatar}</div></div><div class="live-controls"><button class="live-btn live-btn-start" onclick="startLiveStream()">开始直播</button><button class="live-btn live-btn-end" onclick="endLiveStream()">结束直播</button></div></div>`);
}

// 开始直播流
function startLiveStream() {
  let liveData = { viewers: Math.floor(Math.random() * 1000) + 100, likes: 0, comments: 0, shares: 0, revenue: 0, duration: 0 };
  gameState.liveInterval = setInterval(() => {
    if (!gameState.liveStatus) { clearInterval(gameState.liveInterval); return; }
    liveData.duration++;
    const viewerChange = Math.floor(Math.random() * 100) - 50;
    liveData.viewers = Math.max(50, liveData.viewers + viewerChange);
    if (Math.random() < 0.3) liveData.likes += Math.floor(Math.random() * 50) + 10;
    if (Math.random() < 0.1) liveData.comments += Math.floor(Math.random() * 10) + 1;
    if (Math.random() < 0.05) liveData.shares += Math.floor(Math.random() * 5) + 1;
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
    gameState.currentLive = { id: Date.now(), type: 'live', content: `${gameState.username}的直播间`, views: liveData.viewers, likes: liveData.likes, comments: liveData.comments, shares: liveData.shares, time: Date.now(), liveData: liveData };
    if (Math.random() < 0.02) showNotification('直播事件', ['用户「直播达人」赠送了火箭礼物！', '用户「小可爱123」加入了直播间', '直播间登上了热门推荐！', '收到了大量弹幕互动！'][Math.floor(Math.random() * 4)]);
    updateDisplay();
  }, 2000);
  showNotification('直播开始', '祝你直播顺利！');
}

// 结束直播
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
  closeModal();
  updateDisplay();
}

// 显示图表
function showCharts() {
  showModal(`<div class="modal-header"><div class="modal-title">数据分析</div><div class="close-btn" onclick="closeModal()">✕</div></div><div class="chart-container"><div class="chart-item"><div class="chart-header"><div class="chart-title">粉丝增长趋势</div><div class="chart-value">${gameState.fans}</div></div><canvas class="chart-canvas" id="fansChart"></canvas></div><div class="chart-item"><div class="chart-header"><div class="chart-title">点赞增长趋势</div><div class="chart-value">${gameState.likes}</div></div><canvas class="chart-canvas" id="likesChart"></canvas></div><div class="chart-item"><div class="chart-header"><div class="chart-title">播放增长趋势</div><div class="chart-value">${gameState.views}</div></div><canvas class="chart-canvas" id="viewsChart"></canvas></div></div>`);
  setTimeout(() => {
    drawChart('fansChart', gameState.chartData.fans, '#667eea');
    drawChart('likesChart', gameState.chartData.likes, '#ff0050');
    drawChart('viewsChart', gameState.chartData.views, '#00f2ea');
  }, 100);
}

// 绘制图表
function drawChart(canvasId, data, color) {
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

// 显示设置
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

// 显示个人主页
function showProfile() {
  showModal(`<div class="modal-header"><div class="modal-title">个人主页</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="text-align:center;padding:20px"><div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 10px">${gameState.avatar}</div><div style="font-size:20px;font-weight:bold;margin-bottom:5px">${gameState.username}</div><div style="font-size:14px;color:#999;margin-bottom:20px">${gameState.userId}</div><div style="display:flex;justify-content:space-around;margin-bottom:20px"><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.fans}</div><div style="font-size:12px;color:#999">粉丝</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.works}</div><div style="font-size:12px;color:#999">作品</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.likes}</div><div style="font-size:12px;color:#999">获赞</div></div></div><button class="btn" onclick="showAllWorks()">查看所有作品</button></div>`);
}

// 显示所有作品
function showAllWorks() {
  const worksHtml = gameState.worksList.map(work => {
    const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
    const adBadge = work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : '';
    const trafficBadge = isTrafficActive ? '<span style="background:#667eea;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">推广中</span>' : '';
    return `<div class="work-item" onclick="showWorkDetail(${JSON.stringify(work).replace(/"/g, '&quot;')})">
      <div class="work-header">
        <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'}</span>
        <span class="work-time">${formatTime(work.time)} ${adBadge} ${trafficBadge}</span>
      </div>
      <div class="work-content">${work.content}</div>
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

// 显示作品详情
function showWorkDetail(work) {
  const trafficData = gameState.trafficWorks[work.id];
  const isTrafficActive = trafficData && trafficData.isActive;
  const trafficStatus = isTrafficActive ? `<div style="background: linear-gradient(135deg,#ff6b00 0%,#ff0050 100%); color: #fff; padding: 8px; border-radius: 5px; text-align: center; font-weight: bold; margin-bottom: 15px; animation: pulse 1s infinite;">🔥 推送中...（剩余${Math.ceil(Math.max(0, trafficData.days - getVirtualDaysPassed(trafficData.startTime)))}天）</div>` : '';
  const adBadge = work.isAd ? '<div style="background:#ff0050;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🎯 商单合作</div>' : '';
  const comments = generateComments(work.comments);
  showModal(`<div class="modal-header"><div class="modal-title">${work.type === 'video' ? '视频详情' : work.type === 'live' ? '直播详情' : '动态详情'}</div><div class="close-btn" onclick="closeModal()">✕</div></div>
    <div style="margin-bottom:20px">${trafficStatus}${adBadge}<div style="font-size:16px;margin-bottom:10px">${work.content}</div><div style="font-size:12px;color:#999;margin-bottom:15px">${formatTime(work.time)}</div>
      <div style="display:flex;justify-content:space-around;padding:15px;background:#161823;border-radius:10px;margin-bottom:20px"><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.views.toLocaleString()}</div><div style="font-size:12px;color:#999">播放/观看</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.likes.toLocaleString()}</div><div style="font-size:12px;color:#999">点赞</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.comments.toLocaleString()}</div><div style="font-size:12px;color:#999">评论</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.shares.toLocaleString()}</div><div style="font-size:12px;color:#999">转发</div></div></div>${work.revenue ? `<div style="font-size:14px;color:#667eea;margin-bottom:15px">💰 收益：${work.revenue}元</div>` : ''}
      <div style="margin-bottom:10px;font-weight:bold">评论区</div><div id="commentsList">${comments.map(comment => `<div class="comment-item"><div class="comment-header"><span class="comment-user">${comment.user}</span><span class="comment-time">${comment.time}</span></div><div class="comment-content">${comment.content}</div><div class="comment-actions"><span class="comment-action">👍 ${comment.likes}</span><span class="comment-action">回复</span></div></div>`).join('')}</div>
    </div>`);
}

// 生成评论
function generateComments(count) {
  const comments = [], users = ['小可爱123', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'], contents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油', '很好看', '不错不错', '学习了', '收藏了', '转发支持', '期待更新', '主播最美', '最棒的主播', '今天状态真好', '这个内容有意思', '讲得很详细', '受益匪浅', '主播人真好', '互动很棒', '直播很有趣'];
  const commentCount = Math.min(count, 20);
  for (let i = 0; i < commentCount; i++) comments.push({ user: users[Math.floor(Math.random() * users.length)] + Math.floor(Math.random() * 999), content: contents[Math.floor(Math.random() * contents.length)], likes: Math.floor(Math.random() * 100), time: `${Math.floor(Math.random() * 60)}分钟前` });
  return comments;
}

// 显示成就
function showAchievements() {
  const achievementHtml = achievements.map(achievement => `<div class="achievement-item">
    <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
    <div class="achievement-info"><div class="achievement-name">${achievement.name}</div><div class="achievement-desc">${achievement.desc}</div></div>
    <div style="color:${achievement.unlocked ? '#667eea' : '#999'};font-size:12px">${achievement.unlocked ? '已解锁' : '未解锁'}</div>
  </div>`).join('');
  showModal(`<div class="modal-header"><div class="modal-title">成就系统</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="max-height:60vh;overflow-y:auto">${achievementHtml}</div>`);
}

// 检查成就
function checkAchievements() {
  achievements.forEach(achievement => {
    if (!achievement.unlocked) {
      let unlocked = false;
      switch (achievement.id) {
        case 1: unlocked = gameState.fans >= 1; break;
        case 2: unlocked = gameState.fans >= 1000; break;
        case 3: unlocked = gameState.fans >= 100000; break;
        case 4: unlocked = gameState.fans >= 10000000; break;
        case 5: unlocked = gameState.worksList.some(w => w.views >= 1000000); break;
        case 6: unlocked = gameState.likes >= 100000; break;
        case 7: unlocked = gameState.works >= 100; break;
        case 8: unlocked = gameState.worksList.some(w => w.type === 'live' && w.views >= 1000); break;
        case 9: unlocked = gameState.money >= 1; break;
        case 10: unlocked = gameState.money >= 1000000; break;
        case 11: unlocked = gameState.worksList.some(w => w.shares >= 10000); break;
        case 12: unlocked = gameState.worksList.some(w => w.comments >= 5000); break;
        case 13: unlocked = (Date.now() - gameState.gameStartTime) >= 30 * 24 * 60 * 60 * 1000; break;
        case 14: unlocked = achievement.unlocked || false; break; // 通过申诉解锁
        case 15: unlocked = gameState.notifications.length >= 50; break;
        case 16: unlocked = false; break;
        case 17: unlocked = false; break;
        case 18: unlocked = false; break;
        case 19: unlocked = false; break;
        case 20: unlocked = achievements.filter(a => a.unlocked).length >= 19; break;
        case 21: unlocked = gameState.worksList.some(w => w.isAd); break;
        case 22: unlocked = gameState.worksList.filter(w => w.isAd).length >= 10; break;
        case 23: unlocked = gameState.worksList.some(w => w.isAd && w.revenue >= 50000); break;
        case 24: unlocked = gameState.rejectedAdOrders >= 5; break;
        case 25: unlocked = gameState.worksList.filter(w => w.isAd).length >= 50 && gameState.warnings < 5; break;
      }
      if (unlocked) {
        achievement.unlocked = true;
        gameState.achievements.push(achievement.id);
        showNotification('成就解锁！', `${achievement.name}：${achievement.desc}`);
      }
    }
  });
}

// 显示通知
function showNotification(title, content) {
  const notification = { id: Date.now(), title: title, content: content, time: Date.now(), read: false };
  gameState.notifications.push(notification);
  updateNotificationBadge();
}

// 更新通知徽章
function updateNotificationBadge() {
  const unreadCount = gameState.notifications.filter(n => !n.read).length, badge = document.getElementById('notificationBadge');
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.style.display = 'block';
  } else badge.style.display = 'none';
}

// 显示通知列表
function showNotifications() {
  gameState.notifications.forEach(n => n.read = true);
  updateNotificationBadge();
  const notificationHtml = gameState.notifications.slice(-20).reverse().map(notification => `<div class="comment-item"><div class="comment-header"><span class="comment-user">${notification.title}</span><span class="comment-time">${formatTime(notification.time)}</span></div><div class="comment-content">${notification.content}</div></div>`).join('');
  showModal(`<div class="modal-header"><div class="modal-title">通知中心</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="max-height:60vh;overflow-y:auto">${gameState.notifications.length === 0 ? '<div style="text-align:center;color:#999;padding:20px;">暂无通知</div>' : notificationHtml}</div>`);
}

// 商单相关功能
function generateAdOrder() {
  const ad = adOrdersDB[Math.floor(Math.random() * adOrdersDB.length)];
  return { ...ad, actualReward: Math.floor(Math.random() * (100000 - 500) + 500), method: null, time: Date.now(), status: 'pending' };
}

function showAdOrders() {
  if (gameState.isBanned) { showWarning('账号被封禁，无法接单'); return; }
  const ad = generateAdOrder(); gameState.currentAdOrder = ad;
  const riskText = { 0: '风险等级：低', 0.4: '风险等级：中低', 0.5: '风险等级：中', 0.6: '风险等级：中高', 0.65: '风险等级：中高', 0.7: '风险等级：高', 0.85: '风险等级：很高', 0.9: '风险等级：极高' };
  const riskColor = ad.risk > 0.6 ? '#ff0050' : ad.risk > 0.3 ? '#ff6b00' : '#00f2ea';
  showModal(`<div class="modal-header"><div class="modal-title">商单中心</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333;"><div style="font-size:16px;font-weight:bold;margin-bottom:10px">${ad.title}</div><div style="font-size:14px;margin-bottom:10px;line-height:1.5">${ad.content}</div><div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${ad.actualReward}元</div><div style="font-size:12px;color:${riskColor}">${riskText[ad.risk] || '风险等级：低'}</div></div></div><div style="margin-bottom:15px;"><div class="input-label">选择发布方式</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"><div class="action-btn" onclick="selectMethod('video')" style="padding:10px"><div class="action-icon">🎬</div><div class="action-text">视频</div></div><div class="action-btn" onclick="selectMethod('post')" style="padding:10px"><div class="action-icon">📝</div><div class="action-text">动态</div></div><div class="action-btn" onclick="selectMethod('live')" style="padding:10px"><div class="action-icon">📱</div><div class="action-text">直播</div></div></div></div><div id="publishForm" style="display:none"><div class="input-group"><div class="input-label">内容创作</div><textarea class="text-input" id="adContent" rows="4" placeholder="根据商单要求创作内容..." maxlength="200"></textarea></div><button class="btn" onclick="publishAd()">发布并领取报酬</button></div><div style="margin-top:15px;font-size:12px;color:#999;text-align:center">⚠️ 违规内容将导致警告甚至封号</div>`);
}

function selectMethod(m) { window.selectedMethod = m; document.getElementById('publishForm').style.display = 'block'; }

function publishAd() {
  const content = document.getElementById('adContent').value.trim(), ad = gameState.currentAdOrder;
  if (!content) { alert('请输入内容'); return; }
  let hasViolation = violationKeywords.some(k => content.includes(k)) || Math.random() < ad.risk;
  if (ad.keyword && content.includes(ad.keyword)) hasViolation = true;
  if (hasViolation) {
    gameState.warnings = Math.min(10, gameState.warnings + Math.floor(Math.random() * 2) + 1);
    showWarning(`商单内容违规，警告${gameState.warnings}/10次`);
    if (gameState.warnings >= 10) banAccount('商单违规');
    gameState.rejectedAdOrders++;
  } else {
    const work = { id: Date.now(), type: window.selectedMethod, content: content, views: Math.floor(Math.random() * 15000 + 5000), likes: Math.floor(Math.random() * 1500 + 100), comments: Math.floor(Math.random() * 200 + 20), shares: Math.floor(Math.random() * 100 + 10), time: Date.now(), isAd: true, revenue: Math.floor((Math.random() * 15000 + 5000) / 1000) };
    gameState.worksList.push(work); gameState.works++; gameState.views += work.views; gameState.likes += work.likes; gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5));
    gameState.money += ad.actualReward;
    
    // 商单计数和掉粉机制
    gameState.adOrdersCount++;
    if (gameState.adOrdersCount % 10 === 0) {
      const fanLoss = Math.floor(Math.random() * 1000) + 500; // 掉500-1500粉
      gameState.fans = Math.max(0, gameState.fans - fanLoss);
      showNotification('粉丝疲劳', `长期接商单导致粉丝流失：${fanLoss}`);
    }
    
    showNotification('商单完成', `获得${ad.actualReward}元`);
  }
  closeModal(); updateDisplay();
}

// 切换标签
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.nav-item').classList.add('active');
  switch (tab) {
    case 'home': location.reload(); break;
    case 'works': showAllWorks(); break;
    case 'messages': showNotifications(); break;
    case 'achievements': showAchievements(); break;
  }
}

// 游戏循环
function startGameLoop() {
  setInterval(() => {
    if (Math.random() < 0.1) updateChartData();
    if (Math.random() < 0.05) {
      const change = Math.floor(Math.random() * 100) - 50;
      gameState.fans = Math.max(0, gameState.fans + change);
      if (change > 0) showNotification('粉丝变化', `获得了${change}个新粉丝`);
      else if (change < 0) showNotification('粉丝变化', `失去了${Math.abs(change)}个粉丝`);
    }
    updateDisplay();
  }, 100);
  setInterval(() => {
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    handleRandomEvent(event);
  }, 30000);
  setInterval(() => {
    const timeSinceLastUpdate = Date.now() - gameState.lastUpdateTime;
    if (timeSinceLastUpdate > 10 * 60 * 1000) {
      const loss = Math.floor(gameState.fans * 0.01);
      gameState.fans = Math.max(0, gameState.fans - loss);
      if (loss > 0) showNotification('粉丝流失', `由于长时间未更新，失去了${loss}个粉丝`);
    }
  }, 60000);
  setInterval(() => {
    Object.keys(gameState.trafficWorks).forEach(workId => {
      const trafficData = gameState.trafficWorks[workId];
      if (trafficData && trafficData.isActive) {
        const timeLeft = Math.max(0, trafficData.days - getVirtualDaysPassed(trafficData.startTime));
        if (timeLeft <= 0) {
          stopTrafficForWork(workId);
        }
      }
    });
    // 检查舆论风波状态
    if (gameState.isPublicOpinionCrisis) showPublicOpinionNotice();
  }, 1000);
}

// 处理随机事件
function handleRandomEvent(event) {
  if (event.effect.fans) gameState.fans = Math.max(0, gameState.fans + event.effect.fans);
  if (event.effect.likes) gameState.likes = Math.max(0, gameState.likes + event.effect.likes);
  if (event.effect.views) gameState.views = Math.max(0, gameState.views + event.effect.views);
  if (event.effect.money) gameState.money = Math.max(0, gameState.money + event.effect.money);
  if (event.effect.warnings) gameState.warnings = Math.min(10, gameState.warnings + event.effect.warnings);
  if (event.effect.hotSearch) startHotSearch(event.title);
  if (event.effect.publicOpinion) startPublicOpinionCrisis(event.title); // 新增舆论风波
  showNotification(event.title, event.desc);
  if (!gameState.isBanned && gameState.warnings >= 10) banAccount('多次违反社区规定');
}

// 舆论风波功能
function startPublicOpinionCrisis(title) {
  if (gameState.isPublicOpinionCrisis) return;
  
  gameState.isPublicOpinionCrisis = true;
  gameState.publicOpinionDaysCount = Math.floor(Math.random() * 3) + 1; // 随机1-3天
  gameState.publicOpinionStartTime = Date.now();
  gameState.publicOpinionTitle = title || '⚠️ 舆论风波中';
  
  // 每秒掉粉
  if (!gameState.publicOpinionInterval) {
    gameState.publicOpinionInterval = setInterval(() => {
      if (gameState.isPublicOpinionCrisis && gameState.fans > 0) {
        const fanLoss = Math.floor(Math.random() * 50) + 10; // 每秒随机掉10-60粉
        gameState.fans = Math.max(0, gameState.fans - fanLoss);
        showNotification('舆论风波', `舆论风波中，粉丝流失：${fanLoss}`);
        updateDisplay();
      }
    }, 1000);
  }
  
  showNotification('⚠️ 舆论风波', `你被卷入舆论风波，将持续${gameState.publicOpinionDaysCount}虚拟天！`);
  updateDisplay();
}

// 显示舆论风波通知
function showPublicOpinionNotice() {
  if (!gameState.isPublicOpinionCrisis) return;
  const publicOpinionNotice = document.getElementById('publicOpinionNotice');
  const timeLeft = Math.max(0, gameState.publicOpinionDaysCount - getVirtualDaysPassed(gameState.publicOpinionStartTime));
  publicOpinionNotice.innerHTML = `<div style="font-size:14px;font-weight:bold">${gameState.publicOpinionTitle}</div><div style="font-size:12px;">剩余：${Math.ceil(timeLeft)}天</div>`;
  if (timeLeft <= 0) endPublicOpinionCrisis();
}

// 结束舆论风波
function endPublicOpinionCrisis() {
  gameState.isPublicOpinionCrisis = false;
  gameState.publicOpinionTitle = '';
  if (gameState.publicOpinionInterval) {
    clearInterval(gameState.publicOpinionInterval);
    gameState.publicOpinionInterval = null;
  }
  showNotification('📉 舆论风波结束', '舆论风波已平息');
  updateDisplay();
}

// 更新图表
function updateChartData() {
  gameState.chartData.fans.shift(); gameState.chartData.fans.push(gameState.fans);
  gameState.chartData.likes.shift(); gameState.chartData.likes.push(gameState.likes);
  gameState.chartData.views.shift(); gameState.chartData.views.push(gameState.views);
}

// 保存游戏
function saveGame() { localStorage.setItem('streamerGameState', JSON.stringify(gameState)); }

// 页面加载
window.onload = function() { 
  document.getElementById('modal').onclick = function(e) { if (e.target === this) closeModal(); }; 
  setTimeout(() => { if (gameState.username) updateDisplay(); }, 100);
};

// 全局函数绑定（修复刷新后onclick失效问题）
window.showAppeal = showAppeal;
window.showNotifications = showNotifications;
window.showSettings = showSettings;
window.showProfile = showProfile;
window.showAllWorks = showAllWorks;
window.clearData = clearData;
window.showCreateVideo = showCreateVideo;
window.showCreatePost = showCreatePost;
window.showCharts = showCharts;
window.showBuyTraffic = showBuyTraffic;
window.showAdOrders = showAdOrders;
window.toggleLive = toggleLive;
window.switchTab = switchTab;
