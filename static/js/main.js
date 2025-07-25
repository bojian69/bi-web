// 全局变量
let queryResults = {}; // 存储所有查询结果
let queryCount = 1; // 当前查询数量
let activeTab = 1; // 当前激活的标签页

// 获取SQL查询内容
function getSQLQuery(queryId) {
    if (window.getQueryContent) {
        return getQueryContent(queryId);
    }
    const textarea = document.querySelector(`#sql-textarea-${queryId}`);
    return textarea ? textarea.value : '';
}

// 设置SQL查询内容
function setSQLQuery(queryId, sql) {
    if (window.setQueryContent) {
        setQueryContent(queryId, sql);
    } else {
        const textarea = document.querySelector(`#sql-textarea-${queryId}`);
        if (textarea) {
            textarea.value = sql;
        }
    }
}

// 保存查询
function saveQuery(queryId) {
    const sql = getSQLQuery(queryId);
    if (!sql.trim()) {
        alert('查询内容为空，无法保存');
        return;
    }
    
    // 保存到本地存储
    let savedQueries = JSON.parse(localStorage.getItem('savedQueries') || '[]');
    const queryName = prompt('请输入查询名称:', `查询_${new Date().toLocaleString()}`);
    
    if (queryName) {
        savedQueries.push({
            name: queryName,
            sql: sql,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
        alert('查询已保存！');
    }
}

// 切换标签页
function switchTab(tabId) {
    // 更新激活的标签
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    
    // 更新激活的查询容器
    document.querySelectorAll('.query-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`query-${tabId}`).classList.add('active');
    
    // 更新当前激活的标签页
    activeTab = tabId;
}

// 执行查询
async function executeQuery(queryId) {
    const container = document.getElementById(`query-${queryId}`);
    const errorDiv = container.querySelector('.error');
    const resultDiv = container.querySelector('.result');
    const visualControls = container.querySelector('.visual-controls');
    
    const query = getSQLQuery(queryId);
    
    errorDiv.innerHTML = '';
    resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 查询中...</div>';
    visualControls.style.display = 'none';
    
    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        queryResults[queryId] = data; // 保存查询结果
        
        if (data.error) {
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.error}`;
            resultDiv.innerHTML = '';
            return;
        }
        
        // 显示查询统计信息
        let statsHtml = '';
        if (data.duration) {
            statsHtml += `<div class="query-stats"><i class="fas fa-clock"></i> 执行耗时: <strong>${data.duration}</strong>`;
            if (data.rowCount !== undefined) {
                statsHtml += ` | <i class="fas fa-list"></i> 返回行数: <strong>${data.rowCount}</strong>`;
            }
            statsHtml += '</div>';
        }
        
        if (data.rows.length === 0) {
            resultDiv.innerHTML = statsHtml + '<p><i class="fas fa-info-circle"></i> 查询成功，无数据返回</p>';
            return;
        }
        
        // 显示可视化控制按钮
        if (data.visualizationTypes && data.visualizationTypes.length > 0) {
            let controlsHtml = statsHtml + '<div class="viz-buttons">';
            data.visualizationTypes.forEach(type => {
                const active = type === 'table' ? 'active' : '';
                const icon = getVisualTypeIcon(type);
                controlsHtml += `<button class="${active}" onclick="changeVisualization(${queryId}, '${type}')"><i class="${icon}"></i> ${getVisualTypeName(type)}</button>`;
            });
            controlsHtml += '</div>';
            visualControls.innerHTML = controlsHtml;
            visualControls.style.display = 'block';
        } else {
            // 即使没有可视化选项，也显示统计信息
            if (statsHtml) {
                visualControls.innerHTML = statsHtml;
                visualControls.style.display = 'block';
            }
        }
        
        // 默认显示表格视图
        renderVisualization(queryId, 'table');
        
    } catch (err) {
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> 请求失败: ${err.message}`;
        resultDiv.innerHTML = '';
    }
}

// 切换可视化类型
function changeVisualization(queryId, type) {
    const container = document.getElementById(`query-${queryId}`);
    if (!container) {
        console.error(`找不到查询容器: query-${queryId}`);
        return;
    }
    
    const buttons = container.querySelectorAll('.viz-buttons button');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        // 使用更精确的匹配方式
        const btnText = btn.textContent.trim();
        const targetText = getVisualTypeName(type);
        if (btnText.includes(targetText)) {
            btn.classList.add('active');
        }
    });
    
    renderVisualization(queryId, type);
}

// 根据类型渲染可视化
function renderVisualization(queryId, type) {
    const data = queryResults[queryId];
    if (!data || !data.rows || !data.columns) return;
    
    const container = document.getElementById(`query-${queryId}`).querySelector('.result');
    container.innerHTML = '';
    
    switch (type) {
        case 'table':
            renderTable(container, data);
            break;
        case 'bar':
            renderBarChart(container, data);
            break;
        case 'line':
            renderLineChart(container, data);
            break;
        case 'pie':
            renderPieChart(container, data);
            break;
    }
}

