<script setup>
import * as echarts from 'echarts';
import { ref, onMounted, onUnmounted, watch, onUpdated, computed } from 'vue';
import palaces from '@/data/data.palaces.json';

const emit = defineEmits(['palaceClick']);
const chartRef = ref(null);
let chart = null;
let zoomLevel = 1;
let zoomLevelElement = null;

// 响应式主题状态
const currentTheme = ref(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

// 获取当前主题
const getCurrentTheme = () => {
  return currentTheme.value;
};

// 获取主题对应的文字颜色
const getTextColor = () => {
  return getCurrentTheme() === 'dark' ? '#ffffff' : '#333333';
};

// 获取主题对应的边框颜色
const getBorderColor = () => {
  return getCurrentTheme() === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
};

// 获取主题对应的分割线颜色
const getSplitLineColor = () => {
  return getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
};

// 获取主题对应的背景色
const getBackgroundColor = () => {
  return getCurrentTheme() === 'dark' ? '#121212' : '#f8f5f0';
};

// 获取主题对应的缩放元素背景色
const getZoomElementBgColor = () => {
  return getCurrentTheme() === 'dark' ? 'rgba(13, 17, 23, 0.8)' : 'rgba(255, 250, 240, 0.8)';
};

// 获取主题对应的缩放元素文字颜色
const getZoomElementTextColor = () => {
  return getCurrentTheme() === 'dark' ? '#fff' : '#333333';
};

// 文化差异说明样式
const culturalDifferenceStyle = computed(() => {
  return {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: getCurrentTheme() === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,250,240,0.8)',
    border: `1px solid ${getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'}`,
    borderRadius: '8px'
  };
});

// 文字颜色样式
const textColorStyle = computed(() => {
  return getCurrentTheme() === 'dark' ? '#ffffff' : '#333333';
});

