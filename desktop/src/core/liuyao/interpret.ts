import {
  BRANCH_ELEMENTS,
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  ELEMENT_LABELS,
  TOPIC_USEFUL_RELATIVES,
} from "./data";
import type { ElementName, Interpretation, LiuyaoLineDetail, LiuyaoPlate } from "./types";

function elementRelation(actor: ElementName, target: ElementName): "same" | "generate" | "control" | "generatedBy" | "controlledBy" {
  if (actor === target) {
    return "same";
  }

  if (ELEMENT_GENERATES[actor] === target) {
    return "generate";
  }

  if (ELEMENT_CONTROLS[actor] === target) {
    return "control";
  }

  if (ELEMENT_GENERATES[target] === actor) {
    return "generatedBy";
  }

  return "controlledBy";
}

function relationText(actor: LiuyaoLineDetail, target: LiuyaoLineDetail): string {
  const relation = elementRelation(actor.element, target.element);
  const actorLabel = ELEMENT_LABELS[actor.element];
  const targetLabel = ELEMENT_LABELS[target.element];

  if (relation === "same") {
    return `${actorLabel}${targetLabel}同气`;
  }
  if (relation === "generate") {
    return `${actorLabel}生${targetLabel}`;
  }
  if (relation === "control") {
    return `${actorLabel}克${targetLabel}`;
  }
  if (relation === "generatedBy") {
    return `${targetLabel}生${actorLabel}`;
  }
  return `${targetLabel}克${actorLabel}`;
}

function findUsefulLine(plate: LiuyaoPlate): LiuyaoLineDetail {
  const usefulRelatives = TOPIC_USEFUL_RELATIVES[plate.topic];
  const direct = usefulRelatives
    .map((relation) => {
      if (relation === "世爻") {
        return plate.lineDetails.find((line) => line.role === "世");
      }
      if (relation === "应爻") {
        return plate.lineDetails.find((line) => line.role === "应");
      }
      return plate.lineDetails.find((line) => line.sixRelative === relation);
    })
    .find((line): line is LiuyaoLineDetail => Boolean(line));

  return direct ?? plate.lineDetails.find((line) => line.role === "世") ?? plate.lineDetails[5];
}

function scoreUsefulLine(plate: LiuyaoPlate, usefulLine: LiuyaoLineDetail): { score: number; trace: string[] } {
  const trace: string[] = [];
  let score = 0;
  const monthElement = BRANCH_ELEMENTS[plate.lunarContext.monthBranch];
  const dayElement = BRANCH_ELEMENTS[plate.lunarContext.dayBranch];

  const monthRelation = elementRelation(monthElement, usefulLine.element);
  if (monthRelation === "same" || monthRelation === "generate") {
    score += 2;
    trace.push(`月建${plate.lunarContext.monthBranch}对用神有生扶`);
  } else if (monthRelation === "control") {
    score -= 2;
    trace.push(`月建${plate.lunarContext.monthBranch}克制用神`);
  }

  const dayRelation = elementRelation(dayElement, usefulLine.element);
  if (dayRelation === "same" || dayRelation === "generate") {
    score += 1;
    trace.push(`日辰${plate.lunarContext.dayBranch}对用神有助`);
  } else if (dayRelation === "control") {
    score -= 1;
    trace.push(`日辰${plate.lunarContext.dayBranch}克制用神`);
  }

  if (plate.lunarContext.voidBranches.includes(usefulLine.branch)) {
    score -= 1;
    trace.push(`用神临旬空：${usefulLine.branch}`);
  }

  if (usefulLine.moving) {
    const changedRelation = elementRelation(usefulLine.changedElement, usefulLine.element);
    if (changedRelation === "generate" || changedRelation === "same") {
      score += 1;
      trace.push("用神发动且变爻回生或同气");
    } else if (changedRelation === "control") {
      score -= 1;
      trace.push("用神发动但变爻回克");
    }
  }

  return { score, trace };
}

function strengthFromScore(score: number): "strong" | "neutral" | "weak" {
  if (score >= 2) {
    return "strong";
  }
  if (score <= -1) {
    return "weak";
  }
  return "neutral";
}

function strengthLabel(strength: "strong" | "neutral" | "weak"): string {
  if (strength === "strong") {
    return "偏旺";
  }
  if (strength === "weak") {
    return "偏弱";
  }
  return "平平";
}

function movingEffect(line: LiuyaoLineDetail, usefulLine: LiuyaoLineDetail): "support" | "block" | "mixed" | "neutral" {
  if (line.position === usefulLine.position) {
    return line.changedElement === usefulLine.element || ELEMENT_GENERATES[line.changedElement] === usefulLine.element
      ? "support"
      : "mixed";
  }

  const relation = elementRelation(line.element, usefulLine.element);
  if (relation === "same" || relation === "generate") {
    return "support";
  }
  if (relation === "control") {
    return "block";
  }
  return "neutral";
}

