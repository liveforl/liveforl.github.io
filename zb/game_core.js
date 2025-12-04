// ==================== 虚拟时间机制 ====================
const VIRTUAL_DAY_MS = 1 * 60 * 1000; // 1虚拟天 = 1分钟

// 增加图表实例管理
window.charts = {
    fans: null,
    likes: null,
    views: null,
    interactions: null
};

// ==================== 新增：核心计时器系统 ====================
let gameTimer = 0; // 游戏内经过的毫秒数（从00:00:00开始）
let realStartTime = Date.now(); // 真实时间基准（仅用于游戏运行时计算）
let timerInterval = null; // 计时器句柄

// 计时器启动函数
function startGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    // 使用真实时间差值计算，避免setInterval累积误差
    timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - realStartTime;
        gameTimer += delta;
        realStartTime = now;
        saveGame(); // 实时保存计时器状态
    }, 1000);
}

// 计时器停止函数
function stopGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 修改：基于计时器的虚拟天数计算（添加安全保护）
function getVirtualDaysPassed() {
    if (!gameTimer || isNaN(gameTimer) || gameTimer < 0) {
        console.warn('gameTimer异常，重置为0:', gameTimer);
        gameTimer = 0;
        return 0;
    }
    return gameTimer / VIRTUAL_DAY_MS;
}

// ==================== 游戏状态 ====================
let gameState = {
    username: '', 
    userId: '', 
    avatar: '', 
    fans: 0, 
    likes: 0, 
    views: 0, 
    works: 0, 
    money: 0, 
    warnings: 0, 
    adOrders: [], 
    currentAdOrder: null, 
    rejectedAdOrders: 0, 
    isBanned: false, 
    banReason: '', 
    banDaysCount: 0, 
    banStartTime: null, // 存储游戏计时器时间
    isHotSearch: false, 
    hotSearchDaysCount: 0, 
    hotSearchStartTime: null, // 存储游戏计时器时间
    hotSearchInterval: null, 
    hotSearchTitle: '', 
    achievements: [], 
    worksList: [], 
    notifications: [], 
    liveStatus: false, 
    lastUpdateTime: 0, // 存储游戏计时器时间
    lastWorkTime: 0, // 新增：最后发布作品时间（游戏计时器）
    isDroppingFansFromInactivity: false, // 新增：是否因不更新而掉粉
    inactivityDropInterval: null, // 新增：不更新掉粉定时器
    inactivityWarningShown: false, // 新增：不更新警告已显示
    highAdCountDropInterval: null, // 新增：高商单数掉粉定时器
    highAdCountWarningShown: false, // 新增：高商单数警告已显示
    gameStartTime: 0, // 存储游戏计时器时间
    chartData: { 
        fans: [], 
        likes: [], 
        views: [], 
        interactions: [],
        currentIndex: 0,    // 新增：当前数据写入位置
        currentDay: 0       // 新增：当前虚拟天数
    }, 
    liveInterval: null, 
    workUpdateIntervals: [], 
    banInterval: null, 
    banDropInterval: null, 
    trafficWorks: {}, 
    totalInteractions: 0,
    activeFans: 0,
    appealAvailable: true, 
    adOrdersCount: 0, 
    isPublicOpinionCrisis: false, 
    publicOpinionDaysCount: 0, 
    publicOpinionStartTime: null, // 存储游戏计时器时间
    publicOpinionInterval: null, 
    publicOpinionTitle: '',
    devMode: false,
    // 新增：计时器状态
    gameTimer: 0, // 游戏内经过的毫秒数
    realStartTime: 0, // 存档时的真实时间戳（用于恢复）
    
    // ========== 新增：商单惩罚机制状态变量 ==========
    adOrdersPenaltyActive: false,      // 是否处于商单惩罚期
    adOrdersPenaltyEndTime: 0,         // 惩罚结束时间（游戏计时器）
    adOrdersPenaltyIntensity: 0,       // 惩罚强度（清零前的商单数）
    adOrdersPenaltyInterval: null      // 惩罚期专用定时器
};

