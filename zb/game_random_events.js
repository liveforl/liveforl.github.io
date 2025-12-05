// ==================== 随机事件数据 ====================
const randomEvents = [
    // ========== 修改：视频推荐类事件 ==========
    { type: 'good', title: '视频爆了！', desc: '你的视频被推荐到首页，播放量暴涨', effect: { recommendVideo: true, duration: 1 } }, 
    { type: 'good', title: '病毒传播', desc: '你的视频成为病毒式传播', effect: { recommendVideo: true, duration: 1 } }, 
    
    // ========== 修改：动态热搜类事件 ==========
    { type: 'good', title: '话题热搜', desc: '你的动态登上热搜榜', effect: { hotPost: true, duration: 1 } }, 
    { type: 'good', title: '话题引爆', desc: '你制造的话题引发全网讨论', effect: { hotPost: true, duration: 1 } }, 
    { type: 'good', title: '热搜第一', desc: '你的内容登上热搜榜第一名！', effect: { hotPost: true, duration: 1 } },
    
    // ========== 新增：品牌合作事件 ==========
    { type: 'good', title: '品牌合作', desc: '有品牌找你合作推广', effect: { brandDeal: true } }, 
    
    // ========== 修改：争议类事件（不删除视频） ==========
    { type: 'bad', title: '内容争议', desc: '你的内容引发争议，有人举报', effect: { controversial: true, duration: 1, addWarning: true } }, 
    { type: 'bad', title: '网络暴力', desc: '你被网暴了，心情低落', effect: { controversial: true, duration: 2, addWarning: false } }, 
    
    // ========== 修改：删除视频类事件 ==========
    { type: 'bad', title: '系统误判', desc: '系统误判你的内容违规', effect: { removeVideo: true, addWarning: true } }, 
    { type: 'bad', title: '版权争议', desc: '你的视频涉及版权问题', effect: { removeVideo: true, addWarning: true } }, 
    
    // ========== 保持不变的其它事件 ==========
    { type: 'good', title: '大V转发', desc: '知名博主转发了你的作品', effect: { views: 30000, fans: 3000, likes: 2000 } }, 
    { type: 'good', title: '粉丝福利', desc: '粉丝们给你刷了礼物', effect: { money: 1000, likes: 500 } }, 
    { type: 'bad', title: '黑粉攻击', desc: '有人组织黑粉攻击你的账号', effect: { fans: -1000, likes: -500 } }, 
    { type: 'bad', title: '竞争对手', desc: '同类型主播抢走了你的流量', effect: { views: -10000, fans: -800 } }, 
    { type: 'neutral', title: '平淡一天', desc: '今天没什么特别的事情发生', effect: {} }, 
    { type: 'neutral', title: '粉丝互动', desc: '和粉丝们聊得很开心', effect: { likes: 100 } }, 
    { type: 'neutral', title: '灵感枯竭', desc: '今天没有创作灵感', effect: {} }, 
    { type: 'good', title: '技能提升', desc: '你学会了新的剪辑技巧', effect: { views: 5000 } }, 
    { type: 'good', title: '设备升级', desc: '你购买了新的直播设备', effect: { fans: 800 } }, 
    { type: 'bad', title: '设备故障', desc: '直播设备出现故障', effect: { fans: -200 } }, 
    { type: 'good', title: '粉丝见面会', desc: '举办了粉丝见面会', effect: { fans: 2000, money: 2000 } }, 
    { type: 'bad', title: '恶意投诉', desc: '有人恶意投诉你的直播', effect: { warnings: 1 } }, 
    { type: 'good', title: '平台推荐', desc: '平台给你提供了推荐位', effect: { views: 40000, fans: 4000 } }, 
    { type: 'bad', title: '算法调整', desc: '平台算法调整，流量下降', effect: { views: -15000 } }, 
    { type: 'bad', title: '负面新闻', desc: '关于你的负面新闻在网上传播', effect: { publicOpinion: true } },
    { type: 'bad', title: '争议言论', desc: '你的言论引发争议', effect: { publicOpinion: true } }
];

