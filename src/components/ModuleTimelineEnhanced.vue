<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { ArrowLeftBold, ArrowRightBold, VideoPlay, VideoPause, RefreshRight, RefreshLeft } from '@element-plus/icons-vue';

const props = defineProps({
  palaces: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['timeSelect', 'periodFilter', 'playStart', 'playEnd']);

// 图表实例
const chartRef = ref(null);
let chartInstance = null;

// 播放状态
const isPlaying = ref(false);
const playTimer = ref(null);
const currentIndex = ref(0);
const playSpeed = ref(2000); // 播放速度（毫秒）
const isPaused = ref(false); // 暂停状态

// 播放速度选项
const speedOptions = [
  { label: '慢速', value: 3000 },
  { label: '正常', value: 2000 },
  { label: '快速', value: 1000 }
];

// 计算播放进度
const playProgress = computed(() => {
  if (filteredData.value.length === 0) return 0;
  return ((currentIndex.value + 1) / filteredData.value.length) * 100;
});

// 当前播放节点信息
const currentNode = computed(() => {
  if (filteredData.value.length === 0) return null;
  return filteredData.value[currentIndex.value];
});

// 筛选状态
const selectedDynasty = ref('all'); // all, tang, song
const selectedPeriod = ref('all');

// 时期定义
const periods = {
  tang: [
    { key: 'early', label: '初唐', range: [618, 712], color: '#ff6b6b' },
    { key: 'high', label: '盛唐', range: [712, 755], color: '#c44536' },
    { key: 'mid', label: '中唐', range: [755, 835], color: '#8b4513' },
    { key: 'late', label: '晚唐', range: [835, 907], color: '#654321' }
  ],
  song: [
    { key: 'north', label: '北宋', range: [960, 1127], color: '#e6b422' },
    { key: 'south', label: '南宋', range: [1127, 1279], color: '#daa520' }
  ]
};

// 时间轴数据
const timelineData = [
  { year: 634, title: '大明宫始建', dynasty: '唐代', period: '初唐', importance: 5 },
  { year: 662, title: '大明宫落成', dynasty: '唐代', period: '盛唐', importance: 5 },
  { year: 684, title: '洛阳宫扩建', dynasty: '唐代', period: '初唐', importance: 4 },
  { year: 714, title: '兴庆宫建成', dynasty: '唐代', period: '盛唐', importance: 4 },
  { year: 723, title: '华清宫扩建', dynasty: '唐代', period: '盛唐', importance: 3 },
  { year: 755, title: '安史之乱', dynasty: '唐代', period: '中唐', importance: 5, type: 'event' },
  { year: 835, title: '甘露之变', dynasty: '唐代', period: '晚唐', importance: 3, type: 'event' },
  { year: 896, title: '大明宫被毁', dynasty: '唐代', period: '晚唐', importance: 5 },
  { year: 960, title: '宋朝建立', dynasty: '宋代', period: '北宋', importance: 5, type: 'event' },
  { year: 976, title: '东京宫城建成', dynasty: '宋代', period: '北宋', importance: 4 },
  { year: 1008, title: '玉清昭应宫建成', dynasty: '宋代', period: '北宋', importance: 3 },
  { year: 1085, title: '延福宫扩建', dynasty: '宋代', period: '北宋', importance: 3 },
  { year: 1127, title: '靖康之变', dynasty: '宋代', period: '南宋', importance: 5, type: 'event' },
  { year: 1138, title: '临安宫城建成', dynasty: '宋代', period: '南宋', importance: 4 },
  { year: 1162, title: '德寿宫建成', dynasty: '宋代', period: '南宋', importance: 3 }
];

// 过滤后的数据
const filteredData = computed(() => {
  let data = timelineData;
  
  if (selectedDynasty.value !== 'all') {
    const dynastyName = selectedDynasty.value === 'tang' ? '唐代' : '宋代';
    data = data.filter(item => item.dynasty === dynastyName);
  }
  
  if (selectedPeriod.value !== 'all') {
    data = data.filter(item => item.period === selectedPeriod.value);
  }
  
  return data;
});

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  updateChart();
  
  // 点击事件
  chartInstance.on('click', (params) => {
    if (params.componentType === 'series') {
      const data = timelineData[params.dataIndex];
      emit('timeSelect', data);
      highlightPeriod(data.period);
    }
  });
  
  // 缩放事件
  chartInstance.on('dataZoom', (params) => {
    // 可以在这里添加缩放后的回调
  });
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;
  
  const data = filteredData.value;
  const years = data.map(item => item.year);
  const values = data.map(item => item.importance);
  
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '唐宋宫殿建筑发展历程',
      left: 'center',
      top: 10,
      textStyle: {
        color: 'var(--text-accent, #e6b422)',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        animation: false
      },
      backgroundColor: 'rgba(20, 25, 35, 0.95)',
      borderColor: '#c44536',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      },
      formatter: (params) => {
        const data = timelineData[params[0].dataIndex];
        const color = data.dynasty === '唐代' ? 'var(--el-color-primary, #c44536)' : 'var(--el-color-success, #e6b422)';
        return `
          <div style="padding: 10px;">
            <div style="font-size: 16px; font-weight: bold; color: ${color}; margin-bottom: 8px;">
              ${data.year}年 · ${data.title}
            </div>
            <div style="color: var(--text-muted, #aaa); margin-bottom: 5px;">${data.dynasty} · ${data.period}</div>
            <div style="color: var(--text-primary, #fff);">${data.type === 'event' ? '历史事件' : '宫殿建筑'}</div>
          </div>
        `;
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: {
        lineStyle: { color: 'var(--el-color-primary, #c44536)' }
      },
      axisLabel: {
        color: 'var(--text-primary, #fff)',
        rotate: 30,
        fontSize: 12,
        formatter: (value) => value + '年'
      },
      axisTick: {
        alignWithLabel: true,
        lineStyle: { color: 'var(--el-color-primary, #c44536)' }
      }
    },
    yAxis: {
      type: 'value',
      name: '重要程度',
      nameTextStyle: {
        color: 'var(--text-muted, #aaa)'
      },
      axisLine: {
        lineStyle: { color: 'var(--el-color-primary, #c44536)' }
      },
      axisLabel: {
        color: 'var(--text-primary, #fff)'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(196, 69, 54, 0.1)'
        }
      }
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
        borderColor: 'var(--el-color-primary, #c44536)',
        fillerColor: 'rgba(196, 69, 54, 0.2)',
        handleStyle: {
          color: 'var(--el-color-success, #e6b422)'
        },
        textStyle: {
          color: 'var(--text-primary, #fff)'
        }
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: '宫殿建筑',
        type: 'scatter',
        symbolSize: (data, params) => {
          const item = timelineData[params.dataIndex];
          // 当前播放的节点更大
          const isCurrent = isPlaying.value && params.dataIndex === currentIndex.value;
          return isCurrent ? item.importance * 12 : item.importance * 8;
        },
        data: values.map((val, idx) => {
          const item = timelineData[idx];
          const isCurrent = isPlaying.value && idx === currentIndex.value;
          return {
            value: val,
            itemStyle: {
              color: item.dynasty === '唐代' 
                ? new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
                    { offset: 0, color: isCurrent ? '#ff9999' : '#ff6b6b' },
                    { offset: 1, color: isCurrent ? '#ff4444' : '#c44536' }
                  ])
                : new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
                    { offset: 0, color: isCurrent ? '#ffee58' : '#ffd700' },
                    { offset: 1, color: isCurrent ? '#ffcc00' : '#e6b422' }
                  ]),
              shadowBlur: isCurrent ? 25 : 10,
              shadowColor: isCurrent 
                ? (item.dynasty === '唐代' ? '#ff4444' : '#ffcc00')
                : (item.dynasty === '唐代' ? '#c44536' : '#e6b422'),
              borderWidth: isCurrent ? 3 : 0,
              borderColor: '#fff'
            }
          };
        }),
        animationDelay: (idx) => idx * 100,
        // 添加脉冲动画效果
        emphasis: {
          scale: 1.5,
          itemStyle: {
            shadowBlur: 30,
            borderWidth: 4,
            borderColor: '#fff'
          }
        }
      },
      {
        name: '趋势线',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#c44536' },
            { offset: 0.5, color: '#e6b422' },
            { offset: 1, color: '#daa520' }
          ]),
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(230, 180, 34, 0.5)'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(196, 69, 54, 0.3)' },
            { offset: 1, color: 'rgba(196, 69, 54, 0)' }
          ])
        },
        data: values
      }
    ]
  };
  
  chartInstance.setOption(option);
};

