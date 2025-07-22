package middleware

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// VisualizationMiddleware 数据可视化中间件
func VisualizationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 只处理API查询和合并请求
		if (!strings.HasPrefix(r.URL.Path, "/api/query") && !strings.HasPrefix(r.URL.Path, "/api/merge")) || r.Method != "POST" {
			next.ServeHTTP(w, r)
			return
		}

		// 创建自定义ResponseWriter来捕获输出
		crw := &captureResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
			body:           []byte{},
		}

		// 调用下一个处理器
		next.ServeHTTP(crw, r)

		// 如果不是JSON响应，直接返回原始内容
		contentType := crw.Header().Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			w.WriteHeader(crw.statusCode)
			w.Write(crw.body)
			return
		}

		// 解析查询结果
		var result map[string]interface{}
		if err := json.Unmarshal(crw.body, &result); err != nil {
			log.Printf("解析查询结果失败: %v, 原始数据: %s", err, string(crw.body))
			w.WriteHeader(crw.statusCode)
			w.Write(crw.body)
			return
		}
		
		log.Printf("可视化中间件处理数据: %+v", result)

		// 添加可视化元数据
		if result["error"] == nil || result["error"] == "" {
			// 检测数据类型，添加适合的可视化类型
			columnsRaw, hasColumns := result["columns"]
			rowsRaw, hasRows := result["rows"]
			
			log.Printf("列: %v, 行: %v", columnsRaw, rowsRaw)
			
			if hasColumns && hasRows {
				// 强制设置可视化类型以进行测试
				visualTypes := []string{"table", "bar", "line"}
				
				// 如果有两列数据，添加饼图
				// 安全地转换类型
				var columns []interface{}
				var rows []interface{}
				var ok1, ok2 bool
				
				// 处理columns
				switch c := columnsRaw.(type) {
				case []interface{}:
					columns = c
					ok1 = true
				case []string:
					columns = make([]interface{}, len(c))
					for i, v := range c {
						columns[i] = v
					}
					ok1 = true
				default:
					log.Printf("列类型转换失败: %T", columnsRaw)
				}
				
				// 处理rows
				switch r := rowsRaw.(type) {
				case []interface{}:
					rows = r
					ok2 = true
				case [][]interface{}:
					rows = make([]interface{}, len(r))
					for i, v := range r {
						rows[i] = v
					}
					ok2 = true
				default:
					log.Printf("行类型转换失败: %T", rowsRaw)
				}
				
				if ok1 && ok2 && len(columns) == 2 && len(rows) > 0 {
					visualTypes = append(visualTypes, "pie")
				}
				
				result["visualizationTypes"] = visualTypes
				log.Printf("设置可视化类型: %v", visualTypes)
			}
		}

		// 返回增强后的结果
		enhancedData, _ := json.Marshal(result)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(crw.statusCode)
		w.Write(enhancedData)
	})
}

// captureResponseWriter 捕获响应的自定义ResponseWriter
type captureResponseWriter struct {
	http.ResponseWriter
	statusCode int
	body       []byte
}

func (crw *captureResponseWriter) WriteHeader(statusCode int) {
	crw.statusCode = statusCode
}

func (crw *captureResponseWriter) Write(b []byte) (int, error) {
	crw.body = append(crw.body, b...)
	return len(b), nil
}

func (crw *captureResponseWriter) Header() http.Header {
	return crw.ResponseWriter.Header()
}

// Flush 实现http.Flusher接口
func (crw *captureResponseWriter) Flush() {
	if f, ok := crw.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}