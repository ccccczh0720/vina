# 项目技术逻辑实现文档

本文档描述 Vina 的通用技术逻辑实现，覆盖桌面摆件端和未来 iOS 客户端可复用的核心业务能力。端侧窗口、动画、原生能力和打包方案放在各端目录中。

## 一、技术目标

构建一套跨端复用的六爻问事核心模块。不同端只负责输入、展示和端侧能力，核心业务逻辑保持一致。

核心流程：

```text
QuestionInput
↓
validateQuestion
↓
autoCast
↓
CastPreview
↓
confirmCast
↓
buildChart
↓
interpretByRules
↓
polishByAI
↓
ApiResponse<DivinationResult>
```

## 二、模块架构

```text
Shared Domain
├─ Question
│  ├─ QuestionInput
│  ├─ QuestionValidator
│  └─ QuestionType
├─ Casting
│  ├─ CastEngine
│  ├─ AutoCastStrategy
│  └─ CastPreview
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
│  ├─ AdviceRules
│  └─ AiPolishService
└─ Settings
   └─ SettingsStore
```

第一版不实现 `HistoryStore`，只保留历史记录入口占位。

## 三、核心对象

业务对象中的枚举取值统一使用英文，中文只用于展示 label。

```ts
type QuestionType = "career" | "wealth" | "relationship" | "health" | "study" | "other";

type CastMethod = "auto";

type YinYang = "yin" | "yang";

type LineRole = "self" | "response";

type SixSpirit =
  | "greenDragon"
  | "vermilionBird"
  | "hookedChen"
  | "flyingSerpent"
  | "whiteTiger"
  | "blackTortoise";

type SixRelation = "parents" | "siblings" | "children" | "wealth" | "officials";

type HeavenlyStem = "jia" | "yi" | "bing" | "ding" | "wu" | "ji" | "geng" | "xin" | "ren" | "gui";

type EarthlyBranch =
  | "zi"
  | "chou"
  | "yin"
  | "mao"
  | "chen"
  | "si"
  | "wu"
  | "wei"
  | "shen"
  | "you"
  | "xu"
  | "hai";

type HexagramKey = string;

type StemBranchKey = string;
```

## 四、输入对象

```ts
type QuestionInput = {
  question?: string;
  questionType: QuestionType;
  customQuestionType?: string;
};
```

校验规则：

- `questionType` 必填。
- `questionType` 只能取固定英文枚举。
- `career`、`wealth`、`relationship`、`health`、`study` 允许 `question` 为空。
- `other` 必须填写 `customQuestionType` 或 `question`。

## 五、起卦预览对象

自动起卦后先返回预览对象，用户确认后才继续排盘和解卦。

```ts
type CastPreviewLine = {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  yinYang: YinYang;
  moving: boolean;
  changedYinYang: YinYang;
};

type CastPreview = {
  id: string;
  question?: string;
  questionType: QuestionType;
  customQuestionType?: string;
  castMethod: CastMethod;
  createdAt: string;
  mainHexagram: HexagramKey;
  changedHexagram: HexagramKey;
  movingLines: number[];
  lines: CastPreviewLine[];
  status: "pendingConfirmation";
};
```

## 六、排盘对象

```ts
type LiuYaoLine = {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  yinYang: YinYang;
  moving: boolean;
  changedYinYang: YinYang;
  sixSpirit: SixSpirit;
  sixRelation: SixRelation;
  heavenlyStem?: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
  role?: LineRole;
};

type LiuYaoChart = {
  id: string;
  question?: string;
  questionType: QuestionType;
  customQuestionType?: string;
  castMethod: CastMethod;
  createdAt: string;
  mainHexagram: HexagramKey;
  changedHexagram: HexagramKey;
  movingLines: number[];
  monthBranch: EarthlyBranch;
  dayStemBranch: StemBranchKey;
  voidBranches: EarthlyBranch[];
  lines: LiuYaoLine[];
};
```

约定：

- `lines` 内部按初爻到上爻存储。
- 前端展示时按上爻到初爻展示。
- 不动爻的 `changedYinYang` 与 `yinYang` 相同。

## 七、解卦对象

