<script setup>
import palaces from '@/data/data.palaces.json'
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import PalaceMapTang from './components/PalaceMapTang.vue'
import PalaceMapSong from './components/PalaceMapSong.vue'
import ChartCompareProvince from './components/ChartCompareProvince.vue'
import CardPalaceItem from './components/CardPalaceItem.vue'
import ModuleTimeline from './components/ModuleTimeline.vue'
// 导入新的图表组件
import ChartHeatMap from './components/ChartHeatMap.vue'
import ChartCompareDynasty from './components/ChartCompareDynasty.vue'
import ChartPieRegion from './components/ChartPieRegion.vue'
import ChartBarArea from './components/ChartBarArea.vue'
import ChartTrend from './components/ChartTrend.vue'
import { ElMessage } from 'element-plus'
// 加载状态
const isLoading = ref(true)
const isFiltering = ref(false)
const isChartLoading = ref({})

// 设置图表加载状态
const setChartLoading = (chartName, loading) => {
  isChartLoading.value[chartName] = loading
}

// 重置所有图表加载状态
const resetChartLoading = () => {
  isChartLoading.value = {}
}

// 动态计算统计数据
const stats = computed(() => {
  const totalPalaces = palaces.length
  // 计算总建筑面积，统一单位为万平方米
  const totalArea = palaces.reduce((sum, palace) => {
    // 提取面积数值，去除单位
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
    return sum + areaValue
  }, 0)
  const totalLocations = new Set(palaces.map(palace => palace.location)).size
  
  return [
    { value: `${totalPalaces}+`, target: totalPalaces, label: '收录宫殿' },
    { value: `${totalArea.toFixed(1)}`, target: totalArea, label: '总建筑面积(万平方米)' },
    { value: `${totalLocations}+`, target: totalLocations, label: '覆盖地区' },
  ]
})

// 数字滚动动画
const animateValue = (element, start, end, duration) => {
  let startTimestamp = null
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp
    const progress = Math.min((timestamp - startTimestamp) / duration, 1)
    // 使用缓动函数使动画更平滑
    const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
    const value = Math.floor(easedProgress * (end - start) + start)
    // 添加千分位逗号
    const formattedValue = value.toLocaleString()
    element.textContent = formattedValue + (element.dataset.suffix || '')
    if (progress < 1) {
      window.requestAnimationFrame(step)
    }
  }
  window.requestAnimationFrame(step)
}

// 数字动画已经在handleScroll函数中实现

onMounted(() => {
  // 初始化主题
  initTheme()
  
  // 加载历史记录
  loadHistoryRecords()
  
  // 模拟数据加载
  setTimeout(() => {
    console.log(palaces)
    filterPalaces() // 初始化筛选
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeydown)
    handleScroll() // 初始检查
    handleResize() // 初始检查

    // 强制显示宫殿详情卡片章节
    showPalacesSection()

    // 加载完成
    isLoading.value = false
  }, 1500)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})

// 导航栏相关
const activeIndex = ref('hero')

// 右侧导航栏项目
const navItems = [
  { index: 'hero', label: '首页', icon: 'el-icon-s-home' },
  { index: 'intro', label: '数据概览', icon: 'el-icon-data-line' },
  { index: 'tang', label: '唐代宫殿', icon: 'el-icon-coordinate' },
  { index: 'song', label: '宋代宫殿', icon: 'el-icon-coordinate' },
  { index: 'dynasty-comparison', label: '唐宋对比', icon: 'el-icon-data-line' },
  { index: 'heatmap', label: '分布热力图', icon: 'el-icon-data-line' },
  { index: 'comparison', label: '规模对比', icon: 'el-icon-data-analysis' },
  { index: 'dynamic-bar', label: '动态对比', icon: 'el-icon-data-analysis' },
  { index: 'trend', label: '发展趋势', icon: 'el-icon-data-line' },
  { index: 'distribution', label: '地域分布', icon: 'el-icon-data-pie' },
  { index: 'palaces', label: '宫殿详情', icon: 'el-icon-building' },
  { index: 'timeline', label: '发展历程', icon: 'el-icon-date' },
  { index: 'comparison-dialog', label: '宫殿对比', icon: 'el-icon-s-data' },
]

// 移动端导航相关
const isMobile = ref(window.innerWidth < 768)
const mobileNavVisible = ref(false)

const toggleMobileNav = () => {
  mobileNavVisible.value = !mobileNavVisible.value
}

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    mobileNavVisible.value = false
  }
}

const handleSelect = (key) => {
  activeIndex.value = key
  
  // 特殊处理宫殿对比
  if (key === 'comparison-dialog') {
    saveScrollPosition()
    showComparisonDialog.value = true
    // 滚动到页面底部
    window.scrollTo({ 
      top: document.body.scrollHeight, 
      behavior: 'smooth' 
    })
  } else {
    // 滚动到对应区域
    const element = document.getElementById(key)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// 移动端导航选择处理
const handleMobileNavSelect = (key) => {
  activeIndex.value = key
  
  // 特殊处理宫殿对比
  if (key === 'comparison-dialog') {
    saveScrollPosition()
    showComparisonDialog.value = true
    // 滚动到页面底部
    window.scrollTo({ 
      top: document.body.scrollHeight, 
      behavior: 'smooth' 
    })
  } else {
    // 滚动到对应区域
    const element = document.getElementById(key)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  // 关闭移动端导航
  mobileNavVisible.value = false
}

// 搜索和筛选功能
const searchQuery = ref('')
const dynastyFilter = ref('')
const locationFilter = ref('')
const areaFilter = ref('')
const sortBy = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(8)

// 图表引用
const trendChartRef = ref(null)

// 防抖计时器
let debounceTimer = null

// 提取所有朝代选项
const dynastyOptions = ['', ...new Set(palaces.map((palace) => palace.dynasty))]

// 面积筛选选项
const areaOptions = [
  { label: '全部', value: '' },
  { label: '1平方千米以下', value: 'less1' },
  { label: '1-2平方千米', value: '1-2' },
  { label: '2平方千米以上', value: 'more2' }
]

// 排序选项
const sortOptions = [
  { label: '默认', value: '' },
  { label: '面积从大到小', value: 'desc' },
  { label: '面积从小到大', value: 'asc' }
]

// 筛选宫殿
const filteredPalaces = ref([])

const filterPalaces = () => {
  isFiltering.value = true
  
  // 模拟筛选过程的延迟
  setTimeout(() => {
    let result = palaces.filter((palace) => {
      const matchesSearch = palace.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesDynasty = !dynastyFilter.value || palace.dynasty === dynastyFilter.value
      const matchesLocation = !locationFilter.value || palace.location.includes(locationFilter.value)
      
      // 面积筛选
    let matchesArea = true
    if (areaFilter.value) {
      // 提取面积数值，去除单位
      const area = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
      switch (areaFilter.value) {
        case 'less1':
          matchesArea = area < 100
          break
        case '1-2':
          matchesArea = area >= 100 && area <= 200
          break
        case 'more2':
          matchesArea = area > 200
          break
      }
    }
      
      return matchesSearch && matchesDynasty && matchesLocation && matchesArea
    })
    
    // 随机排序（打乱顺序）
    result.sort(() => Math.random() - 0.5)
    
    // 排序
    if (sortBy.value) {
      result.sort((a, b) => {
        // 提取面积数值，去除单位
        const areaA = parseFloat(a.area.replace(/[^0-9.]/g, '')) || 0
        const areaB = parseFloat(b.area.replace(/[^0-9.]/g, '')) || 0
        return sortBy.value === 'desc' ? areaB - areaA : areaA - areaB
      })
    }
    
    filteredPalaces.value = result
    currentPage.value = 1 // 重置到第一页
    isFiltering.value = false
  }, 300)
}

// 搜索防抖函数
const debouncedFilter = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    filterPalaces()
  }, 300)
}

// 重置筛选
const resetFilters = () => {
  searchQuery.value = ''
  dynastyFilter.value = ''
  locationFilter.value = ''
  areaFilter.value = ''
  sortBy.value = ''
  currentPage.value = 1
  filterPalaces()
}

// 计算当前页显示的宫殿
const currentPalaces = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPalaces.value.slice(start, end)
})