// ==================== 成就列表 ====================
const achievements = [
    { id: 1, name: '初入江湖', desc: '获得第一个粉丝', icon: '🌱', unlocked: false }, { id: 2, name: '小有名气', desc: '粉丝达到1000', icon: '🌟', unlocked: false }, { id: 3, name: '网红达人', desc: '粉丝达到10万', icon: '⭐', unlocked: false }, { id: 4, name: '顶级流量', desc: '粉丝达到1000万', icon: '⭐', unlocked: false }, { id: 5, name: '爆款制造机', desc: '单条视频播放量破百万', icon: '🔥', unlocked: false }, { id: 6, name: '点赞狂魔', desc: '累计获得10万个赞', icon: '👍', unlocked: false }, { id: 7, name: '高产创作者', desc: '发布100个作品', icon: '📹', unlocked: false }, { id: 8, name: '直播新星', desc: '首次直播获得1000观看', icon: '📱', unlocked: false }, { id: 9, name: '收益第一桶金', desc: '获得首次收益', icon: '💰', unlocked: false }, { id: 10, name: '百万富翁', desc: '累计收益达到100万', icon: '💎', unlocked: false }, { id: 11, name: '话题之王', desc: '单条动态获得1万转发', icon: '🔁', unlocked: false }, { id: 12, name: '评论互动达人', desc: '单条作品获得5000评论', icon: '💬', unlocked: false }, { id: 13, name: '全勤主播', desc: '连续30天更新', icon: '📅', unlocked: false }, { id: 14, name: '逆风翻盘', desc: '从封号中申诉成功', icon: '🔄', unlocked: false }, { id: 15, name: '幸运儿', desc: '触发50次随机事件', icon: '🍀', unlocked: false }, { id: 16, name: '社交达人', desc: '关注1000个用户', icon: '👥', unlocked: false }, { id: 17, name: '夜猫子', desc: '凌晨3点还在直播', icon: '🦉', unlocked: false }, { id: 18, name: '早起鸟儿', desc: '早上6点开始直播', icon: '🐦', unlocked: false }, { id: 19, name: '宠粉狂魔', desc: '回复1000条评论', icon: '💖', unlocked: false }, { id: 20, name: '传奇主播', desc: '解锁所有成就', icon: '👑', unlocked: false }, { id: 21, name: '商单新人', desc: '完成首个商单', icon: '💼', unlocked: false }, { id: 22, name: '广告达人', desc: '完成10个商单', icon: '📢', unlocked: false }, { id: 23, name: '百万单王', desc: '单次商单收入超50万', icon: '💎', unlocked: false }, { id: 24, name: '火眼金睛', desc: '识别并拒绝5个违规商单', icon: '👁️', unlocked: false }, { id: 25, name: '商单大师', desc: '完成50个商单且未违规', icon: '👑', unlocked: false }
];

// ==================== 商单数据库 ====================
const adOrdersDB = [
    { id: 1, title: "健康饮品推广", content: "某知名品牌健康饮品，口感清爽，适合运动后的水分补充", reward: 5000, risk: 0, keyword: "" }, { id: 2, title: "学习APP推荐", content: "高效学习工具，帮助提升记忆力", reward: 8000, risk: 0, keyword: "" }, { id: 3, title: "生活用品测评", content: "日常好物分享，提升生活品质", reward: 12000, risk: 0, keyword: "" }, { id: 4, title: "投资理财课程", content: "零基础学理财，分享年化20%+的实战技巧", reward: 50000, risk: 0.7, keyword: "收益" }, { id: 5, title: "传统草本精华", content: "调节身体机能，效果因人而异，坚持服用见效", reward: 30000, risk: 0.6, keyword: "见效" }, { id: 6, title: "资金周转方案", content: "快速审批，灵活还款，解决短期资金需求", reward: 80000, risk: 0.9, keyword: "资金周转" }, { id: 7, title: "数字资产机遇", content: "新兴区块链项目，把握时代机遇", reward: 100000, risk: 0.85, keyword: "区块链" }, { id: 8, title: "美容护肤产品", content: "7天见证肌肤改变，独家生物科技配方", reward: 25000, risk: 0.65, keyword: "7天" }, { id: 9, title: "游戏陪玩平台", content: "边娱乐边创收，时间自由多劳多得", reward: 40000, risk: 0.5, keyword: "多劳多得" }, { id: 10, title: "海外好物分享", content: "原装进口，价格优惠，支持专柜验货", reward: 15000, risk: 0.4, keyword: "验货" }
];

