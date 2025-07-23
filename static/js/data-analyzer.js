/**
 * 数据分析工具 - 表格增强和分布分析
 */

class DataAnalyzer {
  /**
   * 初始化数据分析器
   * @param {string} tableSelector - 表格选择器
   * @param {string} analysisContainerSelector - 分析结果容器选择器
   */
  constructor(tableSelector, analysisContainerSelector) {
    this.table = document.querySelector(tableSelector);
    this.analysisContainer = document.querySelector(analysisContainerSelector);
    this.data = [];
    this.columns = [];
    this.numericColumns = [];
    
    if (this.table) {
      this.enhanceTable();
      this.extractData();
      this.detectNumericColumns();
      this.renderDistributionAnalysis();
    }
  }
  
  /**
   * 增强表格功能
   */
  enhanceTable() {
    // 添加表格类
    this.table.classList.add('data-table');
    
    // 为数值列添加类
    const headerRow = this.table.querySelector('thead tr');
    if (headerRow) {
      const headers = Array.from(headerRow.querySelectorAll('th'));
      this.columns = headers.map(h => h.textContent.trim());
      
      // 检测数值列并添加样式
      const rows = Array.from(this.table.querySelectorAll('tbody tr'));
      if (rows.length > 0) {
        const firstRow = rows[0];
        const cells = Array.from(firstRow.querySelectorAll('td'));
        
        cells.forEach((cell, index) => {
          const value = cell.textContent.trim();
          if (!isNaN(parseFloat(value)) && isFinite(value)) {
            // 为所有行的该列添加数值类
            rows.forEach(row => {
              const numericCell = row.querySelectorAll('td')[index];
              if (numericCell) numericCell.classList.add('number');
            });
          }
        });
      }
    }
    
    // 添加排序功能
    this.addSorting();
    
    // 添加分页功能
    if (this.table.querySelectorAll('tbody tr').length > 10) {
      this.addPagination();
    }
  }
  
