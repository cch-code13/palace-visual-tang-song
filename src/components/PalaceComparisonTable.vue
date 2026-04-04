<template>
  <div class="comparison-container">
    <!-- 对比表格 -->
    <el-table
      :data="comparisonData"
      style="width: 100%"
      :header-cell-style="headerStyle"
      :cell-style="cellStyle"
      v-loading="loading"
      border
    >
      <el-table-column
        prop="attribute"
        label="对比项"
        width="180"
        fixed
      />
      <el-table-column
        v-for="(palace, index) in palaces"
        :key="palace.id"
        :label="palace.name"
        min-width="200"
      >
        <template #default="{ row }">
          <div :class="getValueClass(row, index)">
            {{ row[`palace${index + 1}`] }}
            <div v-if="getDifferenceInfo(row, index)" class="difference-info">
              {{ getDifferenceInfo(row, index) }}
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 操作按钮 -->
    <div class="comparison-actions">
      <el-button type="primary" @click="showExportMenu" :icon="Download">
        导出对比结果
      </el-button>
      <el-button @click="clearComparison" :icon="Delete">
        清空对比
      </el-button>
      <el-button @click="refreshComparison" :icon="Refresh">
        刷新数据
      </el-button>
    </div>

    <!-- 导出菜单 -->
    <el-dropdown-menu v-if="exportMenuVisible" ref="exportMenuRef" class="export-menu">
      <el-dropdown-item @click="exportAsCSV">
        <el-icon><Download /></el-icon>
        导出为CSV
      </el-dropdown-item>
      <el-dropdown-item @click="exportAsPDF">
        <el-icon><Document /></el-icon>
        导出为PDF
      </el-dropdown-item>
      <el-dropdown-item @click="exportAsImage">
        <el-icon><Picture /></el-icon>
        导出为图片
      </el-dropdown-item>
    </el-dropdown-menu>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Download, Delete, Refresh, Document, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus'
import { usePalaceStore } from '@/stores/palace'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear', 'export', 'refresh'])

const store = usePalaceStore()
const exportMenuRef = ref(null)
const exportMenuVisible = ref(false)

const palaces = computed(() => store.comparisonPalaces)

// 生成对比数据
const comparisonData = computed(() => {
  if (palaces.value.length < 2) return []
  
  const data = [
    { attribute: '宫殿名称' },
    { attribute: '朝代' },
    { attribute: '地点' },
    { attribute: '建造年份' },
    { attribute: '建筑面积' },
    { attribute: '面阔/开间' },
    { attribute: '屋顶样式' },
    { attribute: '保存状态' },
    { attribute: '所属帝王' },
    { attribute: '文化等级' },
    { attribute: '主要建筑' },
    { attribute: '相关诗句' }
  ]
  
  // 为每个宫殿添加数据
  palaces.value.forEach((palace, index) => {
    data.forEach(item => {
      switch (item.attribute) {
        case '宫殿名称':
          item[`palace${index + 1}`] = palace.name
          break
        case '朝代':
          item[`palace${index + 1}`] = palace.dynasty
          break
        case '地点':
          item[`palace${index + 1}`] = palace.location
          break
        case '建造年份':
          item[`palace${index + 1}`] = palace.buildYear
          break
        case '建筑面积':
          item[`palace${index + 1}`] = palace.area
          break
        case '面阔/开间':
          item[`palace${index + 1}`] = palace.dimensions || '无'
          break
        case '屋顶样式':
          item[`palace${index + 1}`] = palace.roofStyle || '无'
          break
        case '保存状态':
          item[`palace${index + 1}`] = palace.preservationStatus || '无'
          break
        case '所属帝王':
          item[`palace${index + 1}`] = palace.associatedEmperor || '无'
          break
        case '文化等级':
          item[`palace${index + 1}`] = palace.culturalLevel || '无'
          break
        case '主要建筑':
          item[`palace${index + 1}`] = palace.mainHall || '无'
          break
        case '相关诗句':
          item[`palace${index + 1}`] = palace.relatedPoem || '无'
          break
      }
    })
  })
  
  return data
})

// 表格头部样式
const headerStyle = () => ({
  background: 'linear-gradient(135deg, rgba(196, 69, 54, 0.1) 0%, rgba(230, 180, 34, 0.1) 100%)',
  color: 'var(--text-primary)',
  fontWeight: 'bold',
  borderBottom: '1px solid var(--border-color)',
  fontFamily: 'Noto Serif SC, KaiTi, serif'
})

// 单元格样式
const cellStyle = () => ({
  padding: '12px',
  borderBottom: '1px solid var(--border-color)'
})

