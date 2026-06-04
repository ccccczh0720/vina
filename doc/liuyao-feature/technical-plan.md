# 六爻起卦排盘悬浮窗口技术方案

该模块由外部桌面摆件点击触发，作为独立悬浮窗口打开。外部摆件原型位于 `doc/floating-widget`，本目录负责点击后的功能窗口。

## 模块拆分

1. `QuestionInput`：问题文本、问题类型、起卦方式。
2. `CastEngine`：生成六爻阴阳、动爻、本卦、变卦。
3. `LiuYaoChart`：装卦数据，包括纳甲、六亲、六神、世应、空亡。
4. `InterpretationEngine`：根据问题类型和排盘数据生成解读。
5. `HistoryStore`：保存问卦记录、问题、排盘和解卦结果。
6. `FloatingPanelController`：负责窗口打开、关闭、拖拽、置顶和尺寸记忆。

## 数据结构

建议核心数据结构：

```ts
type LiuYaoLine = {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  yinYang: "yin" | "yang";
  moving: boolean;
  changedYinYang: "yin" | "yang";
  sixSpirit: string;
  sixRelation: string;
  earthlyBranch: string;
  role?: "世" | "应";
};

type LiuYaoChart = {
  question: string;
  type: string;
  mainHexagram: string;
  changedHexagram: string;
  monthBranch: string;
  dayStemBranch: string;
  voidBranches: string[];
  lines: LiuYaoLine[];
};
```

## 起卦流程

1. 校验问题文本和问题类型。
2. 根据起卦方式生成六爻。
3. 计算本卦、互卦、变卦。
4. 装纳甲、六亲、六神、世应。
5. 计算月建、日辰、旬空。
6. 生成排盘数据。
7. 调用解卦引擎生成文本解释。

## 解卦策略

第一版建议使用规则引擎：

- 问题类型决定用神。
- 月建、日辰决定旺衰。
- 动爻决定变化点。
- 世应决定关系方向。
- 空亡、冲合、墓绝作为补充判断。

后续可接入 AI 解读，但 AI 输入必须基于结构化排盘数据，避免直接让模型自由编造排盘。

## 当前原型

当前目录提供静态交互原型：

- `index.html`
- `styles.css`
- `app.js`
