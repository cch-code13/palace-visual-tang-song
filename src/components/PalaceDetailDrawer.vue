<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePalaceStore } from '@/stores/palace';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Position, Star, StarFilled, Location, Calendar, DataLine, OfficeBuilding, User, HomeFilled, Clock, Trophy, Picture } from '@element-plus/icons-vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  palace: {
    type: Object,
    default: null
  },
  palaces: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'close', 'change-palace', 'locate']);

const store = usePalaceStore();
const isDarkMode = ref(false);
const isLocating = ref(false);

// 计算朝代主题色
const dynastyColor = computed(() => {
  if (!props.palace) return '';
  if (props.palace.dynasty === '唐代') {
    return '#c44536'; // 唐代红色
  } else if (props.palace.dynasty === '宋代') {
    return '#B8860B'; // 宋代黄色
  } else {
    return '#4a90e2'; // 其他朝代蓝色
  }
});

// 计算是否为收藏状态
const isFavorite = computed(() => {
  if (!props.palace) return false;
  return store.isFavorite(props.palace.id);
});

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 显示时添加ESC键监听
    document.addEventListener('keydown', handleKeydown);
  } else {
    // 隐藏时移除ESC键监听
    document.removeEventListener('keydown', handleKeydown);
  }
});

// 处理ESC键
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    closeDrawer();
  }
};

// 关闭抽屉
const closeDrawer = () => {
  emit('update:visible', false);
  emit('close');
};

// 点击遮罩层关闭
const handleMaskClick = () => {
  closeDrawer();
};

// 点击面板内容不触发遮罩层关闭
const handlePanelClick = (event) => {
  event.stopPropagation();
};

// 定位至地图
const locateOnMap = () => {
  if (!props.palace || isLocating.value) return;
  
  isLocating.value = true;
  
  ElMessage({
    message: `正在定位到 ${props.palace.name}`,
    type: 'info',
    duration: 1500
  });
  
  emit('locate', props.palace);
  
  setTimeout(() => {
    closeDrawer();
    isLocating.value = false;
  }, 100);
};

// 切换到上一个宫殿
const goToPreviousPalace = () => {
  if (!props.palace || props.palaces.length === 0) return;
  
  if (props.palaces.length === 1) {
    // 只有一个宫殿时，显示提示
    ElMessage({
      message: '⚠️ 这是唯一的宫殿，无法切换',
      type: 'warning',
      duration: 1500
    });
    return;
  }
  
  const currentIndex = props.palaces.findIndex(p => p.id === props.palace.id);
  if (currentIndex > 0) {
    const previousPalace = props.palaces[currentIndex - 1];
    emit('change-palace', previousPalace);
  } else {
    // 如果是第一个，就切换到最后一个
    const lastPalace = props.palaces[props.palaces.length - 1];
    emit('change-palace', lastPalace);
  }
};

// 切换到下一个宫殿
const goToNextPalace = () => {
  if (!props.palace || props.palaces.length === 0) return;
  
  if (props.palaces.length === 1) {
    // 只有一个宫殿时，显示提示
    ElMessage({
      message: '⚠️ 这是唯一的宫殿，无法切换',
      type: 'warning',
      duration: 1500
    });
    return;
  }
  
  const currentIndex = props.palaces.findIndex(p => p.id === props.palace.id);
  if (currentIndex < props.palaces.length - 1) {
    const nextPalace = props.palaces[currentIndex + 1];
    emit('change-palace', nextPalace);
  } else {
    // 如果是最后一个，就切换到第一个
    const firstPalace = props.palaces[0];
    emit('change-palace', firstPalace);
  }
};

// 取消收藏
const removeFavorite = () => {
  if (props.palace) {
    ElMessageBox.confirm(
      `确定要取消收藏 ${props.palace.name} 吗？`,
      '取消收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const success = store.removeFavorite(props.palace.id);
      if (success) {
        ElMessage({
          message: '已取消收藏',
          type: 'success'
        });
        // 取消收藏成功后关闭弹窗
        closeDrawer();
      }
    }).catch(() => {
      // 取消操作
    });
  }
};

// 生命周期
onMounted(() => {
  // 检测深色模式
  isDarkMode.value = document.documentElement.classList.contains('dark');
});

onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="drawer-overlay" @click="handleMaskClick">
      <div 
        class="drawer-panel" 
        @click="handlePanelClick"
        :style="{
          borderLeftColor: dynastyColor
        }"
      >
        <!-- 顶部栏 -->
        <div class="drawer-header">
          <div class="header-left">
            <h2 class="palace-name">{{ palace?.name }}</h2>
            <el-tag 
              :type="palace?.dynasty === '唐代' ? 'danger' : (palace?.dynasty === '宋代' ? 'warning' : 'primary')" 
              effect="dark"
            >
              {{ palace?.dynasty }}
            </el-tag>
          </div>
          <el-button 
            type="text" 
            class="close-button" 
            @click="closeDrawer"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <!-- 面板内容 -->
        <div class="drawer-content">
          <!-- 基础信息区 -->
          <div class="info-section">
            <h3 class="section-title">基础信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <el-icon class="info-icon"><Location /></el-icon>
                <span class="info-label">位置</span>
                <span class="info-value">{{ palace?.location }}</span>
              </div>
              <div class="info-item">
                <el-icon class="info-icon"><Calendar /></el-icon>
                <span class="info-label">始建年代</span>
                <span class="info-value">{{ palace?.buildYear || palace?.yearBuilt || '未知' }}</span>
              </div>
              <div class="info-item">
                <el-icon class="info-icon"><DataLine /></el-icon>
                <span class="info-label">面积</span>
                <span class="info-value">{{ palace?.area }}</span>
              </div>
              <div class="info-item">
                <el-icon class="info-icon"><OfficeBuilding /></el-icon>
                <span class="info-label">建筑风格</span>
                <span class="info-value">{{ palace?.style || '未知' }}</span>
              </div>
              <div class="info-item">
                <el-icon class="info-icon"><Trophy /></el-icon>
                <span class="info-label">文物等级</span>
                <span class="info-value">{{ palace?.culturalLevel || '未知' }}</span>
              </div>
            </div>
            
            <!-- 坐标信息 -->
            <div class="coordinate-info">
              <h4 class="sub-section-title">坐标信息</h4>
              <div class="coordinate-details">
                <p>坐标：{{ palace?.lng || 0 }}, {{ palace?.lat || 0 }}</p>
                <p>来源：{{ palace?.coordinateSource || '未知' }}</p>
                <p>精度：{{ palace?.coordinateAccuracy || '未知' }}</p>
              </div>
            </div>
          </div>
          
          <!-- 核心概览卡片 -->
          <div class="overview-section">
            <h3 class="section-title">核心概览</h3>
            <div class="overview-cards">
              <div class="overview-card">
                <el-icon class="card-icon"><OfficeBuilding /></el-icon>
                <div class="card-content">
                  <div class="card-label">主殿</div>
                  <div class="card-value">{{ palace?.mainHall || '未知' }}</div>
                </div>
              </div>
              <div class="overview-card">
                <el-icon class="card-icon"><Clock /></el-icon>
                <div class="card-content">
                  <div class="card-label">建造时期</div>
                  <div class="card-value">{{ palace?.constructionEra || '未知' }}</div>
                </div>
              </div>
              <div class="overview-card">
                <el-icon class="card-icon"><User /></el-icon>
                <div class="card-content">
                  <div class="card-label">关联帝王</div>
                  <div class="card-value">{{ palace?.associatedEmperor || '未知' }}</div>
                </div>
              </div>
              <div class="overview-card">
                <el-icon class="card-icon"><HomeFilled /></el-icon>
                <div class="card-content">
                  <div class="card-label">开间规制</div>
                  <div class="card-value">{{ palace?.dimensions || '未知' }}</div>
                </div>
              </div>
              <div class="overview-card">
                <el-icon class="card-icon"><OfficeBuilding /></el-icon>
                <div class="card-content">
                  <div class="card-label">屋顶样式</div>
                  <div class="card-value">{{ palace?.roofStyle || '未知' }}</div>
                </div>
              </div>
              <div class="overview-card">
                <el-icon class="card-icon"><Trophy /></el-icon>
                <div class="card-content">
                  <div class="card-label">保存现状</div>
                  <div class="card-value">{{ palace?.preservationStatus || '未知' }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 详细内容区 -->
          <div class="detail-section">
            <h3 class="section-title">详细信息</h3>
            
            <div class="detail-item">
              <h4 class="detail-title">历史背景</h4>
              <p class="detail-content">{{ palace?.historicalBackground || '暂无信息' }}</p>
            </div>
            
            <div class="detail-item">
              <h4 class="detail-title">建筑特点</h4>
              <p class="detail-content">{{ palace?.architecturalFeatures || '暂无信息' }}</p>
            </div>
            
            <div class="detail-item">
              <h4 class="detail-title">文化价值</h4>
              <p class="detail-content">{{ palace?.culturalSignificance || palace?.value || '暂无信息' }}</p>
            </div>
            
            <div class="detail-item poem-section">
              <h4 class="detail-title">
                <el-icon><Picture /></el-icon>
                相关诗句
              </h4>
              <p class="detail-content poem-content">{{ palace?.relatedPoem || '暂无诗句' }}</p>
            </div>
          </div>
        </div>
        
        <!-- 底部操作栏 -->
        <div class="drawer-footer">
          <div class="navigation-buttons">
            <el-button 
              type="text" 
              @click="goToPreviousPalace"
              :style="{
                color: dynastyColor
              }"
            >
              &lt; 上一个
            </el-button>
            <el-button 
              type="text" 
              @click="goToNextPalace"
              :style="{
                color: dynastyColor
              }"
            >
              下一个 &gt;
            </el-button>
          </div>
          <el-button 
            type="primary" 
            @click="locateOnMap"
            :style="{
              backgroundColor: dynastyColor,
              borderColor: dynastyColor
            }"
            :loading="isLocating"
            :disabled="isLocating"
          >
            <el-icon><Position /></el-icon>
            {{ isLocating ? '定位中...' : '定位至地图' }}
          </el-button>
          <el-button 
            type="danger" 
            @click="removeFavorite"
          >
            <el-icon><Star /></el-icon>
            取消收藏
          </el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