// 分页处理函数
const handleSizeChange = (size) => {
  if (size === '全部') {
    pageSize.value = filteredPalaces.value.length
  } else {
    pageSize.value = size
  }
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 计算活跃的筛选条件
const activeFilters = computed(() => {
  const filters = []
  if (searchQuery.value) {
    filters.push({ key: 'search', label: '搜索', value: searchQuery.value })
  }
  if (dynastyFilter.value) {
    filters.push({ key: 'dynasty', label: '朝代', value: dynastyFilter.value })
  }
  if (areaFilter.value) {
    const areaOption = areaOptions.find(option => option.value === areaFilter.value)
    if (areaOption) {
      filters.push({ key: 'area', label: '建筑面积', value: areaOption.label })
    }
  }
  if (sortBy.value) {
    const sortOption = sortOptions.find(option => option.value === sortBy.value)
    if (sortOption) {
      filters.push({ key: 'sort', label: '排序', value: sortOption.label })
    }
  }
  return filters
})

// 清除单个筛选条件
const clearFilter = (key) => {
  switch (key) {
    case 'search':
      searchQuery.value = ''
      break
    case 'dynasty':
      dynastyFilter.value = ''
      break
    case 'area':
      areaFilter.value = ''
      break
    case 'sort':
      sortBy.value = ''
      break
  }
  filterPalaces()
}



// 回到顶部相关
const showBackToTop = ref(false)

const backToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 主题切换功能
const isDarkMode = ref(false)

// 监听isDarkMode变化来处理主题切换
watch(isDarkMode, (newValue) => {
  if (newValue) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  // 保存主题设置到本地存储
  localStorage.setItem('theme', newValue ? 'dark' : 'light')
})

// 主题切换函数
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else {
    // 默认使用浅色主题
    isDarkMode.value = false
  }
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 键盘快捷键支持
const handleKeydown = (event) => {
  // 避免在输入框中触发快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  switch (event.key.toLowerCase()) {
    case 's':
      // 快速聚焦搜索框
      const searchInput = document.querySelector('.filter-input input')
      if (searchInput) {
        searchInput.focus()
      }
      event.preventDefault()
      break
    case 'escape':
      // 关闭详情弹窗与对比弹窗
      if (showPalaceDialog.value) {
        showPalaceDialog.value = false
        restoreScrollPosition()
      } else if (showPlaceNameDialog.value) {
        showPlaceNameDialog.value = false
        restoreScrollPosition()
      } else if (showComparisonDialog.value) {
        showComparisonDialog.value = false
        restoreScrollPosition()
      }
      break


  }
}





// 滚动到数据概览部分
const scrollToIntro = () => {
  const introSection = document.getElementById('intro')
  if (introSection) {
    introSection.scrollIntoView({
      behavior: 'smooth'
    })
  }
}

// 数字动画触发标志
const animationTriggered = ref(false)

// 滚动动画逻辑
const handleScroll = () => {
  const elements = document.querySelectorAll('.scroll-animate')
  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top
    const elementVisible = 150
    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add('visible')
    }
  })

  // 触发数字动画
  if (!animationTriggered.value) {
    const introSection = document.getElementById('intro')
    if (introSection) {
      const elementTop = introSection.getBoundingClientRect().top
      const elementVisible = 150
      if (elementTop < window.innerHeight - elementVisible) {
        const statNumbers = introSection.querySelectorAll('.stat-number')
        statNumbers.forEach((statNumber, index) => {
          const target = stats.value[index].target
          const suffix = statNumber.textContent.replace(/\d/g, '')
          statNumber.dataset.suffix = suffix
          animateValue(statNumber, 0, target, 2000)
        })
        animationTriggered.value = true
      }
    }
  }

  // 更新回到顶部按钮显示状态
  showBackToTop.value = window.scrollY > 300
}

// 强制显示宫殿详情卡片章节
const showPalacesSection = () => {
  const palacesSection = document.getElementById('palaces')
  if (palacesSection) {
    palacesSection.classList.add('visible')
  }
}

// 滚动位置保存
const scrollPosition = ref(0)

// 宫殿详情弹窗
const showPalaceDialog = ref(false)
const selectedPalace = ref(null)

// 古今地名对应表弹窗
const showPlaceNameDialog = ref(false)

// 宫殿对比功能
const showComparisonDialog = ref(false)
const palace1 = ref(null)
const palace2 = ref(null)

// 监听宫殿选择变化，防止选择同一座宫殿
watch([palace1, palace2], ([newPalace1, newPalace2]) => {
  if (newPalace1 && newPalace2 && newPalace1.id === newPalace2.id) {
    ElMessage({
      message: '请选择不同的宫殿',
      type: 'warning'
    })
    // 重置输入框到默认状态
    palace1.value = null
    palace2.value = null
  }
})

// 保存滚动位置
const saveScrollPosition = () => {
  scrollPosition.value = window.scrollY
}

// 恢复滚动位置
const restoreScrollPosition = () => {
  window.scrollTo({
    top: scrollPosition.value,
    behavior: 'smooth'
  })
}

// 古今地名对应表数据
const placeNameMap = [
  { ancient: '长安', modern: '陕西', notes: '唐代都城，今西安' },
  { ancient: '洛阳', modern: '河南', notes: '唐代东都，今洛阳' },
  { ancient: '汴京', modern: '河南', notes: '宋代都城，今开封' },
  { ancient: '杭州', modern: '浙江', notes: '南宋都城，今杭州' },
  { ancient: '苏州', modern: '江苏', notes: '今苏州' },
  { ancient: '建康', modern: '江苏', notes: '今南京' },
  { ancient: '成都', modern: '四川', notes: '今成都' },
  { ancient: '襄阳', modern: '湖北', notes: '今襄阳' },
  { ancient: '长沙', modern: '湖南', notes: '今长沙' },
  { ancient: '福州', modern: '福建', notes: '今福州' }
]

// 地图引用
const mapChartRef = ref(null)

const handlePalaceClick = (palace) => {
  // 保存滚动位置
  saveScrollPosition()
  selectedPalace.value = palace
  showPalaceDialog.value = true
  // 添加到历史记录
  addHistoryRecord(palace)
}

// 滚动到地图区域并定位省份
const scrollToMapSection = (location) => {
  // 滚动到唐代地图区域
  const tangSection = document.getElementById('tang')
  if (tangSection) {
    tangSection.scrollIntoView({ behavior: 'smooth' })
    
    // 延迟执行，确保地图已渲染
    setTimeout(() => {
      // 触发地图定位逻辑
      console.log('定位到地点:', location)
      // 调用地图组件的定位方法
      if (window.locateProvince) {
        // 提取省份信息
        const province = location.split(' ')[0]
        window.locateProvince(province)
      }
    }, 1000)
  }
}

// 朗读功能
const readAloud = (text) => {
  if ('speechSynthesis' in window) {
    const speech = new SpeechSynthesisUtterance(text)
    speech.lang = 'zh-CN'
    speech.volume = 1
    speech.rate = 0.9
    speech.pitch = 1
    speechSynthesis.speak(speech)
  } else {
    ElMessage({
      message: '您的浏览器不支持语音朗读功能',
      type: 'warning'
    })
  }
}

// 相关宫殿推荐
const relatedPalaces = computed(() => {
  if (!selectedPalace.value) return []
  return palaces.filter(palace => 
    palace.name !== selectedPalace.value.name && 
    (palace.dynasty === selectedPalace.value.dynasty || 
     palace.location === selectedPalace.value.location)
  ).slice(0, 3)
})

// 获取宫殿相关的诗词名句
const getPalaceQuote = (palaceName) => {
  const quotes = {
    '大明宫': '九天阊阖开宫殿，万国衣冠拜冕旒',
    '太极宫': '宫殿峥嵘笼紫气，金銮殿上玉阶平',
    '兴庆宫': '兴庆池南柳未开，太真先把一枝梅',
    '洛阳宫': '洛阳宫殿锁清秋，炀帝乘龙向此游',
    '华清宫': '春寒赐浴华清池，温泉水滑洗凝脂',
    '九成宫': '九成宫阙翠微间，金殿峨峨接翠鬟',
    '东京宫城': '东京宫殿郁嵯峨，春到花梢锦绣多',
    '临安宫城': '临安宫殿郁嵯峨，多少游人月下过',
    '大内': '大内千门万户开，天街踏尽公卿回',
    '德寿宫': '德寿宫中春正浓，御园花卉竞芳容',
    '延福宫': '延福宫中瑞气多，御炉香袅傍池荷',
    '景灵宫': '景灵宫前春正浓，御沟流水碧溶溶'
  }
  return quotes[palaceName] || '宫殿华章，千古流芳'
}

