<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-controls">
        <el-button 
          size="small" 
          icon="FullScreen" 
          circle 
          @click="toggleFullscreen"
          title="全屏查看"
        />
        <el-button 
          size="small" 
          icon="Refresh" 
          circle 
          @click="refreshChart"
          title="刷新数据"
        />
        <el-button 
          size="small" 
          icon="ZoomIn" 
          circle 
          @click="zoomIn"
          title="放大"
        />
        <el-button 
          size="small" 
          icon="ZoomOut" 
          circle 
          @click="zoomOut"
          title="缩小"
        />
        <el-button 
          size="small" 
          icon="Setting" 
          circle 
          @click="toggleLegend"
          title="切换图例"
        />
      </div>
    </div>
    <div ref="chartRef" :style="{ width, height }" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElLoading, ElButton, ElMessage } from 'element-plus'

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '400px'
  },
  loading: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['chart-click', 'chart-hover', 'refresh'])

const chartRef = ref(null)
let chartInstance = null
let loadingInstance = null
let isFullscreen = false
let originalSize = { width: '', height: '' }

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 如果已存在实例，先销毁
  if (chartInstance) {
    try {
      chartInstance.dispose()
    } catch (e) {
      // 忽略已被销毁的实例
    }
  }
  
  // 创建新实例
  chartInstance = echarts.init(chartRef.value, props.theme)
  
  // 设置配置项
  const option = {
    ...props.option,
    tooltip: {
      ...props.option.tooltip,
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ${item.value}`
          // 添加历史信息（如果有）
          if (item.data && item.data.historyInfo) {
            result += `<br/>${item.data.historyInfo}`
          }
          result += '<br/>'
        })
        return result
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ]
  }
  
  chartInstance.setOption(option, true)
  
  // 添加事件监听
  chartInstance.on('click', (params) => {
    emit('chart-click', params)
  })
  
  chartInstance.on('mouseover', (params) => {
    emit('chart-hover', params)
  })
  
  // 响应式
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
  chartInstance?.resize()
}

// 显示/隐藏加载状态
const toggleLoading = () => {
  if (props.loading) {
    loadingInstance = ElLoading.service({
      target: chartRef.value,
      text: '加载中...',
      background: 'rgba(255, 255, 255, 0.8)'
    })
  } else {
    loadingInstance?.close()
  }
}

// 全屏切换
const toggleFullscreen = () => {
  const container = chartRef.value
  if (!container) return
  
  if (!isFullscreen) {
    originalSize = {
      width: container.style.width,
      height: container.style.height
    }
    
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100vw'
    container.style.height = '100vh'
    container.style.zIndex = '9999'
    container.style.backgroundColor = '#fff'
    
    isFullscreen = true
  } else {
    container.style.position = ''
    container.style.top = ''
    container.style.left = ''
    container.style.width = originalSize.width
    container.style.height = originalSize.height
    container.style.zIndex = ''
    container.style.backgroundColor = ''
    
    isFullscreen = false
  }
  
  chartInstance?.resize()
}

// 刷新图表
const refreshChart = () => {
  emit('refresh')
  ElMessage.success('数据已刷新')
}

// 放大图表
const zoomIn = () => {
  if (!chartInstance) return
  
  const option = chartInstance.getOption()
  if (option.dataZoom && option.dataZoom.length > 0) {
    const dataZoom = option.dataZoom[0]
    const newEnd = Math.max(0, dataZoom.end - 20)
    chartInstance.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: newEnd
    })
  }
}

// 缩小图表
const zoomOut = () => {
  if (!chartInstance) return
  
  const option = chartInstance.getOption()
  if (option.dataZoom && option.dataZoom.length > 0) {
    const dataZoom = option.dataZoom[0]
    const newEnd = Math.min(100, dataZoom.end + 20)
    chartInstance.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: newEnd
    })
  }
}

// 切换图例显示
const toggleLegend = () => {
  if (!chartInstance) return
  
  const option = chartInstance.getOption()
  const legend = option.legend || { show: true }
  chartInstance.setOption({
    legend: {
      ...legend,
      show: !legend.show
    }
  })
}

// 监听配置项变化
watch(() => props.option, (newOption) => {
  if (chartInstance) {
    const option = {
      ...newOption,
      tooltip: {
        ...newOption.tooltip,
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params) {
          let result = params[0].name + '<br/>'
          params.forEach(item => {
            result += `${item.marker} ${item.seriesName}: ${item.value}`
            // 添加历史信息（如果有）
            if (item.data && item.data.historyInfo) {
              result += `<br/>${item.data.historyInfo}`
            }
            result += '<br/>'
          })
          return result
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100
        }
      ]
    }
    chartInstance.setOption(option, true)
  }
}, { deep: true })

// 监听加载状态
watch(() => props.loading, () => {
  toggleLoading()
})

onMounted(() => {
  nextTick(() => {
    initChart()
    toggleLoading()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  loadingInstance?.close()
  try {
    chartInstance?.dispose()
  } catch (e) {
    // 忽略已被销毁的实例
  }
  chartInstance = null
})

// 暴露方法给父组件
defineExpose({
  getInstance: () => chartInstance,
  resize: () => chartInstance?.resize(),
  setOption: (option) => chartInstance?.setOption(option, true),
  clear: () => chartInstance?.clear(),
  toggleFullscreen,
  refreshChart,
  zoomIn,
  zoomOut,
  toggleLegend
})
</script>

<style scoped>
/* 图表容器样式 */
.chart-wrapper {
  position: relative;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--theme-shadow);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, rgba(196, 69, 54, 0.1) 0%, rgba(230, 180, 34, 0.1) 100%);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Noto Serif SC', 'KaiTi', serif;
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.chart-container {
  min-height: 300px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chart-controls {
    align-self: flex-end;
  }
}
</style>
