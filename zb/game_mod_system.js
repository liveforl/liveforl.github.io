// ==================== Mod系统核心 ====================
// Mod存储键名
const MOD_STORAGE_KEY = 'streamerGameMods';
const ACTIVE_MODS_KEY = 'streamerGameActiveMods';
const LOADED_MODS_KEY = 'streamerGameLoadedMods'; // ✅ 新增：已加载Mod列表

// Mod文件管理器
class ModManager {
    constructor() {
        this.mods = this.loadMods();
        this.activeMods = this.loadActiveMods();
        this.loadedMods = this.loadLoadedMods(); // ✅ 新增：加载已加载列表
    }

    // 从localStorage加载Mod列表
    loadMods() {
        try {
            const stored = localStorage.getItem(MOD_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载Mod失败:', error);
            return [];
        }
    }

    // 加载激活的Mod列表
    loadActiveMods() {
        try {
            const stored = localStorage.getItem(ACTIVE_MODS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载激活Mod失败:', error);
            return [];
        }
    }

    // ✅ 新增：加载已加载Mod列表
    loadLoadedMods() {
        try {
            const stored = localStorage.getItem(LOADED_MODS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载已加载Mod失败:', error);
            return [];
        }
    }

    // 保存Mod列表
    saveMods() {
        localStorage.setItem(MOD_STORAGE_KEY, JSON.stringify(this.mods));
    }

    // 保存激活的Mod列表
    saveActiveMods() {
        localStorage.setItem(ACTIVE_MODS_KEY, JSON.stringify(this.activeMods));
    }

    // ✅ 新增：保存已加载Mod列表
    saveLoadedMods() {
        localStorage.setItem(LOADED_MODS_KEY, JSON.stringify(this.loadedMods));
    }

    // 添加新Mod
    addMod(name, code, description = '') {
        const mod = {
            id: Date.now(),
            name: name,
            code: code,
            description: description,
            createdAt: new Date().toISOString(),
            enabled: false
        };
        this.mods.push(mod);
        this.saveMods();
        return mod;
    }

    // 删除Mod
    deleteMod(id) {
        this.mods = this.mods.filter(mod => mod.id !== id);
        this.activeMods = this.activeMods.filter(modId => modId !== id);
        this.loadedMods = this.loadedMods.filter(modId => modId !== id); // ✅ 同步清理已加载列表
        this.saveMods();
        this.saveActiveMods();
        this.saveLoadedMods(); // ✅ 保存已加载列表
    }

    // 切换Mod启用状态
    toggleMod(id) {
        const mod = this.mods.find(m => m.id === id);
        if (mod) {
            mod.enabled = !mod.enabled;
            if (mod.enabled) {
                if (!this.activeMods.includes(id)) {
                    this.activeMods.push(id);
                }
            } else {
                this.activeMods = this.activeMods.filter(modId => modId !== id);
            }
            this.saveMods();
            this.saveActiveMods();
        }
    }

    // 获取所有Mod
    getAllMods() {
        return this.mods;
    }

    // 获取激活的Mod
    getActiveMods() {
        return this.mods.filter(mod => this.activeMods.includes(mod.id));
    }

    // 清空所有Mod
    clearAllMods() {
        this.mods = [];
        this.activeMods = [];
        this.loadedMods = []; // ✅ 清空已加载列表
        this.saveMods();
        this.saveActiveMods();
        this.saveLoadedMods();
    }

    // 从文件导入Mod
    importModFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // 检查是否是JSON格式的Mod文件
                    if (file.name.endsWith('.json')) {
                        const modData = JSON.parse(content);
                        if (modData.name && modData.code) {
                            const mod = this.addMod(
                                modData.name,
                                modData.code,
                                modData.description || ''
                            );
                            resolve(mod);
                        } else {
                            reject(new Error('无效的Mod文件格式'));
                        }
                    } else {
                        // 假设是JS文件，使用文件名作为Mod名
                        const name = file.name.replace('.js', '');
                        const mod = this.addMod(name, content);
                        resolve(mod);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
}

// 全局Mod管理器实例
window.modManager = new ModManager();

// ==================== 页面加载时自动执行已加载的Mod ====================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.modManager && window.modManager.loadedMods.length > 0) {
            console.log(`检测到 ${window.modManager.loadedMods.length} 个已加载Mod，正在自动执行...`);
            
            let successCount = 0;
            window.modManager.loadedMods.forEach(modId => {
                const mod = window.modManager.mods.find(m => m.id === modId);
                if (mod && mod.code) {
                    try {
                        const modFunction = new Function('gameState', 'window', 'document', mod.code);
                        modFunction(gameState, window, document);
                        console.log(`✅ 自动加载Mod: ${mod.name}`);
                        successCount++;
                    } catch (error) {
                        console.error(`❌ 自动加载Mod失败: ${mod.name}`, error);
                    }
                }
            });
            
            // ✅ 更新已加载计数显示
            window.loadedModCount = successCount;
            setTimeout(() => {
                const loadedEl = document.getElementById('loadedModCount');
                if (loadedEl && typeof loadedEl.textContent !== 'undefined') {
                    loadedEl.textContent = successCount;
                }
            }, 500);
            
            // ✅ 显示加载结果
            if (successCount > 0) {
                showEventPopup('🎮 Mod自动加载', `成功加载 ${successCount} 个Mod！`);
            }
        }
    }, 2000); // 页面加载2秒后执行，确保游戏核心已初始化
});

