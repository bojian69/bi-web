package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// MergeRequest 合并查询请求结构
type MergeRequest struct {
	Queries []map[string]interface{} `json:"queries"`
}

// MergeHandler 处理合并查询请求
func MergeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "只支持POST请求", http.StatusMethodNotAllowed)
		return
	}

	var req MergeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "请求格式错误: "+err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("合并查询: %d 个查询结果", len(req.Queries))
	
	// 处理合并逻辑
	result := mergeResults(req.Queries)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// 合并查询结果
func mergeResults(queries []map[string]interface{}) map[string]interface{} {
	if len(queries) == 0 {
		return map[string]interface{}{
			"error": "没有可合并的查询结果",
		}
	}

	// 收集所有标签（第一列）
	allLabels := make(map[string]bool)
	for _, query := range queries {
		rows, ok := query["rows"].([]interface{})
		if !ok || len(rows) == 0 {
			continue
		}
		
		for _, rowInterface := range rows {
			row, ok := rowInterface.([]interface{})
			if !ok || len(row) == 0 {
				continue
			}
			
			label := fmt.Sprintf("%v", row[0])
			allLabels[label] = true
		}
	}

	// 准备合并结果
	mergedColumns := []string{"标签"}
	for i, query := range queries {
		columns, ok := query["columns"].([]interface{})
		if ok && len(columns) > 1 {
			mergedColumns = append(mergedColumns, fmt.Sprintf("%v", columns[1]))
		} else {
			mergedColumns = append(mergedColumns, fmt.Sprintf("查询 %d", i+1))
		}
	}

	// 构建合并行数据
	var mergedRows [][]interface{}
	for label := range allLabels {
		row := []interface{}{label}
		
		for _, query := range queries {
			value := findValueForLabel(query, label)
			row = append(row, value)
		}
		
		mergedRows = append(mergedRows, row)
	}

	return map[string]interface{}{
		"columns":            mergedColumns,
		"rows":               mergedRows,
		"visualizationTypes": []string{"table", "bar", "line"},
		"merged":             true,
	}
}

// 查找标签对应的值
func findValueForLabel(query map[string]interface{}, label string) interface{} {
	rows, ok := query["rows"].([]interface{})
	if !ok {
		return nil
	}
	
	for _, rowInterface := range rows {
		row, ok := rowInterface.([]interface{})
		if !ok || len(row) == 0 {
			continue
		}
		
		rowLabel := fmt.Sprintf("%v", row[0])
		if rowLabel == label && len(row) > 1 {
			return row[1]
		}
	}
	
	return nil
}