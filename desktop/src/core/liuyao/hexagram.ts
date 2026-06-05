import { HEXAGRAM_NAMES, TRIGRAMS } from "./data";
import type { CastLine, HexagramRef, YinYang } from "./types";

export function lineToBinary(line: CastLine): "0" | "1" {
  return line.yinYang === "yang" ? "1" : "0";
}

export function changedLineYinYang(line: CastLine): YinYang {
  if (!line.moving) {
    return line.yinYang;
  }

  return line.yinYang === "yang" ? "yin" : "yang";
}

export function linesToBinary(lines: CastLine[], changed = false): string {
  return [...lines]
    .sort((a, b) => a.position - b.position)
    .map((line) => {
      const yinYang = changed ? changedLineYinYang(line) : line.yinYang;
      return yinYang === "yang" ? "1" : "0";
    })
    .join("");
}

export function resolveHexagram(binary: string): HexagramRef {
  const lowerBinary = binary.slice(0, 3);
  const upperBinary = binary.slice(3, 6);
  const lower = TRIGRAMS[lowerBinary];
  const upper = TRIGRAMS[upperBinary];

  if (!lower || !upper) {
    throw new Error(`Invalid hexagram binary: ${binary}`);
  }

  const nameKey = `${upperBinary}${lowerBinary}`;

  return {
    name: HEXAGRAM_NAMES[nameKey] ?? `${upper.nature}${lower.nature}`,
    upper,
    lower,
    binary,
  };
}