// 播放时间轴
const togglePlay = () => {
  if (isPlaying.value) {
    pausePlay();
  } else {
    startPlay();
  }
};

const startPlay = () => {
  isPlaying.value = true;
  isPaused.value = false;
  emit('playStart');
  
  // 如果已经播放到最后，从头开始
  if (currentIndex.value >= filteredData.value.length - 1) {
    currentIndex.value = 0;
  }
  
  playNextNode();
};

const playNextNode = () => {
  if (!isPlaying.value || isPaused.value) return;
  
  const data = filteredData.value[currentIndex.value];
  emit('timeSelect', data);
  
  // 更新图表以显示当前节点的动画效果
  updateChart();
  
  // 高亮当前点并自动滚动到可视区域
  if (chartInstance) {
    // 显示提示框
    chartInstance.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: currentIndex.value
    });
    
    // 高亮当前点
    chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: currentIndex.value
    });
    
    // 取消之前的高亮
    if (currentIndex.value > 0) {
      chartInstance.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: currentIndex.value - 1
      });
    }
  }
  
  // 检查是否播放完毕
  if (currentIndex.value >= filteredData.value.length - 1) {
    // 播放完毕，延迟后停止
    playTimer.value = setTimeout(() => {
      stopPlay();
    }, playSpeed.value);
  } else {
    // 播放下一个节点
    playTimer.value = setTimeout(() => {
      currentIndex.value++;
      playNextNode();
    }, playSpeed.value);
  }
};

