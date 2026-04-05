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
let zoomLevel = 1;
let zoomLevelElement = null;

// 获取当前主题
const getCurrentTheme = () => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// 获取主题对应的文字颜色
const getTextColor = () => {
  return getCurrentTheme() === 'dark' ? '#ffffff' : '#333333';
};

// 获取主题对应的背景色
const getBackgroundColor = () => {
  return getCurrentTheme() === 'dark' ? '#1e162d' : '#f8f5f0';
};

// 获取主题对应的边框颜色
const getBorderColor = () => {
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
  window.themeObserver3D = observer;
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
  if (zoomLevelElement) {
    zoomLevelElement.remove();
  }
  // 清理主题变化监听器
  if (window.themeObserver3D) {
    window.themeObserver3D.disconnect();
    delete window.themeObserver3D;
  }
});

const handleResize = () => {
  if (myChart) {
    myChart.resize();
  }
};

const createZoomLevelElement = () => {
  if (!chart.value) return;
  
  // 移除已存在的元素
  if (zoomLevelElement) {
    zoomLevelElement.remove();
  }
  
  // 获取当前主题
  const isDark = getCurrentTheme() === 'dark';
  
  // 创建新的缩放比例显示元素
  zoomLevelElement = document.createElement('div');
  zoomLevelElement.className = 'zoom-level';
  zoomLevelElement.style.position = 'absolute';
  zoomLevelElement.style.bottom = '10px';
  zoomLevelElement.style.right = '10px';
  zoomLevelElement.style.backgroundColor = isDark ? 'rgba(13, 17, 23, 0.8)' : 'rgba(255, 250, 240, 0.8)';
  zoomLevelElement.style.color = isDark ? '#fff' : '#333333';
  zoomLevelElement.style.padding = '5px 10px';
  zoomLevelElement.style.borderRadius = '4px';
  zoomLevelElement.style.fontSize = '12px';
  zoomLevelElement.style.zIndex = '100';
  zoomLevelElement.style.border = `1px solid ${isDark ? 'rgba(230, 180, 34, 0.5)' : 'rgba(196, 69, 54, 0.5)'}`;
  zoomLevelElement.textContent = '原始大小';
  
  // 添加到图表容器
  chart.value.appendChild(zoomLevelElement);
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
  
  // 创建缩放比例显示元素
  createZoomLevelElement();
  
  // 按省份统计宫殿数量
  const provinceCount = palaces.reduce((acc, palace) => {
    const province = palace.location.split(' ')[0];
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {});
  
  // 统计每个省份的朝代分布
  const provinceDynasty = {};
  palaces.forEach(palace => {
    const province = palace.location.split(' ')[0];
    if (!provinceDynasty[province]) {
      provinceDynasty[province] = { tang: 0, song: 0 };
    }
    if (palace.dynasty === '唐代') {
      provinceDynasty[province].tang++;
    } else if (palace.dynasty === '宋代') {
      provinceDynasty[province].song++;
    }
  });
  
  // 转换为ECharts数据格式，每个省份一个条目，标记主要朝代
  const data = Object.entries(provinceCount).map(([name, value]) => {
    const dynastyData = provinceDynasty[name];
    const mainDynasty = dynastyData.tang > dynastyData.song ? '唐代' : '宋代';
    return {
      name,
      value,
      dynasty: mainDynasty
    };
  });
  
  // 按值排序
  data.sort((a, b) => b.value - a.value);
  
  // 获取当前主题
  const isDark = getCurrentTheme() === 'dark';
  const textColor = getTextColor();
  const backgroundColor = getBackgroundColor();
  
  // 分离唐代和宋代的数据
  const tangData = data.filter(item => item.dynasty === '唐代');
  const songData = data.filter(item => item.dynasty === '宋代');
  
  // 计算每个朝代的最大值，用于归一化
  const maxTangValue = tangData.length > 0 ? Math.max(...tangData.map(item => item.value)) : 1;
  const maxSongValue = songData.length > 0 ? Math.max(...songData.map(item => item.value)) : 1;
  
  // 生成颜色数组
  const colors = data.map(item => {
    if (item.dynasty === '唐代') {
      // 唐代：红色系，根据占比分配深浅
      const ratio = item.value / maxTangValue;
      if (isDark) {
        // 深色主题：红色从深到浅
        const lightness = 0.4 + ratio * 0.3; // 亮度从0.4到0.7
        return `hsl(0, 70%, ${lightness * 100}%)`;
      } else {
        // 浅色主题：红色从深到浅
        const lightness = 0.3 + ratio * 0.3; // 亮度从0.3到0.6
        return `hsl(0, 60%, ${lightness * 100}%)`;
      }
    } else {
      // 宋代：黄色系，根据占比分配深浅
      const ratio = item.value / maxSongValue;
      if (isDark) {
        // 深色主题：金色从深到浅
        const lightness = 0.4 + ratio * 0.3; // 亮度从0.4到0.7
        return `hsl(45, 100%, ${lightness * 100}%)`;
      } else {
        // 浅色主题：金色从深到浅
        const lightness = 0.4 + ratio * 0.3; // 亮度从0.4到0.7
        return `hsl(45, 80%, ${lightness * 100}%)`;
      }
    }
  });
  
  const option = {
    backgroundColor: backgroundColor, // 动态背景色
    title: {
      text: '宫殿地域分布',
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `
          <div style="padding: 10px; background: ${isDark ? 'rgba(30,20,48,0.9)' : 'rgba(255,250,240,0.9)'} ; border: 1px solid ${isDark ? '#e6b422' : '#c44536'}; border-radius: 8px;">
            <div style="font-weight: bold; color: ${isDark ? '#e6b422' : '#c44536'}; margin-bottom: 5px;">${params.name}</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">宫殿数量：${params.value} 座</div>
            <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">占比：${params.percent.toFixed(1)}%</div>
          </div>
        `;
      },
      backgroundColor: 'transparent'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      textStyle: {
        color: textColor,
        fontFamily: 'Noto Serif SC'
      },
      type: 'scroll',
      selectedMode: 'multiple', // 支持图例点击切换
      backgroundColor: isDark ? 'rgba(30,20,48,0.8)' : 'rgba(255,250,240,0.8)',
      borderColor: isDark ? '#e6b422' : '#c44536',
      borderWidth: 1
    },
    // 动画配置
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    animationDelay: function(idx) {
      return idx * 50;
    },
    series: [
      {
        name: '宫殿地域分布',
        type: 'pie',
        radius: ['40%', '70%'],
        // 团扇造型：设置起始角度和结束角度
        startAngle: 90,
        endAngle: -270,
        data: data,
        itemStyle: {
          borderRadius: 10,
          borderColor: isDark ? '#ffffff' : '#333333',
          borderWidth: 1,
          color: function(params) {
            return colors[params.dataIndex];
          }
        },
        label: {
          show: false
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut',
        // 图例切换时的动画
        animationDurationUpdate: 500,
        animationEasingUpdate: 'cubicOut',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(230, 180, 34, 0.5)'
          }
        }
      }
    ]
  };
  
  myChart.setOption(option);
  
  // 监听图例点击事件
  myChart.on('legendselectchanged', function(params) {
    // 图例点击时的动画效果已通过animationDurationUpdate配置
    console.log('图例选择变化:', params);
  });
  
  // 监听缩放事件
  myChart.on('dataZoom', function(params) {
    updateZoomLevel(params);
  });
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.echartsBox {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>