// ==================== 显示Mod管理主界面 ====================
function showModManagement() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">🎮 Mod管理中心</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <!-- 如何制作Mod -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 15px; margin-bottom: 20px; cursor: pointer;" onclick="showModHelp()">
                <div style="font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 5px;">
                    ❓ 如何制作Mod？
                </div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9);">
                    点击查看Mod制作教程
                </div>
            </div>

            <!-- 粘贴Mod代码 -->
            <div style="margin-bottom: 20px;">
                <div class="input-label" style="color: #00f2ea; margin-bottom: 10px;">
                    📋 粘贴Mod代码到文本框
                </div>
                <textarea class="text-input" id="modCodeInput" rows="8" 
                          placeholder="将Mod代码粘贴到这里..." 
                          style="background: #222; border: 2px solid #333; color: #fff; font-family: monospace; font-size: 12px;"></textarea>
                <div style="margin-top: 10px;">
                    <button class="btn" onclick="confirmAddMod()" style="width: 100%; background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000; font-weight: bold;">
                        将以上代码组成Mod
                    </button>
                </div>
            </div>

            <!-- Mod文件管理 -->
            <div style="background: #161823; border-radius: 10px; padding: 15px; border: 1px solid #333; margin-bottom: 20px;">
                <div class="input-label" style="margin-bottom: 15px; color: #667aea; font-weight: bold;">
                    📁 Mod文件管理
                </div>
                <div id="modFileList" style="max-height: 250px; overflow-y: auto; margin-bottom: 15px;">
                    ${renderModFileList()}
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="importModFile()" style="flex: 1; min-width: 120px;">
                        📥 导入Mod文件
                    </button>
                    <button class="btn btn-danger" onclick="deleteSelectedMods()" style="flex: 1; min-width: 120px;">
                        🗑️ 删除选中Mod
                    </button>
                    <button class="btn" onclick="loadSelectedMods()" style="flex: 2; min-width: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-weight: bold;">
                        🚀 确定加载Mod
                    </button>
                </div>
            </div>

            <!-- Mod状态统计 -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px;">
                <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: #667aea;" id="totalModCount">${window.modManager.getAllMods().length}</div>
                    <div style="font-size: 11px; color: #999;">总计Mod</div>
                </div>
                <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: #00f2ea;" id="activeModCount">${window.modManager.getActiveMods().length}</div>
                    <div style="font-size: 11px; color: #999;">已启用</div>
                </div>
                <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: #ff6b00;" id="loadedModCount">${window.modManager.loadedMods.length}</div>
                    <div style="font-size: 11px; color: #999;">已加载</div>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== 显示Mod制作帮助 ====================
