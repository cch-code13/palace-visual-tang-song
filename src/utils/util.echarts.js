// src/utils/echartsUtils.js
import * as echarts from 'echarts';

const chartInstances = new Map();

export const getChartInstance = (dom, key) => {
  if (chartInstances.has(key)) {
    return chartInstances.get(key);
  }
  
  const instance = echarts.init(dom);
  chartInstances.set(key, instance);
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    instance.resize();
  });
  
  return instance;
};

export const destroyChartInstance = (key) => {
  if (chartInstances.has(key)) {
    const instance = chartInstances.get(key);
    instance.dispose();
    chartInstances.delete(key);
  }
};

// 统一的图表主题配置
export const chartTheme = {
  color: ['#c44536', '#e6b422', '#4caf50', '#2196f3', '#9c27b0'],
  backgroundColor: 'rgba(30, 20, 48, 0.8)',
  textStyle: {
    color: '#fff'
  },
  title: {
    textStyle: {
      color: '#fff'
    }
  },
  legend: {
    textStyle: {
      color: '#fff'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(30, 20, 48, 0.9)',
    borderColor: 'rgba(196, 69, 54, 0.5)',
    textStyle: {
      color: '#fff'
    }
  },
  grid: {
    borderColor: 'rgba(196, 69, 54, 0.3)'
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.5)'
      }
    },
    axisLabel: {
      color: '#fff'
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  },
  yAxis: {
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.5)'
      }
    },
    axisLabel: {
      color: '#fff'
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  }
};