// ==================== 虚拟时间机制 ====================
const VIRTUAL_DAY_MS = 1 * 60 * 1000;
const VIRTUAL_MONTH_DAYS = 30;
const VIRTUAL_YEAR_DAYS = 365;

const VIRTUAL_HOUR_MS = VIRTUAL_DAY_MS / 24;
const VIRTUAL_MINUTE_MS = VIRTUAL_HOUR_MS / 60;
const VIRTUAL_SECOND_MS = VIRTUAL_MINUTE_MS / 60;

window.charts = {
    fans: null,
    likes: null,
    views: null,
    interactions: null
};

// ==================== 虚拟日期系统 ====================
const GAME_START_VIRTUAL_DATE = {
    year: 2025,
    month: 1,
    day: 1
};

function getVirtualDate() {
    const totalDays = Math.floor(getVirtualDaysPassed());
    const currentYear = GAME_START_VIRTUAL_DATE.year + Math.floor(totalDays / 365);
    const dayOfYear = totalDays % 365;
    
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let remainingDays = dayOfYear;
    let month = 0;
    
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            month = i;
            break;
        }
        remainingDays -= monthDays[i];
    }
    
    const timeInDay = gameTimer % VIRTUAL_DAY_MS;
    const hours = Math.floor(timeInDay / VIRTUAL_HOUR_MS);
    const minutes = Math.floor((timeInDay % VIRTUAL_HOUR_MS) / VIRTUAL_MINUTE_MS);
    const seconds = Math.floor((timeInDay % VIRTUAL_MINUTE_MS) / VIRTUAL_SECOND_MS);
    
    return {
        year: currentYear,
        month: month + 1,
        day: remainingDays + 1,
        totalDays: totalDays,
        totalMonths: Math.floor(totalDays / 30),
        totalYears: Math.floor(totalDays / 365),
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        formattedTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
}

function formatVirtualDate(short = false) {
    const date = getVirtualDate();
    if (short) {
        return `${date.year}年${String(date.month).padStart(2, '0')}月${String(date.day).padStart(2, '0')}日 ${date.formattedTime}`;
    }
    return `虚拟${date.year}年${date.month}月${date.day}日 ${date.formattedTime}`;
}

// ==================== 核心计时器系统 ====================
let gameTimer = 0;
let realStartTime = Date.now();
let timerInterval = null;

function startGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - realStartTime;
        gameTimer += delta;
        window.gameTimer = gameTimer; // ✅ 修复2：计时器循环中同步
        realStartTime = now;
        saveGame();
    }, 1000);
}

function stopGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

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
    avatarImage: '', // 新增：存储base64图片数据
    fans: 0, 
    likes: 0, 
    views: 0, 
    works: 0, 
    money: 0, 
    warnings: 0, 
    isBanned: false, 
    banReason: '', 
    banDaysCount: 0, 
    banStartTime: null,
    isHotSearch: false, 
    hotSearchDaysCount: 0, 
    hotSearchStartTime: null,
    hotSearchInterval: null, 
    hotSearchTitle: '', 
    
    // ✅ 修复：补充舆论风波系统缺失的初始状态
    isPublicOpinionCrisis: false,
    publicOpinionDaysCount: 0,
    publicOpinionStartTime: null,
    publicOpinionInterval: null,
    publicOpinionTitle: '',
    
    achievements: [], 
    worksList: [], 
    notifications: [], 
    liveStatus: false, 
    lastUpdateTime: 0,
    lastWorkTime: 0,
    isDroppingFansFromInactivity: false,
    inactivityDropInterval: null,
    inactivityWarningShown: false,
    highAdCountDropInterval: null,
    highAdCountWarningShown: false,
    gameStartTime: 0,
    chartData: { 
        fans: [], 
        likes: [], 
        views: [], 
        interactions: [],
        currentIndex: 0,
        currentDay: 0,
        lastInteractionTotal: 0
    }, 
    liveInterval: null, 
    workUpdateIntervals: [], 
    banInterval: null, 
    banDropInterval: null, 
    trafficWorks: {}, 
    totalInteractions: 0,
    activeFans: 0,
    appealAvailable: true, 
    devMode: false,
    gameTimer: 0,
    realStartTime: 0,
    // 新增虚假商单相关状态
    fakeAdPenalty: null,
    fakeAdPenaltyInterval: null,
    fakeAdBans: 0,
    monthsWithoutFakeAd: 0,
    lastCheckMonth: -1,
    
    // ✅ 新增功能：关注列表和评论点赞状态
    following: [], // 关注列表
    commentLikes: {}, // 记录用户点赞过的评论 {workId_commentId: true}
    
    // ✅ 新增：消息中心
    messages: [], // 消息列表：点赞、评论、转发等互动消息

    // ✅ 新增：私信系统状态
    privateMessageSystem: {
        conversations: [],
        unreadCount: 0,
        lastCheckTime: 0,
        generationInterval: null
    },
    
    // ✅ 新增：系统消息状态
    systemMessages: {
        unreadCount: 0,
        messages: [],
        hotSearchActiveWorks: []
    }
};

