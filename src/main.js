import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/theme.css'
import './styles/style.global.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)
const pinia = createPinia()

// 使用Pinia状态管理
app.use(pinia)

// 中文配置
app.use(ElementPlus, {
  locale: zhCn
})

// 最后挂载
app.mount('#app')
