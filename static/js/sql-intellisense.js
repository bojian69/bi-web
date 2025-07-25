/**
 * SQL智能提示和语法增强
 * 为SQL编辑器提供智能提示、语法检查、格式化等功能
 */

class SQLIntelliSense {
    constructor() {
        this.keywords = [
            // 基础关键字
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
            'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE',
            
            // JOIN相关
            'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN',
            'CROSS JOIN', 'NATURAL JOIN', 'ON', 'USING',
            
            // 条件和操作符
            'AND', 'OR', 'NOT', 'IN', 'NOT IN', 'EXISTS', 'NOT EXISTS',
            'BETWEEN', 'LIKE', 'ILIKE', 'REGEXP', 'IS', 'IS NOT', 'NULL',
            
            // 聚合函数
            'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT', 'ALL',
            
            // 数据类型
            'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
            'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
            'CHAR', 'VARCHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
            'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
            'BOOLEAN', 'BOOL', 'BINARY', 'VARBINARY', 'BLOB',
            
            // 其他关键字
            'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
            'WITH', 'RECURSIVE', 'CTE'
        ];
        
        this.functions = [
            // 字符串函数
            'CONCAT', 'SUBSTRING', 'LENGTH', 'CHAR_LENGTH', 'UPPER', 'LOWER',
            'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'LEFT', 'RIGHT',
            
            // 数学函数
            'ABS', 'CEIL', 'CEILING', 'FLOOR', 'ROUND', 'SQRT', 'POWER',
            'MOD', 'RAND', 'RANDOM',
            
            // 日期函数
            'NOW', 'CURDATE', 'CURTIME', 'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY',
            'HOUR', 'MINUTE', 'SECOND', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF',
            
            // 条件函数
            'IF', 'IFNULL', 'NULLIF', 'COALESCE',
            
            // 窗口函数
            'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD',
            'FIRST_VALUE', 'LAST_VALUE'
        ];
        
        this.commonTables = [
            'users', 'orders', 'products', 'customers', 'employees',
            'departments', 'categories', 'inventory', 'sales', 'transactions'
        ];
        
        this.commonColumns = [
            'id', 'name', 'email', 'password', 'created_at', 'updated_at',
            'status', 'type', 'amount', 'quantity', 'price', 'description',
            'user_id', 'order_id', 'product_id', 'category_id'
        ];
        
        this.snippets = this.initializeSnippets();
    }
    
