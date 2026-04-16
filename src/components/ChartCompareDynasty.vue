<template>
  <div class="chart-container">
    <div ref="chart" class="echartsBox"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import palaces from '@/data/data.palaces.json';

const emit = defineEmits(['palaceClick']);
const chart = ref(null);
let myChart = null;

// 获取当前主题
const getCurrentTheme = () => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// 获取主题对应的文字颜色
const getTextColor = () => {
  return getCurrentTheme() === 'dark' ? '#ffffff' : '#333333';
};

// 获取主题对应的边框颜色
const getBorderColor = () => {
  return getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536';
};

// 获取主题对应的分割线颜色
const getSplitLineColor = () => {
  return getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
};

// 获取主题对应的背景颜色
const getBackgroundColor = () => {
  return getCurrentTheme() === 'dark' ? '#121212' : '#ffffff';
};

onMounted(() => {
  initChart();
  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        initChart();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true
  });
  
  // 保存observer引用以便在卸载时清理
  window.themeObserver = observer;
});

onUnmounted(() => {
  if (myChart) {
      try {
        myChart.dispose();
      } catch (e) {
        // 忽略已被销毁的实例
      }
    }
  // 清理主题变化监听器
  if (window.themeObserver) {
    window.themeObserver.disconnect();
    delete window.themeObserver;
  }
});

const initChart = () => {
  if (!chart.value) return;
  
  // 如果图表已存在，先销毁旧实例
  if (myChart) {
    try {
      myChart.dispose();
    } catch (e) {
      // 忽略已被销毁的实例
    }
    myChart = null;
  }
  
  // 重新创建图表实例
  myChart = echarts.init(chart.value);
  
  // 分别筛选唐代和宋代的宫殿
  const tangPalaces = palaces.filter(palace => palace.dynasty === '唐代');
  const songPalaces = palaces.filter(palace => palace.dynasty === '宋代');
  
  // 提取宫殿名称和面积数据
  const tangNames = tangPalaces.map(palace => palace.name);
  const tangAreas = tangPalaces.map(palace => {
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0;
    return { value: areaValue, palace: palace };
  });
  
  const songNames = songPalaces.map(palace => palace.name);
  const songAreas = songPalaces.map(palace => {
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0;
    return { value: areaValue, palace: palace };
  });
  
  // 合并所有宫殿名称
  const allNames = [...tangNames, ...songNames];
  
  const isDark = getCurrentTheme() === 'dark';
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const splitLineColor = getSplitLineColor();
  const backgroundColor = getBackgroundColor();
  const strokeColor = isDark ? '#ffffff' : '#333333';
  
  const option = {
    backgroundColor: backgroundColor, // 动态背景色
    title: {
      text: '唐宋宫殿规模对比',
      subtext: '基于建筑面积（万平方米）',
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        fontSize: 16
      },
      subtextStyle: {
        color: isDark ? '#e6b422' : '#c44536',
        fontFamily: 'Noto Serif SC',
        fontSize: 12
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const isDark = getCurrentTheme() === 'dark';
        const accentColor = isDark ? '#e6b422' : '#c44536';
        
        let result = `<div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${borderColor}; border-radius: 8px;">`;
        
        params.forEach(param => {
          const palace = param.seriesType === 'bar' ? 
            (param.seriesName === '唐代' ? tangAreas[param.dataIndex]?.palace : songAreas[param.dataIndex]?.palace) : 
            null;
          
          result += `<div style="font-weight: bold; color: ${accentColor}; margin-bottom: 5px;">${param.name}</div>`;
          if (palace) {
            result += `
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">朝代：${palace.dynasty}</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">位置：${palace.location}</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建造年代：${palace.buildYear}</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建筑面积：${palace.area}</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">文物等级：${palace.culturalLevel}</div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(230, 180, 34, 0.3);">
                <div style="color: ${accentColor}; font-size: 0.9rem;">点击查看宫殿详情</div>
              </div>
            `;
          } else {
            result += `<div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建筑面积：${param.value} 万平方米</div>`;
          }
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
    xAxis: {
      type: 'category',
      data: allNames,
      axisLabel: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        rotate: 45
      },
      axisLine: {
        lineStyle: {
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '建筑面积（万平方米）',
      nameTextStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      },
      axisLabel: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
        }
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor
        }
      }
    },
    series: [
      {
        name: '唐代',
        data: tangAreas.map(item => item.value),
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? '#a0382d' : '#c44536' }, // 主色：深红
            { offset: 1, color: isDark ? '#702a1f' : '#8b362a' }
          ]),
          borderColor: strokeColor,
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'top',
          color: textColor,
          fontFamily: 'Noto Serif SC',
          fontSize: 10
        },
        animationDelay: function(idx) {
          return idx * 100;
        }
      },
      {
        name: '宋代',
        data: songAreas.map(item => item.value),
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? '#B8860B' : '#B8860B' }, // 宋代：黄色
            { offset: 1, color: isDark ? '#8B6914' : '#8B6914' }
          ]),
          borderColor: strokeColor,
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'top',
          color: textColor,
          fontFamily: 'Noto Serif SC',
          fontSize: 10
        },
        animationDelay: function(idx) {
          return idx * 100 + 100;
        }
      }
    ],
    animation: true,
    animationDuration: 1000, // 统一动画时长
    animationEasing: 'cubicOut',
    animationDelayUpdate: function(idx) {
      return idx * 5;
    }
  };
  
  myChart.setOption(option);
  
  // 添加点击事件
  myChart.on('click', function(params) {
    if (params.componentType === 'series' && params.seriesType === 'bar') {
      const palace = params.seriesName === '唐代' ? 
        tangAreas[params.dataIndex]?.palace : 
        songAreas[params.dataIndex]?.palace;
      
      if (palace) {
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
  
  window.addEventListener('resize', () => {
    myChart.resize();
  });
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.echartsBox {
  width: 100%;
  height: 100%;
  background: transparent;
}
</style>