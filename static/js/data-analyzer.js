/**
 * 数据分析工具 - 简化版
 * 所有分析在本地完成，不会有数据外传
 */

// 数据分析器
window.DataAnalyzer = {
    // 分析维度定义
    dimensions: {
        overview: {
            name: '数据概览',
            description: '分析数据的基本结构和特征',
            icon: 'fas fa-table'
        },
        statistics: {
            name: '统计分析',
            description: '计算数值型数据的统计量',
            icon: 'fas fa-calculator'
        },
        distribution: {
            name: '分布分析',
            description: '分析数据的分布情况和偏态',
            icon: 'fas fa-chart-bar'
        },
        outliers: {
            name: '异常值检测',
            description: '检测数据中的异常值和离群点',
            icon: 'fas fa-exclamation-triangle'
        },
        correlation: {
            name: '相关性分析',
            description: '分析不同列之间的相关关系',
            icon: 'fas fa-project-diagram'
        },
        quality: {
            name: '数据质量分析',
            description: '检查数据的完整性和一致性',
            icon: 'fas fa-check-circle'
        },
        insights: {
            name: '自动洞察',
            description: '自动发现数据中的重要特征和模式',
            icon: 'fas fa-lightbulb'
        }
    },
    // 分析数据
    analyzeData: function(data, selectedDimensions = null) {
        if (!data || !data.columns || !data.rows || data.rows.length === 0) {
            return {
                success: false,
                message: '没有可分析的数据'
            };
        }
        
        // 如果没有指定维度，默认分析所有维度
        if (!selectedDimensions) {
            selectedDimensions = Object.keys(this.dimensions);
        }
        
        // 确保columns和rows是数组
        if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
            console.error('数据格式错误：columns或rows不是数组', data);
            return {
                success: false,
                message: '数据格式错误：columns或rows不是数组'
            };
        }
        
        const analysis = {
            metadata: {
                columnCount: data.columns.length,
                rowCount: data.rows.length,
                timestamp: new Date().toISOString(),
                analyzedDimensions: selectedDimensions
            },
            columns: {},
            insights: []
        };
        
        // 分析每一列
        data.columns.forEach((column, index) => {
            // 根据选择的维度进行列分析
            const columnAnalysis = this.analyzeColumn(data, index, selectedDimensions);
            analysis.columns[column] = columnAnalysis;
            
            // 如果选择了洞察维度，添加洞察
            if (selectedDimensions.includes('insights') && columnAnalysis.insights && columnAnalysis.insights.length > 0) {
                columnAnalysis.insights.forEach(insight => {
                    analysis.insights.push({
                        column: column,
                        message: insight,
                        type: insight.includes('异常') ? 'warning' : 'info'
                    });
                });
            }
        });
        
        // 如果选择了数据质量维度，分析数据完整性
        if (selectedDimensions.includes('quality')) {
            const completeness = this.analyzeCompleteness(data);
            analysis.completeness = completeness;
            
            if (selectedDimensions.includes('insights') && completeness.overallCompleteness < 95) {
                analysis.insights.push({
                    column: '整体',
                    message: `数据完整性为${completeness.overallCompleteness.toFixed(2)}%，存在缺失值`,
                    type: 'warning'
                });
            }
        }
        
        // 如果选择了相关性维度，并且有多个数值列，进行相关性分析
        if (selectedDimensions.includes('correlation')) {
            const numericColumns = [];
            data.columns.forEach((col, idx) => {
                if (analysis.columns[col] && analysis.columns[col].type === 'numeric') {
                    numericColumns.push({ name: col, index: idx });
                }
            });
            
            if (numericColumns.length >= 2) {
                analysis.correlations = [];
                
                for (let i = 0; i < numericColumns.length; i++) {
                    for (let j = i + 1; j < numericColumns.length; j++) {
                        const col1 = numericColumns[i];
                        const col2 = numericColumns[j];
                        
                        const correlation = this.calculateCorrelation(data, col1.index, col2.index);
                        
                        if (correlation && !isNaN(correlation.coefficient)) {
                            analysis.correlations.push({
                                columns: [col1.name, col2.name],
                                coefficient: correlation.coefficient,
                                strength: correlation.strength,
                                direction: correlation.direction
                            });
                            
                            // 如果选择了洞察维度，添加强相关性到洞察
                            if (selectedDimensions.includes('insights') && Math.abs(correlation.coefficient) > 0.7) {
                                analysis.insights.push({
                                    column: `${col1.name} & ${col2.name}`,
                                    message: `发现${correlation.direction}(r=${correlation.coefficient.toFixed(2)})，相关性${correlation.strength}`,
                                    type: 'positive'
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return {
            success: true,
            analysis: analysis
        };
    },
    
    // 分析单列数据
    analyzeColumn: function(data, columnIndex, selectedDimensions = null) {
        const columnName = data.columns[columnIndex];
        const values = data.rows.map(row => row[columnIndex])
            .filter(val => val !== null && val !== undefined);
        
        if (values.length === 0) {
            return {
                type: 'unknown',
                isEmpty: true
            };
        }
        
        // 确定列的数据类型
        const sampleSize = Math.min(10, values.length);
        let numericCount = 0;
        let dateCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
            const val = values[i];
            
            // 检查是否为数值
            if (typeof val === 'number' || !isNaN(parseFloat(String(val).replace(/,/g, '')))) {
                numericCount++;
            }
            
            // 检查是否为日期
            if (typeof val === 'string') {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    dateCount++;
                }
            }
        }
        
        const columnAnalysis = {
            insights: []
        };
        
        // 根据数据类型进行不同的分析
        if (numericCount >= sampleSize * 0.8) {
            // 数值型数据分析
            columnAnalysis.type = 'numeric';
            
            // 如果选择了统计分析维度
            if (!selectedDimensions || selectedDimensions.includes('statistics')) {
                columnAnalysis.stats = this.calculateNumericStats(data, columnIndex);
            }
            
            // 添加洞察
            if (columnAnalysis.stats) {
                // 如果选择了异常值检测维度
                if (!selectedDimensions || selectedDimensions.includes('outliers')) {
                    const outliers = this.detectOutliers(data, columnIndex);
                    if (outliers && outliers.length > 0) {
                        columnAnalysis.outliers = outliers;
                        columnAnalysis.insights.push(
                            `发现${outliers.length}个异常值，可能需要进一步检查`
                        );
                    }
                }
                
                // 如果选择了分布分析维度
                if (!selectedDimensions || selectedDimensions.includes('distribution')) {
                    // 检查分布偏斜
                    const skewness = this.calculateSkewness(data, columnIndex);
                    columnAnalysis.distribution = { skewness: skewness };
                    
                    if (Math.abs(skewness) > 1) {
                        columnAnalysis.insights.push(
                            `数据分布${skewness > 0 ? '右偏' : '左偏'}，偏度为${skewness.toFixed(2)}`
                        );
                    }
                    
                    // 检查变异系数
                    const cv = columnAnalysis.stats.stdDev / columnAnalysis.stats.mean;
                    columnAnalysis.distribution.cv = cv;
                    
                    if (cv > 0.5) {
                        columnAnalysis.insights.push(
                            `数据波动较大，变异系数为${cv.toFixed(2)}`
                        );
                    }
                }
            }
            
        } else if (dateCount >= sampleSize * 0.8) {
            // 日期型数据分析
            columnAnalysis.type = 'date';
            columnAnalysis.insights.push('检测到日期类型数据');
            
        } else {
            // 分类数据分析
            columnAnalysis.type = 'categorical';
            
            // 如果选择了分布分析维度
            if (!selectedDimensions || selectedDimensions.includes('distribution')) {
                columnAnalysis.categories = this.analyzeCategorical(data, columnIndex);
                
                if (columnAnalysis.categories) {
                    // 检查类别分布
                    if (columnAnalysis.categories.uniqueCount === 1) {
                        columnAnalysis.insights.push('该列只有一个唯一值，可能不具有分析价值');
                    } else if (columnAnalysis.categories.uniqueCount > data.rows.length * 0.9) {
                        columnAnalysis.insights.push('该列具有大量不同的值，可能是ID或唯一标识符');
                    }
                    
                    // 检查主导类别
                    const topCategory = columnAnalysis.categories.topCategories[0];
                    if (topCategory && topCategory.percentage > 80) {
                        columnAnalysis.insights.push(
                            `类别"${topCategory.category}"占比${topCategory.percentage.toFixed(2)}%，明显高于其他类别`
                        );
                    }
                }
            }
        }
        
        return columnAnalysis;
    },
    
    // 计算数值统计量
    calculateNumericStats: function(data, columnIndex) {
        const values = data.rows
            .map(row => row[columnIndex])
            .filter(val => val !== null && val !== undefined)
            .map(val => typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val))
            .filter(val => !isNaN(val));
        
        if (values.length === 0) return null;
        
        // 计算基本统计量
        values.sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const min = values[0];
        const max = values[values.length - 1];
        const median = values.length % 2 === 0 
            ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
            : values[Math.floor(values.length / 2)];
        
        // 计算标准差
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            count: values.length,
            sum: sum,
            mean: mean,
            median: median,
            min: min,
            max: max,
            range: max - min,
            variance: variance,
            stdDev: stdDev
        };
    },
    
    // 检测异常值
    detectOutliers: function(data, columnIndex) {
        const values = data.rows
            .map(row => row[columnIndex])
            .filter(val => val !== null && val !== undefined)
            .map(val => typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val))
            .filter(val => !isNaN(val));
        
        if (values.length < 5) return null;
        
        // 使用IQR方法检测异常值
        values.sort((a, b) => a - b);
        const q1Index = Math.floor(values.length * 0.25);
        const q3Index = Math.floor(values.length * 0.75);
        const q1 = values[q1Index];
        const q3 = values[q3Index];
        const iqr = q3 - q1;
        
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const outliers = [];
        data.rows.forEach((row, index) => {
            const val = row[columnIndex];
            const numVal = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
            if (!isNaN(numVal) && (numVal < lowerBound || numVal > upperBound)) {
                outliers.push({
                    rowIndex: index,
                    value: numVal,
                    isLow: numVal < lowerBound,
                    isHigh: numVal > upperBound
                });
            }
        });
        
        return outliers.length > 0 ? outliers : null;
    },
    
    // 计算偏度
    calculateSkewness: function(data, columnIndex) {
        const values = data.rows
            .map(row => row[columnIndex])
            .filter(val => val !== null && val !== undefined)
            .map(val => typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val))
            .filter(val => !isNaN(val));
        
        if (values.length < 5) return 0;
        
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n);
        
        if (stdDev === 0) return 0;
        
        const cubedDiffs = values.map(val => Math.pow((val - mean) / stdDev, 3));
        const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / n;
        
        return skewness;
    },
    
    // 分析分类数据
    analyzeCategorical: function(data, columnIndex) {
        const values = data.rows.map(row => row[columnIndex])
            .filter(val => val !== null && val !== undefined);
        
        if (values.length === 0) return null;
        
        // 计算频率
        const freqMap = {};
        values.forEach(val => {
            const strVal = String(val);
            freqMap[strVal] = (freqMap[strVal] || 0) + 1;
        });
        
        // 转换为数组并计算百分比
        const frequencies = Object.entries(freqMap).map(([category, count]) => ({
            category,
            count,
            percentage: (count / values.length) * 100
        }));
        
        // 按频率降序排序
        frequencies.sort((a, b) => b.count - a.count);
        
        return {
            totalCount: values.length,
            uniqueCount: frequencies.length,
            topCategories: frequencies.slice(0, 5)
        };
    },
    
    // 分析数据完整性
    analyzeCompleteness: function(data) {
        if (!data || !data.rows || !data.columns) return null;
        
        const totalCells = data.rows.length * data.columns.length;
        let missingCells = 0;
        const columnStats = {};
        
        // 初始化每列的统计信息
        data.columns.forEach((col, index) => {
            columnStats[col] = {
                index: index,
                total: data.rows.length,
                missing: 0,
                completeness: 100
            };
        });
        
        // 计算缺失值
        data.rows.forEach(row => {
            row.forEach((cell, colIndex) => {
                if (cell === null || cell === undefined || cell === '') {
                    missingCells++;
                    columnStats[data.columns[colIndex]].missing++;
                }
            });
        });
        
        // 计算每列的完整性百分比
        Object.keys(columnStats).forEach(col => {
            const stats = columnStats[col];
            stats.completeness = ((stats.total - stats.missing) / stats.total) * 100;
        });
        
        return {
            totalCells: totalCells,
            missingCells: missingCells,
            overallCompleteness: ((totalCells - missingCells) / totalCells) * 100,
            columnStats: columnStats
        };
    },
    
    // 计算相关系数
    calculateCorrelation: function(data, column1Index, column2Index) {
        const pairs = [];
        data.rows.forEach(row => {
            const val1 = row[column1Index];
            const val2 = row[column2Index];
            
            const num1 = typeof val1 === 'string' ? parseFloat(val1.replace(/,/g, '')) : parseFloat(val1);
            const num2 = typeof val2 === 'string' ? parseFloat(val2.replace(/,/g, '')) : parseFloat(val2);
            
            if (!isNaN(num1) && !isNaN(num2)) {
                pairs.push([num1, num2]);
            }
        });
        
        if (pairs.length < 3) return null;
        
        // 计算均值
        const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0);
        const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0);
        const mean1 = sum1 / pairs.length;
        const mean2 = sum2 / pairs.length;
        
        // 计算协方差和标准差
        let covariance = 0;
        let variance1 = 0;
        let variance2 = 0;
        
        pairs.forEach(pair => {
            const diff1 = pair[0] - mean1;
            const diff2 = pair[1] - mean2;
            covariance += diff1 * diff2;
            variance1 += diff1 * diff1;
            variance2 += diff2 * diff2;
        });
        
        covariance /= pairs.length;
        variance1 /= pairs.length;
        variance2 /= pairs.length;
        
        const stdDev1 = Math.sqrt(variance1);
        const stdDev2 = Math.sqrt(variance2);
        
        if (stdDev1 === 0 || stdDev2 === 0) return null;
        
        // 计算相关系数
        const coefficient = covariance / (stdDev1 * stdDev2);
        
        // 解释相关性强度
        let strength = '';
        const absCorr = Math.abs(coefficient);
        if (absCorr < 0.3) strength = '弱';
        else if (absCorr < 0.7) strength = '中等';
        else strength = '强';
        
        return {
            coefficient: coefficient,
            strength: strength,
            direction: coefficient > 0 ? '正相关' : coefficient < 0 ? '负相关' : '无相关'
        };
    },
    
    // 比较两个数据集
    compareDatasets: function(data1, data2) {
        if (!data1 || !data2 || !data1.columns || !data2.columns || 
            !data1.rows || !data2.rows || data1.rows.length === 0 || data2.rows.length === 0) {
            return {
                success: false,
                message: '没有可比较的数据'
            };
        }
        
        const comparison = {
            metadata: {
                dataset1: {
                    columnCount: data1.columns.length,
                    rowCount: data1.rows.length
                },
                dataset2: {
                    columnCount: data2.columns.length,
                    rowCount: data2.rows.length
                }
            },
            commonColumns: [],
            differences: [],
            insights: []
        };
        
        // 找出共同的列
        data1.columns.forEach(col1 => {
            if (data2.columns.includes(col1)) {
                comparison.commonColumns.push(col1);
            }
        });
        
        // 比较共同列
        comparison.commonColumns.forEach(column => {
            const col1Index = data1.columns.indexOf(column);
            const col2Index = data2.columns.indexOf(column);
            
            const analysis1 = this.analyzeColumn(data1, col1Index);
            const analysis2 = this.analyzeColumn(data2, col2Index);
            
            // 根据数据类型进行不同的比较
            if (analysis1.type === 'numeric' && analysis2.type === 'numeric' && 
                analysis1.stats && analysis2.stats) {
                
                // 比较数值统计
                const stats1 = analysis1.stats;
                const stats2 = analysis2.stats;
                
                const meanDiff = ((stats2.mean - stats1.mean) / stats1.mean) * 100;
                const medianDiff = ((stats2.median - stats1.median) / stats1.median) * 100;
                
                comparison.differences.push({
                    column: column,
                    type: 'numeric',
                    metrics: [
                        {
                            name: '平均值',
                            value1: stats1.mean,
                            value2: stats2.mean,
                            difference: meanDiff,
                            unit: '%'
                        },
                        {
                            name: '中位数',
                            value1: stats1.median,
                            value2: stats2.median,
                            difference: medianDiff,
                            unit: '%'
                        }
                    ]
                });
                
                // 添加显著差异到洞察
                if (Math.abs(meanDiff) > 10) {
                    comparison.insights.push({
                        column: column,
                        message: `平均值${meanDiff > 0 ? '增加' : '减少'}了${Math.abs(meanDiff).toFixed(2)}%`,
                        type: meanDiff > 0 ? 'positive' : 'warning'
                    });
                }
            } else if (analysis1.type === 'categorical' && analysis2.type === 'categorical' &&
                      analysis1.categories && analysis2.categories) {
                
                // 比较分类分布
                const categories1 = analysis1.categories;
                const categories2 = analysis2.categories;
                
                const categoryDiffs = [];
                
                // 合并两个数据集的所有类别
                const allCategories = new Set();
                categories1.topCategories.forEach(item => allCategories.add(item.category));
                categories2.topCategories.forEach(item => allCategories.add(item.category));
                
                allCategories.forEach(category => {
                    const cat1 = categories1.topCategories.find(c => c.category === category);
                    const cat2 = categories2.topCategories.find(c => c.category === category);
                    
                    if (cat1 && cat2) {
                        const percentageDiff = cat2.percentage - cat1.percentage;
                        
                        categoryDiffs.push({
                            category: category,
                            percentage1: cat1.percentage,
                            percentage2: cat2.percentage,
                            difference: percentageDiff
                        });
                        
                        // 添加显著差异到洞察
                        if (Math.abs(percentageDiff) > 10) {
                            comparison.insights.push({
                                column: column,
                                message: `类别"${category}"占比${percentageDiff > 0 ? '增加' : '减少'}了${Math.abs(percentageDiff).toFixed(2)}个百分点`,
                                type: 'info'
                            });
                        }
                    }
                });
                
                comparison.differences.push({
                    column: column,
                    type: 'categorical',
                    categoryDiffs: categoryDiffs
                });
            }
        });
        
        return {
            success: true,
            comparison: comparison
        };
    },
    
    // 生成分析报表HTML
    generateReportHTML: function(analysis) {
        if (!analysis) return '<p>没有可用的分析数据</p>';
        
        const selectedDimensions = analysis.metadata.analyzedDimensions || Object.keys(this.dimensions);
        let html = '';
        
        // 如果选择了数据概览维度
        if (selectedDimensions.includes('overview')) {
            html += `
                <div class="report-section">
                    <h3>数据概览</h3>
                    <div class="stat-grid">
                        <div class="stat-card">
                            <div class="stat-value">${analysis.metadata.rowCount}</div>
                            <div class="stat-label">行数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.metadata.columnCount}</div>
                            <div class="stat-label">列数</div>
                        </div>
                        ${selectedDimensions.includes('quality') && analysis.completeness ? `
                        <div class="stat-card">
                            <div class="stat-value">${analysis.completeness.overallCompleteness.toFixed(2)}%</div>
                            <div class="stat-label">数据完整性</div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }
        
        // 如果选择了洞察维度
        if (selectedDimensions.includes('insights') && analysis.insights && analysis.insights.length > 0) {
            html += `
                <div class="report-section">
                    <h3>关键洞察</h3>
            `;
        
        if (analysis.insights && analysis.insights.length > 0) {
            analysis.insights.forEach(insight => {
                html += `
                    <div class="insight-item ${insight.type || ''}">
                        <strong>${insight.column}:</strong> ${insight.message}
                    </div>
                `;
            });
        } else {
            html += '<p>没有发现显著洞察</p>';
        }
        
        if (selectedDimensions.includes('insights')) {
            html += `
                </div>
            `;
        }
        
        // 如果选择了统计分析或分布分析维度
        if (selectedDimensions.includes('statistics') || selectedDimensions.includes('distribution')) {
            html += `
                <div class="report-section">
                    <h3>列分析</h3>
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>列名</th>
                                <th>类型</th>
                                <th>统计信息</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
        
        if (selectedDimensions.includes('statistics') || selectedDimensions.includes('distribution')) {
            Object.entries(analysis.columns).forEach(([column, colAnalysis]) => {
                let statsHtml = '';
                
                if (colAnalysis.type === 'numeric') {
                    // 如果选择了统计分析维度
                    if (selectedDimensions.includes('statistics') && colAnalysis.stats) {
                        statsHtml = `
                            <ul>
                                <li>平均值: ${colAnalysis.stats.mean.toFixed(2)}</li>
                                <li>中位数: ${colAnalysis.stats.median.toFixed(2)}</li>
                                <li>最小值: ${colAnalysis.stats.min.toFixed(2)}</li>
                                <li>最大值: ${colAnalysis.stats.max.toFixed(2)}</li>
                                <li>标准差: ${colAnalysis.stats.stdDev.toFixed(2)}</li>
                            </ul>
                        `;
                    }
                    
                    // 如果选择了分布分析维度
                    if (selectedDimensions.includes('distribution') && colAnalysis.distribution) {
                        statsHtml += `
                            <ul>
                                <li>偏度: ${colAnalysis.distribution.skewness.toFixed(2)}</li>
                                <li>变异系数: ${colAnalysis.distribution.cv.toFixed(2)}</li>
                            </ul>
                        `;
                    }
                } else if (colAnalysis.type === 'categorical' && selectedDimensions.includes('distribution') && colAnalysis.categories) {
                    statsHtml = `
                        <ul>
                            <li>唯一值数量: ${colAnalysis.categories.uniqueCount}</li>
                            <li>最常见值: ${colAnalysis.categories.topCategories[0]?.category || '无'} (${colAnalysis.categories.topCategories[0]?.percentage.toFixed(2) || 0}%)</li>
                        </ul>
                    `;
                }
                
                html += `
                    <tr>
                        <td>${column}</td>
                        <td>${colAnalysis.type}</td>
                        <td>${statsHtml}</td>
                    </tr>
                `;
            });
        }
        
        if (selectedDimensions.includes('statistics') || selectedDimensions.includes('distribution')) {
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // 如果选择了相关性分析维度
        if (selectedDimensions.includes('correlation') && analysis.correlations && analysis.correlations.length > 0) {
            html += `
                <div class="report-section">
                    <h3>相关性分析</h3>
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>列1</th>
                                <th>列2</th>
                                <th>相关系数</th>
                                <th>关系</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            analysis.correlations.forEach(corr => {
                html += `
                    <tr>
                        <td>${corr.columns[0]}</td>
                        <td>${corr.columns[1]}</td>
                        <td>${corr.coefficient.toFixed(4)}</td>
                        <td>${corr.direction} (${corr.strength})</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // 如果选择了异常值检测维度
        if (selectedDimensions.includes('outliers')) {
            let hasOutliers = false;
            
            // 检查是否有异常值
            Object.entries(analysis.columns).forEach(([column, colAnalysis]) => {
                if (colAnalysis.outliers && colAnalysis.outliers.length > 0) {
                    hasOutliers = true;
                }
            });
            
            if (hasOutliers) {
                html += `
                    <div class="report-section">
                        <h3>异常值检测</h3>
                        <table class="analysis-table">
                            <thead>
                                <tr>
                                    <th>列名</th>
                                    <th>异常值数量</th>
                                    <th>异常值示例</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                Object.entries(analysis.columns).forEach(([column, colAnalysis]) => {
                    if (colAnalysis.outliers && colAnalysis.outliers.length > 0) {
                        // 取前3个异常值作为示例
                        const examples = colAnalysis.outliers.slice(0, 3).map(o => o.value.toFixed(2)).join(', ');
                        
                        html += `
                            <tr>
                                <td>${column}</td>
                                <td>${colAnalysis.outliers.length}</td>
                                <td>${examples}...</td>
                            </tr>
                        `;
                    }
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        
        // 如果选择了数据质量分析维度
        if (selectedDimensions.includes('quality') && analysis.completeness) {
            html += `
                <div class="report-section">
                    <h3>数据质量分析</h3>
                    <div class="stat-grid">
                        <div class="stat-card">
                            <div class="stat-value">${analysis.completeness.overallCompleteness.toFixed(2)}%</div>
                            <div class="stat-label">数据完整性</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.completeness.missingCells}</div>
                            <div class="stat-label">缺失值数量</div>
                        </div>
                    </div>
                    
                    <h4>列完整性</h4>
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>列名</th>
                                <th>完整性</th>
                                <th>缺失值数量</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            Object.entries(analysis.completeness.columnStats).forEach(([column, stats]) => {
                if (stats.missing > 0) {
                    html += `
                        <tr>
                            <td>${column}</td>
                            <td>${stats.completeness.toFixed(2)}%</td>
                            <td>${stats.missing}</td>
                        </tr>
                    `;
                }
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        return html;
    },
    
    // 生成比较报表HTML
    generateComparisonReportHTML: function(comparison) {
        if (!comparison) return '<p>没有可用的比较数据</p>';
        
        let html = `
            <div class="report-section">
                <h3>数据集比较概览</h3>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${comparison.metadata.dataset1.rowCount}</div>
                        <div class="stat-label">数据集1行数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${comparison.metadata.dataset2.rowCount}</div>
                        <div class="stat-label">数据集2行数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${comparison.commonColumns.length}</div>
                        <div class="stat-label">共同列数</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>关键差异</h3>
        `;
        
        if (comparison.insights && comparison.insights.length > 0) {
            comparison.insights.forEach(insight => {
                html += `
                    <div class="insight-item ${insight.type || ''}">
                        <strong>${insight.column}:</strong> ${insight.message}
                    </div>
                `;
            });
        } else {
            html += '<p>没有发现显著差异</p>';
        }
        
        html += `
            </div>
            
            <div class="report-section">
                <h3>详细比较</h3>
        `;
        
        if (comparison.differences && comparison.differences.length > 0) {
            comparison.differences.forEach(diff => {
                html += `<h4>${diff.column}</h4>`;
                
                if (diff.type === 'numeric') {
                    html += `
                        <table class="analysis-table">
                            <thead>
                                <tr>
                                    <th>指标</th>
                                    <th>数据集1</th>
                                    <th>数据集2</th>
                                    <th>变化</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    diff.metrics.forEach(metric => {
                        html += `
                            <tr>
                                <td>${metric.name}</td>
                                <td>${metric.value1.toFixed(2)}</td>
                                <td>${metric.value2.toFixed(2)}</td>
                                <td>${metric.difference > 0 ? '+' : ''}${metric.difference.toFixed(2)}${metric.unit}</td>
                            </tr>
                        `;
                    });
                    
                    html += `
                            </tbody>
                        </table>
                    `;
                } else if (diff.type === 'categorical') {
                    html += `
                        <table class="analysis-table">
                            <thead>
                                <tr>
                                    <th>类别</th>
                                    <th>数据集1占比</th>
                                    <th>数据集2占比</th>
                                    <th>变化(百分点)</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    diff.categoryDiffs.forEach(catDiff => {
                        html += `
                            <tr>
                                <td>${catDiff.category}</td>
                                <td>${catDiff.percentage1.toFixed(2)}%</td>
                                <td>${catDiff.percentage2.toFixed(2)}%</td>
                                <td>${catDiff.difference > 0 ? '+' : ''}${catDiff.difference.toFixed(2)}</td>
                            </tr>
                        `;
                    });
                    
                    html += `
                            </tbody>
                        </table>
                    `;
                }
            });
        } else {
            html += '<p>没有可比较的数据</p>';
        }
        
        html += `
            </div>
        `;
        
        return html;
    }
};