const pausePlay = () => {
  isPaused.value = true;
  isPlaying.value = false;
  if (playTimer.value) {
    clearTimeout(playTimer.value);
    playTimer.value = null;
  }
};

const stopPlay = () => {
  isPlaying.value = false;
  isPaused.value = false;
  emit('playEnd');
  if (playTimer.value) {
    clearTimeout(playTimer.value);
    playTimer.value = null;
  }
  // 重置高亮
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    });
  }
};

// 跳转到指定节点
const jumpToNode = (index) => {
  if (index < 0 || index >= filteredData.value.length) return;
  
  currentIndex.value = index;
  const data = filteredData.value[currentIndex.value];
  emit('timeSelect', data);
  
  // 更新图表以显示当前节点的动画效果
  updateChart();
  
  if (chartInstance) {
    chartInstance.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: currentIndex.value
    });
    
    // 高亮当前点
    chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: currentIndex.value
    });
  }
};

// 上一个节点
const previousNode = () => {
  if (currentIndex.value > 0) {
    jumpToNode(currentIndex.value - 1);
  }
};

// 下一个节点
const nextNode = () => {
  if (currentIndex.value < filteredData.value.length - 1) {
    jumpToNode(currentIndex.value + 1);
  }
};

// 筛选功能
const filterByDynasty = (dynasty) => {
  selectedDynasty.value = dynasty;
  selectedPeriod.value = 'all';
  updateChart();
  emit('periodFilter', { dynasty, period: 'all' });
};

const filterByPeriod = (period) => {
  selectedPeriod.value = period;
  updateChart();
  emit('periodFilter', { dynasty: selectedDynasty.value, period });
};

