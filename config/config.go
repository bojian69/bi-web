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
// 配置加载优先级：
// 1. 环境变量
// 2. .env 文件
// 3. 默认值
func LoadConfig() *Config {
	// 尝试从多个位置加载.env文件
	envFiles := []string{".env", "../.env", "/app/.env"}
	for _, file := range envFiles {
		if _, err := os.Stat(file); err == nil {
			log.Printf("从 %s 加载配置", file)
			loadEnvFile(file)
			break
		}
	}
	
	config := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "test"),
		Port:       getEnv("PORT", "8081"),
	}
	
	log.Printf("数据库配置: %s@%s:%s/%s", 
		config.DBUser, 
		config.DBHost, 
		config.DBPort, 
		config.DBName)
	log.Printf("应用端口: %s", config.Port)
	
	return config
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
	loadedVars := 0
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
		
		// 处理引号包裹的值
		if (strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"")) ||
		   (strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'")) {
			value = value[1 : len(value)-1]
		}
		
		// 只在环境变量未设置时设置
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
			loadedVars++
		}
	}
	
	if err := scanner.Err(); err != nil {
		log.Printf("读取.env文件出错: %v", err)
	} else if loadedVars > 0 {
		log.Printf("从 %s 成功加载了 %d 个环境变量", filename, loadedVars)
	}
}

// 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// String 返回配置的字符串表示
func (c *Config) String() string {
	return "Config{" +
		"DBHost=" + c.DBHost + ", " +
		"DBPort=" + c.DBPort + ", " +
		"DBUser=" + c.DBUser + ", " +
		"DBPassword=****" + ", " +
		"DBName=" + c.DBName + ", " +
		"Port=" + c.Port + "}"
}

// GetDSN 返回数据库连接字符串
func (c *Config) GetDSN() string {
	return c.DBUser + ":" + c.DBPassword + "@tcp(" + c.DBHost + ":" + c.DBPort + ")/" + c.DBName + "?parseTime=true&charset=utf8mb4"
}