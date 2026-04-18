<script setup>
import { mapData } from '@/assets'
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import palaces from '@/data/data.palaces.json'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['palaceClick']);
const charts = ref(null)
let myChart = null

// 视图状态
const viewMode = ref('nation') // nation: 全国视图, city: 城市视图
const currentCity = ref(null) // 当前选中的城市

// 高亮状态管理
let cityViewLabelData = []; // 保存城市视图的标签数据
let cityViewPalaceData = []; // 保存城市视图的宫殿数据
let highlightTimer = null; // 高亮定时器

// 获取当前主题
const getCurrentTheme = () => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// 获取主题对应的文字颜色
const getTextColor = () => {
  return getCurrentTheme() === 'dark' ? '#ffffff' : '#5A2D18';
};

// 获取主题对应的边框颜色
const getBorderColor = () => {
  return getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536';
};

// 获取主题对应的背景颜色
const getBackgroundColor = () => {
  return getCurrentTheme() === 'dark' ? '#121212' : '#ffffff';
};

let highlightAnimationFrame = null; // 高亮动画帧
const HIGHLIGHT_DURATION = 3000;
const HIGHLIGHT_SCALE = 1.16;

const cancelHighlightAnimation = () => {
  if (highlightAnimationFrame !== null) {
    cancelAnimationFrame(highlightAnimationFrame)
    highlightAnimationFrame = null
  }
}

const updateHighlightState = (dataIndex, scale) => {
  cityViewLabelData = cityViewLabelData.map((item, idx) => ({
    ...item,
    highlightScale: idx === dataIndex ? scale : 1
  }))

  cityViewPalaceData = cityViewPalaceData.map((item, idx) => ({
    ...item,
    highlightScale: idx === dataIndex ? scale : 1
  }))
}

const syncHighlightSeries = () => {
  if (!myChart) return

  myChart.setOption({
    series: [
      {},
      {
        data: cityViewLabelData.map(item => ({
          palace: item.palace,
          highlightScale: item.highlightScale || 1
        }))
      },
      {
        data: cityViewPalaceData.map(item => ({
          name: item.name,
          value: [
            item.lng,
            item.lat,
            item.areaValue,
            {
              ...item,
              highlightScale: item.highlightScale || 1
            }
          ]
        }))
      }
    ]
  }, { lazyUpdate: true, silent: true })
}

const hideHighlightOverlay = () => {
  if (!myChart) return

  myChart.setOption({
    graphic: [
      {
        id: 'palace-locate-highlight',
        invisible: true,
        style: { opacity: 0 }
      }
    ]
  }, { lazyUpdate: true, silent: true })
}

const renderHighlightOverlay = (dataIndex, scale) => {
  if (!myChart || viewMode.value !== 'city') return

  const item = cityViewLabelData[dataIndex]
  if (!item) return

  const position = myChart.convertToPixel({ geoIndex: 0 }, item.labelCoord)
  if (!position || position.length < 2) return

  const isDark = getCurrentTheme() === 'dark'
  const overlayWidth = 80
  const overlayHeight = 30
  const glowColor = 'rgba(255, 215, 0, 0.55)'
  const strokeColor = '#FFD700'
  const fillColor = isDark ? 'rgba(30,30,30,0.42)' : 'rgba(255,255,255,0.42)'

  myChart.setOption({
    graphic: [
      {
        id: 'palace-locate-highlight',
        type: 'group',
        silent: true,
        z: 9999,
        position,
        origin: [overlayWidth / 2, overlayHeight / 2],
        scale: [scale, scale],
        children: [
          {
            type: 'rect',
            shape: {
              x: -8,
              y: -8,
              width: overlayWidth + 16,
              height: overlayHeight + 16,
              r: 10
            },
            style: {
              fill: 'rgba(255,255,255,0)',
              stroke: glowColor,
              lineWidth: 12,
              shadowBlur: 24,
              shadowColor: glowColor,
              opacity: 0.9
            }
          },
          {
            type: 'rect',
            shape: {
              x: 0,
              y: 0,
              width: overlayWidth,
              height: overlayHeight,
              r: 6
            },
            style: {
              fill: fillColor,
              stroke: strokeColor,
              lineWidth: 2.5,
              shadowBlur: 14,
              shadowColor: glowColor
            }
          },
          {
            type: 'text',
            style: {
              text: item.palace.name,
              x: overlayWidth / 2,
              y: overlayHeight / 2,
              textAlign: 'center',
              textVerticalAlign: 'middle',
              fill: '#FFD700',
              fontFamily: 'Noto Serif SC',
              fontSize: 12,
              fontWeight: 'bold',
              shadowBlur: 4,
              shadowColor: 'rgba(0, 0, 0, 0.18)'
            }
          }
        ]
      }
    ]
  }, { lazyUpdate: true, silent: true })
}