function showModHelp() {
    const helpContent = `
        <div class="modal-header">
            <div class="modal-title">📚 Mod制作教程</div>
            <div class="close-btn" onclick="showModManagement()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 15px;">
                    如何制作Mod？
                </div>
                <div style="font-size: 12px; color: #ccc; line-height: 1.6; margin-bottom: 15px;">
                    复制以下文本，去任意一个AI把文本粘贴出来，并写出你要制作什么让AI来给你制作出来。
                </div>
                
                <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                    <div style="font-size: 11px; color: #999; margin-bottom: 8px;">
                        📋 点击复制游戏描述文本：
                    </div>
                    <div style="background: #111; border-radius: 5px; padding: 10px; font-size: 11px; color: #ccc; font-family: monospace; max-height: 100px; overflow-y: auto;" id="gameDescription">
这是一个主播模拟器html小游戏，该游戏有发布视频、动态和直播三种内容形式，作品从0数据开始增长；可接真实或虚假商单赚钱，虚假商单有被封号和持续掉粉风险；会随机触发热搜涨粉或舆论风波掉粉事件；违规关键词会加警告，20次警告封号，连续7天不更新也会掉粉；封号后需写申诉理由由AI检测真诚度；右上角弹窗实时通知粉丝变化，有粉丝趋势图和成就系统记录生涯；新增了抽奖系统可发起福利活动，活动期间疯狂涨粉但结束后会掉粉；平台会推送热搜话题邀请，接受后获得爆炸式曝光；私信系统接收粉丝来信，包含支持赞美或恶意辱骂；评论支持点赞和回复互动，点赞数会自动增长；设有关注系统可互相关注；存档管理支持导出导入和自动清理缓存；提供免打扰模式关闭消息红点提醒；内置28个成就从新手到传奇记录完整主播生涯。
                    </div>
                    <button class="btn btn-secondary" onclick="copyGameDescription()" style="margin-top: 10px; width: 100%; font-size: 12px; padding: 8px;">
                        📋 复制游戏描述
                    </button>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 10px;">
                    💡 Mod制作示例
                </div>
                <div style="font-size: 11px; color: #333; line-height: 1.5;">
                    例如：你可以要求AI制作一个"自动发布作品Mod"，让游戏每隔一段时间自动发布随机内容。
                </div>
            </div>

            <div style="background: #161823; border-radius: 10px; padding: 15px; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 10px;">
                    🔧 Mod代码示例
                </div>
                <div style="font-size: 11px; color: #999; line-height: 1.5; margin-bottom: 10px;">
                    Mod代码应该是有效的JavaScript代码，可以直接在游戏中执行。
                </div>
                <textarea class="text-input" rows="6" style="background: #222; border: 1px solid #333; color: #fff; font-family: monospace; font-size: 10px;" readonly>
// 示例Mod：自动发布作品
(function() {
    // 检查是否已经存在自动发布
    if (window.autoPostInterval) return;
    
    // 每虚拟天自动发布一条随机动态
    window.autoPostInterval = setInterval(() => {
        const contents = ['大家好！', '今天心情不错~', '持续更新中', '感谢支持！', '😊'];
        const randomContent = contents[Math.floor(Math.random() * contents.length)];
        
        // 调用游戏的创建动态函数
        if (typeof createPost === 'function') {
            // 模拟用户输入
            const originalContent = document.getElementById('postContent');
            if (originalContent) {
                originalContent.value = randomContent;
                createPost();
            }
        }
    }, VIRTUAL_DAY_MS); // 每虚拟天发布一次
    
    console.log('✅ 自动发布Mod已激活！');
})();</textarea>
            </div>

            <button class="btn" onclick="showModManagement()" style="width: 100%; margin-top: 20px;">返回Mod管理</button>
        </div>
    `;
    
    showModal(helpContent);
}

// ==================== 复制游戏描述文本 ====================
function copyGameDescription() {
    const text = `这是一个主播模拟器html小游戏，该游戏有发布视频、动态和直播三种内容形式，作品从0数据开始增长；可接真实或虚假商单赚钱，虚假商单有被封号和持续掉粉风险；会随机触发热搜涨粉或舆论风波掉粉事件；违规关键词会加警告，20次警告封号，连续7天不更新也会掉粉；封号后需写申诉理由由AI检测真诚度；右上角弹窗实时通知粉丝变化，有粉丝趋势图和成就系统记录生涯；新增了抽奖系统可发起福利活动，活动期间疯狂涨粉但结束后会掉粉；平台会推送热搜话题邀请，接受后获得爆炸式曝光；私信系统接收粉丝来信，包含支持赞美或恶意辱骂；评论支持点赞和回复互动，点赞数会自动增长；设有关注系统可互相关注；存档管理支持导出导入和自动清理缓存；提供免打扰模式关闭消息红点提醒；内置28个成就从新手到传奇记录完整主播生涯。`;
    
    // 创建临时文本区域
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功', '游戏描述已复制到剪贴板');
    } catch (err) {
        showWarning('复制失败，请手动复制');
    }
    
    document.body.removeChild(textarea);
}

