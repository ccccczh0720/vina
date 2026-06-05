const typeButtons = Array.from(document.querySelectorAll(".type-chip"));
const castButton = document.getElementById("castButton");
const confirmButton = document.getElementById("confirmButton");
const questionInput = document.getElementById("questionInput");
const customTypeInput = document.getElementById("customTypeInput");
const customTypeRow = document.getElementById("customTypeRow");
const formHint = document.getElementById("formHint");
const previewPanel = document.getElementById("previewPanel");
const previewMain = document.getElementById("previewMain");
const previewChanged = document.getElementById("previewChanged");
const previewMoving = document.getElementById("previewMoving");
const previewLines = document.getElementById("previewLines");
const chartRows = document.getElementById("chartRows");
const readingTitle = document.getElementById("readingTitle");
const readingText = document.getElementById("readingText");
const usefulGodText = document.getElementById("usefulGodText");
const relationText = document.getElementById("relationText");
const movingText = document.getElementById("movingText");
const historyButton = document.getElementById("historyButton");
const closeHistoryButton = document.getElementById("closeHistoryButton");
const historyDialog = document.getElementById("historyDialog");
const steps = Array.from(document.querySelectorAll("#steps li"));

const charts = [
  {
    main: "风火家人",
    changed: "天火同人",
    moving: "五爻动",
    usefulGod: "官鬼为用",
    relation: "世居内卦，宜先定己方根基，再求外部响应。",
    movingText: "五爻发动，变化来自决策层、资源位或关键承诺。",
    reading:
      "天道示象：此事可进，但贵在守正。先安内后应外，节奏不宜躁急。资源、权责与时点清楚之后，再行核心动作。",
    lines: [
      ["玄武", "兄弟", "yang", false, "yang", "应"],
      ["白虎", "子孙", "yin", true, "yang", ""],
      ["螣蛇", "妻财", "yang", false, "yang", ""],
      ["勾陈", "父母", "yang", false, "yang", "世"],
      ["朱雀", "官鬼", "yin", false, "yin", ""],
      ["青龙", "兄弟", "yang", false, "yang", ""],
    ],
  },
  {
    main: "雷水解",
    changed: "地水师",
    moving: "上爻动",
    usefulGod: "父母为凭",
    relation: "世应之间仍有牵制，外部阻力已松，但不可急收。",
    movingText: "上爻发动，事情进入尾声变局，先清遗留，再定去留。",
    reading:
      "天道示象：困势渐解，仍须谨慎收束。眼前不是猛进之时，而是清理旧结、厘清边界、再判断后续投入。",
    lines: [
      ["玄武", "父母", "yin", true, "yin", ""],
      ["白虎", "兄弟", "yin", false, "yin", "应"],
      ["螣蛇", "官鬼", "yang", false, "yang", ""],
      ["勾陈", "子孙", "yin", false, "yin", ""],
      ["朱雀", "妻财", "yang", false, "yang", "世"],
      ["青龙", "父母", "yin", false, "yin", ""],
    ],
  },
];

let currentChart = null;

function setStep(step) {
  steps.forEach((item) => {
    item.classList.toggle("active", item.dataset.step === step);
  });
}

function activeType() {
  return document.querySelector(".type-chip.active").dataset.type;
}

function validate() {
  const type = activeType();
  const question = questionInput.value.trim();
  const custom = customTypeInput.value.trim();
  if (type === "other" && !question && !custom) {
    formHint.textContent = "选择其他时，需要输入问题类型或具体问题说明。";
    formHint.classList.add("error");
    return false;
  }
  formHint.textContent = "择其类，静其心，自动起卦后先观象。";
  formHint.classList.remove("error");
  return true;
}

function yaoMarkup(value) {
  if (value === "yang") {
    return '<span class="yao"><span class="bar solid"></span></span>';
  }
  return '<span class="yao"><span class="bar broken"></span><span class="bar broken"></span></span>';
}

function renderPreview(chart) {
  previewMain.textContent = chart.main;
  previewChanged.textContent = chart.changed;
  previewMoving.textContent = chart.moving;
  previewLines.innerHTML = chart.lines
    .map(
      ([, , main, moving, changed], index) => `
        <div class="preview-line">
          <span>${6 - index}爻</span>
          ${yaoMarkup(main)}
          <span class="moving-mark">${moving ? "动" : ""}</span>
          ${yaoMarkup(changed)}
        </div>
      `,
    )
    .join("");
  previewPanel.classList.add("ready");
  confirmButton.disabled = false;
  setStep("pendingConfirmation");
}

function renderChart(chart) {
  chartRows.innerHTML = chart.lines
    .map(
      ([spirit, relation, main, moving, changed, role]) => `
        <div class="chart-row">
          <span>${spirit}</span>
          <span>${relation}</span>
          ${yaoMarkup(main)}
          <span class="moving-mark">${moving ? "●" : ""}</span>
          ${yaoMarkup(changed)}
          <span>${role}</span>
        </div>
      `,
    )
    .join("");
  readingTitle.textContent = "天道有常";
  readingText.textContent = chart.reading;
  usefulGodText.textContent = chart.usefulGod;
  relationText.textContent = chart.relation;
  movingText.textContent = chart.movingText;
  setStep("completed");
}

function renderEmptyPreview() {
  previewLines.innerHTML = [6, 5, 4, 3, 2, 1]
    .map(
      (line) => `
        <div class="preview-line">
          <span>${line}爻</span>
          <span class="yao"><span class="bar solid"></span></span>
          <span class="moving-mark"></span>
          <span class="yao"><span class="bar solid"></span></span>
        </div>
      `,
    )
    .join("");
}

typeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    typeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const isOther = button.dataset.type === "other";
    customTypeRow.hidden = !isOther;
    validate();
  });
});

castButton.addEventListener("click", () => {
  if (!validate()) {
    return;
  }
  setStep("pendingConfirmation");
  const seed = questionInput.value.trim().length + activeType().length + customTypeInput.value.trim().length;
  currentChart = charts[seed % charts.length];
  renderPreview(currentChart);
});

confirmButton.addEventListener("click", () => {
  if (!currentChart) {
    return;
  }
  setStep("charting");
  renderChart(currentChart);
});

historyButton.addEventListener("click", () => {
  if (typeof historyDialog.showModal === "function") {
    historyDialog.showModal();
  }
});

closeHistoryButton.addEventListener("click", () => {
  historyDialog.close();
});

renderEmptyPreview();
