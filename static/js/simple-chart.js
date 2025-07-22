/**
 * 简单图表渲染函数
 */

// 渲染表格
function renderTable(container, data) {
    if (!data || !data.rows || !data.columns) {
        container.innerHTML = '<p>没有可用数据</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    data.columns.forEach(col => html += '<th>' + col + '</th>');
    html += '</tr></thead><tbody>';
    
    data.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => html += '<td>' + (cell !== null ? cell : '') + '</td>');
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

// 渲染柱状图
function renderBarChart(container, data) {
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
            }
        }
    });
}

// 渲染折线图
function renderLineChart(container, data) {
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
            }
        }
    });
}

// 渲染饼图
function renderPieChart(container, data) {
    if (!data || !data.rows || !data.columns || data.rows.length === 0 || data.columns.length < 2) {
        container.innerHTML = '<p>没有可用数据或数据格式不适合饼图</p>';
        return;
    }
    
    // 清除容器
    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    
    // 提取标签和数据
    const labels = data.rows.map(row => String(row[0]));
    const values = data.rows.map(row => parseFloat(row[1]) || 0);
    
    // 生成背景颜色
    const backgroundColors = labels.map((_, i) => getRandomColor(i, 0.7));
    
    // 创建图表
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