<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <el-icon class="error-icon"><Warning-Filled /></el-icon>
      <h3 class="error-title">数据加载异常</h3>
      <p class="error-message">{{ errorMessage }}</p>
      <el-button type="primary" @click="retry" class="retry-btn">
        <el-icon><Refresh-Right /></el-icon>
        重新加载
      </el-button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import { WarningFilled, RefreshRight } from '@element-plus/icons-vue';

const hasError = ref(false);
const errorMessage = ref('');

onErrorCaptured((err) => {
  hasError.value = true;
  errorMessage.value = err.message || '未知错误';
  console.error('组件错误:', err);
  return false;
});

const retry = () => {
  hasError.value = false;
  errorMessage.value = '';
  window.location.reload();
};
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 25, 35, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(196, 69, 54, 0.3);
}

.error-content {
  text-align: center;
  padding: 40px;
}

.error-icon {
  font-size: 48px;
  color: #c44536;
  margin-bottom: 20px;
}

.error-title {
  color: #fff;
  font-size: 18px;
  margin-bottom: 10px;
}

.error-message {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 20px;
}

.retry-btn {
  background: linear-gradient(135deg, #c44536, #e6b422);
  border: none;
}
</style>