// 渲染表格
function renderTable(container, data) {
    let html = '<table><thead><tr>';
    data.columns.forEach(col => html += '<th>' + col + '</th>');
    html += '</tr></thead><tbody>';
    
    data.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => html += '<td>' + (cell || '') + '</td>');
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

// 渲染柱状图
function renderBarChart(container, data) {
    container.innerHTML = '<canvas height="500"></canvas>';
    const canvas = container.querySelector('canvas');
    
    const labels = data.rows.map(row => String(row[0]));
    const values = data.rows.map(row => parseFloat(row[1]) || 0);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: data.columns[1] || '数值',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 渲染折线图
function renderLineChart(container, data) {
    container.innerHTML = '<canvas height="500"></canvas>';
    const canvas = container.querySelector('canvas');
    
    const labels = data.rows.map(row => String(row[0]));
    const values = data.rows.map(row => parseFloat(row[1]) || 0);
    
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: data.columns[1] || '数值',
                data: values,
                fill: false,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 渲染饼图
function renderPieChart(container, data) {
    container.innerHTML = '<canvas height="500"></canvas>';
    const canvas = container.querySelector('canvas');
    
    const labels = data.rows.map(row => String(row[0]));
    const values = data.rows.map(row => parseFloat(row[1]) || 0);
    
    const backgroundColors = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)'
    ];
    
    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 获取可视化类型的显示名称
function getVisualTypeName(type) {
    const names = {
        'table': '表格',
        'bar': '柱状图',
        'line': '折线图',
        'pie': '饼图'
    };
    return names[type] || type;
}

// 获取可视化类型的图标
function getVisualTypeIcon(type) {
    const icons = {
        'table': 'fas fa-table',
        'bar': 'fas fa-chart-bar',
        'line': 'fas fa-chart-line',
        'pie': 'fas fa-chart-pie'
    };
    return icons[type] || 'fas fa-chart-bar';
}

// 添加新查询
function addQuery() {
    queryCount++;
    
    // 创建新标签
    const tabsContainer = document.getElementById('query-tabs');
    const newTabButton = tabsContainer.querySelector('.new-tab');
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.setAttribute('data-tab', queryCount);
    tabElement.innerHTML = `
        <i class="fas fa-database"></i> 查询 ${queryCount}
        <span class="close-tab" onclick="removeQuery(${queryCount}, event)"><i class="fas fa-times"></i></span>
    `;
    tabElement.onclick = () => switchTab(queryCount);
    
    // 插入新标签到"新查询"按钮前面
    tabsContainer.insertBefore(tabElement, newTabButton);
    
    // 创建新查询容器
    const queryContainer = document.createElement('div');
    queryContainer.className = 'query-container';
    queryContainer.id = `query-${queryCount}`;
    
    queryContainer.innerHTML = `
        <div class="sql-editor-container" id="sql-editor-${queryCount}"></div>
        <div class="query-actions">
            <button class="execute-btn" onclick="executeQuery(${queryCount})">
                <i class="fas fa-play"></i> 执行查询
            </button>
            <button class="save-btn" onclick="saveQuery(${queryCount})">
                <i class="fas fa-save"></i> 保存
            </button>
        </div>
        <div class="error"></div>
        <div class="visual-controls" style="display:none;"></div>
        <div class="result"></div>
    `;
    
    document.getElementById('queries-container').appendChild(queryContainer);
    
    // 初始化新的SQL编辑器
    setTimeout(() => {
        createSQLEditor(queryCount);
    }, 100);
    
    // 切换到新标签页
    switchTab(queryCount);
}

// 删除查询
function removeQuery(queryId, event) {
    // 阻止事件冒泡，避免触发标签切换
    if (event) {
        event.stopPropagation();
    }
    
    // 确保至少保留一个查询
    const allTabs = document.querySelectorAll('.tab:not(.new-tab)');
    if (allTabs.length <= 1) {
        alert('至少需要保留一个查询');
        return;
    }
    
    // 删除标签
    const tabElement = document.querySelector(`.tab[data-tab="${queryId}"]`);
    if (tabElement) {
        tabElement.remove();
    }
    
    // 删除查询容器
    const queryContainer = document.getElementById(`query-${queryId}`);
    if (queryContainer) {
        queryContainer.remove();
    }
    
    // 删除查询结果和编辑器实例
    delete queryResults[queryId];
    
    // 清理编辑器实例
    if (window.sqlEditors && window.sqlEditors[queryId]) {
        if (window.sqlEditors[queryId].dispose) {
            window.sqlEditors[queryId].dispose();
        }
        delete window.sqlEditors[queryId];
    }
    

    
    // 如果删除的是当前激活的标签，切换到第一个可用标签
    if (activeTab == queryId) {
        const remainingTabs = document.querySelectorAll('.tab:not(.new-tab)');
        if (remainingTabs.length > 0) {
            const firstTabId = remainingTabs[0].getAttribute('data-tab');
            switchTab(parseInt(firstTabId));
        }
    }
}

// 合并查询结果
function compareQueries() {
    // 检查是否有足够的查询结果
    const validResults = [];
    for (const queryId in queryResults) {
        const result = queryResults[queryId];
        if (result && !result.error && result.rows && result.rows.length > 0) {
            validResults.push(result);
        }
    }
    
    if (validResults.length < 2) {
        alert('需要至少两个有效的查询结果才能合并');
        return;
    }
    
    // 调用后端API进行合并
    fetch('/api/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: validResults })
    })
    .then(response => response.json())
    .then(mergedData => {
        if (mergedData.error) {
            alert('合并失败: ' + mergedData.error);
            return;
        }
        
        displayMergedResults(mergedData, validResults);
    })
    .catch(error => {
        console.error('合并请求失败:', error);
        alert('合并请求失败: ' + error.message);
    });
}

