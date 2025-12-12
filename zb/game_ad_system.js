// ==================== 商单系统模块 ====================
// 本模块包含所有与商业订单相关的功能
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS, violationKeywords)
// 依赖: game_ui.js (showNotification, showWarning, showAlert, updateDisplay, closeFullscreenPage)

// ==================== 商单数据库 ====================
window.adOrdersDB = [
    { id: 1, title: "健康饮品推广", content: "某知名品牌健康饮品，口感清爽，适合运动后的水分补充", reward: 5000, risk: 0, keyword: "" }, 
    { id: 2, title: "学习APP推荐", content: "高效学习工具，帮助提升记忆力", reward: 8000, risk: 0, keyword: "" }, 
    { id: 3, title: "生活用品测评", content: "日常好物分享，提升生活品质", reward: 12000, risk: 0, keyword: "" }, 
    { id: 4, title: "投资理财课程", content: "零基础学理财，分享年化20%+的实战技巧", reward: 50000, risk: 0.7, keyword: "收益" }, 
    { id: 5, title: "传统草本精华", content: "调节身体机能，效果因人而异，坚持服用见效", reward: 30000, risk: 0.6, keyword: "见效" }, 
    { id: 6, title: "资金周转方案", content: "快速审批，灵活还款，解决短期资金需求", reward: 80000, risk: 0.9, keyword: "资金周转" }, 
    { id: 7, title: "数字资产机遇", content: "新兴区块链项目，把握时代机遇", reward: 100000, risk: 0.85, keyword: "区块链" }, 
    { id: 8, title: "美容护肤产品", content: "7天见证肌肤改变，独家生物科技配方", reward: 25000, risk: 0.65, keyword: "7天" }, 
    { id: 9, title: "游戏陪玩平台", content: "边娱乐边创收，时间自由多劳多得", reward: 40000, risk: 0.5, keyword: "多劳多得" }, 
    { id: 10, title: "海外好物分享", content: "原装进口，价格优惠，支持专柜验货", reward: 15000, risk: 0.4, keyword: "验货" }
];

// ==================== 生成随机商单 ====================
window.generateAdOrder = function() {
    const ad = window.adOrdersDB[Math.floor(Math.random() * window.adOrdersDB.length)];
    return { 
        ...ad, 
        actualReward: Math.floor(Math.random() * (100000 - 500) + 500), 
        method: null, 
        time: window.gameTimer, 
        status: 'pending' 
    };
};

