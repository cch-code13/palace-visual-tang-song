# 宫阙万象·唐宋宫殿建筑数据可视化

本项目是一个基于历史文献和考古资料的唐宋时期宫殿建筑数据可视化平台，属于"中华优秀传统文化系列之六"。通过交互式地图和图表，展现古代建筑成就与地理空间的深度关联，为用户提供沉浸式的古代建筑探索体验。

## 项目简介

宫阙万象·唐宋宫殿建筑数据可视化是一个使用现代前端技术构建的历史文化数据可视化平台，旨在通过数据可视化技术展现唐宋时期宫殿建筑的辉煌成就。项目融合传统文化与现代技术，为用户提供直观、沉浸式的古代建筑探索体验。

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **UI 库**：Element Plus
- **数据可视化**：ECharts 5
- **构建工具**：Vite
- **样式处理**：CSS/SCSS
- **数据存储**：JSON

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 业务组件
│   ├── card/         # 卡片组件
│   │   └── CardPalaceItem.vue
│   ├── chart/        # 图表组件
│   │   ├── ChartBarArea.vue
│   │   ├── ChartCompareDynasty.vue
│   │   ├── ChartCompareProvince.vue
│   │   ├── ChartHeatMap.vue
│   │   ├── ChartPieRegion.vue
│   │   └── ChartTrend.vue
│   ├── map/          # 地图组件
│   │   ├── PalaceMapSong.vue
│   │   └── PalaceMapTang.vue
│   ├── module/       # 模块组件
│   │   ├── ModuleTimeline.vue
│   │   └── PanelHistory.vue
│   └── FilterSearch.vue
├── data/             # 数据文件
│   └── data.palaces.json
├── styles/           # 样式文件
│   ├── style.global.css
│   └── style.theme.css
├── utils/            # 工具函数
│   ├── util.echarts.js
│   └── util.storage.js
├── App.vue           # 主应用组件
└── main.js           # 入口文件
```

## 核心功能

- **数据可视化**：通过多种图表展示唐宋宫殿建筑的分布、规模和发展趋势
- **交互式地图**：支持点击地图上的宫殿点位，联动到对应卡片
- **主题切换**：支持深色/浅色主题切换，适配不同使用场景
- **搜索与筛选**：支持按宫殿名称、朝代、建筑面积等条件筛选
- **宫殿详情**：点击卡片查看宫殿详细信息
- **宫殿对比**：支持选择两座宫殿进行详细对比
- **数据导出**：支持导出 CSV 和 PDF 格式数据
- **历史浏览记录**：记录用户查看过的宫殿，方便快速访问
- **键盘快捷键**：支持 S 键快速聚焦搜索框，ESC 键关闭弹窗等

## 数据来源

- **学术著作**：《中国古代建筑史》《营造法式》
- **考古资料**：唐宋宫殿考古发掘报告
- **官方数据**：国家文物局公开遗址数据

## 数据精度

- **坐标精度**：宫殿坐标精确到小数点后4位，达到米级精度
- **数据可靠性**：所有数据均来自权威学术和官方资料
- **数据标注**：明确标注数据来源和精度说明

## 项目特色

1. **文化传承**：通过现代技术展现中华优秀传统文化
2. **数据可视化**：多种图表类型，直观展示历史数据
3. **交互体验**：流畅的动画和交互效果
4. **主题适配**：支持深色/浅色主题，满足不同使用场景
5. **响应式设计**：适配不同设备，提供良好的移动端体验
6. **数据精度**：高精度坐标数据，基于考古资料
7. **用户友好**：直观的界面设计和操作流程

## 推荐 IDE 设置

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## 推荐浏览器设置

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## 自定义配置

See [Vite Configuration Reference](https://vite.dev/config/).

## 项目设置

```sh
npm install
```

### 开发环境编译和热重载

```sh
npm run dev
```

### 生产环境编译和压缩

```sh
npm run build
```

### 使用 [ESLint](https://eslint.org/) 进行代码检查

```sh
npm run lint
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
