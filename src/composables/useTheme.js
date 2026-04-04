import { ref, onMounted, watch } from 'vue'

/**
 * 主题管理逻辑
 * @returns {Object} 主题相关方法和属性
 */
export function useTheme() {
  // 主题模式：light, dark, elegant, eye-care
  const themeMode = ref('light')
  
  // 初始化主题
  const initTheme = () => {
    // 从本地存储加载主题
    const savedTheme = localStorage.getItem('themeMode')
    if (savedTheme) {
      themeMode.value = savedTheme
    }
    
    // 应用主题
    applyTheme(themeMode.value)
  }
  
  // 应用主题
  const applyTheme = (mode) => {
    // 移除所有主题类
    document.documentElement.classList.remove('light', 'dark', 'elegant', 'eye-care')
    
    // 添加当前主题类
    document.documentElement.classList.add(mode)
    
    // 保存主题到本地存储
    localStorage.setItem('themeMode', mode)
    
    // 触发主题变更事件
    window.dispatchEvent(new CustomEvent('themeChange', { detail: mode }))
  }
  
  // 切换主题
  const switchTheme = (mode) => {
    themeMode.value = mode
    applyTheme(mode)
  }
  
  // 切换到浅色模式
  const switchToLight = () => {
    switchTheme('light')
  }
  
  // 切换到深色模式
  const switchToDark = () => {
    switchTheme('dark')
  }
  
  // 切换到古风典雅模式
  const switchToElegant = () => {
    switchTheme('elegant')
  }
  
  // 切换到夜间护眼模式
  const switchToEyeCare = () => {
    switchTheme('eye-care')
  }
  
  // 获取当前主题
  const getCurrentTheme = () => {
    return themeMode.value
  }
  
  // 获取主题对应的颜色
  const getThemeColor = (key) => {
    const colors = {
      light: {
        primary: '#c44536',
        secondary: '#e6b422',
        accent: '#9c27b0',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#333333',
        textSecondary: '#666666',
        border: '#e0e0e0'
      },
      dark: {
        primary: '#e6b422',
        secondary: '#c44536',
        accent: '#ba68c8',
        background: '#121212',
        surface: '#1e1e1e',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#333333'
      },
      elegant: {
        primary: '#8B4513',
        secondary: '#DAA520',
        accent: '#A0522D',
        background: '#F5F5DC',
        surface: '#FFF8DC',
        text: '#3E2723',
        textSecondary: '#5D4037',
        border: '#D7CCC8'
      },
      'eye-care': {
        primary: '#556B2F',
        secondary: '#8FBC8F',
        accent: '#6B8E23',
        background: '#F0F8F0',
        surface: '#F5FFFA',
        text: '#2F4F2F',
        textSecondary: '#556B2F',
        border: '#D2B48C'
      }
    }
    
    return colors[themeMode.value][key] || '#000000'
  }
  
  // 监听主题变化
  watch(
    themeMode,
    (newMode) => {
      applyTheme(newMode)
    }
  )
  
  // 生命周期钩子
  onMounted(() => {
    initTheme()
  })
  
  return {
    themeMode,
    initTheme,
    switchTheme,
    switchToLight,
    switchToDark,
    switchToElegant,
    switchToEyeCare,
    getCurrentTheme,
    getThemeColor
  }
}

/**
 * 获取主题对应的文字颜色
 * @returns {string} 文字颜色
 */
export function getTextColor() {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 
               document.documentElement.classList.contains('elegant') ? 'elegant' : 
               document.documentElement.classList.contains('eye-care') ? 'eye-care' : 'light'
  
  const colors = {
    light: '#333333',
    dark: '#ffffff',
    elegant: '#3E2723',
    'eye-care': '#2F4F2F'
  }
  
  return colors[theme] || '#333333'
}

/**
 * 获取主题对应的边框颜色
 * @returns {string} 边框颜色
 */
export function getBorderColor() {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 
               document.documentElement.classList.contains('elegant') ? 'elegant' : 
               document.documentElement.classList.contains('eye-care') ? 'eye-care' : 'light'
  
  const colors = {
    light: '#c44536',
    dark: '#e6b422',
    elegant: '#D7CCC8',
    'eye-care': '#D2B48C'
  }
  
  return colors[theme] || '#c44536'
}

/**
 * 获取主题对应的分割线颜色
 * @returns {string} 分割线颜色
 */
export function getSplitLineColor() {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 
               document.documentElement.classList.contains('elegant') ? 'elegant' : 
               document.documentElement.classList.contains('eye-care') ? 'eye-care' : 'light'
  
  const colors = {
    light: 'rgba(0,0,0,0.1)',
    dark: 'rgba(255,255,255,0.1)',
    elegant: 'rgba(139,69,19,0.1)',
    'eye-care': 'rgba(85,107,47,0.1)'
  }
  
  return colors[theme] || 'rgba(0,0,0,0.1)'
}

/**
 * 获取主题对应的背景颜色
 * @returns {string} 背景颜色
 */
export function getBackgroundColor() {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 
               document.documentElement.classList.contains('elegant') ? 'elegant' : 
               document.documentElement.classList.contains('eye-care') ? 'eye-care' : 'light'
  
  const colors = {
    light: '#ffffff',
    dark: '#121212',
    elegant: '#F5F5DC',
    'eye-care': '#F0F8F0'
  }
  
  return colors[theme] || '#ffffff'
}