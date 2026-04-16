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
  window.themeObserverMap = observer
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
  if (window.themeObserverMap) {
    window.themeObserverMap.disconnect()
    delete window.themeObserverMap
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
  
  // 筛选唐代宫殿
  const tangPalaces = palaces.filter(palace => palace.dynasty === '唐代')
  console.log('唐代宫殿数量:', tangPalaces.length)
  console.log('唐代宫殿列表:', tangPalaces.map(p => p.name))
  
  // 转换为ECharts数据格式
  const seriesData = tangPalaces.map(palace => {
    // 提取面积数值，去除单位
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
    console.log('处理宫殿:', palace.name, '坐标:', [palace.lng, palace.lat], '面积:', areaValue)
    return {
      name: palace.name, // 使用宫殿名称
      value: [palace.lng, palace.lat, areaValue, palace]
    }
  })
  console.log('最终处理的唐代宫殿数据:', seriesData)
  
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const backgroundColor = getBackgroundColor();
  
  const options = {
    title: {
      text: '唐代宫殿地理分布',
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
      },
      {
        type: 'text',
        left: 'left',
        top: '5',
        style: {
          text: '提示：可通过鼠标滚轮缩放地图查看更多宫殿',
          fontSize: 10,
          fill: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'
        }
      }
    ],

    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const isDark = getCurrentTheme() === 'dark';
        const palace = params.value[3];
        return `
          <div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${borderColor}; border-radius: 8px;">
            <div style="font-weight: bold; color: #e6b422; margin-bottom: 5px;">${palace.name}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">朝代：${palace.dynasty}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">位置：${palace.location}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建造年代：${palace.buildYear}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建筑面积：${palace.area}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">文物等级：${palace.culturalLevel}</div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(230, 180, 34, 0.3);">
              <div style="color: #e6b422; font-size: 0.9rem;">点击查看宫殿详情</div>
            </div>
          </div>
        `
      },
      backgroundColor: 'transparent'
    },
    geo: {
      type: "map",
      map: "chinaMap",
      roam: true,
      center: [109.5, 34.5], // 调整中心坐标，覆盖更多唐代宫殿分布区域
      zoom: 5.5, // 调整缩放级别，确保所有唐代宫殿都能在初始视图中显示
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
          number: 3,
          scale: 3,
          brushType: 'fill',
          color: '#e6b422', // 金色涟漪
          period: 3 // 涟漪动画周期
        },
        label: {
          show: false, // 默认不显示标签，避免地图拥挤
          color: getCurrentTheme() === 'dark' ? "#e6b422" : "#5A2D18",
          fontWeight: 'bold',
          backgroundColor: getCurrentTheme() === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
          borderColor: borderColor,
          borderWidth: 1,
          formatter: function (params) {
            return params.name
          },
          position: 'right',
          offset: [10, 0],
          animation: true,
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        },
        itemStyle: {
          color: '#c44536', // 深红色点
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(230, 180, 34, 0.8)',
          opacity: 0.8,
          borderColor: '#e6b422', // 金色边框
          borderWidth: 2 // 边框宽度
        },
        data: seriesData,
        coordinateSystem: "geo",
        symbolSize: function(val) {
          // 根据宫殿面积动态调整气泡大小，确保小面积宫殿也能显示明显
          const area = val[2];
          return Math.max(20, Math.min(45, (area / 8) + 10)) // 增加基础大小，确保小面积宫殿也能显示
        },
        animation: true,
        animationDuration: 2000,
        animationEasing: 'cubicOut',
        animationDelay: function (idx) {
          return idx * 100 // 每个点的动画延迟，创造依次出现的效果
        },
        emphasis: {
          label: {
            show: true // 鼠标悬浮时显示标签
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(230, 180, 34, 0.8)',
            scale: 1.2
          },
          rippleEffect: {
            scale: 4,
            period: 2
          }
        }
      },
      // 添加呼吸灯效果的散点图
      {
        type: "scatter",
        coordinateSystem: "geo",
        data: seriesData,
        symbolSize: function(val) {
          const area = val[2];
          return Math.max(20, Math.min(45, (area / 8) + 10)) // 与主散点图保持一致
        },
        itemStyle: {
          color: '#e6b422', // 金色点
          opacity: 0.6
        },
        animation: true,
        animationDuration: 3000,
        animationEasing: 'easeInOutCubic',
        animationDelay: function (idx) {
          return idx * 150 // 每个点的动画延迟
        },
        animationDurationUpdate: 3000,
        animationEasingUpdate: 'easeInOutCubic'
      },
      // 添加核心区域标注
      {
        type: 'custom',
        coordinateSystem: 'geo',
        renderItem: function(params, api) {
          const coordinates = api.coord([108.95, 34.25]); // 西安
          return {
            type: 'text',
            position: coordinates,
            style: {
              text: '唐代核心宫殿群',
              fontSize: 12,
              fill: textColor,
              textAlign: 'center',
              backgroundColor: getCurrentTheme() === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
              borderColor: borderColor,
              borderWidth: 1,
              borderRadius: 4,
              padding: [5, 10]
            }
          };
        },
        data: [1]
      },
      {
        type: 'custom',
        coordinateSystem: 'geo',
        renderItem: function(params, api) {
          const coordinates = api.coord([112.45, 34.68]); // 洛阳
          return {
            type: 'text',
            position: coordinates,
            style: {
              text: '唐代东都宫殿群',
              fontSize: 12,
              fill: textColor,
              textAlign: 'center',
              backgroundColor: getCurrentTheme() === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
              borderColor: borderColor,
              borderWidth: 1,
              borderRadius: 4,
              padding: [5, 10]
            }
          };
        },
        data: [1]
      }
    ]
  }
  
  myChart.setOption(options)
  
  // 添加地图点击事件
  myChart.on('click', function(params) {
    if (params.componentType === 'series' && (params.seriesType === 'effectScatter' || params.seriesType === 'scatter')) {
      const palace = params.value[3];
      
      if (palace) {
        // 触发palaceClick事件
        emit('palaceClick', palace);
      }
    }
  })
  
  // 暴露定位宫殿的方法
  window.locatePalace = function(palaceId) {
    // 查找对应的宫殿
    const palace = tangPalaces.find(p => p.id === palaceId)
    if (palace) {
      const coord = [palace.lng, palace.lat]
      // 平滑定位到该宫殿
      myChart.setOption({
        geo: {
          center: coord,
          zoom: 8
        }
      }, true)
      
      // 触发气泡高亮效果
      const dataIndex = seriesData.findIndex(item => item.value[3].id === palaceId);
      if (dataIndex !== -1) {
        // 触发鼠标悬停效果
        myChart.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: dataIndex
        });
        
        // 闪烁效果
        const originalSymbolSize = seriesData[dataIndex].symbolSize;
        seriesData[dataIndex].symbolSize = function() { return 60; };
        myChart.setOption({
          series: [{
            data: seriesData
          }]
        });
        
        setTimeout(() => {
          seriesData[dataIndex].symbolSize = originalSymbolSize;
          myChart.setOption({
            series: [{
              data: seriesData
            }]
          });
        }, 2000);
      }
    }
  }
  
  // 暴露定位城市的方法（保持向后兼容）
  window.locateCity = function(cityName) {
    // 查找包含该城市名称的宫殿
    const palace = tangPalaces.find(p => p.location.includes(cityName))
    if (palace) {
      window.locatePalace(palace.id);
    }
  }
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