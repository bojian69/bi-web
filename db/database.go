package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"bi-web/config"
	_ "github.com/go-sql-driver/mysql"
)

// DB 全局数据库连接
var DB *sql.DB

// Connect 连接到数据库
func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	
	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("数据库连接失败: %w", err)
	}

	// 测试连接
	if err = DB.Ping(); err != nil {
		log.Printf("数据库连接测试失败: %v", err)
		log.Println("继续运行，但数据库功能可能不可用")
		// 即使连接失败，也不返回错误，但确保DB对象已初始化
	}

	// 设置连接池参数
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(time.Hour)
	DB.SetConnMaxIdleTime(30 * time.Minute)

	return nil
}

// Close 关闭数据库连接
func Close() {
	if DB != nil {
		DB.Close()
	}
}

// QueryResult 查询结果结构
type QueryResult struct {
	Columns   []string        `json:"columns"`
	Rows      [][]interface{} `json:"rows"`
	Error     string          `json:"error,omitempty"`
	Duration  string          `json:"duration,omitempty"`  // 执行耗时
	RowCount  int             `json:"rowCount,omitempty"`  // 行数
}

// ExecuteSQL 执行SQL查询
func ExecuteSQL(query string) QueryResult {
	// 记录开始时间
	startTime := time.Now()
	
	if DB == nil {
		log.Println("数据库连接为空，尝试重新连接")
		// 尝试重新连接数据库
		cfg := config.LoadConfig()
		if err := Connect(cfg); err != nil {
			return QueryResult{Error: "数据库连接失败: " + err.Error()}
		}
		
		if DB == nil {
			return QueryResult{Error: "数据库连接仍然为空"}
		}
	}

	// 测试连接是否有效
	if err := DB.Ping(); err != nil {
		log.Printf("数据库连接无效，尝试重新连接: %v", err)
		// 尝试重新连接
		cfg := config.LoadConfig()
		if err := Connect(cfg); err != nil {
			return QueryResult{Error: "数据库重连失败: " + err.Error()}
		}
	}

	rows, err := DB.Query(query)
	if err != nil {
		duration := time.Since(startTime)
		return QueryResult{Error: err.Error(), Duration: formatDuration(duration)}
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return QueryResult{Error: err.Error()}
	}

	var result [][]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return QueryResult{Error: err.Error()}
		}

		row := make([]interface{}, len(columns))
		for i, val := range values {
			if b, ok := val.([]byte); ok {
				row[i] = string(b)
			} else {
				row[i] = val
			}
		}
		result = append(result, row)
	}
	
	// 检查遍历行时是否有错误
	if err := rows.Err(); err != nil {
		duration := time.Since(startTime)
		return QueryResult{Error: "遍历结果集错误: " + err.Error(), Duration: formatDuration(duration)}
	}

	// 计算执行耗时
	duration := time.Since(startTime)
	rowCount := len(result)
	
	log.Printf("查询执行完成: 耗时 %v, 返回 %d 行数据", duration, rowCount)

	return QueryResult{
		Columns:  columns, 
		Rows:     result, 
		Duration: formatDuration(duration),
		RowCount: rowCount,
	}
}

// formatDuration 格式化时间显示
func formatDuration(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%.2fμs", float64(d.Nanoseconds())/1000)
	} else if d < time.Second {
		return fmt.Sprintf("%.2fms", float64(d.Nanoseconds())/1000000)
	} else {
		return fmt.Sprintf("%.2fs", d.Seconds())
	}
}