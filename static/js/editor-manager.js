/**
 * SQL编辑器管理器
 * 统一管理高级编辑器和基础编辑器的切换
 */

class EditorManager {
    constructor() {
        this.currentEditorType = this.getPreferredEditorType();
        this.editors = {};
        this.init();
    }
    
    init() {
        this.createEditorToggle();
        this.bindEvents();
    }
    
    getPreferredEditorType() {
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('editor') === 'basic') {
            return 'basic';
        }
        
        // 检查本地存储
        const saved = localStorage.getItem('preferredEditor');
        if (saved) {
            return saved;
        }
        
        // 检查浏览器兼容性
        if (this.isAdvancedEditorSupported()) {
            return 'advanced';
        }
        
        return 'basic';
    }
    
    isAdvancedEditorSupported() {
        // 检查是否支持Monaco Editor所需的特性
        return !!(
            window.fetch &&
            window.Promise &&
            window.URL &&
            document.createElement('div').style.grid !== undefined
        );
    }
    
    createEditorToggle() {
        // 在导航栏添加编辑器切换按钮
        const nav = document.querySelector('.nav-links');
        if (nav) {
            const toggleHtml = `
                <div class="editor-toggle">
                    <label class="toggle-label">
                        <i class="fas fa-code"></i>
                        <span>高级编辑器</span>
                        <input type="checkbox" id="editor-toggle" ${this.currentEditorType === 'advanced' ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `;
            nav.insertAdjacentHTML('beforeend', toggleHtml);
        }
    }
    
    bindEvents() {
        const toggle = document.getElementById('editor-toggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const newType = e.target.checked ? 'advanced' : 'basic';
                this.switchEditorType(newType);
            });
        }
    }
    
    async switchEditorType(newType) {
        if (newType === this.currentEditorType) return;
        
        // 保存当前编辑器内容
        const currentContents = {};
        Object.keys(this.editors).forEach(queryId => {
            currentContents[queryId] = this.getEditorContent(queryId);
        });
        
        // 显示切换提示
        this.showSwitchingNotification();
        
        // 销毁当前编辑器
        this.destroyAllEditors();
        
        // 更新编辑器类型
        this.currentEditorType = newType;
        localStorage.setItem('preferredEditor', newType);
        
        // 重新初始化编辑器
        await this.initializeAllEditors();
        
        // 恢复内容
        Object.keys(currentContents).forEach(queryId => {
            this.setEditorContent(queryId, currentContents[queryId]);
        });
        
        // 隐藏切换提示
        this.hideSwitchingNotification();
        
        // 显示成功提示
        this.showSuccessNotification(newType);
    }
    
    async initializeAllEditors() {
        const containers = document.querySelectorAll('[id^="sql-editor-"]');
        
        for (const container of containers) {
            const queryId = container.id.replace('sql-editor-', '');
            await this.createEditor(queryId);
        }
    }
    
    async createEditor(queryId) {
        const container = document.getElementById(`sql-editor-${queryId}`);
        if (!container) return;
        
        try {
            if (this.currentEditorType === 'advanced') {
                // 创建高级编辑器
                this.editors[queryId] = new AdvancedSQLEditor(`sql-editor-${queryId}`);
            } else {
                // 创建基础编辑器
                this.editors[queryId] = new SQLEditor(`sql-editor-${queryId}`);
            }
        } catch (error) {
            console.error(`创建编辑器失败 (queryId: ${queryId}):`, error);
            // 回退到基础编辑器
            if (this.currentEditorType === 'advanced') {
                this.editors[queryId] = new SQLEditor(`sql-editor-${queryId}`);
            }
        }
    }
    
    destroyAllEditors() {
        Object.values(this.editors).forEach(editor => {
            if (editor && typeof editor.dispose === 'function') {
                editor.dispose();
            }
        });
        this.editors = {};
    }
    
    getEditorContent(queryId) {
        const editor = this.editors[queryId];
        if (editor && typeof editor.getValue === 'function') {
            return editor.getValue();
        }
        return '';
    }
    
    setEditorContent(queryId, content) {
        const editor = this.editors[queryId];
        if (editor && typeof editor.setValue === 'function') {
            editor.setValue(content);
        }
    }
    
    showSwitchingNotification() {
        const notification = document.createElement('div');
        notification.id = 'editor-switching-notification';
        notification.className = 'editor-notification switching';
        notification.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>正在切换编辑器...</span>
        `;
        document.body.appendChild(notification);
    }
    
    hideSwitchingNotification() {
        const notification = document.getElementById('editor-switching-notification');
        if (notification) {
            notification.remove();
        }
    }
    
    showSuccessNotification(editorType) {
        const notification = document.createElement('div');
        notification.className = 'editor-notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>已切换到${editorType === 'advanced' ? '高级' : '基础'}编辑器</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // 公共接口方法
    getCurrentEditorType() {
        return this.currentEditorType;
    }
    
    getEditor(queryId) {
        return this.editors[queryId];
    }
    
    async addEditor(queryId) {
        await this.createEditor(queryId);
    }
    
    removeEditor(queryId) {
        const editor = this.editors[queryId];
        if (editor && typeof editor.dispose === 'function') {
            editor.dispose();
        }
        delete this.editors[queryId];
    }
}

// 全局编辑器管理器实例
let editorManager = null;

// 初始化编辑器管理器
function initEditorManager() {
    editorManager = new EditorManager();
    
    // 重写全局函数以使用编辑器管理器
    window.createSQLEditor = function(queryId) {
        if (editorManager) {
            editorManager.addEditor(queryId);
        }
    };
    
    window.createAdvancedSQLEditor = function(queryId) {
        if (editorManager) {
            editorManager.addEditor(queryId);
        }
    };
    
    window.getQueryContent = function(queryId) {
        return editorManager ? editorManager.getEditorContent(queryId) : '';
    };
    
    window.setQueryContent = function(queryId, content) {
        if (editorManager) {
            editorManager.setEditorContent(queryId, content);
        }
    };
    
    window.getAdvancedQueryContent = function(queryId) {
        return editorManager ? editorManager.getEditorContent(queryId) : '';
    };
    
    window.setAdvancedQueryContent = function(queryId, content) {
        if (editorManager) {
            editorManager.setEditorContent(queryId, content);
        }
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initEditorManager, 50);
});