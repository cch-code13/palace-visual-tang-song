<script setup>
import { computed, nextTick, ref } from 'vue'
import {
  CircleCheckFilled,
  Link,
  Loading,
  WarningFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  palace: {
    type: Object,
    default: null
  },
  shareText: {
    type: String,
    default: ''
  },
  shareLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'idle'
  },
  statusMessage: {
    type: String,
    default: ''
  },
  copyFailed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'copy', 'platform-share'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const shareTextAreaWrap = ref(null)

const isDarkTheme = computed(() => {
  return document.documentElement.classList.contains('dark')
})

const dynastyColor = computed(() => {
  return props.palace?.dynasty === '宋代' ? '#D4AF37' : '#D43A30'
})

const dynastyAccentColor = computed(() => {
  return props.palace?.dynasty === '宋代' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 58, 48, 0.15)'
})

const statusIcon = computed(() => {
  if (props.status === 'success') return CircleCheckFilled
  if (props.status === 'error') return WarningFilled
  return Link
})

const platformButtons = [
  { key: 'wechat', label: '微信', className: 'wechat', iconClass: 'fa-brands fa-weixin' },
  { key: 'qq', label: 'QQ', className: 'qq', iconClass: 'fa-brands fa-qq' },
  { key: 'weibo', label: '微博', className: 'weibo', iconClass: 'fa-brands fa-weibo' }
]

const handleCopy = () => {
  emit('copy')
}

const selectShareText = async () => {
  await nextTick()
  const textarea = shareTextAreaWrap.value?.querySelector('textarea')
  if (!textarea) return

  textarea.focus()
  textarea.setSelectionRange(0, textarea.value.length)
}

const handleCopyText = async () => {
  await selectShareText()
  handleCopy()
}

const handlePlatformShare = (platform) => {
  let message = ''
  switch (platform) {
    case '微信':
      message = '分享文案已复制，可打开微信粘贴分享。'
      break
    case 'QQ':
      message = '分享文案已复制，可打开 QQ 粘贴分享。'
      break
    case '微博':
      message = '分享文案已复制，可打开微博粘贴分享。'
      break
    default:
      message = '分享文案已复制到剪贴板。'
  }
  emit('platform-share', { platform, message })
}

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    class="palace-share-dialog"
    :class="{ 'is-dark': isDarkTheme }"
    custom-class="palace-share-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    width="min(760px, calc(100vw - 24px))"
    :show-close="false"
    top="10vh"
  >
    <template #header>
      <div class="share-dialog-header">
        <p class="share-dialog-eyebrow">宫阙万象·唐宋宫殿数据可视化平台</p>
        <h3 class="share-dialog-title" :style="{ color: dynastyColor }">
          分享【{{ palace?.name || '宫殿' }}】
        </h3>
      </div>
    </template>

    <div class="share-dialog-body">
      <div class="share-status-card">
        <div class="share-status-icon" :class="status" :style="{ background: `linear-gradient(135deg, ${dynastyColor}, ${dynastyColor}cc)` }">
          <el-icon v-if="status === 'loading'" class="is-loading">
            <Loading />
          </el-icon>
          <el-icon v-else>
            <component :is="statusIcon" />
          </el-icon>
        </div>

        <div class="share-status-copy">
          <p class="share-status-title">分享到【{{ palace?.name || '宫殿' }}】详情页</p>
          <p class="share-status-subtitle">
            点击复制按钮分享给朋友，或使用下方平台快速分发
          </p>
        </div>
      </div>

      <div class="share-preview-card" :class="{ 'copy-failed': copyFailed }">
        <div class="share-section-header">
          <span>分享文案</span>
          <el-button
            type="text"
            class="copy-link-button"
            :style="{ color: dynastyColor }"
            @click="handleCopyText"
          >
            复制文案
          </el-button>
        </div>

        <div ref="shareTextAreaWrap" class="share-textarea-wrap">
          <el-input
            class="share-textarea"
            type="textarea"
            :rows="8"
            :model-value="shareText"
            readonly
            @focus="selectShareText"
            @click="handleCopyText"
          />
        </div>

        <div class="share-link-box">
          <span class="share-link-label">分享链接</span>
          <div class="share-link-value">{{ shareLink }}</div>
        </div>
      </div>

      <div class="share-platforms">
        <button
          v-for="platform in platformButtons"
          :key="platform.key"
          type="button"
          class="share-platform-button"
          :class="platform.className"
          @click="handlePlatformShare(platform.label)"
        >
          <i :class="['platform-fa-icon', platform.iconClass]" aria-hidden="true"></i>
          <span class="platform-text">{{ platform.label }}</span>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="share-dialog-footer">
        <el-button
          class="share-close-button"
          :style="{
            color: dynastyColor,
            borderColor: dynastyColor
          }"
          @click="handleClose"
        >
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.share-dialog-header {
  text-align: center;
}

.share-dialog-eyebrow {
  margin: 0 0 0.35rem 0;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.8;
  color: var(--text-body);
}

.share-dialog-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.share-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.share-status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: var(--share-card-bg);
  border: 1px solid var(--share-border);
  box-shadow: var(--share-shadow);
}

.share-status-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  flex: 0 0 auto;
}