// ==================== 随机事件 ====================
const randomEvents = [
    { type: 'good', title: '视频爆了！', desc: '你的视频被推荐到首页，播放量暴涨', effect: { views: 50000, fans: 5000, likes: 3000 } }, { type: 'good', title: '话题热搜', desc: '你的动态登上热搜榜', effect: { views: 20000, fans: 2000, likes: 1500 } }, { type: 'good', title: '大V转发', desc: '知名博主转发了你的作品', effect: { views: 30000, fans: 3000, likes: 2000 } }, { type: 'good', title: '粉丝福利', desc: '粉丝们给你刷了礼物', effect: { money: 1000, likes: 500 } }, { type: 'good', title: '品牌合作', desc: '有品牌找你合作推广', effect: { money: 5000, fans: 1000 } }, { type: 'bad', title: '内容争议', desc: '你的内容引发争议，有人举报', effect: { fans: -500, warnings: 1 } }, { type: 'bad', title: '黑粉攻击', desc: '有人组织黑粉攻击你的账号', effect: { fans: -1000, likes: -500 } }, { type: 'bad', title: '系统误判', desc: '系统误判你的内容违规', effect: { warnings: 1 } }, { type: 'bad', title: '竞争对手', desc: '同类型主播抢走了你的流量', effect: { views: -10000, fans: -800 } }, { type: 'bad', title: '网络暴力', desc: '你被网暴了，心情低落', effect: { fans: -300, likes: -200 } }, { type: 'neutral', title: '平淡一天', desc: '今天没什么特别的事情发生', effect: {} }, { type: 'neutral', title: '粉丝互动', desc: '和粉丝们聊得很开心', effect: { likes: 100 } }, { type: 'neutral', title: '灵感枯竭', desc: '今天没有创作灵感', effect: {} }, { type: 'good', title: '技能提升', desc: '你学会了新的剪辑技巧', effect: { views: 5000 } }, { type: 'good', title: '设备升级', desc: '你购买了新的直播设备', effect: { fans: 800 } }, { type: 'bad', title: '设备故障', desc: '直播设备出现故障', effect: { fans: -200 } }, { type: 'good', title: '粉丝见面会', desc: '举办了粉丝见面会', effect: { fans: 2000, money: 2000 } }, { type: 'bad', title: '恶意投诉', desc: '有人恶意投诉你的直播', effect: { warnings: 1 } }, { type: 'good', title: '平台推荐', desc: '平台给你提供了推荐位', effect: { views: 40000, fans: 4000 } }, { type: 'bad', title: '算法调整', desc: '平台算法调整，流量下降', effect: { views: -15000 } }, { type: 'good', title: '病毒传播', desc: '你的视频成为病毒式传播', effect: { views: 100000, fans: 10000 } }, { type: 'bad', title: '版权争议', desc: '你的视频涉及版权问题', effect: { warnings: 2, views: -5000 } }, { type: 'good', title: '登上热搜', desc: '你的内容登上平台热搜榜，获得海量曝光', effect: { hotSearch: true } }, { type: 'good', title: '话题引爆', desc: '你制造的话题引发全网讨论', effect: { hotSearch: true } }, { type: 'good', title: '热搜第一', desc: '你的内容登上热搜榜第一名！', effect: { hotSearch: true } },
    { type: 'bad', title: '舆论风波', desc: '你被卷入舆论风波，粉丝开始流失', effect: { publicOpinion: true } },
    { type: 'bad', title: '负面新闻', desc: '关于你的负面新闻在网上传播', effect: { publicOpinion: true } },
    { type: 'bad', title: '争议言论', desc: '你的言论引发争议', effect: { publicOpinion: true } }
];

// ==================== 违规关键词 ====================
const violationKeywords = ['暴力', '色情', '政治', '谣言', '诈骗', '盗版', '侵权', '辱骂', '歧视', '毒品'];

// ==================== 基础工具函数 ====================
function formatNumber(num) {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
}

function formatTime(timestamp) {
    // 修改：基于游戏计时器的时间格式化
    const diff = gameTimer - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
    return `${Math.floor(minutes / 1440)}天前`;
}

function saveGame() {
    // 保存前更新计时器状态
    gameState.gameTimer = gameTimer;
    gameState.realStartTime = realStartTime;
    localStorage.setItem('streamerGameState', JSON.stringify(gameState));
}