// ==================== 显示商单中心 ====================
window.showAdOrders = function() {
    if (!window.gameState) {
        console.error('gameState not available');
        return;
    }
    
    if (window.gameState.isBanned) { 
        if (typeof window.showWarning === 'function') {
            window.showWarning('账号被封禁，无法接单'); 
        }
        return; 
    }
    
    const content = document.getElementById('adOrdersPageContent');
    if (!content) {
        console.error('adOrdersPageContent element not found');
        return;
    }
    
    // 检查是否有待处理的品牌合作
    if (window.gameState.pendingBrandDeal && window.gameState.pendingBrandDeal.status === 'pending') {
        const brandDeal = window.gameState.pendingBrandDeal;
        const riskText = '风险等级：低';
        const riskColor = '#00f2ea';
        
        content.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; color: #fff; font-weight: bold; text-align: center;">
                🎉 品牌合作机会
            </div>
            <div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333; border-left: 4px solid #667eea;">
                <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${brandDeal.title}</div>
                <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${brandDeal.content}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${brandDeal.actualReward}元</div>
                    <div style="font-size:12px;color:${riskColor}">${riskText}</div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div class="action-btn" onclick="acceptBrandDeal()" style="flex: 1; background: #667eea;">
                    <div class="action-icon">✅</div>
                    <div class="action-text">接受合作</div>
                </div>
                <div class="action-btn" onclick="rejectBrandDeal()" style="flex: 1; background: #333;">
                    <div class="action-icon">❌</div>
                    <div class="action-text">拒绝合作</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center;">
                💡 品牌合作风险较低，但请确保内容真实
            </div>
        `;
    } else {
        // 显示普通商单
        const ad = window.generateAdOrder();
        window.gameState.currentAdOrder = ad;
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
    }
    
    const adOrdersPage = document.getElementById('adOrdersPage');
    if (adOrdersPage) {
        adOrdersPage.classList.add('active');
    }
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'none';
    }
};

// ==================== 选择发布方式 ====================
window.selectMethod = function(m) { 
    window.selectedMethod = m; 
    const form = document.getElementById('publishForm');
    if (form) form.style.display = 'block'; 
};

// ==================== 发布商单内容 ====================
window.publishAd = function() {
    const content = document.getElementById('adContent').value.trim();
    const ad = window.gameState.currentAdOrder;
    
    if (!content) { 
        if (typeof window.showAlert === 'function') {
            window.showAlert('请输入内容', '提示');
        }
        return; 
    }
    
    // 检查违规
    const hasViolationKeyword = window.violationKeywords && window.violationKeywords.some(k => content.includes(k));
    let hasViolation = hasViolationKeyword || Math.random() < ad.risk;
    if (ad.keyword && content.includes(ad.keyword)) hasViolation = true;
    
    if (hasViolation) {
        window.gameState.warnings = Math.min(20, window.gameState.warnings + Math.floor(Math.random() * 2) + 1);
        if (typeof window.showWarning === 'function') {
            window.showWarning(`商单内容违规，警告${window.gameState.warnings}/20次`);
        }
        if (window.gameState.warnings >= 20) {
            if (typeof window.banAccount === 'function') {
                window.banAccount('商单违规');
            }
        }
        window.gameState.rejectedAdOrders++;
        
        // 修复：违规后不再继续执行发布逻辑
        closeFullscreenPage('adOrders');
        updateDisplay();
        saveGame();
        return; // 添加这行
    }
    
    // 成功发布
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
        time: window.gameTimer, 
        isAd: true, 
        revenue: Math.floor((Math.random() * 15000 + 5000) / 1000), 
        isPrivate: false 
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    // 只统计视频和直播的播放量
    if (work.type === 'video' || work.type === 'live') {
        window.gameState.views += work.views;
    }
    
    window.gameState.likes += work.likes;
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5));
    window.gameState.money += ad.actualReward;
    window.gameState.adOrdersCount++;
    
    // 统计互动
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    // 粉丝疲劳检查
    if (window.gameState.adOrdersCount % 10 === 0) {
        const fanLoss = Math.floor(Math.random() * 1000) + 500;
        window.gameState.fans = Math.max(0, window.gameState.fans - fanLoss);
        if (typeof window.showNotification === 'function') {
            window.showNotification('粉丝疲劳', `长期接商单导致粉丝流失：${fanLoss}`);
        }
    }
    
    if (typeof window.showNotification === 'function') {
        window.showNotification('商单完成', `获得${ad.actualReward}元`);
    }
    
    // 检查成就
    checkAdAchievements();
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    // 检查高商单数惩罚
    if (typeof window.checkHighAdCountPenalty === 'function') {
        window.checkHighAdCountPenalty();
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
};

// ==================== 接受品牌合作 ====================
window.acceptBrandDeal = function() {
    if (!window.gameState.pendingBrandDeal || window.gameState.pendingBrandDeal.status !== 'pending') {
        if (typeof window.showWarning === 'function') {
            window.showWarning('没有待处理的品牌合作');
        }
        return;
    }
    
    const brandDeal = window.gameState.pendingBrandDeal;
    const content = document.getElementById('adOrdersPageContent');
    
    content.innerHTML = `
        <div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333; border-left: 4px solid #00f2ea;">
            <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${brandDeal.title}</div>
            <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${brandDeal.content}</div>
            <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${brandDeal.actualReward}元</div>
        </div>
        <div class="input-group">
            <div class="input-label">合作内容创作</div>
            <textarea class="text-input" id="brandAdContent" rows="6" placeholder="根据品牌要求进行内容创作，注意保持真实体验分享..." maxlength="300"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px;">
            <div class="action-btn" onclick="selectBrandMethod('video')" style="padding:10px">
                <div class="action-icon">🎬</div>
                <div class="action-text">视频</div>
            </div>
            <div class="action-btn" onclick="selectBrandMethod('post')" style="padding:10px">
                <div class="action-icon">📝</div>
                <div class="action-text">动态</div>
            </div>
            <div class="action-btn" onclick="selectBrandMethod('live')" style="padding:10px">
                <div class="action-icon">📱</div>
                <div class="action-text">直播</div>
            </div>
        </div>
        <button class="btn" onclick="publishBrandAd()">发布合作内容并领取报酬</button>
        <div style="margin-top:15px;font-size:12px;color:#999;text-align:center">💡 品牌合作内容需真实体验，避免虚假宣传</div>
    `;
    
    window.selectedBrandMethod = 'video'; // 默认选择视频
};

// ==================== 拒绝品牌合作 ====================
window.rejectBrandDeal = function() {
    if (!window.gameState.pendingBrandDeal || window.gameState.pendingBrandDeal.status !== 'pending') {
        if (typeof window.showWarning === 'function') {
            window.showWarning('没有待处理的品牌合作');
        }
        return;
    }
    
    window.gameState.pendingBrandDeal.status = 'rejected';
    window.gameState.rejectedAdOrders++;
    
    if (typeof window.showNotification === 'function') {
        window.showNotification('合作已拒绝', '你拒绝了品牌合作机会');
    }
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
};

// ==================== 选择品牌合作发布方式 ====================
window.selectBrandMethod = function(method) {
    window.selectedBrandMethod = method;
    
    const buttons = document.querySelectorAll('#adOrdersPageContent .action-btn');
    buttons.forEach(btn => {
        btn.style.border = '1px solid #333';
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.style.border = '2px solid #00f2ea';
    }
};

// ==================== 发布品牌合作内容 ====================
window.publishBrandAd = function() {
    const content = document.getElementById('brandAdContent').value.trim();
    const brandDeal = window.gameState.pendingBrandDeal;
    
    if (!content) { 
        if (typeof window.showAlert === 'function') {
            window.showAlert('请输入合作内容', '提示');
        }
        return; 
    }
    
    // 检查违规
    if (typeof window.checkViolation === 'function' && window.checkViolation(content)) return;
    
    // 成功发布
    const views = Math.floor(Math.random() * 15000 + 5000);
    const likes = Math.floor(Math.random() * 1500 + 100);
    const comments = Math.floor(Math.random() * 200 + 20);
    const shares = Math.floor(Math.random() * 100 + 10);
    const work = { 
        id: Date.now(), 
        type: window.selectedBrandMethod || 'video', 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: window.gameTimer, 
        isAd: true, 
        revenue: Math.floor(views / 1000), 
        isPrivate: false 
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    // 只统计视频和直播的播放量
    if (work.type === 'video' || work.type === 'live') {
        window.gameState.views += work.views;
    }
    
    window.gameState.likes += work.likes;
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5));
    window.gameState.money += brandDeal.actualReward;
    window.gameState.adOrdersCount++;
    
    // 统计互动
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    // 清空pending状态
    window.gameState.pendingBrandDeal = null;
    
    if (typeof window.showNotification === 'function') {
        window.showNotification('合作完成', `品牌合作完成，获得${brandDeal.actualReward}元`);
    }
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    
    // 检查成就
    checkAdAchievements();
};

// ==================== 高商单数惩罚机制 ====================
window.checkHighAdCountPenalty = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    // 检查是否达到触发阈值（>=30单且不在惩罚期）
    if (window.gameState.adOrdersCount >= 30 && !window.gameState.adOrdersPenaltyActive) {
        console.log(`商单数达到${window.gameState.adOrdersCount}，触发粉丝疲劳惩罚`);
        
        // 1. 记录惩罚强度
        window.gameState.adOrdersPenaltyIntensity = window.gameState.adOrdersCount;
        
        // 2. 随机设置惩罚期（1-5虚拟天）
        const penaltyDays = Math.floor(Math.random() * 5) + 1;
        window.gameState.adOrdersPenaltyEndTime = window.gameTimer + (penaltyDays * window.VIRTUAL_DAY_MS);
        window.gameState.adOrdersPenaltyActive = true;
        
        // 3. 清空商单计数
        window.gameState.adOrdersCount = 0;
        
        // 4. 显示通知
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ 粉丝疲劳爆发', `长期接商单引发粉丝不满！惩罚持续${penaltyDays}虚拟天`);
        }
        
        // 5. 启动惩罚期专用定时器
        if (window.gameState.adOrdersPenaltyInterval) {
            clearInterval(window.gameState.adOrdersPenaltyInterval);
        }
        
        window.gameState.adOrdersPenaltyInterval = setInterval(() => {
            // 检查惩罚是否结束
            if (window.gameTimer >= window.gameState.adOrdersPenaltyEndTime) {
                // 惩罚结束
                clearInterval(window.gameState.adOrdersPenaltyInterval);
                window.gameState.adOrdersPenaltyInterval = null;
                window.gameState.adOrdersPenaltyActive = false;
                window.gameState.adOrdersPenaltyIntensity = 0;
                
                if (typeof window.showNotification === 'function') {
                    window.showNotification('✅ 粉丝疲劳缓解', '经过休息，粉丝对你的印象有所好转');
                }
                
                if (typeof window.updateDisplay === 'function') {
                    window.updateDisplay();
                }
                return;
            }
            
            // 惩罚期：高概率掉粉
            const baseProbability = 0.30;
            const intensityBonus = Math.floor(window.gameState.adOrdersPenaltyIntensity / 10) * 0.05;
            const dropProbability = Math.min(0.80, baseProbability + intensityBonus);
            
            if (Math.random() < dropProbability) {
                const baseDrop = Math.floor(Math.random() * 11) + 5;
                const intensityDrop = Math.floor(window.gameState.adOrdersPenaltyIntensity / 5) * 2;
                const dropAmount = baseDrop + intensityDrop;
                
                window.gameState.fans = Math.max(0, window.gameState.fans - dropAmount);
                
                // 20%概率显示通知
                if (Math.random() < 0.20) {
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('📉 粉丝疲劳', `因长期接商单失去${dropAmount}个粉丝`);
                    }
                }
                
                if (typeof window.updateDisplay === 'function') {
                    window.updateDisplay();
                }
            }
        }, 1000);
        
        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    }
};

// ==================== 检查商单成就 ====================
function checkAdAchievements() {
    if (!window.achievements || !window.gameState) return;
    
    // 商单相关成就定义
    const adAchievements = [
        { id: 21, name: '商单新人', desc: '完成首个商单', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 1 },
        { id: 22, name: '广告达人', desc: '完成10个商单', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 10 },
        { id: 23, name: '百万单王', desc: '单次商单收入超50万', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).some(w => w.revenue >= 50000) },
        { id: 24, name: '火眼金睛', desc: '识别并拒绝5个违规商单', target: () => window.gameState.rejectedAdOrders >= 5 },
        { id: 25, name: '商单大师', desc: '完成50个商单且未违规', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 50 && window.gameState.warnings < 5 }
    ];
    
    adAchievements.forEach(achievementDef => {
        const achievement = window.achievements.find(a => a.id === achievementDef.id);
        if (achievement && !achievement.unlocked && achievementDef.target()) {
            achievement.unlocked = true;
            window.gameState.achievements.push(achievement.id);
            
            // 显示成就弹窗
            if (typeof window.showAchievementPopup === 'function') {
                window.showAchievementPopup(achievement);
            }
            
            if (typeof window.showNotification === 'function') {
                window.showNotification('成就解锁！', `${achievement.name}：${achievement.desc}`);
            }
        }
    });
}

// ==================== 初始化商单相关状态 ====================
function initAdSystem() {
    // 确保商单相关状态存在
    if (window.gameState) {
        if (window.gameState.adOrders === undefined) window.gameState.adOrders = [];
        if (window.gameState.currentAdOrder === undefined) window.gameState.currentAdOrder = null;
        if (window.gameState.rejectedAdOrders === undefined) window.gameState.rejectedAdOrders = 0;
        if (window.gameState.adOrdersCount === undefined) window.gameState.adOrdersCount = 0;
        if (window.gameState.pendingBrandDeal === undefined) window.gameState.pendingBrandDeal = null;
        
        // 惩罚机制状态
        if (window.gameState.adOrdersPenaltyActive === undefined) window.gameState.adOrdersPenaltyActive = false;
        if (window.gameState.adOrdersPenaltyEndTime === undefined) window.gameState.adOrdersPenaltyEndTime = 0;
        if (window.gameState.adOrdersPenaltyIntensity === undefined) window.gameState.adOrdersPenaltyIntensity = 0;
        if (window.gameState.adOrdersPenaltyInterval === undefined) window.gameState.adOrdersPenaltyInterval = null;
    }
}

// 模块加载时自动初始化
if (typeof window.gameState !== 'undefined') {
    initAdSystem();
}

console.log('商单系统模块已加载');
