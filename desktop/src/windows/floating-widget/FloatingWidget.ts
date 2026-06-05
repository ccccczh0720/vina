import { openLiuyaoWindow } from "../../tauri/commands";
import { getCurrentWindow } from "@tauri-apps/api/window";

const SVG_NS = "http://www.w3.org/2000/svg";
const CX = 360;
const CY = 360;

const trigramPatterns = [
  { name: "乾", bars: [1, 1, 1] },
  { name: "兑", bars: [0, 1, 1] },
  { name: "离", bars: [1, 0, 1] },
  { name: "震", bars: [0, 0, 1] },
  { name: "巽", bars: [1, 1, 0] },
  { name: "坎", bars: [0, 1, 0] },
  { name: "艮", bars: [1, 0, 0] },
  { name: "坤", bars: [0, 0, 0] },
];

const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const twentyFourMountains = [
  "壬",
  "子",
  "癸",
  "丑",
  "艮",
  "寅",
  "甲",
  "卯",
  "乙",
  "辰",
  "巽",
  "巳",
  "丙",
  "午",
  "丁",
  "未",
  "坤",
  "申",
  "庚",
  "酉",
  "辛",
  "戌",
  "乾",
  "亥",
];
const sixtyJiazi = [
  "甲子",
  "乙丑",
  "丙寅",
  "丁卯",
  "戊辰",
  "己巳",
  "庚午",
  "辛未",
  "壬申",
  "癸酉",
  "甲戌",
  "乙亥",
  "丙子",
  "丁丑",
  "戊寅",
  "己卯",
  "庚辰",
  "辛巳",
  "壬午",
  "癸未",
  "甲申",
  "乙酉",
  "丙戌",
  "丁亥",
  "戊子",
  "己丑",
  "庚寅",
  "辛卯",
  "壬辰",
  "癸巳",
  "甲午",
  "乙未",
  "丙申",
  "丁酉",
  "戊戌",
  "己亥",
  "庚子",
  "辛丑",
  "壬寅",
  "癸卯",
  "甲辰",
  "乙巳",
  "丙午",
  "丁未",
  "戊申",
  "己酉",
  "庚戌",
  "辛亥",
  "壬子",
  "癸丑",
  "甲寅",
  "乙卯",
  "丙辰",
  "丁巳",
  "戊午",
  "己未",
  "庚申",
  "辛酉",
  "壬戌",
  "癸亥",
];

function svgEl(tag: string, attributes: Record<string, string | number> = {}): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, String(value)));
  return el;
}

function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function appendCircle(parent: Element, radius: number, className = "ring-line"): void {
  parent.appendChild(svgEl("circle", { cx: CX, cy: CY, r: radius, class: className, pathLength: 1 }));
}

function appendRadials(parent: Element, innerRadius: number, outerRadius: number, segments: number, offset = 0): void {
  for (let i = 0; i < segments; i += 1) {
    const angle = offset + (360 / segments) * i;
    const inner = polar(innerRadius, angle);
    const outer = polar(outerRadius, angle);
    parent.appendChild(
      svgEl("line", {
        x1: inner.x.toFixed(2),
        y1: inner.y.toFixed(2),
        x2: outer.x.toFixed(2),
        y2: outer.y.toFixed(2),
        class: "sector-line",
        pathLength: 1,
      }),
    );
  }
}

function appendRingGrid(
  parent: Element,
  innerRadius: number,
  outerRadius: number,
  segments: number,
  offset = 0,
  className = "ring-line",
): void {
  appendCircle(parent, innerRadius, className);
  appendCircle(parent, outerRadius, className);
  appendRadials(parent, innerRadius, outerRadius, segments, offset);
}

function appendCyberTicks(parent: Element, innerRadius: number, outerRadius: number, segments: number, offset = 0): void {
  for (let i = 0; i < segments; i += 1) {
    const angle = offset + (360 / segments) * i;
    const inner = polar(innerRadius, angle);
    const outer = polar(outerRadius, angle);
    parent.appendChild(
      svgEl("line", {
        x1: inner.x.toFixed(2),
        y1: inner.y.toFixed(2),
        x2: outer.x.toFixed(2),
        y2: outer.y.toFixed(2),
        class: "cyber-tick",
        pathLength: 1,
      }),
    );
  }
}