// ==================== 游戏初始化 ====================
function initGame() {
    const saved = localStorage.getItem('streamerGameState');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            
            // 关键修复：必须检查用户名是否有效
            if (!gameState.username || typeof gameState.username !== 'string' || gameState.username.trim() === '') {
                console.warn('存档无效：用户名缺失或格式错误');
                localStorage.removeItem('streamerGameState');
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('mainPage').style.display = 'none';
                return;
            }
            
            // ==================== 存档兼容性处理 ====================
            // 检测旧存档（没有gameTimer字段）
            if (gameState.gameTimer === undefined) {
                console.log('检测到旧存档，正在转换时间格式...');
                
                // 计算从存档保存到现在真实经过的时间
                const now = Date.now();
                const realTimePassed = now - (gameState.realStartTime || now);
                
                // 将真实时间差转换为游戏计时器值
                gameTimer = (gameState.lastUpdateTime || 0) + realTimePassed;
                
                // 更新存档中的时间相关字段
                gameState.gameTimer = gameTimer;
                gameState.lastUpdateTime = gameState.lastUpdateTime || 0;
                gameState.lastWorkTime = gameState.lastWorkTime || gameState.gameStartTime || 0;
                gameState.gameStartTime = gameState.gameStartTime || 0;
                gameState.isDroppingFansFromInactivity = gameState.isDroppingFansFromInactivity || false;
                gameState.inactivityDropInterval = gameState.inactivityDropInterval || null;
                gameState.inactivityWarningShown = gameState.inactivityWarningShown || false;
                gameState.highAdCountDropInterval = gameState.highAdCountDropInterval || null;
                gameState.highAdCountWarningShown = gameState.highAdCountWarningShown || false;
                
                console.log(`存档转换完成：游戏计时器已恢复为 ${Math.floor(gameTimer / 1000)} 秒`);
            } else {
                // 新存档：直接恢复计时器
                gameTimer = gameState.gameTimer || 0;
            }
            
            // 重置真实时间基准
            realStartTime = Date.now();
            
            // 重置定时器引用
            gameState.liveInterval = null; 
            gameState.workUpdateIntervals = []; 
            gameState.banInterval = null; 
            gameState.banDropInterval = null; 
            gameState.hotSearchInterval = null;
            gameState.publicOpinionInterval = null;
            
            // ==================== 核心修复：恢复不更新掉粉定时器 ====================
            // 必须在存档兼容性处理之后执行
            // 修复：无论 isDroppingFansFromInactivity 状态如何，只要满足条件就启动定时器
            const daysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
            if (daysSinceLastWork >= 7) {
                console.log(`检测到已超时${Math.floor(daysSinceLastWork)}天，恢复掉粉定时器...`);
                // 先重置状态，再重新启动
                gameState.isDroppingFansFromInactivity = false;
                if (gameState.inactivityDropInterval) {
                    clearInterval(gameState.inactivityDropInterval);
                    gameState.inactivityDropInterval = null;
                }
                // 立即重新启动掉粉检查
                if (typeof checkInactivityPenalty === 'function') {
                    checkInactivityPenalty();
                }
            }
            
            // 扩展图表数据到60天
            if (gameState.chartData) {
                if (gameState.chartData.fans.length === 0) {
                    for (let i = 0; i < 60; i++) {
                        gameState.chartData.fans.push(0);
                        gameState.chartData.likes.push(0);
                        gameState.chartData.views.push(0);
                        gameState.chartData.interactions.push(0);
                    }
                    // 新增：初始化元数据
                    gameState.chartData.currentIndex = 0;
                    gameState.chartData.currentDay = 0;
                } else {
                    if (gameState.chartData.fans.length < 60) {
                        const oldLength = gameState.chartData.fans.length;
                        for (let i = oldLength; i < 60; i++) {
                            gameState.chartData.fans.unshift(0);
                            gameState.chartData.likes.unshift(0);
                            gameState.chartData.views.unshift(0);
                            gameState.chartData.interactions.unshift(0);
                        }
                    }
                    if (!gameState.chartData.interactions || gameState.chartData.interactions.length < 60) {
                        gameState.chartData.interactions = [];
                        for (let i = 0; i < 60; i++) {
                            gameState.chartData.interactions.push(0);
                        }
                    }
                    // 新增：为旧存档添加元数据
                    if (gameState.chartData.currentIndex === undefined) {
                        const virtualDays = Math.floor(getVirtualDaysPassed());
                        gameState.chartData.currentIndex = (virtualDays - 1) % 60;
                        gameState.chartData.currentDay = virtualDays - 1;
                    }
                }
            }
            
            // 恢复图表实例
            window.charts = { fans: null, likes: null, views: null, interactions: null };
            
            // 恢复UI状态
            if (gameState.isBanned && gameState.banStartTime !== null) {
                // 转换封禁开始时间
                const banStartTimer = gameState.banStartTime;
                const timePassed = gameTimer - banStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showBanNotice === 'function') {
                    // 临时使用游戏计时器计算
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showBanNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
            }
            
            if (gameState.isHotSearch && gameState.hotSearchStartTime !== null) {
                // 转换热搜开始时间
                const hotSearchStartTimer = gameState.hotSearchStartTime;
                const timePassed = gameTimer - hotSearchStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showHotSearchNotice === 'function') {
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showHotSearchNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
                
                if (!gameState.hotSearchInterval) {
                    gameState.hotSearchInterval = setInterval(() => {
                        if (gameState.isHotSearch) {
                            const fanGrowth = Math.floor(Math.random() * 100) + 50;
                            gameState.fans += fanGrowth;
                            if (typeof showNotification === 'function') {
                                showNotification('热搜效应', `热搜期间获得${fanGrowth}新粉丝`);
                            }
                            if (typeof updateDisplay === 'function') updateDisplay();
                        }
                    }, 1000);
                }
            }
            
            if (gameState.isPublicOpinionCrisis && gameState.publicOpinionStartTime !== null) {
                // 转换舆论危机开始时间
                const publicOpinionStartTimer = gameState.publicOpinionStartTime;
                const timePassed = gameTimer - publicOpinionStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showPublicOpinionNotice === 'function') {
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showPublicOpinionNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
                
                if (!gameState.publicOpinionInterval) {
                    gameState.publicOpinionInterval = setInterval(() => {
                        if (gameState.isPublicOpinionCrisis && gameState.fans > 0) {
                            const fanLoss = Math.floor(Math.random() * 50) + 10;
                            gameState.fans = Math.max(0, gameState.fans - fanLoss);
                            if (typeof showNotification === 'function') {
                                showNotification('舆论风波', `舆论风波中，粉丝流失：${fanLoss}`);
                            }
                            if (typeof updateDisplay === 'function') updateDisplay();
                        }
                    }, 1000);
                }
            }
            
            // 恢复流量推广定时器
            Object.keys(gameState.trafficWorks).forEach(workIdStr => {
                const workId = Number(workIdStr);
                const trafficData = gameState.trafficWorks[workIdStr];
                if (trafficData && trafficData.isActive) {
                    // 转换推广开始时间
                    const trafficStartTimer = trafficData.startTime;
                    const timePassed = gameTimer - trafficStartTimer;
                    const daysPassed = timePassed / VIRTUAL_DAY_MS;
                    
                    if (typeof startTrafficProcess === 'function') {
                        // 临时覆盖getVirtualDaysPassed
                        const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                        getVirtualDaysPassed = () => daysPassed;
                        startTrafficProcess(workId);
                        getVirtualDaysPassed = originalGetVirtualDaysPassed;
                    }
                }
            });
            
            // 恢复开发者模式UI
            if (gameState.devMode) {
                const devBtn = document.getElementById('devFloatButton');
                if (devBtn) devBtn.style.display = 'block';
            }
            
            // ========== 新增：恢复商单惩罚状态 ==========
            if (gameState.adOrdersPenaltyActive && gameState.adOrdersPenaltyEndTime > gameTimer) {
                console.log('恢复商单惩罚状态');
                checkHighAdCountPenalty(); // 重新启动惩罚定时器
            } else if (gameState.adOrdersPenaltyActive && gameState.adOrdersPenaltyEndTime <= gameTimer) {
                // 惩罚已过期（比如用户离线超过惩罚期）
                gameState.adOrdersPenaltyActive = false;
                gameState.adOrdersPenaltyIntensity = 0;
                if (gameState.adOrdersPenaltyInterval) {
                    clearInterval(gameState.adOrdersPenaltyInterval);
                    gameState.adOrdersPenaltyInterval = null;
                }
            }
            
        } catch (error) {
            console.error('加载存档失败:', error);
            localStorage.removeItem('streamerGameState');
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainPage').style.display = 'none';
            return;
        }
    } else {
        // 新游戏：初始化计时器
        gameTimer = 0;
        gameState.gameTimer = 0;
        gameState.lastUpdateTime = 0;
        gameState.lastWorkTime = 0;
        gameState.gameStartTime = 0;
        realStartTime = Date.now();
        
        // 初始化60天图表数据
        for (let i = 0; i < 60; i++) {
            gameState.chartData.fans.push(0);
            gameState.chartData.likes.push(0);
            gameState.chartData.views.push(0);
            gameState.chartData.interactions.push(0);
        }
        // 新增：初始化元数据
        gameState.chartData.currentIndex = 0;
        gameState.chartData.currentDay = 0;
        
        // 初始化开发者模式为关闭
        gameState.devMode = false;
    }
    
    if (!gameState.userId) {
        gameState.userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    // 启动计时器
    startGameTimer();
    
    const liveBtn = document.getElementById('liveControlBtn');
    if (liveBtn) {
        liveBtn.style.display = 'block';
        liveBtn.classList.toggle('active', gameState.liveStatus);
    }
    
    if (typeof updateDisplay === 'function') updateDisplay();
    if (typeof startWorkUpdates === 'function') startWorkUpdates();
    if (typeof startGameLoop === 'function') startGameLoop();
    
    saveGame();
}