// 获取数值样式类
const getValueClass = (row, index) => {
  const value = row[`palace${index + 1}`]
  if (value === '无') return 'value-empty'
  
  // 比较数值类型的属性
  if (row.attribute === '建筑面积') {
    const values = palaces.value.map((_, i) => row[`palace${i + 1}`])
    const numbers = values.map(v => parseFloat(v.replace(/[^0-9.]/g, '')) || 0)
    const maxValue = Math.max(...numbers)
    const currentValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
    if (currentValue === maxValue && maxValue > 0) return 'value-highlight'
  }
  
  if (row.attribute === '建造年份') {
    const values = palaces.value.map((_, i) => row[`palace${i + 1}`])
    const numbers = values.map(v => parseInt(v) || 0)
    const minValue = Math.min(...numbers.filter(n => n > 0))
    const currentValue = parseInt(value) || 0
    if (currentValue === minValue && minValue > 0) return 'value-highlight'
  }
  
  return ''
}

// 获取差值信息
const getDifferenceInfo = (row, index) => {
  const value = row[`palace${index + 1}`]
  
  if (row.attribute === '建筑面积') {
    const values = palaces.value.map((_, i) => row[`palace${i + 1}`])
    const numbers = values.map(v => parseFloat(v.replace(/[^0-9.]/g, '')) || 0)
    const maxValue = Math.max(...numbers)
    const currentValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
    if (currentValue === maxValue && maxValue > 0) return '面积最大'
  }
  
  if (row.attribute === '建造年份') {
    const values = palaces.value.map((_, i) => row[`palace${i + 1}`])
    const numbers = values.map(v => parseInt(v) || 0)
    const minValue = Math.min(...numbers.filter(n => n > 0))
    const currentValue = parseInt(value) || 0
    if (currentValue === minValue && minValue > 0) return '始建最早'
  }
  
  return ''
}

// 显示导出菜单
const showExportMenu = () => {
  if (palaces.value.length < 2) {
    ElMessage.warning('请至少选择两座宫殿进行对比')
    return
  }
  exportMenuVisible.value = true
}

// 导出为CSV
const exportAsCSV = () => {
  // 生成CSV内容
  const headers = ['对比项', ...palaces.value.map(p => p.name)]
  const rows = comparisonData.value.map(row => {
    const rowData = [row.attribute]
    palaces.value.forEach((_, index) => {
      rowData.push(row[`palace${index + 1}`])
    })
    return rowData
  })
  
  const csvContent = [
    '\ufeff' + headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', '宫殿对比结果.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('导出为CSV成功')
  exportMenuVisible.value = false
  emit('export')
}

// 导出为PDF（模拟）
const exportAsPDF = () => {
  ElMessage.info('PDF导出功能开发中，敬请期待')
  exportMenuVisible.value = false
}

// 导出为图片（模拟）
const exportAsImage = () => {
  ElMessage.info('图片导出功能开发中，敬请期待')
  exportMenuVisible.value = false
}

// 清空对比
const clearComparison = () => {
  store.clearComparison()
  ElMessage.success('已清空对比列表')
  emit('clear')
}

// 刷新数据
const refreshComparison = () => {
  ElMessage.success('数据已刷新')
  emit('refresh')
}
</script>

<style scoped>
.comparison-container {
  padding: 20px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--theme-shadow);
}

.comparison-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.value-empty {
  color: var(--text-muted);
  font-style: italic;
}

.value-highlight {
  color: var(--text-accent);
  font-weight: bold;
  position: relative;
}

.value-highlight::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--text-accent), transparent);
  animation: highlight 1.5s ease-in-out infinite;
}

@keyframes highlight {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.difference-info {
  font-size: 12px;
  color: var(--text-accent-alt);
  margin-top: 4px;
  font-weight: normal;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background: var(--card-bg);
}

:deep(.el-table th) {
  font-family: 'Noto Serif SC', 'KaiTi', serif;
}

:deep(.el-table td) {
  transition: all 0.3s ease;
}

:deep(.el-table tr:hover td) {
  background: rgba(230, 180, 34, 0.1) !important;
}

.export-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  z-index: 1000;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .comparison-container {
    padding: 10px;
  }
  
  .comparison-actions {
    flex-direction: column;
    align-items: center;
  }
  
  :deep(.el-table) {
    font-size: 14px;
  }
  
  :deep(.el-table th) {
    padding: 8px;
  }
  
  :deep(.el-table td) {
    padding: 8px;
  }
}
</style>
