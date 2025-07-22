/**
 * 合并查询结果图表
 */

// 渲染合并表格
function renderMergedTable(container, data) {
    if (!data || !data.rows || !data.columns) {
        container.innerHTML = '<p>没有可用数据</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    data.columns.forEach(col => html += '<th>' + col + '</th>');
    html += '</tr></thead><tbody>';
    
    data.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => html += '<td>' + (cell !== null ? cell : '-') + '</td>');
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

// 渲染合并柱状图
function renderMergedBarChart(container, data) {
    if (!data || !data.rows || !data.columns || data.rows.length === 0) {
        container.innerHTML = '<p>没有可用数据</p>';
        return;
    }
    
    // 清除容器
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // 格式化数据
    const chartData = formatChartData(data);
    if (!chartData) {
        container.innerHTML = '<p>数据格式不适合柱状图</p>';
        return;
    }
    
    // 创建图表
    new Chart(canvas, {
        type: 'bar',
        data: chartData,
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
                },
                title: {
                    display: true,
                    text: '合并查询结果 - 柱状图'
                }
            }
        }
    });
}

// 渲染合并折线图
function renderMergedLineChart(container, data) {
    if (!data || !data.rows || !data.columns || data.rows.length === 0) {
        container.innerHTML = '<p>没有可用数据</p>';
        return;
    }
    
    // 清除容器
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // 格式化数据
    const chartData = formatChartData(data);
    if (!chartData) {
        container.innerHTML = '<p>数据格式不适合折线图</p>';
        return;
    }
    
    // 修改数据集配置，适合折线图
    chartData.datasets.forEach(dataset => {
        dataset.fill = false;
        dataset.tension = 0.1;
    });
    
    // 创建图表
    new Chart(canvas, {
        type: 'line',
        data: chartData,
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
                },
                title: {
                    display: true,
                    text: '合并查询结果 - 折线图'
                }
            }
        }
    });
}

// 根据类型渲染合并可视化
function renderMergedVisualization(container, data, type) {
    if (!data) return;
    
    switch (type) {
        case 'table':
            renderMergedTable(container, data);
            break;
        case 'bar':
            renderMergedBarChart(container, data);
            break;
        case 'line':
            renderMergedLineChart(container, data);
            break;
    }
}