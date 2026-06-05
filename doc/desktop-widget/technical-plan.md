# 桌面摆件端技术实现方案

本文档说明如何把当前原型实现为 Windows 桌面摆件应用，包括使用什么语言、项目代码结构、窗口实现方式、业务接入方式、配置安全和部署流程。公共六爻业务逻辑见 `doc/feature-list.md` 与 `doc/technical-implementation.md`。

## 一、实现目标

桌面端实现一个常驻 Windows 桌面的轻量摆件：

- 默认显示外部八卦罗盘悬浮窗。
- 鼠标悬浮时展开罗盘动效。
- 点击摆件后打开六爻功能悬浮窗。
- 六爻功能窗承载问事、自动起卦、卦象确认、排盘、解卦流程。
- 支持透明窗口、无边框、置顶、拖拽、位置记忆。
- 支持系统托盘菜单。
- 支持读取本地 AI 配置并调用 AI 润色。

当前采用的原型：

```text
doc/desktop-widget
├─ floating-widget-v1
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
└─ liuyao-feature-v2
   ├─ index.html
   ├─ styles.css
   └─ app.js
```

## 二、技术栈

第一版正式实现使用 Tauri。

语言分工：

| 层级 | 技术 | 作用 |
|---|---|---|
| 桌面壳 | Rust + Tauri | 创建窗口、托盘、文件读写、配置读取、AI 请求代理、打包安装包 |
| 前端界面 | TypeScript + HTML + CSS | 实现悬浮摆件 UI、六爻窗口 UI、交互状态 |
| 业务逻辑 | TypeScript | 问事校验、自动起卦、卦象预览、排盘、规则解卦、统一返回结构 |
| 配置文件 | JSON | 本地 AI 配置、窗口位置、用户设置 |

选择 Tauri 的原因：

- 体积小，适合桌面摆件。
- 支持透明窗口、无边框窗口、置顶窗口。
- Rust 侧可以安全读取本地配置，避免 API Key 暴露给前端。
- 可以打包 Windows 安装包。

不优先使用 Electron：

- Electron 资源占用更高。
- 只是桌面摆件场景，不需要完整 Node.js 运行时暴露给前端。

## 三、正式项目结构

建议在仓库根目录创建正式应用目录：

```text
D:\czh\vina
├─ README.md
├─ .gitignore
├─ config
│  └─ ai.config.example.json
├─ doc
│  ├─ feature-list.md
│  ├─ technical-implementation.md
│  └─ desktop-widget
│     ├─ technical-plan.md
│     ├─ floating-widget-v1
│     └─ liuyao-feature-v2
└─ apps
   └─ desktop-widget
      ├─ package.json
      ├─ index.html
      ├─ vite.config.ts
      ├─ tsconfig.json
      ├─ src
      │  ├─ main.ts
      │  ├─ styles
      │  │  ├─ base.css
      │  │  ├─ floating-widget.css
      │  │  └─ liuyao-feature.css
      │  ├─ windows
      │  │  ├─ floating-widget
      │  │  │  ├─ FloatingWidget.ts
      │  │  │  ├─ luopanRenderer.ts
      │  │  │  └─ motionController.ts
      │  │  └─ liuyao-feature
      │  │     ├─ LiuyaoFeature.ts
      │  │     ├─ questionPanel.ts
      │  │     ├─ castPreviewPanel.ts
      │  │     ├─ chartPanel.ts
      │  │     ├─ interpretationPanel.ts
      │  │     └─ historyPlaceholder.ts
      │  ├─ shared
      │  │  ├─ apiResponse.ts
      │  │  ├─ labels.ts
      │  │  ├─ question
      │  │  │  ├─ types.ts
      │  │  │  └─ validateQuestion.ts
      │  │  ├─ casting
      │  │  │  ├─ autoCast.ts
      │  │  │  └─ castPreview.ts
      │  │  ├─ chart
      │  │  │  ├─ buildChart.ts
      │  │  │  ├─ hexagram.ts
      │  │  │  ├─ sixSpirit.ts
      │  │  │  └─ sixRelation.ts
      │  │  ├─ interpretation
      │  │  │  ├─ interpretByRules.ts
      │  │  │  └─ adviceRules.ts
      │  │  └─ settings
      │  │     └─ settingsClient.ts
      │  └─ tauri
      │     └─ commands.ts
      └─ src-tauri
         ├─ Cargo.toml
         ├─ tauri.conf.json
         ├─ build.rs
         └─ src
            ├─ main.rs
            ├─ window.rs
            ├─ tray.rs
            ├─ settings.rs
            ├─ ai.rs
            └─ storage.rs
```

## 四、窗口设计

### 1. 外部摆件窗口

窗口名：

```text
floating
```

用途：

- 常驻桌面。
- 显示太极八卦罗盘。
- 点击打开六爻功能窗口。

建议配置：

