# 跨端公共技术实现文档

本文档描述 App 端、网页端、桌面摆件端都可复用的业务技术架构。桌面摆件端的窗口、透明背景、置顶、托盘等端侧实现放在 `doc/desktop-widget`。

## 项目目标

构建一套可跨端复用的六爻起卦排盘与解卦能力。不同端只负责呈现和交互，起卦、排盘、解卦、历史记录等核心逻辑保持一致。

目标流程：

1. 用户输入问题或选择问题类型。
2. 用户选择或触发起卦方式。
3. 系统生成六爻排盘。
4. 系统输出解卦结果。
5. 系统保存历史记录。

## 公共业务架构

```text
Shared Domain
├─ Question
│  ├─ QuestionInput
│  └─ QuestionType
├─ Casting
│  ├─ CastEngine
│  ├─ AutoCastStrategy
│  ├─ CoinCastStrategy
│  └─ ManualHexagramStrategy
├─ Chart
│  ├─ HexagramEngine
│  ├─ LiuYaoAssembler
│  ├─ NaJiaRules
│  ├─ SixRelationRules
│  └─ SixSpiritRules
├─ Interpretation
│  ├─ InterpretationEngine
│  ├─ UsefulGodRules
│  ├─ StrengthRules
│  └─ AdviceRules
└─ Persistence
   ├─ HistoryStore
   └─ SettingsStore
```

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

1. 校验问题文本和问题类型。
2. 根据起卦方式生成六爻阴阳和动爻。
3. 计算本卦、变卦。
4. 装纳甲、六亲、六神、世应。
5. 根据日期计算月建、日辰、旬空。
6. 生成结构化 `LiuYaoChart`。
7. 调用解卦引擎生成 `Interpretation`。
8. 保存历史记录。

## 解卦架构

第一版使用规则引擎，不直接依赖 AI。

规则维度：

- 问题类型决定用神。
- 月建、日辰判断旺衰。
- 动爻判断变化点。
- 世应判断自身与对象关系。
- 冲、合、刑、害、空亡作为辅助判断。

AI 可作为后续增强，但 AI 输入必须来自结构化排盘和规则判断，不能让 AI 自由生成排盘。

## 跨端复用原则

- 公共业务模块不读取 DOM。
- 公共业务模块不依赖桌面窗口 API。
- 排盘结果统一使用 `LiuYaoChart`。
- 解卦结果统一使用 `Interpretation`。
- 各端只负责收集输入、展示结果、保存端侧设置。

## 后续端侧目录

- `doc/desktop-widget`：桌面摆件端。
- `doc/app-client`：未来 App 端。
- `doc/web-client`：未来网页端。