// 数据导出功能
const exportToCSV = () => {
  // 构建CSV内容
  const headers = ['宫殿名称', '朝代', '地点', '建造年份', '建筑面积(万平方米)', '主要建筑', '历史意义']
  const rows = palaces.map(palace => [
    palace.name,
    palace.dynasty,
    palace.location,
    palace.buildYear,
    palace.area,
    palace.mainHall ? palace.mainHall : '',
    palace.value
  ])
  
  // 组合CSV内容，添加BOM以确保UTF-8编码
  const csvContent = [
    '\ufeff' + headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', '宫殿建筑数据.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exportToPDF = () => {
  // 构建包含统计数据和简要说明的内容
  const totalPalaces = palaces.length
  // 计算总建筑面积，统一单位为万平方米
  const totalArea = palaces.reduce((sum, palace) => {
    // 提取面积数值，去除单位
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
    return sum + areaValue
  }, 0)
  const totalLocations = new Set(palaces.map(palace => palace.location)).size
  
  const content = `宫阙万象·唐宋宫殿建筑数据可视化\n\n` +
    `统计数据：\n` +
    `收录宫殿：${totalPalaces} 座\n` +
    `总建筑面积：${totalArea.toFixed(1)} 万平方米\n` +
    `覆盖地区：${totalLocations} 个\n\n` +
    `简要说明：\n` +
    `本数据来源于历史文献和考古资料，展示了唐宋两代宫殿建筑的分布情况。\n` +
    `数据统计时间：2026年3月\n\n` +
    `数据局限性：\n` +
    `1. 部分宫殿的具体面积可能存在争议，本数据基于现有考古资料。\n` +
    `2. 由于历史变迁，部分宫殿的准确位置可能难以确定。\n` +
    `3. 宫殿的建造年份可能存在一定误差，本数据基于历史文献记载。\n` +
    `4. 部分宫殿可能经过多次修缮和扩建，本数据反映的是其鼎盛时期的规模。\n\n` +
    `宫殿详情：\n\n` +
    palaces.map(palace => {
      return `${palace.name} (${palace.dynasty}, ${palace.location})\n建造年份: ${palace.buildYear}\n建筑面积: ${palace.area}\n主要建筑: ${palace.mainHall ? palace.mainHall : '无'}\n历史意义: ${palace.value}\n\n`
    }).join('')
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', '宫殿建筑数据.txt')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // 提示用户
  ElMessage({ 
    message: 'PDF导出功能正在开发中，当前已导出为文本文件，包含统计数据和简要说明', 
    type: 'info' 
  })
}

// 处理地图点击事件
const handleMapPalaceClick = (palace) => {
  // 滚动到宫殿列表区域
  const palacesSection = document.getElementById('palaces');
  if (palacesSection) {
    palacesSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  // 查找宫殿在筛选后列表中的索引
  const index = filteredPalaces.value.findIndex(p => String(p.id) === String(palace.id));
  if (index !== -1) {
    // 计算需要跳转到的页码
    const targetPage = Math.floor(index / pageSize.value) + 1;
    if (currentPage.value !== targetPage) {
      currentPage.value = targetPage;
    }
    
    // 延迟一下，确保页面已经更新
    setTimeout(() => {
      // 找到对应的宫殿卡片并高亮
        const palaceCard = document.querySelector(`[data-palace-id="${String(palace.id)}"]`);
        if (palaceCard) {
          // 应用与鼠标悬停相同的动画效果
          palaceCard.style.transform = 'translateY(-8px) scale(1.03)';
          palaceCard.style.boxShadow = 'var(--theme-shadow), 0 0 40px rgba(230, 180, 34, 0.6), 0 0 20px rgba(196, 69, 54, 0.4), 0 0 60px rgba(230, 180, 34, 0.3)';
          palaceCard.style.filter = 'brightness(1.1)';
          
          // 直接修改伪元素样式的方式不行，因为伪元素不能通过 DOM 操作
          // 我们直接修改元素的样式，达到类似的效果
          palaceCard.style.border = '1px solid transparent';
          palaceCard.style.borderRadius = '12px';
          palaceCard.style.background = 'linear-gradient(var(--card-bg), var(--card-bg)) padding-box, linear-gradient(90deg, var(--text-accent-alt), var(--text-accent-alt), var(--text-accent-alt), var(--text-accent-alt), var(--text-accent-alt)) border-box';
          
          // 标题颜色变化
          const titleElement = palaceCard.querySelector('.poet-name');
          if (titleElement) {
            titleElement.style.color = 'var(--text-accent-alt)'
            titleElement.style.textShadow = '0 0 10px rgba(230, 180, 34, 0.8)';
          }
          
          // 滚动到该卡片
          palaceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // 3秒后移除高亮效果
          setTimeout(() => {
            if (palaceCard) {
              palaceCard.style.transform = '';
              palaceCard.style.boxShadow = '';
              palaceCard.style.filter = '';
              palaceCard.style.border = '';
              palaceCard.style.background = '';
              
              // 恢复标题颜色
              const titleElement = palaceCard.querySelector('.poet-name');
              if (titleElement) {
                titleElement.style.color = '';
                titleElement.style.textShadow = '';
              }
            }
          }, 3000);
        }
    }, 300);
  }
}

// 处理时间线点击事件
const handleTimePeriodClick = (period) => {
  if (trendChartRef.value) {
    trendChartRef.value.highlightPeriod(period);
  }
}

// 历史浏览记录
const historyRecords = ref([])
const showHistoryDialog = ref(false)

// 从本地存储加载历史记录
const loadHistoryRecords = () => {
  const savedHistory = localStorage.getItem('palaceHistory')
  if (savedHistory) {
    historyRecords.value = JSON.parse(savedHistory)
  }
}

// 添加历史记录
const addHistoryRecord = (palace) => {
  // 移除已存在的相同宫殿记录
  historyRecords.value = historyRecords.value.filter(record => record.id !== palace.id)
  
  // 添加到历史记录开头
  historyRecords.value.unshift({
    id: palace.id,
    name: palace.name,
    dynasty: palace.dynasty,
    location: palace.location,
    area: palace.area,
    timestamp: new Date().getTime()
  })
  
  // 限制历史记录数量为10条
  if (historyRecords.value.length > 10) {
    historyRecords.value = historyRecords.value.slice(0, 10)
  }
  
  // 保存到本地存储
  localStorage.setItem('palaceHistory', JSON.stringify(historyRecords.value))
}

// 清空历史记录
const clearHistoryRecords = () => {
  historyRecords.value = []
  localStorage.removeItem('palaceHistory')
}

// 从历史记录中打开宫殿详情
const openHistoryPalace = (palaceId) => {
  const palace = palaces.find(p => p.id == palaceId)
  if (palace) {
    handlePalaceClick(palace)
    showHistoryDialog.value = false
  }
}

// 打开历史记录弹窗
const openHistoryDialog = () => {
  saveScrollPosition()
  showHistoryDialog.value = true
}

// 宫殿对比数据计算属性
const comparisonData = computed(() => {
  if (!palace1.value || !palace2.value) return [];
  
  return [
    { attribute: '宫殿名称', palace1: palace1.value.name, palace2: palace2.value.name },
    { attribute: '朝代', palace1: palace1.value.dynasty, palace2: palace2.value.dynasty },
    { attribute: '地点', palace1: palace1.value.location, palace2: palace2.value.location },
    { attribute: '建造年份', palace1: palace1.value.buildYear, palace2: palace2.value.buildYear },
    { attribute: '建筑面积', palace1: palace1.value.area, palace2: palace2.value.area },
    { attribute: '面阔/开间', palace1: palace1.value.dimensions || '无', palace2: palace2.value.dimensions || '无' },
    { attribute: '屋顶样式', palace1: palace1.value.roofStyle || '无', palace2: palace2.value.roofStyle || '无' },
    { attribute: '保存状态', palace1: palace1.value.preservationStatus || '无', palace2: palace2.value.preservationStatus || '无' },
    { attribute: '所属帝王', palace1: palace1.value.associatedEmperor || '无', palace2: palace2.value.associatedEmperor || '无' },
    { attribute: '文化等级', palace1: palace1.value.culturalLevel || '无', palace2: palace2.value.culturalLevel || '无' },
    { attribute: '主要建筑', palace1: palace1.value.mainHall || '无', palace2: palace2.value.mainHall || '无' },
    { attribute: '相关诗句', palace1: palace1.value.relatedPoem || '无', palace2: palace2.value.relatedPoem || '无' }
  ];
})

</script>
<template>
  <div class="app-container">
    <!-- 加载动画 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner">
          <div class="spinner">
            <div class="scroll-content"></div>
          </div>
          <p class="loading-text">加载中...</p>
        </div>
      </div>

    <div v-else>
      <div class="background-animation"></div>
      <div class="background-shapes"></div>

      <!-- 右侧导航栏 -->
      <div class="right-nav">
        <div class="nav-rail">
          <div class="nav-rail-content">
            <div
              v-for="item in navItems"
              :key="item.index"
              :class="{ active: activeIndex === item.index }"
              @click="handleSelect(item.index)"
              class="nav-rail-item"
            >
              <div class="nav-rail-dot"></div>
              <div class="nav-rail-icon"><i :class="item.icon"></i></div>
              <div class="nav-rail-label">{{ item.label }}</div>
            </div>
          </div>
          <!-- 回到顶部按钮 -->
          <div v-show="showBackToTop" @click="backToTop" class="nav-rail-item back-to-top">
            <div class="nav-rail-dot"></div>
            <div class="nav-rail-icon"><i class="el-icon-arrow-up"></i></div>
            <div class="nav-rail-label">回到顶部</div>
          </div>
        </div>
      </div>

      <!-- 移动端导航按钮 -->
      <div class="mobile-nav-toggle" v-if="isMobile">
        <el-button type="primary" circle @click="toggleMobileNav" class="nav-control-button">
          <el-icon><i :class="mobileNavVisible ? 'el-icon-close' : 'el-icon-menu'"/></el-icon>
        </el-button>
      </div>

      <!-- 顶部控制按钮 -->
      <div class="top-controls" style="position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 1rem; align-items: center;">
        <!-- 历史记录按钮 -->
        <el-button 
          type="primary" 
          @click="openHistoryDialog"
          style="background: linear-gradient(135deg, #c44536, #e6b422); border: none; box-shadow: 0 4px 12px rgba(196, 69, 54, 0.3);"
        >
          <el-icon><i class="el-icon-time"></i></el-icon>
          历史记录
        </el-button>
        
        <!-- 主题切换按钮 -->
        <div class="theme-toggle">
          <el-switch
            v-model="isDarkMode"
            active-text="深色"
            inactive-text="浅色"
            active-color="#e6b422"
            inactive-color="#c44536"
          />
        </div>
      </div>

      <!-- 移动端抽屉导航 -->
      <el-drawer
        v-model="mobileNavVisible"
        direction="rtl"
        :with-header="false"
        size="80%"
        class="mobile-drawer"
      >
        <div class="drawer-header">
          <h3 class="drawer-title">宫阙万象·唐宋宫殿建筑数据可视化</h3>
          <el-button type="text" @click="mobileNavVisible = false" class="close-button">
            <el-icon><i class="el-icon-close"/></el-icon>
          </el-button>
        </div>
        <div class="mobile-nav-content">
          <ul class="mobile-nav-list">
            <li
              v-for="item in navItems"
              :key="item.index"
              :class="{ active: activeIndex === item.index }"
              @click="handleMobileNavSelect(item.index)"
              class="mobile-nav-item"
            >
              <div class="mobile-nav-icon"><i :class="item.icon"/></div>
              <div class="mobile-nav-text">{{ item.label }}</div>
            </li>
          </ul>
        </div>
      </el-drawer>

      
      <el-container>
        <el-main style="padding: 0">
          <!-- 封面区 -->
          <section id="hero" class="hero fade-in">
            <h1 class="hero-title">《宫阙万象·唐宋宫殿建筑数据可视化》</h1>
            <p class="hero-subtitle">中华优秀传统文化系列之六</p>
            <p class="hero-motto">本项目以唐宋宫殿建筑为核心，通过数据可视化展现中华古代建筑的辉煌成就。</p>
            <p class="hero-description">使用引导：通过右侧导航或滚动浏览各模块，点击建筑卡片查看详情，支持搜索和筛选功能</p>
            <div class="scroll-indicator" @click="scrollToIntro">
              <div class="scroll-indicator-icon">⌄</div>
              <div class="scroll-indicator-text">向下滑动，探索中国古代建筑</div>
            </div>
          </section>

          <!-- 项目简介模块 -->
          <section id="project-intro" class="project-intro container scroll-animate">
            <div class="intro-content">
              <p class="intro-text">宫阙万象·唐宋宫殿建筑数据可视化是一个基于历史文献和考古资料的唐宋时期宫殿建筑数据可视化项目，属于"中华优秀传统文化系列之六"。通过交互式地图和图表，展现古代建筑成就与地理空间的深度关联。</p>
              <p class="intro-text">项目融合传统文化与现代技术，为用户提供沉浸式的古代建筑探索体验，展现唐宋时期建筑的地域特色与时代变迁。</p>
            </div>
          </section>

          <!-- 引言：关键数字 -->
          <section id="intro" class="intro container scroll-animate">
            <h2 class="section-title">数据概览｜唐宋宫殿核心指标</h2>
            <div class="stats-row">
              <div class="stat-col" v-for="item in stats" :key="item.label">
                <div class="custom-card stat-item breathe-animation">
                  <span class="stat-number">{{ item.value }}</span>
                  <p class="stat-label">{{ item.label }}</p>
                </div>
              </div>
            </div>
            <div class="export-buttons" style="margin-top: 2rem; text-align: center">
              <el-button type="primary" @click="exportToCSV" style="margin-right: 1rem">
                <el-icon><i class="el-icon-download"></i></el-icon>
                导出CSV
              </el-button>
              <el-button type="success" @click="exportToPDF">
                <el-icon><i class="el-icon-download"></i></el-icon>
                导出PDF
              </el-button>
            </div>
            <div class="data-info" style="margin-top: 1rem; text-align: center; font-size: 0.85rem; color: #e6b422">
              <p>数据统计时间：2026年3月，基于历史文献和考古资料整理 | 数据总量：{{ palaces.length }} 座宫殿</p>
              <p>数据来源：《中国古代建筑史》、唐宋宫殿考古发掘报告、国家文物局公开遗址数据，仅用于参赛，不用于商业用途</p>
              <p>数据局限性：本项目仅统计有明确考古记载、遗址可追溯的唐宋宫殿建筑，不含已完全损毁、无实测数据的宫殿</p>
            </div>
          </section>

          <!-- 唐代章节（占位，后续用组件替换） -->
          <section id="tang" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">唐代宫殿｜地理分布与规模</h2>
            <p class="description" style="letter-spacing: 2px">
              唐代宫殿以长安为中心，规模宏大，气势磅礴。
            </p>
            <div class="map-container">
              <PalaceMapTang @palace-click="handleMapPalaceClick"></PalaceMapTang>
            </div>
          </section>

          <!-- 宋代章节 -->
          <section id="song" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">宋代宫殿｜地理分布与规模</h2>
            <p class="description" style="letter-spacing: 2px">宋代宫殿建筑更加精致，注重细节和艺术性。</p>
            <div class="map-container">
              <PalaceMapSong @palace-click="handleMapPalaceClick"></PalaceMapSong>
            </div>
          </section>

          <!-- 唐宋对比地图 -->
          <section id="dynasty-comparison" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">唐宋对比｜宫殿分布差异</h2>
            <p class="description" style="letter-spacing: 2px">
              唐宋两代宫殿地理分布对比，展示建筑中心的变迁。
            </p>
            <div style="margin-bottom: 1rem; text-align: right">
              <el-button type="primary" size="small" @click="() => { saveScrollPosition(); showPlaceNameDialog = true }">
                <el-icon><i class="el-icon-info"></i></el-icon>
                地名说明
              </el-button>
            </div>
            <div class="map-container">
              <ChartCompareDynasty></ChartCompareDynasty>
            </div>
          </section>

          <!-- 热力图 -->
          <section id="heatmap" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">分布热力图｜建筑密度分析</h2>
            <p class="description" style="letter-spacing: 2px">
              展示唐宋宫殿在全国范围内的分布密度情况。
            </p>
            <div class="chart-container">
              <ChartHeatMap></ChartHeatMap>
            </div>
          </section>

          <!-- 对比柱状图章节 -->
          <section id="comparison" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">规模对比｜唐宋建筑差异</h2>
            <p class="description" style="letter-spacing: 2px">
              唐宋两代宫殿建筑面积对比，展示建筑规模的变化。
            </p>
            <div class="chart-container">
              <ChartCompareProvince></ChartCompareProvince>
            </div>
          </section>

          <!-- 动态柱状图 -->
          <section id="dynamic-bar" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">动态对比｜地域发展变化</h2>
            <p class="description" style="letter-spacing: 2px">
              唐宋两代各地区宫殿规模动态对比，展示建筑发展的地域变化。
            </p>
            <div class="chart-container">
              <ChartBarArea></ChartBarArea>
            </div>
          </section>

          <!-- 唐宋宫殿发展趋势分析 -->
          <section id="trend" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">发展趋势｜建筑技术演变</h2>
            <p class="description" style="letter-spacing: 2px">
              唐宋两代宫殿建筑的时间趋势，展示建筑技术的发展演变。
            </p>
            <div class="map-container">
              <ChartTrend ref="trendChartRef"></ChartTrend>
            </div>
          </section>

          <!-- 宫殿地域分布饼图章节 -->
          <section id="distribution" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">地域分布｜地理集中情况</h2>
            <p class="description" style="letter-spacing: 2px">
              唐宋两代宫殿的地域分布比例，展示建筑中心的地理集中情况。
            </p>
            <div class="chart-container">
              <ChartPieRegion></ChartPieRegion>
            </div>
          </section>





          <!-- 宫殿详情卡片章节 -->
          <section id="palaces" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">著名宫殿｜详细信息</h2>
            <p class="description" style="letter-spacing: 2px">
              收录唐宋两代著名宫殿的详细信息，包括所属朝代、地点和建筑面积。
            </p>

            <!-- 搜索和筛选功能 -->
            <div class="filter-container" style="margin-bottom: 2rem; background: var(--filter-bg); border-radius: 8px; padding: 16px; border: 1px solid var(--border-color); color: var(--filter-text);" :class="{ 'dark': isDarkMode }">
              <el-row :gutter="15" align="middle">
                <el-col :xs="24" :sm="24" :md="6">
                  <el-input
                    v-model="searchQuery"
                    placeholder="搜索宫殿名称"
                    prefix-icon="el-icon-search"
                    @input="debouncedFilter"
                    clearable
                    class="filter-input"
                  />
                </el-col>
                <el-col :xs="24" :sm="12" :md="4">
                  <el-select
                    v-model="dynastyFilter"
                    placeholder="选择朝代"
                    @change="filterPalaces"
                    clearable
                    class="filter-select"
                  >
                    <el-option
                      v-for="option in dynastyOptions"
                      :key="option"
                      :label="option || '全部朝代'"
                      :value="option"
                    />
                  </el-select>
                </el-col>
                <el-col :xs="24" :sm="12" :md="4">
                  <el-select
                    v-model="areaFilter"
                    placeholder="建筑面积"
                    @change="filterPalaces"
                    clearable
                    class="filter-select"
                  >
                    <el-option
                      v-for="option in areaOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-col>
                <el-col :xs="24" :sm="12" :md="4">
                  <el-select
                    v-model="sortBy"
                    placeholder="排序方式"
                    @change="filterPalaces"
                    clearable
                    class="filter-select"
                  >
                    <el-option
                      v-for="option in sortOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-col>
                <el-col :xs="24" :sm="12" :md="6">
                  <el-button type="default" @click="resetFilters" class="reset-button">重置筛选</el-button>
                </el-col>
              </el-row>
              
              <!-- 标签化筛选条件 -->
              <div class="filter-tags" v-if="activeFilters.length > 0">
                <el-tag
                  v-for="filter in activeFilters"
                  :key="filter.key"
                  closable
                  @close="clearFilter(filter.key)"
                  class="filter-tag"
                >
                  {{ filter.label }}: {{ filter.value }}
                </el-tag>
              </div>
            </div>

            <!-- 筛选结果 -->
            <div
              v-if="filteredPalaces.length === 0 && !isFiltering"
              class="no-results"
              style="text-align: center; padding: 3rem; color: var(--el-text-color-secondary)"
            >
              <el-empty description="未找到符合条件的宫殿" />
            </div>
            <!-- 骨架屏 -->
            <div v-else-if="isFiltering" class="skeleton-container">
              <el-row :gutter="20">
                <el-col
                  :xs="24"
                  :sm="12"
                  :md="8"
                  :lg="6"
                  v-for="i in 8"
                  :key="i"
                  style="margin-bottom: 1.5rem"
                >
                  <div class="skeleton-card">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                      <div class="skeleton-title"></div>
                      <div class="skeleton-text"></div>
                      <div class="skeleton-text"></div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <div v-else>
              <el-row :gutter="20">
                <el-col
                  :xs="24"
                  :sm="12"
                  :md="8"
                  :lg="6"
                  v-for="(palace, index) in currentPalaces"
                  :key="index"
                  style="margin-bottom: 1.5rem"
                >
                  <CardPalaceItem :poet="palace" @click="handlePalaceClick(palace)" />
                </el-col>
              </el-row>
              
              <!-- 分页组件 -->
              <div style="margin-top: 2rem; text-align: center">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[8, 12, 16, '全部']"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredPalaces.length"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </section>

          <!-- 唐宋宫殿发展历程时间轴 -->
          <section id="timeline" class="container scroll-animate" style="margin-bottom: 3rem">
            <h2 class="section-title">发展历程｜历史节点</h2>
            <p class="description" style="letter-spacing: 2px">
              唐宋两代宫殿建筑的重要历史节点和代表建筑。
            </p>
            <div class="map-container" style="height: auto; min-height: 400px">
              <ModuleTimeline @time-period-click="handleTimePeriodClick"></ModuleTimeline>
            </div>
          </section>

          <!-- 宫殿对比按钮 -->
          <div style="text-align: center; margin: 2rem 0">
            <el-button type="primary" @click="() => { saveScrollPosition(); showComparisonDialog = true }" class="comparison-button">
              <el-icon><i class="el-icon-s-data"></i></el-icon>
              宫殿对比
            </el-button>
          </div>

          <!-- 页脚 -->
          <footer class="footer container" style="text-align: center; padding: 2rem">
            <el-divider />
            <p>©2026 仲恺农业工程学院 | 中国大学生计算机设计大赛 | 信息可视化-数据可视化</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #999">数据来源：《中国古代建筑史》《营造法式》、唐宋宫殿考古发掘报告、国家文物局公开遗址数据</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #999">仅用于中国大学生计算机设计大赛参赛，不用于商业用途</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #999">作者：陈创鸿、刘晶晶</p>
          </footer>
        </el-main>
      </el-container>

      <!-- 宫殿详情弹窗 -->
      <el-dialog
        v-model="showPalaceDialog"
        :title="selectedPalace ? selectedPalace.name + ' 详细信息' : '宫殿详情'"
        width="80%"
        :before-close="() => { showPalaceDialog = false; restoreScrollPosition() }"
        custom-class="palace-dialog"
      >
        <div v-if="selectedPalace" class="palace-detail">
          <div class="palace-detail-header">
            <div style="display: flex; align-items: center;">
              <h2 style="color: var(--text-accent); font-weight: bold; font-family: 'Noto Serif SC', serif;">{{ selectedPalace.name }}</h2>
              <button class="read-aloud-button" @click="readAloud(selectedPalace.name)" title="朗读宫殿名称">
                <el-icon><i class="el-icon-microphone"></i></el-icon>
              </button>
            </div>
            <el-tag :type="selectedPalace.dynasty === '唐代' ? 'danger' : 'warning'" effect="dark" size="large">
              {{ selectedPalace.dynasty }}
            </el-tag>
          </div>
          
          <!-- 诗词名句 -->
          <div class="poem-quote" style="margin: 1rem 0; padding: 1rem; background: rgba(230, 180, 34, 0.1); border-left: 3px solid var(--text-accent); font-style: italic;">
            <p style="color: var(--text-accent); margin: 0;">{{ selectedPalace.relatedPoem || getPalaceQuote(selectedPalace.name) }}</p>
          </div>
          
          <div class="palace-detail-info">
            <p style="color: var(--text-body);">
              <el-icon><i class="el-icon-location"></i></el-icon>
              <strong style="color: var(--text-primary);">地点：</strong>{{ selectedPalace.location }}
            </p>
            <p style="color: var(--text-body);">
              <el-icon><i class="el-icon-date"></i></el-icon>
              <strong style="color: var(--text-primary);">建造年份：</strong>{{ selectedPalace.buildYear }}
            </p>
            <p style="color: var(--text-body);">
              <el-icon><i class="el-icon-data-line"></i></el-icon>
              <strong style="color: var(--text-primary);">建筑面积：</strong>{{ selectedPalace.area }}
            </p>
          </div>
          
          <!-- 建筑信息卡片 -->
          <div class="palace-info-cards" style="margin: 1.5rem 0;">
            <el-row :gutter="15">
              <el-col :span="8" v-if="selectedPalace.dimensions">
                <div class="info-card" style="background: rgba(196, 69, 54, 0.1); border: 1px solid rgba(196, 69, 54, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                  <div style="color: var(--text-accent); font-size: 0.9rem; margin-bottom: 0.5rem;">面阔/开间</div>
                  <div style="color: var(--text-primary); font-weight: bold;">{{ selectedPalace.dimensions }}</div>
                </div>
              </el-col>
              <el-col :span="8" v-if="selectedPalace.roofStyle">
                <div class="info-card" style="background: rgba(230, 180, 34, 0.1); border: 1px solid rgba(230, 180, 34, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                  <div style="color: var(--text-accent); font-size: 0.9rem; margin-bottom: 0.5rem;">屋顶样式</div>
                  <div style="color: var(--text-primary); font-weight: bold;">{{ selectedPalace.roofStyle }}</div>
                </div>
              </el-col>
              <el-col :span="8" v-if="selectedPalace.preservationStatus">
                <div class="info-card" style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                  <div style="color: var(--text-accent); font-size: 0.9rem; margin-bottom: 0.5rem;">保存状态</div>
                  <div style="color: var(--text-primary); font-weight: bold;">{{ selectedPalace.preservationStatus }}</div>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="15" style="margin-top: 1rem;">
              <el-col :span="12" v-if="selectedPalace.associatedEmperor">
                <div class="info-card" style="background: rgba(156, 39, 176, 0.1); border: 1px solid rgba(156, 39, 176, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                  <div style="color: var(--text-accent); font-size: 0.9rem; margin-bottom: 0.5rem;">所属帝王</div>
                  <div style="color: var(--text-primary); font-weight: bold;">{{ selectedPalace.associatedEmperor }}</div>
                </div>
              </el-col>
              <el-col :span="12" v-if="selectedPalace.culturalLevel">
                <div class="info-card" style="background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                  <div style="color: var(--text-accent); font-size: 0.9rem; margin-bottom: 0.5rem;">文化等级</div>
                  <div style="color: var(--text-primary); font-weight: bold;">{{ selectedPalace.culturalLevel }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <!-- 历史背景 -->
          <div class="detail-section" style="margin: 1.5rem 0;" v-if="selectedPalace.historicalBackground">
            <h3 style="color: var(--text-accent); font-weight: bold; font-family: 'Noto Serif SC', serif; margin-bottom: 0.5rem;">历史背景</h3>
            <p style="color: var(--text-body); line-height: 1.6;">{{ selectedPalace.historicalBackground }}</p>
          </div>
          
          <!-- 建筑特点 -->
          <div class="detail-section" style="margin: 1.5rem 0;" v-if="selectedPalace.architecturalFeatures">
            <h3 style="color: var(--text-accent); font-weight: bold; font-family: 'Noto Serif SC', serif; margin-bottom: 0.5rem;">建筑结构特点</h3>
            <p style="color: var(--text-body); line-height: 1.6;">{{ selectedPalace.architecturalFeatures }}</p>
            <div v-if="selectedPalace.mainHall" style="margin-top: 0.5rem;">
              <p style="color: var(--text-body); margin: 0.25rem 0;"><strong style="color: var(--text-primary);">主要建筑：</strong>{{ selectedPalace.mainHall }}</p>
            </div>
          </div>
          
          <!-- 文化价值 -->
          <div class="detail-section" style="margin: 1.5rem 0;" v-if="selectedPalace.culturalSignificance">
            <h3 style="color: var(--text-accent); font-weight: bold; font-family: 'Noto Serif SC', serif; margin-bottom: 0.5rem;">文化价值</h3>
            <p style="color: var(--text-body); line-height: 1.6;">{{ selectedPalace.culturalSignificance }}</p>
          </div>
          
          <div class="poet-detail-related" v-if="relatedPalaces.length > 0">
            <h3 style="color: var(--text-accent); font-weight: bold; font-family: 'Noto Serif SC', serif; margin: 1.5rem 0 0.5rem 0;">相关宫殿推荐</h3>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8" v-for="(palace, index) in relatedPalaces" :key="index">
                <el-card @click="handlePalaceClick(palace)" class="related-poet-card" style="background: var(--card-bg); border: 1px solid var(--border-color); transition: all 0.3s ease;">
                  <h4 style="color: var(--text-primary); font-weight: bold; font-family: 'Noto Serif SC', serif; margin-bottom: 0.5rem;">{{ palace.name }}</h4>
                  <p style="color: var(--text-body); font-size: 0.9rem; margin-bottom: 0.25rem;">{{ palace.dynasty }} · {{ palace.location }}</p>
                  <p style="color: var(--text-accent); font-size: 0.85rem; font-weight: 500;">{{ palace.area }}</p>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-dialog>

      <!-- 古今地名对应表弹窗 -->
      <el-dialog
        v-model="showPlaceNameDialog"
        title="古今地名对应表"
        width="60%"
        :before-close="() => { showPlaceNameDialog = false; restoreScrollPosition() }"
      >
        <div class="place-name-table">
          <el-table :data="placeNameMap" style="width: 100%">
              <el-table-column prop="ancient" label="古代地名" width="180">
                <template #default="scope">
                  <span style="color: var(--text-accent)">{{ scope.row.ancient }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="modern" label="现代省份" width="180">
                <template #default="scope">
                  <span style="color: var(--text-primary)">{{ scope.row.modern }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="notes" label="备注">
                <template #default="scope">
                  <span style="color: var(--text-secondary)">{{ scope.row.notes }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary)">
              <p>注：本表列举了唐宋时期主要地域的古今地名对应关系，仅供参考。</p>
            </div>
        </div>
      </el-dialog>

      <!-- 宫殿对比弹窗 -->
      <el-dialog
        v-model="showComparisonDialog"
        title="宫殿对比分析"
        width="90%"
        :before-close="() => { showComparisonDialog = false; restoreScrollPosition() }"
        custom-class="palace-comparison-dialog"
      >
        <div class="palace-comparison">
          <!-- 宫殿选择 -->
          <div class="palace-selector" style="margin-bottom: 2rem">
            <el-row :gutter="20">
              <el-col :span="11">
                <el-form-item label="宫殿 1" style="color: var(--text-accent)">
                  <el-select v-model="palace1" placeholder="请选择宫殿" style="width: 100%">
                    <el-option
                      v-for="palace in palaces"
                      :key="palace.id"
                      :label="palace.name + ' (' + palace.dynasty + ') ' + palace.location"
                      :value="palace"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="2" style="display: flex; align-items: center; justify-content: center; color: var(--text-accent); font-size: 1.2rem">
                VS
              </el-col>
              <el-col :span="11">
                <el-form-item label="宫殿 2" style="color: var(--text-accent)">
                  <el-select v-model="palace2" placeholder="请选择宫殿" style="width: 100%">
                    <el-option
                      v-for="palace in palaces"
                      :key="palace.id"
                      :label="palace.name + ' (' + palace.dynasty + ') ' + palace.location"
                      :value="palace"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 对比表格 -->
          <div v-if="palace1 && palace2" class="comparison-table">
            <el-table style="width: 100%" :data="comparisonData">
              <el-table-column prop="attribute" label="对比项" width="180">
                <template #default="scope">
                  <span style="color: var(--text-accent)">{{ scope.row.attribute }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="palace1" label="宫殿 1">
                <template #default="scope">
                  <span style="color: var(--text-body)">{{ scope.row.palace1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="palace2" label="宫殿 2">
                <template #default="scope">
                  <span style="color: var(--text-body)">{{ scope.row.palace2 }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="no-data" style="text-align: center; padding: 3rem; color: var(--text-secondary)">
            请选择两座宫殿进行对比
          </div>
        </div>
      </el-dialog>

      <!-- 历史浏览记录弹窗 -->
      <el-dialog
        v-model="showHistoryDialog"
        title="历史浏览记录"
        width="60%"
        :before-close="() => { showHistoryDialog = false; restoreScrollPosition() }"
        custom-class="history-dialog"
      >
        <div class="history-dialog-content">
          <div v-if="historyRecords.length > 0">
            <div class="history-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem">
              <span style="color: var(--text-accent); font-size: 1.1rem; font-weight: bold">最近浏览的宫殿</span>
              <el-button type="text" @click="clearHistoryRecords" style="color: var(--text-accent); padding: 0">
                清空记录
              </el-button>
            </div>
            <div class="history-list" style="max-height: 400px; overflow-y: auto">
              <el-card 
                v-for="record in historyRecords" 
                :key="record.id"
                @click="openHistoryPalace(record.id)"
                class="history-card"
                style="margin-bottom: 0.5rem; cursor: pointer"
              >
                <div class="history-card-content">
                  <h4 style="color: var(--text-accent); margin: 0 0 0.25rem 0">{{ record.name }}</h4>
                  <p style="margin: 0; font-size: 0.9rem; color: var(--text-body)">{{ record.dynasty }} · {{ record.location }}</p>
                  <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary)">{{ record.area }}</p>
                </div>
              </el-card>
            </div>
          </div>
          <div v-else class="no-history" style="text-align: center; padding: 3rem; color: var(--text-secondary)">
            <el-empty description="暂无浏览记录" />
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
/* 引入字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap');

/* 英雄区样式 */
.hero-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 20px rgba(230, 180, 34, 0.5);
  letter-spacing: 2px;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-accent);
  margin: 0.5rem 0 0.5rem 0;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 2px;
}

.hero-motto {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 1rem 0;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 1px;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(230, 180, 34, 0.3);
}

.hero-description {
  font-size: 1rem;
  color: var(--text-body);
  margin: 1rem 0 2rem 0;
  max-width: 600px;
  line-height: 1.6;
  letter-spacing: 1px;
}

/* 加载动画样式 - 卷轴展开效果 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(28, 12, 35, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
  position: relative;
}

/* 卷轴展开动画 */
.spinner {
  width: 200px;
  height: 120px;
  position: relative;
  margin: 0 auto 30px;
}

.spinner::before,
.spinner::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, #8b3429, #c44536);
  border-radius: 10px;
  animation: scroll 2s ease-in-out infinite;
}

.spinner::before {
  left: 0;
  animation-delay: 0s;
}

.spinner::after {
  right: 0;
  animation-delay: 1s;
}

.scroll-content {
  position: absolute;
  top: 10px;
  left: 50px;
  right: 50px;
  bottom: 10px;
  background: linear-gradient(to bottom, #e6b422, #f0d98c);
  border-radius: 5px;
  animation: reveal 2s ease-in-out infinite;
  opacity: 0;
}

@keyframes scroll {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(20px);
  }
}

@keyframes reveal {
  0% {
    opacity: 0;
    transform: scaleY(0);
  }
  50% {
    opacity: 1;
    transform: scaleY(1);
  }
  100% {
    opacity: 0;
    transform: scaleY(0);
  }
}

.loading-text {
  color: #f5c5b6;
  font-family: 'Noto Serif SC', serif;
  font-size: 1.2rem;
  margin: 0;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* 毛笔笔触样式的模块分隔线 */
.brush-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #e6b422, #c44536, #e6b422, transparent);
  margin: 2rem 0;
  position: relative;
}

.brush-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(230, 180, 34, 0.5), rgba(196, 69, 54, 0.5), rgba(230, 180, 34, 0.5), transparent);
  border-radius: 2px;
}

/* 圆润造型的按钮 */
.round-button {
  border-radius: 50px !important;
  padding: 8px 24px !important;
  transition: all 0.3s ease !important;
}

.round-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 5px 15px rgba(230, 180, 34, 0.3) !important;
}

/* 全局动画类 */
.fade-in {
  animation: fadeIn 0.8s ease-in-out;
}

.slide-up {
  animation: slideUp 0.6s ease-out;
}

/* 动画关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 滚动动画 */
.scroll-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease-out;
}

.scroll-animate.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 项目简介模块样式 */
.project-intro {
  padding: 2rem 0;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin: 1rem 0;
}

.intro-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.intro-text {
  color: var(--text-body);
  line-height: 1.6;
  margin: 1rem 0;
  font-size: 1rem;
}

/* 模块标题样式 */
.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-color), var(--gold-color), var(--theme-color));
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .section-title {
    font-size: 1.2rem;
  }
}

