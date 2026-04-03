<template>
  <div class="comparison-container">
    <!-- 对比表格 -->
    <el-table
      :data="comparisonData"
      style="width: 100%"
      :header-cell-style="headerStyle"
      :cell-style="cellStyle"
      v-loading="loading"
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
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 操作按钮 -->
    <div class="comparison-actions">
      <el-button type="primary" @click="exportComparison" :icon="Download">
        导出对比结果
      </el-button>
      <el-button @click="clearComparison" :icon="Delete">
        清空对比
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Download, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePalaceStore } from '@/stores/palace'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear', 'export'])

const store = usePalaceStore()

const palaces = computed(() => store.comparisonPalaces)

// 生成对比数据
const comparisonData = computed(() => {
  if (palaces.value.length < 2) return []
  
  const [p1, p2] = palaces.value
  
  return [
    { attribute: '宫殿名称', palace1: p1.name, palace2: p2.name },
    { attribute: '朝代', palace1: p1.dynasty, palace2: p2.dynasty },
    { attribute: '地点', palace1: p1.location, palace2: p2.location },
    { attribute: '建造年份', palace1: p1.buildYear, palace2: p2.buildYear },
    { attribute: '建筑面积', palace1: p1.area, palace2: p2.area },
    { attribute: '面阔/开间', palace1: p1.dimensions || '无', palace2: p2.dimensions || '无' },
    { attribute: '屋顶样式', palace1: p1.roofStyle || '无', palace2: p2.roofStyle || '无' },
    { attribute: '保存状态', palace1: p1.preservationStatus || '无', palace2: p2.preservationStatus || '无' },
    { attribute: '所属帝王', palace1: p1.associatedEmperor || '无', palace2: p2.associatedEmperor || '无' },
    { attribute: '文化等级', palace1: p1.culturalLevel || '无', palace2: p2.culturalLevel || '无' },
    { attribute: '主要建筑', palace1: p1.mainHall || '无', palace2: p2.mainHall || '无' },
    { attribute: '相关诗句', palace1: p1.relatedPoem || '无', palace2: p2.relatedPoem || '无' }
  ]
})

// 表格头部样式
const headerStyle = () => ({
  background: 'var(--el-color-primary-light-9)',
  color: 'var(--el-color-primary)',
  fontWeight: 'bold'
})

// 单元格样式
const cellStyle = () => ({
  padding: '12px 0'
})

// 获取数值样式类
const getValueClass = (row, index) => {
  const value = row[`palace${index + 1}`]
  if (value === '无') return 'value-empty'
  if (row.attribute === '建筑面积') {
    // 比较建筑面积
    const otherValue = row[`palace${index === 0 ? 2 : 1}`]
    if (otherValue !== '无') {
      const area1 = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
      const area2 = parseFloat(otherValue.replace(/[^0-9.]/g, '')) || 0
      if (area1 > area2) return 'value-highlight'
    }
  }
  return ''
}

// 导出对比结果
const exportComparison = () => {
  if (palaces.value.length < 2) {
    ElMessage.warning('请至少选择两座宫殿进行对比')
    return
  }
  
  // 生成CSV内容
  const headers = ['对比项', palaces.value[0].name, palaces.value[1].name]
  const rows = comparisonData.value.map(row => [
    row.attribute,
    row.palace1,
    row.palace2
  ])
  
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
  
  ElMessage.success('导出成功')
  emit('export')
}

// 清空对比
const clearComparison = () => {
  store.clearComparison()
  ElMessage.success('已清空对比列表')
  emit('clear')
}
</script>

<style scoped>
.comparison-container {
  padding: 20px;
}

.comparison-actions {
  margin-top: 20px;
  text-align: center;
}

.value-empty {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.value-highlight {
  color: var(--el-color-success);
  font-weight: bold;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