const initChart = () => {
  if (chartRef.value) {
    // 如果图表已存在，先销毁旧实例
    if (chart) {
      try {
        chart.dispose();
      } catch (e) {
        // 忽略已被销毁的实例
      }
      chart = null;
    }
    
    chart = echarts.init(chartRef.value);
    
    // 分别统计唐代和宋代的建筑面积
    const tangPalaces = palaces.filter(palace => palace.dynasty === '唐代');
    const songPalaces = palaces.filter(palace => palace.dynasty === '宋代');
    
    // 按省份统计唐代建筑面积
    const tangProvinceArea = tangPalaces.reduce((acc, palace) => {
      // 提取省份名称，例如从"陕西省西安市"中提取"陕西省"
      const province = palace.location.match(/^[\u4e00-\u9fa5]+省/)[0];
      // 提取面积数值，去除单位
      const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, ''));
      acc[province] = (acc[province] || 0) + (areaValue || 0);
      return acc;
    }, {});
    
    // 按省份统计宋代建筑面积
    const songProvinceArea = songPalaces.reduce((acc, palace) => {
      // 提取省份名称，例如从"浙江省杭州市"中提取"浙江省"
      const province = palace.location.match(/^[\u4e00-\u9fa5]+省/)[0];
      // 提取面积数值，去除单位
      const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, ''));
      acc[province] = (acc[province] || 0) + (areaValue || 0);
      return acc;
    }, {});
    
    // 获取所有省份
    const provinces = [...new Set([...Object.keys(tangProvinceArea), ...Object.keys(songProvinceArea)])];
    
    // 转换为ECharts数据格式
    const tangData = provinces.map(province => tangProvinceArea[province] || 0);
    const songData = provinces.map(province => songProvinceArea[province] || 0);
    
    // 创建缩放比例显示元素
    createZoomLevelElement();
    
    const textColor = getTextColor();
    const borderColor = getBorderColor();
    const splitLineColor = getSplitLineColor();
    const backgroundColor = getBackgroundColor();
    const isDark = getCurrentTheme() === 'dark';
    
    const option = {
      backgroundColor: backgroundColor,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const isDark = getCurrentTheme() === 'dark';
          const accentColor = isDark ? '#e6b422' : '#c44536';
          
          let result = `<div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${accentColor}; border-radius: 8px;">`;
          result += `<div style="font-weight: bold; color: ${accentColor}; margin-bottom: 5px;">${params[0].name}</div>`;
          
          params.forEach(param => {
            result += `<div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">${param.seriesName}：${param.value.toFixed(1)} 万平方米</div>`;
          });
          
          result += '</div>';
          return result;
        },
        backgroundColor: 'transparent'
      },
      legend: {
        data: ['唐代', '宋代'],
        textStyle: {
          color: isDark ? '#e6b422' : '#c44536',
          fontFamily: 'Noto Serif SC',
          fontSize: 12,
          fontWeight: 'bold'
        },
        backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: isDark ? '#e6b422' : '#c44536',
        borderWidth: 2,
        top: 10,
        right: 10,
        padding: 8,
        itemWidth: 16,
        itemHeight: 16,
        z: 1000
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: provinces,
          axisLine: {
            lineStyle: {
              color: borderColor
            }
          },
          axisLabel: {
            color: textColor,
            fontFamily: 'Noto Serif SC',
            rotate: 45
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '建筑面积(万平方米)',
          nameTextStyle: {
            color: textColor,
            fontFamily: 'Noto Serif SC',
            padding: [0, 0, 0, 20]
          },
          axisLine: {
            lineStyle: {
              color: borderColor
            }
          },
          axisLabel: {
            color: textColor,
            fontFamily: 'Noto Serif SC'
          },
          splitLine: {
            lineStyle: {
              color: splitLineColor
            }
          }
        }
      ],
      // 动画配置
      animation: true,
      animationDuration: 1000, // 统一动画时长
      animationEasing: 'cubicOut',
      animationDelay: function(idx) {
        return idx * 50;
      },
      series: [
        {
          name: '唐代',
          type: 'bar',
          stack: 'Total',
          emphasis: {
            focus: 'series'
          },
          data: tangData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: isDark ? '#a0382d' : '#c44536' },
              { offset: 1, color: isDark ? '#702a1f' : '#8b362a' }
            ]),
            // 毛笔笔触效果
            borderRadius: [10, 10, 0, 0],
            shadowBlur: 10,
            shadowColor: 'rgba(196, 69, 54, 0.5)',
            shadowOffsetX: 0,
            shadowOffsetY: 2
          },
          label: {
            show: true,
            position: 'top',
            color: textColor,
            fontFamily: 'Noto Serif SC',
            fontSize: 10
          },
          // 模拟毛笔笔触的柱形宽度
          barWidth: '60%',
          // 图例切换时的动画
          animationDurationUpdate: 500,
          animationEasingUpdate: 'cubicOut'
        },
        {
          name: '宋代',
          type: 'bar',
          stack: 'Total',
          emphasis: {
            focus: 'series'
          },
          data: songData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: isDark ? '#e6b422' : '#e6b422' },
              { offset: 1, color: isDark ? '#a88017' : '#a88017' }
            ]),
            // 毛笔笔触效果
            borderRadius: [10, 10, 0, 0],
            shadowBlur: 10,
            shadowColor: 'rgba(230, 180, 34, 0.5)',
            shadowOffsetX: 0,
            shadowOffsetY: 2
          },
          label: {
            show: true,
            position: 'top',
            color: textColor,
            fontFamily: 'Noto Serif SC',
            fontSize: 10
          },
          // 模拟毛笔笔触的柱形宽度
          barWidth: '60%',
          // 图例切换时的动画
          animationDurationUpdate: 500,
          animationEasingUpdate: 'cubicOut'
        }
      ]
    };
    
    chart.setOption(option);
    
    // 监听图例点击事件
    chart.on('legendselectchanged', function(params) {
      // 图例点击时的动画效果已通过animationDurationUpdate配置
      console.log('图例选择变化:', params);
    });
    
    // 监听缩放事件
    chart.on('dataZoom', function(params) {
      updateZoomLevel(params);
    });
    
    // 添加点击事件
    chart.on('click', function(params) {
      if (params.componentType === 'series' && params.seriesType === 'bar') {
        const province = params.name;
        // 查找该省份的宫殿
        const provincePalaces = palaces.filter(palace => {
          return palace.location.includes(province);
        });
        
        if (provincePalaces.length > 0) {
          // 选择第一个宫殿作为代表
          const palace = provincePalaces[0];
          emit('palaceClick', palace);
          
          // 定位到地图
          if (palace.dynasty === '唐代' && window.locatePalace) {
            window.locatePalace(palace.id);
          } else if (palace.dynasty === '宋代' && window.locateSongPalace) {
            window.locateSongPalace(palace.id);
          }
          
          // 定位到热力图
          if (window.locateHeatmapPalace) {
            window.locateHeatmapPalace(palace.id);
          }
        }
      }
    });
  }
};

