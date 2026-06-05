import { createCastPreview } from "../../core/liuyao/cast";
import { ELEMENT_LABELS, TOPIC_LABELS } from "../../core/liuyao/data";
import { interpretPlate } from "../../core/liuyao/interpret";
import { createPlate } from "../../core/liuyao/plate";
import type { CastLine, CastPreview, CoinValue, Interpretation, LiuyaoLineDetail, LiuyaoPlate, TopicType, YinYang } from "../../core/liuyao/types";
import { hideLiuyaoWindow, polishInterpretation } from "../../tauri/commands";

type ViewState = "ask" | "preview" | "plate" | "reading";

const TOPICS: Array<{ value: TopicType; label: string }> = [
  { value: "career", label: "事业" },
  { value: "wealth", label: "财运" },
  { value: "relationship", label: "感情" },
  { value: "health", label: "健康" },
  { value: "study", label: "学业" },
  { value: "other", label: "其他" },
];
const LINE_POSITIONS_DESC = [6, 5, 4, 3, 2, 1] as const;

let activeTopic: TopicType = "career";
let currentPreview: CastPreview | null = null;
let currentPlate: LiuyaoPlate | null = null;
let currentInterpretation: Interpretation | null = null;
let isCasting = false;

function lineLabel(position: number): string {
  return ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][position - 1] ?? `${position}爻`;
}

function movingLabel(lines: number[]): string {
  if (lines.length === 0) {
    return "无动爻";
  }

  return lines.map(lineLabel).join("、");
}

function lineValueLabel(value: CastLine["value"]): string {
  if (value === 6) {
    return "老阴";
  }
  if (value === 7) {
    return "少阳";
  }
  if (value === 8) {
    return "少阴";
  }
  return "老阳";
}

function coinMarkup(coin: CoinValue): string {
  return `
    <span class="liuyao-coin ${coin === 3 ? "yang" : "yin"}" aria-label="${coin === 3 ? "阳面" : "阴面"}">
      <span class="coin-inscription coin-top">咸</span>
      <span class="coin-inscription coin-right">元</span>
      <span class="coin-inscription coin-bottom">宝</span>
      <span class="coin-inscription coin-left">通</span>
      <span class="coin-hole"></span>
    </span>
  `;
}

function renderCoinRows(lines: CastLine[], activePosition: number | null): string {
  const lineMap = new Map(lines.map((line) => [line.position, line]));

  const coinCell = (position: (typeof LINE_POSITIONS_DESC)[number], coinIndex: number): string => {
    const line = lineMap.get(position);
    const isActive = activePosition === position;

    if (!line) {
      return `
        <span class="liuyao-coin placeholder ${isActive ? "shaking" : ""}" aria-label="${isActive ? "摇卦中" : "待摇"}">
          <span class="coin-inscription coin-top">${isActive ? "摇" : ""}</span>
          <span class="coin-hole"></span>
        </span>
      `;
    }

    return coinMarkup(line.coins[coinIndex]);
  };

  return `
    <div class="liuyao-coin-grid">
      ${LINE_POSITIONS_DESC.map(
        (position) => `<span class="liuyao-coin-line ${activePosition === position ? "is-shaking" : ""}">${lineLabel(position)}</span>`,
      ).join("")}
      ${[0, 1, 2]
        .map((coinIndex) => LINE_POSITIONS_DESC.map((position) => coinCell(position, coinIndex)).join(""))
        .join("")}
      ${LINE_POSITIONS_DESC.map((position) => {
        const line = lineMap.get(position);
        if (!line) {
          return `<span class="liuyao-coin-value">${activePosition === position ? "摇卦中" : "待摇"}</span>`;
        }
        return `<span class="liuyao-coin-value">${lineValueLabel(line.value)}</span>`;
      }).join("")}
    </div>
  `;
}

function yaoMarkup(yinYang: YinYang): string {
  if (yinYang === "yang") {
    return '<span class="liuyao-yao"><span class="liuyao-bar liuyao-solid"></span></span>';
  }

  return '<span class="liuyao-yao"><span class="liuyao-bar liuyao-broken"></span><span class="liuyao-bar liuyao-broken"></span></span>';
}