const animateHighlight = (dataIndex) => {
  cancelHighlightAnimation()

  const startTime = performance.now()

  const step = (timestamp) => {
    if (!myChart) return

    const progress = Math.min((timestamp - startTime) / HIGHLIGHT_DURATION, 1)
    const eased = 1 + (HIGHLIGHT_SCALE - 1) * (
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    )

    updateHighlightState(dataIndex, eased)
    syncHighlightSeries()
    renderHighlightOverlay(dataIndex, eased)

    if (progress < 1) {
      highlightAnimationFrame = requestAnimationFrame(step)
    } else {
      hideHighlightOverlay()
      highlightAnimationFrame = null
    }
  }

  updateHighlightState(dataIndex, 1)
  syncHighlightSeries()
  renderHighlightOverlay(dataIndex, 1)
  highlightAnimationFrame = requestAnimationFrame(step)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
  
  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        initChart()
      }
    })
  })
  
  observer.observe(document.documentElement, {
    attributes: true
  })
  
  // 保存observer引用以便在卸载时清理
  window.themeObserverSongMap = observer
})

onUnmounted(() => {
  if (myChart) {
    try {
      myChart.dispose()
    } catch (e) {
      // 忽略已被销毁的实例
    }
  }
  window.removeEventListener('resize', handleResize)
  cancelHighlightAnimation()
  
  // 清理主题变化监听器
  if (window.themeObserverSongMap) {
    window.themeObserverSongMap.disconnect()
    delete window.themeObserverSongMap
  }
})

const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