// 显示合并结果
function displayMergedResults(mergedData, originalResults) {
    const comparisonResult = document.getElementById('comparison-result');
    comparisonResult.innerHTML = '<h2><i class="fas fa-chart-line"></i> 查询结果合并展示</h2>';
    
    // 创建表格展示合并结果
    const allLabels = new Set();
    
    // 收集所有标签
    originalResults.forEach(data => {
        data.rows.forEach(row => {
            if (row.length > 0) {
                allLabels.add(String(row[0]));
            }
        });
    });
    
    // 创建表格，包含执行时间信息
    let html = '<div class="comparison-stats"><h3>查询执行统计</h3><div class="stats-grid">';
    
    // 使用后端返回的统计信息
    if (mergedData.queryStats) {
        mergedData.queryStats.forEach((stat, index) => {
            const originalData = originalResults[index];
            let queryId = '';
            for (const id in queryResults) {
                if (queryResults[id] === originalData) {
                    queryId = id;
                    break;
                }
            }
            
            html += `<div class="stat-card">`;
            html += `<h4><i class="fas fa-database"></i> 查询 ${queryId}</h4>`;
            if (stat.duration) {
                html += `<p><i class="fas fa-clock"></i> 执行耗时: <strong>${stat.duration}</strong></p>`;
            }
            if (stat.rowCount !== undefined) {
                html += `<p><i class="fas fa-list"></i> 返回行数: <strong>${stat.rowCount}</strong></p>`;
            }
            html += `</div>`;
        });
    } else {
        // 备用方案：使用原始数据
        originalResults.forEach((data, index) => {
            let queryId = '';
            for (const id in queryResults) {
                if (queryResults[id] === data) {
                    queryId = id;
                    break;
                }
            }
            
            html += `<div class="stat-card">`;
            html += `<h4><i class="fas fa-database"></i> 查询 ${queryId}</h4>`;
            if (data.duration) {
                html += `<p><i class="fas fa-clock"></i> 执行耗时: <strong>${data.duration}</strong></p>`;
            }
            if (data.rowCount !== undefined) {
                html += `<p><i class="fas fa-list"></i> 返回行数: <strong>${data.rowCount}</strong></p>`;
            }
            html += `</div>`;
        });
    }
    
    html += '</div></div>';
    
    // 创建数据对比表格
    html += '<div class="comparison-table"><h3>数据对比</h3><table><thead><tr><th>标签</th>';
    
    // 使用合并后的列名
    for (let i = 1; i < mergedData.columns.length; i++) {
        html += `<th>${mergedData.columns[i]}</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    // 添加合并后的数据行
    mergedData.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell || '-'}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    comparisonResult.innerHTML += html;
    
    // 添加可视化选项
    const vizControls = document.createElement('div');
    vizControls.className = 'viz-controls';
    vizControls.innerHTML = `
        <div class="viz-buttons merged-viz-buttons" style="margin-top: 20px;">
            <button class="active" data-type="table" onclick="switchMergedVisualization('table')"><i class="fas fa-table"></i> 表格</button>
            <button data-type="bar" onclick="switchMergedVisualization('bar')"><i class="fas fa-chart-bar"></i> 柱状图</button>
            <button data-type="line" onclick="switchMergedVisualization('line')"><i class="fas fa-chart-line"></i> 折线图</button>
        </div>
        <div id="merged-visualization" style="margin-top: 20px;"></div>
    `;
    
    comparisonResult.appendChild(vizControls);
    
    // 保存合并结果用于图表显示
    const labels = mergedData.rows.map(row => String(row[0]));
    const datasets = [];
    
    for (let colIndex = 1; colIndex < mergedData.columns.length; colIndex++) {
        const values = mergedData.rows.map(row => {
            const value = row[colIndex];
            if (value === null || value === undefined) return null;
            const numValue = parseFloat(String(value).replace(/,/g, ''));
            return isNaN(numValue) ? null : numValue;
        });
        
        datasets.push({
            label: mergedData.columns[colIndex],
            data: values,
            backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`,
            borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
            borderWidth: 1
        });
    }
    
    window.mergedData = {
        labels: labels,
        datasets: datasets
    };
    
    // 滚动到结果区域
    comparisonResult.scrollIntoView({ behavior: 'smooth' });
}

