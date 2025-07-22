package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"bi-web/api"
	"bi-web/config"
	"bi-web/db"
	"bi-web/frontend"
	"bi-web/middleware"
	"bi-web/utils"
)

func main() {
	// 设置日志
	utils.SetupLogger()
	
	// 加载配置
	cfg := config.LoadConfig()
	log.Printf("加载配置: %+v", cfg)
	
	// 连接数据库
	if err := db.Connect(cfg); err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 创建路由
	mux := http.NewServeMux()
	
	// 注册路由
	mux.HandleFunc("/", frontend.IndexHandler)
	mux.HandleFunc("/api/query", api.QueryHandler)
	mux.HandleFunc("/api/merge", api.MergeHandler)
	
	// 静态文件服务
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	
	// 应用中间件
	handler := middleware.LoggingMiddleware(
		middleware.RecoveryMiddleware(
			middleware.VisualizationMiddleware(mux),
		),
	)
	
	// 创建服务器
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: handler,
	}
	
	// 优雅关闭
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	
	// 启动服务器
	log.Printf("服务启动在端口 %s", cfg.Port)
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务器启动失败: %v", err)
		}
	}()
	
	// 等待中断信号
	<-c
	log.Println("正在关闭服务器...")
	
	// 创建上下文，设置关闭超时
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	// 优雅关闭服务器
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("服务器关闭失败: %v", err)
	}
	
	log.Println("服务器已关闭")
}