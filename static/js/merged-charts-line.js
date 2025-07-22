/**
 * 合并查询结果折线图功能
 */

// 渲染合并的折线图
function renderMergedLineChart(container, datasets, labels) {
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = 900; // 增加宽度
    canvas.height = 600; // 增加高度
    canvas.id = 'merged-canvas';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // 设置图表尺寸
    const chartWidth = canvas.width - 150;
    const chartHeight = canvas.height - 180;
    const startX = 100;
    const startY = canvas.height - 120;
    
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
    
    // 计算X轴点的位置
    const xPoints = [];
    const usableWidth = chartWidth - 20;
    const pointSpacing = labels.length > 1 ? usableWidth / (labels.length - 1) : usableWidth;
    
    labels.forEach((_, index) => {
        xPoints.push(startX + 10 + index * pointSpacing);
    });
    
    // 绘制垂直网格线和X轴标签
    labels.forEach((label, index) => {
        const x = xPoints[index];
        
        // 绘制垂直网格线
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.moveTo(x, startY);
        ctx.lineTo(x, 50);
        ctx.stroke();
        
        // 绘制X轴标签（竖向）
        ctx.save();
        ctx.translate(x, startY + 10);
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
    });
    
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
        { stroke: 'rgba(75, 192, 192, 1)', fill: 'rgba(75, 192, 192, 0.2)' },
        { stroke: 'rgba(255, 99, 132, 1)', fill: 'rgba(255, 99, 132, 0.2)' },
        { stroke: 'rgba(54, 162, 235, 1)', fill: 'rgba(54, 162, 235, 0.2)' },
        { stroke: 'rgba(255, 206, 86, 1)', fill: 'rgba(255, 206, 86, 0.2)' },
        { stroke: 'rgba(153, 102, 255, 1)', fill: 'rgba(153, 102, 255, 0.2)' }
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
        
        // 绘制颜色线段
        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, legendY + 7);
        ctx.lineTo(x + 15, legendY + 7);
        ctx.stroke();
        
        // 绘制点
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + 7.5, legendY + 7, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = color.stroke;
        ctx.beginPath();
        ctx.arc(x + 7.5, legendY + 7, 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制文字
        ctx.fillStyle = 'black';
        ctx.fillText(dataset.name, x + 20, legendY + 7);
    });
    
    // 绘制每个数据集的折线
    datasets.forEach((dataset, datasetIndex) => {
        const color = colors[datasetIndex % colors.length];
        const points = [];
        
        // 收集所有点的坐标
        labels.forEach((label, labelIndex) => {
            const valueIndex = dataset.labels.indexOf(label);
            if (valueIndex === -1) return; // 该数据集没有这个标签
            
            const value = dataset.values[valueIndex];
            const y = startY - (value / maxValue) * chartHeight;
            points.push({ x: xPoints[labelIndex], y, value });
        });
        
        if (points.length < 2) return; // 至少需要两个点才能画线
        
        // 绘制填充区域
        ctx.beginPath();
        ctx.moveTo(points[0].x, startY);
        points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineTo(points[points.length - 1].x, startY);
        ctx.closePath();
        ctx.fillStyle = color.fill;
        ctx.fill();
        
        // 绘制折线
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制数据点和数值
        points.forEach(point => {
            // 绘制点
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // 绘制数值
            ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
            ctx.textAlign = 'center';
            ctx.font = '10px Arial';
            ctx.fillText(point.value.toString(), point.x, point.y - 15);
        });
    });
    
    // 绘制标题
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    ctx.fillText('查询结果合并折线图', canvas.width/2, 20);
    
    // 添加导出按钮
    addExportButton(container, canvas, '合并折线图');
}