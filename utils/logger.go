package utils

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

// SetupLogger 初始化日志系统
func SetupLogger() {
	// 创建log目录
	logDir := "log"
	if _, err := os.Stat(logDir); os.IsNotExist(err) {
		err := os.MkdirAll(logDir, 0755)
		if err != nil {
			log.Printf("无法创建日志目录: %v", err)
		}
	}

	// 创建日志文件，使用当前日期作为文件名
	logFileName := filepath.Join(logDir, time.Now().Format("2006-01-02")+".log")
	logFile, err := os.OpenFile(logFileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Printf("无法创建日志文件: %v", err)
		return
	}

	// 同时输出到控制台和文件
	mw := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(mw)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("日志系统初始化完成")
}