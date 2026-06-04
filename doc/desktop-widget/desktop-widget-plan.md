# 桌面摆件端实现文档

本文档只描述桌面摆件端专属内容。公共六爻起卦、排盘、解卦能力见 `doc/technical-implementation.md` 和 `doc/feature-list.md`。

## 端侧目标

实现一个 Windows 桌面摆件：

- 默认显示八卦罗盘外部图标。
- 悬浮时展开罗盘动效。
- 点击后打开六爻起卦排盘悬浮窗口。
- 支持透明背景、无边框、拖拽、置顶、位置记忆。

## 当前目录

- `floating-widget`：桌面摆件外部图标原型。
- `liuyao-feature`：点击摆件后打开的六爻功能悬浮窗口原型。

## 推荐技术栈

优先推荐 Tauri：

- 运行时轻量，适合桌面摆件。
- 支持透明、无边框、置顶窗口。
- Rust 侧可处理窗口控制、托盘、文件存储。
- 前端可复用 HTML/CSS/SVG/JavaScript 原型。

备选 Electron：

- Node.js 能力完整。
- 桌面生态成熟。
- 资源占用更高。

## 窗口结构

```text
Desktop Widget App
├─ Floating Widget Window
│  ├─ BaguaWidget
│  ├─ LuopanRenderer
│  └─ MotionController
├─ Liuyao Feature Window
│  ├─ QuestionInput
│  ├─ CastPanel
│  ├─ LiuyaoChart
│  └─ InterpretationPanel
└─ Desktop Services
   ├─ WindowController
   ├─ TrayController
   ├─ SettingsStore
   └─ HistoryStore
```

## 外部摆件窗口

功能：

- 无边框。
- 背景透明。
- 默认只显示太极八卦图标。
- 鼠标悬浮后由内向外展开罗盘外环。
- 支持蓝白赛博风外层视觉。
- 支持中心太极顺时针旋转。
- 支持外层正逆旋转。
- 点击时打开六爻功能悬浮窗口。

窗口能力：

- 拖拽移动。
- 始终置顶。
- 位置记忆。
- 尺寸记忆。
- 可选开机启动。

## 六爻功能悬浮窗口

功能：

- 由外部摆件点击触发。
- 使用独立悬浮窗口，不占满屏幕。
- 默认靠近摆件或屏幕中心弹出。
- 支持关闭、最小化、拖拽、尺寸记忆。
- 内部流程为问事、起卦、排盘、解卦。

## 桌面端设置

- 摆件大小。
- 摆件位置。
- 是否置顶。
- 动画速度。
- 是否开启展开动画。
- 默认起卦方式。
- 是否开机启动。
- 六爻窗口默认位置。
- 六爻窗口默认尺寸。

## 开发阶段

1. 将 `floating-widget` 原型迁移为桌面外部窗口。
2. 将 `liuyao-feature` 原型迁移为点击后的悬浮窗口。
3. 实现窗口打开、关闭、拖拽、置顶和位置记忆。
4. 接入公共六爻起卦排盘模块。
5. 接入历史记录和设置。
6. 增加系统托盘菜单。
7. 打包 Windows 安装包。
