<script setup>
import { mapData } from '@/assets'
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import palaces from '@/data/data.palaces.json'

const emit = defineEmits(['palaceClick']);
const charts = ref(null)
let myChart = null

// 获取当前主题
const getCurrentTheme = () => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// 获取主题对应的文字颜色
const getTextColor = () => {
  return getCurrentTheme() === 'dark' ? '#ffffff' : '#5A2D18';
};

// 获取主题对应的边框颜色
const getBorderColor = () => {
  return getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536';
};

// 获取主题对应的背景颜色
const getBackgroundColor = () => {
  return getCurrentTheme() === 'dark' ? '#121212' : '#ffffff';
};

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
  
  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        initChart()
      }
    })
  })
  
  observer.observe(document.documentElement, {
    attributes: true
  })
  
  // 保存observer引用以便在卸载时清理
  window.themeObserverSongMap = observer
})

onUnmounted(() => {
  if (myChart) {
    try {
      myChart.dispose()
    } catch (e) {
      // 忽略已被销毁的实例
    }
  }
  window.removeEventListener('resize', handleResize)
  
  // 清理主题变化监听器
  if (window.themeObserverSongMap) {
    window.themeObserverSongMap.disconnect()
    delete window.themeObserverSongMap
  }
})

const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

const initChart = () => {
  if (!charts.value) return
  
  // 如果图表已存在，先销毁旧实例
    if (myChart) {
      try {
        myChart.dispose()
      } catch (e) {
        // 忽略已被销毁的实例
      }
      myChart = null
    }
  
  myChart = echarts.init(charts.value)
  //注册地图名
  echarts.registerMap("chinaMap", mapData)
  
  // 筛选宋代宫殿
  const songPalaces = palaces.filter(palace => palace.dynasty === '宋代')
  
  // 转换为ECharts数据格式
  const seriesData = songPalaces.map(palace => {
    // 提取面积数值，去除单位
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, ''))
    return {
      name: palace.location, // 使用完整的位置名称
      value: [palace.lng, palace.lat, 1, areaValue || 0, palace.name]
    }
  })
  
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const backgroundColor = getBackgroundColor();
  
  const options = {
    title: {
      text: '宋代宫殿地理分布',
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        fontSize: 16
      }
    },
    graphic: [
      {
        type: 'text',
        left: 'right',
        bottom: '5',
        style: {
          text: '地图来源：天地图・标准地图服务（审图号：GS (2023) 2767 号）',
          fontSize: 10,
          fill: '#e6b422'
        }
      }
    ],

    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const isDark = getCurrentTheme() === 'dark';
        return `
          <div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${borderColor}; border-radius: 8px;">
            <div style="font-weight: bold; color: #e6b422; margin-bottom: 5px;">${params.name}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">朝代：宋代</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">宫殿名称：${params.value[4]}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建筑面积：${params.value[3].toFixed(1)} 万平方米</div>
            <div style="color: #e6b422; margin-top: 5px; font-size: 12px;">点击可查看宫殿详情</div>
          </div>
        `
      },
      backgroundColor: 'transparent'
    },
    geo: {
      type: "map",
      map: "chinaMap",
      roam: true,
      center: [114.0, 33.0], // 中原和江南过渡地区中心坐标，覆盖河南和浙江
      zoom: 4.5, // 适当缩放，同时显示河南和浙江
      scaleLimit: {
        min: 3,
        max: 10
      },
      itemStyle: {
        areaColor: backgroundColor, // 动态背景色
        borderColor: borderColor, // 动态边框颜色
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: getCurrentTheme() === 'dark' ? '#2a2a2a' : '#f5f5f5',
          borderColor: borderColor, // 动态边框颜色
          borderWidth: 2
        },
        label: {
          show: true,
          color: textColor,
          fontFamily: 'Noto Serif SC'
        }
      },
      animation: true,
      animationDuration: 1000, // 统一动画时长
      animationEasing: 'cubicOut',
      // 移动端触摸优化
      touchDelay: 0,
      tooltip: {
        enterable: true
      }
    },
    series: [
      {
        // 设置涟漪效果的散点图
        type: "effectScatter",
        // 设置涟漪效果的配置
        rippleEffect: {
          number: 2,
          scale: 2.5,
          brushType: 'stroke',
          color: '#e6b422' // 金色涟漪
        },
        label: {
          show: true,
          color: getCurrentTheme() === 'dark' ? "#e6b422" : "#5A2D18",
          fontWeight: 'bold',
          backgroundColor: getCurrentTheme() === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
          borderColor: borderColor,
          borderWidth: 1,
          formatter: function (params) {
            return params.name
          },
          position: 'right',
          offset: [10, 0]
        },
        itemStyle: {
          color: '#c44536' // 深红色点
        },
        data: seriesData,
        coordinateSystem: "geo",
        symbolSize: function(val) {
          return Math.max(15, val[2] * 2) // 根据宫殿数量动态调整大小
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  }
  
  myChart.setOption(options)
  
  // 添加地图点击事件
  myChart.on('click', function(params) {
    if (params.componentType === 'series' && params.seriesType === 'effectScatter') {
      const location = params.name
      const palaceName = params.value[4]
      // 查找对应的宫殿数据
      const palace = songPalaces.find(p => p.location === location && p.name === palaceName)
      
      if (palace) {
        // 触发palaceClick事件
        emit('palaceClick', palace);
      }
    }
  })
}
</script>
<template>
  <div ref="charts" class="echartsBox"></div>
</template>
<style scoped>
.echartsBox {
  width: 100%;
  height: 100%;
}
</style>