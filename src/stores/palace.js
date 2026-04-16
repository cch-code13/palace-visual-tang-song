import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import palacesData from '@/data/data.palaces.json'

// 从localStorage加载收藏数据
const loadFavorites = () => {
  try {
    const favorites = localStorage.getItem('palaceFavorites')
    return favorites ? JSON.parse(favorites) : []
  } catch (error) {
    console.error('Failed to load favorites:', error)
    return []
  }
}

// 保存收藏数据到localStorage
const saveFavorites = (favorites) => {
  try {
    localStorage.setItem('palaceFavorites', JSON.stringify(favorites))
  } catch (error) {
    console.error('Failed to save favorites:', error)
  }
}

export const usePalaceStore = defineStore('palace', () => {
  // State
  const palaces = ref(palacesData)
  const loading = ref(false)
  const filters = ref({
    search: '',
    dynasty: '',
    location: '',
    area: '',
    sortBy: ''
  })
  const currentPage = ref(1)
  const pageSize = ref(8)
  const selectedPalace = ref(null)
  const comparisonPalaces = ref([])
  const favorites = ref(loadFavorites())

  // Getters
  const filteredPalaces = computed(() => {
    let result = palaces.value.filter((palace) => {
      const matchesSearch = !filters.value.search || 
        palace.name.toLowerCase().includes(filters.value.search.toLowerCase())
      const matchesDynasty = !filters.value.dynasty || 
        palace.dynasty === filters.value.dynasty
      const matchesLocation = !filters.value.location || 
        palace.location.includes(filters.value.location)
      
      // 面积筛选
      let matchesArea = true
      if (filters.value.area) {
        const area = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
        switch (filters.value.area) {
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
    
    // 排序
    if (filters.value.sortBy) {
      result.sort((a, b) => {
        const areaA = parseFloat(a.area.replace(/[^0-9.]/g, '')) || 0
        const areaB = parseFloat(b.area.replace(/[^0-9.]/g, '')) || 0
        return filters.value.sortBy === 'desc' ? areaB - areaA : areaA - areaB
      })
    }
    
    return result
  })

  const paginatedPalaces = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredPalaces.value.slice(start, end)
  })

  const totalPalaces = computed(() => filteredPalaces.value.length)

  const dynastyOptions = computed(() => {
    return ['', ...new Set(palaces.value.map((palace) => palace.dynasty))]
  })

  const stats = computed(() => {
    const totalPalaces = palaces.value.length
    const totalArea = palaces.value.reduce((sum, palace) => {
      const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
      return sum + areaValue
    }, 0)
    const totalLocations = new Set(palaces.value.map(palace => palace.location)).size
    
    return [
      { value: `${totalPalaces}+`, target: totalPalaces, label: '收录宫殿' },
      { value: `${totalArea.toFixed(1)}`, target: totalArea, label: '总建筑面积(万平方米)' },
      { value: `${totalLocations}+`, target: totalLocations, label: '覆盖地区' },
    ]
  })

  // 收藏相关的getters
  const favoritePalaces = computed(() => {
    return palaces.value.filter(palace => 
      favorites.value.some(fav => fav.id === palace.id)
    )
  })

  const isFavorite = computed(() => {
    return (palaceId) => {
      return favorites.value.some(fav => fav.id === palaceId)
    }
  })

  // Actions
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1 // 重置到第一页
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      dynasty: '',
      location: '',
      area: '',
      sortBy: ''
    }
    currentPage.value = 1
  }

  const setPage = (page) => {
    currentPage.value = page
  }

  const setPageSize = (size) => {
    pageSize.value = size
    currentPage.value = 1
  }

  const selectPalace = (palace) => {
    selectedPalace.value = palace
  }

  const addToComparison = (palace) => {
    if (comparisonPalaces.value.length < 2) {
      if (!comparisonPalaces.value.find(p => p.id === palace.id)) {
        comparisonPalaces.value.push(palace)
        return true
      }
    }
    return false
  }

  const removeFromComparison = (palaceId) => {
    comparisonPalaces.value = comparisonPalaces.value.filter(p => p.id !== palaceId)
  }

  const clearComparison = () => {
    comparisonPalaces.value = []
  }

  // 收藏相关的actions
  const addFavorite = (palace) => {
    const existingIndex = favorites.value.findIndex(fav => fav.id === palace.id)
    if (existingIndex === -1) {
      favorites.value.push({
        id: palace.id,
        timestamp: new Date().toISOString()
      })
      saveFavorites(favorites.value)
      return true
    }
    return false
  }

  const removeFavorite = (palaceId) => {
    const existingIndex = favorites.value.findIndex(fav => fav.id === palaceId)
    if (existingIndex !== -1) {
      favorites.value.splice(existingIndex, 1)
      saveFavorites(favorites.value)
      return true
    }
    return false
  }

  const toggleFavorite = (palace) => {
    const existingIndex = favorites.value.findIndex(fav => fav.id === palace.id)
    if (existingIndex === -1) {
      return addFavorite(palace)
    } else {
      return removeFavorite(palace.id)
    }
  }

  const getFavorites = () => {
    return favorites.value
  }

  return {
    // State
    palaces,
    loading,
    filters,
    currentPage,
    pageSize,
    selectedPalace,
    comparisonPalaces,
    favorites,
    // Getters
    filteredPalaces,
    paginatedPalaces,
    totalPalaces,
    dynastyOptions,
    stats,
    favoritePalaces,
    isFavorite,
    // Actions
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    selectPalace,
    addToComparison,
    removeFromComparison,
    clearComparison,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavorites
  }
})