function renderCoinPanel(root: HTMLElement, lines: CastLine[] = [], activePosition: number | null = null): void {
  const coinPanel = root.querySelector<HTMLElement>("#coinPanel");
  if (!coinPanel) {
    return;
  }

  coinPanel.innerHTML = `
    <div class="liuyao-coin-title">
      <span>铜钱</span>
      <small>三钱成一爻，自下而上成卦</small>
    </div>
    <div class="liuyao-coin-rows">
      ${renderCoinRows(lines, activePosition)}
    </div>
  `;
}

function changedLineYinYang(line: CastLine): YinYang {
  if (!line.moving) {
    return line.yinYang;
  }

  return line.yinYang === "yang" ? "yin" : "yang";
}

function setStep(root: HTMLElement, state: ViewState): void {
  root.querySelectorAll<HTMLElement>("[data-step]").forEach((item) => {
    item.classList.toggle("active", item.dataset.step === state);
  });
}

function setHint(root: HTMLElement, message: string, isError = false): void {
  const hint = root.querySelector<HTMLElement>("#formHint");
  if (!hint) {
    return;
  }

  hint.textContent = message;
  hint.classList.toggle("error", isError);
}

function selectedTopicLabel(): string {
  return TOPIC_LABELS[activeTopic];
}

function readQuestion(root: HTMLElement): string {
  return root.querySelector<HTMLTextAreaElement>("#questionInput")?.value.trim() ?? "";
}

function validateInput(root: HTMLElement): boolean {
  const question = readQuestion(root);
  if (question.length < 2) {
    setHint(root, "请先写下要问的事，至少两个字。", true);
    return false;
  }

  setHint(root, "已定问题，可自动起卦后先观象。");
  return true;
}

function renderEmptyPreview(root: HTMLElement): void {
  const previewLines = root.querySelector<HTMLElement>("#previewLines");
  if (!previewLines) {
    return;
  }

  previewLines.innerHTML = [6, 5, 4, 3, 2, 1]
    .map(
      (line) => `
        <div class="liuyao-preview-line">
          <span>${lineLabel(line)}</span>
          ${yaoMarkup("yang")}
          <span class="liuyao-moving-mark"></span>
          ${yaoMarkup("yang")}
        </div>
      `,
    )
    .join("");
}