// 切换合并可视化类型
function switchMergedVisualization(type) {
    // 更新按钮状态
    const buttons = document.querySelectorAll('.merged-viz-buttons button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });
    
    // 渲染选中的可视化类型
    renderMergedVisualization(type);
}

// 渲染合并可视化
function renderMergedVisualization(type) {
    if (!window.mergedData) return;
    
    const container = document.getElementById('merged-visualization');
    if (!container) return;
    
    if (type === 'table') {
        // 表格已经渲染，不需要做任何事情
        return;
    }
    
    container.innerHTML = '<canvas height="500"></canvas>';
    const canvas = container.querySelector('canvas');
    
    // 定义固定的颜色数组，确保每个数据集有不同的颜色
    const colors = [
        { backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)' },
        { backgroundColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgba(255, 99, 132, 1)' },
        { backgroundColor: 'rgba(75, 192, 192, 0.5)', borderColor: 'rgba(75, 192, 192, 1)' },
        { backgroundColor: 'rgba(255, 206, 86, 0.5)', borderColor: 'rgba(255, 206, 86, 1)' },
        { backgroundColor: 'rgba(153, 102, 255, 0.5)', borderColor: 'rgba(153, 102, 255, 1)' },
        { backgroundColor: 'rgba(255, 159, 64, 0.5)', borderColor: 'rgba(255, 159, 64, 1)' },
        { backgroundColor: 'rgba(46, 204, 113, 0.5)', borderColor: 'rgba(46, 204, 113, 1)' },
        { backgroundColor: 'rgba(231, 76, 60, 0.5)', borderColor: 'rgba(231, 76, 60, 1)' }
    ];
    
    // 为每个数据集设置颜色和样式
    const datasets = window.mergedData.datasets.map((dataset, index) => {
        const colorIndex = index % colors.length;
        
        // 如果是折线图，添加特定的样式
        if (type === 'line') {
            return {
                ...dataset,
                backgroundColor: colors[colorIndex].backgroundColor,
                borderColor: colors[colorIndex].borderColor,
                borderWidth: 2,
                fill: false,
                tension: 0.1
            };
        }
        
        // 如果是柱状图，使用不同的样式
        return {
            ...dataset,
            backgroundColor: colors[colorIndex].backgroundColor,
            borderColor: colors[colorIndex].borderColor,
            borderWidth: 1
        };
    });
    
    new Chart(canvas, {
        type: type,
        data: {
            labels: window.mergedData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// 一键执行所有查询
async function executeAllQueries() {
    // 获取所有查询容器
    const queryContainers = document.querySelectorAll('.query-container');
    
    if (queryContainers.length === 0) {
        alert('没有可执行的查询');
        return;
    }
    
    // 确保queryCount与实际查询容器数量一致
    if (queryCount < queryContainers.length) {
        queryCount = queryContainers.length;
    }
    
    // 显示执行中的提示
    const statusDiv = document.createElement('div');
    statusDiv.id = 'execution-status';
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '20px';
    statusDiv.style.right = '20px';
    statusDiv.style.padding = '15px';
    statusDiv.style.background = 'rgba(0, 0, 0, 0.7)';
    statusDiv.style.color = 'white';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '1000';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在执行查询...';
    document.body.appendChild(statusDiv);
    
    // 执行所有查询
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < queryContainers.length; i++) {
        const container = queryContainers[i];
        const queryId = container.id.replace('query-', '');
        
        statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在执行查询 ${i+1}/${queryContainers.length}`;
        
        try {
            // 执行查询
            await new Promise(resolve => {
                const errorDiv = container.querySelector('.error');
                const resultDiv = container.querySelector('.result');
                const visualControls = container.querySelector('.visual-controls');
                
                const query = getSQLQuery(queryId);
                
                errorDiv.innerHTML = '';
                resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 查询中...</div>';
                visualControls.style.display = 'none';
                
                fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query })
                })
                .then(response => response.json())
                .then(data => {
                    queryResults[queryId] = data; // 保存查询结果
                    
                    if (data.error) {
                        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.error}`;
                        resultDiv.innerHTML = '';
                        failCount++;
                    } else {
                        // 显示查询统计信息
                        let statsHtml = '';
                        if (data.duration) {
                            statsHtml += `<div class="query-stats"><i class="fas fa-clock"></i> 执行耗时: <strong>${data.duration}</strong>`;
                            if (data.rowCount !== undefined) {
                                statsHtml += ` | <i class="fas fa-list"></i> 返回行数: <strong>${data.rowCount}</strong>`;
                            }
                            statsHtml += '</div>';
                        }
                        
                        if (data.rows.length === 0) {
                            resultDiv.innerHTML = statsHtml + '<p><i class="fas fa-info-circle"></i> 查询成功，无数据返回</p>';
                        } else {
                            // 显示可视化控制按钮
                            if (data.visualizationTypes && data.visualizationTypes.length > 0) {
                                let controlsHtml = statsHtml + '<div class="viz-buttons">';
                                data.visualizationTypes.forEach(type => {
                                    const active = type === 'table' ? 'active' : '';
                                    const icon = getVisualTypeIcon(type);
                                    controlsHtml += `<button class="${active}" onclick="changeVisualization(${queryId}, '${type}')"><i class="${icon}"></i> ${getVisualTypeName(type)}</button>`;
                                });
                                controlsHtml += '</div>';
                                visualControls.innerHTML = controlsHtml;
                                visualControls.style.display = 'block';
                            } else if (statsHtml) {
                                visualControls.innerHTML = statsHtml;
                                visualControls.style.display = 'block';
                            }
                            
                            // 默认显示表格视图
                            renderVisualization(queryId, 'table');
                            successCount++;
                        }
                    }
                    resolve();
                })
                .catch(err => {
                    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> 请求失败: ${err.message}`;
                    resultDiv.innerHTML = '';
                    failCount++;
                    resolve();
                });
            });
        } catch (err) {
            console.error(`查询 ${queryId} 执行失败:`, err);
            failCount++;
        }
    }
    
    // 更新状态并设置定时器移除
    statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> 执行完成: ${successCount} 成功, ${failCount} 失败`;
    statusDiv.style.background = successCount > 0 ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)';
    
    // 3秒后移除状态提示
    setTimeout(() => {
        document.body.removeChild(statusDiv);
        
        // 如果有多个成功的查询结果，自动显示合并按钮
        if (Object.keys(queryResults).length > 1) {
            const validResults = [];
            for (const queryId in queryResults) {
                const result = queryResults[queryId];
                if (result && !result.error && result.rows && result.rows.length > 0) {
                    validResults.push(result);
                }
            }
            
            if (validResults.length > 1) {
                document.querySelector('.compare-btn').style.display = 'block';
            }
        }
    }, 3000);
}

// 数据分析功能
function analyzeResults() {
    // 检查是否有有效的查询结果
    const validResults = [];
    for (const queryId in queryResults) {
        const result = queryResults[queryId];
        if (result && !result.error && result.rows && result.rows.length > 0) {
            // 确保数据格式正确
            if (!Array.isArray(result.columns) || !Array.isArray(result.rows)) {
                console.error(`查询 ${queryId} 的数据格式错误:`, result);
                continue;
            }
            
            validResults.push({
                id: queryId,
                data: result
            });
        }
    }
    
    if (validResults.length === 0) {
        alert('没有可分析的数据，请先执行查询');
        return;
    }
    
    // 显示分析报表区域
    const reportContainer = document.getElementById('analysis-report');
    reportContainer.style.display = 'block';
    const reportContent = reportContainer.querySelector('.report-content');
    
    // 添加维度选择按钮事件
    document.getElementById('apply-dimensions').addEventListener('click', function() {
        // 如果当前有分析结果，重新应用选择的维度
        if (validResults.length === 1) {
            const result = validResults[0].data;
            const selectedDimensions = getSelectedDimensions();
            const analysisResult = DataAnalyzer.analyzeData(result, selectedDimensions);
            
            if (analysisResult.success) {
                reportContent.innerHTML = DataAnalyzer.generateReportHTML(analysisResult.analysis);
            } else {
                reportContent.innerHTML = `<p class="error">分析失败: ${analysisResult.message}</p>`;
            }
        } else if (document.getElementById('analysis-result').innerHTML) {
            // 如果已经选择了要分析的查询结果，重新分析
            runSingleAnalysis();
        }
    });
    
    // 添加全选按钮事件
    const selectAllBtn = document.getElementById('select-all-dimensions');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            selectAllDimensions();
        });
    }
    
    // 添加取消全选按钮事件
    const deselectAllBtn = document.getElementById('deselect-all-dimensions');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            deselectAllDimensions();
        });
    }
    
    // 如果只有一个查询结果，直接分析
    if (validResults.length === 1) {
        const result = validResults[0].data;
        try {
            // 使用新的报表生成器
            const selectedDimensions = getSelectedDimensions();
            const reportHtml = ReportGenerator.generateFullReport(result, { dimensions: selectedDimensions });
            reportContent.innerHTML = reportHtml;
            
            // 备用方案，如果报表生成器失败，使用DataAnalyzer
            if (!reportHtml || reportHtml.includes('无有效数据')) {
                const analysisResult = DataAnalyzer.analyzeData(result, selectedDimensions);
                
                if (analysisResult && analysisResult.success) {
                    reportContent.innerHTML = DataAnalyzer.generateReportHTML(analysisResult.analysis);
                } else {
                    reportContent.innerHTML = `<p class="error">分析失败: ${analysisResult ? analysisResult.message : '未知错误'}</p>`;
                }
            }
        } catch (error) {
            console.error('数据分析错误:', error);
            reportContent.innerHTML = `<p class="error">分析失败: ${error.message}</p>`;
        }
    } 
    // 如果有多个查询结果，先分析单个结果，然后进行比较
    else {
        // 创建选择器
        let html = `
            <div class="analysis-options">
                <h3>选择分析方式</h3>
                <div class="option-buttons">
                    <button onclick="analyzeSingleResult()">分析单个查询结果</button>
                    <button onclick="compareQueryResults()">比较两个查询结果</button>
                </div>
            </div>
            
            <div id="analysis-selector" style="display: none; margin-top: 20px;">
                <h3>选择要分析的查询结果</h3>
                <select id="result-select" style="padding: 8px; margin-right: 10px;">
        `;
        
        validResults.forEach(result => {
            const queryId = result.id;
            const rowCount = result.data.rows.length;
            html += `<option value="${queryId}">查询 ${queryId} (行数: ${rowCount})</option>`;
        });
        
        html += `
                </select>
                <button onclick="runSingleAnalysis()">开始分析</button>
            </div>
            
            <div id="comparison-selector" style="display: none; margin-top: 20px;">
                <h3>选择要比较的两个查询结果</h3>
                <div style="margin-bottom: 10px;">
                    <label>查询结果 1:</label>
                    <select id="result-select-1" style="padding: 8px; margin-right: 10px;">
        `;
        
        validResults.forEach(result => {
            const queryId = result.id;
            const rowCount = result.data.rows.length;
            html += `<option value="${queryId}">查询 ${queryId} (行数: ${rowCount})</option>`;
        });
        
        html += `
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>查询结果 2:</label>
                    <select id="result-select-2" style="padding: 8px; margin-right: 10px;">
        `;
        
        validResults.forEach((result, index) => {
            const queryId = result.id;
            const rowCount = result.data.rows.length;
            html += `<option value="${queryId}" ${index === 1 ? 'selected' : ''}>查询 ${queryId} (行数: ${rowCount})</option>`;
        });
        
        html += `
                    </select>
                </div>
                <button onclick="runComparisonAnalysis()">开始比较</button>
            </div>
            
            <div id="analysis-result" style="margin-top: 30px;"></div>
        `;
        
        reportContent.innerHTML = html;
    }
    
    // 滚动到报表区域
    reportContainer.scrollIntoView({ behavior: 'smooth' });
}