function appendCyberNodes(parent: Element, radius: number, segments: number, offset = 0): void {
  for (let i = 0; i < segments; i += 1) {
    const angle = offset + (360 / segments) * i;
    const point = polar(radius, angle);
    parent.appendChild(
      svgEl("circle", {
        cx: point.x.toFixed(2),
        cy: point.y.toFixed(2),
        r: i % 2 === 0 ? 3.8 : 2.4,
        class: "cyber-node",
      }),
    );
  }
}

function appendTextRing(parent: Element, entries: string[], radius: number, offset: number, fontSize: number, className = "ring-text"): void {
  const step = 360 / entries.length;
  entries.forEach((entry, index) => {
    const angle = offset + step * (index + 0.5);
    const point = polar(radius, angle);
    const text = svgEl("text", {
      x: point.x.toFixed(2),
      y: point.y.toFixed(2),
      class: className,
      "font-size": fontSize,
      transform: `rotate(${angle}, ${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
    });
    text.textContent = entry;
    parent.appendChild(text);
  });
}

function appendTaiji(parent: Element): void {
  const radius = 126;
  const halfRadius = radius / 2;
  const dotRadius = 22;
  const g = svgEl("g", { class: "taiji" });
  g.appendChild(svgEl("circle", { cx: CX, cy: CY, r: radius, class: "taiji-white" }));
  g.appendChild(
    svgEl("path", {
      d: [
        `M ${CX} ${CY - radius}`,
        `A ${radius} ${radius} 0 0 1 ${CX} ${CY + radius}`,
        `A ${halfRadius} ${halfRadius} 0 0 1 ${CX} ${CY}`,
        `A ${halfRadius} ${halfRadius} 0 0 0 ${CX} ${CY - radius}`,
        "Z",
      ].join(" "),
      class: "taiji-black",
    }),
  );
  g.appendChild(svgEl("circle", { cx: CX - 43, cy: CY - 63, r: dotRadius, class: "taiji-black" }));
  g.appendChild(svgEl("circle", { cx: CX + 43, cy: CY + 63, r: dotRadius, class: "taiji-white" }));
  g.appendChild(svgEl("circle", { cx: CX, cy: CY, r: radius, class: "core-outline" }));
  parent.appendChild(g);
}

function appendTrigram(parent: Element, angle: number, pattern: { bars: number[] }): void {
  const point = polar(186, angle);
  const trigram = svgEl("g", {
    transform: `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${angle})`,
  });

  pattern.bars.forEach((solid, index) => {
    const y = -20 + index * 20;
    if (solid) {
      trigram.appendChild(svgEl("line", { x1: -29, y1: y, x2: 29, y2: y, class: "trigram-line" }));
      return;
    }
    trigram.appendChild(svgEl("line", { x1: -29, y1: y, x2: -9, y2: y, class: "trigram-line" }));
    trigram.appendChild(svgEl("line", { x1: 9, y1: y, x2: 29, y2: y, class: "trigram-line" }));
  });

  parent.appendChild(trigram);
}

function buildStage2(parent: Element): void {
  const rotor = svgEl("g", { class: "stage-rotor" });
  appendRingGrid(rotor, 136, 226, 8, 22.5);
  appendCircle(rotor, 130, "core-outline");
  trigramPatterns.forEach((pattern, index) => appendTrigram(rotor, index * 45, pattern));
  parent.appendChild(rotor);
}

function buildStage3(parent: Element): void {
  const rotor = svgEl("g", { class: "stage-rotor" });
  appendRingGrid(rotor, 226, 254, 24, 7.5, "hairline");
  appendRingGrid(rotor, 254, 282, 24, 7.5, "hairline");
  appendRingGrid(rotor, 282, 324, 24, 7.5);
  appendTextRing(rotor, [...earthlyBranches, ...earthlyBranches], 240, 7.5, 16, "ring-text mid-text");
  appendTextRing(rotor, Array.from({ length: 24 }, (_, index) => heavenlyStems[index % heavenlyStems.length]), 268, 7.5, 13, "ring-text tiny-text");
  appendTextRing(rotor, twentyFourMountains, 303, 7.5, 30, "ring-text large-text");
  parent.appendChild(rotor);
}

function buildStage4(parent: Element): void {
  const rotor = svgEl("g", { class: "stage-rotor" });
  appendCircle(rotor, 356, "cyber-halo");
  appendRingGrid(rotor, 324, 350, 60, 3);
  appendCyberTicks(rotor, 350, 365, 24, 7.5);
  appendCyberTicks(rotor, 333, 342, 24, 7.5);
  appendCyberNodes(rotor, 356, 12, 15);
  appendTextRing(rotor, sixtyJiazi, 337, 3, 10, "ring-text outer-text");
  parent.appendChild(rotor);
}

function buildLuopan(root: HTMLElement): void {
  appendTaiji(root.querySelector("#coreSpin") as Element);
  buildStage2(root.querySelector("#stage2") as Element);
  buildStage3(root.querySelector("#stage3") as Element);
  buildStage4(root.querySelector("#stage4") as Element);
}

function attachInteraction(root: HTMLElement): void {
  const ornament = root.querySelector<HTMLElement>("#ornament");
  if (!ornament) {
    return;
  }

  const timers: number[] = [];
  const clearTimers = () => {
    while (timers.length > 0) {
      window.clearTimeout(timers.pop());
    }
  };
  const setStage = (stage: number) => {
    ornament.dataset.stage = String(stage);
  };
  const play = () => {
    clearTimers();
    ornament.classList.add("is-playing");
    setStage(1);
    timers.push(window.setTimeout(() => setStage(2), 260));
    timers.push(window.setTimeout(() => setStage(3), 1020));
    timers.push(window.setTimeout(() => setStage(4), 1840));
  };
  const reset = () => {
    clearTimers();
    ornament.classList.remove("is-playing");
    setStage(1);
  };
  let dragStart: { x: number; y: number } | null = null;
  let isDragging = false;

  ornament.addEventListener("pointerenter", play);
  ornament.addEventListener("focus", play);
  ornament.addEventListener("pointerleave", reset);
  ornament.addEventListener("blur", reset);
  ornament.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    dragStart = { x: event.clientX, y: event.clientY };
    isDragging = false;
    ornament.setPointerCapture(event.pointerId);
  });
  ornament.addEventListener("pointermove", (event) => {
    if (!dragStart || isDragging) {
      return;
    }

    const distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    if (distance < 4) {
      return;
    }

    isDragging = true;
    void getCurrentWindow().startDragging();
  });
  ornament.addEventListener("pointerup", (event) => {
    dragStart = null;
    if (ornament.hasPointerCapture(event.pointerId)) {
      ornament.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      isDragging = false;
    }, 0);
  });
  ornament.addEventListener("pointercancel", (event) => {
    dragStart = null;
    if (ornament.hasPointerCapture(event.pointerId)) {
      ornament.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      isDragging = false;
    }, 0);
  });
  ornament.addEventListener("click", () => {
    if (isDragging) {
      return;
    }

    void openLiuyaoWindow();
  });
}

export function mountFloatingWidget(root: HTMLElement): void {
  root.innerHTML = `
    <main class="widget-shell">
      <section id="ornament" class="ornament" data-stage="1" tabindex="0" aria-label="八卦占卜桌面摆件">
        <svg class="luopan" viewBox="0 0 720 720" role="img" aria-hidden="true">
          <defs>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="cyberGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feFlood flood-color="#2d6cff" flood-opacity="0.72" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g id="stage4" class="stage stage-4"></g>
          <g id="stage3" class="stage stage-3"></g>
          <g id="stage2" class="stage stage-2"></g>
          <g id="coreSpin" class="core-spin"></g>
        </svg>
      </section>
    </main>
  `;
  buildLuopan(root);
  attachInteraction(root);
}
