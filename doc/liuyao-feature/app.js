const typeButtons = Array.from(document.querySelectorAll(".type-card"));
const castButton = document.getElementById("castButton");
const questionInput = document.getElementById("questionInput");
const lineChart = document.getElementById("lineChart");
const mainHexagram = document.getElementById("mainHexagram");
const changedHexagram = document.getElementById("changedHexagram");
const movingLines = document.getElementById("movingLines");
const readingOverview = document.getElementById("readingOverview");

const sampleCharts = [
  {
    main: "风火家人",
    changed: "天火同人",
    moving: "五爻动",
    reading: "当前问题适合先稳定内部条件，再向外争取合作。五爻发动，关键在主导权和节奏控制。",
    lines: [
      ["玄武", "兄弟", "━━━", "", "━━━", "应"],
      ["白虎", "子孙", "━ ━", "○", "━━━", ""],
      ["螣蛇", "妻财", "━━━", "", "━━━", ""],
      ["勾陈", "父母", "━━━", "", "━━━", "世"],
      ["朱雀", "官鬼", "━ ━", "", "━ ━", ""],
      ["青龙", "兄弟", "━━━", "", "━━━", ""],
    ],
  },
  {
    main: "雷水解",
    changed: "地水师",
    moving: "上爻动",
    reading: "当前阻力有松动迹象，但不宜急于收口。应先处理遗留问题，再判断后续投入。",
    lines: [
      ["玄武", "父母", "━ ━", "×", "━ ━", ""],
      ["白虎", "兄弟", "━ ━", "", "━ ━", "应"],
      ["螣蛇", "官鬼", "━━━", "", "━━━", ""],
      ["勾陈", "子孙", "━ ━", "", "━ ━", ""],
      ["朱雀", "妻财", "━━━", "", "━━━", "世"],
      ["青龙", "父母", "━ ━", "", "━ ━", ""],
    ],
  },
];

function renderYao(value) {
  if (value === "━━━") {
    return '<span class="yao"><span class="bar solid"></span></span>';
  }
  return '<span class="yao"><span class="bar broken"></span><span class="bar broken"></span></span>';
}

function renderChart(chart) {
  lineChart.innerHTML = chart.lines
    .map(
      ([spirit, relation, main, moving, changed, role]) => `
        <div class="line-row">
          <span>${spirit}</span>
          <span>${relation}</span>
          ${renderYao(main)}
          <span class="moving">${moving}</span>
          ${renderYao(changed)}
          <span>${role}</span>
        </div>
      `,
    )
    .join("");

  mainHexagram.textContent = chart.main;
  changedHexagram.textContent = chart.changed;
  movingLines.textContent = chart.moving;
  readingOverview.textContent = chart.reading;
}

typeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    typeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

castButton.addEventListener("click", () => {
  const seed = questionInput.value.trim().length + document.querySelector(".type-card.active").dataset.type.length;
  renderChart(sampleCharts[seed % sampleCharts.length]);
});

renderChart(sampleCharts[0]);
