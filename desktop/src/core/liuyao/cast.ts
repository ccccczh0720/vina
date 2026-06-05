import { TOPIC_LABELS } from "./data";
import { linesToBinary, resolveHexagram } from "./hexagram";
import type { CastLine, CastPreview, CoinValue, LineValue, TopicType } from "./types";

function castSingleLine(position: CastLine["position"]): CastLine {
  const coins = Array.from({ length: 3 }, () => (Math.random() < 0.5 ? 2 : 3)) as CoinValue[];
  const value = coins.reduce<number>((sum, coin) => sum + coin, 0) as LineValue;

  return {
    position,
    value,
    coins,
    yinYang: value === 7 || value === 9 ? "yang" : "yin",
    moving: value === 6 || value === 9,
  };
}

export function createCastPreview(question: string, topic: TopicType): CastPreview {
  const lines = [1, 2, 3, 4, 5, 6].map((position) => castSingleLine(position as CastLine["position"]));
  const primaryBinary = linesToBinary(lines);
  const changedBinary = linesToBinary(lines, true);
  const movingLines = lines.filter((line) => line.moving).map((line) => line.position);

  return {
    id: crypto.randomUUID(),
    question,
    topic,
    topicLabel: TOPIC_LABELS[topic],
    castTime: new Date().toISOString(),
    lines,
    primaryHexagram: resolveHexagram(primaryBinary),
    changedHexagram: movingLines.length > 0 ? resolveHexagram(changedBinary) : null,
    movingLines,
  };
}
