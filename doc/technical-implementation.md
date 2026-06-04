# 八卦六爻桌面摆件技术实现文档

## 项目目标

实现一个 Windows 桌面摆件应用。默认在桌面显示一个可悬浮交互的八卦罗盘图标；用户点击摆件后，打开六爻起卦排盘悬浮窗口，完成“输入问题或类型 -> 起卦 -> 排盘 -> 解卦”的完整流程。

当前原型目录：

- `doc/floating-widget`：桌面摆件外部图标原型。
- `doc/liuyao-feature`：点击摆件后打开的六爻排盘悬浮窗口原型。

## 推荐技术栈

优先推荐 Tauri：

- 运行时轻量，适合桌面摆件。
- 支持透明、无边框、置顶窗口。
- 可以用 Rust 侧处理窗口控制、文件存储、系统托盘。
- 前端仍使用 HTML/CSS/SVG/JavaScript 或后续迁移为 React/Vue。

备选 Electron：

- Node.js 能力更完整。
- 桌面生态成熟。
- 资源占用更高，不如 Tauri 适合小摆件。

## 整体架构

```text
Desktop App
├─ Floating Widget Window
│  ├─ BaguaWidget
│  ├─ LuopanRenderer
│  └─ MotionController
├─ Liuyao Feature Window
│  ├─ QuestionInput
│  ├─ CastPanel
│  ├─ LiuyaoChart
│  └─ InterpretationPanel
├─ Core Domain
│  ├─ CastEngine
│  ├─ HexagramEngine
│  ├─ LiuYaoAssembler
│  └─ InterpretationEngine
├─ Desktop Services
│  ├─ WindowController
│  ├─ TrayController
│  ├─ SettingsStore
│  └─ HistoryStore
└─ Shared
   ├─ types
   ├─ constants
   └─ date-time helpers
```

## 窗口设计

### 外部摆件窗口

- 无边框。
- 背景透明。
- 默认只显示八卦太极图标。
- 鼠标悬浮时由内向外展开罗盘外环。
- 点击时打开六爻功能悬浮窗口。
- 支持拖拽移动、置顶、位置记忆。

### 六爻功能窗口

- 由外部摆件点击触发。
- 使用独立悬浮窗口，不占满屏幕。
- 默认居中或靠近摆件弹出。
- 支持关闭、最小化、拖拽、尺寸记忆。
- 内部流程为问事、起卦、排盘、解卦。

## 核心数据结构

```ts
type QuestionType = "事业" | "财运" | "感情" | "健康" | "学业" | "其他";

type CastMethod = "auto" | "manual-coins" | "manual-hexagram";

type LiuYaoLine = {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  yinYang: "yin" | "yang";
  moving: boolean;
  changedYinYang: "yin" | "yang";
  sixSpirit: string;
  sixRelation: string;
  heavenlyStem?: string;
  earthlyBranch: string;
  role?: "世" | "应";
};

type LiuYaoChart = {
  id: string;
  question: string;
  questionType: QuestionType;
  castMethod: CastMethod;
  createdAt: string;
  mainHexagram: string;
  changedHexagram: string;
  movingLines: number[];
  monthBranch: string;
  dayStemBranch: string;
  voidBranches: string[];
  lines: LiuYaoLine[];
};

type Interpretation = {
  overview: string;
  usefulGodAnalysis: string;
  worldResponseAnalysis: string;
  movingLineAnalysis: string;
  advice: string;
};
```

## 起卦排盘流程

1. 用户输入问题或选择问题类型。
2. 用户点击“起卦”。
3. `CastEngine` 根据起卦方式生成六爻阴阳和动爻。
4. `HexagramEngine` 计算本卦、变卦。
5. `LiuYaoAssembler` 装纳甲、六亲、六神、世应。
6. 根据当前日期计算月建、日辰、旬空。
7. 生成结构化 `LiuYaoChart`。
8. `InterpretationEngine` 根据排盘数据生成解卦文本。
9. `HistoryStore` 保存问卦记录。

## 解卦架构

第一版建议使用规则引擎，不直接依赖 AI。

规则维度：

- 问题类型决定用神。
- 月建、日辰判断旺衰。
- 动爻判断变化点。
- 世应判断自身与对象关系。
- 冲、合、刑、害、空亡作为辅助判断。

后续可以接入 AI，但 AI 只负责把结构化判断组织成自然语言，不能让 AI 自由生成排盘。

## 存储方案

建议保存：

- 用户设置：窗口位置、大小、置顶、动画开关、默认起卦方式。
- 问卦历史：问题、类型、排盘结果、解卦结果、创建时间。

Tauri 可使用本地 JSON、SQLite 或插件存储。第一版建议使用 JSON，后续历史数据增多后迁移 SQLite。

## 开发阶段

1. 完成静态原型确认。
2. 搭建 Tauri 桌面壳。
3. 接入外部摆件窗口。
4. 接入六爻功能悬浮窗口。
5. 实现窗口打开、关闭、拖拽、置顶和位置记忆。
6. 实现六爻起卦和排盘核心算法。
7. 实现规则解卦引擎。
8. 增加历史记录和设置。
9. 打包 Windows 安装包。
