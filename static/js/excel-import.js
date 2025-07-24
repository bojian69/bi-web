// Excel导入功能增强版
class ExcelImporter {
    constructor() {
        this.selectedFile = null;
        this.previewData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // 文件选择事件
        const fileInput = document.getElementById('excel-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // 导入按钮事件
        const importBtn = document.getElementById('import-excel-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importExcel());
        }

        // 下载模板按钮事件
        const templateBtn = document.getElementById('download-template-btn');
        if (templateBtn) {
            templateBtn.addEventListener('click', () => this.downloadExcelTemplate());
        }

        // 移除文件按钮事件
        const removeBtn = document.getElementById('remove-file-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeSelectedFile());
        }

        // 预览按钮事件
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.togglePreview());
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');
        if (!uploadArea) return;

        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // 拖拽进入和离开的视觉反馈
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlight(uploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlight(uploadArea), false);
        });

        // 处理文件拖放
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);

        // 点击上传区域触发文件选择
        uploadArea.addEventListener('click', () => {
            document.getElementById('excel-file').click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('dragover');
    }

    unhighlight(element) {
        element.classList.remove('dragover');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.handleFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFiles(files);
        }
    }

    handleFiles(files) {
        const file = files[0];
        
        // 验证文件类型
        if (!this.validateFile(file)) {
            return;
        }

        this.selectedFile = file;
        this.displaySelectedFile(file);
        this.previewFile(file);
    }

    validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        if (!validTypes.includes(file.type) && !hasValidExtension) {
            this.showStatus('请选择有效的Excel文件 (.xlsx, .xls) 或CSV文件', 'error');
            return false;
        }

        // 检查文件大小 (限制为10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showStatus('文件大小不能超过10MB', 'error');
            return false;
        }

        return true;
    }

    displaySelectedFile(file) {
        const selectedFileDiv = document.getElementById('selected-file');
        const fileNameSpan = document.getElementById('file-name');
        const fileSizeSpan = document.getElementById('file-size');
        const importBtn = document.getElementById('import-excel-btn');

        if (selectedFileDiv && fileNameSpan && fileSizeSpan) {
            fileNameSpan.textContent = file.name;
            fileSizeSpan.textContent = this.formatFileSize(file.size);
            selectedFileDiv.style.display = 'block';
            
            if (importBtn) {
                importBtn.disabled = false;
            }
        }
    }

    removeSelectedFile() {
        this.selectedFile = null;
        this.previewData = null;
        
        const selectedFileDiv = document.getElementById('selected-file');
        const fileInput = document.getElementById('excel-file');
        const importBtn = document.getElementById('import-excel-btn');
        const previewDiv = document.getElementById('excel-preview');

        if (selectedFileDiv) selectedFileDiv.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (importBtn) importBtn.disabled = true;
        if (previewDiv) previewDiv.style.display = 'none';

        this.showStatus('', '');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async previewFile(file) {
        try {
            this.showStatus('正在预览文件...', 'processing');
            
            const data = await this.readFileAsArrayBuffer(file);
            let jsonData;

            if (file.name.toLowerCase().endsWith('.csv')) {
                jsonData = await this.parseCSV(data);
            } else {
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            }

            this.previewData = jsonData;
            this.displayPreview(jsonData);
            this.showStatus(`预览成功，共 ${jsonData.length} 行数据`, 'success');
            
        } catch (error) {
            console.error('预览文件失败:', error);
            this.showStatus(`预览失败: ${error.message}`, 'error');
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    async parseCSV(data) {
        // 简单的CSV解析
        const text = new TextDecoder('utf-8').decode(data);
        const lines = text.split('\n').filter(line => line.trim());
        return lines.map(line => {
            // 简单的CSV解析，支持逗号分隔
            return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        });
    }

    displayPreview(data) {
        const previewDiv = document.getElementById('excel-preview');
        const previewTable = document.getElementById('preview-table');
        const previewStats = document.getElementById('preview-stats');

        if (!previewDiv || !previewTable || !previewStats) return;

        // 显示统计信息
        const rowCount = data.length;
        const colCount = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;
        previewStats.textContent = `${rowCount} 行 × ${colCount} 列`;

        // 生成预览表格 (只显示前10行)
        const previewRows = data.slice(0, 10);
        let tableHTML = '<thead><tr>';
        
        // 生成表头
        if (previewRows.length > 0) {
            const maxCols = Math.max(...previewRows.map(row => row.length));
            for (let i = 0; i < maxCols; i++) {
                tableHTML += `<th>列 ${i + 1}</th>`;
            }
        }
        tableHTML += '</tr></thead><tbody>';

        // 生成表格内容
        previewRows.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${this.escapeHtml(String(cell || ''))}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';

        previewTable.innerHTML = tableHTML;
        previewDiv.style.display = 'block';
    }

    togglePreview() {
        const previewDiv = document.getElementById('excel-preview');
        if (previewDiv) {
            previewDiv.style.display = previewDiv.style.display === 'none' ? 'block' : 'none';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async importExcel() {
        if (!this.selectedFile) {
            this.showStatus('请先选择Excel文件', 'error');
            return;
        }

        try {
            this.showStatus('正在处理Excel文件...', 'processing');
            this.updateProgress(20);

            const data = await this.readFileAsArrayBuffer(this.selectedFile);
            this.updateProgress(40);

            let jsonData;
            if (this.selectedFile.name.toLowerCase().endsWith('.csv')) {
                jsonData = await this.parseCSV(data);
            } else {
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                jsonData = XLSX.utils.sheet_to_json(worksheet);
            }

            this.updateProgress(60);

            // 提取SQL查询
            const sqlQueries = this.extractSQLQueries(jsonData);
            this.updateProgress(80);

            if (sqlQueries.length === 0) {
                this.showStatus('未在Excel文件中找到SQL查询', 'error');
                return;
            }

            // 导入查询到系统
            await this.importQueriesToSystem(sqlQueries);
            this.updateProgress(100);

            this.showStatus(`成功导入 ${sqlQueries.length} 个SQL查询`, 'success');

            // 3秒后隐藏进度条
            setTimeout(() => {
                this.hideProgress();
            }, 3000);

        } catch (error) {
            console.error('导入Excel失败:', error);
            this.showStatus(`导入失败: ${error.message}`, 'error');
            this.hideProgress();
        }
    }

    extractSQLQueries(jsonData) {
        const sqlQueries = [];
        
        jsonData.forEach(row => {
            Object.values(row).forEach(value => {
                if (typeof value === 'string') {
                    const trimmedValue = value.trim();
                    if (this.isSQLQuery(trimmedValue)) {
                        sqlQueries.push(trimmedValue);
                    }
                }
            });
        });

        return [...new Set(sqlQueries)]; // 去重
    }

    isSQLQuery(text) {
        const sqlKeywords = ['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
        const upperText = text.toUpperCase();
        return sqlKeywords.some(keyword => upperText.startsWith(keyword));
    }

    async importQueriesToSystem(sqlQueries) {
        // 清除现有查询
        this.clearExistingQueries();

        // 重置查询计数器
        window.queryCount = 0;
        window.activeTab = 1;
        window.queryResults = {};

        // 添加从Excel中提取的查询
        for (let i = 0; i < sqlQueries.length; i++) {
            const sql = sqlQueries[i];
            await this.addQueryToSystem(sql, i + 1);
        }

        // 切换到第一个查询
        if (sqlQueries.length > 0) {
            switchTab(1);
        }
    }

    clearExistingQueries() {
        // 删除所有现有的查询标签和容器
        document.querySelectorAll('.tab:not(.new-tab)').forEach(tab => {
            tab.remove();
        });

        document.querySelectorAll('.query-container').forEach(container => {
            container.remove();
        });
    }

    async addQueryToSystem(sql, queryNumber) {
        window.queryCount++;
        const queryId = window.queryCount;

        // 创建新标签
        const tabsContainer = document.getElementById('query-tabs');
        const newTabButton = tabsContainer.querySelector('.new-tab');

        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab', queryId);
        tabElement.innerHTML = `
            <i class="fas fa-database"></i> 查询 ${queryId}
            <span class="close-tab" onclick="removeQuery(${queryId}, event)"><i class="fas fa-times"></i></span>
        `;
        tabElement.onclick = () => switchTab(queryId);

        tabsContainer.insertBefore(tabElement, newTabButton);

        // 创建新查询容器
        const queryContainer = document.createElement('div');
        queryContainer.className = 'query-container';
        queryContainer.id = `query-${queryId}`;

        queryContainer.innerHTML = `
            <div class="sql-editor-container" id="sql-editor-${queryId}"></div>
            <div class="query-actions">
                <button class="execute-btn" onclick="executeQuery(${queryId})">
                    <i class="fas fa-play"></i> 执行查询
                </button>
                <button class="save-btn" onclick="saveQuery(${queryId})">
                    <i class="fas fa-save"></i> 保存
                </button>
            </div>
            <div class="error"></div>
            <div class="visual-controls" style="display:none;"></div>
            <div class="result"></div>
        `;

        document.getElementById('queries-container').appendChild(queryContainer);

        // 等待DOM更新后初始化SQL编辑器
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 初始化SQL编辑器并设置内容
        if (typeof createSQLEditor === 'function') {
            createSQLEditor(queryId);
            // 等待编辑器创建完成后设置内容
            setTimeout(() => {
                if (typeof setQueryContent === 'function') {
                    setQueryContent(queryId, sql);
                }
            }, 200);
        }
    }

    downloadExcelTemplate() {
        try {
            // 创建Excel工作簿
            const wb = XLSX.utils.book_new();
            
            // 创建示例数据
            const data = [
                ['SQL查询模板表'],
                [''],
                ['说明：请在下方表格中填写SQL查询语句，系统将自动识别并导入'],
                [''],
                ['查询名称', 'SQL语句', '备注'],
                ['用户统计查询', 'SELECT department, COUNT(*) as count FROM employees GROUP BY department;', '按部门统计员工数量'],
                ['销售趋势查询', 'SELECT DATE(order_date) as date, SUM(amount) as total FROM orders WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(order_date) ORDER BY date;', '最近30天销售趋势'],
                ['产品分析查询', 'SELECT category, AVG(price) as avg_price, COUNT(*) as product_count FROM products GROUP BY category;', '产品分类分析'],
                ['', '', ''],
                ['注意事项：'],
                ['1. SQL语句必须以SELECT、WITH、INSERT等关键字开头'],
                ['2. 支持复杂的SQL查询，包括JOIN、子查询等'],
                ['3. 文件大小不超过10MB'],
                ['4. 支持.xlsx、.xls和.csv格式']
            ];
            
            // 创建工作表
            const ws = XLSX.utils.aoa_to_sheet(data);
            
            // 设置列宽
            const wscols = [
                { wch: 20 },  // 查询名称列
                { wch: 80 },  // SQL语句列
                { wch: 30 }   // 备注列
            ];
            ws['!cols'] = wscols;

            // 设置单元格样式（标题行）
            if (ws['A1']) {
                ws['A1'].s = {
                    font: { bold: true, sz: 16 },
                    alignment: { horizontal: 'center' }
                };
            }

            // 合并标题单元格
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // 合并标题行
                { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }  // 合并说明行
            ];
            
            // 将工作表添加到工作簿
            XLSX.utils.book_append_sheet(wb, ws, "SQL查询模板");
            
            // 生成Excel文件并下载
            XLSX.writeFile(wb, `SQL查询模板_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            this.showStatus('Excel模板下载成功', 'success');
            
        } catch (error) {
            console.error('下载模板失败:', error);
            this.showStatus(`下载模板失败: ${error.message}`, 'error');
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('import-status');
        if (!statusDiv) return;

        statusDiv.className = type ? `status-${type}` : '';
        statusDiv.innerHTML = message;

        if (type === 'processing') {
            statusDiv.innerHTML = `<span class="loading-spinner"></span> ${message}`;
        }
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.getElementById('progress-container');
        
        if (progressBar && progressContainer) {
            progressContainer.style.display = 'block';
            progressBar.style.width = `${percentage}%`;
        }
    }

    hideProgress() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }
}

// 初始化Excel导入器
let excelImporter;
document.addEventListener('DOMContentLoaded', function() {
    excelImporter = new ExcelImporter();
});

// 兼容原有的函数调用
function importExcel() {
    if (excelImporter) {
        excelImporter.importExcel();
    }
}

function downloadExcelTemplate() {
    if (excelImporter) {
        excelImporter.downloadExcelTemplate();
    }
}