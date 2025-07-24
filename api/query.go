package api

import (
	"encoding/json"
	"log"
	"net/http"

	"bi-web/db"
)

// QueryRequest 查询请求结构
type QueryRequest struct {
	Query string `json:"query"`
}



// QueryHandler 处理SQL查询请求
func QueryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "只支持POST请求", http.StatusMethodNotAllowed)
		return
	}

	var req QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "请求格式错误", http.StatusBadRequest)
		return
	}

	log.Printf("执行查询: %s", req.Query)
	result := db.ExecuteSQL(req.Query)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
	
	if result.Error != "" {
		log.Printf("查询错误: %s", result.Error)
	} else {
		log.Printf("查询成功: 返回 %d 行数据, 耗时: %s", len(result.Rows), result.Duration)
	}
}