.share-status-icon.loading {
  background: linear-gradient(135deg, #888, #666) !important;
}

.share-status-icon.success {
  background: linear-gradient(135deg, #2e7d32, #4caf50) !important;
}

.share-status-icon.error {
  background: linear-gradient(135deg, #b71c1c, #ef5350) !important;
}

.share-status-copy {
  min-width: 0;
}

.share-status-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.share-status-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
  color: var(--text-body);
}

.share-preview-card {
  padding: 1rem;
  border-radius: 16px;
  background: var(--share-card-bg);
  border: 1px solid var(--share-border);
  transition: border-color 0.2s ease;
}

.share-preview-card.copy-failed {
  border-color: #ef5350;
}

.share-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.copy-link-button {
  padding: 0;
  border: 0;
  background: transparent;
  font-weight: 600;
  transition: all 0.2s ease;
}

.copy-link-button:hover {
  opacity: 0.8;
  background: var(--share-hover-bg);
}

.share-textarea-wrap {
  border-radius: 14px;
}

.share-textarea :deep(.el-textarea__inner) {
  border: 1px solid var(--share-input-border);
  border-radius: 14px;
  background: var(--share-input-bg);
  color: var(--share-input-text);
  line-height: 1.7;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.share-textarea-wrap:hover .share-textarea :deep(.el-textarea__inner),
.share-textarea-wrap:focus-within .share-textarea :deep(.el-textarea__inner) {
  border-color: var(--dynasty-color);
  box-shadow: 0 0 0 3px var(--dynasty-color-bg);
}

.share-link-box {
  margin-top: 0.9rem;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
  background: var(--share-link-bg);
  border: 1px dashed var(--share-link-border);
}

.share-link-label {
  display: inline-block;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--dynasty-color);
}

.share-link-value {
  word-break: break-all;
  font-size: 0.9rem;
  color: var(--text-body);
  line-height: 1.6;
}

.share-platforms {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.share-platform-button {
  height: 54px;
  padding: 0 1rem;
  border: 0;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.share-platform-button:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
}

.share-platform-button.wechat {
  background: linear-gradient(135deg, #07c160, #19d168);
  box-shadow: 0 10px 20px rgba(7, 193, 96, 0.22);
}

.share-platform-button.qq {
  background: linear-gradient(135deg, #12b7f5, #4cc3ff);
  box-shadow: 0 10px 20px rgba(18, 183, 245, 0.22);
}

.share-platform-button.weibo {
  background: linear-gradient(135deg, #ff8200, #ff5b3d);
  box-shadow: 0 10px 20px rgba(255, 130, 0, 0.22);
}

.platform-fa-icon {
  width: 1.15rem;
  font-size: 1.05rem;
  line-height: 1;
  text-align: center;
  flex: 0 0 auto;
}

.platform-text {
  line-height: 1;
}

.share-dialog-footer {
  display: flex;
  justify-content: center;
}

.share-close-button {
  min-width: 120px;
  background: transparent;
  transition: all 0.2s ease;
}

.share-close-button:hover {
  background: var(--share-hover-bg) !important;
}

@media (max-width: 640px) {
  .share-status-card {
    align-items: flex-start;
  }

  .share-platforms {
    grid-template-columns: 1fr;
  }
}

:deep(.palace-share-dialog) {
  border-radius: 20px;
  overflow: hidden;
  background: var(--share-dialog-bg);
  border: 1px solid var(--share-border);
}

:deep(.palace-share-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--share-border);
  padding: 1.4rem 1.5rem 1rem;
  background: var(--share-dialog-bg);
}

:deep(.palace-share-dialog .el-dialog__body) {
  padding: 1.2rem 1.5rem 0.5rem;
  background: var(--share-dialog-bg);
}

:deep(.palace-share-dialog .el-dialog__footer) {
  padding: 0.6rem 1.5rem 1.4rem;
  border-top: 1px solid var(--share-border);
  background: var(--share-dialog-bg);
}

@media (max-width: 640px) {
  :deep(.palace-share-dialog) {
    width: calc(100vw - 16px) !important;
  }
}
</style>

<style>
:root {
  --dynasty-color: #D43A30;
  --dynasty-color-bg: rgba(212, 58, 48, 0.12);
  --share-hover-bg: rgba(212, 58, 48, 0.08);
  
  --share-dialog-bg: #FFFFFF;
  --share-card-bg: rgba(255, 255, 255, 0.6);
  --share-border: rgba(230, 180, 34, 0.25);
  --share-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  
  --share-input-bg: #F9F6F0;
  --share-input-border: transparent;
  --share-input-text: #333333;
  
  --share-link-bg: rgba(230, 180, 34, 0.08);
  --share-link-border: rgba(230, 180, 34, 0.35);
  
  --text-primary: #333333;
  --text-body: #666666;
}

.dark {
  --dynasty-color: #D4AF37;
  --dynasty-color-bg: rgba(212, 175, 55, 0.12);
  --share-hover-bg: rgba(212, 175, 55, 0.08);
  
  --share-dialog-bg: #1E1E1E;
  --share-card-bg: rgba(45, 45, 45, 0.6);
  --share-border: rgba(230, 180, 34, 0.18);
  --share-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  
  --share-input-bg: #2D2D2D;
  --share-input-border: transparent;
  --share-input-text: #F5F5F5;
  
  --share-link-bg: rgba(230, 180, 34, 0.08);
  --share-link-border: rgba(230, 180, 34, 0.35);
  
  --text-primary: #F5F5F5;
  --text-body: #AAAAAA;
}
</style>
