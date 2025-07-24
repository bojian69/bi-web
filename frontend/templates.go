package frontend

import (
	"html/template"
	"net/http"
)

// IndexHandler 处理首页请求
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	tmpl := `<!DOCTYPE html>
<html>
<head>
    <title>数据分析平台</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/static/css/style.css">
    <link rel="stylesheet" href="/static/css/sql-editor.css">
    <link rel="stylesheet" href="/static/css/simple-advanced-editor.css">
    <link rel="stylesheet" href="/static/css/advanced-sql-editor.css">
    <link rel="stylesheet" href="/static/css/editor-manager.css">
    <link rel="stylesheet" href="/static/css/query-actions.css">
    <link rel="stylesheet" href="/static/css/excel-import.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/element-plus@2.3.14/dist/index.css">

</head>
<body>
    <div class="container">
        <h1><i class="fas fa-chart-bar"></i> 数据分析平台</h1>
        
        <!-- 快速导航栏 -->
        <nav class="quick-nav" id="quickNav">
            <div class="nav-container">
                <div class="nav-brand">
                    <i class="fas fa-chart-bar"></i>
                    <span>快速导航</span>
                </div>
                <div class="nav-links">
                    <a href="#queries-container" class="nav-link" data-section="queries">
                        <i class="fas fa-database"></i>
                        <span>查询区域</span>
                    </a>
                    <a href="#comparison-result" class="nav-link" data-section="comparison">
                        <i class="fas fa-chart-line"></i>
                        <span>结果合并</span>
                    </a>
                    <a href="#analysis-report" class="nav-link" data-section="analysis">
                        <i class="fas fa-chart-pie"></i>
                        <span>数据分析</span>
                    </a>
                    <a href="#excel-import" class="nav-link" data-section="excel">
                        <i class="fas fa-file-excel"></i>
                        <span>Excel导入</span>
                    </a>
                </div>
                <div class="nav-toggle">
                    <i class="fas fa-bars"></i>
                </div>
            </div>
        </nav>
        
        <!-- 标签页导航 -->
        <div class="tabs" id="query-tabs">
            <div class="tab active" data-tab="1" onclick="switchTab(1)">
                <i class="fas fa-database"></i> SQL查询
            </div>
        </div>
        
        <!-- 查询容器 -->
        <div id="queries-container">
            <div class="query-container active" id="query-1">
                <div class="sql-editor-container" id="sql-editor-1"></div>
                <div class="query-actions">
                    <button class="execute-btn" onclick="executeQuery(1)">
                        <i class="fas fa-play"></i> 执行查询
                    </button>
                    <button class="save-btn" onclick="saveQuery(1)">
                        <i class="fas fa-save"></i> 保存
                    </button>
                </div>
                <div class="error"></div>
                <div class="visual-controls" style="display:none;"></div>
                <div class="result"></div>
            </div>
            <div class="query-container" id="query-2">
                <div class="sql-editor-container" id="sql-editor-2"></div>
                <div class="query-actions">
                    <button class="execute-btn" onclick="executeQuery(2)">
                        <i class="fas fa-play"></i> 执行查询
                    </button>
                    <button class="save-btn" onclick="saveQuery(2)">
                        <i class="fas fa-save"></i> 保存
                    </button>
                </div>
                <div class="error"></div>
                <div class="visual-controls" style="display:none;"></div>
                <div class="result"></div>
            </div>
            <div class="query-container" id="query-3">
                <div class="sql-editor-container" id="sql-editor-3"></div>
                <div class="query-actions">
                    <button class="execute-btn" onclick="executeQuery(3)">
                        <i class="fas fa-play"></i> 执行查询
                    </button>
                    <button class="save-btn" onclick="saveQuery(3)">
                        <i class="fas fa-save"></i> 保存
                    </button>
                </div>
                <div class="error"></div>
                <div class="visual-controls" style="display:none;"></div>
                <div class="result"></div>
            </div>
        </div>
        
        <div style="margin-top: 20px;" class="action-buttons">
            <button class="execute-all-btn" onclick="executeAllQueries()"><i class="fas fa-play-circle"></i> 一键执行所有查询</button>
            <button class="compare-btn" onclick="compareQueries()"><i class="fas fa-chart-line"></i> 合并查询结果</button>
            <button class="analyze-btn" onclick="analyzeResults()"><i class="fas fa-chart-pie"></i> 数据分析报表</button>
        </div>
        
        <div id="comparison-result" style="margin-top: 30px;"></div>
        
        <!-- 数据分析报表区域 -->
        <div id="analysis-report" style="margin-top: 30px; display: none;">
            <h2><i class="fas fa-chart-pie"></i> 数据分析报表</h2>
            <div class="analysis-dimensions" style="margin-bottom: 20px;">
                <h3>选择分析维度</h3>
                <div class="dimension-options" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                    <div class="dimension-group">
                        <h4>基础分析</h4>
                        <label><input type="checkbox" class="dimension-checkbox" value="overview" checked> 数据概览</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="statistics" checked> 统计分析</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="quality" checked> 数据质量分析</label>
                    </div>
                    <div class="dimension-group">
                        <h4>高级分析</h4>
                        <label><input type="checkbox" class="dimension-checkbox" value="distribution" checked> 分布分析</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="outliers" checked> 异常值检测</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="correlation" checked> 相关性分析</label>
                    </div>
                    <div class="dimension-group">
                        <h4>智能分析</h4>
                        <label><input type="checkbox" class="dimension-checkbox" value="insights" checked> 自动洞察</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="trends" checked> 趋势分析</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="patterns" checked> 模式识别</label>
                    </div>
                    <div class="dimension-group">
                        <h4>业务维度</h4>
                        <label><input type="checkbox" class="dimension-checkbox" value="business_impact" checked> 业务影响分析</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="time_series" checked> 时间序列分析</label>
                        <label><input type="checkbox" class="dimension-checkbox" value="segmentation" checked> 数据分类分析</label>
                    </div>
                </div>
                <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button id="select-all-dimensions" class="dimension-btn">全选</button>
                        <button id="deselect-all-dimensions" class="dimension-btn">取消全选</button>
                    </div>
                    <button id="apply-dimensions" class="dimension-apply-btn">应用选择的维度</button>
                </div>
            </div>
            <div class="report-content"></div>
        </div>
        
        <!-- Excel导入区域 -->
        <div id="excel-import" class="excel-import">
            <h3><i class="fas fa-file-excel"></i> Excel数据导入</h3>
            
            <!-- 文件上传区域 -->
            <div id="upload-area" class="upload-area">
                <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="upload-text">拖拽Excel文件到此处，或点击选择文件</div>
                <div class="upload-hint">支持 .xlsx, .xls, .csv 格式，最大10MB</div>
                <div class="file-input-wrapper">
                    <input type="file" id="excel-file" accept=".xlsx,.xls,.csv">
                    <div class="file-input-button">
                        <i class="fas fa-folder-open"></i>
                        <span>选择文件</span>
                    </div>
                </div>
            </div>
            
            <!-- 选中文件显示 -->
            <div id="selected-file" class="selected-file">
                <div class="file-info">
                    <div class="file-details">
                        <i class="fas fa-file-excel file-icon"></i>
                        <div>
                            <div id="file-name" class="file-name"></div>
                            <div id="file-size" class="file-size"></div>
                        </div>
                    </div>
                    <button id="remove-file-btn" class="remove-file">
                        <i class="fas fa-times"></i> 移除
                    </button>
                </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="excel-actions">
                <button id="import-excel-btn" class="excel-btn" disabled>
                    <i class="fas fa-upload"></i>
                    <span>导入并执行</span>
                </button>
                <button id="preview-btn" class="excel-btn secondary">
                    <i class="fas fa-eye"></i>
                    <span>预览数据</span>
                </button>
                <button id="download-template-btn" class="excel-btn secondary">
                    <i class="fas fa-download"></i>
                    <span>下载模板</span>
                </button>
            </div>
            
            <!-- 导入状态 -->
            <div id="import-status"></div>
            
            <!-- 进度条 -->
            <div id="progress-container" class="progress-container" style="display: none;">
                <div id="progress-bar" class="progress-bar"></div>
            </div>
            
            <!-- 数据预览 -->
            <div id="excel-preview" class="excel-preview">
                <div class="preview-header">
                    <div class="preview-title">
                        <i class="fas fa-table"></i> 数据预览
                    </div>
                    <div id="preview-stats" class="preview-stats"></div>
                </div>
                <table id="preview-table" class="preview-table"></table>
            </div>
        </div>
        
        <footer style="text-align: center; margin-top: 50px; color: #7f8c8d; font-size: 14px;">
            <p>数据分析Web平台 - 基于Go语言的MySQL数据查询可视化工具</p>
        </footer>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

    <script src="/static/js/sql-intellisense.js"></script>
    <script src="/static/js/sql-editor.js"></script>
    <script src="/static/js/simple-advanced-editor.js"></script>
    <script src="/static/js/advanced-sql-editor.js"></script>
    <script src="/static/js/editor-manager.js"></script>
    <script src="/static/js/excel-import.js"></script>
    <script src="/static/js/data-analysis-rules.js"></script>
    <script src="/static/js/report-generator.js"></script>
    <script src="/static/js/fallback-analyzer.js"></script>
    <script src="/static/js/data-analyzer.js"></script>
    <script src="/static/js/main.js"></script>
    <script>
        // 快速导航吸顶效果
        window.addEventListener('scroll', function() {
            const nav = document.getElementById('quickNav');
            const navTop = nav.offsetTop;
            
            if (window.pageYOffset >= navTop) {
                nav.classList.add('sticky');
                document.body.style.paddingTop = nav.offsetHeight + 'px';
            } else {
                nav.classList.remove('sticky');
                document.body.style.paddingTop = '0';
            }
        });
        
        // 导航链接点击平滑滚动
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const navHeight = document.getElementById('quickNav').offsetHeight;
                    const targetPosition = targetElement.offsetTop - navHeight - 20;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // 更新活跃状态
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
        
        // 移动端导航切换
        document.querySelector('.nav-toggle').addEventListener('click', function() {
            document.querySelector('.nav-links').classList.toggle('show');
        });
    </script>
</body>
</html>`

	t, _ := template.New("index").Parse(tmpl)
	t.Execute(w, nil)
}