```json
{
  "label": "floating",
  "title": "Vina",
  "url": "index.html#/floating",
  "width": 340,
  "height": 340,
  "decorations": false,
  "transparent": true,
  "resizable": false,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "visible": true
}
```

关键实现：

- 前端使用 `floating-widget-v1` 的 SVG、CSS 动效和 JS 交互迁移为 TypeScript 模块。
- 使用 Tauri `start_dragging()` 支持拖拽。
- 鼠标 hover 只在前端处理，不需要 Rust 介入。
- 点击摆件时调用 Tauri command：`open_liuyao_window()`。

### 2. 六爻功能窗口

窗口名：

```text
liuyao
```

用途：

- 点击外部摆件后打开。
- 展示问事、起卦、观象、排盘、解卦。

建议配置：

```json
{
  "label": "liuyao",
  "title": "天道六爻",
  "url": "index.html#/liuyao",
  "width": 920,
  "height": 650,
  "decorations": false,
  "transparent": false,
  "resizable": true,
  "alwaysOnTop": true,
  "skipTaskbar": false,
  "visible": false
}
```

行为：

- 应用启动时先创建但隐藏。
- 点击外部摆件后显示并聚焦。
- 默认居中或靠近摆件打开。
- 关闭按钮只隐藏窗口，不退出应用。
- 历史记录入口弹出占位窗口，显示“历史记录待开发中”。

## 五、前端路由

一个 Tauri WebView 可以通过 hash 区分两个窗口入口：

```text
index.html#/floating
index.html#/liuyao
```

`src/main.ts`：

```ts
const route = window.location.hash.replace("#/", "");

if (route === "floating") {
  mountFloatingWidget();
}

if (route === "liuyao") {
  mountLiuyaoFeature();
}
```

## 六、前端业务流程

六爻窗口状态：

```ts
type LiuyaoStage =
  | "inputting"
  | "casting"
  | "pendingConfirmation"
  | "charting"
  | "interpreting"
  | "completed"
  | "error";
```

流程：

```text
1. 用户选择 questionType
2. 用户可选输入 question
3. 如果 questionType 是 other，校验 customQuestionType 或 question 必填
4. 点击自动起卦
5. 生成 CastPreview
6. 展示本卦、变卦、动爻、六爻阴阳
7. 用户确认卦象
8. 生成 LiuYaoChart
9. 生成 RuleJudgement 和 Interpretation
10. 调用 Rust command 进行 AI 润色
11. 展示最终结果
```

## 七、核心 TypeScript 对象

对象定义以 `doc/technical-implementation.md` 为准。桌面端必须复用同一套英文枚举和统一返回结构。

```ts
type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
};
```

成功返回：

```ts
ApiResponse<DivinationResult>
```

起卦预览返回：

```ts
ApiResponse<CastPreview>
```

错误返回：

```ts
ApiResponse<Record<string, unknown>>
```

## 八、Tauri Command 设计

Rust 侧提供给前端的命令：

```rust
#[tauri::command]
fn open_liuyao_window(app: tauri::AppHandle) -> Result<(), String>;

#[tauri::command]
fn hide_liuyao_window(app: tauri::AppHandle) -> Result<(), String>;

#[tauri::command]
fn save_window_state(label: String, state: WindowState) -> Result<(), String>;

#[tauri::command]
fn load_window_state(label: String) -> Result<Option<WindowState>, String>;

#[tauri::command]
async fn polish_interpretation(input: AiPolishInput) -> Result<AiPolishOutput, String>;

#[tauri::command]
fn load_app_settings() -> Result<AppSettings, String>;

#[tauri::command]
fn save_app_settings(settings: AppSettings) -> Result<(), String>;
```

前端调用：

```ts
import { invoke } from "@tauri-apps/api/core";

await invoke("open_liuyao_window");
```

## 九、Rust 代码职责

### 1. `main.rs`

职责：

- 初始化 Tauri 应用。
- 注册 commands。
- 初始化窗口。
- 初始化托盘。

### 2. `window.rs`

职责：

- 创建 `floating` 窗口。
- 创建 `liuyao` 窗口。
- 控制显示、隐藏、聚焦、居中。
- 保存和恢复窗口位置。

### 3. `tray.rs`

职责：

- 创建系统托盘图标。
- 菜单项：
  - 打开六爻。
  - 显示/隐藏摆件。
  - 始终置顶。
  - 退出。

### 4. `settings.rs`

职责：

- 读取用户设置。
- 写入用户设置。
- 提供默认设置。

设置保存位置建议：

```text
%APPDATA%\vina\settings.json
```

### 5. `ai.rs`

职责：

- 读取本地 AI 配置。
- 发起 AI 润色请求。
- 不让 API Key 暴露给前端。

AI 配置读取路径：

```text
config/ai.config.local.json
```

生产部署时也可以复制到：

```text
%APPDATA%\vina\ai.config.local.json
```

### 6. `storage.rs`

职责：