// ==================== 成就列表 ====================
const achievements = [
    { id: 1, name: '初入江湖', desc: '获得第一个粉丝', icon: '🌱', unlocked: false },
    { id: 2, name: '小有名气', desc: '粉丝达到1000', icon: '🌟', unlocked: false },
    { id: 3, name: '网红达人', desc: '粉丝达到10万', icon: '⭐', unlocked: false },
    { id: 4, name: '顶级流量', desc: '粉丝达到1000万', icon: '⭐', unlocked: false },
    { id: 5, name: '爆款制造机', desc: '单条视频播放量破百万', icon: '🔥', unlocked: false },
    { id: 6, name: '点赞狂魔', desc: '累计获得10万个赞', icon: '👍', unlocked: false },
    { id: 7, name: '高产创作者', desc: '发布100个作品', icon: '📹', unlocked: false },
    { id: 8, name: '直播新星', desc: '首次直播获得1000观看', icon: '📱', unlocked: false },
    { id: 9, name: '收益第一桶金', desc: '获得首次收益', icon: '💰', unlocked: false },
    { id: 10, name: '百万富翁', desc: '累计收益达到100万', icon: '💎', unlocked: false },
    { id: 11, name: '话题之王', desc: '单条动态获得1万转发', icon: '🔁', unlocked: false },
    { id: 12, name: '评论互动达人', desc: '单条作品获得5000评论', icon: '💬', unlocked: false },
    { id: 13, name: '全勤主播', desc: '连续30天更新', icon: '📅', unlocked: false },
    { id: 14, name: '逆风翻盘', desc: '从封号中申诉成功', icon: '🔄', unlocked: false },
    { id: 15, name: '幸运儿', desc: '触发50次随机事件', icon: '🍀', unlocked: false },
    { id: 16, name: '社交达人', desc: '关注1000个用户', icon: '👥', unlocked: false },
    { id: 17, name: '夜猫子', desc: '凌晨3点还在直播', icon: '🦉', unlocked: false },
    { id: 18, name: '早起鸟儿', desc: '早上6点开始直播', icon: '🐦', unlocked: false },
    { id: 19, name: '宠粉狂魔', desc: '回复1000条评论', icon: '💖', unlocked: false },
    { id: 20, name: '传奇主播', desc: '解锁所有成就', icon: '👑', unlocked: false }
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
    const diff = gameTimer - timestamp;
    if (diff < 0) return '未来';
    
    const virtualMinutes = Math.floor(diff / VIRTUAL_MINUTE_MS);
    const virtualHours = Math.floor(diff / VIRTUAL_HOUR_MS);
    const virtualDays = Math.floor(diff / VIRTUAL_DAY_MS);
    
    if (virtualMinutes < 1) return '刚刚';
    if (virtualMinutes < 60) return `${virtualMinutes}分钟前`;
    if (virtualHours < 24) return `${virtualHours}小时前`;
    return `${virtualDays}天前`;
}