function buildJudgement(
  plate: LiuyaoPlate,
  strength: "strong" | "neutral" | "weak",
  usefulScore: number,
  movingSummaries: Array<{ effect: "support" | "block" | "mixed" | "neutral" }>,
): { verdict: string; summary: string; advice: string[] } {
  const supportCount = movingSummaries.filter((item) => item.effect === "support").length;
  const blockCount = movingSummaries.filter((item) => item.effect === "block").length;
  const mixedCount = movingSummaries.filter((item) => item.effect === "mixed").length;
  const movingDelta = supportCount - blockCount - mixedCount * 0.5;
  const finalScore = usefulScore + movingDelta;
  const hasBlockingMotion = blockCount > 0 || mixedCount > 0;
  const hasSupportMotion = supportCount > 0;

  if (finalScore >= 2.5 && !hasBlockingMotion) {
    return {
      verdict: "吉",
      summary: `此卦${plate.primaryHexagram.name}，用神得力，动爻亦不伤用，断为吉。`,
      advice: ["可以做，按正常节奏推进即可。", "动爻无明显克害，不必把小波动看成大阻碍。"],
    };
  }

  if (finalScore >= 1.5) {
    return {
      verdict: "吉中有阻",
      summary: `此卦${plate.primaryHexagram.name}，本势偏吉，但动爻见阻，断为吉中有阻。`,
      advice: ["事情可成，但阻点真实存在，先处理动爻所指的冲突。", "不要泛泛求稳，重点看克制用神或一动一变的爻位。"],
    };
  }

  if (finalScore <= -1.5 && !hasSupportMotion) {
    return {
      verdict: "凶",
      summary: `此卦${plate.primaryHexagram.name}，用神受制且无明显来扶，断为凶。`,
      advice: ["不宜强行推进，当前条件不足。", "先止损、避险或换时机，不要用侥幸心态硬上。"],
    };
  }

  if (finalScore <= -0.5) {
    return {
      verdict: "凶中有救",
      summary: `此卦${plate.primaryHexagram.name}，本势偏凶，但仍有动爻扶助，断为凶中有救。`,
      advice: ["先按凶看，谨慎处理；可用扶助用神的动爻作为补救方向。", "若补救条件落不下来，则仍以不成或多阻论。"],
    };
  }

  if (strength === "strong" && !hasBlockingMotion) {
    return {
      verdict: "小吉",
      summary: `此卦${plate.primaryHexagram.name}，用神有根，但成势不重，断为小吉。`,
      advice: ["可以试行，收益和进展有限，不宜夸大结果。", "无须过度保守，也不要追加过多成本。"],
    };
  }

  return {
    verdict: "平",
    summary: `此卦${plate.primaryHexagram.name}，吉凶力量相抵，断为平。`,
    advice: ["暂不作大判断，先看现实条件是否继续明朗。", "要么小范围验证，要么等待新的外部信号。"],
  };
}

export function interpretPlate(plate: LiuyaoPlate): Interpretation {
  const usefulLine = findUsefulLine(plate);
  const score = scoreUsefulLine(plate, usefulLine);
  const strength = strengthFromScore(score.score);
  const selfLine = plate.lineDetails.find((line) => line.role === "世") ?? plate.lineDetails[5];
  const otherLine = plate.lineDetails.find((line) => line.role === "应") ?? plate.lineDetails[2];
  const selfOtherRelation = relationText(otherLine, selfLine);
  const movingLines = plate.lineDetails.filter((line) => line.moving);
  const movingSummaries = movingLines.map((line) => {
    const effect = movingEffect(line, usefulLine);
    const effectText =
      effect === "support" ? "扶助用神" : effect === "block" ? "克制用神" : effect === "mixed" ? "一动一变，吉凶参半" : "影响较间接";

    return {
      position: line.position,
      effect,
      text: `${line.position}爻${line.sixRelative}${line.moving ? "发动" : ""}，由${ELEMENT_LABELS[line.element]}变${ELEMENT_LABELS[line.changedElement]}，${effectText}。`,
    };
  });
  const usefulLabel = usefulLine.role === "世" ? "世爻" : usefulLine.role === "应" ? "应爻" : usefulLine.sixRelative;
  const judgement = buildJudgement(plate, strength, score.score, movingSummaries);
  const summary = `${judgement.verdict}。${judgement.summary}`;
  const advice = judgement.advice;

  const sourceText = [
    `总论：${summary}`,
    `用神：本次以${usefulLabel}为用神，落${usefulLine.position}爻，${ELEMENT_LABELS[usefulLine.element]}性，当前${strengthLabel(strength)}。`,
    `世应：世爻在${selfLine.position}爻，应爻在${otherLine.position}爻，呈${selfOtherRelation}。`,
    `动爻：${movingSummaries.length > 0 ? movingSummaries.map((item) => item.text).join(" ") : "本卦无动爻，以静卦观其本势。"}`,
    `建议：${advice.join(" ")}`,
  ].join("\n");

  return {
    summary,
    usefulGod: {
      relation: usefulLabel,
      linePosition: usefulLine.position,
      strength,
      text: `用神为${usefulLabel}，落${usefulLine.position}爻，${ELEMENT_LABELS[usefulLine.element]}性，${strengthLabel(strength)}。${score.trace.join("；") || "未见明显生克偏向"}。`,
    },
    selfOther: {
      selfLine: selfLine.position,
      otherLine: otherLine.position,
      relation: selfOtherRelation,
      text: `世爻代表自身，应爻代表外部响应；当前${selfOtherRelation}，需结合用神强弱判断进退。`,
    },
    movingLines: movingSummaries,
    advice,
    ruleTrace: [
      `本卦：${plate.primaryHexagram.name}`,
      `变卦：${plate.changedHexagram?.name ?? "无变"}`,
      `月建：${plate.lunarContext.monthBranch}`,
      `日辰：${plate.lunarContext.dayStem}${plate.lunarContext.dayBranch}`,
      `旬空：${plate.lunarContext.voidBranches.join("、")}`,
      ...score.trace,
    ],
    sourceText,
  };
}