.drawer-panel {
  width: 35%;
  min-width: 400px;
  max-width: 600px;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
  border-left: 4px solid #c44536;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  overflow: hidden;
}

/* 深色主题 */
.dark .drawer-panel {
  background-color: rgba(20, 25, 35, 0.95);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.5);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* 顶部栏 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eaeaea;
  background-color: rgba(255, 255, 255, 0.9);
}

.dark .drawer-header {
  border-bottom: 1px solid #333;
  background-color: rgba(30, 35, 45, 0.9);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.palace-name {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.close-button {
  font-size: 1.2rem;
  color: var(--text-body);
}

.close-button:hover {
  color: var(--text-accent);
}

/* 内容区域 */
.drawer-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.drawer-content::-webkit-scrollbar {
  width: 6px;
}

.drawer-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dark .drawer-content::-webkit-scrollbar-track {
  background: #2a2a2a;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: #c44536;
  border-radius: 3px;
}

.dark .drawer-content::-webkit-scrollbar-thumb {
  background: #e6b422;
}

/* 信息区域 */
.info-section {
  margin-bottom: 2rem;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  border-bottom: 2px solid var(--text-accent);
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: rgba(245, 245, 245, 0.8);
  border-radius: 8px;
}

.dark .info-item {
  background-color: rgba(40, 45, 55, 0.8);
}

.info-icon {
  color: var(--text-accent);
  font-size: 1.1rem;
  margin-top: 2px;
}

.info-label {
  font-size: 0.85rem;
  color: var(--text-body);
  min-width: 60px;
}

.info-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
}

.coordinate-info {
  padding: 1rem;
  background-color: rgba(240, 240, 240, 0.8);
  border-radius: 8px;
  border-left: 4px solid var(--text-accent);
}

.dark .coordinate-info {
  background-color: rgba(35, 40, 50, 0.8);
}

.sub-section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.coordinate-details p {
  font-size: 0.85rem;
  margin: 0.25rem 0;
  color: var(--text-body);
}

/* 概览卡片 */
.overview-section {
  margin-bottom: 2rem;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: rgba(245, 245, 245, 0.8);
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.dark .overview-card {
  background-color: rgba(40, 45, 55, 0.8);
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  color: var(--text-accent);
  font-size: 1.2rem;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.8rem;
  color: var(--text-body);
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* 详细内容 */
.detail-section {
  margin-bottom: 1rem;
}

.detail-item {
  margin-bottom: 1.5rem;
}

.detail-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-body);
  margin: 0;
  text-align: justify;
}

/* 诗句部分 */
.poem-section {
  border-left: 4px solid var(--text-accent);
  padding-left: 1rem;
}

.poem-content {
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  font-style: italic;
  color: var(--text-accent);
  text-align: center;
  padding: 1rem;
  background-color: rgba(245, 245, 245, 0.5);
  border-radius: 8px;
}

.dark .poem-content {
  background-color: rgba(40, 45, 55, 0.5);
}

/* 底部操作栏 */
.drawer-footer {
  padding: 1.5rem;
  border-top: 1px solid #eaeaea;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.dark .drawer-footer {
  border-top: 1px solid #333;
  background-color: rgba(30, 35, 45, 0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .drawer-panel {
    width: 90%;
    min-width: 300px;
  }
  
  .info-grid,
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .drawer-header {
    padding: 1rem;
  }
  
  .palace-name {
    font-size: 1.2rem;
  }
  
  .drawer-content {
    padding: 1rem;
  }
  
  .drawer-footer {
    padding: 1rem;
    flex-direction: column;
  }
  
  .drawer-footer .el-button {
    width: 100%;
  }
}
</style>