// 显示单个结果分析选择器
function analyzeSingleResult() {
    document.getElementById('analysis-selector').style.display = 'block';
    document.getElementById('comparison-selector').style.display = 'none';
    document.getElementById('analysis-result').innerHTML = '';
}

// 显示比较分析选择器
function compareQueryResults() {
    document.getElementById('analysis-selector').style.display = 'none';
    document.getElementById('comparison-selector').style.display = 'block';
    document.getElementById('analysis-result').innerHTML = '';
}

// 执行单个结果分析
function runSingleAnalysis() {
    const selectElement = document.getElementById('result-select');
    const queryId = selectElement.value;
    const result = queryResults[queryId];
    
    if (!result) {
        alert('没有找到选中的查询结果');
        return;
    }
    
    // 检查数据格式
    if (!Array.isArray(result.columns) || !Array.isArray(result.rows)) {
        const analysisContainer = document.getElementById('analysis-result');
        analysisContainer.innerHTML = `<p class="error">数据格式错误: columns或rows不是数组</p>`;
        console.error('数据格式错误:', result);
        return;
    }
    
    // 获取选中的分析维度
    const selectedDimensions = getSelectedDimensions();
    const analysisContainer = document.getElementById('analysis-result');
    
    try {
        // 使用新的报表生成器
        const reportHtml = ReportGenerator.generateFullReport(result, { dimensions: selectedDimensions });
        analysisContainer.innerHTML = reportHtml;
        
        // 备用方案，如果报表生成器失败，使用DataAnalyzer
        if (!reportHtml || reportHtml.includes('无有效数据')) {
            const analysisResult = DataAnalyzer.analyzeData(result, selectedDimensions);
            
            if (analysisResult && analysisResult.success) {
                analysisContainer.innerHTML = DataAnalyzer.generateReportHTML(analysisResult.analysis);
            } else {
                analysisContainer.innerHTML = `<p class="error">分析失败: ${analysisResult ? analysisResult.message : '未知错误'}</p>`;
            }
        }
    } catch (error) {
        console.error('数据分析错误:', error);
        analysisContainer.innerHTML = `<p class="error">分析失败: ${error.message}</p>`;
    }
    
    // 滚动到分析结果
    analysisContainer.scrollIntoView({ behavior: 'smooth' });
}

