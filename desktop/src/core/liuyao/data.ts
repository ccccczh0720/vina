import type { ElementName, TopicType, TrigramRef } from "./types";

export const TOPIC_LABELS: Record<TopicType, string> = {
  career: "事业",
  wealth: "财运",
  relationship: "感情",
  health: "健康",
  study: "学业",
  other: "其他",
};

export const TOPIC_USEFUL_RELATIVES: Record<TopicType, string[]> = {
  career: ["官鬼", "父母"],
  wealth: ["妻财"],
  relationship: ["应爻", "妻财", "官鬼"],
  health: ["世爻", "子孙", "官鬼"],
  study: ["父母", "官鬼"],
  other: ["世爻", "应爻"],
};

export const ELEMENT_LABELS: Record<ElementName, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

export const ELEMENT_GENERATES: Record<ElementName, ElementName> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

export const ELEMENT_CONTROLS: Record<ElementName, ElementName> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

export const BRANCH_ELEMENTS: Record<string, ElementName> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
};

export const SIX_SPIRIT_START: Record<string, number> = {
  甲: 0,
  乙: 0,
  丙: 1,
  丁: 1,
  戊: 2,
  己: 3,
  庚: 4,
  辛: 4,
  壬: 5,
  癸: 5,
};

export const SIX_SPIRITS = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"] as const;

export const TRIGRAMS: Record<string, TrigramRef> = {
  "111": { key: "qian", name: "乾", nature: "天", element: "metal", binary: "111" },
  "011": { key: "dui", name: "兑", nature: "泽", element: "metal", binary: "011" },
  "101": { key: "li", name: "离", nature: "火", element: "fire", binary: "101" },
  "001": { key: "zhen", name: "震", nature: "雷", element: "wood", binary: "001" },
  "110": { key: "xun", name: "巽", nature: "风", element: "wood", binary: "110" },
  "010": { key: "kan", name: "坎", nature: "水", element: "water", binary: "010" },
  "100": { key: "gen", name: "艮", nature: "山", element: "earth", binary: "100" },
  "000": { key: "kun", name: "坤", nature: "地", element: "earth", binary: "000" },
};

export const HEXAGRAM_NAMES: Record<string, string> = {
  "111111": "乾为天",
  "011011": "兑为泽",
  "101101": "离为火",
  "001001": "震为雷",
  "110110": "巽为风",
  "010010": "坎为水",
  "100100": "艮为山",
  "000000": "坤为地",
  "010111": "水天需",
  "111010": "天水讼",
  "000010": "地水师",
  "010000": "水地比",
  "110111": "风天小畜",
  "111011": "天泽履",
  "000111": "地天泰",
  "111000": "天地否",
  "111101": "天火同人",
  "101111": "火天大有",
  "000100": "地山谦",
  "001000": "雷地豫",
  "011001": "泽雷随",
  "100110": "山风蛊",
  "000011": "地泽临",
  "110000": "风地观",
  "101001": "火雷噬嗑",
  "100101": "山火贲",
  "100000": "山地剥",
  "000001": "地雷复",
  "111001": "天雷无妄",
  "100111": "山天大畜",
  "100001": "山雷颐",
  "011110": "泽风大过",
  "011100": "泽山咸",
  "001110": "雷风恒",
  "111100": "天山遁",
  "001111": "雷天大壮",
  "101000": "火地晋",
  "000101": "地火明夷",
  "110101": "风火家人",
  "101011": "火泽睽",
  "010100": "水山蹇",
  "001010": "雷水解",
  "100011": "山泽损",
  "110001": "风雷益",
  "011111": "泽天夬",
  "111110": "天风姤",
  "011000": "泽地萃",
  "000110": "地风升",
  "011010": "泽水困",
  "010110": "水风井",
  "011101": "泽火革",
  "101110": "火风鼎",
  "110100": "风山渐",
  "001011": "雷泽归妹",
  "001101": "雷火丰",
  "101100": "火山旅",
  "110010": "风水涣",
  "010011": "水泽节",
  "110011": "风泽中孚",
  "001100": "雷山小过",
  "010101": "水火既济",
  "101010": "火水未济",
};

export const PALACE_SELF_OTHER: Record<string, { self: number; other: number }> = {
  qian: { self: 6, other: 3 },
  dui: { self: 6, other: 3 },
  li: { self: 6, other: 3 },
  zhen: { self: 6, other: 3 },
  xun: { self: 6, other: 3 },
  kan: { self: 6, other: 3 },
  gen: { self: 6, other: 3 },
  kun: { self: 6, other: 3 },
};

export const BRANCH_SEQUENCE_BY_TRIGRAM: Record<string, string[]> = {
  qian: ["子", "寅", "辰", "午", "申", "戌"],
  dui: ["巳", "卯", "丑", "亥", "酉", "未"],
  li: ["卯", "丑", "亥", "酉", "未", "巳"],
  zhen: ["子", "寅", "辰", "午", "申", "戌"],
  xun: ["丑", "亥", "酉", "未", "巳", "卯"],
  kan: ["寅", "辰", "午", "申", "戌", "子"],
  gen: ["辰", "午", "申", "戌", "子", "寅"],
  kun: ["未", "巳", "卯", "丑", "亥", "酉"],
};
