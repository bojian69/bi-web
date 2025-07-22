/**
 * 备用数据分析器 - 当主数据分析器加载失败时使用
 */

// 创建全局DataAnalyzer对象
window.DataAnalyzer = {
    dimensions: {
        // 基础分析
        overview: { name: '数据概览', description: '分析数据的基本结构和特征', icon: 'fas fa-table', category: '基础分析' },
        statistics: { name: '统计分析', description: '计算数值型数据的统计量', icon: 'fas fa-calculator', category: '基础分析' },
        quality: { name: '数据质量分析', description: '检查数据的完整性和一致性', icon: 'fas fa-check-circle', category: '基础分析' },
        
        // 高级分析
        distribution: { name: '分布分析', description: '分析数据的分布情况和偏态', icon: 'fas fa-chart-bar', category: '高级分析' },
        outliers: { name: '异常值检测', description: '检测数据中的异常值和离群点', icon: 'fas fa-exclamation-triangle', category: '高级分析' },
        correlation: { name: '相关性分析', description: '分析不同列之间的相关关系', icon: 'fas fa-project-diagram', category: '高级分析' },
        
        // 智能分析
        insights: { name: '自动洞察', description: '自动发现数据中的重要特征和模式', icon: 'fas fa-lightbulb', category: '智能分析' },
        trends: { name: '趋势分析', description: '分析数据的变化趋势和规律', icon: 'fas fa-chart-line', category: '智能分析' },
        patterns: { name: '模式识别', description: '识别数据中的重复模式和规律', icon: 'fas fa-puzzle-piece', category: '智能分析' },
        
        // 业务维度
        business_impact: { name: '业务影响分析', description: '分析数据对业务的影响和意义', icon: 'fas fa-briefcase', category: '业务维度' },
        time_series: { name: '时间序列分析', description: '分析数据随时间的变化规律', icon: 'fas fa-clock', category: '业务维度' },
        segmentation: { name: '数据分类分析', description: '根据不同维度对数据进行分类和分组', icon: 'fas fa-layer-group', category: '业务维度' }
    },
    analyzeData: function(data, selectedDimensions) {
        try {
            if (!data || !data.columns || !data.rows || data.rows.length === 0) {
                return { success: false, message: '没有可分析的数据' };
            }
            
            // 简化的分析逻辑
            const analysis = {
                metadata: {
                    columnCount: data.columns.length,
                    rowCount: data.rows.length,
                    timestamp: new Date().toISOString(),
                    analyzedDimensions: selectedDimensions || Object.keys(this.dimensions)
                },
                columns: {},
                insights: []
            };
            
            // 添加基本列信息
            data.columns.forEach(function(column, index) {
                analysis.columns[column] = {
                    type: 'unknown',
                    insights: []
                };
            });
            
            return { success: true, analysis: analysis };
        } catch (error) {
            console.error('分析数据错误:', error);
            return { success: false, message: '分析数据时发生错误: ' + error.message };
        }
    },
    compareDatasets: function(data1, data2) {
        try {
            if (!data1 || !data2 || !data1.columns || !data2.columns || !data1.rows || !data2.rows) {
                return { success: false, message: '没有可比较的数据' };
            }
            
            const comparison = {
                metadata: {
                    dataset1: { columnCount: data1.columns.length, rowCount: data1.rows.length },
                    dataset2: { columnCount: data2.columns.length, rowCount: data2.rows.length }
                },
                commonColumns: [],
                differences: [],
                insights: []
            };
            
            // 找出共同的列
            for (var i = 0; i < data1.columns.length; i++) {
                if (data2.columns.indexOf(data1.columns[i]) >= 0) {
                    comparison.commonColumns.push(data1.columns[i]);
                }
            }
            
            return { success: true, comparison: comparison };
        } catch (error) {
            console.error('比较数据集错误:', error);
            return { success: false, message: '比较数据集时发生错误: ' + error.message };
        }
    },
    generateReportHTML: function(analysis) {
        if (!analysis) return '<p>没有可用的分析数据</p>';
        
        var selectedDimensions = analysis.metadata.analyzedDimensions || [];
        var html = '';
        
        // 创建导航菜单
        html += '<div class="report-nav" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">'
            + '<strong>快速导航: </strong>';
            
        // 按类别分组维度
        var categories = {};
        for (var dimKey in this.dimensions) {
            if (selectedDimensions.includes(dimKey)) {
                var category = this.dimensions[dimKey].category || '其他';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(dimKey);
            }
        }
        
        // 生成导航菜单
        for (var category in categories) {
            html += '<span style="margin-right: 15px; font-weight: bold;">' + category + ': </span>';
            categories[category].forEach(function(dimKey) {
                html += '<a href="#section-' + dimKey + '" style="margin-right: 10px; text-decoration: none;">' 
                    + '<i class="' + (this.dimensions[dimKey].icon || 'fas fa-chart-bar') + '"></i> '
                    + this.dimensions[dimKey].name + '</a>';
            }.bind(this));
            html += '<br>';
        }
        html += '</div>';
        
        // 数据概览部分
        if (selectedDimensions.includes('overview')) {
            html += '<div id="section-overview" class="report-section">'
                + '<h3><i class="fas fa-table"></i> 数据概览</h3>'
                + '<div class="stat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + analysis.metadata.rowCount + '</div>'
                + '<div class="stat-label">行数</div>'
                + '</div>'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + analysis.metadata.columnCount + '</div>'
                + '<div class="stat-label">列数</div>'
                + '</div>'
                + '<div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">'
                + '<div class="stat-value" style="font-size: 24px; font-weight: bold;">' + (analysis.metadata.timestamp ? new Date(analysis.metadata.timestamp).toLocaleString() : '-') + '</div>'
                + '<div class="stat-label">分析时间</div>'
                + '</div>'
                + '</div>'
                + '</div>';
        }
        
        // 统计分析部分
        if (selectedDimensions.includes('statistics')) {
            html += '<div id="section-statistics" class="report-section">'
                + '<h3><i class="fas fa-calculator"></i> 统计分析</h3>'
                + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                + '<thead style="background: #f8f9fa;">'
                + '<tr>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">列名</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">类型</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">统计信息</th>'
                + '</tr>'
                + '</thead>'
                + '<tbody>';
            
            for (var column in analysis.columns) {
                if (analysis.columns.hasOwnProperty(column)) {
                    var colInfo = analysis.columns[column];
                    html += '<tr>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + column + '</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + colInfo.type + '</td>'
                        + '<td style="padding: 8px; border-bottom: 1px solid #eee;">';
                    
                    if (colInfo.stats) {
                        html += '<ul style="margin: 0; padding-left: 20px;">'
                            + '<li>平均值: ' + (colInfo.stats.mean ? colInfo.stats.mean.toFixed(2) : '-') + '</li>'
                            + '<li>中位数: ' + (colInfo.stats.median ? colInfo.stats.median.toFixed(2) : '-') + '</li>'
                            + '<li>最小值: ' + (colInfo.stats.min ? colInfo.stats.min.toFixed(2) : '-') + '</li>'
                            + '<li>最大值: ' + (colInfo.stats.max ? colInfo.stats.max.toFixed(2) : '-') + '</li>'
                            + '</ul>';
                    } else {
                        html += '-';
                    }
                    
                    html += '</td></tr>';
                }
            }
            
            html += '</tbody></table></div>';
        }
        
        // 数据质量分析
        if (selectedDimensions.includes('quality') && analysis.completeness) {
            html += '<div id="section-quality" class="report-section">'
                + '<h3><i class="fas fa-check-circle"></i> 数据质量分析</h3>'
                + '<div class="quality-summary" style="margin-bottom: 15px;">'
                + '<div class="progress-bar" style="background: #eee; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 5px;">'
                + '<div style="background: ' + (analysis.completeness.overallCompleteness > 90 ? '#4caf50' : analysis.completeness.overallCompleteness > 70 ? '#ff9800' : '#f44336') + '; height: 100%; width: ' + analysis.completeness.overallCompleteness + '%;"></div>'
                + '</div>'
                + '<div style="display: flex; justify-content: space-between;">'
                + '<span>数据完整性: ' + analysis.completeness.overallCompleteness.toFixed(2) + '%</span>'
                + '<span>缺失值数量: ' + analysis.completeness.missingCells + '</span>'
                + '</div>'
                + '</div>'
                + '</div>';
        }
        
        // 分布分析
        if (selectedDimensions.includes('distribution')) {
            html += '<div id="section-distribution" class="report-section">'
                + '<h3><i class="fas fa-chart-bar"></i> 分布分析</h3>'
                + '<p>数据分布分析可视化将在图表区域显示</p>'
                + '</div>';
        }
        
        // 异常值检测
        if (selectedDimensions.includes('outliers')) {
            html += '<div id="section-outliers" class="report-section">'
                + '<h3><i class="fas fa-exclamation-triangle"></i> 异常值检测</h3>';
            
            var hasOutliers = false;
            for (var column in analysis.columns) {
                if (analysis.columns[column].outliers && analysis.columns[column].outliers.length > 0) {
                    hasOutliers = true;
                    break;
                }
            }
            
            if (hasOutliers) {
                html += '<div class="outliers-summary">'
                    + '<p>发现异常值，请查看详细分析报告</p>'
                    + '</div>';
            } else {
                html += '<p>未发现显著异常值</p>';
            }
            
            html += '</div>';
        }
        
        // 相关性分析
        if (selectedDimensions.includes('correlation') && analysis.correlations && analysis.correlations.length > 0) {
            html += '<div id="section-correlation" class="report-section">'
                + '<h3><i class="fas fa-project-diagram"></i> 相关性分析</h3>'
                + '<table class="analysis-table" style="width: 100%; border-collapse: collapse;">'
                + '<thead style="background: #f8f9fa;">'
                + '<tr>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">列名1</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">列名2</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">相关系数</th>'
                + '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">关系类型</th>'
                + '</tr>'
                + '</thead><tbody>';
                
            analysis.correlations.forEach(function(corr) {
                var strengthColor = '';
                if (Math.abs(corr.coefficient) > 0.7) {
                    strengthColor = '#4caf50'; // 强相关性
                } else if (Math.abs(corr.coefficient) > 0.3) {
                    strengthColor = '#ff9800'; // 中等相关性
                } else {
                    strengthColor = '#f44336'; // 弱相关性
                }
                
                html += '<tr>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + corr.columns[0] + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + corr.columns[1] + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee; color: ' + strengthColor + ';">' + corr.coefficient.toFixed(4) + '</td>'
                    + '<td style="padding: 8px; border-bottom: 1px solid #eee;">' + corr.direction + ' (' + corr.strength + ')</td>'
                    + '</tr>';
            });
            
            html += '</tbody></table></div>';
        }
        
        // 自动洞察
        if (selectedDimensions.includes('insights') && analysis.insights && analysis.insights.length > 0) {
            html += '<div id="section-insights" class="report-section">'
                + '<h3><i class="fas fa-lightbulb"></i> 自动洞察</h3>'
                + '<div class="insights-list">';
                
            analysis.insights.forEach(function(insight) {
                var typeClass = '';
                if (insight.type === 'warning') {
                    typeClass = 'background: #fff3e0; border-left: 4px solid #ff9800;';
                } else if (insight.type === 'positive') {
                    typeClass = 'background: #e8f5e9; border-left: 4px solid #4caf50;';
                } else {
                    typeClass = 'background: #e3f2fd; border-left: 4px solid #2196f3;';
                }
                
                html += '<div class="insight-item" style="padding: 10px; margin-bottom: 10px; ' + typeClass + '">'
                    + '<strong>' + insight.column + ':</strong> ' + insight.message
                    + '</div>';
            });
            
            html += '</div></div>';
        }
        
        // 趋势分析
        if (selectedDimensions.includes('trends')) {
            html += '<div id="section-trends" class="report-section">'
                + '<h3><i class="fas fa-chart-line"></i> 趋势分析</h3>'
                + '<p>数据趋势分析功能将在后续版本中提供</p>'
                + '</div>';
        }
        
        // 模式识别
        if (selectedDimensions.includes('patterns')) {
            html += '<div id="section-patterns" class="report-section">'
                + '<h3><i class="fas fa-puzzle-piece"></i> 模式识别</h3>'
                + '<p>数据模式识别功能将在后续版本中提供</p>'
                + '</div>';
        }
        
        // 业务影响分析
        if (selectedDimensions.includes('business_impact')) {
            html += '<div id="section-business_impact" class="report-section">'
                + '<h3><i class="fas fa-briefcase"></i> 业务影响分析</h3>'
                + '<p>业务影响分析功能将在后续版本中提供</p>'
                + '</div>';
        }
        
        // 时间序列分析
        if (selectedDimensions.includes('time_series')) {
            html += '<div id="section-time_series" class="report-section">'
                + '<h3><i class="fas fa-clock"></i> 时间序列分析</h3>'
                + '<p>时间序列分析功能将在后续版本中提供</p>'
                + '</div>';
        }
        
        // 数据分类分析
        if (selectedDimensions.includes('segmentation')) {
            html += '<div id="section-segmentation" class="report-section">'
                + '<h3><i class="fas fa-layer-group"></i> 数据分类分析</h3>'
                + '<p>数据分类分析功能将在后续版本中提供</p>'
                + '</div>';
        }
        
        return html;
    },
    generateComparisonReportHTML: function(comparison) {
        if (!comparison) return '<p>没有可用的比较数据</p>';
        
        var html = '<div class="report-section">'
            + '<h3>数据集比较概览</h3>'
            + '<div class="stat-grid">'
            + '<div class="stat-card">'
            + '<div class="stat-value">' + comparison.metadata.dataset1.rowCount + '</div>'
            + '<div class="stat-label">数据集1行数</div>'
            + '</div>'
            + '<div class="stat-card">'
            + '<div class="stat-value">' + comparison.metadata.dataset2.rowCount + '</div>'
            + '<div class="stat-label">数据集2行数</div>'
            + '</div>'
            + '<div class="stat-card">'
            + '<div class="stat-value">' + comparison.commonColumns.length + '</div>'
            + '<div class="stat-label">共同列数</div>'
            + '</div>'
            + '</div>'
            + '</div>';
        
        return html;
    }
};