// 获取选中的分析维度
function getSelectedDimensions() {
    const checkboxes = document.querySelectorAll('.dimension-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// 全选维度
function selectAllDimensions() {
    document.querySelectorAll('.dimension-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
}

// 取消全选维度
function deselectAllDimensions() {
    document.querySelectorAll('.dimension-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 保持数据概览始终选中，以确保至少有一个维度被选中
    const overviewCheckbox = document.querySelector('.dimension-checkbox[value="overview"]');
    if (overviewCheckbox) {
        overviewCheckbox.checked = true;
    }
}

// 执行比较分析
function runComparisonAnalysis() {
    const select1 = document.getElementById('result-select-1');
    const select2 = document.getElementById('result-select-2');
    
    const queryId1 = select1.value;
    const queryId2 = select2.value;
    
    if (queryId1 === queryId2) {
        alert('请选择两个不同的查询结果进行比较');
        return;
    }
    
    const result1 = queryResults[queryId1];
    const result2 = queryResults[queryId2];
    
    if (!result1 || !result2) {
        alert('没有找到选中的查询结果');
        return;
    }
    
    // 检查数据格式
    const analysisContainer = document.getElementById('analysis-result');
    if (!Array.isArray(result1.columns) || !Array.isArray(result1.rows) || 
        !Array.isArray(result2.columns) || !Array.isArray(result2.rows)) {
        analysisContainer.innerHTML = `<p class="error">数据格式错误: columns或rows不是数组</p>`;
        console.error('数据格式错误:', result1, result2);
        return;
    }
    
    // 获取选中的分析维度
    const selectedDimensions = getSelectedDimensions();
    
    try {
        // 使用新的报表生成器生成比较报表
        const comparisonHtml = ReportGenerator.generateComparisonReport(result1, result2);
        
        // 生成各自的分析报表
        const report1Html = ReportGenerator.generateFullReport(result1, { dimensions: selectedDimensions });
        const report2Html = ReportGenerator.generateFullReport(result2, { dimensions: selectedDimensions });
        
        // 组合报表
        let html = comparisonHtml;
        html += `
            <div class="report-section">
                <h3>数据集1分析 (查询 ${queryId1})</h3>
                <div class="dataset-analysis">
                    ${report1Html}
                </div>
            </div>
            
            <div class="report-section">
                <h3>数据集2分析 (查询 ${queryId2})</h3>
                <div class="dataset-analysis">
                    ${report2Html}
                </div>
            </div>
        `;
        
        analysisContainer.innerHTML = html;
        
        // 备用方案，如果报表生成器失败，使用DataAnalyzer
        if (!comparisonHtml || comparisonHtml.includes('无有效数据')) {
            // 先对两个数据集分别进行分析，然后再比较
            const analysisResult1 = DataAnalyzer.analyzeData(result1, selectedDimensions);
            const analysisResult2 = DataAnalyzer.analyzeData(result2, selectedDimensions);
            
            if (!analysisResult1.success || !analysisResult2.success) {
                analysisContainer.innerHTML = `<p class="error">分析失败: ${analysisResult1.message || analysisResult2.message}</p>`;
                return;
            }
            
            const analysis1 = analysisResult1.analysis;
            const analysis2 = analysisResult2.analysis;
            
            // 比较两个分析结果
            const comparisonResult = DataAnalyzer.compareDatasets(result1, result2);
            
            if (comparisonResult && comparisonResult.success) {
                // 生成比较报表
                let html = DataAnalyzer.generateComparisonReportHTML(comparisonResult.comparison);
                
                // 添加两个数据集的分析结果
                html += `
                    <div class="report-section">
                        <h3>数据集1分析 (查询 ${queryId1})</h3>
                        <div class="dataset-analysis">
                            ${DataAnalyzer.generateReportHTML(analysis1)}
                        </div>
                    </div>
                    
                    <div class="report-section">
                        <h3>数据集2分析 (查询 ${queryId2})</h3>
                        <div class="dataset-analysis">
                            ${DataAnalyzer.generateReportHTML(analysis2)}
                        </div>
                    </div>
                `;
                
                analysisContainer.innerHTML = html;
            } else {
                analysisContainer.innerHTML = `<p class="error">比较失败: ${comparisonResult ? comparisonResult.message : '未知错误'}</p>`;
            }
        }
    } catch (error) {
        console.error('数据分析错误:', error);
        analysisContainer.innerHTML = `<p class="error">比较分析失败: ${error.message}</p>`;
    }
    
    // 滚动到分析结果
    analysisContainer.scrollIntoView({ behavior: 'smooth' });
}

// 导入Excel
function importExcel() {
    const fileInput = document.getElementById('excel-file');
    const statusDiv = document.getElementById('import-status');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.innerHTML = '<p style="color: red;">请先选择Excel文件</p>';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.innerHTML = '<p>正在处理Excel文件...</p>';
    
    // 清除之前的导入数据
    delete window.pendingImportData;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 提取SQL查询 - 使用Set去重
            const sqlSet = new Set();
            
            jsonData.forEach(row => {
                Object.values(row).forEach(value => {
                    if (typeof value === 'string') {
                        const trimmedValue = value.trim();
                        const upperValue = trimmedValue.toUpperCase();
                        if ((upperValue.startsWith('SELECT') || upperValue.startsWith('WITH')) && 
                            trimmedValue.length > 10) {
                            sqlSet.add(trimmedValue);
                        }
                    }
                });
            });
            
            const sqlQueries = Array.from(sqlSet);
            
            // 显示预览
            showExcelPreview(jsonData, sqlQueries);
            

            
        } catch (error) {
            statusDiv.innerHTML = `<p style="color: red;">Excel文件解析失败: ${error.message}</p>`;
        }
    };
    
    reader.onerror = function() {
        statusDiv.innerHTML = '<p style="color: red;">读取文件失败</p>';
    };
    
    reader.readAsArrayBuffer(file);
}

// 显示Excel预览
function showExcelPreview(jsonData, sqlQueries) {
    const statusDiv = document.getElementById('import-status');
    
    if (sqlQueries.length === 0) {
        statusDiv.innerHTML = '<p style="color: red;">未在Excel文件中找到SQL查询</p>';
        return;
    }
    
    let html = `
        <div class="preview-stats">
            <i class="fas fa-info-circle"></i> 
            找到 <strong>${sqlQueries.length}</strong> 个SQL查询，共 <strong>${jsonData.length}</strong> 行数据
        </div>
        <div class="excel-preview">
            <table>
                <thead>
                    <tr>
    `;
    
    // 表头
    if (jsonData.length > 0) {
        Object.keys(jsonData[0]).forEach(key => {
            html += `<th>${key}</th>`;
        });
    }
    html += '</tr></thead><tbody>';
    
    // 表体 - 只显示前10行
    jsonData.slice(0, 10).forEach(row => {
        html += '<tr>';
        Object.values(row).forEach(value => {
            const cellValue = String(value || '');
            const isSQL = cellValue.trim().toUpperCase().startsWith('SELECT') || 
                         cellValue.trim().toUpperCase().startsWith('WITH');
            const cellClass = isSQL ? 'sql-cell' : '';
            const displayValue = cellValue.length > 50 ? cellValue.substring(0, 50) + '...' : cellValue;
            html += `<td class="${cellClass}" title="${cellValue}">${displayValue}</td>`;
        });
        html += '</tr>';
    });
    
    html += `
            </tbody>
        </table>
        </div>
        <div class="import-actions">
            <button class="import-confirm" onclick="confirmImport()">
                <i class="fas fa-check"></i> 确认导入并执行
            </button>
            <button class="import-cancel" onclick="cancelImport()">
                <i class="fas fa-times"></i> 取消
            </button>
        </div>
    `;
    
    statusDiv.innerHTML = html;
    window.pendingImportData = { jsonData, sqlQueries };
}

// 确认导入
function confirmImport() {
    if (!window.pendingImportData) return;
    
    const { sqlQueries } = window.pendingImportData;
    const statusDiv = document.getElementById('import-status');
    
    statusDiv.innerHTML = `<p style="color: green;">正在导入 ${sqlQueries.length} 个SQL查询...</p>`;
    
    // 清除现有查询
    document.querySelectorAll('.tab:not(.new-tab)').forEach(tab => {
        tab.parentNode.removeChild(tab);
    });
    
    document.querySelectorAll('.query-container').forEach(container => {
        container.parentNode.removeChild(container);
    });
    
    queryResults = {};
    queryCount = 0;
    activeTab = 1;
    
    // 添加SQL查询
    sqlQueries.forEach((sql, index) => {
        queryCount++;
        
        const tabsContainer = document.getElementById('query-tabs');
        const newTabButton = tabsContainer.querySelector('.new-tab');
        
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab', queryCount);
        tabElement.innerHTML = `
            <i class="fas fa-database"></i> 查询 ${queryCount}
            <span class="close-tab" onclick="removeQuery(${queryCount}, event)"><i class="fas fa-times"></i></span>
        `;
        tabElement.onclick = () => switchTab(queryCount);
        
        tabsContainer.insertBefore(tabElement, newTabButton);
        
        const queryContainer = document.createElement('div');
        queryContainer.className = 'query-container';
        queryContainer.id = `query-${queryCount}`;
        
        queryContainer.innerHTML = `
            <div class="sql-editor-container" id="sql-editor-${queryCount}"></div>
            <div class="query-actions">
                <button class="execute-btn" onclick="executeQuery(${queryCount})">
                    <i class="fas fa-play"></i> 执行查询
                </button>
                <button class="save-btn" onclick="saveQuery(${queryCount})">
                    <i class="fas fa-save"></i> 保存
                </button>
            </div>
            <div class="error"></div>
            <div class="visual-controls" style="display:none;"></div>
            <div class="result"></div>
        `;
        
        document.getElementById('queries-container').appendChild(queryContainer);
        
        setTimeout(() => {
            createSQLEditor(queryCount);
            setTimeout(() => setSQLQuery(queryCount, sql), 200);
        }, 100);
        
        if (index === 0) {
            switchTab(queryCount);
        }
    });
    
    statusDiv.innerHTML = `<p style="color: green;">成功导入 ${sqlQueries.length} 个SQL查询！</p>`;
    delete window.pendingImportData;
}

// 取消导入
function cancelImport() {
    const statusDiv = document.getElementById('import-status');
    statusDiv.innerHTML = '';
    delete window.pendingImportData;
}

// 下载Excel模板
function downloadExcelTemplate() {
    // 创建Excel工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建数据
    const data = [
        ['SQL查询模板表'],
        [''],
        ['查询名称', 'SQL语句'],
        ['查询1', 'SELECT ref_field as lable, count(*) as \'value\' FROM pro_refs GROUP BY ref_field;'],
        ['查询2', 'SELECT ref_field as lable, count(*) as \'value\' FROM pro_refs WHERE ref_value > 5 GROUP BY ref_field;'],
        ['查询3', 'SELECT ref_field as lable, AVG(LENGTH(ref_value)) as \'value\' FROM pro_refs GROUP BY ref_field;']
    ];
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    const wscols = [
        { wch: 15 },  // 第一列宽度
        { wch: 80 }   // 第二列宽度
    ];
    ws['!cols'] = wscols;
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "SQL查询");
    
    // 生成Excel文件并下载
    XLSX.writeFile(wb, "SQL查询模板.xlsx");
}

// 初始化文件选择事件监听器
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('excel-file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                // 重置文件输入状态
                this.blur();
                setTimeout(() => {
                    importExcel();
                }, 100);
            }
        });
    }
});