```ts
type RuleJudgement = {
  usefulGod: SixRelation;
  usefulGodAnalysis: string;
  worldResponseAnalysis: string;
  movingLineAnalysis: string;
  strengthAnalysis: string;
  riskFlags: string[];
};

type Interpretation = {
  overview: string;
  usefulGodAnalysis: string;
  worldResponseAnalysis: string;
  movingLineAnalysis: string;
  advice: string;
  polishedText?: string | null;
};

type DivinationResult = {
  chart: LiuYaoChart;
  ruleJudgement: RuleJudgement;
  interpretation: Interpretation;
  aiPolishStatus?: "success" | "failed" | "disabled";
};
```

## 八、统一返回结构

所有接口统一返回 `code`、`message`、`data`。

```ts
type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
};
```

成功：

```json
{
  "code": 200,
  "message": "排盘解卦成功",
  "data": {
    "chart": {},
    "ruleJudgement": {},
    "interpretation": {},
    "aiPolishStatus": "success"
  }
}
```

起卦预览：

```json
{
  "code": 200,
  "message": "起卦成功，请确认卦象后继续。",
  "data": {
    "id": "cast_20260605_001",
    "questionType": "career",
    "castMethod": "auto",
    "createdAt": "2026-06-05T10:30:00+08:00",
    "mainHexagram": "fengHuoJiaRen",
    "changedHexagram": "tianHuoTongRen",
    "movingLines": [5],
    "lines": [
      {
        "index": 1,
        "yinYang": "yang",
        "moving": false,
        "changedYinYang": "yang"
      }
    ],
    "status": "pendingConfirmation"
  }
}
```

错误：

```json
{
  "code": 40001,
  "message": "选择其他类型时，需要输入问题类型或具体问题说明。",
  "data": {
    "field": "customQuestionType",
    "questionType": "other"
  }
}
```

## 九、错误码

| code | errorKey | 中文说明 |
|---:|---|---|
| 40001 | questionRequiredForOther | 选择其他类型时，需要输入问题类型或具体问题说明。 |
| 40002 | invalidQuestionType | 问题类型不合法。 |
| 50001 | autoCastFailed | 自动起卦失败。 |
| 50002 | chartBuildFailed | 排盘生成失败。 |
| 50003 | interpretationFailed | 规则解卦失败。 |
| 50004 | aiConfigMissing | AI 配置缺失。 |
| 50005 | aiPolishFailed | AI 润色失败。 |
| 50099 | unknownError | 未知错误。 |

AI 润色失败不阻断主流程，仍返回 `code: 200`，但 `aiPolishStatus` 为 `failed`，`polishedText` 为 `null`。

## 十、AI 配置

真实 API Key 只允许放在本地配置文件：

```text
config/ai.config.local.json
```

该文件必须被 `.gitignore` 忽略。仓库只提交示例文件：

```text
config/ai.config.example.json
```

配置结构：

```ts
type AiConfig = {
  provider: "openai-compatible";
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
};
```

AI 使用约束：

- 输入必须来自结构化排盘和规则判断。
- AI 只做自然语言润色。
- AI 不参与起卦、排盘和核心判断。
- AI 不允许自由生成排盘。

## 十一、英文枚举与中文展示

```ts
const questionTypeLabels: Record<QuestionType, string> = {
  career: "事业",
  wealth: "财运",
  relationship: "感情",
  health: "健康",
  study: "学业",
  other: "其他",
};

const lineRoleLabels: Record<LineRole, string> = {
  self: "世",
  response: "应",
};

const sixRelationLabels: Record<SixRelation, string> = {
  parents: "父母",
  siblings: "兄弟",
  children: "子孙",
  wealth: "妻财",
  officials: "官鬼",
};
```

## 十二、跨端复用原则

- 公共业务模块不读取 DOM。
- 公共业务模块不依赖桌面窗口 API。
- 公共业务模块不依赖 iOS 原生 API。
- 排盘结果统一使用 `LiuYaoChart`。
- 解卦结果统一使用 `Interpretation`。
- 各端只负责收集输入、展示结果、展示历史占位和保存端侧设置。