    initializeSnippets() {
        return [
            {
                label: 'select-basic',
                description: '基础SELECT查询',
                insertText: 'SELECT ${1:columns}\nFROM ${2:table}\nWHERE ${3:condition};',
                detail: 'SELECT语句模板'
            },
            {
                label: 'select-join',
                description: 'JOIN查询',
                insertText: 'SELECT ${1:t1.column}, ${2:t2.column}\nFROM ${3:table1} t1\nJOIN ${4:table2} t2 ON ${5:t1.id = t2.foreign_id}\nWHERE ${6:condition};',
                detail: 'JOIN查询模板'
            },
            {
                label: 'select-group',
                description: 'GROUP BY查询',
                insertText: 'SELECT ${1:column}, ${2:COUNT(*)}\nFROM ${3:table}\nGROUP BY ${4:column}\nHAVING ${5:condition}\nORDER BY ${6:column};',
                detail: 'GROUP BY查询模板'
            },
            {
                label: 'select-window',
                description: '窗口函数查询',
                insertText: 'SELECT ${1:column},\n       ${2:ROW_NUMBER()} OVER (${3:PARTITION BY column ORDER BY column}) as rn\nFROM ${4:table};',
                detail: '窗口函数模板'
            },
            {
                label: 'insert-basic',
                description: '基础INSERT语句',
                insertText: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});',
                detail: 'INSERT语句模板'
            },
            {
                label: 'update-basic',
                description: '基础UPDATE语句',
                insertText: 'UPDATE ${1:table}\nSET ${2:column = value}\nWHERE ${3:condition};',
                detail: 'UPDATE语句模板'
            },
            {
                label: 'delete-basic',
                description: '基础DELETE语句',
                insertText: 'DELETE FROM ${1:table}\nWHERE ${2:condition};',
                detail: 'DELETE语句模板'
            },
            {
                label: 'create-table',
                description: '创建表',
                insertText: 'CREATE TABLE ${1:table_name} (\n    ${2:id} INT PRIMARY KEY AUTO_INCREMENT,\n    ${3:column_name} ${4:data_type},\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);',
                detail: 'CREATE TABLE模板'
            }
        ];
    }
    
    // 获取智能提示建议
    getCompletionItems(text, position) {
        const suggestions = [];
        const currentWord = this.getCurrentWord(text, position);
        const context = this.getContext(text, position);
        
        // 根据上下文提供不同的建议
        if (context.expectingTableName) {
            suggestions.push(...this.getTableSuggestions(currentWord));
        } else if (context.expectingColumnName) {
            suggestions.push(...this.getColumnSuggestions(currentWord));
        } else if (context.expectingFunction) {
            suggestions.push(...this.getFunctionSuggestions(currentWord));
        } else {
            // 默认建议：关键字、函数、代码片段
            suggestions.push(...this.getKeywordSuggestions(currentWord));
            suggestions.push(...this.getFunctionSuggestions(currentWord));
            suggestions.push(...this.getSnippetSuggestions(currentWord));
        }
        
        return suggestions.filter(item => 
            item.label.toLowerCase().includes(currentWord.toLowerCase())
        );
    }
    
    getCurrentWord(text, position) {
        const lines = text.split('\n');
        const currentLine = lines[position.line] || '';
        const beforeCursor = currentLine.substring(0, position.column);
        
        // 匹配当前单词
        const match = beforeCursor.match(/\w+$/);
        return match ? match[0] : '';
    }
    
    getContext(text, position) {
        const beforeText = this.getTextBeforePosition(text, position).toUpperCase();
        
        return {
            expectingTableName: /\bFROM\s*$|\bJOIN\s*$|\bINTO\s*$|\bUPDATE\s*$/.test(beforeText),
            expectingColumnName: /\bSELECT\s*$|\bSELECT\s+[\w,\s]*,\s*$|\bGROUP\s+BY\s*$|\bORDER\s+BY\s*$/.test(beforeText),
            expectingFunction: /\(\s*$/.test(beforeText),
            inWhereClause: /\bWHERE\b/.test(beforeText),
            inSelectClause: /\bSELECT\b/.test(beforeText) && !/\bFROM\b/.test(beforeText)
        };
    }
    
    getTextBeforePosition(text, position) {
        const lines = text.split('\n');
        let result = '';
        
        for (let i = 0; i < position.line; i++) {
            result += lines[i] + '\n';
        }
        
        if (lines[position.line]) {
            result += lines[position.line].substring(0, position.column);
        }
        
        return result;
    }
    
    getKeywordSuggestions(currentWord) {
        return this.keywords.map(keyword => ({
            label: keyword,
            kind: 'keyword',
            insertText: keyword,
            detail: 'SQL关键字',
            sortText: '1' + keyword
        }));
    }
    
    getFunctionSuggestions(currentWord) {
        return this.functions.map(func => ({
            label: func,
            kind: 'function',
            insertText: func + '(${1})',
            detail: 'SQL函数',
            sortText: '2' + func
        }));
    }
    
    getTableSuggestions(currentWord) {
        return this.commonTables.map(table => ({
            label: table,
            kind: 'table',
            insertText: table,
            detail: '表名',
            sortText: '3' + table
        }));
    }
    
    getColumnSuggestions(currentWord) {
        return this.commonColumns.map(column => ({
            label: column,
            kind: 'column',
            insertText: column,
            detail: '列名',
            sortText: '4' + column
        }));
    }
    
    getSnippetSuggestions(currentWord) {
        return this.snippets.map(snippet => ({
            label: snippet.label,
            kind: 'snippet',
            insertText: snippet.insertText,
            detail: snippet.detail,
            description: snippet.description,
            sortText: '5' + snippet.label
        }));
    }
    
    // SQL语法验证
    validateSQL(sql) {
        const errors = [];
        const lines = sql.split('\n');
        
        lines.forEach((line, lineIndex) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('--')) return;
            
            // 检查常见语法错误
            const lineErrors = this.validateLine(trimmed, lineIndex + 1);
            errors.push(...lineErrors);
        });
        
        return errors;
    }
    
    validateLine(line, lineNumber) {
        const errors = [];
        
        // 检查未闭合的引号
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        const backticks = (line.match(/`/g) || []).length;
        
        if (singleQuotes % 2 !== 0) {
            errors.push({
                line: lineNumber,
                column: line.lastIndexOf("'") + 1,
                message: '未闭合的单引号',
                severity: 'error'
            });
        }
        
        if (doubleQuotes % 2 !== 0) {
            errors.push({
                line: lineNumber,
                column: line.lastIndexOf('"') + 1,
                message: '未闭合的双引号',
                severity: 'error'
            });
        }
        
        if (backticks % 2 !== 0) {
            errors.push({
                line: lineNumber,
                column: line.lastIndexOf('`') + 1,
                message: '未闭合的反引号',
                severity: 'error'
            });
        }
        
        // 检查未闭合的括号
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        
        if (openParens !== closeParens) {
            errors.push({
                line: lineNumber,
                column: line.length,
                message: '括号不匹配',
                severity: 'warning'
            });
        }
        
        // 检查常见的SQL错误模式
        if (/SELECT.*FROM.*WHERE.*GROUP BY.*WHERE/i.test(line)) {
            errors.push({
                line: lineNumber,
                column: 1,
                message: 'WHERE子句不能出现在GROUP BY之后',
                severity: 'error'
            });
        }
        
        return errors;
    }
    
    // SQL格式化
    formatSQL(sql) {
        let formatted = sql;
        
        // 基础格式化规则
        const rules = [
            // 关键字大写
            { pattern: /\b(select|from|where|group by|order by|having|join|inner join|left join|right join|union|insert|update|delete|create|alter|drop)\b/gi, replacement: (match) => match.toUpperCase() },
            
            // 在主要关键字前添加换行
            { pattern: /\s+(FROM|WHERE|GROUP BY|ORDER BY|HAVING|UNION)\s+/gi, replacement: '\n$1 ' },
            
            // JOIN语句换行
            { pattern: /\s+((?:INNER|LEFT|RIGHT|FULL OUTER)?\s*JOIN)\s+/gi, replacement: '\n$1 ' },
            
            // 逗号后换行（在SELECT子句中）
            { pattern: /,\s*(?=\w)/g, replacement: ',\n    ' },
            
            // 清理多余的空白
            { pattern: /\s+/g, replacement: ' ' },
            
            // 清理行首空白
            { pattern: /^\s+/gm, replacement: '' },
            
            // 为子查询添加缩进
            { pattern: /\(\s*SELECT/gi, replacement: '(\n    SELECT' },
            { pattern: /\)\s*$/gm, replacement: '\n)' }
        ];
        
        rules.forEach(rule => {
            formatted = formatted.replace(rule.pattern, rule.replacement);
        });
        
        // 添加适当的缩进
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const indentedLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // 减少缩进
            if (/^\)/.test(trimmed) || /^(END|ELSE)\b/i.test(trimmed)) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const indented = '    '.repeat(indentLevel) + trimmed;
            
            // 增加缩进
            if (/\($/.test(trimmed) || /^(CASE|WHEN|ELSE)\b/i.test(trimmed)) {
                indentLevel++;
            }
            
            return indented;
        });
        
        return indentedLines.join('\n').trim();
    }
    
    // 获取SQL查询的统计信息
    getQueryStats(sql) {
        const stats = {
            lines: sql.split('\n').length,
            characters: sql.length,
            words: sql.split(/\s+/).filter(word => word.length > 0).length,
            tables: this.extractTables(sql),
            columns: this.extractColumns(sql),
            complexity: this.calculateComplexity(sql)
        };
        
        return stats;
    }
    
    extractTables(sql) {
        const tables = new Set();
        const upperSQL = sql.toUpperCase();
        
        // 匹配FROM和JOIN后的表名
        const tablePatterns = [
            /FROM\s+(\w+)/gi,
            /JOIN\s+(\w+)/gi,
            /UPDATE\s+(\w+)/gi,
            /INTO\s+(\w+)/gi
        ];
        
        tablePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(sql)) !== null) {
                tables.add(match[1].toLowerCase());
            }
        });
        
        return Array.from(tables);
    }
    
    extractColumns(sql) {
        const columns = new Set();
        
        // 简单的列名提取（可以进一步改进）
        const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
        if (selectMatch) {
            const selectClause = selectMatch[1];
            const columnMatches = selectClause.split(',');
            
            columnMatches.forEach(col => {
                const trimmed = col.trim();
                const columnName = trimmed.split(/\s+/)[0].replace(/[`"']/g, '');
                if (columnName && columnName !== '*') {
                    columns.add(columnName.toLowerCase());
                }
            });
        }
        
        return Array.from(columns);
    }
    
    calculateComplexity(sql) {
        let complexity = 0;
        const upperSQL = sql.toUpperCase();
        
        // 基于不同的SQL特性计算复杂度
        complexity += (upperSQL.match(/JOIN/g) || []).length * 2;
        complexity += (upperSQL.match(/SUBQUERY|\(/g) || []).length * 3;
        complexity += (upperSQL.match(/UNION/g) || []).length * 2;
        complexity += (upperSQL.match(/GROUP BY/g) || []).length * 1;
        complexity += (upperSQL.match(/ORDER BY/g) || []).length * 1;
        complexity += (upperSQL.match(/HAVING/g) || []).length * 2;
        complexity += (upperSQL.match(/CASE/g) || []).length * 2;
        
        if (complexity <= 5) return 'simple';
        if (complexity <= 15) return 'medium';
        return 'complex';
    }
}

// 全局SQL智能提示实例
window.sqlIntelliSense = new SQLIntelliSense();