.intro-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-body);
  margin: 1rem 0;
  position: relative;
  padding: 0 2rem;
}

.intro-text::before,
.intro-text::after {
  content: '•';
  color: #e6b422;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
}

.intro-text::before {
  left: 0;
}

.intro-text::after {
  right: 0;
}

@media (max-width: 768px) {
  .intro-text {
    padding: 0 1rem;
    font-size: 1rem;
  }
  
  .intro-text::before,
  .intro-text::after {
    display: none;
  }
}

/* 呼吸动画 */
.breathe-animation {
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 10px 30px -10px rgba(196, 69, 54, 0.3), 0 0 20px rgba(196, 69, 54, 0.2);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 15px 35px -10px rgba(196, 69, 54, 0.4), 0 0 25px rgba(196, 69, 54, 0.3);
  }
}

.description {
  color: var(--el-text-color-regular);
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

/* 筛选器样式 */
.filter-container {
  transition: all 0.3s ease;
}

/* 相关宫殿推荐卡片样式 */
.related-poet-card {
  transition: all 0.3s ease;
}

.related-poet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(196, 69, 54, 0.2);
  border-color: var(--text-accent);
}

.filter-input,
.filter-select {
  width: 100%;
  background: #2a213a;
  border: 1px solid #5a3d7a;
  color: #f0e6d6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.filter-input::placeholder,
.filter-select::placeholder {
  color: #9a8ba6;
}

.filter-input:hover,
.filter-select:hover {
  border-color: #d4a373;
  box-shadow: 0 0 8px rgba(212, 163, 115, 0.2);
}

.filter-input:focus,
.filter-select:focus {
  border-color: #d4a373;
  box-shadow: 0 0 12px rgba(212, 163, 115, 0.3);
}

.reset-button {
  width: 100%;
  background: transparent;
  border: 1px solid #d4a373;
  color: #d4a373;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.reset-button:hover {
  background: #d4a373;
  color: #1a1429;
}

/* 标签化筛选条件样式 */
.filter-tags {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  background: #2a213a;
  border: 1px solid #d4a373;
  color: #f0e6d6;
  border-radius: 16px;
  font-size: 0.9rem;
  padding: 0.25rem 0.75rem;
  transition: all 0.3s ease;
}

.filter-tag:hover {
  background: #d4a373;
  color: #1a1429;
  border-color: #d4a373;
}

.filter-tag .el-tag__close {
  color: #f0e6d6;
}

.filter-tag .el-tag__close:hover {
  color: #1a1429;
  background: rgba(255, 255, 255, 0.2);
}

/* 分页组件样式 */
.el-pagination {
  margin-top: 2rem;
  text-align: center;
}

.el-pagination .el-pagination__total,
.el-pagination .el-pagination__sizes,
.el-pagination .el-pagination__jump {
  color: #f0e6d6;
}

.el-pagination .el-select .el-input__inner {
  background: #2a213a;
  border: 1px solid #5a3d7a;
  color: #f0e6d6;
}

.el-pagination .el-pagination__button {
  background: #2a213a;
  border: 1px solid #5a3d7a;
  color: #f0e6d6;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.el-pagination .el-pagination__button:hover {
  background: #d4a373;
  color: #1a1429;
  border-color: #d4a373;
}

.el-pagination .el-pagination__button:disabled {
  background: #2a213a;
  border: 1px solid #5a3d7a;
  color: #9a8ba6;
}

.el-pagination .el-pager li {
  background: #2a213a;
  border: 1px solid #5a3d7a;
  color: #f0e6d6;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.el-pagination .el-pager li:hover {
  background: #d4a373;
  color: #1a1429;
  border-color: #d4a373;
}

.el-pagination .el-pager li.active {
  background: #d4a373;
  color: #1a1429;
  border-color: #d4a373;
}

/* 容器样式 */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--module-padding);
  margin-bottom: var(--module-margin);
}

