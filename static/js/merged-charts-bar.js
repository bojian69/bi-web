/**
 * 合并查询结果柱状图功能
 */

// 渲染合并的柱状图
function renderMergedBarChart(container, datasets, labels) {
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = 900; // 增加宽度
    canvas.height = 600; // 增加高度
    canvas.id = 'merged-canvas';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // 设置图表尺寸
    const chartWidth = canvas.width - 150; // 增加左侧空间
    const chartHeight = canvas.height - 180; // 增加底部空间
    const startX = 100; // 增加左侧空间
    const startY = canvas.height - 120; // 调整底部位置
    
    // 计算柱子宽度，确保不会太窄
    const groupWidth = Math.max(chartWidth / labels.length, 30);
    const barWidth = Math.min(groupWidth / (datasets.length + 1), 25);
    
    // 找出所有数据中的最大值
    let maxValue = 0;
    datasets.forEach(dataset => {
        const max = Math.max(...dataset.values);
        if (max > maxValue) maxValue = max;
    });
    maxValue *= 1.1; // 增加10%空间
    
    // 绘制背景
    ctx.fillStyle = 'rgba(240, 240, 240, 0.5)';
    ctx.fillRect(startX, 50, chartWidth, chartHeight);
    
    // 绘制Y轴刻度和水平网格线
    const gridCount = 5;
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Arial';
    
    for (let i = 0; i <= gridCount; i++) {
        const y = startY - (i / gridCount) * chartHeight;
        const value = (maxValue * i / gridCount).toFixed(1);
        
        // 绘制水平网格线
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + chartWidth, y);
        ctx.stroke();
        
        // 绘制Y轴刻度
        ctx.fillText(value, startX - 5, y);
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, 50);
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + chartWidth, startY);
    ctx.stroke();
    ctx.lineWidth = 1;
    
    // 颜色配置
    const colors = [
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(153, 102, 255, 0.8)'
    ];
    
    // 绘制图例
    const legendX = 120;
    const legendY = 30;
    const legendSpacing = 120;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Arial';
    
    datasets.forEach((dataset, index) => {
        const x = legendX + index * legendSpacing;
        const color = colors[index % colors.length];
        
        // 绘制颜色方块
        ctx.fillStyle = color;
        ctx.fillRect(x, legendY, 15, 15);
        
        // 绘制文字
        ctx.fillStyle = 'black';
        ctx.fillText(dataset.name, x + 20, legendY + 7);
    });
    
    // 计算实际可用宽度和每组宽度
    const usableWidth = Math.min(chartWidth, labels.length * groupWidth);
    const actualGroupWidth = usableWidth / labels.length;
    
    // 绘制柱状图
    labels.forEach((label, labelIndex) => {
        const groupX = startX + labelIndex * actualGroupWidth + actualGroupWidth / 2;
        
        // 绘制X轴标签（竖向）
        ctx.save();
        ctx.translate(groupX, startY + 10);
        ctx.rotate(Math.PI/2); // 旋转90度
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
        ctx.font = '12px Arial';
        
        // 限制标签长度
        const maxLabelLength = 15;
        const displayLabel = label.length > maxLabelLength ? 
            label.substring(0, maxLabelLength) + '...' : label;
        ctx.fillText(displayLabel, 0, 0);
        ctx.restore();
        
        // 绘制每个数据集的柱子
        datasets.forEach((dataset, datasetIndex) => {
            const valueIndex = dataset.labels.indexOf(label);
            if (valueIndex === -1) return; // 该数据集没有这个标签
            
            const value = dataset.values[valueIndex];
            const barHeight = (value / maxValue) * chartHeight;
            
            // 计算柱子位置，确保居中对齐
            const totalBarsWidth = datasets.length * barWidth;
            const startOffset = (actualGroupWidth - totalBarsWidth) / 2;
            const x = groupX - totalBarsWidth / 2 + datasetIndex * barWidth + barWidth / 2;
            
            // 绘制柱子
            const color = colors[datasetIndex % colors.length];
            const gradient = ctx.createLinearGradient(0, startY, 0, startY - chartHeight);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color.replace('0.8', '0.4'));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - barWidth/2, startY - barHeight, barWidth, barHeight);
            
            // 绘制边框
            ctx.strokeStyle = color.replace('0.8', '1');
            ctx.strokeRect(x - barWidth/2, startY - barHeight, barWidth, barHeight);
            
            // 绘制数值
            if (barHeight > 20) { // 只有当柱子足够高时才显示数值
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.font = '10px Arial';
                ctx.fillText(value.toString(), x, startY - barHeight/2);
            }
        });
    });
    
    // 绘制标题
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    ctx.fillText('查询结果合并柱状图', canvas.width/2, 20);
    
    // 添加导出按钮
    addExportButton(container, canvas, '合并柱状图');
}