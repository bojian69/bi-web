/**
 * 简化版高级SQL编辑器
 * 专注于解决输入框无法写入的问题
 */

class SimpleAdvancedSQLEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.editor = null;
        this.isInitialized = false;
        
        if (this.container) {
            this.init();
        }
    }
    
    async init() {
        try {
            // 显示加载状态
            this.showLoading();
            
            // 加载Monaco Editor
            await this.loadMonaco();
            
            // 创建编辑器
            this.createEditor();
            
            // 设置事件监听
            this.setupEvents();
            
            this.isInitialized = true;
            console.log(`高级编辑器 ${this.containerId} 初始化成功`);
            
        } catch (error) {
            console.error('高级编辑器初始化失败:', error);
            this.fallback();
        }
    }
    
    showLoading() {
        this.container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 200px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #007bff;"></i>
                    </div>
                    <div style="color: #ffffff;">正在加载高级编辑器...</div>
                </div>
            </div>
        `;
    }
    
    async loadMonaco() {
        // 如果已经加载了Monaco，直接返回
        if (window.monaco) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            // 检查是否已经有加载器
            if (window.require && window.require.config) {
                window.require(['vs/editor/editor.main'], resolve, reject);
                return;
            }
            
            // 加载Monaco Editor
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
            
            script.onload = () => {
                window.require.config({
                    paths: {
                        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
                    }
                });
                
                window.require(['vs/editor/editor.main'], resolve, reject);
            };
            
            script.onerror = () => reject(new Error('Monaco Editor加载失败'));
            document.head.appendChild(script);
        });
    }
    
    createEditor() {
        // 创建编辑器HTML结构
        this.container.innerHTML = `
            <div class="simple-advanced-editor">
                <div class="editor-toolbar">
                    <button class="btn-format" title="格式化SQL">
                        <i class="fas fa-magic"></i> 格式化
                    </button>
                    <button class="btn-clear" title="清空">
                        <i class="fas fa-trash"></i> 清空
                    </button>
                    <span class="editor-status">高级编辑器</span>
                </div>
                <div class="monaco-container" id="monaco-${this.containerId}" style="height: 300px; border: 1px solid #ddd;"></div>
            </div>
        `;
        
        const container = document.getElementById(`monaco-${this.containerId}`);
        const defaultSQL = this.getDefaultSQL();
        
        // 创建Monaco编辑器实例
        this.editor = window.monaco.editor.create(container, {
            value: defaultSQL,
            language: 'sql',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            fontSize: 14,
            fontFamily: 'Monaco, Consolas, monospace'
        });
        
        // 确保编辑器获得焦点
        setTimeout(() => {
            this.editor.focus();
        }, 100);
    }
    
    setupEvents() {
        // 格式化按钮
        const formatBtn = this.container.querySelector('.btn-format');
        if (formatBtn) {
            formatBtn.addEventListener('click', () => {
                this.formatSQL();
            });
        }
        
        // 清空按钮
        const clearBtn = this.container.querySelector('.btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('确定要清空编辑器内容吗？')) {
                    this.editor.setValue('');
                    this.editor.focus();
                }
            });
        }
        
        // 内容变化事件
        this.editor.onDidChangeModelContent(() => {
            this.saveQuery();
        });
    }
    
    formatSQL() {
        if (!this.editor) return;
        
        const sql = this.editor.getValue();
        const formatted = sql
            .replace(/\s+/g, ' ')
            .replace(/\bSELECT\b/gi, 'SELECT')
            .replace(/\bFROM\b/gi, '\nFROM')
            .replace(/\bWHERE\b/gi, '\nWHERE')
            .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
            .replace(/\bORDER BY\b/gi, '\nORDER BY')
            .trim();
        
        this.editor.setValue(formatted);
    }
    
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }
    
    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value || '');
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
    
    fallback() {
        console.log('回退到基础编辑器');
        this.container.innerHTML = '';
        
        // 尝试创建基础编辑器
        if (window.SQLEditor) {
            new SQLEditor(this.containerId);
        } else {
            // 最基础的文本框
            this.container.innerHTML = `
                <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; color: #666;">
                        SQL查询编辑器 (基础模式)
                    </div>
                    <textarea 
                        style="width: 100%; height: 280px; border: none; padding: 10px; font-family: monospace; font-size: 14px; resize: vertical;"
                        placeholder="输入SQL查询语句..."
                    >${this.getDefaultSQL()}</textarea>
                </div>
            `;
        }
    }
    
    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}

// 全局简化编辑器管理
window.simpleAdvancedEditors = {};

// 创建简化高级编辑器
async function createSimpleAdvancedEditor(queryId) {
    const container = document.getElementById(`sql-editor-${queryId}`);
    if (container) {
        window.simpleAdvancedEditors[queryId] = new SimpleAdvancedSQLEditor(`sql-editor-${queryId}`);
    }
}

// 获取编辑器内容
function getSimpleAdvancedContent(queryId) {
    const editor = window.simpleAdvancedEditors[queryId];
    return editor ? editor.getValue() : '';
}

// 设置编辑器内容
function setSimpleAdvancedContent(queryId, content) {
    const editor = window.simpleAdvancedEditors[queryId];
    if (editor) {
        editor.setValue(content);
    }
}