/**
 * 主要交互逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
  // 图表切换功能
  const chartButtons = document.querySelectorAll('.chart-btn');
  const mainChart = document.getElementById('main-chart');
  let currentChart = null;
  
  // 从表格获取数据
  const getTableData = () => {
    const table = document.querySelector('.data-table');
    if (!table) return null;
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    
    const data = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return cells.map(cell => cell.textContent.trim());
    });
    
    return { headers, data };
  };
  
  // 创建柱状图
  const createBarChart = () => {
    const { headers, data } = getTableData();
    if (!data || data.length === 0) return;
    
    // 假设第一列是标签，第二列是数值
    const labels = data.map(row => row[0]);
    const values = data.map(row => parseFloat(row[1]));
    
    return new Chart(mainChart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: headers[1],
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${headers[0]}与${headers[1]}关系`
          }
        }
      }
    });
  };
  
  // 创建饼图
  const createPieChart = () => {
    const { headers, data } = getTableData();
    if (!data || data.length === 0) return;
    
    // 假设第一列是标签，第二列是数值
    const labels = data.map(row => row[0]);
    const values = data.map(row => parseFloat(row[1]));
    
    // 生成随机颜色
    const backgroundColors = data.map(() => {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    });
    
    return new Chart(mainChart, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: headers[1],
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${headers[1]}分布`
          }
        }
      }
    });
  };
  
  // 创建折线图
  const createLineChart = () => {
    const { headers, data } = getTableData();
    if (!data || data.length === 0) return;
    
    // 假设第一列是标签，其余列是数值
    const labels = data.map(row => row[0]);
    
    // 创建数据集
    const datasets = [];
    for (let i = 1; i < headers.length; i++) {
      datasets.push({
        label: headers[i],
        data: data.map(row => parseFloat(row[i])),
        borderColor: `hsl(${(i - 1) * 137.5 % 360}, 70%, 60%)`,
        backgroundColor: `hsla(${(i - 1) * 137.5 % 360}, 70%, 60%, 0.2)`,
        tension: 0.3
      });
    }
    
    return new Chart(mainChart, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '数据趋势'
          }
        }
      }
    });
  };
  
  // 切换图表类型
  const switchChart = (type) => {
    if (currentChart) {
      currentChart.destroy();
    }
    
    switch (type) {
      case 'bar':
        currentChart = createBarChart();
        break;
      case 'pie':
        currentChart = createPieChart();
        break;
      case 'line':
        currentChart = createLineChart();
        break;
    }
  };
  
  // 添加按钮事件监听
  chartButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 更新活动按钮
      chartButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // 切换图表
      switchChart(button.dataset.chart);
    });
  });
  
  // 初始化默认图表
  if (chartButtons.length > 0 && mainChart) {
    const defaultType = document.querySelector('.chart-btn.active')?.dataset.chart || 'bar';
    switchChart(defaultType);
  }
});