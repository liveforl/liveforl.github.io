// ==================== 热搜系统 ====================
function startHotSearch(title) {
    if (gameState.isHotSearch) return;
    gameState.isHotSearch = true;
    gameState.hotSearchDaysCount = Math.floor(Math.random() * 3) + 1;
    gameState.hotSearchStartTime = gameTimer; // 使用游戏计时器
    gameState.hotSearchTitle = title || '🔥 话题热议中';
    if (!gameState.hotSearchInterval) gameState.hotSearchInterval = setInterval(() => {
        if (gameState.isHotSearch) {
            const fanGrowth = Math.floor(Math.random() * 100) + 50;
            gameState.fans += fanGrowth;
            if (typeof showNotification === 'function') {
                showNotification('热搜效应', `热搜期间获得${fanGrowth}新粉丝`);
            }
            if (typeof updateDisplay === 'function') updateDisplay();
        }
    }, 1000);
    showNotification('🎉 热搜上榜', `恭喜！${title}，将持续${gameState.hotSearchDaysCount}虚拟天！`);
    updateDisplay();
}

function showHotSearchNotice() {
    if (!gameState.isHotSearch) return;
    const hotSearchNotice = document.getElementById('hotSearchNotice');
    if (!hotSearchNotice) return;
    
    // 修改：基于游戏计时器计算剩余时间
    const timePassed = gameTimer - gameState.hotSearchStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    const timeLeft = Math.max(0, gameState.hotSearchDaysCount - daysPassed);
    
    hotSearchNotice.innerHTML = `<div style="font-size:14px;font-weight:bold">${gameState.hotSearchTitle}</div><div style="font-size:12px;">热搜剩余：${Math.ceil(timeLeft)}天</div>`;
    if (timeLeft <= 0) endHotSearch();
}

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

// ==================== 账号封禁 ====================
function banAccount(reason) {
    if (gameState.isBanned) return;
    gameState.isBanned = true;
    gameState.banReason = reason;
    gameState.banDaysCount = Math.floor(Math.random() * 30) + 1;
    gameState.banStartTime = gameTimer; // 使用游戏计时器
    gameState.appealAvailable = true;
    if (gameState.liveStatus) {
        endLiveStream();
        showNotification('直播中断', '账号被封禁，直播已强制结束');
    }
    Object.keys(gameState.trafficWorks).forEach(workId => {
        if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
    });
    saveGame();
    if (typeof showBanNotice === 'function') showBanNotice();
    updateDisplay();
}

