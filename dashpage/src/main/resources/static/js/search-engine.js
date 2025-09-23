// 搜索引擎管理器 - 独立模块
class SearchEngineManager {
    constructor() {
        this.currentEngine = 'google';
        this.searchEngines = {
            google: {
                name: 'Google',
                icon: 'fab fa-google',
                url: 'https://www.google.com/search?q=',
                placeholder: 'Google',
                color: '#4285f4'
            },
            bing: {
                name: 'Bing',
                icon: 'fab fa-microsoft',
                url: 'https://www.bing.com/search?q=',
                placeholder: 'Bing',
                color: '#0078d4'
            },
            bilibili: {
                name: 'B站',
                icon: 'fab fa-youtube',
                url: 'https://search.bilibili.com/all?keyword=',
                placeholder: 'B站',
                color: '#fb7299'
            },
            zhihu: {
                name: '知乎',
                icon: 'fas fa-question-circle',
                url: 'https://www.zhihu.com/search?type=content&q=',
                placeholder: '知乎',
                color: '#0084ff'
            },
            github: {
                name: 'GitHub',
                icon: 'fab fa-github',
                url: 'https://github.com/search?q=',
                placeholder: 'GitHub',
                color: '#333'
            },
        };
        
        this.searchInput = null;
        this.engineSelector = null;
        this.engineDropdown = null;
        this.isDropdownOpen = false;
        
        // 从本地存储加载上次选择的引擎
        this.loadLastEngine();
        
        console.log('Search Engine Manager - 初始化完成，当前引擎:', this.currentEngine);
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bindElements();
            this.bindEvents();
            this.updateUI();
        });
        
        // 如果DOM已经加载完成，立即初始化
        if (document.readyState === 'loading') {
            // DOM还在加载中，使用DOMContentLoaded事件
        } else {
            // DOM已经加载完成，直接初始化
            this.bindElements();
            this.bindEvents();
            this.updateUI();
        }
    }

    bindElements() {
        this.searchInput = document.getElementById('searchInput');
        this.engineSelector = document.querySelector('.engine-selector');
        this.engineDropdown = document.querySelector('.engine-dropdown');
        
        // 调试信息
        console.log('Search Engine Manager - 元素绑定状态:');
        console.log('- searchInput:', !!this.searchInput);
        console.log('- engineSelector:', !!this.engineSelector);
        console.log('- engineDropdown:', !!this.engineDropdown);
    }

    bindEvents() {
        if (!this.searchInput || !this.engineSelector) {
            console.error('Search Engine Manager - 关键元素未找到，无法绑定事件');
            return;
        }

        console.log('Search Engine Manager - 开始绑定事件');

        // 搜索框回车事件
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 阻止默认行为
                this.performSearch();
            }
        });

        // 引擎选择器点击事件
        this.engineSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Search Engine Manager - 引擎选择器被点击');
            this.toggleDropdown();
        });

        // 下拉菜单项点击事件
        if (this.engineDropdown) {
            this.engineDropdown.addEventListener('click', (e) => {
                const engineItem = e.target.closest('.engine-item');
                if (engineItem) {
                    const engineKey = engineItem.getAttribute('data-engine');
                    console.log('Search Engine Manager - 选择引擎:', engineKey);
                    this.switchEngine(engineKey);
                    this.closeDropdown();
                }
            });

            // 阻止下拉菜单内部点击冒泡
            this.engineDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', () => {
            this.closeDropdown();
        });

        // ESC键关闭下拉菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });

        console.log('Search Engine Manager - 事件绑定完成');
    }

    performSearch() {
        const query = this.searchInput.value.trim();
        console.log('Search Engine Manager - 执行搜索，查询词:', query);
        
        if (!query) {
            console.log('Search Engine Manager - 查询词为空，取消搜索');
            return;
        }

        const engine = this.searchEngines[this.currentEngine];
        const searchUrl = engine.url + encodeURIComponent(query);
        
        console.log('Search Engine Manager - 搜索URL:', searchUrl);
        console.log('Search Engine Manager - 使用引擎:', engine.name);
        
        // 在新窗口中打开搜索结果
        window.open(searchUrl, '_blank');
        
        // 可选：清空搜索框
        // this.searchInput.value = '';
        
        // 触发自定义事件，其他模块可以监听
        this.dispatchSearchEvent(query, this.currentEngine);
    }

    switchEngine(engineKey) {
        if (this.searchEngines[engineKey]) {
            this.currentEngine = engineKey;
            this.updateUI();
            this.saveLastEngine();
            
            // 触发引擎切换事件
            this.dispatchEngineChangeEvent(engineKey);
        }
    }

    updateUI() {
        if (!this.searchInput || !this.engineSelector) {
            console.warn('Search Engine Manager - UI元素未找到，跳过更新');
            return;
        }

        const engine = this.searchEngines[this.currentEngine];
        if (!engine) {
            console.error('Search Engine Manager - 当前引擎配置未找到:', this.currentEngine);
            return;
        }
        
        console.log('Search Engine Manager - 更新UI到引擎:', engine.name);
        
        // 更新搜索框placeholder
        this.searchInput.placeholder = engine.placeholder;
        
        // 更新引擎选择器显示
        const selectorIcon = this.engineSelector.querySelector('.current-engine-icon');
        const selectorText = this.engineSelector.querySelector('.current-engine-text');
        
        if (selectorIcon) {
            selectorIcon.className = `current-engine-icon ${engine.icon}`;
            selectorIcon.style.color = engine.color;
            console.log('更新引擎图标:', engine.icon, engine.color);
        } else {
            console.warn('未找到引擎图标元素');
        }
        
        if (selectorText) {
            selectorText.textContent = engine.name;
            console.log('更新引擎文本:', engine.name);
        } else {
            console.warn('未找到引擎文本元素');
        }

        // 更新下拉菜单
        this.updateDropdownItems();
    }

    updateDropdownItems() {
        if (!this.engineDropdown) {
            console.error('Search Engine Manager - updateDropdownItems: engineDropdown 不存在');
            return;
        }

        console.log('Search Engine Manager - 更新下拉菜单项');
        
        let dropdownHTML = '';
        Object.keys(this.searchEngines).forEach(key => {
            const engine = this.searchEngines[key];
            const isActive = key === this.currentEngine;
            dropdownHTML += `
                <div class="engine-item ${isActive ? 'active' : ''}" data-engine="${key}">
                    <i class="${engine.icon}" style="color: ${engine.color}"></i>
                    <span class="engine-name">${engine.name}</span>
                    ${isActive ? '<i class="fas fa-check check-icon"></i>' : ''}
                </div>
            `;
        });
        
        this.engineDropdown.innerHTML = dropdownHTML;
        console.log('Search Engine Manager - 下拉菜单HTML已更新, 项目数量:', Object.keys(this.searchEngines).length);
        console.log('Search Engine Manager - 下拉菜单内容:', this.engineDropdown.innerHTML.substring(0, 200) + '...');
    }

    toggleDropdown() {
        console.log('Search Engine Manager - toggleDropdown 被调用, 当前状态:', this.isDropdownOpen);
        console.log('Search Engine Manager - engineDropdown 元素:', this.engineDropdown);
        
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        console.log('Search Engine Manager - 尝试打开下拉菜单');
        if (!this.engineDropdown) {
            console.error('Search Engine Manager - engineDropdown 元素不存在');
            return;
        }
        
        this.engineDropdown.classList.add('show');
        this.engineSelector.classList.add('active');
        this.isDropdownOpen = true;
        
        // 确保下拉菜单内容是最新的
        this.updateDropdownItems();
        
        console.log('Search Engine Manager - 下拉菜单已打开');
        console.log('Search Engine Manager - dropdown classes:', this.engineDropdown.className);
    }

    closeDropdown() {
        console.log('Search Engine Manager - 关闭下拉菜单');
        if (!this.engineDropdown) return;
        
        this.engineDropdown.classList.remove('show');
        this.engineSelector.classList.remove('active');
        this.isDropdownOpen = false;
        
        console.log('Search Engine Manager - 下拉菜单已关闭');
    }

    // 保存用户选择的引擎到本地存储
    saveLastEngine() {
        localStorage.setItem('lastSearchEngine', this.currentEngine);
    }

    // 从本地存储加载上次选择的引擎
    loadLastEngine() {
        const lastEngine = localStorage.getItem('lastSearchEngine');
        if (lastEngine && this.searchEngines[lastEngine]) {
            this.currentEngine = lastEngine;
        }
    }

    // 触发搜索事件，供其他模块监听
    dispatchSearchEvent(query, engine) {
        const event = new CustomEvent('searchPerformed', {
            detail: { query, engine, timestamp: new Date() }
        });
        document.dispatchEvent(event);
    }

    // 触发引擎切换事件
    dispatchEngineChangeEvent(engine) {
        const event = new CustomEvent('searchEngineChanged', {
            detail: { engine, engineInfo: this.searchEngines[engine] }
        });
        document.dispatchEvent(event);
    }

    // 公共API：获取当前引擎信息
    getCurrentEngine() {
        return {
            key: this.currentEngine,
            ...this.searchEngines[this.currentEngine]
        };
    }

    // 公共API：添加自定义搜索引擎
    addCustomEngine(key, engineConfig) {
        this.searchEngines[key] = engineConfig;
        this.updateDropdownItems();
    }

    // 公共API：移除搜索引擎
    removeEngine(key) {
        if (this.searchEngines[key] && Object.keys(this.searchEngines).length > 1) {
            delete this.searchEngines[key];
            
            // 如果删除的是当前引擎，切换到第一个可用引擎
            if (this.currentEngine === key) {
                this.currentEngine = Object.keys(this.searchEngines)[0];
                this.updateUI();
                this.saveLastEngine();
            }
            
            this.updateDropdownItems();
        }
    }
}

// 全局搜索功能，供其他模块调用
function performGlobalSearch(query, engineKey = null) {
    if (window.searchEngineManager) {
        if (engineKey && window.searchEngineManager.searchEngines[engineKey]) {
            window.searchEngineManager.switchEngine(engineKey);
        }
        
        if (query) {
            window.searchEngineManager.searchInput.value = query;
        }
        
        window.searchEngineManager.performSearch();
    }
}

// 初始化搜索引擎管理器
window.searchEngineManager = new SearchEngineManager();

// 调试函数：手动测试下拉菜单
window.testDropdown = function() {
    console.log('=== 下拉菜单测试 ===');
    if (window.searchEngineManager) {
        console.log('searchEngineManager 存在');
        console.log('engineSelector:', !!window.searchEngineManager.engineSelector);
        console.log('engineDropdown:', !!window.searchEngineManager.engineDropdown);
        console.log('当前下拉菜单状态:', window.searchEngineManager.isDropdownOpen);
        
        // 尝试强制打开下拉菜单
        window.searchEngineManager.toggleDropdown();
    } else {
        console.error('searchEngineManager 不存在');
    }
};