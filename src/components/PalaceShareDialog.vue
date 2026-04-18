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

const themeClass = computed(() => {
  if (props.palace?.dynasty === '宋代') {
    return 'song-theme'
  }

  return 'tang-theme'
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
  emit('platform-share', platform)
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
    custom-class="palace-share-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    width="min(760px, calc(100vw - 24px))"
    :show-close="false"
    top="10vh"
  >
    <template #header>
      <div class="share-dialog-header" :class="themeClass">
        <p class="share-dialog-eyebrow">宫阙万象·唐宋宫殿数据可视化平台</p>
        <h3 class="share-dialog-title">
          分享【{{ palace?.name || '宫殿' }}】
        </h3>
      </div>
    </template>

    <div class="share-dialog-body" :class="[themeClass, { 'copy-failed': copyFailed }]">
      <div class="share-status-card">
        <div class="share-status-icon" :class="status">
          <el-icon v-if="status === 'loading'" class="is-loading">
            <Loading />
          </el-icon>
          <el-icon v-else>
            <component :is="statusIcon" />
          </el-icon>
        </div>

        <div class="share-status-copy">
          <p class="share-status-title">{{ statusMessage || '正在生成分享链接' }}</p>
          <p class="share-status-subtitle">
            点击文案框可再次复制，或使用下方平台按钮快速分发
          </p>
        </div>
      </div>

      <div class="share-preview-card">
        <div class="share-section-header">
          <span>分享文案</span>
          <el-button type="text" class="copy-link-button" @click="handleCopyText">
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
        <el-button class="share-close-button" @click="handleClose">关闭</el-button>
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
}

.share-dialog-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.tang-theme .share-dialog-eyebrow,
.tang-theme .share-dialog-title {
  color: #c44536;
}

.song-theme .share-dialog-eyebrow,
.song-theme .share-dialog-title {
  color: #e6b422;
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
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(230, 180, 34, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
  background: linear-gradient(135deg, #c44536, #e6b422);
  box-shadow: 0 12px 24px rgba(196, 69, 54, 0.24);
  flex: 0 0 auto;
}

.share-status-icon.loading {
  background: linear-gradient(135deg, #c44536, #b8860b);
}

.share-status-icon.success {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
}

.share-status-icon.error {
  background: linear-gradient(135deg, #b71c1c, #ef5350);
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
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(230, 180, 34, 0.18);
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
  transition: color 0.2s ease, background-color 0.2s ease;
}

.tang-theme .copy-link-button,
.song-theme .copy-link-button {
  color: #c41e3a;
}

.tang-theme .copy-link-button:hover,
.song-theme .copy-link-button:hover {
  color: #a01830;
  background: rgba(196, 30, 58, 0.15);
}

.song-theme .copy-link-button {
  color: #ffd700;
}

.song-theme .copy-link-button:hover {
  color: #daa520;
  background: rgba(255, 215, 0, 0.15);
}

.share-textarea-wrap {
  border-radius: 14px;
}

.share-textarea :deep(.el-textarea__inner) {
  border: 1px solid transparent;
  border-radius: 14px;
  background: #fff9f0;
  color: #333333;
  line-height: 1.7;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.share-textarea-wrap:hover .share-textarea :deep(.el-textarea__inner),
.share-textarea-wrap:focus-within .share-textarea :deep(.el-textarea__inner) {
  border-color: #c41e3a;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.12);
}

.song-theme .share-textarea :deep(.el-textarea__inner) {
  background: #2a2a3a;
  color: #e0e0e0;
}

.song-theme .share-textarea-wrap:hover .share-textarea :deep(.el-textarea__inner),
.song-theme .share-textarea-wrap:focus-within .share-textarea :deep(.el-textarea__inner) {
  border-color: #ffd700;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.12);
}

.copy-failed .share-textarea :deep(.el-textarea__inner) {
  border-color: #ef5350;
  box-shadow: 0 0 0 3px rgba(239, 83, 80, 0.12);
}

.share-link-box {
  margin-top: 0.9rem;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
  background: rgba(230, 180, 34, 0.08);
  border: 1px dashed rgba(230, 180, 34, 0.35);
}

.share-link-label {
  display: inline-block;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-accent);
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
}

:deep(.palace-share-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(230, 180, 34, 0.25);
  padding: 1.4rem 1.5rem 1rem;
}

:deep(.palace-share-dialog .el-dialog__body) {
  padding: 1.2rem 1.5rem 0.5rem;
}

:deep(.palace-share-dialog .el-dialog__footer) {
  padding: 0.6rem 1.5rem 1.4rem;
  border-top: 1px solid rgba(230, 180, 34, 0.18);
}

.tang-theme :deep(.palace-share-dialog .el-dialog__header),
.tang-theme :deep(.palace-share-dialog .el-dialog__footer) {
  background: rgba(255, 250, 240, 0.96);
}

.song-theme :deep(.palace-share-dialog .el-dialog__header),
.song-theme :deep(.palace-share-dialog .el-dialog__footer) {
  background: rgba(255, 248, 235, 0.96);
}

@media (max-width: 640px) {
  :deep(.palace-share-dialog) {
    width: calc(100vw - 16px) !important;
  }
}
</style>
