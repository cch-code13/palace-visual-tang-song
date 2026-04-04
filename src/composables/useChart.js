import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

/**
 * 图表通用逻辑
 * @param {string} selector - 图表容器选择器
 * @param {Function} optionFn - 图表配置函数
 * @param {Object} data - 图表数据
 * @returns {Object} 图表相关方法和属性
 */
export function useChart(selector, optionFn, data = {}) {
  const chartRef = ref(null)
  let chartInstance = null
  let resizeObserver = null
  
  // 初始化图表
  const initChart = () => {
    if (chartRef.value) {
      // 销毁现有实例
      if (chartInstance) {
        chartInstance.dispose()
      }
      
      // 创建新实例
      chartInstance = echarts.init(chartRef.value)
      
      // 生成配置并设置
      const option = optionFn(data)
      chartInstance.setOption(option)
      
      // 监听窗口大小变化
      resizeObserver = new ResizeObserver(() => {
        chartInstance.resize()
      })
      resizeObserver.observe(chartRef.value)
    }
  }
  
  // 刷新图表
  const refreshChart = () => {
    if (chartInstance) {
      const option = optionFn(data)
      chartInstance.setOption(option, true)
    }
  }
  
  // 销毁图表
  const destroyChart = () => {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }
  
  // 监听数据变化
  watch(
    () => data,
    () => {
      refreshChart()
    },
    { deep: true }
  )
  
  // 生命周期钩子
  onMounted(() => {
    initChart()
  })
  
  onUnmounted(() => {
    destroyChart()
  })
  
  return {
    chartRef,
    chartInstance,
    initChart,
    refreshChart,
    destroyChart
  }
}

/**
 * 图表全屏功能
 * @param {Object} chartInstance - 图表实例
 * @returns {Function} 切换全屏的方法
 */
export function useFullscreen(chartInstance) {
  const toggleFullscreen = () => {
    if (!chartInstance.value) return
    
    const container = chartInstance.value.getDom()
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`全屏请求错误: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }
  
  return {
    toggleFullscreen
  }
}

/**
 * 图表缩放功能
 * @param {Object} chartInstance - 图表实例
 * @returns {Object} 缩放相关方法
 */
export function useZoom(chartInstance) {
  const zoomIn = () => {
    if (!chartInstance.value) return
    chartInstance.value.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 80
    })
  }
  
  const zoomOut = () => {
    if (!chartInstance.value) return
    chartInstance.value.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100
    })
  }
  
  return {
    zoomIn,
    zoomOut
  }
}

/**
 * 图表图例切换功能
 * @param {Object} chartInstance - 图表实例
 * @returns {Function} 切换图例的方法
 */
export function useLegendToggle(chartInstance) {
  const toggleLegend = () => {
    if (!chartInstance.value) return
    
    const option = chartInstance.value.getOption()
    const legend = option.legend || []
    
    if (legend.length > 0) {
      const newLegend = legend.map(item => ({
        ...item,
        show: !item.show
      }))
      
      chartInstance.value.setOption({
        legend: newLegend
      })
    }
  }
  
  return {
    toggleLegend
  }
}