const createZoomLevelElement = () => {
  if (!chartRef.value) return;
  
  // 移除已存在的元素
  if (zoomLevelElement) {
    zoomLevelElement.remove();
  }
  
  const bgColor = getZoomElementBgColor();
  const textColor = getZoomElementTextColor();
  
  // 创建新的缩放比例显示元素
  zoomLevelElement = document.createElement('div');
  zoomLevelElement.className = 'zoom-level';
  zoomLevelElement.style.position = 'absolute';
  zoomLevelElement.style.bottom = '10px';
  zoomLevelElement.style.right = '10px';
  zoomLevelElement.style.backgroundColor = bgColor;
  zoomLevelElement.style.color = textColor;
  zoomLevelElement.style.padding = '5px 10px';
  zoomLevelElement.style.borderRadius = '4px';
  zoomLevelElement.style.fontSize = '12px';
  zoomLevelElement.style.zIndex = '100';
  zoomLevelElement.style.border = '1px solid rgba(196, 69, 54, 0.5)';
  zoomLevelElement.textContent = '原始大小';
  
  // 添加到图表容器
  chartRef.value.appendChild(zoomLevelElement);
};

const updateZoomLevel = (params) => {
  if (!zoomLevelElement) return;
  
  // 计算缩放比例
  if (params && params.batch) {
    const zoom = params.batch[0].end - params.batch[0].start;
    zoomLevel = Math.round((1 / zoom) * 100);
    
    if (zoomLevel === 100) {
      zoomLevelElement.textContent = '原始大小';
    } else {
      zoomLevelElement.textContent = `${zoomLevel}%`;
    }
  }
};

const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
  
  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        // 更新响应式主题状态
        currentTheme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        initChart();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true
  });
  
  // 保存observer引用以便在卸载时清理
  window.themeObserverComparison = observer;
});

onUnmounted(() => {
  if (chart) {
    try {
      chart.dispose();
    } catch (e) {
      // 忽略已被销毁的实例
    }
  }
  window.removeEventListener('resize', handleResize);
  if (zoomLevelElement) {
    zoomLevelElement.remove();
  }
  
  // 清理主题变化监听器
  if (window.themeObserverComparison) {
    window.themeObserverComparison.disconnect();
    delete window.themeObserverComparison;
  }
});

</script>

<template>
  <div class="comparison-container">
    <div ref="chartRef" class="comparison-chart" style="width: 100%; height: 100%; position: relative;"></div>
    <div class="cultural-difference" :style="culturalDifferenceStyle">
      <p :style="{ color: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536', fontWeight: 'bold', marginBottom: '0.5rem' }">文化差异说明：</p>
      <p :style="{ color: textColorStyle, margin: '0.25rem 0' }">&bull; 唐代：规模宏大、气势磅礴</p>
      <p :style="{ color: textColorStyle, margin: '0.25rem 0' }">&bull; 宋代：精致秀丽、精巧内敛</p>
    </div>
  </div>
</template>

<style scoped>
.comparison-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comparison-chart {
  flex: 1;
  position: relative;
}
</style>