function renderPreview(root: HTMLElement, preview: CastPreview): void {
  root.querySelector<HTMLElement>("#previewMain")!.textContent = preview.primaryHexagram.name;
  root.querySelector<HTMLElement>("#previewChanged")!.textContent = preview.changedHexagram?.name ?? "无变";
  root.querySelector<HTMLElement>("#previewMoving")!.textContent = movingLabel(preview.movingLines);
  root.querySelector<HTMLElement>("#previewTime")!.textContent = new Date(preview.castTime).toLocaleString("zh-CN");
  root.querySelector<HTMLElement>("#previewTopic")!.textContent = preview.topicLabel;
  root.querySelector<HTMLElement>("#previewQuestion")!.textContent = preview.question;

  const previewLines = root.querySelector<HTMLElement>("#previewLines");
  if (previewLines) {
    previewLines.innerHTML = [...preview.lines]
      .sort((a, b) => b.position - a.position)
      .map(
        (line) => `
          <div class="liuyao-preview-line">
            <span>${lineLabel(line.position)}</span>
            ${yaoMarkup(line.yinYang)}
            <span class="liuyao-moving-mark">${line.moving ? "动" : ""}</span>
            ${yaoMarkup(changedLineYinYang(line))}
          </div>
        `,
      )
      .join("");
  }

  root.querySelector<HTMLElement>("#previewPanel")?.classList.add("ready");
  const confirmButton = root.querySelector<HTMLButtonElement>("#confirmButton");
  if (confirmButton) {
    confirmButton.disabled = false;
  }
  setStep(root, "preview");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function animateCast(root: HTMLElement, preview: CastPreview): Promise<void> {
  const revealedLines: CastLine[] = [];
  const castButton = root.querySelector<HTMLButtonElement>("#castButton");
  const resetButton = root.querySelector<HTMLButtonElement>("#resetButton");
  const confirmButton = root.querySelector<HTMLButtonElement>("#confirmButton");

  isCasting = true;
  if (castButton) {
    castButton.disabled = true;
  }
  if (resetButton) {
    resetButton.disabled = true;
  }
  if (confirmButton) {
    confirmButton.disabled = true;
  }

  renderCoinPanel(root);
  setStep(root, "preview");

  for (const line of [...preview.lines].sort((a, b) => a.position - b.position)) {
    setHint(root, `正在摇${lineLabel(line.position)}...`);
    renderCoinPanel(root, revealedLines, line.position);
    await sleep(520);
    revealedLines.push(line);
    renderCoinPanel(root, revealedLines);
    await sleep(160);
  }

  renderPreview(root, preview);
  setHint(root, "六爻已成，请先观象，确认后入排盘。");
  isCasting = false;
  if (castButton) {
    castButton.disabled = false;
  }
  if (resetButton) {
    resetButton.disabled = false;
  }
}

function renderChart(root: HTMLElement, plate: LiuyaoPlate): void {
  const chartRows = root.querySelector<HTMLElement>("#chartRows");
  if (!chartRows) {
    return;
  }

  chartRows.innerHTML = [...plate.lineDetails]
    .sort((a, b) => b.position - a.position)
    .map((line) => renderChartRow(line))
    .join("");

  root.querySelector<HTMLElement>("#plateContext")!.textContent =
    `月建 ${plate.lunarContext.monthBranch} · 日辰 ${plate.lunarContext.dayStem}${plate.lunarContext.dayBranch} · 旬空 ${plate.lunarContext.voidBranches.join("、")}`;
  setStep(root, "plate");
}

function renderChartRow(line: LiuyaoLineDetail): string {
  return `
    <div class="liuyao-chart-row">
      <span>${line.sixSpirit}</span>
      <span>${line.sixRelative}</span>
      <span>${line.branch}${ELEMENT_LABELS[line.element]}</span>
      ${yaoMarkup(line.yinYang)}
      <span class="liuyao-moving-mark">${line.moving ? "●" : ""}</span>
      ${yaoMarkup(line.changedYinYang)}
      <span>${line.changedBranch}${ELEMENT_LABELS[line.changedElement]}</span>
      <span>${line.role}</span>
    </div>
  `;
}

function renderInterpretation(root: HTMLElement, interpretation: Interpretation): void {
  root.querySelector<HTMLElement>("#readingTitle")!.textContent = "规则解卦";
  root.querySelector<HTMLElement>("#readingText")!.textContent = interpretation.polishedText ?? interpretation.sourceText;
  root.querySelector<HTMLElement>("#usefulGodText")!.textContent = interpretation.usefulGod.text;
  root.querySelector<HTMLElement>("#relationText")!.textContent = interpretation.selfOther.text;
  root.querySelector<HTMLElement>("#movingText")!.textContent =
    interpretation.movingLines.length > 0 ? interpretation.movingLines.map((item) => item.text).join(" ") : "本卦无动爻，以静卦观其本势。";
  root.querySelector<HTMLElement>("#adviceText")!.textContent = interpretation.advice.join(" ");
  root.querySelector<HTMLElement>("#ruleTrace")!.textContent = interpretation.ruleTrace.join("；");
  const aiStatus = root.querySelector<HTMLElement>("#aiStatus");
  if (aiStatus) {
    aiStatus.textContent =
      interpretation.aiStatus === "success"
        ? "AI 已润色"
        : interpretation.aiStatus === "failed"
          ? "AI 润色失败，已显示规则解卦"
          : interpretation.aiStatus === "disabled"
            ? "AI 未启用，已显示规则解卦"
            : "等待润色";
  }
  setStep(root, "reading");
}

async function polishReading(root: HTMLElement, interpretation: Interpretation): Promise<void> {
  const aiStatus = root.querySelector<HTMLElement>("#aiStatus");
  if (aiStatus) {
    aiStatus.textContent = "AI 润色中...";
  }

  try {
    const output = await polishInterpretation({ sourceText: interpretation.sourceText });
    currentInterpretation = {
      ...interpretation,
      polishedText: output.polishedText ?? undefined,
      aiStatus: output.status,
    };
  } catch {
    currentInterpretation = {
      ...interpretation,
      aiStatus: "failed",
    };
  }

  renderInterpretation(root, currentInterpretation);
}

function renderTopicButtons(): string {
  return TOPICS.map(
    (topic) => `
      <button class="liuyao-type-chip${topic.value === activeTopic ? " active" : ""}" data-topic="${topic.value}" type="button">${topic.label}</button>
    `,
  ).join("");
}

function bindEvents(root: HTMLElement): void {
  root.querySelector<HTMLButtonElement>(".liuyao-close")?.addEventListener("click", () => {
    void hideLiuyaoWindow();
  });

  root.querySelectorAll<HTMLButtonElement>(".liuyao-type-chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeTopic = (button.dataset.topic as TopicType | undefined) ?? "career";
      root.querySelectorAll<HTMLButtonElement>(".liuyao-type-chip").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      setHint(root, `已选择${selectedTopicLabel()}。`);
    });
  });

  root.querySelector<HTMLButtonElement>("#castButton")?.addEventListener("click", () => {
    if (isCasting) {
      return;
    }

    if (!validateInput(root)) {
      return;
    }

    currentPlate = null;
    currentInterpretation = null;
    currentPreview = createCastPreview(readQuestion(root), activeTopic);
    root.querySelector<HTMLElement>("#previewMain")!.textContent = "起卦中";
    root.querySelector<HTMLElement>("#previewChanged")!.textContent = "待成";
    root.querySelector<HTMLElement>("#previewMoving")!.textContent = "待定";
    root.querySelector<HTMLElement>("#previewTime")!.textContent = new Date(currentPreview.castTime).toLocaleString("zh-CN");
    root.querySelector<HTMLElement>("#previewTopic")!.textContent = currentPreview.topicLabel;
    root.querySelector<HTMLElement>("#previewQuestion")!.textContent = currentPreview.question;
    root.querySelector<HTMLElement>("#previewPanel")?.classList.remove("ready");
    root.querySelector<HTMLElement>("#readingTitle")!.textContent = "待确认";
    root.querySelector<HTMLElement>("#readingText")!.textContent = "确认卦象后生成排盘与规则解卦。";
    void animateCast(root, currentPreview);
  });

  root.querySelector<HTMLButtonElement>("#confirmButton")?.addEventListener("click", () => {
    if (!currentPreview || isCasting) {
      return;
    }

    currentPlate = createPlate(currentPreview);
    currentInterpretation = interpretPlate(currentPlate);
    renderChart(root, currentPlate);
    renderInterpretation(root, currentInterpretation);
    void polishReading(root, currentInterpretation);
  });

  root.querySelector<HTMLButtonElement>("#resetButton")?.addEventListener("click", () => {
    if (isCasting) {
      return;
    }

    currentPreview = null;
    currentPlate = null;
    currentInterpretation = null;
    root.querySelector<HTMLTextAreaElement>("#questionInput")!.value = "";
    root.querySelector<HTMLElement>("#previewMain")!.textContent = "未起";
    root.querySelector<HTMLElement>("#previewChanged")!.textContent = "未起";
    root.querySelector<HTMLElement>("#previewMoving")!.textContent = "未起";
    root.querySelector<HTMLElement>("#previewTime")!.textContent = "待起卦";
    root.querySelector<HTMLElement>("#previewTopic")!.textContent = selectedTopicLabel();
    root.querySelector<HTMLElement>("#previewQuestion")!.textContent = "尚未填写";
    root.querySelector<HTMLElement>("#chartRows")!.innerHTML = "";
    root.querySelector<HTMLElement>("#plateContext")!.textContent = "待排盘";
    root.querySelector<HTMLElement>("#readingTitle")!.textContent = "天道未显";
    root.querySelector<HTMLElement>("#readingText")!.textContent = "确认卦象后，此处展示规则解卦与 AI 润色后的文案。";
    root.querySelector<HTMLElement>("#usefulGodText")!.textContent = "待排盘";
    root.querySelector<HTMLElement>("#relationText")!.textContent = "待排盘";
    root.querySelector<HTMLElement>("#movingText")!.textContent = "待排盘";
    root.querySelector<HTMLElement>("#adviceText")!.textContent = "待排盘";
    root.querySelector<HTMLElement>("#ruleTrace")!.textContent = "待排盘";
    root.querySelector<HTMLElement>("#aiStatus")!.textContent = "等待起卦";
    root.querySelector<HTMLButtonElement>("#confirmButton")!.disabled = true;
    root.querySelector<HTMLElement>("#previewPanel")?.classList.remove("ready");
    renderCoinPanel(root);
    renderEmptyPreview(root);
    setStep(root, "ask");
    setHint(root, "择其类，静其心，自动起卦后先观象。");
  });
}

