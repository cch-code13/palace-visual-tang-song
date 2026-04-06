<template>
  <div class="chart-container">
    <div ref="chart" class="echartsBox"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import palaces from '@/data/data.palaces.json';
import { mapData } from '@/assets';

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

// 获取主题对应的背景颜色
const getBackgroundColor = () => {
  return getCurrentTheme() === 'dark' ? '#121212' : '#ffffff';
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
  
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
  window.themeObserverHeatMap = observer;
});

onUnmounted(() => {
  if (myChart) {
      try {
        myChart.dispose();
      } catch (e) {
        // 忽略已被销毁的实例
      }
    }
  window.removeEventListener('resize', handleResize);
  
  // 清理主题变化监听器
  if (window.themeObserverHeatMap) {
    window.themeObserverHeatMap.disconnect();
    delete window.themeObserverHeatMap;
  }
});

const handleResize = () => {
  if (myChart) {
    myChart.resize();
  }
};

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
  
  // 注册地图
  echarts.registerMap("chinaMap", mapData);
  
  // 按省份统计宫殿数量和建筑面积
  const provinceStats = palaces.reduce((acc, palace) => {
    // 提取省份名称，例如从"陕西省西安市"中提取"陕西"
    const province = palace.location.match(/^[\u4e00-\u9fa5]+(?=省)/)[0];
    if (!acc[province]) {
      acc[province] = {
        count: 0,
        area: 0
      };
    }
    acc[province].count++;
    // 提取面积数值，去除单位
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0;
    acc[province].area += areaValue;
    return acc;
  }, {});
  
  // 模拟省份坐标（实际项目中应该使用真实的地理坐标）
  const provinceCoordinates = {
    '陕西': [108.94, 34.34],
    '河南': [113.65, 34.76],
    '河北': [114.51, 38.04],
    '山东': [117.00, 36.65],
    '山西': [112.53, 37.87],
    '江苏': [118.78, 32.06],
    '浙江': [120.15, 30.28],
    '四川': [104.07, 30.67],
    '湖北': [114.31, 30.52],
    '湖南': [112.98, 28.19],
    '江西': [115.89, 28.68],
    '安徽': [117.28, 31.86],
    '福建': [119.30, 26.08],
    '广东': [113.26, 23.13],
    '广西': [108.33, 22.84],
    '云南': [102.71, 25.04],
    '贵州': [106.71, 26.57],
    '辽宁': [123.43, 41.80],
    '吉林': [125.35, 43.88],
    '黑龙江': [126.63, 45.75],
    '内蒙古': [111.65, 40.82],
    '新疆': [87.68, 43.77],
    '西藏': [91.11, 29.97],
    '青海': [101.74, 36.56],
    '甘肃': [103.82, 36.05],
    '宁夏': [106.27, 38.47],
    '北京': [116.40, 39.90],
    '天津': [117.20, 39.13],
    '上海': [121.47, 31.23],
    '重庆': [106.55, 29.56],
    '香港': [114.17, 22.32],
    '澳门': [113.54, 22.19],
    '台湾': [121.50, 25.05]
  };
  
  // 转换为ECharts热力图数据格式
  const heatmapData = Object.entries(provinceStats).map(([province, stats]) => {
    const coord = provinceCoordinates[province] || [110.0, 35.0];
    return [...coord, stats.count]; // 使用宫殿数量作为权重
  });
  
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const backgroundColor = getBackgroundColor();
  
  const option = {
    title: {
      text: '宫殿分布热力图',
      subtext: '权重说明：基于宫殿数量',
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        fontSize: 16
      },
      subtextStyle: {
        color: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536',
        fontFamily: 'Noto Serif SC',
        fontSize: 12
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
          fill: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'
        }
      }
    ],

    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const isDark = getCurrentTheme() === 'dark';
        const accentColor = isDark ? '#e6b422' : '#c44536';
        return `
          <div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${borderColor}; border-radius: 8px;">
            <div style="font-weight: bold; color: ${accentColor}; margin-bottom: 5px;">${params.name}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">宫殿数量：${params.value[2]} 座</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建筑面积：${provinceStats[params.name]?.area.toFixed(1) || 0} 万平方米</div>
          </div>
        `;
      },
      backgroundColor: 'transparent'
    },
    visualMap: {
      min: 0,
      max: Math.max(...Object.values(provinceStats).map(stat => stat.count)),
      calculable: true,
      inRange: {
        color: [backgroundColor, getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536', getCurrentTheme() === 'dark' ? '#ffd700' : '#e6b422']
      },
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      }
    },
    geo: {
      type: 'map',
      map: 'chinaMap',
      roam: true,
      center: [110.0, 35.0],
      zoom: 4.5,
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
      animationEasing: 'cubicOut'
    },
    series: [
      {
        name: '宫殿密度',
        type: 'heatmap',
        coordinateSystem: 'geo',
        data: heatmapData,
        pointSize: 20,
        blurSize: 15,
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  };
  
  myChart.setOption(option);
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.echartsBox {
  width: 100%;
  height: 100%;
}
</style>