- 统一封装文件路径。
- 创建应用数据目录。
- 读写 JSON。

第一版不实现历史记录保存。

## 十、配置文件

示例配置：

```text
config/ai.config.example.json
```

本地真实配置：

```text
config/ai.config.local.json
```

`ai.config.local.json` 不提交到仓库。

配置结构：

```json
{
  "provider": "openai-compatible",
  "baseUrl": "https://example.com/v1",
  "apiKey": "replace-with-local-key",
  "model": "model-name",
  "enabled": true
}
```

`.gitignore` 必须包含：

```text
config/ai.config.local.json
.env
.env.*
!.env.example
```

## 十一、开发步骤

### 1. 安装环境

需要：

- Windows 10/11
- Node.js LTS
- Rust stable
- Microsoft Visual Studio Build Tools，包含 C++ 桌面开发组件
- WebView2 Runtime

### 2. 创建 Tauri 项目

在仓库根目录执行：

```powershell
mkdir apps
cd apps
npm create tauri-app@latest desktop-widget
```

推荐选择：

```text
Package manager: npm
UI template: Vanilla
Language: TypeScript
```

### 3. 迁移原型

迁移来源：

```text
doc/desktop-widget/floating-widget-v1
doc/desktop-widget/liuyao-feature-v2
```

迁移目标：

```text
apps/desktop-widget/src/windows/floating-widget
apps/desktop-widget/src/windows/liuyao-feature
apps/desktop-widget/src/styles
```

迁移要求：

- HTML 结构改为 TypeScript 渲染或模板字符串。
- CSS 拆分为 `floating-widget.css` 和 `liuyao-feature.css`。
- 原型里的 JS 逻辑改成 TypeScript 模块。
- 保留现有视觉和交互。

### 4. 实现公共业务模块

先实现最小可跑版本：

- `validateQuestion`
- `autoCast`
- `buildCastPreview`
- `buildChart`
- `interpretByRules`
- `polishByAI`

AI 润色失败时：

- 不阻断流程。
- 返回规则解卦结果。
- `aiPolishStatus` 为 `failed`。

### 5. 实现窗口通信

外部摆件点击：

```ts
await invoke("open_liuyao_window");
```

六爻窗口关闭：

```ts
await invoke("hide_liuyao_window");
```

AI 润色：

```ts
const result = await invoke("polish_interpretation", { input });
```

## 十二、部署与打包

### 1. 开发运行

进入桌面端目录：

```powershell
cd D:\czh\vina\apps\desktop-widget
npm install
npm run tauri dev
```

### 2. 生产构建

```powershell
cd D:\czh\vina\apps\desktop-widget
npm run tauri build
```

构建产物通常在：

```text
apps/desktop-widget/src-tauri/target/release/
apps/desktop-widget/src-tauri/target/release/bundle/
```

Windows 安装包常见输出：

```text
apps/desktop-widget/src-tauri/target/release/bundle/msi/
apps/desktop-widget/src-tauri/target/release/bundle/nsis/
```

### 3. 部署方式

第一版建议使用 NSIS 安装包：

- 用户双击安装。
- 安装到系统应用目录。
- 创建开始菜单入口。
- 可选创建桌面快捷方式。

### 4. 本地配置部署

安装后用户需要在以下位置放置 AI 配置：

```text
%APPDATA%\vina\ai.config.local.json
```

如果没有配置：

- 应用仍可起卦、排盘、规则解卦。
- AI 润色状态为 `disabled` 或 `failed`。
- 前端展示规则解卦结果。

### 5. 启动方式

第一版不做开机自启动。

启动方式：

- 用户通过开始菜单手动启动。
- 用户通过桌面快捷方式手动启动。
- 应用启动后显示外部八卦悬浮摆件。
- 用户退出托盘后，应用完全退出。

部署和设置中不提供“开机启动”选项，也不写入 Windows 启动项。

## 十三、发布前检查

发布前必须检查：

- 外部摆件窗口是否透明。
- 外部摆件是否可拖拽。
- 外部摆件是否始终置顶。
- 点击摆件是否打开六爻窗口。
- 六爻窗口是否可关闭/隐藏。
- 自动起卦是否先进入卦象确认。
- 确认后是否生成排盘和解卦。
- AI 配置缺失时是否不影响主流程。
- `config/ai.config.local.json` 是否未被 git 跟踪。
- 打包后安装包能否在干净 Windows 环境运行。

## 十四、第一版交付标准

第一版完成后应具备：

- 一个可安装的 Windows 桌面应用。
- 一个常驻桌面的八卦悬浮摆件。
- 一个可由摆件打开的六爻功能悬浮窗口。
- 完整问事、自动起卦、卦象确认、排盘、规则解卦流程。
- AI 润色可用，但失败不影响主流程。
- 设置和窗口位置至少具备基础持久化。
- 系统托盘可退出应用。
- 应用只支持手动启动，不做开机自启动。
