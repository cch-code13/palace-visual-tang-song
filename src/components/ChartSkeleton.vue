<template>
  <div class="chart-skeleton">
    <div class="skeleton-header"></div>
    <div class="skeleton-body">
      <div class="skeleton-bar" v-for="i in 5" :key="i"></div>
    </div>
  </div>
</template>

<style scoped>
.chart-skeleton {
  width: 100%;
  height: 100%;
  background: rgba(20, 25, 35, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
}

.skeleton-header {
  width: 60%;
  height: 24px;
  background: linear-gradient(90deg, rgba(196, 69, 54, 0.2), rgba(230, 180, 34, 0.2));
  border-radius: 4px;
  margin: 0 auto 30px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.skeleton-bar {
  height: 30px;
  background: linear-gradient(90deg, rgba(196, 69, 54, 0.15), rgba(230, 180, 34, 0.15));
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-bar:nth-child(1) { width: 80%; animation-delay: 0s; }
.skeleton-bar:nth-child(2) { width: 60%; animation-delay: 0.2s; }
.skeleton-bar:nth-child(3) { width: 90%; animation-delay: 0.4s; }
.skeleton-bar:nth-child(4) { width: 70%; animation-delay: 0.6s; }
.skeleton-bar:nth-child(5) { width: 50%; animation-delay: 0.8s; }

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
</style>