// ==================== 随机事件处理函数（核心修改版） ====================
function handleRandomEvent(event) {
    let message = event.desc;
    let targetWork = null;
    
    // ========== 处理视频推荐事件 ==========
    if (event.effect.recommendVideo) {
        const videos = gameState.worksList.filter(w => w.type === 'video' && !w.isPrivate);
        if (videos.length > 0) {
            targetWork = videos[Math.floor(Math.random() * videos.length)];
            targetWork.isRecommended = true;
            targetWork.recommendEndTime = gameTimer + (event.effect.duration * VIRTUAL_DAY_MS);
            message = `视频《${targetWork.title || targetWork.content.substring(0, 20)}...》${event.desc}`;
            showNotification(event.title, message);
            startRecommendEffect(targetWork.id, event.effect.duration);
        } else {
            showNotification(event.title, '你还没有可推荐的视频作品');
        }
    }
    
    // ========== 处理动态热搜事件 ==========
    else if (event.effect.hotPost) {
        const posts = gameState.worksList.filter(w => w.type === 'post' && !w.isPrivate);
        if (posts.length > 0) {
            targetWork = posts[Math.floor(Math.random() * posts.length)];
            targetWork.isHot = true;
            targetWork.hotEndTime = gameTimer + (event.effect.duration * VIRTUAL_DAY_MS);
            message = `动态《${targetWork.content.substring(0, 20)}...》登上热搜！`;
            showNotification(event.title, message);
            startPostHotEffect(targetWork.id, event.effect.duration);
        } else {
            showNotification(event.title, '你还没有可上热搜的动态');
        }
    }
    
    // ========== 处理品牌合作事件 ==========
    else if (event.effect.brandDeal) {
        generateBrandDeal();
        message = '有新的品牌合作机会，请在商单中心查看！';
        showNotification(event.title, message);
    }
    
    // ========== 处理争议事件 ==========
    else if (event.effect.controversial) {
        const videos = gameState.worksList.filter(w => w.type === 'video' && !w.isPrivate && !w.isControversial);
        if (videos.length > 0) {
            targetWork = videos[Math.floor(Math.random() * videos.length)];
            targetWork.isControversial = true;
            targetWork.controversyEndTime = gameTimer + (event.effect.duration * VIRTUAL_DAY_MS);
            message = `视频《${targetWork.title || targetWork.content.substring(0, 20)}...》${event.desc}`;
            showNotification(event.title, message);
            startControversyEffect(targetWork.id, event.effect.duration);
            if (event.effect.addWarning) {
                gameState.warnings = Math.min(20, gameState.warnings + 1);
                showWarning(`内容违规，警告${gameState.warnings}/20次`);
            }
        } else {
            showNotification(event.title, '没有合适的视频可触发争议');
        }
    }
    
    // ========== 处理删除视频事件 ==========
    else if (event.effect.removeVideo) {
        const videos = gameState.worksList.filter(w => w.type === 'video' && !w.isPrivate);
        if (videos.length > 0) {
            targetWork = videos[Math.floor(Math.random() * videos.length)];
            const workIndex = gameState.worksList.findIndex(w => w.id === targetWork.id);
            gameState.views = Math.max(0, gameState.views - targetWork.views);
            gameState.likes = Math.max(0, gameState.likes - targetWork.likes);
            const interactionCount = targetWork.comments + targetWork.likes + targetWork.shares;
            gameState.totalInteractions = Math.max(0, gameState.totalInteractions - interactionCount);
            gameState.worksList.splice(workIndex, 1);
            message = `视频《${targetWork.title || targetWork.content.substring(0, 20)}...》因${event.desc}被删除`;
            showNotification(event.title, message);
            if (event.effect.addWarning) {
                gameState.warnings = Math.min(20, gameState.warnings + 1);
                showWarning(`内容违规，警告${gameState.warnings}/20次`);
            }
        } else {
            showNotification(event.title, '没有可删除的视频');
        }
    }
    
    // ========== 处理原有直接效果事件 ==========
    else {
        if (event.effect.fans) gameState.fans = Math.max(0, gameState.fans + event.effect.fans);
        if (event.effect.likes) gameState.likes = Math.max(0, gameState.likes + event.effect.likes);
        if (event.effect.views) gameState.views = Math.max(0, gameState.views + event.effect.views);
        if (event.effect.money) gameState.money = Math.max(0, gameState.money + event.effect.money);
        if (event.effect.warnings) gameState.warnings = Math.min(20, gameState.warnings + event.effect.warnings);
        if (event.effect.hotSearch) startHotSearch(event.title);
        if (event.effect.publicOpinion) startPublicOpinionCrisis(event.title);
        showNotification(event.title, event.desc);
    }
    
    if (!gameState.isBanned && gameState.warnings >= 20) banAccount('多次违反社区规定');
    if (typeof updateDisplay === 'function') updateDisplay();
    if (typeof updateWorksList === 'function') updateWorksList();
}

