<template>
  <div class="skeleton-card">
    <el-skeleton :rows="5" animated>
      <template #template>
        <div class="skeleton-header">
          <el-skeleton-item variant="text" style="width: 60%; height: 24px;" />
          <el-skeleton-item variant="button" style="width: 50px; height: 24px;" />
        </div>
        <div class="skeleton-content">
          <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 12px;" />
          <el-skeleton-item variant="text" style="width: 60%; margin-bottom: 12px;" />
          <el-skeleton-item variant="text" style="width: 70%; margin-bottom: 12px;" />
          <el-skeleton-item variant="text" style="width: 90%;" />
        </div>
        <div class="skeleton-footer">
          <el-skeleton-item variant="text" style="width: 40%;" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.skeleton-card {
  background: var(--card-bg);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 1.5rem;
  min-height: 280px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.skeleton-content {
  margin-bottom: 1rem;
}

.skeleton-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(196, 69, 54, 0.2);
}
</style>
