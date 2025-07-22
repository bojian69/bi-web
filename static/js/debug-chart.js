// 调试图表渲染
function testChartRendering() {
    // 创建测试数据
    const testData = {
        columns: ['类别', '数值'],
        rows: [
            ['A', 10],
            ['B', 20],
            ['C', 30],
            ['D', 15],
            ['E', 25]
        ]
    };
    
    // 尝试渲染测试图表
    try {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        // 测试柱状图
        renderBarChart(container, testData);
        
        // 测试折线图
        renderLineChart(container, testData);
        
        // 测试饼图
        renderPieChart(container, testData);
        
        // 清理
        document.body.removeChild(container);
        return true;
    } catch (err) {
        console.error('图表渲染测试失败:', err);
        return false;
    }
}

// 页面加载完成后执行测试
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const chartWorks = testChartRendering();
        console.log('图表渲染测试结果:', chartWorks ? '正常' : '异常');
    }, 1000);
});