<template>
  <div ref="chartRef" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElLoading } from 'element-plus'

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
  }
})

const emit = defineEmits(['chart-click', 'chart-hover'])

const chartRef = ref(null)
let chartInstance = null
let loadingInstance = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 如果已存在实例，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 创建新实例
  chartInstance = echarts.init(chartRef.value, props.theme)
  
  // 设置配置项
  chartInstance.setOption(props.option, true)
  
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

// 监听配置项变化
watch(() => props.option, (newOption) => {
  if (chartInstance) {
    chartInstance.setOption(newOption, true)
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
  chartInstance?.dispose()
  chartInstance = null
})

// 暴露方法给父组件
defineExpose({
  getInstance: () => chartInstance,
  resize: () => chartInstance?.resize(),
  setOption: (option) => chartInstance?.setOption(option, true),
  clear: () => chartInstance?.clear()
})
</script>

<style scoped>
/* 图表容器样式 */
div {
  min-height: 300px;
}
</style>