// ==================== 游戏启动 ====================
function startGame() {
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) {
        console.error('用户名输入框未找到');
        return;
    }
    
    const username = usernameInput.value.trim();
    if (!username) { 
        alert('请输入你的名字'); 
        return; 
    }
    
    gameState.username = username;
    gameState.avatar = username.charAt(0).toUpperCase();
    
    const loginPage = document.getElementById('loginPage');
    const mainPage = document.getElementById('mainPage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'flex';
    
    // 新游戏初始化计时器
    gameTimer = 0;
    gameState.gameTimer = 0;
    gameState.lastUpdateTime = 0;
    gameState.lastWorkTime = 0;
    gameState.gameStartTime = 0;
    realStartTime = Date.now();
    
    initGame();
}

// ==================== 游戏重置功能 ====================
function resetGame() {
    // 停止游戏计时器
    stopGameTimer();
    
    // 停止所有定时器
    if (gameState.liveInterval) {
        clearInterval(gameState.liveInterval);
        gameState.liveInterval = null;
    }
    if (gameState.banInterval) {
        clearInterval(gameState.banInterval);
        gameState.banInterval = null;
    }
    if (gameState.banDropInterval) {
        clearInterval(gameState.banDropInterval);
        gameState.banDropInterval = null;
    }
    if (gameState.hotSearchInterval) {
        clearInterval(gameState.hotSearchInterval);
        gameState.hotSearchInterval = null;
    }
    if (gameState.publicOpinionInterval) {
        clearInterval(gameState.publicOpinionInterval);
        gameState.publicOpinionInterval = null;
    }
    if (gameState.inactivityDropInterval) {
        clearInterval(gameState.inactivityDropInterval);
        gameState.inactivityDropInterval = null;
    }
    if (gameState.highAdCountDropInterval) {
        clearInterval(gameState.highAdCountDropInterval);
        gameState.highAdCountDropInterval = null;
    }
    if (gameState.adOrdersPenaltyInterval) {  // 新增：清除商单惩罚定时器
        clearInterval(gameState.adOrdersPenaltyInterval);
        gameState.adOrdersPenaltyInterval = null;
    }
    
    // 停止流量推广定时器
    Object.keys(gameState.trafficWorks).forEach(workId => {
        const trafficData = gameState.trafficWorks[workId];
        if (trafficData && trafficData.interval) {
            clearInterval(trafficData.interval);
        }
    });
    
    // 停止图表刷新
    if (window.chartRefreshInterval) {
        clearInterval(window.chartRefreshInterval);
        window.chartRefreshInterval = null;
    }
    
    // 重置游戏状态对象
    gameState = {
        username: '', 
        userId: '', 
        avatar: '', 
        fans: 0, 
        likes: 0, 
        views: 0, 
        works: 0, 
        money: 0, 
        warnings: 0, 
        adOrders: [], 
        currentAdOrder: null, 
        rejectedAdOrders: 0, 
        isBanned: false, 
        banReason: '', 
        banDaysCount: 0, 
        banStartTime: null, // 改为游戏计时器时间
        isHotSearch: false, 
        hotSearchDaysCount: 0, 
        hotSearchStartTime: null, // 改为游戏计时器时间
        hotSearchInterval: null, 
        hotSearchTitle: '', 
        achievements: [], 
        worksList: [], 
        notifications: [], 
        liveStatus: false, 
        lastUpdateTime: 0, // 改为游戏计时器时间
        lastWorkTime: 0, // 新增
        isDroppingFansFromInactivity: false, // 新增
        inactivityDropInterval: null, // 新增
        inactivityWarningShown: false, // 新增
        highAdCountDropInterval: null, // 新增
        highAdCountWarningShown: false, // 新增
        gameStartTime: 0, // 改为游戏计时器时间
        chartData: { 
            fans: [], 
            likes: [], 
            views: [], 
            interactions: [],
            currentIndex: 0, // 新增
            currentDay: 0    // 新增
        }, 
        liveInterval: null, 
        workUpdateIntervals: [], 
        banInterval: null, 
        banDropInterval: null, 
        trafficWorks: {}, 
        totalInteractions: 0,
        activeFans: 0,
        appealAvailable: true, 
        adOrdersCount: 0, 
        isPublicOpinionCrisis: false, 
        publicOpinionDaysCount: 0, 
        publicOpinionStartTime: null, // 改为游戏计时器时间
        publicOpinionInterval: null, 
        publicOpinionTitle: '',
        devMode: false,
        gameTimer: 0, // 新增
        realStartTime: 0, // 新增
        // ========== 新增：重置商单惩罚状态 ==========
        adOrdersPenaltyActive: false,
        adOrdersPenaltyEndTime: 0,
        adOrdersPenaltyIntensity: 0,
        adOrdersPenaltyInterval: null
    };
    
    // 重置计时器
    gameTimer = 0;
    realStartTime = Date.now();
    
    // 重新初始化60天图表数据
    for (let i = 0; i < 60; i++) {
        gameState.chartData.fans.push(0);
        gameState.chartData.likes.push(0);
        gameState.chartData.views.push(0);
        gameState.chartData.interactions.push(0);
    }
    
    // 重置成就状态
    achievements.forEach(a => a.unlocked = false);
    
    // 重置图表实例
    window.charts = { fans: null, likes: null, views: null, interactions: null };
    
    return true;
}

