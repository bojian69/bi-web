/**
 * 高级SQL编辑器 - 基于Monaco Editor
 * 提供语法高亮、智能提示、错误检查、格式化等功能
 */

class AdvancedSQLEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.editor = null;
        this.options = {
            theme: 'vs-dark',
            language: 'sql',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            ...options
        };
        
        this.sqlKeywords = [
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 
            'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'UNION', 'INSERT', 'UPDATE', 'DELETE',
            'CREATE', 'ALTER', 'DROP', 'INDEX', 'TABLE', 'DATABASE', 'VIEW', 'PROCEDURE',
            'FUNCTION', 'TRIGGER', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
            'LIKE', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT', 'LIMIT'
        ];
        
        this.init();
    }
    
    async init() {
        try {
            // 检查Monaco Editor是否已加载
            if (typeof monaco === 'undefined') {
                await this.loadMonacoEditor();
            }
            
            this.createEditor();
            this.setupSQLLanguage();
            this.setupEventListeners();
            this.loadSavedQuery();
        } catch (error) {
            console.error('高级SQL编辑器初始化失败，回退到基础编辑器:', error);
            this.fallbackToBasicEditor();
        }
    }
    
    async loadMonacoEditor() {
        return new Promise((resolve, reject) => {
            // 创建Monaco Editor加载器
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
            script.onload = () => {
                require.config({ 
                    paths: { 
                        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
                    } 
                });
                
                require(['vs/editor/editor.main'], () => {
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createEditor() {
        // 清空容器并创建编辑器容器
        this.container.innerHTML = `
            <div class="advanced-sql-editor">
                <div class="sql-editor-toolbar">
                    <div class="toolbar-left">
                        <button class="toolbar-btn" data-action="format" title="格式化 (Shift+Alt+F)">
                            <i class="fas fa-magic"></i> 格式化
                        </button>
                        <button class="toolbar-btn" data-action="validate" title="验证SQL">
                            <i class="fas fa-check-circle"></i> 验证
                        </button>
                        <button class="toolbar-btn" data-action="clear" title="清空">
                            <i class="fas fa-trash"></i> 清空
                        </button>
                    </div>
                    <div class="toolbar-right">
                        <select class="theme-selector" title="主题">
                            <option value="vs-dark">深色主题</option>
                            <option value="vs">浅色主题</option>
                            <option value="hc-black">高对比度</option>
                        </select>
                        <button class="toolbar-btn" data-action="fullscreen" title="全屏 (F11)">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
                <div class="monaco-editor-container" id="monaco-${this.containerId}"></div>
                <div class="sql-editor-status">
                    <span class="status-info">
                        <span class="cursor-position">行 1, 列 1</span>
                        <span class="selection-info"></span>
                    </span>
                    <span class="editor-info">
                        <span class="line-count">1 行</span>
                        <span class="char-count">0 字符</span>
                    </span>
                </div>
            </div>
        `;
        
        const editorContainer = document.getElementById(`monaco-${this.containerId}`);
        const defaultSQL = this.getDefaultSQL();
        
        // 创建Monaco编辑器
        this.editor = monaco.editor.create(editorContainer, {
            value: defaultSQL,
            language: 'sql',
            theme: this.options.theme,
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            renderWhitespace: 'selection',
            rulers: [80, 120],
            bracketPairColorization: { enabled: true },
            suggest: {
                showKeywords: true,
                showSnippets: true
            }
        });
    }
    
    setupSQLLanguage() {
        // 注册SQL语言增强功能
        monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model, position) => {
                const text = model.getValue();
                const suggestions = [];
                
                // 使用智能提示系统
                if (window.sqlIntelliSense) {
                    const completionItems = window.sqlIntelliSense.getCompletionItems(text, position);
                    
                    completionItems.forEach(item => {
                        const suggestion = {
                            label: item.label,
                            insertText: item.insertText,
                            detail: item.detail,
                            sortText: item.sortText
                        };
                        
                        // 设置Monaco编辑器的类型
                        switch (item.kind) {
                            case 'keyword':
                                suggestion.kind = monaco.languages.CompletionItemKind.Keyword;
                                break;
                            case 'function':
                                suggestion.kind = monaco.languages.CompletionItemKind.Function;
                                suggestion.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                                break;
                            case 'table':
                                suggestion.kind = monaco.languages.CompletionItemKind.Class;
                                break;
                            case 'column':
                                suggestion.kind = monaco.languages.CompletionItemKind.Field;
                                break;
                            case 'snippet':
                                suggestion.kind = monaco.languages.CompletionItemKind.Snippet;
                                suggestion.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                                suggestion.documentation = item.description;
                                break;
                            default:
                                suggestion.kind = monaco.languages.CompletionItemKind.Text;
                        }
                        
                        suggestions.push(suggestion);
                    });
                } else {
                    // 备用方案：基础关键字提示
                    this.sqlKeywords.forEach(keyword => {
                        suggestions.push({
                            label: keyword,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: keyword,
                            detail: 'SQL关键字'
                        });
                    });
                }
                
                return { suggestions };
            }
        });
        
        // 注册格式化提供者
        monaco.languages.registerDocumentFormattingEditProvider('sql', {
            provideDocumentFormattingEdits: (model) => {
                let formatted;
                if (window.sqlIntelliSense) {
                    formatted = window.sqlIntelliSense.formatSQL(model.getValue());
                } else {
                    formatted = this.formatSQL(model.getValue());
                }
                return [{
                    range: model.getFullModelRange(),
                    text: formatted
                }];
            }
        });
        
        // 注册语法验证提供者
        monaco.languages.registerCodeActionProvider('sql', {
            provideCodeActions: (model, range, context) => {
                const actions = [];
                
                if (window.sqlIntelliSense) {
                    const errors = window.sqlIntelliSense.validateSQL(model.getValue());
                    
                    errors.forEach(error => {
                        if (error.severity === 'error') {
                            actions.push({
                                title: `修复: ${error.message}`,
                                kind: 'quickfix',
                                edit: {
                                    edits: [{
                                        resource: model.uri,
                                        edit: {
                                            range: new monaco.Range(error.line, error.column, error.line, error.column + 1),
                                            text: ''
                                        }
                                    }]
                                }
                            });
                        }
                    });
                }
                
                return { actions, dispose: () => {} };
            }
        });
    }
    
    setupEventListeners() {
        // 工具栏事件
        const toolbar = this.container.querySelector('.sql-editor-toolbar');
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.handleToolbarAction(action);
            }
        });
        
        // 主题切换
        const themeSelector = this.container.querySelector('.theme-selector');
        themeSelector.addEventListener('change', (e) => {
            monaco.editor.setTheme(e.target.value);
        });
        
        // 编辑器事件
        this.editor.onDidChangeModelContent(() => {
            this.updateStatus();
            this.saveQuery();
        });
        
        this.editor.onDidChangeCursorPosition(() => {
            this.updateCursorPosition();
        });
        
        this.editor.onDidChangeCursorSelection(() => {
            this.updateSelectionInfo();
        });
        
        // 快捷键
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            this.executeQuery();
        });
        
        this.editor.addCommand(monaco.KeyCode.F11, () => {
            this.toggleFullscreen();
        });
    }
    
    handleToolbarAction(action) {
        switch (action) {
            case 'format':
                this.formatCode();
                break;
            case 'validate':
                this.validateSQL();
                break;
            case 'clear':
                this.clearEditor();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
        }
    }
    
    formatCode() {
        this.editor.getAction('editor.action.formatDocument').run();
    }
    
    validateSQL() {
        const sql = this.getValue();
        let errors = [];
        
        if (window.sqlIntelliSense) {
            errors = window.sqlIntelliSense.validateSQL(sql);
        } else {
            errors = this.validateSQLSyntax(sql);
        }
        
        if (errors.length === 0) {
            this.showNotification('SQL语法验证通过', 'success');
            this.clearErrorDecorations();
        } else {
            this.showNotification(`发现 ${errors.length} 个语法错误`, 'error');
            this.highlightErrors(errors);
        }
        
        // 显示查询统计信息
        if (window.sqlIntelliSense && sql.trim()) {
            const stats = window.sqlIntelliSense.getQueryStats(sql);
            this.updateQueryStats(stats);
        }
    }
    
    validateSQLSyntax(sql) {
        const errors = [];
        const lines = sql.split('\n');
        
        // 简单的SQL语法检查
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                // 检查未闭合的引号
                const singleQuotes = (trimmed.match(/'/g) || []).length;
                const doubleQuotes = (trimmed.match(/"/g) || []).length;
                
                if (singleQuotes % 2 !== 0) {
                    errors.push({
                        line: index + 1,
                        column: trimmed.lastIndexOf("'") + 1,
                        message: '未闭合的单引号'
                    });
                }
                
                if (doubleQuotes % 2 !== 0) {
                    errors.push({
                        line: index + 1,
                        column: trimmed.lastIndexOf('"') + 1,
                        message: '未闭合的双引号'
                    });
                }
            }
        });
        
        return errors;
    }
    
    highlightErrors(errors) {
        const decorations = errors.map(error => ({
            range: new monaco.Range(error.line, error.column, error.line, error.column + 1),
            options: {
                isWholeLine: false,
                className: error.severity === 'error' ? 'sql-error-decoration' : 'sql-warning-decoration',
                hoverMessage: { 
                    value: `**${error.severity.toUpperCase()}**: ${error.message}`,
                    isTrusted: true
                },
                minimap: {
                    color: error.severity === 'error' ? '#ff0000' : '#ffa500',
                    position: monaco.editor.MinimapPosition.Inline
                }
            }
        }));
        
        this.errorDecorations = this.editor.deltaDecorations(this.errorDecorations || [], decorations);
    }
    
    clearEditor() {
        if (confirm('确定要清空编辑器内容吗？')) {
            this.editor.setValue('');
            this.editor.focus();
        }
    }
    
    toggleFullscreen() {
        const editorContainer = this.container.querySelector('.advanced-sql-editor');
        editorContainer.classList.toggle('fullscreen');
        
        // 更新按钮图标
        const btn = this.container.querySelector('[data-action="fullscreen"] i');
        if (editorContainer.classList.contains('fullscreen')) {
            btn.className = 'fas fa-compress';
            document.addEventListener('keydown', this.escapeHandler);
        } else {
            btn.className = 'fas fa-expand';
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // 重新布局编辑器
        setTimeout(() => this.editor.layout(), 100);
    }
    
    escapeHandler = (e) => {
        if (e.key === 'Escape') {
            this.toggleFullscreen();
        }
    }
    
    updateStatus() {
        const model = this.editor.getModel();
        const lineCount = model.getLineCount();
        const charCount = model.getValueLength();
        
        this.container.querySelector('.line-count').textContent = `${lineCount} 行`;
        this.container.querySelector('.char-count').textContent = `${charCount} 字符`;
        
        // 更新查询复杂度指示器
        if (window.sqlIntelliSense && model.getValue().trim()) {
            const stats = window.sqlIntelliSense.getQueryStats(model.getValue());
            this.updateComplexityIndicator(stats.complexity);
        }
    }
    
    updateCursorPosition() {
        const position = this.editor.getPosition();
        this.container.querySelector('.cursor-position').textContent = 
            `行 ${position.lineNumber}, 列 ${position.column}`;
    }
    
    updateSelectionInfo() {
        const selection = this.editor.getSelection();
        const selectionInfo = this.container.querySelector('.selection-info');
        
        if (selection.isEmpty()) {
            selectionInfo.textContent = '';
        } else {
            const selectedText = this.editor.getModel().getValueInRange(selection);
            const lines = selectedText.split('\n').length;
            const chars = selectedText.length;
            selectionInfo.textContent = `已选择 ${lines} 行, ${chars} 字符`;
        }
    }
    
    formatSQL(sql) {
        // 高级SQL格式化
        return sql
            .replace(/\s+/g, ' ')
            .replace(/\s*,\s*/g, ',\n    ')
            .replace(/\bSELECT\b/gi, 'SELECT')
            .replace(/\bFROM\b/gi, '\nFROM')
            .replace(/\bWHERE\b/gi, '\nWHERE')
            .replace(/\bAND\b/gi, '\n  AND')
            .replace(/\bOR\b/gi, '\n  OR')
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
    
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `sql-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // 添加到容器
        this.container.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    executeQuery() {
        const queryId = this.containerId.replace('sql-editor-', '');
        if (window.executeQuery) {
            executeQuery(queryId);
        }
    }
    
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }
    
    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }
    
    getDefaultSQL() {
        return `SELECT ref_field as label, 
       count(*) as 'value' 
FROM pro_refs 
GROUP BY ref_field;`;
    }
    
    saveQuery() {
        const queryId = this.containerId.replace('sql-editor-', '');
        localStorage.setItem(`sql_query_${queryId}`, this.getValue());
    }
    
    loadSavedQuery() {
        const queryId = this.containerId.replace('sql-editor-', '');
        const saved = localStorage.getItem(`sql_query_${queryId}`);
        if (saved && saved.trim() !== '') {
            this.setValue(saved);
        }
    }
    
    fallbackToBasicEditor() {
        // 如果Monaco Editor加载失败，回退到基础编辑器
        console.log('回退到基础SQL编辑器');
        if (window.SQLEditor) {
            new SQLEditor(this.containerId, this.options);
        }
    }
    
    clearErrorDecorations() {
        if (this.editor && this.errorDecorations) {
            this.editor.deltaDecorations(this.errorDecorations, []);
            this.errorDecorations = [];
        }
    }
    
    updateQueryStats(stats) {
        // 在状态栏显示查询统计信息
        const statusInfo = this.container.querySelector('.status-info');
        if (statusInfo && stats) {
            const statsHtml = `
                <span class="query-stats">
                    <i class="fas fa-table"></i> ${stats.tables.length} 表
                    <i class="fas fa-columns"></i> ${stats.columns.length} 列
                    <i class="fas fa-layer-group"></i> ${stats.complexity}
                </span>
            `;
            statusInfo.insertAdjacentHTML('beforeend', statsHtml);
        }
    }
    
    updateComplexityIndicator(complexity) {
        let indicator = this.container.querySelector('.complexity-indicator');
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'complexity-indicator';
            this.container.querySelector('.editor-info').appendChild(indicator);
        }
        
        indicator.className = `complexity-indicator ${complexity}`;
        indicator.innerHTML = `<i class="fas fa-tachometer-alt"></i> ${complexity}`;
    }
    
    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
        this.clearErrorDecorations();
    }
}

// 全局高级编辑器管理
const advancedSQLEditors = {};

// 初始化高级SQL编辑器
async function initAdvancedSQLEditors() {
    for (let i = 1; i <= 3; i++) {
        const container = document.getElementById(`sql-editor-${i}`);
        if (container) {
            advancedSQLEditors[i] = new AdvancedSQLEditor(`sql-editor-${i}`);
        }
    }
}

// 为新查询创建高级编辑器
function createAdvancedSQLEditor(queryId) {
    const container = document.getElementById(`sql-editor-${queryId}`);
    if (container) {
        advancedSQLEditors[queryId] = new AdvancedSQLEditor(`sql-editor-${queryId}`);
    }
}

// 获取查询内容（兼容接口）
function getAdvancedQueryContent(queryId) {
    return advancedSQLEditors[queryId] ? advancedSQLEditors[queryId].getValue() : '';
}

// 设置查询内容（兼容接口）
function setAdvancedQueryContent(queryId, content) {
    if (advancedSQLEditors[queryId]) {
        advancedSQLEditors[queryId].setValue(content);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检测是否支持Monaco Editor
    const useAdvancedEditor = !window.location.search.includes('basic=1');
    
    if (useAdvancedEditor) {
        setTimeout(initAdvancedSQLEditors, 200);
    } else {
        // 使用基础编辑器
        setTimeout(initSQLEditors, 100);
    }
});