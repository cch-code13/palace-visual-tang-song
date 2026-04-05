<template>
  <div class="chart-container">
    <div ref="chart" class="echartsBox"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import palaces from '@/data/data.palaces.json';

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
  window.themeObserverBar = observer;
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
  if (window.themeObserverBar) {
    window.themeObserverBar.disconnect();
    delete window.themeObserverBar;
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
  
  myChart = echarts.init(chart.value);
  
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
  
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const splitLineColor = getSplitLineColor();
  const backgroundColor = getBackgroundColor();
  
  const isDark = getCurrentTheme() === 'dark';
  const strokeColor = isDark ? '#ffffff' : '#333333';
  
  const option = {
    backgroundColor: backgroundColor, // 动态背景色
    title: {
      text: '建筑面积动态对比',
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: isDark ? 'rgba(30,20,48,0.9)' : 'rgba(255,250,240,0.9)',
      borderColor: isDark ? '#e6b422' : '#c44536',
      textStyle: {
        color: isDark ? '#ffffff' : '#333333',
        fontFamily: 'Noto Serif SC'
      }
    },
    legend: {
      data: ['唐代', '宋代'],
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      },
      backgroundColor: isDark ? 'rgba(30,20,48,0.8)' : 'rgba(255,250,240,0.8)',
      borderColor: isDark ? '#e6b422' : '#c44536',
      borderWidth: 1
    },
    xAxis: {
      type: 'category',
      data: provinces,
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
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }
      }
    },
    series: [
      {
        name: '唐代',
        type: 'bar',
        data: tangData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? '#a0382d' : '#c44536' }, // 主色：深红
            { offset: 1, color: isDark ? '#702a1f' : '#8b362a' }
          ]),
          borderColor: strokeColor,
          borderWidth: 1
        },
        animationDelay: function(idx) {
          return idx * 100;
        }
      },
      {
        name: '宋代',
        type: 'bar',
        data: songData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? '#ffd700' : '#e6b422' }, // 强调色：金色
            { offset: 1, color: isDark ? '#b88b1a' : '#b88b1a' }
          ]),
          borderColor: strokeColor,
          borderWidth: 1
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
}

.echartsBox {
  width: 100%;
  height: 100%;
}
</style>