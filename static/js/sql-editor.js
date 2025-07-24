// 简化的SQL编辑器管理器
class SQLEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.editor = null;
        this.lineNumbers = null;
        this.options = options;
        this.lastLineCount = 0;
        this.isInitialized = false;
        
        if (this.container) {
            try {
                this.init();
                this.isInitialized = true;
            } catch (error) {
                console.error('SQL编辑器初始化失败:', error);
            }
        }
    }
    
    init() {
        this.createEditor();
        this.setupEventListeners();
        this.loadSavedQuery();
    }
    
    createEditor() {
        const defaultSQL = this.options.value || `SELECT ref_field as label, count(*) as 'value' 
FROM pro_refs 
GROUP BY ref_field;`;
        const editorId = this.containerId.replace('sql-editor-', '');
        
        this.container.innerHTML = `
            <div class="sql-editor-header">
                <div>
                    <i class="fas fa-code"></i>
                    SQL查询编辑器 ${editorId}
                </div>
                <div class="sql-editor-tools">
                    <button class="sql-editor-tool" onclick="this.parentNode.parentNode.parentNode.sqlEditor.formatSQL()" title="格式化SQL (Ctrl+Shift+F)">
                        <i class="fas fa-magic"></i>
                    </button>
                    <button class="sql-editor-tool" onclick="this.parentNode.parentNode.parentNode.sqlEditor.clearEditor()" title="清空">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="sql-editor-with-lines">
                <div class="sql-line-numbers" id="line-numbers-${editorId}">1</div>
                <div class="sql-content">
                    <textarea 
                        class="sql-textarea" 
                        id="sql-textarea-${editorId}"
                        placeholder="输入SQL查询语句..."
                        spellcheck="false"
                    >${defaultSQL}</textarea>
                </div>
            </div>
        `;
        
        this.editor = document.getElementById(`sql-textarea-${editorId}`);
        this.lineNumbers = document.getElementById(`line-numbers-${editorId}`);
        this.container.sqlEditor = this; // 保存引用以便事件处理
        
        this.updateLineNumbers();
    }
    
    setupEventListeners() {
        if (!this.editor) return;
        
        // 输入事件 - 使用防抖优化
        let inputTimeout;
        this.editor.addEventListener('input', () => {
            // 立即更新行号以保持响应性
            this.updateLineNumbers();
            
            // 防抖保存
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            inputTimeout = setTimeout(() => {
                this.saveQuery();
            }, 500);
        });
        
        // 键盘事件
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // 滚动同步 - 使用节流优化
        let scrollTimeout;
        this.editor.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(() => {
                if (this.lineNumbers) {
                    this.lineNumbers.scrollTop = this.editor.scrollTop;
                }
            });
        });
        
        // 焦点事件 - 确保行号同步
        this.editor.addEventListener('focus', () => {
            this.syncLineNumbers();
        });
        
        // 窗口大小变化时重新同步
        window.addEventListener('resize', () => {
            setTimeout(() => this.syncLineNumbers(), 100);
        });
    }
    
    handleKeyDown(e) {
        // Ctrl+Enter 执行查询
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const queryId = this.containerId.replace('sql-editor-', '');
            if (window.executeQuery) {
                executeQuery(queryId);
            }
        }
        
        // Ctrl+Shift+F 格式化
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            this.formatSQL();
        }
        
        // Tab 缩进
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertText('    ');
        }
    }
    
    updateLineNumbers() {
        if (!this.editor || !this.lineNumbers) return;
        
        const lines = this.editor.value.split('\n');
        const lineCount = lines.length;
        
        // 性能优化：只在行数变化时更新
        if (this.lastLineCount === lineCount) return;
        this.lastLineCount = lineCount;
        
        // 使用文档片段提高性能
        const fragment = document.createDocumentFragment();
        for (let i = 1; i <= lineCount; i++) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'line-number';
            lineDiv.textContent = i;
            fragment.appendChild(lineDiv);
        }
        
        this.lineNumbers.innerHTML = '';
        this.lineNumbers.appendChild(fragment);
    }
    
    insertText(text) {
        if (!this.editor) return;
        
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const value = this.editor.value;
        
        this.editor.value = value.substring(0, start) + text + value.substring(end);
        this.editor.setSelectionRange(start + text.length, start + text.length);
        
        this.updateLineNumbers();
        this.syncLineNumbers();
    }
    
    // 同步行号位置
    syncLineNumbers() {
        if (!this.editor || !this.lineNumbers) return;
        
        requestAnimationFrame(() => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
        });
    }
    
    formatSQL() {
        if (!this.editor) return;
        
        const sql = this.editor.value;
        const formatted = this.formatSQLString(sql);
        this.editor.value = formatted;
        this.updateLineNumbers();
        this.saveQuery();
    }
    
    formatSQLString(sql) {
        // 简单的SQL格式化
        return sql
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\s*,\s*/g, ',\n    ') // 逗号后换行
            .replace(/\bSELECT\b/gi, 'SELECT')
            .replace(/\bFROM\b/gi, '\nFROM')
            .replace(/\bWHERE\b/gi, '\nWHERE')
            .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
            .replace(/\bORDER BY\b/gi, '\nORDER BY')
            .replace(/\bHAVING\b/gi, '\nHAVING')
            .replace(/\bJOIN\b/gi, '\nJOIN')
            .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
            .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
            .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
            .replace(/\bUNION\b/gi, '\nUNION')
            .trim();
    }
    
    clearEditor() {
        if (!this.editor) return;
        
        if (confirm('确定要清空编辑器内容吗？')) {
            this.editor.value = '';
            this.updateLineNumbers();
            this.saveQuery();
            this.editor.focus();
        }
    }
    
    getValue() {
        return this.editor ? this.editor.value : '';
    }
    
    setValue(value) {
        if (this.editor) {
            this.editor.value = value;
            this.updateLineNumbers();
            this.syncLineNumbers();
        }
    }
    
    // 获取实际显示行数（考虑换行）
    getActualLineCount() {
        if (!this.editor) return 1;
        
        const text = this.editor.value;
        const lines = text.split('\n');
        let actualLines = 0;
        
        // 计算每行的实际显示行数
        const editorWidth = this.editor.clientWidth;
        const charWidth = 8.4; // 单字符宽度估算
        const charsPerLine = Math.floor((editorWidth - 30) / charWidth);
        
        lines.forEach(line => {
            if (line.length === 0) {
                actualLines += 1;
            } else {
                actualLines += Math.ceil(line.length / charsPerLine) || 1;
            }
        });
        
        return Math.max(actualLines, lines.length);
    }
    
    saveQuery() {
        if (!this.editor) return;
        
        const queryId = this.containerId.replace('sql-editor-', '');
        localStorage.setItem(`sql_query_${queryId}`, this.editor.value);
    }
    
    loadSavedQuery() {
        const queryId = this.containerId.replace('sql-editor-', '');
        const saved = localStorage.getItem(`sql_query_${queryId}`);
        if (saved && saved.trim() !== '') {
            // 如果有保存的查询且不是默认的，则使用保存的
            const defaultSQL = `SELECT ref_field as label, count(*) as 'value' 
FROM pro_refs 
GROUP BY ref_field;`;
            if (saved !== defaultSQL) {
                this.setValue(saved);
            }
        }
    }
}

// 全局SQL编辑器管理
const sqlEditors = {};

// 初始化SQL编辑器
function initSQLEditors() {
    // 初始化现有的编辑器
    for (let i = 1; i <= 3; i++) {
        const container = document.getElementById(`sql-editor-${i}`);
        if (container) {
            sqlEditors[i] = new SQLEditor(`sql-editor-${i}`);
        }
    }
}

// 为新查询创建编辑器
function createSQLEditor(queryId) {
    const container = document.getElementById(`sql-editor-${queryId}`);
    if (container) {
        sqlEditors[queryId] = new SQLEditor(`sql-editor-${queryId}`);
    }
}

// 获取查询内容
function getQueryContent(queryId) {
    return sqlEditors[queryId] ? sqlEditors[queryId].getValue() : '';
}

// 设置查询内容
function setQueryContent(queryId, content) {
    if (sqlEditors[queryId]) {
        sqlEditors[queryId].setValue(content);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化以确保DOM完全加载
    setTimeout(initSQLEditors, 100);
});