// ==================== 页面加载 ====================
window.onload = function() { 
    try {
        // 检查是否有存档
        const saved = localStorage.getItem('streamerGameState');
        let hasValidSave = false;
        
        if (saved) {
            try {
                const savedState = JSON.parse(saved);
                if (savedState.username && typeof savedState.username === 'string' && savedState.username.trim() !== '') {
                    hasValidSave = true;
                } else {
                    console.warn('存档无效：用户名缺失或格式错误');
                    localStorage.removeItem('streamerGameState');
                }
            } catch (error) {
                console.error('解析存档失败:', error);
                localStorage.removeItem('streamerGameState');
            }
        }
        
        if (hasValidSave) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainPage').style.display = 'flex';
            initGame();
        } else {
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainPage').style.display = 'none';
        }
        
        // 防御性检查：确保modal元素存在再绑定事件
        const modalElement = document.getElementById('modal');
        if (modalElement) {
            modalElement.onclick = function(e) { 
                if (e.target === this) closeModal(); 
            };
        }
        
    } catch (error) {
        console.error('页面初始化失败:', error);
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainPage').style.display = 'none';
    }
};

// ==================== 窗口关闭前保存 ====================
window.addEventListener('beforeunload', function() {
    // 停止计时器
    stopGameTimer();
    // 最终保存
    saveGame();
});

// ==================== 全局函数绑定 ====================
window.gameState = gameState;
window.achievements = achievements;
window.adOrdersDB = adOrdersDB;
window.randomEvents = randomEvents;
window.violationKeywords = violationKeywords;
window.startGame = startGame;
window.initGame = initGame;
window.resetGame = resetGame;
window.gameTimer = gameTimer;
window.startGameTimer = startGameTimer;
window.stopGameTimer = stopGameTimer;
window.getVirtualDaysPassed = getVirtualDaysPassed;

console.log('游戏核心已加载，startGame函数:', typeof startGame);