// ==================== 确认添加Mod ====================
function confirmAddMod() {
    const code = document.getElementById('modCodeInput').value.trim();
    if (!code) {
        showAlert('请输入Mod代码', '提示');
        return;
    }
    
    // 自动生成Mod名称
    const name = `自定义Mod_${Date.now().toString().slice(-4)}`;
    const description = '从粘贴的代码创建的Mod';
    
    try {
        // 验证代码语法（简单检查）
        new Function(code);
        
        // 添加到Mod管理器
        const mod = window.modManager.addMod(name, code, description);
        
        showAlert(`Mod添加成功：${mod.name}`, '成功');
        
        // 清空输入框
        document.getElementById('modCodeInput').value = '';
        
        // 刷新列表
        refreshModFileList();
    } catch (error) {
        showAlert(`Mod代码有误：${error.message}`, '错误');
    }
}

// ==================== 渲染Mod文件列表 ====================
function renderModFileList() {
    const mods = window.modManager.getAllMods();
    
    if (mods.length === 0) {
        return '<div style="text-align: center; color: #999; padding: 20px;">暂无Mod文件</div>';
    }
    
    return mods.map(mod => `
        <div class="work-item" style="margin-bottom: 8px; cursor: pointer;" onclick="toggleModSelection(${mod.id})">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 5px; flex-shrink: 0; margin-top: 2px;" id="mod-checkbox-${mod.id}"></div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                        <div style="font-size: 14px; font-weight: bold; color: #fff;">${mod.name}</div>
                        <div style="font-size: 10px; color: #999;">${formatTime(new Date(mod.createdAt).getTime())}</div>
                    </div>
                    <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">
                        ${mod.description || '暂无描述'}
                    </div>
                    <div style="display: flex; gap: 10px; font-size: 11px; color: #999;">
                        <span>📄 ${mod.code.length} 字符</span>
                        <span style="color: ${mod.enabled ? '#00f2ea' : '#999'};" id="mod-status-${mod.id}">${mod.enabled ? '✅ 已启用' : '⚪ 未启用'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== Mod选择状态管理 ====================
window.selectedModIds = [];

function toggleModSelection(modId) {
    const index = window.selectedModIds.indexOf(modId);
    const checkbox = document.getElementById(`mod-checkbox-${modId}`);
    const item = checkbox.closest('.work-item');
    
    if (index > -1) {
        window.selectedModIds.splice(index, 1);
        checkbox.style.background = '';
        item.style.border = '';
        item.style.background = '#161823';
    } else {
        window.selectedModIds.push(modId);
        checkbox.style.background = '#667eea';
        item.style.border = '2px solid #667eea';
        item.style.background = '#222';
    }
}

// ==================== 导入Mod文件 ====================
function importModFile() {
    // 创建文件选择器
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.js,.json,.txt';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.name.match(/\.(js|json|txt)$/i)) {
            showAlert('请上传.js、.json或.txt格式的文件', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        // 读取文件
        window.modManager.importModFromFile(file)
            .then(mod => {
                showNotification('导入成功', `Mod "${mod.name}" 已导入`);
                refreshModFileList();
            })
            .catch(error => {
                showAlert(`导入失败：${error.message}`, '错误');
            });
        
        document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// ==================== 删除选中的Mod ====================
function deleteSelectedMods() {
    if (!window.selectedModIds || window.selectedModIds.length === 0) {
        showAlert('请先选择要删除的Mod', '提示');
        return;
    }
    
    showConfirm(`确定要删除选中的 ${window.selectedModIds.length} 个Mod吗？此操作不可恢复！`, function(confirmed) {
        if (!confirmed) return;
        
        window.selectedModIds.forEach(modId => {
            window.modManager.deleteMod(modId);
        });
        
        window.selectedModIds = [];
        refreshModFileList();
        
        showNotification('删除成功', '选中的Mod已删除');
    }, '删除Mod');
}

// ✅ 修复核心问题：加载选中的Mod并更新状态（不刷新页面）
window.loadSelectedMods = function() {
    // 获取选中的mod
    const selectedMods = window.selectedModIds.map(id => 
        window.modManager.mods.find(mod => mod.id === id)
    ).filter(mod => mod); // 过滤掉未找到的
    
    if (selectedMods.length === 0) {
        showAlert('没有选中的Mod需要加载', '提示');
        return;
    }
    
    showConfirm(`确定要加载 ${selectedMods.length} 个Mod吗？加载后将立即生效。`, function(confirmed) {
        if (!confirmed) return;
        
        try {
            // 执行所有选中的Mod代码
            let successCount = 0;
            selectedMods.forEach(mod => {
                try {
                    // 创建一个安全的执行环境
                    const modFunction = new Function('gameState', 'window', 'document', mod.code);
                    modFunction(gameState, window, document);
                    
                    // ✅ 关键修复：更新Mod状态为已启用
                    mod.enabled = true;
                    if (!window.modManager.activeMods.includes(mod.id)) {
                        window.modManager.activeMods.push(mod.id);
                    }
                    
                    // ✅ 关键修复：添加到已加载列表
                    if (!window.modManager.loadedMods.includes(mod.id)) {
                        window.modManager.loadedMods.push(mod.id);
                    }
                    
                    console.log(`✅ Mod加载成功: ${mod.name}`);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Mod加载失败: ${mod.name}`, error);
                    showAlert(`Mod "${mod.name}" 加载失败: ${error.message}`, '错误');
                }
            });
            
            // ✅ 保存所有状态
            window.modManager.saveMods();
            window.modManager.saveActiveMods();
            window.modManager.saveLoadedMods(); // ✅ 保存已加载列表
            
            // ✅ 更新已加载计数（从已加载列表获取真实数量）
            window.loadedModCount = window.modManager.loadedMods.length;
            updateLoadedModCount();
            
            // ✅ 显示成功提示（不刷新页面）
            showAlert(`成功加载 ${successCount}/${selectedMods.length} 个Mod！已即时生效。`, '加载成功');
            
            // ✅ 刷新Mod列表显示
            refreshModFileList();
            
            // ✅ 重置选择状态
            window.selectedModIds = [];
            
        } catch (error) {
            showAlert(`Mod加载失败: ${error.message}`, '错误');
        }
    }, '加载Mod');
};

