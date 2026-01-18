// ==================== 一键开启开发者模式 Mod ====================
// 作者：系统预设
// 描述：游戏加载完成后立即永久开启开发者模式，无需密码、无需手动点击

(function () {
    // 等待游戏核心初始化完成（最多 30 秒）
    const maxWait = 30000;
    const start = Date.now();

    const tryEnable = setInterval(function () {
        // 成功条件：全局变量就绪 & 未处于开发者模式
        if (typeof gameState !== 'undefined' && gameState && !gameState.devMode) {
            // 1. 直接开启开发者模式
            gameState.devMode = true;

            // 2. 显示悬浮按钮
            const devBtn = document.getElementById('devFloatButton');
            if (devBtn) devBtn.style.display = 'block';

            // 3. 启动倒计时追踪器（若函数存在）
            if (typeof devStartCountdownTracker === 'function') {
                devStartCountdownTracker();
            }

            // 4. 保存状态，确保刷新后仍开启
            if (typeof saveGame === 'function') saveGame();

            // 5. 提示玩家
            if (typeof showEventPopup === 'function') {
                showEventPopup('🎮 开发者模式', '一键开发者 Mod 已激活！悬浮按钮已显示。');
            }

            clearInterval(tryEnable);
            console.log('[一键开发者 Mod] 开发者模式已永久开启');
            return;
        }

        // 超时保护
        if (Date.now() - start > maxWait) {
            clearInterval(tryEnable);
            console.warn('[一键开发者 Mod] 等待超时，未能开启开发者模式');
        }
    }, 200);
})();

