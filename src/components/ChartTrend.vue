<template>
  <div class="chart-container">
    <div ref="chart" class="echartsBox"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose } from 'vue';
import * as echarts from 'echarts';
import palaces from '@/data/data.palaces.json';

const chart = ref(null);
let myChart = null;
let chartData = {
  timePeriods: ['初唐', '盛唐', '中唐', '晚唐', '北宋', '南宋'],
  tangTrend: [0, 0, 0, 0, 0, 0],
  songTrend: [0, 0, 0, 0, 0, 0]
};

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
  window.themeObserverTrend = observer;
});

onUnmounted(() => {
  if (myChart) {
    myChart.dispose();
  }
  
  // 清理主题变化监听器
  if (window.themeObserverTrend) {
    window.themeObserverTrend.disconnect();
    delete window.themeObserverTrend;
  }
});

const initChart = () => {
  if (!chart.value) return;
  
  // 如果图表已存在，先销毁旧实例
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
  
  myChart = echarts.init(chart.value);
  
  // 计算各时期的建筑面积
  calculateChartData();
  
  const option = getChartOption();
  
  myChart.setOption(option);
  
  window.addEventListener('resize', () => {
    myChart.resize();
  });
};

const calculateChartData = () => {
  // 重置数据
  chartData.tangTrend = [0, 0, 0, 0, 0, 0];
  chartData.songTrend = [0, 0, 0, 0, 0, 0];
  
  palaces.forEach(palace => {
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0;
    
    if (palace.dynasty === '唐代') {
      const yearBuilt = palace.buildYear;
      if (yearBuilt.includes('618') || yearBuilt.includes('634') || yearBuilt.includes('593') || yearBuilt.includes('624')) {
        chartData.tangTrend[0] += areaValue; // 初唐
      } else if (yearBuilt.includes('714')) {
        chartData.tangTrend[1] += areaValue; // 盛唐
      } else if (yearBuilt.includes('唐代初期')) {
        chartData.tangTrend[0] += areaValue; // 初唐
      }
    } else if (palace.dynasty === '宋代') {
      const yearBuilt = palace.buildYear;
      if (yearBuilt.includes('960')) {
        chartData.songTrend[4] += areaValue; // 北宋
      } else if (yearBuilt.includes('1129') || yearBuilt.includes('1162')) {
        chartData.songTrend[5] += areaValue; // 南宋
      } else if (yearBuilt.includes('北宋')) {
        chartData.songTrend[4] += areaValue; // 北宋
      } else if (yearBuilt.includes('南宋')) {
        chartData.songTrend[5] += areaValue; // 南宋
      }
    }
  });
};

const getChartOption = (highlightPeriod = null) => {
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const splitLineColor = getSplitLineColor();
  const backgroundColor = getBackgroundColor();
  
  const option = {
    backgroundColor: backgroundColor, // 动态背景色
    title: {
      text: '唐宋宫殿建筑发展趋势分析',
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: getCurrentTheme() === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
      borderColor: borderColor,
      textStyle: {
        color: getCurrentTheme() === 'dark' ? '#ffffff' : '#333333',
        fontFamily: 'Noto Serif SC'
      }
    },
    legend: {
      data: ['唐代宫殿面积', '宋代宫殿面积'],
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.timePeriods,
      axisLabel: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      },
      axisLine: {
        lineStyle: {
          color: getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
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
          color: getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
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
        name: '唐代宫殿面积',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: getCurrentTheme() === 'dark' ? 'rgba(230, 180, 34, 0.5)' : 'rgba(196, 69, 54, 0.5)' },
            { offset: 1, color: getCurrentTheme() === 'dark' ? 'rgba(230, 180, 34, 0.1)' : 'rgba(196, 69, 54, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: chartData.tangTrend,
        lineStyle: {
          color: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'
        },
        itemStyle: {
          color: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'
        }
      },
      {
        name: '宋代宫殿面积',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: getCurrentTheme() === 'dark' ? 'rgba(255, 220, 0, 0.5)' : 'rgba(230, 180, 34, 0.5)' },
            { offset: 1, color: getCurrentTheme() === 'dark' ? 'rgba(255, 220, 0, 0.1)' : 'rgba(230, 180, 34, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: chartData.songTrend,
        lineStyle: {
          color: getCurrentTheme() === 'dark' ? '#ffd700' : '#e6b422'
        },
        itemStyle: {
          color: getCurrentTheme() === 'dark' ? '#ffd700' : '#e6b422'
        }
      }
    ],
    animation: true,
    animationDuration: 1000, // 统一动画时长
    animationEasing: 'cubicOut'
  };
  
  // 如果指定了要高亮的时期，添加标记
  if (highlightPeriod) {
    const periodIndex = chartData.timePeriods.indexOf(highlightPeriod);
    if (periodIndex !== -1) {
      option.series.push({
        name: '当前时期',
        type: 'scatter',
        data: chartData.timePeriods.map((period, index) => {
          if (index === periodIndex) {
            return [index, Math.max(chartData.tangTrend[index], chartData.songTrend[index]) + 10];
          }
          return null;
        }).filter(item => item !== null),
        itemStyle: {
          color: getCurrentTheme() === 'dark' ? '#ffd700' : '#e6b422',
          shadowBlur: 10,
          shadowColor: getCurrentTheme() === 'dark' ? 'rgba(255, 220, 0, 0.5)' : 'rgba(230, 180, 34, 0.5)'
        },
        symbolSize: 15
      });
    }
  }
  
  return option;
};

// 高亮指定时期的数据
const highlightPeriod = (period) => {
  if (myChart) {
    const option = getChartOption(period);
    myChart.setOption(option);
  }
};

// 暴露方法给父组件
defineExpose({
  highlightPeriod
});
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