// ==================== 新增：视频推荐效果 ==========
function startRecommendEffect(workId, durationDays) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRecommended) return;
    
    if (work.recommendInterval) clearInterval(work.recommendInterval);
    
    work.recommendInterval = setInterval(() => {
        if (gameTimer >= work.recommendEndTime) {
            endRecommendEffect(workId);
            return;
        }
        
        const viewsBoost = Math.floor(Math.random() * 4000) + 1000;
        work.views += viewsBoost;
        gameState.views += viewsBoost;
        
        const fanBoost = Math.floor(Math.random() * 40) + 10;
        gameState.fans += fanBoost;
        
        const likesBoost = Math.floor(Math.random() * 50) + 10;
        work.likes += likesBoost;
        gameState.likes += likesBoost;
        
        updateDisplay();
        updateWorksList();
    }, 1000);
}

function endRecommendEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRecommended) return;
    
    if (work.recommendInterval) clearInterval(work.recommendInterval);
    work.isRecommended = false;
    work.recommendEndTime = null;
    
    showNotification('推荐结束', `视频《${work.title || work.content.substring(0, 20)}...》的热度推荐已结束`);
    updateDisplay();
    updateWorksList();
}

// ==================== 新增：动态热搜效果 ==========
function startPostHotEffect(workId, durationDays) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHot) return;
    
    if (work.hotInterval) clearInterval(work.hotInterval);
    
    work.hotInterval = setInterval(() => {
        if (gameTimer >= work.hotEndTime) {
            endPostHotEffect(workId);
            return;
        }
        
        const viewsBoost = Math.floor(Math.random() * 1500) + 500;
        work.views += viewsBoost;
        
        const fanBoost = Math.floor(Math.random() * 25) + 5;
        gameState.fans += fanBoost;
        
        const likesBoost = Math.floor(Math.random() * 30) + 5;
        const commentsBoost = Math.floor(Math.random() * 10) + 2;
        work.likes += likesBoost;
        work.comments += commentsBoost;
        gameState.likes += likesBoost;
        
        updateDisplay();
        updateWorksList();
    }, 1000);
}

function endPostHotEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHot) return;
    
    if (work.hotInterval) clearInterval(work.hotInterval);
    work.isHot = false;
    work.hotEndTime = null;
    
    showNotification('热搜结束', `动态《${work.content.substring(0, 20)}...》的热搜已结束`);
    updateDisplay();
    updateWorksList();
}

// ==================== 新增：争议效果（每秒掉粉） ==========
function startControversyEffect(workId, durationDays) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isControversial) return;
    
    if (work.controversyInterval) clearInterval(work.controversyInterval);
    
    work.controversyInterval = setInterval(() => {
        if (gameTimer >= work.controversyEndTime) {
            endControversyEffect(workId);
            return;
        }
        
        const fanLoss = Math.floor(Math.random() * 30) + 20;
        gameState.fans = Math.max(0, gameState.fans - fanLoss);
        
        if (work.likes > 0) {
            const likesLoss = Math.floor(Math.random() * 10) + 1;
            work.likes = Math.max(0, work.likes - likesLoss);
            gameState.likes = Math.max(0, gameState.likes - likesLoss);
        }
        
        if (Math.random() < 0.2) {
            showNotification('争议持续', `视频争议中，粉丝持续流失：-${fanLoss}`);
        }
        
        updateDisplay();
        updateWorksList();
    }, 1000);
}

function endControversyEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isControversial) return;
    
    if (work.controversyInterval) clearInterval(work.controversyInterval);
    work.isControversial = false;
    work.controversyEndTime = null;
    
    showNotification('争议平息', `视频《${work.title || work.content.substring(0, 20)}...》的争议已平息`);
    updateDisplay();
    updateWorksList();
}

// ==================== 新增：生成品牌合作 ==========
function generateBrandDeal() {
    const brands = ['知名品牌', '热门品牌', '新兴品牌', '国际大牌', '国货之光'];
    const products = ['健康饮品', '学习APP', '生活用品', '美容护肤', '游戏周边'];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const reward = Math.floor(Math.random() * 50000) + 5000;
    
    gameState.pendingBrandDeal = {
        id: Date.now(),
        title: `${brand}${product}推广`,
        content: `${brand}推出新款${product}，邀请你进行体验推广，要求真实体验分享`,
        actualReward: reward,
        risk: 0.2,
        isBrandDeal: true,
        status: 'pending'
    };
    
    showNotification('品牌合作', `你有新的品牌合作机会：${gameState.pendingBrandDeal.title}，报酬${reward}元`);
}

// ==================== 全局函数绑定 ====================
window.randomEvents = randomEvents;
window.handleRandomEvent = handleRandomEvent;
window.startRecommendEffect = startRecommendEffect;
window.endRecommendEffect = endRecommendEffect;
window.startPostHotEffect = startPostHotEffect;
window.endPostHotEffect = endPostHotEffect;
window.startControversyEffect = startControversyEffect;
window.endControversyEffect = endControversyEffect;
window.generateBrandDeal = generateBrandDeal;