// ==================== 刷新Mod文件列表 ====================
function refreshModFileList() {
    const listContainer = document.getElementById('modFileList');
    if (listContainer) {
        listContainer.innerHTML = renderModFileList();
    }
    
    // 更新统计
    const totalEl = document.getElementById('totalModCount');
    const activeEl = document.getElementById('activeModCount');
    const loadedEl = document.getElementById('loadedModCount'); // ✅ 确保已加载计数也更新
    
    if (totalEl) totalEl.textContent = window.modManager.getAllMods().length;
    if (activeEl) activeEl.textContent = window.modManager.getActiveMods().length;
    if (loadedEl) loadedEl.textContent = window.modManager.loadedMods.length; // ✅ 从持久化列表获取
}

// ==================== 更新已加载Mod数量显示 ====================
function updateLoadedModCount() {
    const loadedEl = document.getElementById('loadedModCount');
    if (loadedEl && typeof loadedEl.textContent !== 'undefined') { // ✅ 确保是文本元素
        loadedEl.textContent = window.loadedModCount || window.modManager.loadedMods.length || 0;
        
        // ✅ 添加加载成功的视觉反馈
        if ((window.loadedModCount || 0) > 0) {
            loadedEl.style.color = '#00f2ea';
            loadedEl.style.textShadow = '0 0 10px rgba(0, 242, 234, 0.5)';
        }
    }
}

// ==================== 全局函数绑定 ====================
window.showModManagement = showModManagement;
window.showModHelp = showModHelp;
window.copyGameDescription = copyGameDescription;
window.confirmAddMod = confirmAddMod;
window.renderModFileList = renderModFileList;
window.toggleModSelection = toggleModSelection;
window.importModFile = importModFile;
window.deleteSelectedMods = deleteSelectedMods;
window.loadSelectedMods = window.loadSelectedMods;
window.refreshModFileList = refreshModFileList;
window.updateLoadedModCount = updateLoadedModCount;

console.log('✅ Mod系统已加载（持久化版本）');
