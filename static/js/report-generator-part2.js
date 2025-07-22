/**
 * 数据分析报表生成器 - 第二部分
 */

// 扩展ReportGenerator对象
Object.assign(ReportGenerator, {
    // 生成数据质量报表
    generateQualityReport: function(data) {
        if (!data || !data.columns || !data.rows || data.rows.length === 0) {
            return '';
        }
        
        // 检查数据质量
        const qualityCheck = DataAnalysisRules.qualityRules.checkMissingValues(data);
        
        let html = '<div class="report-section">'
            + '<h3><i class="fas fa-check-circle"></i> 数据质量分析</h3>';
        
        // 数据完整性概览
        const totalCells = data.rows.length * data.columns.length;
        const completenessPercentage = totalCells > 0 ? 
            ((totalCells - qualityCheck.totalMissingValues) / totalCells * 100).toFixed(2) : 100;
        
        html += '<div class="quality-summary" style="margin-bottom: 20px;">'
            + '<h4>数据完整性</h4>'
            + '<div class="progress-bar" style="background: #eee; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 5px;">'
            + '<div style="background: ' + (completenessPercentage > 90 ? '#4caf50' : completenessPercentage > 70 ? '#ff9800' : '#f44336') 
            + '; height: 100%; width: ' + completenessPercentage + '%"></div>'
            + '</div>'
            + '<div style="display: flex; justify-content: space-between;">'
            + '<span>完整性: ' + completenessPercentage + '%</span>'
            + '<span>缺失值: ' + qualityCheck.totalMissingValues + ' / ' + totalCells + '</span>'
            + '</div>'
            + '</div>';
        
        // 如果有缺失值，显示详细信息
        if (qualityCheck.hasMissingValues) {
            html += '<div class="missing-values-detail">'
                + '<h4>缺失值详情</h4>'
                + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                + '<thead style="background: #f8f9fa;">'
                + '<tr>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">列名</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">缺失值数量</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">缺失比例</th>'
                + '</tr>'
                + '</thead><tbody>';
            
            qualityCheck.missingValueColumns.forEach(column => {
                const missingCount = qualityCheck.missingValueCounts[column];
                const missingPercentage = (missingCount / data.rows.length * 100).toFixed(2);
                
                html += '<tr>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + column + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + missingCount + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + missingPercentage + '%</td>'
                    + '</tr>';
            });
            
            html += '</tbody></table></div>';
        } else {
            html += '<p><i class="fas fa-check-circle" style="color: #4caf50;"></i> 数据完整，无缺失值</p>';
        }
        
        html += '</div>';
        return html;
    },
    
    // 生成分布分析报表
    generateDistributionReport: function(data) {
        if (!data || !data.columns || !data.rows || data.rows.length === 0) {
            return '';
        }
        
        let html = '<div class="report-section">'
            + '<h3><i class="fas fa-chart-bar"></i> 分布分析</h3>';
        
        // 查找分类型列
        const categoricalColumns = [];
        data.columns.forEach((column, colIndex) => {
            const colValues = data.rows.map(row => row[colIndex])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (DataAnalysisRules.typeDetection.isCategorical(colValues)) {
                categoricalColumns.push({
                    name: column,
                    index: colIndex
                });
            }
        });
        
        if (categoricalColumns.length === 0) {
            html += '<p>未发现适合分布分析的分类型列</p>';
        } else {
            // 为每个分类列生成分布分析
            categoricalColumns.forEach(column => {
                const colValues = data.rows.map(row => row[column.index])
                    .filter(val => val !== null && val !== undefined && val !== '');
                
                // 计算分类分布
                const distribution = {};
                colValues.forEach(val => {
                    distribution[val] = (distribution[val] || 0) + 1;
                });
                
                // 转换为数组并排序
                const distArray = Object.entries(distribution)
                    .map(([category, count]) => ({
                        category,
                        count,
                        percentage: (count / colValues.length * 100).toFixed(2)
                    }))
                    .sort((a, b) => b.count - a.count);
                
                // 只显示前10个类别
                const topCategories = distArray.slice(0, 10);
                
                html += '<div class="distribution-analysis" style="margin-bottom: 20px;">'
                    + '<h4>' + column.name + ' 分布</h4>'
                    + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                    + '<thead style="background: #f8f9fa;">'
                    + '<tr>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">类别</th>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">计数</th>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">比例</th>'
                    + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">分布图</th>'
                    + '</tr>'
                    + '</thead><tbody>';
                
                topCategories.forEach(item => {
                    html += '<tr>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + item.category + '</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + item.count + '</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + item.percentage + '%</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">'
                        + '<div style="background: #2196f3; height: 20px; width: ' + item.percentage + '%; min-width: 2px;"></div>'
                        + '</td>'
                        + '</tr>';
                });
                
                html += '</tbody></table></div>';
            });
        }
        
        html += '</div>';
        return html;
    },
    
    // 生成异常值分析报表
    generateOutliersReport: function(data) {
        if (!data || !data.columns || !data.rows || data.rows.length === 0) {
            return '';
        }
        
        let html = '<div class="report-section">'
            + '<h3><i class="fas fa-exclamation-triangle"></i> 异常值分析</h3>';
        
        // 查找数值型列
        const numericColumns = [];
        data.columns.forEach((column, colIndex) => {
            const colValues = data.rows.map(row => row[colIndex])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (DataAnalysisRules.typeDetection.isNumeric(colValues)) {
                numericColumns.push({
                    name: column,
                    index: colIndex
                });
            }
        });
        
        if (numericColumns.length === 0) {
            html += '<p>未发现数值型列，无法进行异常值分析</p>';
        } else {
            let hasOutliers = false;
            
            // 为每个数值列检测异常值
            numericColumns.forEach(column => {
                const outlierCheck = DataAnalysisRules.qualityRules.checkOutliers(data, column.index);
                
                if (outlierCheck.hasOutliers) {
                    hasOutliers = true;
                    
                    html += '<div class="outlier-analysis" style="margin-bottom: 20px;">'
                        + '<h4>' + column.name + ' 异常值</h4>'
                        + '<p>发现 ' + outlierCheck.outliers.length + ' 个异常值</p>'
                        + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                        + '<thead style="background: #f8f9fa;">'
                        + '<tr>'
                        + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">行索引</th>'
                        + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">值</th>'
                        + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">类型</th>'
                        + '</tr>'
                        + '</thead><tbody>';
                    
                    // 只显示前10个异常值
                    const topOutliers = outlierCheck.outliers.slice(0, 10);
                    
                    topOutliers.forEach(outlier => {
                        html += '<tr>'
                            + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + outlier.rowIndex + '</td>'
                            + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + outlier.value + '</td>'
                            + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' 
                            + (outlier.isLow ? '低于正常范围' : '高于正常范围') + '</td>'
                            + '</tr>';
                    });
                    
                    html += '</tbody></table></div>';
                }
            });
            
            if (!hasOutliers) {
                html += '<p><i class="fas fa-check-circle" style="color: #4caf50;"></i> 未发现显著异常值</p>';
            }
        }
        
        html += '</div>';
        return html;
    },
    
    // 生成洞察和建议
    generateInsightsAndRecommendations: function(data) {
        if (!data || !data.columns || !data.rows || data.rows.length === 0) {
            return '';
        }
        
        let html = '<div class="report-section">'
            + '<h3><i class="fas fa-lightbulb"></i> 洞察与建议</h3>'
            + '<div class="insights-list">';
        
        // 数据质量洞察
        const qualityCheck = DataAnalysisRules.qualityRules.checkMissingValues(data);
        if (qualityCheck.hasMissingValues) {
            const missingPercentage = (qualityCheck.totalMissingValues / (data.rows.length * data.columns.length) * 100).toFixed(2);
            
            html += '<div class="insight-item" style="padding: 10px; margin-bottom: 10px; '
                + (missingPercentage > 20 ? 'background: #fff3e0; border-left: 4px solid #ff9800;' : 'background: #e3f2fd; border-left: 4px solid #2196f3;')
                + '">'
                + '<strong>数据完整性:</strong> 数据集存在 ' + missingPercentage + '% 的缺失值'
                + (missingPercentage > 20 ? '，建议在分析前处理缺失数据' : '')
                + '</div>';
        }
        
        // 异常值洞察
        let totalOutliers = 0;
        data.columns.forEach((column, colIndex) => {
            const colValues = data.rows.map(row => row[colIndex])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (DataAnalysisRules.typeDetection.isNumeric(colValues)) {
                const outlierCheck = DataAnalysisRules.qualityRules.checkOutliers(data, colIndex);
                if (outlierCheck.hasOutliers) {
                    totalOutliers += outlierCheck.outliers.length;
                }
            }
        });
        
        if (totalOutliers > 0) {
            html += '<div class="insight-item" style="padding: 10px; margin-bottom: 10px; background: #fff3e0; border-left: 4px solid #ff9800;">'
                + '<strong>异常值:</strong> 发现 ' + totalOutliers + ' 个异常值，建议检查数据收集过程或考虑异常值处理'
                + '</div>';
        }
        
        // 分布洞察
        data.columns.forEach((column, colIndex) => {
            const colValues = data.rows.map(row => row[colIndex])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (DataAnalysisRules.typeDetection.isCategorical(colValues)) {
                // 计算分类分布
                const distribution = {};
                colValues.forEach(val => {
                    distribution[val] = (distribution[val] || 0) + 1;
                });
                
                // 检查是否有主导类别
                const entries = Object.entries(distribution);
                if (entries.length > 0) {
                    entries.sort((a, b) => b[1] - a[1]);
                    const [topCategory, topCount] = entries[0];
                    const topPercentage = (topCount / colValues.length * 100).toFixed(2);
                    
                    if (topPercentage > 80) {
                        html += '<div class="insight-item" style="padding: 10px; margin-bottom: 10px; background: #e8f5e9; border-left: 4px solid #4caf50;">'
                            + '<strong>' + column + ':</strong> 类别 "' + topCategory + '" 占比 ' + topPercentage 
                            + '%，存在明显的主导类别'
                            + '</div>';
                    }
                }
            }
        });
        
        html += '</div></div>';
        return html;
    },
    
    // 生成数据集比较报表
    generateComparisonReport: function(data1, data2) {
        return DataAnalysisRules.reportRules.generateComparisonReport(data1, data2);
    }
});

// 确保在浏览器环境中将报表生成器暴露为全局对象
if (typeof window !== 'undefined') {
    window.ReportGenerator = ReportGenerator;
}