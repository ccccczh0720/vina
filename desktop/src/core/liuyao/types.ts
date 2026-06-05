export type TopicType = "career" | "wealth" | "relationship" | "health" | "study" | "other";

export type LineValue = 6 | 7 | 8 | 9;
export type CoinValue = 2 | 3;
export type YinYang = "yin" | "yang";
export type ElementName = "wood" | "fire" | "earth" | "metal" | "water";

export type CastLine = {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  value: LineValue;
  coins: CoinValue[];
  yinYang: YinYang;
  moving: boolean;
};

export type TrigramRef = {
  key: string;
  name: string;
  nature: string;
  element: ElementName;
  binary: string;
};

export type HexagramRef = {
  name: string;
  upper: TrigramRef;
  lower: TrigramRef;
  binary: string;
};

export type CastPreview = {
  id: string;
  question: string;
  topic: TopicType;
  topicLabel: string;
  castTime: string;
  lines: CastLine[];
  primaryHexagram: HexagramRef;
  changedHexagram: HexagramRef | null;
  movingLines: number[];
};

export type LiuyaoLineDetail = CastLine & {
  sixSpirit: string;
  sixRelative: string;
  branch: string;
  element: ElementName;
  role: "" | "世" | "应";
  changedYinYang: YinYang;
  changedBranch: string;
  changedElement: ElementName;
  changedSixRelative: string;
};

export type LunarContext = {
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  voidBranches: string[];
};

export type LiuyaoPlate = CastPreview & {
  lunarContext: LunarContext;
  lineDetails: LiuyaoLineDetail[];
};

export type Interpretation = {
  summary: string;
  usefulGod: {
    relation: string;
    linePosition: number;
    strength: "strong" | "neutral" | "weak";
    text: string;
  };
  selfOther: {
    selfLine: number;
    otherLine: number;
    relation: string;
    text: string;
  };
  movingLines: Array<{
    position: number;
    effect: "support" | "block" | "mixed" | "neutral";
    text: string;
  }>;
  advice: string[];
  ruleTrace: string[];
  sourceText: string;
  polishedText?: string;
  aiStatus?: "success" | "failed" | "disabled";
};
