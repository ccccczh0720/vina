import {
  BRANCH_ELEMENTS,
  BRANCH_SEQUENCE_BY_TRIGRAM,
  BRANCHES,
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  SIX_SPIRIT_START,
  SIX_SPIRITS,
  STEMS,
} from "./data";
import { changedLineYinYang } from "./hexagram";
import type { CastPreview, ElementName, LiuyaoLineDetail, LiuyaoPlate, LunarContext } from "./types";

function formatDateKey(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const base = Date.UTC(2024, 1, 10);
  return Math.floor((utc - base) / 86_400_000);
}

function createLunarContext(castTime: string): LunarContext {
  const date = new Date(castTime);
  const dayIndex = formatDateKey(date);
  const dayStem = STEMS[((dayIndex % 10) + 10) % 10];
  const dayBranch = BRANCHES[((dayIndex % 12) + 12) % 12];
  const monthBranch = BRANCHES[((date.getMonth() + 2) % 12) as number];
  const voidStart = (((Math.floor((((dayIndex % 60) + 60) % 60) / 10) * 2) + 10) % 12) as number;

  return {
    monthBranch,
    dayStem,
    dayBranch,
    voidBranches: [BRANCHES[voidStart], BRANCHES[(voidStart + 1) % 12]],
  };
}

function relationFromElements(base: ElementName, target: ElementName): string {
  if (base === target) {
    return "兄弟";
  }

  if (ELEMENT_GENERATES[base] === target) {
    return "子孙";
  }

  if (ELEMENT_GENERATES[target] === base) {
    return "父母";
  }

  if (ELEMENT_CONTROLS[base] === target) {
    return "妻财";
  }

  return "官鬼";
}

function spiritForLine(dayStem: string, position: number): string {
  const start = SIX_SPIRIT_START[dayStem] ?? 0;
  return SIX_SPIRITS[(start + position - 1) % 6];
}

function branchAt(trigramKey: string, position: number): string {
  const sequence = BRANCH_SEQUENCE_BY_TRIGRAM[trigramKey] ?? BRANCH_SEQUENCE_BY_TRIGRAM.qian;
  return sequence[position - 1] ?? "子";
}

export function createPlate(preview: CastPreview): LiuyaoPlate {
  const lunarContext = createLunarContext(preview.castTime);
  const palaceElement = preview.primaryHexagram.lower.element;
  const selfLine = 6;
  const otherLine = 3;

  const lineDetails: LiuyaoLineDetail[] = preview.lines.map((line) => {
    const trigram = line.position <= 3 ? preview.primaryHexagram.lower : preview.primaryHexagram.upper;
    const positionInTrigram = line.position <= 3 ? line.position : line.position - 3;
    const branch = branchAt(trigram.key, positionInTrigram);
    const element = BRANCH_ELEMENTS[branch];
    const changedTrigram = line.position <= 3 ? preview.changedHexagram?.lower : preview.changedHexagram?.upper;
    const changedBranch = branchAt(changedTrigram?.key ?? trigram.key, positionInTrigram);
    const changedElement = BRANCH_ELEMENTS[changedBranch];

    return {
      ...line,
      sixSpirit: spiritForLine(lunarContext.dayStem, line.position),
      sixRelative: relationFromElements(palaceElement, element),
      branch,
      element,
      role: line.position === selfLine ? "世" : line.position === otherLine ? "应" : "",
      changedYinYang: changedLineYinYang(line),
      changedBranch,
      changedElement,
      changedSixRelative: relationFromElements(palaceElement, changedElement),
    };
  });

  return {
    ...preview,
    lunarContext,
    lineDetails,
  };
}
