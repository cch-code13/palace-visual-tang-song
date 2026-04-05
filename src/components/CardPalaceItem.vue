<script setup>
const props = defineProps({
  poet: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click', props.poet);
};
</script>

<template>
  <el-card class="poet-card" :body-style="{ padding: '1.5rem' }" @click="handleClick" :data-palace-id="props.poet.id">
    <div class="poet-header">
      <h3 class="poet-name">{{ props.poet.name }}</h3>
      <el-tag :type="props.poet.dynasty === '唐代' ? 'danger' : 'warning'" effect="dark" size="small">
        {{ props.poet.dynasty }}
      </el-tag>
    </div>
    <div class="poet-info">
      <p class="poet-province">
        <el-icon><i class="el-icon-location"></i></el-icon>
        {{ props.poet.location }}
      </p>
      <p class="poet-works">
        <el-icon><i class="el-icon-date"></i></el-icon>
        建造年份: {{ props.poet.yearBuilt }}
      </p>
      <p class="poet-works">
        <el-icon><i class="el-icon-data-line"></i></el-icon>
        建筑面积: {{ props.poet.area }} 平方千米
      </p>
      <div class="poet-works-list" v-if="props.poet.features && props.poet.features.length > 0">
        <p class="works-title">
          <el-icon><i class="el-icon-building"></i></el-icon>
          主要建筑
        </p>
        <ul class="works-list">
          <li v-for="(feature, index) in props.poet.features" :key="index">
            {{ feature }}
          </li>
        </ul>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.poet-card {
  background: var(--card-bg);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 0;
  position: relative;
}

.poet-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(90deg, var(--text-accent-alt), var(--text-accent), var(--text-accent-alt));
  mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: border-flow 3s linear infinite;
}

.poet-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: var(--theme-shadow), 0 0 40px rgba(230, 180, 34, 0.6), 0 0 20px rgba(196, 69, 54, 0.4), 0 0 60px rgba(230, 180, 34, 0.3);
  filter: brightness(1.1);
}

.poet-card:hover::before {
  opacity: 1;
  background: linear-gradient(90deg, var(--text-accent-alt), var(--text-accent), var(--text-accent-alt), var(--text-accent), var(--text-accent-alt));
  animation: border-flow 1.5s linear infinite;
}

.poet-card:hover .poet-name {
  color: var(--text-accent);
  text-shadow: 0 0 10px rgba(230, 180, 34, 0.8);
  transition: all 0.3s ease;
}

/* 深色主题下的调整 */
.dark .poet-card:hover .poet-name {
  color: #FFD700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
}

@keyframes border-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 扩大点击区域 */
.poet-card >>> .el-card__body {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.poet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.poet-name {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.poet-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.poet-province, .poet-works {
  color: var(--text-body);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.poet-works-list {
  margin-top: 1rem;
  border-top: 1px solid rgba(196, 69, 54, 0.2);
  padding-top: 1rem;
}

.works-title {
  color: var(--text-accent-alt);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.works-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.works-list li {
  color: var(--text-body);
  font-size: 0.85rem;
  line-height: 1.4;
  padding-left: 1rem;
  position: relative;
}

.works-list li::before {
  content: "•";
  color: var(--text-accent-alt);
  position: absolute;
  left: 0;
}

.el-icon {
  color: var(--text-accent-alt);
}
</style>