function saveGame() {
    // 保存前清理私信
    if (typeof cleanupPrivateMessages === 'function') {
        cleanupPrivateMessages();
    }
    
    gameState.gameTimer = gameTimer;
    gameState.realStartTime = realStartTime;
    localStorage.setItem('streamerGameState', JSON.stringify(gameState));
}

// ==================== 游戏初始化 ====================
function initGame() {
    // ✅ 修复：确保所有舆论风波属性存在（防止undefined导致toggle异常）
    if (gameState.isPublicOpinionCrisis === undefined) gameState.isPublicOpinionCrisis = false;
    if (gameState.publicOpinionDaysCount === undefined) gameState.publicOpinionDaysCount = 0;
    if (gameState.publicOpinionStartTime === undefined) gameState.publicOpinionStartTime = null;
    if (gameState.publicOpinionInterval === undefined) gameState.publicOpinionInterval = null;
    if (gameState.publicOpinionTitle === undefined) gameState.publicOpinionTitle = '';
    
    // 初始化头像图片状态
    if (gameState.avatarImage === undefined) gameState.avatarImage = '';
    
    // ✅ 新增功能：初始化状态和列表
    if (gameState.following === undefined) gameState.following = [];
    if (gameState.commentLikes === undefined) gameState.commentLikes = {};
    
    // ✅ 新增：初始化消息列表
    if (gameState.messages === undefined) gameState.messages = [];
    
    // ✅ 新增：初始化私信系统
    if (gameState.privateMessageSystem === undefined) {
        gameState.privateMessageSystem = {
            conversations: [],
            unreadCount: 0,
            lastCheckTime: 0,
            generationInterval: null
        };
    }
    
    // ✅ 新增：初始化系统消息状态
    if (gameState.systemMessages === undefined) {
        gameState.systemMessages = {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: []
        };
    }
    
    const saved = localStorage.getItem('streamerGameState');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            
            if (!gameState.username || typeof gameState.username !== 'string' || gameState.username.trim() === '') {
                console.warn('存档无效：用户名缺失或格式错误');
                localStorage.removeItem('streamerGameState');
                showAlert('存档无效，数据已清除', '错误');
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('mainPage').style.display = 'none';
                return;
            }
            
            if (gameState.gameTimer === undefined) {
                console.log('检测到旧存档，正在转换时间格式...');
                const now = Date.now();
                const realTimePassed = now - (gameState.realStartTime || now);
                gameTimer = (gameState.lastUpdateTime || 0) + realTimePassed;
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
                gameTimer = gameState.gameTimer || 0;
                window.gameTimer = gameTimer; // ✅ 修复1：加载存档时同步
            }
            
            realStartTime = Date.now();
            gameState.liveInterval = null; 
            gameState.workUpdateIntervals = []; 
            gameState.banInterval = null; 
            gameState.banDropInterval = null; 
            gameState.hotSearchInterval = null;
            gameState.publicOpinionInterval = null; // ✅ 修复：重置定时器引用
            
            // ✅ 新增功能：确保新状态存在
            if (gameState.following === undefined) gameState.following = [];
            if (gameState.commentLikes === undefined) gameState.commentLikes = {};
            
            // ✅ 新增：确保消息列表存在
            if (gameState.messages === undefined) gameState.messages = [];
            
            // ✅ 新增：确保私信系统存在
            if (gameState.privateMessageSystem === undefined) {
                gameState.privateMessageSystem = {
                    conversations: [],
                    unreadCount: 0,
                    lastCheckTime: 0,
                    generationInterval: null
                };
            }
            
            // ✅ 新增：确保系统消息状态存在
            if (gameState.systemMessages === undefined) {
                gameState.systemMessages = {
                    unreadCount: 0,
                    messages: [],
                    hotSearchActiveWorks: []
                };
            }
            
            if (gameState.chartData) {
                if (gameState.chartData.fans.length === 0) {
                    for (let i = 0; i < 60; i++) {
                        gameState.chartData.fans.push(0);
                        gameState.chartData.likes.push(0);
                        gameState.chartData.views.push(0);
                        gameState.chartData.interactions.push(0);
                    }
                    gameState.chartData.currentIndex = 0;
                    gameState.chartData.currentDay = 0;
                    gameState.chartData.lastInteractionTotal = 0;
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
                    if (gameState.chartData.currentIndex === undefined) {
                        const virtualDays = Math.floor(getVirtualDaysPassed());
                        gameState.chartData.currentIndex = (virtualDays - 1) % 60;
                        gameState.chartData.currentDay = virtualDays - 1;
                    }
                    if (gameState.chartData.lastInteractionTotal === undefined) {
                        gameState.chartData.lastInteractionTotal = gameState.totalInteractions || 0;
                    }
                }
            }
            
            window.charts = { fans: null, likes: null, views: null, interactions: null };
            
            if (gameState.achievements && gameState.achievements.length > 0) {
                console.log(`恢复${gameState.achievements.length}个已解锁成就`);
                gameState.achievements.forEach(achievementId => {
                    const achievement = achievements.find(a => a.id === achievementId);
                    if (achievement) {
                        achievement.unlocked = true;
                    }
                });
            } else {
                console.log('无成就需要恢复');
            }
            
            if (gameState.isBanned && gameState.banStartTime !== null) {
                const banStartTimer = gameState.banStartTime;
                const timePassed = gameTimer - banStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showBanNotice === 'function') {
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showBanNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
                
                if (!gameState.banInterval) {
                    gameState.banInterval = setInterval(() => {
                        if (gameState.isBanned && gameState.fans > 0) {
                            const fanLoss = Math.floor(Math.random() * 90) + 10;
                            gameState.fans = Math.max(0, gameState.fans - fanLoss);
                            showNotification('粉丝流失', `封禁期间粉丝流失：${fanLoss}`);
                            updateDisplay();
                        }
                    }, 1000);
                }
            }
            
            if (gameState.isHotSearch && gameState.hotSearchStartTime !== null) {
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
            
            // ✅ 修复：正确恢复舆论风波状态
            if (gameState.isPublicOpinionCrisis && gameState.publicOpinionStartTime !== null) {
                const timePassed = gameTimer - gameState.publicOpinionStartTime;
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
            
            Object.keys(gameState.trafficWorks).forEach(workIdStr => {
                const workId = Number(workIdStr);
                const trafficData = gameState.trafficWorks[workIdStr];
                if (trafficData && trafficData.isActive) {
                    const trafficStartTimer = trafficData.startTime;
                    const timePassed = gameTimer - trafficStartTimer;
                    const daysPassed = timePassed / VIRTUAL_DAY_MS;
                    
                    if (typeof startTrafficProcess === 'function') {
                        const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                        getVirtualDaysPassed = () => daysPassed;
                        startTrafficProcess(workId);
                        getVirtualDaysPassed = originalGetVirtualDaysPassed;
                    }
                }
            });
            
            if (gameState.devMode) {
                const devBtn = document.getElementById('devFloatButton');
                if (devBtn) devBtn.style.display = 'block';
            }
            
            console.log('开始恢复作品状态...');
            gameState.worksList.forEach(work => {
                if (work.isRecommended && work.recommendEndTime !== null) {
                    const timePassed = gameTimer - work.recommendEndTime;
                    const daysLeft = -timePassed / VIRTUAL_DAY_MS;
                    
                    if (daysLeft <= 0) {
                        console.log(`作品${work.id}的推荐状态已过期，清理状态`);
                        work.isRecommended = false;
                        work.recommendEndTime = null;
                        if (work.recommendInterval) {
                            clearInterval(work.recommendInterval);
                            work.recommendInterval = null;
                        }
                    } else {
                        console.log(`作品${work.id}的推荐状态恢复，剩余${daysLeft.toFixed(1)}天`);
                        if (typeof startRecommendEffect === 'function') {
                            startRecommendEffect(work.id, daysLeft, true);
                        }
                    }
                }
                
                if (work.isControversial && work.controversyEndTime !== null) {
                    const timePassed = gameTimer - work.controversyEndTime;
                    const daysLeft = -timePassed / VIRTUAL_DAY_MS;
                    
                    if (daysLeft <= 0) {
                        console.log(`作品${work.id}的争议状态已过期，清理状态`);
                        work.isControversial = false;
                        work.controversyEndTime = null;
                        if (work.controversyInterval) {
                            clearInterval(work.controversyInterval);
                            work.controversyInterval = null;
                        }
                    } else {
                        console.log(`作品${work.id}的争议状态恢复，剩余${daysLeft.toFixed(1)}天`);
                        if (typeof startControversyEffect === 'function') {
                            startControversyEffect(work.id, daysLeft, true);
                        }
                    }
                }
                
                if (work.isHot && work.hotEndTime !== null) {
                    const timePassed = gameTimer - work.hotEndTime;
                    const daysLeft = -timePassed / VIRTUAL_DAY_MS;
                    
                    if (daysLeft <= 0) {
                        console.log(`作品${work.id}的热搜状态已过期，清理状态`);
                        work.isHot = false;
                        work.hotEndTime = null;
                        if (work.hotInterval) {
                            clearInterval(work.hotInterval);
                            work.hotInterval = null;
                        }
                    } else {
                        console.log(`作品${work.id}的热搜状态恢复，剩余${daysLeft.toFixed(1)}天`);
                        if (typeof startPostHotEffect === 'function') {
                            startPostHotEffect(work.id, daysLeft, true);
                        }
                    }
                }
            });
            console.log('作品状态恢复完成');
            
            // ==================== 关键修复：游戏加载时恢复虚假商单惩罚 ====================
            if (typeof window.resumeFakeAdPenalty === 'function') {
                console.log('正在恢复虚假商单惩罚定时器...');
                setTimeout(() => {
                    window.resumeFakeAdPenalty();
                }, 1000); // 延迟1秒确保所有状态同步
            }
            
            // ✅ 新增：恢复热搜效果
            if (typeof window.resumeHotSearchEffects === 'function') {
                console.log('正在恢复热搜效果...');
                setTimeout(() => {
                    window.resumeHotSearchEffects();
                }, 1500);
            }
            
        } catch (error) {
            console.error('加载存档失败:', error);
            localStorage.removeItem('streamerGameState');
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainPage').style.display = 'none';
            return;
        }
    } else {
        gameTimer = 0;
        window.gameTimer = gameTimer; // ✅ 修复4：游戏开始时同步
        gameState.gameTimer = 0;
        gameState.lastUpdateTime = 0;
        gameState.lastWorkTime = 0;
        gameState.gameStartTime = 0;
        realStartTime = Date.now();
        
        for (let i = 0; i < 60; i++) {
            gameState.chartData.fans.push(0);
            gameState.chartData.likes.push(0);
            gameState.chartData.views.push(0);
            gameState.chartData.interactions.push(0);
        }
        gameState.chartData.currentIndex = 0;
        gameState.chartData.currentDay = 0;
        gameState.chartData.lastInteractionTotal = 0;
        
        gameState.devMode = false;
        // ✅ 新增功能：初始化新状态
        gameState.following = [];
        gameState.commentLikes = {};
        gameState.messages = [];
        gameState.privateMessageSystem = {
            conversations: [],
            unreadCount: 0,
            lastCheckTime: 0,
            generationInterval: null
        };
        // ✅ 新增：初始化系统消息状态
        gameState.systemMessages = {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: []
        };
    }
    
    if (!gameState.userId) {
        gameState.userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    startGameTimer();
    
    const liveBtn = document.getElementById('liveControlBtn');
    if (liveBtn) {
        liveBtn.style.display = 'block';
        liveBtn.classList.toggle('active', gameState.liveStatus);
    }
    
    if (typeof updateDisplay === 'function') updateDisplay();
    if (typeof startWorkUpdates === 'function') startWorkUpdates();
    if (typeof startGameLoop === 'function') startGameLoop();
    
    // ✅ 初始化私信系统
    if (typeof initPrivateMessageOnGameLoad === 'function') {
        initPrivateMessageOnGameLoad();
    }
    
    // ✅ 新增：初始化系统消息系统
    if (typeof initSystemMessages === 'function') {
        initSystemMessages();
    }
    
    saveGame();
    
    // 关键修复：确保 window.gameState 与局部变量同步
    window.gameState = gameState;
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
        showAlert('请输入你的名字', '提示');
        return; 
    }
    
    gameState.username = username;
    gameState.avatar = username.charAt(0).toUpperCase();
    
    const loginPage = document.getElementById('loginPage');
    const mainPage = document.getElementById('mainPage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'flex';
    
    gameTimer = 0;
    window.gameTimer = gameTimer; // ✅ 修复4：游戏开始时同步
    gameState.gameTimer = 0;
    gameState.lastUpdateTime = 0;
    gameState.lastWorkTime = 0;
    gameState.gameStartTime = 0;
    realStartTime = Date.now();
    
    initGame();
}

// ==================== 游戏重置功能 ====================
function resetGame() {
    stopGameTimer();
    
    const intervals = [
        'liveInterval',
        'banInterval', 
        'banDropInterval',
        'hotSearchInterval',
        'publicOpinionInterval', // ✅ 修复：清除舆论风波定时器
        'inactivityDropInterval',
        'highAdCountDropInterval'
    ];
    
    intervals.forEach(intervalName => {
        if (gameState[intervalName]) {
            clearInterval(gameState[intervalName]);
            gameState[intervalName] = null;
        }
    });
    
    Object.keys(gameState.trafficWorks).forEach(workId => {
        const trafficData = gameState.trafficWorks[workId];
        if (trafficData && trafficData.interval) {
            clearInterval(trafficData.interval);
        }
    });
    
    if (window.chartRefreshInterval) {
        clearInterval(window.chartRefreshInterval);
        window.chartRefreshInterval = null;
    }
    
    if (window.devCountdownInterval) {
        clearInterval(window.devCountdownInterval);
        window.devCountdownInterval = null;
    }
    
    // 清除虚假商单相关的定时器
    if (gameState.fakeAdPenaltyInterval) {
        clearInterval(gameState.fakeAdPenaltyInterval);
        gameState.fakeAdPenaltyInterval = null;
    }
    if (window.monthlyCheckInterval) {
        clearInterval(window.monthlyCheckInterval);
        window.monthlyCheckInterval = null;
    }
    if (window.exposureCheckInterval) {
        clearInterval(window.exposureCheckInterval);
        window.exposureCheckInterval = null;
    }
    
    // 清除私信生成定时器
    if (typeof stopPrivateMessageGeneration === 'function') {
        stopPrivateMessageGeneration();
    }
    
    // ✅ 新增：清除系统消息定时器
    if (typeof stopSystemMessagesTimer === 'function') {
        stopSystemMessagesTimer();
    }
    
    gameState = {
        username: '', 
        userId: '', 
        avatar: '', 
        avatarImage: '', // 重置图片头像
        fans: 0, 
        likes: 0, 
        views: 0, 
        works: 0, 
        money: 0, 
        warnings: 0, 
        isBanned: false, 
        banReason: '', 
        banDaysCount: 0, 
        banStartTime: null,
        isHotSearch: false, 
        hotSearchDaysCount: 0, 
        hotSearchStartTime: null,
        hotSearchInterval: null, 
        hotSearchTitle: '',
        
        // ✅ 修复：确保重置时包含舆论风波状态
        isPublicOpinionCrisis: false,
        publicOpinionDaysCount: 0,
        publicOpinionStartTime: null,
        publicOpinionInterval: null,
        publicOpinionTitle: '',
        
        achievements: [], 
        worksList: [], 
        notifications: [], 
        liveStatus: false, 
        lastUpdateTime: 0,
        lastWorkTime: 0,
        isDroppingFansFromInactivity: false,
        inactivityDropInterval: null,
        inactivityWarningShown: false,
        highAdCountDropInterval: null,
        highAdCountWarningShown: false,
        gameStartTime: 0,
        chartData: { 
            fans: [], 
            likes: [], 
            views: [], 
            interactions: [],
            currentIndex: 0,
            currentDay: 0,
            lastInteractionTotal: 0
        }, 
        liveInterval: null, 
        workUpdateIntervals: [], 
        banInterval: null, 
        banDropInterval: null, 
        trafficWorks: {}, 
        totalInteractions: 0,
        activeFans: 0,
        appealAvailable: true, 
        devMode: false,
        gameTimer: 0,
        realStartTime: 0,
        // 新增虚假商单相关状态
        fakeAdPenalty: null,
        fakeAdPenaltyInterval: null,
        fakeAdBans: 0,
        monthsWithoutFakeAd: 0,
        lastCheckMonth: -1,
        // ✅ 新增功能：重置新状态
        following: [],
        commentLikes: {},
        messages: [],
        privateMessageSystem: {
            conversations: [],
            unreadCount: 0,
            lastCheckTime: 0,
            generationInterval: null
        },
        // ✅ 新增：重置系统消息状态
        systemMessages: {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: []
        }
    };
    
    gameTimer = 0;
    window.gameTimer = gameTimer; // ✅ 修复3：重置时同步
    realStartTime = Date.now();
    
    for (let i = 0; i < 60; i++) {
        gameState.chartData.fans.push(0);
        gameState.chartData.likes.push(0);
        gameState.chartData.views.push(0);
        gameState.chartData.interactions.push(0);
    }
    gameState.chartData.currentIndex = 0;
    gameState.chartData.currentDay = 0;
    gameState.chartData.lastInteractionTotal = 0;
    
    achievements.forEach(a => a.unlocked = false);
    window.charts = { fans: null, likes: null, views: null, interactions: null };
    
    return true;
}

// ==================== 页面加载 ====================
window.onload = function() { 
    try {
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
    // 保存前清理私信
    if (typeof cleanupPrivateMessages === 'function') {
        cleanupPrivateMessages();
    }
    
    // ✅ 新增：停止系统消息定时器
    if (typeof stopSystemMessagesTimer === 'function') {
        stopSystemMessagesTimer();
    }
    
    stopGameTimer();
    saveGame();
});

// ==================== 全局函数绑定 ====================
window.gameState = gameState;
window.achievements = achievements;
window.violationKeywords = violationKeywords;
window.startGame = startGame;
window.initGame = initGame;
window.resetGame = resetGame;
window.gameTimer = gameTimer;
window.startGameTimer = startGameTimer;
window.stopGameTimer = stopGameTimer;
window.getVirtualDaysPassed = getVirtualDaysPassed;
window.formatVirtualDate = formatVirtualDate;
window.getVirtualDate = getVirtualDate;
window.saveGame = saveGame;
window.formatNumber = formatNumber;
window.formatTime = formatTime;

console.log('游戏核心已加载，startGame函数:', typeof startGame);