const initChart = () => {
  if (!charts.value) return
  
  // 如果图表已存在，先销毁旧实例
    if (myChart) {
      try {
        myChart.dispose()
      } catch (e) {
        // 忽略已被销毁的实例
      }
      myChart = null
    }
  
  myChart = echarts.init(charts.value)
  //注册地图名
  echarts.registerMap("chinaMap", mapData)
  
  // 筛选宋代宫殿
  const songPalaces = palaces.filter(palace => palace.dynasty === '宋代')
  console.log('宋代宫殿数量:', songPalaces.length)
  console.log('宋代宫殿列表:', songPalaces.map(p => p.name))
  
  // 按城市分组处理数据
  const cityGroups = {}
  
  songPalaces.forEach(palace => {
    // 提取城市名称
    let city = palace.location
    if (city.includes('省')) {
      city = city.split('省')[1]
    }
    if (city.includes('市')) {
      city = city.split('市')[0]
    }
    
    if (!cityGroups[city]) {
      cityGroups[city] = {
        name: city,
        palaces: [],
        totalCount: 0,
        totalArea: 0,
        centerLng: 0,
        centerLat: 0
      }
    }
    
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
    cityGroups[city].palaces.push({
      ...palace,
      areaValue
    })
    cityGroups[city].totalCount++
    cityGroups[city].totalArea += areaValue
  })
  
  // 计算每个城市的中心坐标
  Object.keys(cityGroups).forEach(city => {
    const group = cityGroups[city]
    if (group.palaces.length > 0) {
      const lngSum = group.palaces.reduce((sum, palace) => sum + palace.lng, 0)
      const latSum = group.palaces.reduce((sum, palace) => sum + palace.lat, 0)
      group.centerLng = lngSum / group.palaces.length
      group.centerLat = latSum / group.palaces.length
    }
  })
  
  // 转换为城市聚合气泡数据
  const cityBubbleData = Object.values(cityGroups).map(group => ({
    name: group.name,
    value: [group.centerLng, group.centerLat, group.totalArea, group.totalCount, group.palaces],
    itemStyle: {
      color: '#FFD700', // 金黄色
      borderColor: '#B8860B', // 深金色
      borderWidth: 2
    }
  }))
  
  // 转换为宫殿数据格式（用于展开视图）
  const palaceData = songPalaces.map(palace => {
    const areaValue = parseFloat(palace.area.replace(/[^0-9.]/g, '')) || 0
    return {
      name: palace.name,
      value: [palace.lng, palace.lat, areaValue, palace],
      itemStyle: {
        color: '#FFD700', // 金黄色
        borderColor: '#B8860B', // 深金色
        borderWidth: 2
      }
    }
  })
  
  console.log('城市聚合数据:', cityBubbleData)
  console.log('宫殿数据:', palaceData)
  
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const backgroundColor = getBackgroundColor();
  
  // 根据视图模式生成配置
  let options = {}
  
  if (viewMode.value === 'nation') {
    // 全国视图 - 城市聚合气泡
    options = {
      title: {
        text: '宋代宫殿地理分布',
        textStyle: {
          color: textColor,
          fontFamily: 'Noto Serif SC',
          fontSize: 16
        }
      },
      graphic: [
        {
          type: 'text',
          left: 'right',
          bottom: '5',
          style: {
            text: '地图来源：天地图・标准地图服务（审图号：GS (2023) 2767 号）',
            fontSize: 10,
            fill: '#e6b422'
          }
        },
        {
          type: 'text',
          left: 'left',
          top: '5',
          style: {
            text: '提示：点击城市气泡查看详细宫殿分布',
            fontSize: 10,
            fill: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'
          }
        }
      ],

      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const isDark = getCurrentTheme() === 'dark';
          const cityData = params.data;
          const totalArea = cityData.value[2].toFixed(2);
          const totalCount = cityData.value[3];
          
          return `
            <div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${borderColor}; border-radius: 8px;">
              <div style="font-weight: bold; color: #e6b422; margin-bottom: 5px;">${cityData.name}地区</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">宫殿数量：${totalCount}座</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">总面积：${totalArea}万平方米</div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(230, 180, 34, 0.3);">
                <div style="color: #e6b422; font-size: 0.9rem;">点击查看详细宫殿分布</div>
              </div>
            </div>
          `;
        },
        backgroundColor: 'transparent'
      },
      geo: {
        type: "map",
        map: "chinaMap",
        roam: true,
        center: [116.0, 32.0], // 调整中心坐标，覆盖更多宋代宫殿分布区域
        zoom: 5.0, // 调整缩放级别，确保所有宋代宫殿都能在初始视图中显示
        scaleLimit: {
          min: 3,
          max: 14
        },
        itemStyle: {
          areaColor: backgroundColor, // 动态背景色
          borderColor: borderColor, // 动态边框颜色
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            areaColor: getCurrentTheme() === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderColor: borderColor, // 动态边框颜色
            borderWidth: 2
          },
          label: {
            show: true,
            color: textColor,
            fontFamily: 'Noto Serif SC'
          }
        },
        animation: true,
        animationDuration: 1000, // 统一动画时长
        animationEasing: 'cubicOut',
        // 移动端触摸优化
        touchDelay: 0,
        tooltip: {
          enterable: true
        }
      },
      series: [
        {
          type: "effectScatter",
          rippleEffect: {
            number: 3,
            scale: 3,
            brushType: 'fill',
            color: '#B8860B', // 深金色涟漪
            period: 3
          },
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              return params.data.value[3]; // 显示宫殿数量
            },
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold',
            align: 'center',
            verticalAlign: 'middle'
          },
          itemStyle: {
            color: '#FFD700', // 金黄色
            borderColor: '#B8860B', // 深金色
            borderWidth: 2,
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(255, 215, 0, 0.5)'
          },
          data: cityBubbleData,
          coordinateSystem: "geo",
          symbolSize: function(val) {
            const area = val[2];
            return Math.max(30, Math.min(60, (area / 50) + 20)) // 根据总面积调整气泡大小
          },
          animation: true,
          animationDuration: 2000,
          animationEasing: 'cubicOut',
          animationDelay: function (idx) {
            return idx * 100
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 25,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 215, 0, 0.8)',
              scale: 1.2
            },
            rippleEffect: {
              scale: 4,
              period: 2
            }
          }
        }
      ]
    };
  } else {
    // 城市视图 - 独立宫殿点位带引导线和标签
    const city = currentCity.value;
    const cityPalaces = city ? city.palaces : [];
    
    // 计算引导线和标签的布局
    // 根据宫殿数量和位置计算扇形分布角度
    const palaceCount = cityPalaces.length;
    const baseAngle = 0; // 默认起始角度
    const angleStep = palaceCount > 1 ? (Math.PI * 2 / palaceCount) : 0; // 每个宫殿之间的角度间隔
    
    // 计算标签位置（扇形分布）
    const labelData = cityPalaces.map((palace, index) => {
      // 宫殿坐标
      const pointCoord = [palace.lng, palace.lat];
      
      // 计算标签方向（扇形分布）
      const angle = baseAngle + (index * angleStep) - Math.PI / 2; // 向上偏移90度，让标签分布在上方
      
      // 引导线长度（根据缩放级别调整）
      const lineLength = 0.8; // 经纬度距离，约50-80km
      
      // 计算标签末端坐标
      const labelLng = pointCoord[0] + lineLength * Math.cos(angle);
      const labelLat = pointCoord[1] + lineLength * Math.sin(angle);
      const labelCoord = [labelLng, labelLat];
      
      // 计算箭头坐标（引导线末端的小三角形）
      const arrowSize = 0.08;
      const arrowAngle1 = angle - Math.PI / 6;
      const arrowAngle2 = angle + Math.PI / 6;
      const arrow1 = [
        labelLng + arrowSize * Math.cos(arrowAngle1),
        labelLat + arrowSize * Math.sin(arrowAngle1)
      ];
      const arrow2 = [
        labelLng + arrowSize * Math.cos(arrowAngle2),
        labelLat + arrowSize * Math.sin(arrowAngle2)
      ];
      
      return {
        palace: palace,
        pointCoord: pointCoord,
        labelCoord: labelCoord,
        lineCoord: [pointCoord, labelCoord],
        arrowCoord: [arrow1, arrow2, labelCoord],
        angle: angle
      };
    });
    
    options = {
      title: {
        text: `${city.name}宋代宫殿分布`,
        textStyle: {
          color: textColor,
          fontFamily: 'Noto Serif SC',
          fontSize: 16
        }
      },
      graphic: [
        {
          type: 'text',
          left: 'right',
          bottom: '5',
          style: {
            text: '地图来源：天地图・标准地图服务（审图号：GS (2023) 2767 号）',
            fontSize: 10,
            fill: '#e6b422'
          }
        },
        {
          type: 'text',
          left: 'left',
          top: '5',
          style: {
            text: '提示：点击宫殿或标签查看详情，双击地图或缩小地图返回全国视图',
            fontSize: 10,
            fill: getCurrentTheme() === 'dark' ? '#e6b422' : '#c44536'
          }
        }
      ],

      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const isDark = getCurrentTheme() === 'dark';
          let palace;
          
          if (params.componentType === 'series' && params.seriesType === 'custom') {
            palace = params.data.palace;
          } else if (params.componentType === 'series') {
            palace = params.value[3];
          }
          
          if (!palace) return '';
          
          return `
            <div style="padding: 10px; background: ${isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)'} ; border: 1px solid ${borderColor}; border-radius: 8px;">
              <div style="font-weight: bold; color: #e6b422; margin-bottom: 5px;">${palace.name}</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">位置：${palace.location}</div>
              <div style="color: ${isDark ? '#ffffff' : '#333333'}; margin: 2px 0;">建筑面积：${palace.area}</div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(230, 180, 34, 0.3);">
                <div style="color: #e6b422; font-size: 0.9rem;">点击查看宫殿详情 | 双击地图或缩小地图可回到全国视图</div>
              </div>
            </div>
          `;
        },
        backgroundColor: 'transparent'
      },
      geo: {
        type: "map",
        map: "chinaMap",
        roam: true,
        center: [city.centerLng, city.centerLat],
        zoom: 12,
        scaleLimit: {
          min: 3,
          max: 14
        },
        itemStyle: {
          areaColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            areaColor: getCurrentTheme() === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderColor: borderColor,
            borderWidth: 2
          },
          label: {
            show: true,
            color: textColor,
            fontFamily: 'Noto Serif SC'
          }
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut',
        touchDelay: 0,
        tooltip: {
          enterable: true
        }
      },
      series: [
        // 引导线系列
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          symbol: ['none', 'arrow'],
          symbolSize: [6, 8],
          lineStyle: {
            color: '#B8860B',
            width: 2,
            opacity: 0.8,
            curveness: 0.2
          },
          emphasis: {
            lineStyle: {
              width: 3,
              color: '#FFD700',
              opacity: 1
            }
          },
          data: labelData.map(item => ({
            coords: item.lineCoord,
            palace: item.palace
          }))
        },
        // 标签背景和文字系列
        {
          type: 'custom',
          coordinateSystem: 'geo',
          zlevel: 3,
          silent: false,
          renderItem: function(params, api) {
            const idx = params.dataIndex;
            const item = labelData[idx];
            if (!item) return;
            
            const isDark = getCurrentTheme() === 'dark';
            const labelCoord = api.coord(item.labelCoord);
            const palace = item.palace;
            const highlightScale = item.highlightScale || 1;
            const highlightFactor = Math.max(0, Math.min(1, (highlightScale - 1) / (HIGHLIGHT_SCALE - 1)));
            const isHighlighted = highlightFactor > 0.02;
            
            // 创建标签组
            const group = {
              type: 'group',
              id: `label-${idx}`,
              position: labelCoord,
              origin: [40, 15],
              scale: [highlightScale, highlightScale],
              children: [
                // 标签背景
                {
                  type: 'rect',
                  id: `label-bg-${idx}`,
                  shape: {
                    width: 80,
                    height: 30,
                    r: 4
                  },
                  style: {
                    fill: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
                    stroke: isHighlighted ? '#FFD700' : '#B8860B',
                    lineWidth: 1.5 + (highlightFactor * 1.2),
                    shadowBlur: 5 + (highlightFactor * 10),
                    shadowColor: `rgba(255, 215, 0, ${0.3 + (highlightFactor * 0.5)})`
                  },
                  emphasis: {
                    style: {
                      stroke: '#FFD700',
                      lineWidth: 2,
                      shadowBlur: 10,
                      shadowColor: 'rgba(255, 215, 0, 0.6)'
                    }
                  }
                },
                // 标签文字
                {
                  type: 'text',
                  id: `label-text-${idx}`,
                  style: {
                    text: palace.name,
                    x: 40,
                    y: 15,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fill: highlightFactor > 0.6 ? '#FFD700' : (isDark ? '#ffffff' : '#333333'),
                    fontSize: 12,
                    fontFamily: 'Noto Serif SC',
                    fontWeight: 'bold'
                  },
                  emphasis: {
                    style: {
                      fill: '#FFD700'
                    }
                  }
                }
              ]
            };
            
            return group;
          },
          data: labelData.map(item => ({
            palace: item.palace,
            highlightScale: item.highlightScale || 1
          })),
          animation: true,
          animationDuration: 1500,
          animationEasing: 'cubicOut'
        },
        // 宫殿点位系列（金黄色实心圆点）
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 4,
          rippleEffect: {
            number: 2,
            scale: 1.5,
            brushType: 'fill',
            color: '#B8860B',
            period: 2
          },
          itemStyle: {
            color: '#FFD700',
            borderColor: '#B8860B',
            borderWidth: 2,
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(255, 215, 0, 0.8)'
          },
          data: cityPalaces.map(palace => ({
            name: palace.name,
            value: [palace.lng, palace.lat, palace.areaValue, palace]
          })),
          symbolSize: function(val) {
            const palace = val[3]
            const scale = palace?.highlightScale || 1
            return 12 * scale
          },
          animation: true,
          animationDuration: 2000,
          animationEasing: 'cubicOut',
          animationDelay: function (idx) {
            return idx * 100
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 25,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 215, 0, 1)',
              scale: 1.5
            },
            rippleEffect: {
              scale: 2.5,
              period: 1
            }
          }
        }
      ]
    };
    
    // 保存城市视图数据供后续高亮使用
    cityViewLabelData = labelData.map((item, idx) => ({
      ...item,
      highlightScale: 1
    }));
    cityViewPalaceData = cityPalaces.map((palace, idx) => ({
      ...palace,
      highlightScale: 1
    }));
  }
  
  myChart.setOption(options, {notMerge: true})
  
  // 添加地图点击事件
  myChart.on('click', function(params) {
    if (viewMode.value === 'nation') {
      // 全国视图 - 点击城市气泡
      if (params.componentType === 'series' && (params.seriesType === 'effectScatter' || params.seriesType === 'scatter')) {
        if (params.data && params.data.value && params.data.value[4]) {
          const cityData = {
            name: params.data.name,
            palaces: params.data.value[4],
            centerLng: params.data.value[0],
            centerLat: params.data.value[1]
          };
          console.log('点击了城市:', cityData.name)
          viewMode.value = 'city';
          currentCity.value = cityData;
          initChart();
        }
      }
    } else {
      // 城市视图 - 点击宫殿
      if (params.componentType === 'series' && (params.seriesType === 'effectScatter' || params.seriesType === 'scatter')) {
        const palace = params.value[3];
        
        if (palace) {
          // 触发palaceClick事件
          emit('palaceClick', palace);
        }
      }
    }
  })
  
  // 添加鼠标悬浮高亮联动事件（城市视图）
  if (viewMode.value === 'city') {
    let highlightedIndex = -1;
    
    // 鼠标悬浮到宫殿点位
    myChart.on('mouseover', function(params) {
      if (params.componentType === 'series') {
        const dataIndex = params.dataIndex;
        if (dataIndex !== undefined && dataIndex !== highlightedIndex) {
          highlightedIndex = dataIndex;
          
          // 高亮引导线
          myChart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0, // 引导线系列
            dataIndex: dataIndex
          });
          
          // 高亮标签背景
          myChart.dispatchAction({
            type: 'showTip',
            seriesIndex: 1, // 标签系列
            dataIndex: dataIndex
          });
        }
      }
    });
    
    // 鼠标移出
    myChart.on('mouseout', function(params) {
      if (params.componentType === 'series') {
        highlightedIndex = -1;
        
        // 取消高亮引导线
        myChart.dispatchAction({
          type: 'downplay',
          seriesIndex: 0
        });
      }
    });
  }
  
  // 监听地图缩放事件，实现自动返回全国视图
  myChart.on('georoam', function(params) {
    if (viewMode.value === 'city') {
      // 检查是否是缩小操作
      if (params.zoom < 10) {
        // 当缩放级别小于10时，返回全国视图
        viewMode.value = 'nation';
        currentCity.value = null;
        initChart();
      }
    }
  })
  
  // 监听地图双击事件，实现返回全国视图
  myChart.on('dblclick', function(params) {
    if (viewMode.value === 'city') {
      // 双击操作
      viewMode.value = 'nation';
      currentCity.value = null;
      initChart();
    }
  })
  
  // 监听自定义系列（标签）的点击事件
  myChart.on('click', function(params) {
    if (viewMode.value === 'city') {
      // 检查是否点击了自定义系列（标签）
      if (params.componentType === 'series' && params.seriesType === 'custom') {
        const palace = params.data.palace;
        if (palace) {
          // 触发palaceClick事件
          emit('palaceClick', palace);
        }
      }
    }
  })
  
  // 暴露定位宫殿的方法
  window.locateSongPalace = function(palaceId) {
    // 清除可能存在的旧定时器
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    cancelHighlightAnimation()
    
    // 查找对应的宫殿
    const palace = songPalaces.find(p => p.id === palaceId)
    if (palace) {
      // 提取城市名称
      let city = palace.location
      if (city.includes('省')) {
        city = city.split('省')[1]
      }
      if (city.includes('市')) {
        city = city.split('市')[0]
      }
      
      // 切换到城市视图
      const cityGroup = Object.values(cityGroups).find(g => g.name === city);
      if (cityGroup) {
        viewMode.value = 'city';
        currentCity.value = cityGroup;
        
        // 先记录需要高亮的宫殿索引
        const palaceIndex = cityGroup.palaces.findIndex(p => p.id === palaceId);
        
        // 初始化图表
        initChart();
        
        // 监听地图渲染完成事件
        myChart.on('finished', function onMapFinished() {
          // 只执行一次
          myChart.off('finished', onMapFinished);
          
          // 延迟确保数据完全渲染
          setTimeout(() => {
            if (!myChart) return;
            
            // 设置geo中心点到宫殿位置
            myChart.setOption({
              geo: {
                center: [palace.lng, palace.lat],
                zoom: 13
              }
            }, false);
            
            // 再次延迟后应用高亮
            setTimeout(() => {
              if (!myChart) return;
              
              if (palaceIndex !== -1) {
                // 通过更新series数据实现高亮效果
                applyHighlightEffect(palaceIndex);
                
                // 3秒后恢复默认样式
                highlightTimer = setTimeout(() => {
                  if (myChart) {
                    restoreDefaultStyle();
                  }
                }, 3000);
              }
            }, 800);
          }, 200);
        });
        
        // 显示成功提示
        setTimeout(() => {
          ElMessage({
            message: `✅ 已成功定位到【${palace.name}】`,
            type: 'success',
            duration: 1500
          });
        }, 1500);
      }
    }
  }
  
  // 应用高亮效果 - 轻微放大并持续 3 秒
  function applyHighlightEffect(dataIndex) {
    if (!myChart || viewMode.value !== 'city') return;

    myChart.setOption({
      series: [
        {
          type: 'lines',
          lineStyle: {
            width: function(params) {
              const idx = params.dataIndex;
              return idx === dataIndex ? 4 : 2;
            },
            color: function(params) {
              const idx = params.dataIndex;
              return idx === dataIndex ? '#FFD700' : '#CC0000';
            },
            opacity: function(params) {
              const idx = params.dataIndex;
              return idx === dataIndex ? 1 : 0.8;
            }
          }
        },
        {},
        {
          type: 'effectScatter',
          symbolSize: function(val) {
            const palace = val[3]
            const scale = palace?.highlightScale || 1
            return 12 * scale
          },
          itemStyle: {
            color: function(params) {
              return params.dataIndex === dataIndex ? '#FFD700' : '#FF0000';
            },
            borderColor: function(params) {
              return params.dataIndex === dataIndex ? '#FFA500' : '#CC0000';
            },
            borderWidth: function(params) {
              return params.dataIndex === dataIndex ? 3 : 2;
            },
            shadowBlur: function(params) {
              return params.dataIndex === dataIndex ? 25 : 15;
            },
            shadowColor: function(params) {
              return params.dataIndex === dataIndex ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 0, 0, 0.8)';
            }
          }
        }
      ]
    }, { lazyUpdate: true })

    animateHighlight(dataIndex)
  }
  
  // 恢复默认样式
  function restoreDefaultStyle() {
    if (!myChart) return;

    cancelHighlightAnimation()
    updateHighlightState(-1, 1)
    syncHighlightSeries()
    
    myChart.setOption({
      series: [
        {
          type: 'lines',
          lineStyle: {
            width: 2,
            color: '#CC0000',
            opacity: 0.8
          }
        },
        {},
        {
          type: 'effectScatter',
          symbolSize: function(val) {
            const palace = val[3]
            const scale = palace?.highlightScale || 1
            return 12 * scale
          },
          itemStyle: {
            color: '#FF0000',
            borderColor: '#CC0000',
            borderWidth: 2,
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(255, 0, 0, 0.8)'
          }
        }
      ]
    }, { lazyUpdate: true });
  }
  
  // 暴露定位城市的方法（保持向后兼容）
  window.locateSongCity = function(cityName) {
    // 查找包含该城市名称的宫殿
    const palace = songPalaces.find(p => p.location.includes(cityName))
    if (palace) {
      window.locateSongPalace(palace.id);
    }
  }
}
</script>
<template>
  <div ref="charts" class="echartsBox"></div>
</template>
<style scoped>
.echartsBox {
  width: 100%;
  height: 100%;
}
</style>
