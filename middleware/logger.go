package middleware

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware 日志中间件
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// 记录请求信息
		log.Printf("开始请求: %s %s", r.Method, r.URL.Path)
		
		// 调用下一个处理器
		next.ServeHTTP(w, r)
		
		// 记录请求处理时间
		log.Printf("完成请求: %s %s, 耗时: %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// RecoveryMiddleware 恢复中间件，处理panic
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("发生panic: %v", err)
				
				// 检查是否是API请求
				if r.URL.Path == "/api/query" || r.URL.Path == "/api/merge" {
					// 对于API请求，返回JSON格式的错误
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					w.Write([]byte(`{"error": "服务器内部错误"}`))  
				} else {
					// 对于其他请求，返回标准错误页面
					http.Error(w, "服务器内部错误", http.StatusInternalServerError)
				}
			}
		}()
		
		// 使用自定义ResponseWriter捕获状态码
		crw := &statusCapturingResponseWriter{w, http.StatusOK}
		next.ServeHTTP(crw, r)
	})
}

// statusCapturingResponseWriter 捕获状态码的ResponseWriter
type statusCapturingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (crw *statusCapturingResponseWriter) WriteHeader(code int) {
	crw.statusCode = code
	crw.ResponseWriter.WriteHeader(code)
}