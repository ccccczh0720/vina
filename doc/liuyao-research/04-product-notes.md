# 04 Vina 产品实现备注

## 1. 悬浮窗内流程

建议将六爻功能窗拆成四个状态：

1. `ask`：输入问题、选择问题类型。
2. `preview`：自动起卦后展示观象预览。
3. `plate`：用户确认后展示完整排盘。
4. `reading`：展示规则解卦与 AI 润色结果。

对应 UI：

- 左侧：问事与起卦操作。
- 中央：本卦、变卦、动爻观象。
- 右侧或下方：排盘与解卦结果。

## 2. MVP 必做字段

起卦预览：

```ts
interface CastPreview {
  id: string;
  question: string;
  topic: string;
  castTime: string;
  lines: CastLine[];
  primaryHexagram: HexagramRef;
  changedHexagram: HexagramRef | null;
  movingLines: number[];
}
```

完整排盘：

```ts
interface LiuyaoPlate extends CastPreview {
  lunarContext: {
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    voidBranches: string[];
  };
  lineDetails: LiuyaoLineDetail[];
}

interface LiuyaoLineDetail extends CastLine {
  sixRelative: string;
  sixSpirit: string;
  branch: string;
  element: string;
  isSelf: boolean;
  isOther: boolean;
  changed?: {
    sixRelative: string;
    branch: string;
    element: string;
  };
}
```

解卦结果：

```ts
interface ReadingResult {
  ruleBased: Interpretation;
  polished?: Interpretation;
  warnings: string[];
}
```

## 3. 第一版规则边界

第一版建议明确限制：

- 只支持自动随机起卦。
- 只支持常见问题类型的用神映射。
- 月建、日辰、旬空如果暂时没有完整历法库，可先保留字段并在文案中降低确定性。
- AI 只做表达润色，不重新判断卦。
- 解卦结果避免给医疗、金融、法律等高风险确定性建议。

## 4. 观象和解卦文案层级

建议输出五段：

1. 总论：一句话描述趋势。
2. 用神：说明核心事项状态。
3. 世应：说明自身与对象/环境的关系。
4. 动爻：说明变化点。
5. 建议：给行动建议，避免绝对化语言。

示例模板：

```text
总论：此卦显示事情已有变化信号，但成败仍取决于用神是否得力。
用神：本次以{六亲}为用神，落在{爻位}，当前{旺衰说明}。
世应：世爻与应爻呈{关系}，说明{关系解释}。
动爻：{动爻位置}发动，对{用神/世爻/应爻}形成{生克合冲}。
建议：宜{建议动作}，不宜{风险动作}。
```

## 5. 工程拆分建议

建议后续代码拆分：

```text
desktop/src/core/liuyao/
  cast.ts              # 自动起卦、爻值生成
  hexagram.ts          # 八卦/六十四卦映射、本卦变卦计算
  plate.ts             # 纳甲、世应、六亲、六神、月建日辰
  interpret.ts         # 规则解卦
  types.ts             # 公共类型
```

UI 层只消费结构化对象，不直接写推断规则。

## 6. 需要继续确认的问题

- 六十四卦映射采用哪套内码：建议阳 `1` 阴 `0`，初爻到上爻。
- 纳甲、世应安法采用哪一套资料表：建议固定为一份本地表，避免运行时推导出错。
- 历法库选择：需要能给出节气月建、日干支、旬空。
- 感情类用神是否询问性别/角色：若不询问，应使用中性规则。
- 是否保存历史卦例：如果保存，需要本地数据结构与隐私提示。