// 高亮时期
const highlightPeriod = (period) => {
  // 可以在这里添加高亮逻辑
};

// 监听数据变化
watch(() => props.palaces, () => {
  updateChart();
}, { deep: true });

// 监听筛选变化
watch([selectedDynasty, selectedPeriod], () => {
  updateChart();
});

onMounted(() => {
  initChart();
  window.addEventListener('resize', () => {
    chartInstance?.resize();
  });
});

onUnmounted(() => {
  stopPlay();
  try {
    chartInstance?.dispose();
  } catch (e) {
    // 忽略已被销毁的实例
  }
  window.removeEventListener('resize', () => {
    chartInstance?.resize();
  });
});
</script>

<template>
  <div class="timeline-enhanced-container">
    <!-- 播放进度条 -->
    <div class="play-progress-container" v-if="isPlaying || isPaused">
      <div class="progress-info">
        <span class="current-node" v-if="currentNode">
          {{ currentNode.year }}年 · {{ currentNode.title }}
        </span>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ filteredData.length }}</span>
      </div>
      <el-progress 
        :percentage="playProgress" 
        :stroke-width="8"
        :show-text="false"
        class="play-progress-bar"
      />
    </div>
    
    <!-- 控制栏 -->
    <div class="timeline-controls">
      <!-- 播放控制 -->
      <div class="control-group play-controls">
        <el-button 
          type="info" 
          @click="previousNode"
          :disabled="currentIndex <= 0"
          class="step-btn"
        >
          <el-icon><Arrow-Left-Bold /></el-icon>
        </el-button>
        
        <el-button 
          :type="isPlaying ? 'danger' : 'primary'"
          @click="togglePlay"
          class="play-btn"
        >
          <el-icon>
            <component :is="isPlaying ? VideoPause : isPaused ? RefreshRight : VideoPlay" />
          </el-icon>
          {{ isPlaying ? '暂停' : isPaused ? '继续' : '播放' }}
        </el-button>
        
        <el-button 
          type="info" 
          @click="nextNode"
          :disabled="currentIndex >= filteredData.length - 1"
          class="step-btn"
        >
          <el-icon><Arrow-Right-Bold /></el-icon>
        </el-button>
        
        <el-button 
          type="warning" 
          @click="stopPlay"
          v-if="isPlaying || isPaused"
          class="stop-btn"
        >
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
      
      <!-- 速度控制 -->
      <div class="control-group">
        <span class="control-label">播放速度：</span>
        <el-radio-group v-model="playSpeed" size="small">
          <el-radio-button v-for="speed in speedOptions" :key="speed.value" :value="speed.value">
            {{ speed.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 朝代筛选 -->
      <div class="control-group">
        <span class="control-label">朝代筛选：</span>
        <el-radio-group v-model="selectedDynasty" @change="filterByDynasty">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="tang">唐代</el-radio-button>
          <el-radio-button value="song">宋代</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 时期筛选 -->
      <div class="control-group" v-if="selectedDynasty !== 'all'">
        <span class="control-label">时期筛选：</span>
        <el-select v-model="selectedPeriod" @change="filterByPeriod" placeholder="选择时期">
          <el-option label="全部" value="all" />
          <template v-if="selectedDynasty === 'tang'">
            <el-option v-for="p in periods.tang" :key="p.key" :label="p.label" :value="p.label" />
          </template>
          <template v-else>
            <el-option v-for="p in periods.song" :key="p.key" :label="p.label" :value="p.label" />
          </template>
        </el-select>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div ref="chartRef" class="timeline-chart"></div>
    
    <!-- 图例说明 -->
    <div class="timeline-legend">
      <div class="legend-item">
        <span class="legend-dot tang"></span>
        <span>唐代宫殿</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot song"></span>
        <span>宋代宫殿</span>
      </div>
      <div class="legend-item">
        <span class="legend-line"></span>
        <span>发展趋势</span>
      </div>
    </div>
    
    <!-- 统计信息 -->
    <div class="timeline-stats">
      <div class="stat-item">
        <div class="stat-value">{{ filteredData.length }}</div>
        <div class="stat-label">历史节点</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ filteredData.filter(d => d.dynasty === '唐代').length }}</div>
        <div class="stat-label">唐代事件</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ filteredData.filter(d => d.dynasty === '宋代').length }}</div>
        <div class="stat-label">宋代事件</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-enhanced-container {
  background: var(--card-bg, rgba(20, 25, 35, 0.8));
  border-radius: 12px;
  padding: 30px;
  border: 1px solid var(--border-color, rgba(196, 69, 54, 0.3));
  width: 100%;
  box-sizing: border-box;
}

