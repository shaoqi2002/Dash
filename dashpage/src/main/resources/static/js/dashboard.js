// 主仪表板功能
class Dashboard {
    constructor() {
        this.searchInput = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupSearchIntegration();
            this.setupQuickActions();
        });
    }

    setupSearchIntegration() {
        // 监听搜索引擎管理器的事件
        document.addEventListener('searchPerformed', (e) => {
            const { query, engine, timestamp } = e.detail;
            console.log(`搜索执行: "${query}" 使用 ${engine} 引擎`, timestamp);
            
            // 可以在这里添加搜索统计、历史记录等功能
            this.logSearchActivity(query, engine, timestamp);
        });

        document.addEventListener('searchEngineChanged', (e) => {
            const { engine, engineInfo } = e.detail;
            console.log(`搜索引擎已切换至: ${engineInfo.name}`);
            
            // 可以在这里添加引擎切换的相关逻辑
            this.onEngineChanged(engine, engineInfo);
        });

        // 不再直接处理搜索框事件，完全交给searchEngineManager处理
        console.log('Dashboard - 搜索集成已设置，使用SearchEngineManager处理搜索');
    }

    handleSearchInput(query) {
        if (query.length > 0) {
            console.log('搜索输入:', query);
            // 这里可以添加实时搜索建议功能
            // 比如显示搜索历史、热门搜索等
        }
    }

    logSearchActivity(query, engine, timestamp) {
        // 记录搜索活动到本地存储
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        searchHistory.unshift({
            query,
            engine,
            timestamp: timestamp.toISOString()
        });
        
        // 只保留最近100条搜索记录
        if (searchHistory.length > 100) {
            searchHistory.splice(100);
        }
        
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    onEngineChanged(engine, engineInfo) {
        // 引擎切换时的处理逻辑
        console.log(`当前搜索引擎: ${engineInfo.name} (${engine})`);
        
        // 可以在这里添加个性化功能，比如：
        // - 根据不同引擎显示不同的搜索建议
        // - 记录用户的引擎使用偏好
        // - 更新UI主题色彩等
    }

    setupQuickActions() {
        // 快捷操作按钮的事件处理
        console.log('快捷操作已设置');
    }

    // 公共API：获取搜索历史
    getSearchHistory() {
        return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }

    // 公共API：清空搜索历史
    clearSearchHistory() {
        localStorage.removeItem('searchHistory');
        console.log('搜索历史已清空');
    }

    // 公共API：执行搜索（供其他模块调用）
    performSearch(query, engineKey = null) {
        if (window.searchEngineManager) {
            window.searchEngineManager.searchInput.value = query;
            if (engineKey) {
                window.searchEngineManager.switchEngine(engineKey);
            }
            window.searchEngineManager.performSearch();
        } else {
            // 备用搜索方案
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
        }
    }
}

// 全局函数
function toggleEditMode() {
    console.log('切换编辑模式');
    // 切换编辑模式的逻辑
}

function saveLayout() {
}

// 初始化仪表板
const dashboard = new Dashboard();