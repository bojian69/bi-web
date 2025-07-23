/**
 * 表格样式强制覆盖
 * 这个脚本确保所有表格标题使用黑色字体，即使有内联样式
 */

document.addEventListener('DOMContentLoaded', function() {
  // 处理所有表头
  const tableHeaders = document.querySelectorAll('th');
  tableHeaders.forEach(header => {
    // 移除可能的内联颜色样式
    header.style.removeProperty('color');
    // 强制设置黑色
    header.style.setProperty('color', '#000000', 'important');
    
    // 如果背景色是深色，则改为浅色
    const computedStyle = window.getComputedStyle(header);
    const backgroundColor = computedStyle.backgroundColor;
    
    // 简单检测是否为深色背景
    if (isDarkColor(backgroundColor)) {
      header.style.setProperty('background-color', '#f8f9fa', 'important');
    }
  });
  
  // 处理所有表格单元格
  const tableCells = document.querySelectorAll('td');
  tableCells.forEach(cell => {
    // 移除可能的内联颜色样式
    cell.style.removeProperty('color');
    // 强制设置黑色
    cell.style.setProperty('color', '#000000', 'important');
  });
  
  // 处理特定的表头容器
  const tableHeads = document.querySelectorAll('thead[style*="background"]');
  tableHeads.forEach(thead => {
    thead.style.setProperty('background', '#f8f9fa', 'important');
  });
});

/**
 * 简单判断颜色是否为深色
 * @param {string} color - CSS颜色值
 * @return {boolean} 是否为深色
 */
function isDarkColor(color) {
  // 处理rgba格式
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      const r = parseInt(rgbValues[0]);
      const g = parseInt(rgbValues[1]);
      const b = parseInt(rgbValues[2]);
      
      // 计算亮度 (简化版)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128; // 小于128认为是深色
    }
  }
  
  // 处理十六进制和其他格式
  // 这里简化处理，只检测常见的深色背景
  const darkColors = ['#2c3e50', '#34495e', '#2980b9', '#8e44ad', '#2c3e50', 
                      '#7f8c8d', '#16a085', '#27ae60', '#2980b9', '#8e44ad', 
                      '#2c3e50', '#f39c12', '#d35400', '#c0392b', '#bdc3c7'];
  
  return darkColors.some(darkColor => color.includes(darkColor));
}