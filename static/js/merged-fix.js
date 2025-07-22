/**
 * 修复合并图表功能
 */

// 修复compareQueries函数调用
(function() {
    // 保存原始函数
    const originalCompareQueries = window.compareQueries;
    
    // 重写compareQueries函数
    window.compareQueries = function() {
        try {
            // 如果merged-charts.js已加载，使用其中的函数
            if (typeof window.renderMergedChart === 'function') {
                // 调用合并图表功能
                const comparisonResult = document.getElementById('comparison-result');
                comparisonResult.innerHTML = '<h2><i class="fas fa-chart-line"></i> 查询结果合并展示</h2>';
                
                // 创建选择器，让用户选择图表类型
                const chartTypeSelector = document.createElement('div');
                chartTypeSelector.className = 'chart-type-selector';
                chartTypeSelector.innerHTML = `
                    <div class="viz-buttons">
                        <button class="active" onclick="renderMergedChart('bar')"><i class="fas fa-chart-bar"></i> 柱状图</button>
                        <button onclick="renderMergedChart('line')"><i class="fas fa-chart-line"></i> 折线图</button>
                        <button onclick="renderMergedChart('table')"><i class="fas fa-table"></i> 表格</button>
                    </div>
                `;
                comparisonResult.appendChild(chartTypeSelector);
                
                // 创建图表容器
                const chartContainer = document.createElement('div');
                chartContainer.id = 'merged-chart-container';
                comparisonResult.appendChild(chartContainer);
                
                // 默认渲染柱状图
                renderMergedChart('bar');
            } else {
                // 使用简单的内置合并功能
                renderSimpleMergedChart();
            }
        } catch (err) {
            // 显示错误信息
            const comparisonResult = document.getElementById('comparison-result');
            comparisonResult.innerHTML = `<p><i class="fas fa-exclamation-circle"></i> 无法合并查询结果: ${err.message}</p>`;
            
            // 尝试使用内置的合并功能
            renderSimpleMergedChart();
        }
    };
    
    // 简单的内置合并图表功能
    function renderSimpleMergedChart() {
        const container = document.getElementById('comparison-result');
        container.innerHTML = '<h2><i class="fas fa-chart-line"></i> 查询结果合并展示</h2>';
        
        // 创建表格展示合并结果
        const datasets = [];
        const allLabels = new Set();
        
        Object.keys(queryResults).forEach(queryId => {
            const data = queryResults[queryId];
            if (!data || !data.rows || !data.columns || data.rows.length === 0) return;
            
            // 使用第一列作为标签，第二列作为数据
            const labels = data.rows.map(row => String(row[0]));
            const values = data.rows.map(row => {
                if (row.length > 1) {
                    return parseFloat(row[1]) || 0;
                }
                return parseFloat(row[0]) || 0;
            });
            
            // 添加所有标签到集合
            labels.forEach(label => allLabels.add(label));
            
            datasets.push({
                queryId,
                name: `查询 ${queryId}`,
                labels,
                values
            });
        });
        
        if (datasets.length === 0) {
            container.innerHTML += '<p><i class="fas fa-info-circle"></i> 没有可合并的数据</p>';
            return;
        }
        
        // 创建表格
        const sortedLabels = Array.from(allLabels).sort();
        let html = '<table><thead><tr><th>标签</th>';
        
        // 添加每个查询的列标题
        datasets.forEach(dataset => {
            html += `<th>${dataset.name}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        // 添加每行数据
        sortedLabels.forEach(label => {
            html += `<tr><td>${label}</td>`;
            
            datasets.forEach(dataset => {
                const valueIndex = dataset.labels.indexOf(label);
                const value = valueIndex !== -1 ? dataset.values[valueIndex] : '-';
                html += `<td>${value}</td>`;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML += html;
    }
})();