<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits(['timePeriodClick']);

// 唐宋宫殿建筑发展历程时间轴数据
const timelineData = [
  {
    time: '634年',
    title: '大明宫始建',
    content: '唐太宗贞观八年，大明宫开始建造，是唐代最宏伟的宫殿建筑群',
    dynasty: '唐代',
    period: '初唐'
  },
  {
    time: '662年',
    title: '大明宫落成',
    content: '大明宫建成，成为唐代皇帝的主要居所，是当时世界上最大的宫殿',
    dynasty: '唐代',
    period: '初唐'
  },
  {
    time: '684年',
    title: '洛阳宫扩建',
    content: '武则天时期，洛阳宫大规模扩建，成为东都的政治中心',
    dynasty: '唐代',
    period: '初唐'
  },
  {
    time: '714年',
    title: '兴庆宫建成',
    content: '唐玄宗时期，兴庆宫建成，成为皇帝的离宫，以豪华著称',
    dynasty: '唐代',
    period: '盛唐'
  },
  {
    time: '896年',
    title: '大明宫被毁',
    content: '黄巢起义后，大明宫被烧毁，标志着唐代宫殿建筑的衰落',
    dynasty: '唐代',
    period: '晚唐'
  },
  {
    time: '960年',
    title: '宋朝建立',
    content: '宋朝建立，开始重建宫殿建筑，风格趋于秀丽典雅',
    dynasty: '宋代',
    period: '北宋'
  },
  {
    time: '976年',
    title: '东京宫城建成',
    content: '北宋东京宫城建成，是宋代政治中心，建筑风格更加精致',
    dynasty: '宋代',
    period: '北宋'
  },
  {
    time: '1138年',
    title: '临安宫城建成',
    content: '南宋定都临安，建造临安宫城，规模虽小但工艺精湛',
    dynasty: '宋代',
    period: '南宋'
  }
];

const handleTimePeriodClick = (period) => {
  emit('timePeriodClick', period);
};
</script>

<template>
  <div class="timeline-container">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in timelineData"
        :key="index"
        :type="item.dynasty === '唐代' ? 'danger' : 'warning'"
        :timestamp="item.time"
        placement="top"
        icon="el-icon-circle"
      >
        <el-card class="timeline-card" @click="handleTimePeriodClick(item.period)">
          <div class="timeline-content">
            <h4 class="timeline-title"><span class="timeline-dot"></span>{{ item.title }}</h4>
            <p class="timeline-description">{{ item.content }}</p>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped>
.timeline-container {
  padding: 1rem 0;
}

.timeline-card {
  background: rgba(20, 25, 35, 0.8);
  border: 1px solid rgba(196, 69, 54, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.timeline-card:hover {
  transform: translateX(10px);
  box-shadow: 0 5px 15px rgba(196, 69, 54, 0.3);
  border-color: rgba(230, 180, 34, 0.5);
}

.timeline-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e6b422;
  flex-shrink: 0;
}

.timeline-description {
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.5;
}

.el-timeline-item__timestamp {
  color: var(--el-text-color-secondary);
  font-family: 'Noto Serif SC', serif;
}

/* 时间轴圆点样式 */
:deep(.el-timeline-item__node) {
  width: 12px !important;
  height: 12px !important;
  background: #c44536 !important;
  border: 2px solid #c44536 !important;
  box-shadow: 0 0 0 2px rgba(196, 69, 54, 0.3) !important;
}

:deep(.el-timeline-item__line) {
  width: 2px !important;
  background: rgba(196, 69, 54, 0.3) !important;
}
</style>