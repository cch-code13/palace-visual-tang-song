<script setup>
import { usePalaceStore } from '@/stores/palace';
import { ref, computed, onMounted } from 'vue';
import CardPalaceItem from './CardPalaceItem.vue';
import PalaceDetailDrawer from './PalaceDetailDrawer.vue';
import { Star, StarFilled, Delete, ArrowUp, ArrowDown, Filter } from '@element-plus/icons-vue';
import { ElMessage, ElEmpty, ElSelect, ElOption } from 'element-plus';

const store = usePalaceStore();

const sortBy = ref('time'); // time, dynasty, buildTime
const sortOrder = ref('desc'); // asc, desc
const dynastyFilter = ref(''); // '', '唐代', '宋代'
const drawerVisible = ref(false);
const selectedPalace = ref(null);

// 计算已收藏的宫殿
const favoritePalaces = computed(() => {
  // 创建数组副本，避免修改原始数据
  let result = [...store.favoritePalaces];
  
  // 朝代筛选
  if (dynastyFilter.value) {
    result = result.filter(palace => palace.dynasty === dynastyFilter.value);
  }
  
  // 排序
  if (sortBy.value === 'time') {
    // 按收藏时间排序
    result.sort((a, b) => {
      const favA = store.favorites.find(f => f.id === a.id);
      const favB = store.favorites.find(f => f.id === b.id);
      const timeA = favA ? new Date(favA.timestamp).getTime() : 0;
      const timeB = favB ? new Date(favB.timestamp).getTime() : 0;
      return sortOrder.value === 'desc' ? timeB - timeA : timeA - timeB;
    });
  } else if (sortBy.value === 'dynasty') {
    // 按朝代排序
    result.sort((a, b) => {
      if (sortOrder.value === 'asc') {
        return a.dynasty.localeCompare(b.dynasty);
      } else {
        return b.dynasty.localeCompare(a.dynasty);
      }
    });
  } else if (sortBy.value === 'buildTime') {
    // 按建造时间排序
    result.sort((a, b) => {
      // 提取建造年份，处理不同格式
      const getBuildYear = (palace) => {
        if (palace.buildYear) {
          const yearMatch = palace.buildYear.match(/\d+/);
          return yearMatch ? parseInt(yearMatch[0]) : 0;
        } else if (palace.yearBuilt) {
          const yearMatch = palace.yearBuilt.match(/\d+/);
          return yearMatch ? parseInt(yearMatch[0]) : 0;
        }
        return 0;
      };
      
      const yearA = getBuildYear(a);
      const yearB = getBuildYear(b);
      return sortOrder.value === 'desc' ? yearB - yearA : yearA - yearB;
    });
  }
  
  return result;
});

// 切换排序方式
const toggleSortBy = (newSortBy) => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = newSortBy;
    sortOrder.value = 'desc';
  }
};

// 移除收藏
const removeFavorite = (palace) => {
  const success = store.removeFavorite(palace.id);
  if (success) {
    ElMessage({
      message: '已取消收藏',
      type: 'success',
      duration: 1500
    });
  }
};

// 处理宫殿点击
const handlePalaceClick = (palace) => {
  selectedPalace.value = palace;
  drawerVisible.value = true;
};

// 关闭抽屉
const handleDrawerClose = () => {
  drawerVisible.value = false;
  selectedPalace.value = null;
};

// 处理宫殿切换
const handleChangePalace = (palace) => {
  selectedPalace.value = palace;
};

// 处理定位到地图
const handleLocate = (palace) => {
  // 触发全局定位事件
  window.dispatchEvent(new CustomEvent('locate-palace', { 
    detail: { palace } 
  }));
};
</script>

<template>
  <div class="favorites-container">
    <div class="favorites-header">
      <h2 class="favorites-title">
        <el-icon><StarFilled /></el-icon>
        我的收藏
      </h2>
      <div class="favorites-count">
        共 {{ favoritePalaces.length }} 个收藏
      </div>
    </div>
    
    <div class="favorites-toolbar">
      <div class="controls-container">
        <div class="sort-controls">
          <span class="sort-label">排序：</span>
          <el-button 
            type="text" 
            @click="toggleSortBy('time')"
            :class="{ active: sortBy === 'time' }"
          >
            收藏时间
            <el-icon v-if="sortBy === 'time' && sortOrder === 'asc'">
              <ArrowUp />
            </el-icon>
            <el-icon v-else-if="sortBy === 'time' && sortOrder === 'desc'">
              <ArrowDown />
            </el-icon>
          </el-button>
          <el-button 
            type="text" 
            @click="toggleSortBy('dynasty')"
            :class="{ active: sortBy === 'dynasty' }"
          >
            朝代
            <el-icon v-if="sortBy === 'dynasty' && sortOrder === 'asc'">
              <ArrowUp />
            </el-icon>
            <el-icon v-else-if="sortBy === 'dynasty' && sortOrder === 'desc'">
              <ArrowDown />
            </el-icon>
          </el-button>
          <el-button 
            type="text" 
            @click="toggleSortBy('buildTime')"
            :class="{ active: sortBy === 'buildTime' }"
          >
            建造时间
            <el-icon v-if="sortBy === 'buildTime' && sortOrder === 'asc'">
              <ArrowUp />
            </el-icon>
            <el-icon v-else-if="sortBy === 'buildTime' && sortOrder === 'desc'">
              <ArrowDown />
            </el-icon>
          </el-button>
        </div>
        <div class="filter-controls">
          <span class="filter-label">朝代：</span>
          <el-select v-model="dynastyFilter" placeholder="全部" size="small" style="width: 100px;">
            <el-option label="全部" value="" />
            <el-option label="唐代" value="唐代" />
            <el-option label="宋代" value="宋代" />
          </el-select>
        </div>
      </div>
    </div>
    
    <div v-if="favoritePalaces.length === 0" class="empty-favorites">
      <ElEmpty 
        description="暂无收藏内容"
        :image-size="200"
      />
      <p class="empty-tip">浏览宫殿详情，点击星标即可收藏</p>
    </div>
    
    <div v-else class="favorites-grid">
      <div v-for="palace in favoritePalaces" :key="palace.id" class="favorite-item">
        <CardPalaceItem :poet="palace" @click="handlePalaceClick" />
        <el-button
          type="danger"
          size="small"
          @click="removeFavorite(palace)"
          class="remove-btn"
        >
          <el-icon><Delete /></el-icon>
          取消收藏
        </el-button>
      </div>
    </div>
    
    <!-- 宫殿详情抽屉 -->
    <PalaceDetailDrawer
      v-model:visible="drawerVisible"
      :palace="selectedPalace"
      :palaces="favoritePalaces"
      @close="handleDrawerClose"
      @change-palace="handleChangePalace"
      @locate="handleLocate"
    />
  </div>
</template>

<style scoped>
.favorites-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--el-border-color);
}

.favorites-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.favorites-count {
  color: var(--text-body);
  font-size: 1rem;
}

.favorites-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.controls-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  justify-content: space-between;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label,
.filter-label {
  color: var(--text-body);
  font-size: 0.9rem;
}

.sort-controls .el-button.active {
  color: var(--text-accent);
  font-weight: 500;
}

.empty-favorites {
  text-align: center;
  padding: 4rem 0;
}

.empty-tip {
  margin-top: 1rem;
  color: var(--text-body);
  font-size: 1rem;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.favorite-item {
  position: relative;
}

.remove-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 10;
}

@media (max-width: 768px) {
  .favorites-container {
    padding: 1rem;
  }
  
  .favorites-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .favorites-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .controls-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .sort-controls {
    flex-wrap: wrap;
  }
  
  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>