  /**
   * 添加表格排序功能
   */
  addSorting() {
    const headers = this.table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => this.sortTable(index));
      header.title = '点击排序';
    });
  }
  
  /**
   * 排序表格
   * @param {number} columnIndex - 要排序的列索引
   */
  sortTable(columnIndex) {
    const tbody = this.table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isNumeric = this.numericColumns.includes(columnIndex);
    
    // 检查当前排序方向
    const currentDir = tbody.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
    tbody.setAttribute('data-sort-dir', currentDir);
    
    // 排序行
    rows.sort((a, b) => {
      const aValue = a.querySelectorAll('td')[columnIndex].textContent.trim();
      const bValue = b.querySelectorAll('td')[columnIndex].textContent.trim();
      
      if (isNumeric) {
        return currentDir === 'asc' 
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      } else {
        return currentDir === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
    
    // 重新添加排序后的行
    rows.forEach(row => tbody.appendChild(row));
  }
  
  /**
   * 添加分页功能
   */
  addPagination() {
    const rowsPerPage = 10;
    const rows = Array.from(this.table.querySelectorAll('tbody tr'));
    const pageCount = Math.ceil(rows.length / rowsPerPage);
    
    // 创建分页容器
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'table-pagination';
    
    // 创建分页控件
    const prevButton = document.createElement('button');
    prevButton.textContent = '上一页';
    prevButton.disabled = true;
    
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `第 1 页，共 ${pageCount} 页`;
    
    const nextButton = document.createElement('button');
    nextButton.textContent = '下一页';
    nextButton.disabled = pageCount <= 1;
    
    // 添加到容器
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
    
    // 插入到表格后
    this.table.parentNode.insertBefore(paginationContainer, this.table.nextSibling);
    
    // 当前页
    let currentPage = 1;
    
    // 显示指定页
    const showPage = (page) => {
      rows.forEach((row, index) => {
        row.style.display = 
          (index >= (page - 1) * rowsPerPage && index < page * rowsPerPage)
            ? '' 
            : 'none';
      });
      
      // 更新按钮状态
      prevButton.disabled = page === 1;
      nextButton.disabled = page === pageCount;
      pageInfo.textContent = `第 ${page} 页，共 ${pageCount} 页`;
    };
    
    // 初始显示第一页
    showPage(1);
    
    // 添加事件监听
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
      }
    });
    
    nextButton.addEventListener('click', () => {
      if (currentPage < pageCount) {
        currentPage++;
        showPage(currentPage);
      }
    });
  }
  
  /**
   * 从表格提取数据
   */
  extractData() {
    const rows = Array.from(this.table.querySelectorAll('tbody tr'));
    this.data = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return cells.map(cell => cell.textContent.trim());
    });
  }
  
  /**
   * 检测数值列
   */
  detectNumericColumns() {
    if (this.data.length === 0) return;
    
    const firstRow = this.data[0];
    this.numericColumns = firstRow.map((_, colIndex) => {
      // 检查该列是否所有值都是数字
      return this.data.every(row => {
        const value = row[colIndex];
        return !isNaN(parseFloat(value)) && isFinite(value);
      });
    });
    
    // 保存数值列索引
    this.numericColumns = this.numericColumns.map((isNumeric, index) => 
      isNumeric ? index : null).filter(index => index !== null);
  }
  
  /**
   * 渲染分布分析结果
   */
  renderDistributionAnalysis() {
    if (!this.analysisContainer || this.numericColumns.length === 0) return;
    
    // 清空容器
    this.analysisContainer.innerHTML = '';
    
    // 为每个数值列创建分析
    this.numericColumns.forEach(colIndex => {
      const columnName = this.columns[colIndex];
      const values = this.data.map(row => parseFloat(row[colIndex]));
      
      // 创建分析容器
      const analysisDiv = document.createElement('div');
      analysisDiv.className = 'distribution-analysis';
      
      // 添加标题
      const title = document.createElement('h3');
      title.textContent = `${columnName} 分布分析`;
      analysisDiv.appendChild(title);
      
      // 计算统计数据
      const stats = this.calculateStats(values);
      
      // 创建统计网格
      const statsGrid = document.createElement('div');
      statsGrid.className = 'stats-grid';
      
      // 添加统计卡片
      Object.entries(stats).forEach(([key, value]) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const label = document.createElement('div');
        label.className = 'stat-label';
        label.textContent = key;
        
        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = typeof value === 'number' 
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value;
        
        card.appendChild(label);
        card.appendChild(statValue);
        statsGrid.appendChild(card);
      });
      
      analysisDiv.appendChild(statsGrid);
      
      // 添加图表容器
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.id = `chart-${colIndex}`;
      analysisDiv.appendChild(chartContainer);
      
      // 添加到主容器
      this.analysisContainer.appendChild(analysisDiv);
      
      // 如果有Chart.js，创建直方图
      if (window.Chart) {
        this.createHistogram(values, `chart-${colIndex}`, columnName);
      }
    });
  }
  
  /**
   * 计算统计数据
   * @param {Array<number>} values - 数值数组
   * @returns {Object} 统计结果
   */
  calculateStats(values) {
    if (values.length === 0) return {};
    
    // 排序值用于计算
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // 计算基本统计量
    const sum = sortedValues.reduce((a, b) => a + b, 0);
    const count = sortedValues.length;
    const mean = sum / count;
    
    // 计算方差和标准差
    const variance = sortedValues.reduce((acc, val) => 
      acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    // 计算中位数
    const mid = Math.floor(count / 2);
    const median = count % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
    
    // 计算四分位数
    const q1 = sortedValues[Math.floor(count * 0.25)];
    const q3 = sortedValues[Math.floor(count * 0.75)];
    
    // 计算最小值和最大值
    const min = sortedValues[0];
    const max = sortedValues[count - 1];
    
    return {
      '计数': count,
      '平均值': mean,
      '中位数': median,
      '标准差': stdDev,
      '最小值': min,
      '第一四分位数': q1,
      '第三四分位数': q3,
      '最大值': max,
      '范围': max - min
    };
  }
  
  /**
   * 创建直方图
   * @param {Array<number>} values - 数值数组
   * @param {string} containerId - 图表容器ID
   * @param {string} label - 图表标签
   */
  createHistogram(values, containerId, label) {
    if (!window.Chart) return;
    
    // 计算直方图的箱数
    const binCount = Math.ceil(Math.sqrt(values.length));
    
    // 计算最小值和最大值
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // 计算箱宽
    const binWidth = (max - min) / binCount;
    
    // 初始化箱计数
    const bins = Array(binCount).fill(0);
    
    // 计算每个值所属的箱
    values.forEach(value => {
      const binIndex = Math.min(
        Math.floor((value - min) / binWidth),
        binCount - 1
      );
      bins[binIndex]++;
    });
    
    // 创建标签
    const labels = Array(binCount).fill(0).map((_, i) => {
      const start = min + i * binWidth;
      const end = start + binWidth;
      return `${start.toFixed(1)}-${end.toFixed(1)}`;
    });
    
    // 创建图表
    const ctx = document.getElementById(containerId).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `${label} 分布`,
          data: bins,
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
            beginAtZero: true,
            title: {
              display: true,
              text: '频率'
            }
          },
          x: {
            title: {
              display: true,
              text: label
            }
          }
        }
      }
    });
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 初始化所有数据表格
  const tables = document.querySelectorAll('.data-table, table.query-result');
  tables.forEach((table, index) => {
    // 为每个表格创建分析容器
    const analysisContainer = document.createElement('div');
    analysisContainer.id = `analysis-${index}`;
    table.parentNode.insertBefore(analysisContainer, table.nextSibling);
    
    // 初始化分析器
    new DataAnalyzer(table, `#analysis-${index}`);
  });
});