export function mountLiuyaoFeature(root: HTMLElement): void {
  root.innerHTML = `
    <main class="liuyao-stage" aria-label="天道六爻桌面窗口">
      <section class="liuyao-window">
        <header class="liuyao-header">
          <div class="liuyao-seal">爻</div>
          <div>
            <h1>天道六爻</h1>
            <p>问事 · 起卦 · 观象 · 解卦</p>
          </div>
          <button class="liuyao-close" type="button">关闭</button>
        </header>

        <div class="liuyao-layout">
          <aside class="liuyao-left-rail">
            <ol class="liuyao-steps" aria-label="流程">
              <li class="active" data-step="ask">问</li>
              <li data-step="preview">象</li>
              <li data-step="plate">盘</li>
              <li data-step="reading">解</li>
            </ol>
          </aside>

          <section class="liuyao-workbench">
            <section class="liuyao-paper liuyao-inquiry">
              <div class="liuyao-section-title">
                <span>问事</span>
                <small>Question</small>
              </div>
              <div class="liuyao-type-grid" role="group" aria-label="问题类型">
                ${renderTopicButtons()}
              </div>
              <textarea id="questionInput" rows="3" placeholder="写下具体所问，例如：这个项目本月是否适合推进？"></textarea>
              <div class="liuyao-action-row">
                <p id="formHint" class="liuyao-hint">择其类，静其心，自动起卦后先观象。</p>
                <div class="liuyao-button-row">
                  <button id="resetButton" class="liuyao-button secondary" type="button">重置</button>
                  <button id="castButton" class="liuyao-button" type="button">自动起卦</button>
                </div>
              </div>
              <div id="coinPanel" class="liuyao-coin-panel"></div>
            </section>

            <section id="previewPanel" class="liuyao-paper liuyao-preview">
              <div class="liuyao-section-title">
                <span>观象</span>
                <small>Pending Confirmation</small>
              </div>
              <div class="liuyao-hexagram-pair">
                <article>
                  <small>本卦</small>
                  <strong id="previewMain">未起</strong>
                </article>
                <article>
                  <small>变卦</small>
                  <strong id="previewChanged">未起</strong>
                </article>
                <article>
                  <small>动爻</small>
                  <strong id="previewMoving">未起</strong>
                </article>
              </div>
              <div class="liuyao-meta">
                <span id="previewTopic">${selectedTopicLabel()}</span>
                <span id="previewTime">待起卦</span>
              </div>
              <p id="previewQuestion" class="liuyao-question-preview">尚未填写</p>
              <div id="previewLines" class="liuyao-stack"></div>
              <div class="liuyao-action-row">
                <p class="liuyao-hint">左为本卦，右为变卦；标“动”为老阴或老阳。</p>
                <button id="confirmButton" class="liuyao-button secondary" type="button" disabled>确认卦象</button>
              </div>
            </section>

            <section class="liuyao-main-grid">
              <section class="liuyao-paper liuyao-chart">
                <div class="liuyao-section-title">
                  <span>排盘</span>
                  <small id="plateContext">待排盘</small>
                </div>
                <div class="liuyao-chart-head">
                  <span>六神</span>
                  <span>六亲</span>
                  <span>干支</span>
                  <span>本卦</span>
                  <span>动</span>
                  <span>变卦</span>
                  <span>变支</span>
                  <span>世应</span>
                </div>
                <div id="chartRows" class="liuyao-chart-rows"></div>
              </section>

              <section class="liuyao-paper liuyao-reading">
                <div class="liuyao-section-title">
                  <span>解卦</span>
                  <small id="aiStatus">等待起卦</small>
                </div>
                <div class="liuyao-reading-block">
                  <h2 id="readingTitle">天道未显</h2>
                  <p id="readingText">确认卦象后，此处展示规则解卦与 AI 润色后的文案。</p>
                </div>
                <div class="liuyao-advice-list">
                  <article>
                    <span>用神</span>
                    <p id="usefulGodText">待排盘</p>
                  </article>
                  <article>
                    <span>世应</span>
                    <p id="relationText">待排盘</p>
                  </article>
                  <article>
                    <span>动爻</span>
                    <p id="movingText">待排盘</p>
                  </article>
                  <article>
                    <span>建议</span>
                    <p id="adviceText">待排盘</p>
                  </article>
                  <article>
                    <span>依据</span>
                    <p id="ruleTrace">待排盘</p>
                  </article>
                </div>
              </section>
            </section>
          </section>
        </div>
      </section>
    </main>
  `;

  renderEmptyPreview(root);
  renderCoinPanel(root);
  bindEvents(root);
}