/* 字体层级优化 */
/* 模块标题：加粗金色，20px */
.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: bold;
  color: #e6b422;
  margin-bottom: 1rem;
  position: relative;
  padding-left: 1rem;
}

/* 子标题：常规金色，18px */
.sub-section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: normal;
  color: #e6b422;
  margin-bottom: 0.8rem;
}

/* 正文：浅灰色，16px */
.body-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  color: #f0e6d6;
  line-height: 1.6;
}

/* 小字说明：浅灰色斜体，14px */
.small-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  color: #9a8ba6;
  font-style: italic;
  line-height: 1.5;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: linear-gradient(to bottom, #c44536, #e6b422);
  border-radius: 2px;
}

.chart-container {
  height: 400px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  box-shadow: var(--theme-shadow);
}

.map-container {
  height: var(--desktop-map-height);
  background: var(--card-bg);
  border-radius: 12px;
  padding: var(--module-padding);
  box-shadow: var(--theme-shadow);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-container:hover {
  transform: translateY(-5px);
  box-shadow: var(--theme-shadow), 0 0 25px rgba(230, 180, 34, 0.3);
  border-color: #e6b422;
}

.map-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 8px solid transparent;
  border-image: linear-gradient(45deg, rgba(196, 69, 54, 0.3), rgba(230, 180, 34, 0.3)) 1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.map-container:hover {
  transform: translateY(-5px);
  box-shadow:
    0 20px 40px -10px rgba(196, 69, 54, 0.4),
    0 0 30px rgba(196, 69, 54, 0.3);
}

.map-container:hover::before {
  opacity: 1;
}

/* 导航栏样式 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(13, 17, 23, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(196, 69, 54, 0.3);
  height: 60px;
  transition: all 0.3s ease;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 2rem;
}

.navbar-logo {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #e6b422;
  cursor: pointer;
}

.navbar-menu {
  background: transparent;
  border: none;
}

.navbar-menu .el-menu-item {
  color: var(--el-text-color-primary);
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  margin: 0 0.5rem;
  transition: all 0.3s ease;
}

.navbar-menu .el-menu-item:hover {
  color: #e6b422;
  background: rgba(230, 180, 34, 0.1);
}

.navbar-menu .el-menu-item.is-active {
  color: #e6b422;
  background: rgba(230, 180, 34, 0.1);
}

/* 移动端导航 */
.mobile-menu {
  display: none;
}

/* 调整内容区域的上边距，避免被导航栏遮挡 */
.hero {
  margin-top: 0px;
}

/* 响应式样式 */
@media (max-width: 1024px) {
  .navbar-container {
    padding: 0 1.5rem;
  }

  .navbar-logo {
    font-size: 1.3rem;
  }

  .navbar-menu .el-menu-item {
    font-size: 0.9rem;
    margin: 0 0.3rem;
  }
}

@media (max-width: 768px) {
  .desktop-menu {
    display: none;
  }

  .mobile-menu {
    display: block;
  }

  .navbar-container {
    padding: 0 1rem;
  }

  .navbar-logo {
    font-size: 1.2rem;
  }

  /* 调整地图容器高度 */
  .map-container {
    height: 300px;
  }

  /* 调整统计数据布局 */
  .stats-row {
    flex-direction: column;
    align-items: center;
  }

  .stat-col {
    width: 100%;
    max-width: 300px;
    margin-bottom: 1rem;
  }

  /* 调整筛选器布局 */
  .filter-container .el-row {
    flex-direction: column;
  }

  .filter-container .el-col {
    width: 100%;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .navbar-logo {
    font-size: 1.1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .map-container {
    height: 250px;
    padding: 1rem;
  }

  .container {
    padding: 0 1rem;
  }
}

/* 右侧导航栏样式 */
.right-nav {
  position: fixed;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
  animation: fadeIn 0.8s ease-in-out;
}

.nav-rail {
  position: relative;
  width: 48px;
  max-height: 80vh;
  max-height: 600px;
  background: rgba(28, 12, 35, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(245, 197, 182, 0.3);
  box-shadow: 0 10px 30px -10px rgba(196, 69, 54, 0.3);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 0;
}

.nav-rail-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(245, 197, 182, 0.3) rgba(28, 12, 35, 0.85);
}

.nav-rail-content::-webkit-scrollbar {
  width: 4px;
}

.nav-rail-content::-webkit-scrollbar-track {
  background: rgba(28, 12, 35, 0.85);
  border-radius: 2px;
}

.nav-rail-content::-webkit-scrollbar-thumb {
  background: rgba(245, 197, 182, 0.3);
  border-radius: 2px;
}

.nav-rail-content::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 197, 182, 0.5);
}

.nav-rail:hover {
  width: 168px;
}

.nav-rail-item {
  width: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.35s ease;
  padding: 8px 0;
  margin-bottom: 4px;
}

.nav-rail-item.back-to-top {
  margin-top: 16px;
  padding: 8px 0;
  animation: slideIn 0.5s ease-in-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-rail-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-left: 12px;
  background: #ccc;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.nav-rail-item:hover .nav-rail-dot {
  transform: scale(1.2);
}

.nav-rail-item.active .nav-rail-dot {
  background: linear-gradient(135deg, #ff9f98, #f5c5b6);
  box-shadow: 0 0 12px rgba(245, 197, 182, 0.6);
  transform: scale(1.2);
}

.nav-rail-icon {
  margin-left: 12px;
  font-size: 16px;
  color: #ccc;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease 0.1s;
}

.nav-rail-item.active .nav-rail-icon {
  color: #f5c5b6;
}

.nav-rail-label {
  margin-left: 8px;
  font-size: 14px;
  color: #ccc;
  font-family: 'Noto Serif SC', serif;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease 0.2s;
  white-space: nowrap;
}

.nav-rail-item.active .nav-rail-label {
  color: #f5c5b6;
}

.nav-rail:hover .nav-rail-icon,
.nav-rail:hover .nav-rail-label {
  opacity: 1;
  transform: translateX(0);
}

/* 移动端导航按钮 */
.mobile-nav-toggle {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 999;
  animation: fadeIn 0.8s ease-in-out;
}

.nav-control-button {
  background: rgba(28, 12, 35, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(245, 197, 182, 0.3);
  color: #f5c5b6;
  transition: all 0.3s ease;
}

.nav-control-button:hover {
  background: rgba(28, 12, 35, 0.95);
  border-color: #f5c5b6;
  transform: scale(1.1);
}

/* 无障碍优化 - 键盘焦点提示 */
button:focus,
.el-button:focus,
.el-input:focus,
.el-select:focus,
.el-card:focus {
  outline: none;
  border-color: #c44536 !important;
  box-shadow: 0 0 0 2px rgba(196, 69, 54, 0.5) !important;
}

/* 朗读按钮样式 */
.read-aloud-button {
  background: transparent;
  border: 1px solid #e6b422;
  color: #e6b422;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
}

.read-aloud-button:hover {
  background: #e6b422;
  color: #1a1429;
  transform: scale(1.1);
}

.mobile-nav-toggle .el-button {
  background: rgba(28, 12, 35, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(245, 197, 182, 0.3);
  color: #f5c5b6;
}

.mobile-nav-toggle .el-button:hover {
  background: rgba(28, 12, 35, 0.95);
  border-color: #f5c5b6;
}

/* 抽屉导航头部 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.drawer-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #f5c5b6;
  margin: 0;
}

.close-button {
  color: #f5c5b6;
  font-size: 1.2rem;
}

.close-button:hover {
  color: #ff9f98;
}

/* 移动端抽屉导航 */
.mobile-nav-content {
  padding: 1rem;
  height: 100%;
  background: rgba(28, 12, 35, 0.95);
}

.mobile-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-nav-item:hover {
  background: rgba(245, 197, 182, 0.1);
}

.mobile-nav-item.active {
  background: rgba(245, 197, 182, 0.2);
}

.mobile-nav-icon {
  font-size: 1.2rem;
  color: #ccc;
  margin-right: 1rem;
  transition: all 0.3s ease;
}

.mobile-nav-item.active .mobile-nav-icon {
  color: #f5c5b6;
}

.mobile-nav-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  color: #ccc;
  transition: all 0.3s ease;
}

.mobile-nav-item.active .mobile-nav-text {
  color: #f5c5b6;
}

/* 响应式样式 */
@media (max-width: 1024px) {
  .right-nav {
    right: 1rem;
  }

  .nav-rail {
    width: 40px;
  }

  .nav-rail:hover {
    width: 140px;
  }

  .nav-rail-dot {
    width: 20px;
    height: 20px;
    margin-left: 10px;
  }

  .mobile-nav-toggle {
    bottom: 1.5rem;
    right: 1.5rem;
  }
}

@media (max-width: 768px) {
  .right-nav {
    display: none;
  }

  .mobile-nav-toggle {
    bottom: 1rem;
    right: 1rem;
  }
  
  /* 移动端地图高度 */
  .map-container {
    height: var(--mobile-map-height);
  }
}

/* 宫殿详情弹窗样式 */
.palace-detail {
  padding: 1rem 0;
}

.poet-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.poet-detail-header h2 {
  font-family: 'Noto Serif SC', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.poet-detail-info {
  background: rgba(26, 20, 41, 0.8);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid rgba(196, 69, 54, 0.3);
}

.poet-detail-info p {
  color: var(--el-text-color-regular);
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.poet-detail-info strong {
  color: #e6b422;
}

.poet-detail-works {
  margin-bottom: 2rem;
}

.poet-detail-works h3 {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #e6b422;
  margin: 0 0 1rem 0;
}

.poet-detail-works ul {
  list-style: none;
  padding: 0;
  margin: 0;
  background: rgba(26, 20, 41, 0.8);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(196, 69, 54, 0.3);
}

.work-item {
  margin: 1rem 0;
  border: 1px solid rgba(196, 69, 54, 0.2);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.work-item:hover {
  border-color: rgba(230, 180, 34, 0.5);
  box-shadow: 0 5px 15px rgba(196, 69, 54, 0.2);
}

.work-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(26, 20, 41, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
}

.work-title:hover {
  background: rgba(26, 20, 41, 0.8);
}

.work-title::before {
  content: "•";
  color: #e6b422;
  position: absolute;
  left: 1rem;
  font-size: 1.2rem;
}

.expand-icon {
  color: #e6b422;
  transition: transform 0.3s ease;
}

.work-content {
  padding: 1rem;
  background: rgba(14, 10, 24, 0.6);
  border-top: 1px solid rgba(196, 69, 54, 0.2);
  line-height: 1.8;
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  color: var(--el-text-color-regular);
  max-height: 300px;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
}

.work-content p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
}

/* 滚动条样式 */
.work-content::-webkit-scrollbar {
  width: 8px;
}

.work-content::-webkit-scrollbar-track {
  background: rgba(14, 10, 24, 0.6);
  border-radius: 4px;
}

.work-content::-webkit-scrollbar-thumb {
  background: rgba(230, 180, 34, 0.5);
  border-radius: 4px;
}

.work-content::-webkit-scrollbar-thumb:hover {
  background: rgba(230, 180, 34, 0.8);
}

.poet-detail-related {
  margin-top: 2rem;
}

.poet-detail-related h3 {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #e6b422;
  margin: 0 0 1rem 0;
}

.related-poet-card {
  background: rgba(26, 20, 41, 0.8);
  border: 1px solid rgba(196, 69, 54, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.related-poet-card::after {
  content: '点击查看详情';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #e6b422;
  padding: 8px;
  text-align: center;
  font-size: 0.8rem;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.related-poet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px -10px rgba(196, 69, 54, 0.4);
  border-color: rgba(230, 180, 34, 0.5);
}

.related-poet-card:hover::after {
  transform: translateY(0);
}

.related-poet-card h4 {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.related-poet-card p {
  color: var(--el-text-color-regular);
  margin: 0.3rem 0;
  font-size: 0.9rem;
}

/* 弹窗样式 */
:deep(.el-dialog__header) {
  background: rgba(28, 12, 35, 0.95);
  border-bottom: 1px solid rgba(196, 69, 54, 0.3);
}

:deep(.el-dialog__title) {
  color: #fff;
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 600;
}

:deep(.el-dialog) {
  background: rgba(14, 10, 24, 0.95);
  border: 1px solid rgba(196, 69, 54, 0.3);
  border-radius: 12px;
}

:deep(.el-dialog__body) {
  background: rgba(14, 10, 24, 0.95);
  color: #fff;
}

:deep(.el-dialog__footer) {
  background: rgba(28, 12, 35, 0.95);
  border-top: 1px solid rgba(196, 69, 54, 0.3);
}

:deep(.el-button--primary) {
  background: #c44536;
  border-color: #c44536;
}

:deep(.el-button--primary:hover) {
  background: #a63a2d;
  border-color: #a63a2d;
}

:deep(.el-button--default) {
  background: transparent;
  border-color: #e6b422;
  color: #e6b422;
}

:deep(.el-button--default:hover) {
  background: #e6b422;
  color: #1a1429;
}
</style>
