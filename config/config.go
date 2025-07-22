package config

import (
	"bufio"
	"log"
	"os"
	"strings"
)

// Config 应用配置结构
type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	Port       string
}

// LoadConfig 加载应用配置
func LoadConfig() *Config {
	// 先从.env文件加载配置
	loadEnvFile(".env")
	
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "test"),
		Port:       getEnv("PORT", "8081"),
	}
}

// 从.env文件加载环境变量
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		log.Printf(".env文件不存在或无法打开: %v", err)
		log.Println("将使用环境变量或默认值")
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		// 跳过空行和注释
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		// 解析键值对
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		
		// 只在环境变量未设置时设置
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}
	
	if err := scanner.Err(); err != nil {
		log.Printf("读取.env文件出错: %v", err)
	}
}

// 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}