/**
 * 数据分析规则引擎
 * 仅在本地分析数据，不对外传输
 */

const DataAnalysisRules = {
    // 数据类型识别规则
    typeDetection: {
        // 识别数值型列
        isNumeric: function(values) {
            if (!values || values.length === 0) return false;
            const numericCount = values.filter(val => 
                !isNaN(parseFloat(val)) && isFinite(String(val).replace(/,/g, ''))
            ).length;
            return numericCount / values.length > 0.7; // 70%以上为数值则判定为数值型
        },
        
        // 识别日期型列
        isDate: function(values) {
            if (!values || values.length === 0) return false;
            const dateCount = values.filter(val => {
                if (typeof val !== 'string') return false;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }).length;
            return dateCount / values.length > 0.7; // 70%以上为日期则判定为日期型
        },
        
        // 识别分类型列
        isCategorical: function(values) {
            if (!values || values.length === 0) return false;
            const uniqueValues = new Set(values);
            // 唯一值数量小于值总数的30%，或唯一值数量小于10，则判定为分类型
            return uniqueValues.size < Math.min(10, values.length * 0.3);
        }
    },
    
    // 数据质量规则
    qualityRules: {
        // 检查缺失值
        checkMissingValues: function(data) {
            const result = {
                hasMissingValues: false,
                missingValueColumns: [],
                missingValueCounts: {},
                totalMissingValues: 0
            };
            
            if (!data || !data.columns || !data.rows) return result;
            
            data.columns.forEach((column, colIndex) => {
                let missingCount = 0;
                data.rows.forEach(row => {
                    if (row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === '') {
                        missingCount++;
                    }
                });
                
                if (missingCount > 0) {
                    result.hasMissingValues = true;
                    result.missingValueColumns.push(column);
                    result.missingValueCounts[column] = missingCount;
                    result.totalMissingValues += missingCount;
                }
            });
            
            return result;
        },
        
        // 检查异常值 (使用IQR方法)
        checkOutliers: function(data, columnIndex) {
            const result = {
                hasOutliers: false,
                outliers: []
            };
            
            if (!data || !data.rows || data.rows.length < 5) return result;
            
            // 提取数值
            const values = data.rows
                .map(row => row[columnIndex])
                .filter(val => val !== null && val !== undefined)
                .map(val => typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val))
                .filter(val => !isNaN(val));
            
            if (values.length < 5) return result;
            
            // 计算四分位数
            values.sort((a, b) => a - b);
            const q1Index = Math.floor(values.length * 0.25);
            const q3Index = Math.floor(values.length * 0.75);
            const q1 = values[q1Index];
            const q3 = values[q3Index];
            const iqr = q3 - q1;
            
            // 定义异常值边界
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            // 检测异常值
            data.rows.forEach((row, rowIndex) => {
                const val = row[columnIndex];
                const numVal = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val);
                if (!isNaN(numVal) && (numVal < lowerBound || numVal > upperBound)) {
                    result.hasOutliers = true;
                    result.outliers.push({
                        rowIndex: rowIndex,
                        value: numVal,
                        isLow: numVal < lowerBound,
                        isHigh: numVal > upperBound
                    });
                }
            });
            
            return result;
        }
    },
    
    // 数据比较规则
    comparisonRules: {
        // 比较两个数据集的基本统计量
        compareStatistics: function(data1, data2, columnName) {
            const result = {
                column: columnName,
                differences: {}
            };
            
            // 获取两个数据集中的列索引
            const colIndex1 = data1.columns.indexOf(columnName);
            const colIndex2 = data2.columns.indexOf(columnName);
            
            if (colIndex1 === -1 || colIndex2 === -1) {
                return { error: `列 ${columnName} 在一个或两个数据集中不存在` };
            }
            
            // 提取数值
            const values1 = data1.rows
                .map(row => row[colIndex1])
                .filter(val => val !== null && val !== undefined)
                .map(val => typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val))
                .filter(val => !isNaN(val));
                
            const values2 = data2.rows
                .map(row => row[colIndex2])
                .filter(val => val !== null && val !== undefined)
                .map(val => typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : parseFloat(val))
                .filter(val => !isNaN(val));
            
            if (values1.length === 0 || values2.length === 0) {
                return { error: `列 ${columnName} 没有有效的数值数据` };
            }
            
            // 计算基本统计量
            const stats1 = this.calculateBasicStats(values1);
            const stats2 = this.calculateBasicStats(values2);
            
            // 计算差异
            result.differences = {
                mean: {
                    value1: stats1.mean,
                    value2: stats2.mean,
                    absoluteDiff: stats2.mean - stats1.mean,
                    percentageDiff: stats1.mean !== 0 ? ((stats2.mean - stats1.mean) / stats1.mean) * 100 : null
                },
                median: {
                    value1: stats1.median,
                    value2: stats2.median,
                    absoluteDiff: stats2.median - stats1.median,
                    percentageDiff: stats1.median !== 0 ? ((stats2.median - stats1.median) / stats1.median) * 100 : null
                },
                min: {
                    value1: stats1.min,
                    value2: stats2.min,
                    absoluteDiff: stats2.min - stats1.min,
                    percentageDiff: stats1.min !== 0 ? ((stats2.min - stats1.min) / stats1.min) * 100 : null
                },
                max: {
                    value1: stats1.max,
                    value2: stats2.max,
                    absoluteDiff: stats2.max - stats1.max,
                    percentageDiff: stats1.max !== 0 ? ((stats2.max - stats1.max) / stats1.max) * 100 : null
                },
                stdDev: {
                    value1: stats1.stdDev,
                    value2: stats2.stdDev,
                    absoluteDiff: stats2.stdDev - stats1.stdDev,
                    percentageDiff: stats1.stdDev !== 0 ? ((stats2.stdDev - stats1.stdDev) / stats1.stdDev) * 100 : null
                }
            };
            
            return result;
        },
        
        // 比较两个数据集的分类分布
        compareCategoricalDistribution: function(data1, data2, columnName) {
            const result = {
                column: columnName,
                categories: {},
                differences: []
            };
            
            // 获取两个数据集中的列索引
            const colIndex1 = data1.columns.indexOf(columnName);
            const colIndex2 = data2.columns.indexOf(columnName);
            
            if (colIndex1 === -1 || colIndex2 === -1) {
                return { error: `列 ${columnName} 在一个或两个数据集中不存在` };
            }
            
            // 提取分类值
            const values1 = data1.rows.map(row => String(row[colIndex1]));
            const values2 = data2.rows.map(row => String(row[colIndex2]));
            
            // 计算分类分布
            const dist1 = this.calculateCategoricalDistribution(values1);
            const dist2 = this.calculateCategoricalDistribution(values2);
            
            // 合并所有类别
            const allCategories = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
            
            // 计算每个类别的差异
            allCategories.forEach(category => {
                const freq1 = dist1[category] || 0;
                const freq2 = dist2[category] || 0;
                const percentageDiff = freq1 !== 0 ? ((freq2 - freq1) / freq1) * 100 : null;
                
                result.categories[category] = {
                    frequency1: freq1,
                    frequency2: freq2,
                    absoluteDiff: freq2 - freq1,
                    percentageDiff: percentageDiff
                };
                
                result.differences.push({
                    category: category,
                    frequency1: freq1,
                    frequency2: freq2,
                    absoluteDiff: freq2 - freq1,
                    percentageDiff: percentageDiff
                });
            });
            
            // 按差异大小排序
            result.differences.sort((a, b) => Math.abs(b.absoluteDiff) - Math.abs(a.absoluteDiff));
            
            return result;
        },
        
        // 计算基本统计量
        calculateBasicStats: function(values) {
            if (!values || values.length === 0) return {};
            
            values.sort((a, b) => a - b);
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / values.length;
            const min = values[0];
            const max = values[values.length - 1];
            
            // 计算中位数
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
        
        // 计算分类分布
        calculateCategoricalDistribution: function(values) {
            const distribution = {};
            
            values.forEach(val => {
                if (val === null || val === undefined) val = '(空值)';
                distribution[val] = (distribution[val] || 0) + 1;
            });
            
            return distribution;
        }
    },
    
    // 数据分析报表生成规则
    reportRules: {
        // 生成数据概览报表
        generateOverviewReport: function(data) {
            if (!data || !data.columns || !data.rows) {
                return '<p>无有效数据</p>';
            }
            
            const rowCount = data.rows.length;
            const columnCount = data.columns.length;
            
            // 检查缺失值
            const missingValueCheck = DataAnalysisRules.qualityRules.checkMissingValues(data);
            const missingValuePercentage = rowCount > 0 ? 
                (missingValueCheck.totalMissingValues / (rowCount * columnCount) * 100).toFixed(2) : 0;
            
            // 生成HTML报表
            let html = '<div class="report-section">'
                + '<h3><i class="fas fa-table"></i> 数据概览</h3>'
                + '<div class="stat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + rowCount + '</div>'
                + '<div class="stat-label">行数</div>'
                + '</div>'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + columnCount + '</div>'
                + '<div class="stat-label">列数</div>'
                + '</div>'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + missingValuePercentage + '%</div>'
                + '<div class="stat-label">缺失值比例</div>'
                + '</div>'
                + '</div>';
            
            // 列类型分析
            html += '<div style="margin-top: 20px;">'
                + '<h4>列类型分析</h4>'
                + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                + '<thead style="background: #f8f9fa;">'
                + '<tr>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">列名</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">数据类型</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">非空值数</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">唯一值数</th>'
                + '</tr>'
                + '</thead><tbody>';
            
            // 分析每一列
            data.columns.forEach((column, colIndex) => {
                // 提取列值
                const colValues = data.rows.map(row => row[colIndex])
                    .filter(val => val !== null && val !== undefined && val !== '');
                
                // 计算唯一值
                const uniqueValues = new Set(colValues);
                
                // 确定数据类型
                let dataType = '文本';
                if (DataAnalysisRules.typeDetection.isNumeric(colValues)) {
                    dataType = '数值';
                } else if (DataAnalysisRules.typeDetection.isDate(colValues)) {
                    dataType = '日期';
                } else if (DataAnalysisRules.typeDetection.isCategorical(colValues)) {
                    dataType = '分类';
                }
                
                html += '<tr>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + column + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + dataType + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + colValues.length + ' (' 
                    + (rowCount > 0 ? (colValues.length / rowCount * 100).toFixed(1) : 0) + '%)</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + uniqueValues.size + ' (' 
                    + (colValues.length > 0 ? (uniqueValues.size / colValues.length * 100).toFixed(1) : 0) + '%)</td>'
                    + '</tr>';
            });
            
            html += '</tbody></table></div></div>';
            
            return html;
        },
        
        // 生成数据比较报表
        generateComparisonReport: function(data1, data2) {
            if (!data1 || !data2 || !data1.columns || !data2.columns || !data1.rows || !data2.rows) {
                return '<p>无有效数据进行比较</p>';
            }
            
            // 基本信息比较
            let html = '<div class="report-section">'
                + '<h3><i class="fas fa-balance-scale"></i> 数据集比较</h3>'
                + '<div class="stat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + data1.rows.length + '</div>'
                + '<div class="stat-label">数据集1行数</div>'
                + '</div>'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + data2.rows.length + '</div>'
                + '<div class="stat-label">数据集2行数</div>'
                + '</div>';
            
            // 计算共同列
            const commonColumns = data1.columns.filter(col => data2.columns.includes(col));
            
            html += '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + commonColumns.length + '</div>'
                + '<div class="stat-label">共同列数</div>'
                + '</div>'
                + '</div>';
            
            // 如果有共同列，进行详细比较
            if (commonColumns.length > 0) {
                html += '<div style="margin-top: 20px;">'
                    + '<h4>共同列比较</h4>'
                    + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                    + '<thead style="background: #f8f9fa;">'
                    + '<tr>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">列名</th>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">数据集1</th>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">数据集2</th>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">差异</th>'
                    + '</tr>'
                    + '</thead><tbody>';
                
                // 分析每个共同列
                commonColumns.forEach(column => {
                    const colIndex1 = data1.columns.indexOf(column);
                    const colIndex2 = data2.columns.indexOf(column);
                    
                    // 提取列值
                    const colValues1 = data1.rows.map(row => row[colIndex1])
                        .filter(val => val !== null && val !== undefined && val !== '');
                    const colValues2 = data2.rows.map(row => row[colIndex2])
                        .filter(val => val !== null && val !== undefined && val !== '');
                    
                    // 确定数据类型
                    const isNumeric1 = DataAnalysisRules.typeDetection.isNumeric(colValues1);
                    const isNumeric2 = DataAnalysisRules.typeDetection.isNumeric(colValues2);
                    
                    let comparisonText = '';
                    let diffClass = '';
                    
                    // 如果两个数据集的列都是数值型，进行统计比较
                    if (isNumeric1 && isNumeric2) {
                        const comparison = DataAnalysisRules.comparisonRules.compareStatistics(data1, data2, column);
                        if (!comparison.error) {
                            const meanDiff = comparison.differences.mean.percentageDiff;
                            if (meanDiff !== null) {
                                const diffSign = meanDiff > 0 ? '+' : '';
                                comparisonText = `平均值差异: ${diffSign}${meanDiff.toFixed(2)}%`;
                                diffClass = Math.abs(meanDiff) > 10 ? 'significant-diff' : '';
                            }
                        }
                    } else {
                        // 对于非数值型列，比较唯一值数量
                        const uniqueValues1 = new Set(colValues1).size;
                        const uniqueValues2 = new Set(colValues2).size;
                        const uniqueDiff = uniqueValues2 - uniqueValues1;
                        const diffSign = uniqueDiff > 0 ? '+' : '';
                        comparisonText = `唯一值数量差异: ${diffSign}${uniqueDiff}`;
                        diffClass = Math.abs(uniqueDiff) > Math.max(uniqueValues1, uniqueValues2) * 0.2 ? 'significant-diff' : '';
                    }
                    
                    html += '<tr class="' + diffClass + '">'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + column + '</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + colValues1.length + ' 值</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + colValues2.length + ' 值</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + comparisonText + '</td>'
                        + '</tr>';
                });
                
                html += '</tbody></table></div>';
            }
            
            html += '</div>';
            
            return html;
        }
    }
};

// 确保在浏览器环境中将规则引擎暴露为全局对象
if (typeof window !== 'undefined') {
    window.DataAnalysisRules = DataAnalysisRules;
}