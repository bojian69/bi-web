/**
 * 数据格式化工具
 */

// 将查询结果转换为图表数据
function formatChartData(data, type) {
    if (!data || !data.rows || !data.columns || data.rows.length === 0) {
        return null;
    }
    
    const labels = data.rows.map(row => String(row[0]));
    
    // 处理多列数据
    const datasets = [];
    
    // 从第二列开始，每列作为一个数据集
    for (let i = 1; i < data.columns.length; i++) {
        const values = data.rows.map(row => {
            if (row.length > i) {
                return parseFloat(row[i]) || 0;
            }
            return 0;
        });
        
        datasets.push({
            label: data.columns[i],
            data: values,
            backgroundColor: getRandomColor(i - 1, 0.7),
            borderColor: getRandomColor(i - 1, 1),
            borderWidth: 1
        });
    }
    
    return {
        labels: labels,
        datasets: datasets
    };
}

// 生成随机颜色
function getRandomColor(index, alpha = 1) {
    const colors = [
        `rgba(54, 162, 235, ${alpha})`,
        `rgba(255, 99, 132, ${alpha})`,
        `rgba(75, 192, 192, ${alpha})`,
        `rgba(255, 159, 64, ${alpha})`,
        `rgba(153, 102, 255, ${alpha})`,
        `rgba(255, 205, 86, ${alpha})`,
        `rgba(201, 203, 207, ${alpha})`,
        `rgba(255, 99, 71, ${alpha})`,
        `rgba(46, 204, 113, ${alpha})`,
        `rgba(142, 68, 173, ${alpha})`
    ];
    
    return colors[index % colors.length];
}

// 从Excel文件中提取SQL查询
function extractSQLFromExcel(file) {
    return new Promise((resolve, reject) => {
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
                
                // 提取SQL查询
                const sqlQueries = [];
                
                jsonData.forEach(row => {
                    // 尝试从每一行中找到SQL查询
                    Object.values(row).forEach(value => {
                        if (typeof value === 'string' && 
                            (value.trim().toUpperCase().startsWith('SELECT') || 
                             value.trim().toUpperCase().startsWith('WITH'))) {
                            sqlQueries.push(value.trim());
                        }
                    });
                });
                
                resolve(sqlQueries);
            } catch (error) {
                reject('Excel文件解析失败: ' + error.message);
            }
        };
        
        reader.onerror = function() {
            reject('读取文件失败');
        };
        
        reader.readAsArrayBuffer(file);
    });
}