/* 播放进度条 */
.play-progress-container {
  margin-bottom: 15px;
  padding: 15px;
  background: var(--bg-color-overlay, rgba(0, 0, 0, 0.3));
  border-radius: 8px;
  border: 1px solid var(--border-color-light, rgba(196, 69, 54, 0.2));
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.current-node {
  color: var(--text-accent, #e6b422);
  font-size: 14px;
  font-weight: bold;
}

.progress-text {
  color: var(--text-muted, #aaa);
  font-size: 12px;
}

.play-progress-bar {
  width: 100%;
}

:deep(.play-progress-bar .el-progress-bar__outer) {
  background-color: var(--border-color-light, rgba(196, 69, 54, 0.2));
}

:deep(.play-progress-bar .el-progress-bar__inner) {
  background: linear-gradient(90deg, var(--el-color-primary, #c44536), var(--el-color-success, #e6b422));
  transition: width 0.3s ease;
}

.timeline-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color-light, rgba(196, 69, 54, 0.2));
  justify-content: center;
}

.play-controls {
  display: flex;
  gap: 8px;
}

.step-btn {
  padding: 8px 12px;
}

.stop-btn {
  margin-left: 10px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  color: var(--text-muted, #aaa);
  font-size: 14px;
}

.play-btn {
  background: linear-gradient(135deg, var(--el-color-primary, #c44536), var(--el-color-success, #e6b422));
  border: none;
  color: white;
}

.play-btn:hover {
  background: linear-gradient(135deg, var(--el-color-success, #e6b422), var(--el-color-primary, #c44536));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 69, 54, 0.4);
}

.timeline-chart {
  width: 100%;
  height: 500px;
  margin-bottom: 15px;
}

/* 当前播放节点的脉冲动画 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 节点高亮时的发光效果 */
:deep(.echarts-scatter-current) {
  animation: pulse 1s ease-in-out infinite;
}

.timeline-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 15px;
  background: var(--bg-color-overlay, rgba(0, 0, 0, 0.2));
  border-radius: 8px;
  margin-bottom: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, #fff);
  font-size: 14px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.tang {
  background: linear-gradient(135deg, #ff6b6b, #c44536);
  box-shadow: 0 0 8px rgba(196, 69, 54, 0.6);
}

.legend-dot.song {
  background: linear-gradient(135deg, #ffd700, #e6b422);
  box-shadow: 0 0 8px rgba(230, 180, 34, 0.6);
}

.legend-line {
  width: 20px;
  height: 3px;
  background: linear-gradient(90deg, #c44536, #e6b422);
  border-radius: 2px;
}

.timeline-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: rgba(196, 69, 54, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(196, 69, 54, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-accent, #e6b422);
  text-shadow: 0 0 10px rgba(230, 180, 34, 0.5);
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted, #aaa);
  margin-top: 5px;
}

:deep(.el-radio-button__inner) {
  background: rgba(20, 25, 35, 0.8);
  border-color: #c44536;
  color: #fff;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #c44536, #e6b422);
  border-color: #c44536;
  box-shadow: none;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(20, 25, 35, 0.8);
  box-shadow: 0 0 0 1px #c44536 inset;
}

:deep(.el-select .el-input__inner) {
  color: #fff;
}
</style>
