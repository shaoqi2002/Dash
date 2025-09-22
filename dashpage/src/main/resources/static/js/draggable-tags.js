// 可拖拽标签管理器
class DraggableTagManager {
    constructor() {
        this.tags = [];
        this.draggedElement = null;
        this.offset = { x: 0, y: 0 };
        this.tagCounter = 0;
        this.container = null;
        this.isDragging = false;
        this.animationFrameId = null;
        this.lastMoveTime = 0;
        this.dragPosition = { x: 0, y: 0 };
        this.containerRect = null; // 缓存容器矩形信息
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.container = document.querySelector('.widgets-container');
            if (this.container) {
                this.bindEvents();
                this.loadTags();
                this.loadBilibiliData(); // 加载Bilibili数据
                this.convertExistingTagsToTransform(); // 确保现有标签使用transform定位
            }
        });
    }

    // 将现有的标签转换为使用transform定位，避免跳动
    convertExistingTagsToTransform() {
        const existingTags = this.container.querySelectorAll('.draggable-tag');
        existingTags.forEach(tag => {
            const computedStyle = getComputedStyle(tag);
            if (computedStyle.transform === 'none') {
                // 如果没有transform，从left/top转换
                const left = parseInt(tag.style.left) || 0;
                const top = parseInt(tag.style.top) || 0;
                
                tag.style.transform = `translate3d(${left}px, ${top}px, 0)`;
                // 保留left/top作为备份
            }
        });
    }

    bindEvents() {
        // 鼠标事件 - 使用passive listeners提升性能
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: false });
        
        // 直接绑定mousemove事件，在内部进行节流处理
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
        document.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: true });
        
        // 防止默认拖拽
        this.container.addEventListener('dragstart', e => e.preventDefault());
        
        // 防止右键菜单在拖拽时出现
        this.container.addEventListener('contextmenu', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });
        
        // 处理窗口失焦时的拖拽中断
        window.addEventListener('blur', () => {
            if (this.isDragging) {
                this.handleMouseUp(new MouseEvent('mouseup'));
            }
        });
    }

    // 加载Bilibili数据并创建标签
    async loadBilibiliData() {
        try {
            const response = await fetch('/api/bilibili/trending');
            const result = await response.json();
            
            if (result.success && result.data) {
                console.log('加载到Bilibili数据:', result.data.length, '条');
                this.createBilibiliTags(result.data);
            } else {
                console.error('获取Bilibili数据失败:', result.message);
            }
        } catch (error) {
            console.error('请求Bilibili数据失败:', error);
        }
    }

    // 创建Bilibili集成区块
    createBilibiliTags(biliData) {
        // 创建一个集成的Bilibili区块
        this.createBilibiliBlock(biliData, 50, 50);
    }

    // 创建Bilibili集成区块
    createBilibiliBlock(biliData, x, y) {
        const tagId = ++this.tagCounter;
        
        const bilibiliBlock = document.createElement('div');
        bilibiliBlock.className = 'draggable-tag bilibili-block';
        bilibiliBlock.setAttribute('data-tag-id', tagId);
        // 直接使用transform定位，避免后续切换时的跳动
        bilibiliBlock.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        bilibiliBlock.style.left = x + 'px'; // 保留left/top作为后备
        bilibiliBlock.style.top = y + 'px';
        
        // 创建内容HTML
        let contentHtml = `
            <div class="bilibili-header">
                <i class="fas fa-play-circle bilibili-icon"></i>
                <span class="bilibili-title">Bilibili热门 (${biliData.length}条)</span>
                <button class="refresh-btn" title="刷新数据">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="tag-close" title="关闭">×</button>
            </div>
            <div class="bilibili-content">
                <div class="bilibili-stats">
                    <span class="stats-text">实时热门排行榜</span>
                    <span class="update-time">更新时间: ${new Date().toLocaleTimeString()}</span>
                </div>
        `;
        
        biliData.forEach((item, index) => {
            const hotIcon = index < 3 ? '<i class="fas fa-fire hot-icon"></i>' : '';
            contentHtml += `
                <div class="bilibili-item" data-link="${item.link}" data-keyword="${item.keyword}">
                    <span class="item-index rank-${index < 3 ? 'top' : 'normal'}">${index + 1}</span>
                    <span class="item-text" title="${item.show_name}">${item.show_name}</span>
                    ${hotIcon}
                    <i class="fas fa-external-link-alt item-link-icon"></i>
                </div>
            `;
        });
        
        contentHtml += `
            </div>
            <div class="bilibili-footer">
                <small><i class="fas fa-info-circle"></i> 点击条目在新窗口中搜索 • 数据来源：Bilibili热门</small>
            </div>
        `;
        
        bilibiliBlock.innerHTML = contentHtml;
        
        // 为每个条目添加点击事件
        bilibiliBlock.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-close')) {
                return; // 关闭按钮交给其他处理函数
            }
            
            // 处理刷新按钮点击
            if (e.target.closest('.refresh-btn')) {
                this.refreshSingleBilibiliBlock(bilibiliBlock);
                e.stopPropagation();
                return;
            }
            
            const item = e.target.closest('.bilibili-item');
            if (item) {
                const link = item.getAttribute('data-link');
                const keyword = item.getAttribute('data-keyword');
                
                // 添加点击动效
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 150);
                
                window.open(link, '_blank');
                console.log(`点击了Bilibili热门: ${keyword}`);
                e.stopPropagation(); // 阻止事件冒泡
            }
        });
        
        this.container.appendChild(bilibiliBlock);
        
        // 保存标签数据
        this.tags.push({
            id: tagId,
            text: 'Bilibili热门',
            x: x,
            y: y,
            type: 'bilibili',
            data: biliData
        });
        
        return bilibiliBlock;
    }

    handleMouseDown(e) {
        const tag = e.target.closest('.draggable-tag');
        if (!tag) return;

        // 如果点击关闭按钮
        if (e.target.classList.contains('tag-close')) {
            this.removeTag(tag);
            return;
        }

        this.startDrag(tag, e.clientX, e.clientY);
    }

    startDrag(tag, clientX, clientY) {
        this.draggedElement = tag;
        this.isDragging = true;
        
        // 缓存容器矩形，避免在mousemove中重复计算
        this.containerRect = this.container.getBoundingClientRect();
        
        const rect = tag.getBoundingClientRect();
        
        this.offset.x = clientX - rect.left;
        this.offset.y = clientY - rect.top;
        
        // 使用元素的当前视觉位置作为起始位置，确保无跳动
        const containerRect = this.containerRect;
        this.dragPosition.x = rect.left - containerRect.left;
        this.dragPosition.y = rect.top - containerRect.top;
        
        // 临时禁用过渡动画，避免在设置transform时的动画效果
        const originalTransition = tag.style.transition;
        tag.style.transition = 'none';
        
        // 清除旧的定位方式，设置新的transform定位
        tag.style.left = '';
        tag.style.top = '';
        tag.style.transform = `translate3d(${this.dragPosition.x}px, ${this.dragPosition.y}px, 0)`;
        
        // 强制重绘，确保位置更新完成
        tag.offsetHeight;
        
        // 恢复过渡动画（除了transform属性）
        tag.style.transition = originalTransition;
        
        // 添加拖拽样式
        tag.classList.add('dragging');
        
        // 设置更高的z-index确保在最前面
        tag.style.zIndex = '1001';
        
        // 防止文本选择
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        // 缓存元素尺寸，避免在拖拽过程中重复查询
        this.elementWidth = tag.offsetWidth;
        this.elementHeight = tag.offsetHeight;
        this.containerWidth = this.container.clientWidth;
        this.containerHeight = this.container.clientHeight;
    }

    handleMouseMove(e) {
        if (!this.draggedElement || !this.isDragging) return;
        
        // 使用requestAnimationFrame进行高效的节流处理
        if (this.animationFrameId) {
            return; // 如果上一帧还没完成，跳过这次更新
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            if (!this.draggedElement || !this.isDragging) {
                this.animationFrameId = null;
                return;
            }
            
            // 使用缓存的容器矩形信息
            let x = e.clientX - this.containerRect.left - this.offset.x;
            let y = e.clientY - this.containerRect.top - this.offset.y;
            
            // 使用缓存的尺寸进行边界检测
            x = Math.max(0, Math.min(x, this.containerWidth - this.elementWidth));
            y = Math.max(0, Math.min(y, this.containerHeight - this.elementHeight));
            
            // 更新拖拽位置
            this.dragPosition.x = x;
            this.dragPosition.y = y;
            
            // 使用transform进行流畅更新（利用GPU加速）
            this.draggedElement.style.transform = `translate3d(${this.dragPosition.x}px, ${this.dragPosition.y}px, 0)`;
            
            this.animationFrameId = null;
        });
    }

    handleMouseUp(e) {
        if (this.draggedElement) {
            // 取消任何pending的动画帧
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            this.draggedElement.classList.remove('dragging');
            
            // 恢复z-index
            this.draggedElement.style.zIndex = '';
            
            // 关键修复：完全使用transform定位，不设置left/top避免跳动
            // 当前transform已经是正确位置，无需任何位置调整
            
            // 保存最终位置到数据模型
            this.saveTagPosition(this.draggedElement);
            
            // 恢复文本选择
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            
            // 清理缓存数据
            this.containerRect = null;
            this.elementWidth = null;
            this.elementHeight = null;
            this.containerWidth = null;
            this.containerHeight = null;
            
            this.draggedElement = null;
            this.isDragging = false;
        }
    }

    addNewTag(text = '新标签', x = null, y = null, theme = null) {
        const tagId = ++this.tagCounter;
        const themes = ['theme-green', 'theme-orange', 'theme-purple', 'theme-red'];
        const selectedTheme = theme || themes[Math.floor(Math.random() * themes.length)];
        
        // 随机位置
        if (x === null) x = Math.random() * (this.container.clientWidth - 150);
        if (y === null) y = Math.random() * (this.container.clientHeight - 50);
        
        const tag = document.createElement('div');
        tag.className = `draggable-tag ${selectedTheme}`;
        tag.setAttribute('data-tag-id', tagId);
        // 直接使用transform定位，避免后续切换时的跳动
        tag.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        tag.style.left = x + 'px'; // 保留left/top作为后备，但主要使用transform
        tag.style.top = y + 'px';
        
        tag.innerHTML = `
            <span class="tag-content">${text}</span>
            <button class="tag-close">×</button>
        `;
        
        this.container.appendChild(tag);
        
        // 保存标签数据
        this.tags.push({
            id: tagId,
            text: text,
            x: x,
            y: y,
            type: 'custom',
            theme: selectedTheme
        });
        
        this.saveTags();
        return tag;
    }

    removeTag(tagElement) {
        const tagId = parseInt(tagElement.getAttribute('data-tag-id'));
        
        // 添加删除动画
        tagElement.style.transform = 'scale(0)';
        tagElement.style.opacity = '0';
        
        setTimeout(() => {
            tagElement.remove();
            this.tags = this.tags.filter(tag => tag.id !== tagId);
            this.saveTags();
        }, 300);
    }

    saveTagPosition(tagElement) {
        const tagId = parseInt(tagElement.getAttribute('data-tag-id'));
        const tag = this.tags.find(t => t.id === tagId);
        
        if (tag) {
            // 直接使用拖拽过程中记录的位置，这是最准确的
            if (this.dragPosition && typeof this.dragPosition.x === 'number' && typeof this.dragPosition.y === 'number') {
                tag.x = this.dragPosition.x;
                tag.y = this.dragPosition.y;
            } else {
                // 后备方案：从transform获取
                const computedStyle = getComputedStyle(tagElement);
                const transform = computedStyle.transform;
                
                if (transform && transform !== 'none') {
                    const matrix = new DOMMatrix(transform);
                    tag.x = matrix.m41;
                    tag.y = matrix.m42;
                } else {
                    // 最后的后备方案：从left/top获取
                    tag.x = parseInt(tagElement.style.left) || 0;
                    tag.y = parseInt(tagElement.style.top) || 0;
                }
            }
            
            this.saveTags();
        }
    }

    saveTags() {
        // 只保存自定义标签，不保存Bilibili标签
        const customTags = this.tags.filter(tag => tag.type === 'custom');
        localStorage.setItem('draggableTags', JSON.stringify(customTags));
    }

    loadTags() {
        const savedTags = localStorage.getItem('draggableTags');
        if (savedTags) {
            try {
                const customTags = JSON.parse(savedTags);
                customTags.forEach(tagData => {
                    this.tagCounter = Math.max(this.tagCounter, tagData.id);
                    this.addNewTag(tagData.text, tagData.x, tagData.y, tagData.theme || 'theme-green');
                });
            } catch (e) {
                console.error('加载自定义标签失败:', e);
            }
        } else {
            // 如果没有保存的标签，创建一些示例标签
            this.addNewTag('工作', 100, 400);
            this.addNewTag('学习', 300, 450);
            this.addNewTag('生活', 200, 500);
        }
    }

    // 刷新单个Bilibili区块
    async refreshSingleBilibiliBlock(blockElement) {
        try {
            const refreshBtn = blockElement.querySelector('.refresh-btn i');
            refreshBtn.classList.add('fa-spin');
            
            const response = await fetch('/api/bilibili/refresh', { method: 'POST' });
            const result = await response.json();
            
            if (result.success && result.data) {
                // 更新区块内容
                this.updateBilibiliBlockContent(blockElement, result.data);
                console.log('单个Bilibili区块刷新成功:', result.data.length, '条');
            } else {
                console.error('刷新Bilibili区块失败:', result.message);
                alert('刷新失败: ' + result.message);
            }
        } catch (error) {
            console.error('刷新Bilibili区块请求失败:', error);
            alert('网络请求失败，请检查网络连接');
        } finally {
            const refreshBtn = blockElement.querySelector('.refresh-btn i');
            if (refreshBtn) {
                refreshBtn.classList.remove('fa-spin');
            }
        }
    }

    // 更新Bilibili区块内容
    updateBilibiliBlockContent(blockElement, biliData) {
        const contentDiv = blockElement.querySelector('.bilibili-content');
        const headerTitle = blockElement.querySelector('.bilibili-title');
        
        // 更新标题中的数据条数
        headerTitle.textContent = `Bilibili热门 (${biliData.length}条)`;
        
        // 重新构建内容
        let contentHtml = `
            <div class="bilibili-stats">
                <span class="stats-text">实时热门排行榜</span>
                <span class="update-time">更新时间: ${new Date().toLocaleTimeString()}</span>
            </div>
        `;
        
        biliData.forEach((item, index) => {
            const hotIcon = index < 3 ? '<i class="fas fa-fire hot-icon"></i>' : '';
            contentHtml += `
                <div class="bilibili-item" data-link="${item.link}" data-keyword="${item.keyword}">
                    <span class="item-index rank-${index < 3 ? 'top' : 'normal'}">${index + 1}</span>
                    <span class="item-text" title="${item.show_name}">${item.show_name}</span>
                    ${hotIcon}
                    <i class="fas fa-external-link-alt item-link-icon"></i>
                </div>
            `;
        });
        
        contentDiv.innerHTML = contentHtml;
        
        // 更新tags数组中的数据
        const tagId = parseInt(blockElement.getAttribute('data-tag-id'));
        const tag = this.tags.find(t => t.id === tagId);
        if (tag) {
            tag.data = biliData;
        }
    }

    // 刷新Bilibili数据
    async refreshBilibiliData() {
        try {
            // 先移除现有的Bilibili区块
            const bilibiliBlocks = this.container.querySelectorAll('.bilibili-block');
            bilibiliBlocks.forEach(block => block.remove());
            this.tags = this.tags.filter(tag => tag.type !== 'bilibili');
            
            // 重新请求数据
            const response = await fetch('/api/bilibili/refresh', { method: 'POST' });
            const result = await response.json();
            
            if (result.success && result.data) {
                console.log('刷新Bilibili数据成功:', result.data.length, '条');
                this.createBilibiliTags(result.data);
                return true;
            } else {
                console.error('刷新Bilibili数据失败:', result.message);
                return false;
            }
        } catch (error) {
            console.error('刷新Bilibili数据请求失败:', error);
            return false;
        }
    }
}

// 全局函数
function addNewTag() {
    if (window.tagManager) {
        window.tagManager.addNewTag();
    }
}

async function refreshBilibiliData() {
    if (window.tagManager) {
        const success = await window.tagManager.refreshBilibiliData();
        if (success) {
            alert('Bilibili数据刷新成功！');
        } else {
            alert('Bilibili数据刷新失败！');
        }
    }
}

// 初始化拖拽管理器
window.tagManager = new DraggableTagManager();