function showBanNotice() {
    if (!gameState.isBanned) return;
    const banDays = document.getElementById('banDays');
    const banNotice = document.getElementById('banNotice');
    const appealBtn = document.getElementById('appealBtn');
    if (!banDays || !banNotice) return;
    
    // 修改：基于游戏计时器计算剩余时间
    const timePassed = gameTimer - gameState.banStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    const timeLeft = Math.max(0, gameState.banDaysCount - daysPassed);
    
    banDays.textContent = Math.ceil(timeLeft);
    
    if (timeLeft > 0 && gameState.appealAvailable) {
        appealBtn.style.display = 'block';
    } else {
        appealBtn.style.display = 'none';
    }
    
    if (timeLeft <= 0) {
        gameState.isBanned = false;
        gameState.warnings = 0;
        gameState.appealAvailable = true;
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

// ==================== 随机事件处理 ====================
function handleRandomEvent(event) {
    if (event.effect.fans) gameState.fans = Math.max(0, gameState.fans + event.effect.fans);
    if (event.effect.likes) gameState.likes = Math.max(0, gameState.likes + event.effect.likes);
    if (event.effect.views) gameState.views = Math.max(0, gameState.views + event.effect.views);
    if (event.effect.money) gameState.money = Math.max(0, gameState.money + event.effect.money);
    if (event.effect.warnings) gameState.warnings = Math.min(20, gameState.warnings + event.effect.warnings);
    if (event.effect.hotSearch) startHotSearch(event.title);
    if (event.effect.publicOpinion) startPublicOpinionCrisis(event.title);
    showNotification(event.title, event.desc);
    if (!gameState.isBanned && gameState.warnings >= 20) banAccount('多次违反社区规定');
}

// ==================== 舆论风波系统 ====================
function startPublicOpinionCrisis(title) {
    if (gameState.isPublicOpinionCrisis) return;
    gameState.isPublicOpinionCrisis = true;
    gameState.publicOpinionDaysCount = Math.floor(Math.random() * 3) + 1;
    gameState.publicOpinionStartTime = gameTimer; // 使用游戏计时器
    gameState.publicOpinionTitle = title || '⚠️ 舆论风波中';
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
    showNotification('⚠️ 舆论风波', `你被卷入舆论风波，将持续${gameState.publicOpinionDaysCount}虚拟天！`);
    updateDisplay();
}

function showPublicOpinionNotice() {
    if (!gameState.isPublicOpinionCrisis) return;
    const publicOpinionNotice = document.getElementById('publicOpinionNotice');
    if (!publicOpinionNotice) return;
    
    // 修改：基于游戏计时器计算剩余时间
    const timePassed = gameTimer - gameState.publicOpinionStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    const timeLeft = Math.max(0, gameState.publicOpinionDaysCount - daysPassed);
    
    publicOpinionNotice.innerHTML = `<div style="font-size:14px;font-weight:bold">${gameState.publicOpinionTitle}</div><div style="font-size:12px;">剩余：${Math.ceil(timeLeft)}天</div>`;
    if (timeLeft <= 0) endPublicOpinionCrisis();
}

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

// ==================== 图表更新（核心修复版） ====================
function updateChartData() {
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const dayIndex = virtualDays % 60;
    
    // 记录当前写入位置（用于图表对齐）
    gameState.chartData.currentIndex = dayIndex;
    gameState.chartData.currentDay = virtualDays;
    
    // 确保只记录递增的累积值（防止意外下降）
    const prevFans = gameState.chartData.fans[dayIndex] || 0;
    const prevLikes = gameState.chartData.likes[dayIndex] || 0;
    const prevViews = gameState.chartData.views[dayIndex] || 0;
    const prevInteractions = gameState.chartData.interactions[dayIndex] || 0;
    
    gameState.chartData.fans[dayIndex] = Math.max(prevFans, gameState.fans);
    gameState.chartData.likes[dayIndex] = Math.max(prevLikes, gameState.likes);
    gameState.chartData.views[dayIndex] = Math.max(prevViews, gameState.views);
    gameState.chartData.interactions[dayIndex] = Math.max(prevInteractions, gameState.totalInteractions);
    
    // 实时更新已打开的图表
    updateChartsRealtime();
    updateChartStatsRealtime();
}

// 新增：实时更新图表右上角的统计数字
function updateChartStatsRealtime() {
    const chartsPage = document.getElementById('chartsPage');
    if (!chartsPage || !chartsPage.classList.contains('active')) return;
    
    const statElements = {
        fans: document.getElementById('fansStatValue'),
        likes: document.getElementById('likesStatValue'),
        views: document.getElementById('viewsStatValue'),
        interactions: document.getElementById('interactionsStatValue')
    };
    
    if (statElements.fans) statElements.fans.textContent = gameState.fans.toLocaleString();
    if (statElements.likes) statElements.likes.textContent = gameState.likes.toLocaleString();
    if (statElements.views) statElements.views.textContent = gameState.views.toLocaleString();
    if (statElements.interactions) statElements.interactions.textContent = gameState.totalInteractions.toLocaleString();
}

// 修改：实时刷新图表数据
function updateChartsRealtime() {
    if (!window.charts) return;
    
    const chartsPage = document.getElementById('chartsPage');
    if (chartsPage && chartsPage.classList.contains('active')) {
        Object.keys(window.charts).forEach(key => {
            const chart = window.charts[key];
            if (chart && typeof chart.update === 'function') {
                chart.update('none');
            }
        });
    }
}

// ==================== 不更新掉粉检测（核心修改） ====================
function checkInactivityPenalty() {
    if (!gameState || gameState.isBanned) return;
    
    // 使用虚拟时间计算天数差
    const daysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
    
    // 如果7天内，确保不掉粉
    if (daysSinceLastWork < 7) {
        if (gameState.isDroppingFansFromInactivity) {
            gameState.isDroppingFansFromInactivity = false;
            if (gameState.inactivityDropInterval) {
                clearInterval(gameState.inactivityDropInterval);
                gameState.inactivityDropInterval = null;
            }
        }
        if (gameState.inactivityWarningShown) {
            gameState.inactivityWarningShown = false;
        }
        return;
    }
    
    // 达到7天，开始掉粉
    if (daysSinceLastWork >= 7 && !gameState.isDroppingFansFromInactivity) {
        gameState.isDroppingFansFromInactivity = true;
        
        // 强制显示警告（首次触发）
        showNotification('⚠️ 粉丝流失警告', '连续7天未更新，粉丝开始流失！快发布新作品！');
        
        // 启动每秒掉粉（核心修改：增加掉粉数量）
        gameState.inactivityDropInterval = setInterval(() => {
            if (!gameState.isDroppingFansFromInactivity || gameState.isBanned) {
                clearInterval(gameState.inactivityDropInterval);
                return;
            }
            
            // 重新计算当前天数差（因为gameTimer在持续增加）
            const currentDaysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
            
            // ==================== 核心修改：大幅提升掉粉数量 ====================
            // 原来是：基础5-15粉 + 每多1天加1粉
            // 改为：基础20-50粉 + 每多1天加5-15粉
            const extraDays = Math.floor(currentDaysSinceLastWork - 7);
            const baseDrop = Math.floor(Math.random() * 31) + 20; // 20-50基础掉粉
            const extraDrop = extraDays * (Math.floor(Math.random() * 11) + 5); // 每多1天额外掉5-15粉
            const dropAmount = baseDrop + extraDrop;
            
            gameState.fans = Math.max(0, gameState.fans - dropAmount);
            
            // ==================== 核心修改：100%通知概率 ====================
            // 原来是：Math.random() < 0.1（10%概率）
            // 改为：移除概率判断，每次掉粉都通知
            showNotification('📉 粉丝流失', `失去了${dropAmount}个粉丝（已${Math.floor(currentDaysSinceLastWork)}天未更新）`);
            
            // 触发粉丝数字闪烁效果
            if (typeof triggerFanDropAnimation === 'function') {
                triggerFanDropAnimation();
            }
            
            updateDisplay();
        }, 1000); // 每秒执行一次
    }
    
    // 接近7天时给出警告（每6小时提醒一次）
    if (daysSinceLastWork >= 6 && daysSinceLastWork < 7 && !gameState.inactivityWarningShown) {
        gameState.inactivityWarningShown = true;
        const hoursLeft = Math.ceil((7 - daysSinceLastWork) * 24);
        showNotification('⏰ 更新提醒', `还有${hoursLeft}小时将触发掉粉惩罚！`);
    }
}

// ==================== 游戏主循环 ====================
function startGameLoop() {
    // 每虚拟天（1分钟）精确更新一次图表
    setInterval(() => {
        updateChartData();
    }, VIRTUAL_DAY_MS);
    
    // 每30秒触发随机事件
    setInterval(() => {
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        handleRandomEvent(event);
    }, 30000);
    
    // ==================== 核心修改：增加每秒检查不更新惩罚的机制 ====================
    // 原来只有每分钟检查一次，现在每秒检查，确保实时响应
    setInterval(() => {
        // 检查不更新惩罚（每秒）
        checkInactivityPenalty();
    }, 1000);
    
    // 保留原有的每分钟检查（用于其他逻辑）
    setInterval(() => {
        // 更新最后更新时间
        gameState.lastUpdateTime = gameTimer;
    }, VIRTUAL_DAY_MS);
    
    // 每秒检查状态（流量推广、舆论风波等）
    setInterval(() => {
        Object.keys(gameState.trafficWorks).forEach(workId => {
            const trafficData = gameState.trafficWorks[workId];
            if (trafficData && trafficData.isActive) {
                const timePassed = gameTimer - trafficData.startTime;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                const timeLeft = Math.max(0, trafficData.days - daysPassed);
                if (timeLeft <= 0 && typeof stopTrafficForWork === 'function') {
                    stopTrafficForWork(workId);
                }
            }
        });
        if (gameState.isPublicOpinionCrisis && typeof showPublicOpinionNotice === 'function') {
            showPublicOpinionNotice();
        }
    }, 1000);
    
    // 自然涨粉/掉粉（保持不变）
    setInterval(() => {
        if (Math.random() < 0.05) {
            const change = Math.floor(Math.random() * 100) - 50;
            gameState.fans = Math.max(0, gameState.fans + change);
            
            if (change > 0) {
                showNotification('粉丝变化', `获得了${change}个新粉丝`);
            } else if (change < 0) {
                showNotification('粉丝变化', `失去了${Math.abs(change)}个粉丝`);
            }
            
            updateChartData();
        }
        
        updateDisplay();
    }, 100);
    
    // 自动互动生成（保持不变）
    setInterval(() => {
        if (gameState.fans <= 0) return;
        
        const baseChance = Math.min(gameState.fans / 1000, 0.3);
        if (Math.random() < baseChance) {
            const interactionTypes = ['观看', '点赞', '评论', '转发', '访问主页'];
            const interactionWeights = [0.4, 0.25, 0.15, 0.1, 0.1];
            
            let random = Math.random();
            let selectedType = '';
            let accumulatedWeight = 0;
            
            for (let i = 0; i < interactionTypes.length; i++) {
                accumulatedWeight += interactionWeights[i];
                if (random < accumulatedWeight) {
                    selectedType = interactionTypes[i];
                    break;
                }
            }
            
            const interactionAmount = Math.floor(Math.random() * 50) + 1;
            gameState.totalInteractions += interactionAmount;
            
            if (Math.random() < 0.05) {
                showNotification('粉丝活跃', `${interactionAmount}位粉丝进行了${selectedType}互动`);
            }
        }
        
        if (Math.random() < 0.05) {
            const activeChange = Math.floor(Math.random() * 20) - 10;
            gameState.activeFans = Math.max(0, gameState.activeFans + activeChange);
        }
    }, 5000);
    
    // 每5秒检查商单数状态（保持不变）
    setInterval(() => {
        checkHighAdCountPenalty();
    }, 5000);
}

// ==================== 成就检查 ====================
function checkAchievements() {
    achievements.forEach(achievement => {
        if (!achievement.unlocked) {
            let unlocked = false;
            switch (achievement.id) {
                case 1: unlocked = gameState.fans >= 1; break;
                case 2: unlocked = gameState.fans >= 1000; break;
                case 3: unlocked = gameState.fans >= 100000; break;
                case 4: unlocked = gameState.fans >= 10000000; break;
                case 5: unlocked = gameState.worksList.filter(w => !w.isPrivate).some(w => w.views >= 1000000); break;
                case 6: unlocked = gameState.likes >= 100000; break;
                case 7: unlocked = gameState.worksList.filter(w => !w.isPrivate).length >= 100; break;
                case 8: unlocked = gameState.worksList.filter(w => w.type === 'live' && !w.isPrivate).some(w => w.views >= 1000); break;
                case 9: unlocked = gameState.money >= 1; break;
                case 10: unlocked = gameState.money >= 1000000; break;
                case 11: unlocked = gameState.worksList.filter(w => !w.isPrivate).some(w => w.shares >= 10000); break;
                case 12: unlocked = gameState.worksList.filter(w => !w.isPrivate).some(w => w.comments >= 5000); break;
                case 13: unlocked = (Date.now() - gameState.gameStartTime) >= 30 * 24 * 60 * 60 * 1000; break;
                case 14: unlocked = achievement.unlocked || false; break;
                case 15: unlocked = gameState.notifications.length >= 50; break;
                case 21: unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 1; break;
                case 22: unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 10; break;
                case 23: unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).some(w => w.revenue >= 50000); break;
                case 24: unlocked = gameState.rejectedAdOrders >= 5; break;
                case 25: unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 50 && gameState.warnings < 5; break;
            }
            if (unlocked) {
                achievement.unlocked = true;
                gameState.achievements.push(achievement.id);
                showNotification('成就解锁！', `${achievement.name}：${achievement.desc}`);
            }
        }
    });
}

// ==================== Chart.js图表系统（修复版） ====================
function drawChart(canvasId, data, color, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const currentIndex = gameState.chartData.currentIndex || 0;
    const currentDay = gameState.chartData.currentDay || 0;
    
    // 生成正确对齐的标签和数据（从第X-59天到第X天）
    const labels = [];
    const displayData = [];
    
    for (let i = 0; i < 60; i++) {
        // 计算数据索引：从旧到新排列
        const dataIndex = (currentIndex - 59 + i + 60) % 60;
        // 计算天数标签
        const dayNumber = currentDay - (59 - i);
        
        labels.push(dayNumber >= 0 ? `第${dayNumber}天` : '');
        displayData.push(data[dataIndex] || 0);
    }
    
    // 销毁旧图表
    if (window.charts && window.charts[canvasId]) {
        window.charts[canvasId].destroy();
    }
    
    // 创建新图表（优化性能）
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: displayData,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#999', 
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            // 只显示非空标签
                            const label = this.getLabelForValue(value);
                            return label || '';
                        }
                    }
                },
                y: {
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#999', 
                        callback: function(value) { 
                            return value.toLocaleString(); 
                        } 
                    }
                }
            },
            interaction: { 
                intersect: false, 
                mode: 'index' 
            }
        }
    });
    
    // 保存图表实例
    if (!window.charts) window.charts = {};
    window.charts[canvasId] = chart;
}

// ==================== 全局函数绑定 ====================
window.startHotSearch = startHotSearch;
window.showHotSearchNotice = showHotSearchNotice;
window.endHotSearch = endHotSearch;
window.banAccount = banAccount;
window.showBanNotice = showBanNotice;
window.handleRandomEvent = handleRandomEvent;
window.checkAchievements = checkAchievements;
window.startPublicOpinionCrisis = startPublicOpinionCrisis;
window.showPublicOpinionNotice = showPublicOpinionNotice;
window.endPublicOpinionCrisis = endPublicOpinionCrisis;
window.updateChartData = updateChartData;
window.startGameLoop = startGameLoop;
window.drawChart = drawChart;
window.updateChartsRealtime = updateChartsRealtime;
window.updateChartStatsRealtime = updateChartStatsRealtime;
window.checkInactivityPenalty = checkInactivityPenalty;
