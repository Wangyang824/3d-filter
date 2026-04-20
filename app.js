function parseDigitSet(raw) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  for (const v of values) {
    if (!/^\d$/.test(v)) {
      throw new Error(`数字输入无效：${v}（请使用 0-9）`);
    }
  }
  return new Set(values.map(Number));
}

function parseSmallCountSet(raw, label) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const parsed = values.map((v) => {
    if (!/^[0-3]$/.test(v)) {
      throw new Error(`${label}输入无效：${v}（只能填 0-3）`);
    }
    return Number(v);
  });
  return new Set(parsed);
}

function parseNumberSet(raw) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const parsed = values.map((v) => {
    if (!/^\d+$/.test(v)) {
      throw new Error(`和值输入无效：${v}`);
    }
    return Number(v);
  });
  return new Set(parsed);
}

function parseBound(raw, label, min, max) {
  const v = raw.trim();
  if (!v) return null;
  if (!/^\d+$/.test(v)) {
    throw new Error(`${label}输入无效：${v}`);
  }
  const num = Number(v);
  if (num < min || num > max) {
    throw new Error(`${label}必须在 ${min}-${max} 之间`);
  }
  return num;
}

function parseIssue(raw) {
  const issue = raw.trim();
  if (!issue) {
    throw new Error("期号不能为空");
  }
  if (!/^\d{5,}$/.test(issue)) {
    throw new Error("期号格式不正确（建议至少 5 位数字）");
  }
  return issue;
}

function parseThreeDigitNumber(raw) {
  const value = raw.trim();
  if (!/^\d{3}$/.test(value)) {
    throw new Error("开奖号必须是 3 位数字（如 386）");
  }
  return value;
}

function classify(digits) {
  const unique = new Set(digits).size;
  return {
    isTriplet: unique === 1,
    isPair: unique === 2
  };
}

function hasConsecutiveDigits(digits) {
  const uniq = [...new Set(digits)].sort((a, b) => a - b);
  for (let i = 0; i < uniq.length - 1; i += 1) {
    if (uniq[i + 1] - uniq[i] === 1) return true;
  }
  return false;
}

function formatNum(n) {
  return n.toString().padStart(3, "0");
}

function parseCandidates(raw) {
  if (!raw.trim()) return [];
  const tokens = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const unique = new Set();
  const result = [];
  tokens.forEach((token) => {
    if (!/^\d{3}$/.test(token)) {
      throw new Error(`当前结果中存在无效号码：${token}（应为 3 位数字）`);
    }
    if (unique.has(token)) return;
    unique.add(token);
    result.push(token);
  });
  return result;
}

function toGroupKey(text) {
  return text.split("").sort().join("");
}

function applyPlayMode(list, playMode) {
  if (playMode !== "group") return list;
  const unique = new Set();
  const grouped = [];
  list.forEach((text) => {
    const key = toGroupKey(text);
    if (unique.has(key)) return;
    unique.add(key);
    grouped.push(key);
  });
  return grouped;
}

function shouldKeepNumber(text, config) {
  const digits = text.split("").map(Number); // [百, 十, 个]
  const sum = digits[0] + digits[1] + digits[2];
  const sumTail = sum % 10;
  const span = Math.max(...digits) - Math.min(...digits);
  const oddCount = digits.filter((d) => d % 2 === 1).length;
  const bigCount = digits.filter((d) => d >= 5).length;
  const hasConsecutive = hasConsecutiveDigits(digits);
  const routes = new Set(digits.map((d) => d % 3));
  const { isPair, isTriplet } = classify(digits);
  const isAllDiff = !isPair && !isTriplet;

  if (digits.some((d) => config.excludeDigits.has(d))) return false;
  if (digits.some((d) => config.killDigits.has(d))) return false;
  if (config.excludeSums.has(sum)) return false;
  if (config.includeSumTails.size > 0 && !config.includeSumTails.has(sumTail)) return false;
  if (config.excludeSumTails.has(sumTail)) return false;
  if (config.sumMin !== null && sum < config.sumMin) return false;
  if (config.sumMax !== null && sum > config.sumMax) return false;
  if (config.spanMin !== null && span < config.spanMin) return false;
  if (config.spanMax !== null && span > config.spanMax) return false;
  if (config.excludePair && isPair) return false;
  if (config.excludeTriplet && isTriplet) return false;

  if (config.patternType === "triplet" && !isTriplet) return false;
  if (config.patternType === "pair" && !isPair) return false;
  if (config.patternType === "allDiff" && !isAllDiff) return false;
  if (config.consecutiveType === "has" && !hasConsecutive) return false;
  if (config.consecutiveType === "no" && hasConsecutive) return false;

  if (config.includeDigits.size > 0) {
    const hasIncluded = digits.some((d) => config.includeDigits.has(d));
    if (!hasIncluded) return false;
  }

  if (config.danmaDigits.size > 0) {
    const hitDanma = digits.some((d) => config.danmaDigits.has(d));
    if (!hitDanma) return false;
  }

  if (config.oddCounts.size > 0 && !config.oddCounts.has(oddCount)) return false;
  if (config.bigCounts.size > 0 && !config.bigCounts.has(bigCount)) return false;

  if (config.routes012.size > 0) {
    const hitRoute = [...routes].some((r) => config.routes012.has(r));
    if (!hitRoute) return false;
  }

  if (config.posBInclude.size > 0 && !config.posBInclude.has(digits[0])) return false;
  if (config.posSInclude.size > 0 && !config.posSInclude.has(digits[1])) return false;
  if (config.posGInclude.size > 0 && !config.posGInclude.has(digits[2])) return false;

  if (config.posBExclude.has(digits[0])) return false;
  if (config.posSExclude.has(digits[1])) return false;
  if (config.posGExclude.has(digits[2])) return false;

  return true;
}

function filterNumbers(candidates, config) {
  const filtered = candidates.filter((text) => shouldKeepNumber(text, config));
  return applyPlayMode(filtered, config.playMode);
}

function allNumbers() {
  const numbers = [];
  for (let n = 0; n <= 999; n += 1) {
    numbers.push(formatNum(n));
  }
  return numbers;
}

function buildConfigFromRaw(raw) {
  const config = {
    excludeDigits: new Set(raw.excludeDigits),
    includeDigits: parseDigitSet(raw.includeDigits),
    excludeSums: parseNumberSet(raw.excludeSums),
    includeSumTails: parseDigitSet(raw.includeSumTails),
    excludeSumTails: parseDigitSet(raw.excludeSumTails),
    sumMin: parseBound(raw.sumMin, "和值最小值", 0, 27),
    sumMax: parseBound(raw.sumMax, "和值最大值", 0, 27),
    spanMin: parseBound(raw.spanMin, "跨度最小值", 0, 9),
    spanMax: parseBound(raw.spanMax, "跨度最大值", 0, 9),
    patternType: raw.patternType,
    playMode: raw.playMode,
    consecutiveType: raw.consecutiveType,
    excludePair: raw.excludePair,
    excludeTriplet: raw.excludeTriplet,
    danmaDigits: parseDigitSet(raw.danmaDigits),
    killDigits: parseDigitSet(raw.killDigits),
    oddCounts: parseSmallCountSet(raw.oddCounts, "奇数个数"),
    bigCounts: parseSmallCountSet(raw.bigCounts, "大数个数"),
    routes012: parseDigitSet(raw.routes012),
    posBInclude: parseDigitSet(raw.posBInclude),
    posSInclude: parseDigitSet(raw.posSInclude),
    posGInclude: parseDigitSet(raw.posGInclude),
    posBExclude: parseDigitSet(raw.posBExclude),
    posSExclude: parseDigitSet(raw.posSExclude),
    posGExclude: parseDigitSet(raw.posGExclude)
  };

  if (config.sumMin !== null && config.sumMax !== null && config.sumMin > config.sumMax) {
    throw new Error("和值最小值不能大于最大值");
  }
  if (config.spanMin !== null && config.spanMax !== null && config.spanMin > config.spanMax) {
    throw new Error("跨度最小值不能大于最大值");
  }
  if ([...config.routes012].some((v) => v < 0 || v > 2)) {
    throw new Error("012 路只能填写 0,1,2");
  }
  if (!["direct", "group"].includes(config.playMode)) {
    throw new Error("玩法筛选参数无效");
  }

  return config;
}

function captureRawFilters() {
  return {
    excludeDigits: [...excludedDigitsByButtons].sort((a, b) => a - b),
    includeDigits: els.includeDigits.value,
    excludeSums: els.excludeSums.value,
    includeSumTails: els.includeSumTails.value,
    excludeSumTails: els.excludeSumTails.value,
    sumMin: els.sumMin.value,
    sumMax: els.sumMax.value,
    spanMin: els.spanMin.value,
    spanMax: els.spanMax.value,
    patternType: els.patternType.value,
    playMode: els.playMode.value,
    consecutiveType: els.consecutiveType.value,
    excludePair: els.excludePair.checked,
    excludeTriplet: els.excludeTriplet.checked,
    danmaDigits: els.danmaDigits.value,
    killDigits: els.killDigits.value,
    oddCounts: els.oddCounts.value,
    bigCounts: els.bigCounts.value,
    routes012: els.routes012.value,
    posBInclude: els.posBInclude.value,
    posSInclude: els.posSInclude.value,
    posGInclude: els.posGInclude.value,
    posBExclude: els.posBExclude.value,
    posSExclude: els.posSExclude.value,
    posGExclude: els.posGExclude.value
  };
}

function buildConfig() {
  return buildConfigFromRaw(captureRawFilters());
}

function neutralRawFilters() {
  return {
    excludeDigits: [],
    includeDigits: "",
    excludeSums: "",
    includeSumTails: "",
    excludeSumTails: "",
    sumMin: "",
    sumMax: "",
    spanMin: "",
    spanMax: "",
    patternType: "all",
    playMode: "direct",
    consecutiveType: "all",
    excludePair: false,
    excludeTriplet: false,
    danmaDigits: "",
    killDigits: "",
    oddCounts: "",
    bigCounts: "",
    routes012: "",
    posBInclude: "",
    posSInclude: "",
    posGInclude: "",
    posBExclude: "",
    posSExclude: "",
    posGExclude: ""
  };
}

function sameNumberArray(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function buildIncrementRawFilters(baseRaw, currentRaw) {
  const increment = neutralRawFilters();

  if (!sameNumberArray(baseRaw.excludeDigits, currentRaw.excludeDigits)) {
    increment.excludeDigits = currentRaw.excludeDigits;
  }

  const fieldNames = [
    "includeDigits",
    "excludeSums",
    "includeSumTails",
    "excludeSumTails",
    "sumMin",
    "sumMax",
    "spanMin",
    "spanMax",
    "patternType",
    "playMode",
    "consecutiveType",
    "excludePair",
    "excludeTriplet",
    "danmaDigits",
    "killDigits",
    "oddCounts",
    "bigCounts",
    "routes012",
    "posBInclude",
    "posSInclude",
    "posGInclude",
    "posBExclude",
    "posSExclude",
    "posGExclude"
  ];

  fieldNames.forEach((key) => {
    if (baseRaw[key] !== currentRaw[key]) {
      increment[key] = currentRaw[key];
    }
  });

  return increment;
}

function hasIncrementCondition(incrementRaw) {
  if (incrementRaw.excludeDigits.length > 0) return true;
  return Object.entries(incrementRaw).some(([key, value]) => {
    if (key === "excludeDigits") return false;
    if (typeof value === "boolean") return value;
    return value !== "";
  });
}

const els = {
  excludeDigitsButtons: document.getElementById("excludeDigitsButtons"),
  includeDigits: document.getElementById("includeDigits"),
  excludeSums: document.getElementById("excludeSums"),
  includeSumTails: document.getElementById("includeSumTails"),
  excludeSumTails: document.getElementById("excludeSumTails"),
  sumMin: document.getElementById("sumMin"),
  sumMax: document.getElementById("sumMax"),
  spanMin: document.getElementById("spanMin"),
  spanMax: document.getElementById("spanMax"),
  patternType: document.getElementById("patternType"),
  playMode: document.getElementById("playMode"),
  consecutiveType: document.getElementById("consecutiveType"),
  excludePair: document.getElementById("excludePair"),
  excludeTriplet: document.getElementById("excludeTriplet"),
  danmaDigits: document.getElementById("danmaDigits"),
  killDigits: document.getElementById("killDigits"),
  oddCounts: document.getElementById("oddCounts"),
  bigCounts: document.getElementById("bigCounts"),
  routes012: document.getElementById("routes012"),
  posBInclude: document.getElementById("posBInclude"),
  posSInclude: document.getElementById("posSInclude"),
  posGInclude: document.getElementById("posGInclude"),
  posBExclude: document.getElementById("posBExclude"),
  posSExclude: document.getElementById("posSExclude"),
  posGExclude: document.getElementById("posGExclude"),
  historyIssue: document.getElementById("historyIssue"),
  historyNumber: document.getElementById("historyNumber"),
  addHistoryBtn: document.getElementById("addHistoryBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyCount: document.getElementById("historyCount"),
  historyList: document.getElementById("historyList"),
  appLayout: document.getElementById("appLayout"),
  mobileViewSwitch: document.getElementById("mobileViewSwitch"),
  showResultViewBtn: document.getElementById("showResultViewBtn"),
  showFilterViewBtn: document.getElementById("showFilterViewBtn"),
  runBtn: document.getElementById("runBtn"),
  rerunBtn: document.getElementById("rerunBtn"),
  clearResultBtn: document.getElementById("clearResultBtn"),
  resetBtn: document.getElementById("resetBtn"),
  count: document.getElementById("count"),
  result: document.getElementById("result")
};

const HISTORY_STORAGE_KEY = "lottery3d_history_v1";
let historyRecords = [];
const excludedDigitsByButtons = new Set();
let lastRunRawFilters = null;

function isMobileViewport() {
  return window.matchMedia("(max-width: 1080px)").matches;
}

function switchMobileView(view) {
  if (!els.appLayout || !els.mobileViewSwitch) return;
  const isResult = view === "result";
  els.appLayout.classList.toggle("mobile-show-result", isResult);
  els.appLayout.classList.toggle("mobile-show-filter", !isResult);
  if (els.showResultViewBtn) {
    els.showResultViewBtn.classList.toggle("active", isResult);
  }
  if (els.showFilterViewBtn) {
    els.showFilterViewBtn.classList.toggle("active", !isResult);
  }
}

function getValuesFromInput(input) {
  return input.value
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function setValuesToInput(input, selectedValues) {
  input.value = selectedValues.join(",");
}

function syncPickerFromInput(picker) {
  const inputId = picker.dataset.bindInput;
  const input = document.getElementById(inputId);
  if (!input) return;
  const selectedSet = new Set(getValuesFromInput(input.value));
  picker.querySelectorAll(".quick-picker-option").forEach((btn) => {
    const value = btn.dataset.value || "";
    btn.classList.toggle("active", selectedSet.has(value));
  });
}

function syncInputFromPicker(picker) {
  const inputId = picker.dataset.bindInput;
  const input = document.getElementById(inputId);
  if (!input) return;
  const selected = [...picker.querySelectorAll(".quick-picker-option.active")]
    .map((btn) => btn.dataset.value || "")
    .filter(Boolean);
  setValuesToInput(input, selected);
}

function setupQuickPickers() {
  const pickers = document.querySelectorAll(".quick-picker");
  pickers.forEach((picker) => {
    const options = (picker.dataset.options || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const toolBar = document.createElement("div");
    toolBar.className = "quick-picker-tools";
    const actions = [
      { key: "all", text: "全选" },
      { key: "clear", text: "清空" },
      { key: "invert", text: "反选" }
    ];
    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-picker-tool-btn";
      btn.dataset.action = action.key;
      btn.textContent = action.text;
      toolBar.appendChild(btn);
    });

    const grid = document.createElement("div");
    grid.className = `quick-picker-grid ${options.length <= 4 ? "small" : ""}`.trim();
    options.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-picker-option";
      btn.dataset.value = value;
      btn.textContent = value;
      grid.appendChild(btn);
    });

    picker.appendChild(toolBar);
    picker.appendChild(grid);

    picker.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;

      const action = target.dataset.action;
      if (action) {
        const optionButtons = [...picker.querySelectorAll(".quick-picker-option")];
        if (action === "all") optionButtons.forEach((btn) => btn.classList.add("active"));
        if (action === "clear") optionButtons.forEach((btn) => btn.classList.remove("active"));
        if (action === "invert") {
          optionButtons.forEach((btn) => btn.classList.toggle("active"));
        }
        syncInputFromPicker(picker);
        return;
      }

      if (target.classList.contains("quick-picker-option")) {
        target.classList.toggle("active");
        syncInputFromPicker(picker);
      }
    });

    const inputId = picker.dataset.bindInput;
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", () => syncPickerFromInput(picker));
      syncPickerFromInput(picker);
    }
  });
}

function refreshAllQuickPickers() {
  document.querySelectorAll(".quick-picker").forEach((picker) => syncPickerFromInput(picker));
}

function renderExcludeDigitButtons() {
  const buttons = els.excludeDigitsButtons.querySelectorAll(".digit-btn");
  buttons.forEach((btn) => {
    const digit = Number(btn.dataset.digit);
    btn.classList.toggle("active", excludedDigitsByButtons.has(digit));
  });
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.issue && item.number);
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRecords));
}

function renderHistory() {
  els.historyCount.textContent = String(historyRecords.length);
  if (historyRecords.length === 0) {
    els.historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
    return;
  }

  const html = historyRecords
    .map(
      (item, idx) => `
      <div class="history-item">
        <span>第 ${item.issue} 期：<strong>${item.number}</strong></span>
        <button class="mini-btn" data-remove-idx="${idx}">删除</button>
      </div>
    `
    )
    .join("");

  els.historyList.innerHTML = html;
}

function addHistoryRecord() {
  try {
    const issue = parseIssue(els.historyIssue.value);
    const number = parseThreeDigitNumber(els.historyNumber.value);
    const exists = historyRecords.some((item) => item.issue === issue);
    if (exists) {
      throw new Error(`第 ${issue} 期已存在`);
    }

    historyRecords.unshift({
      issue,
      number,
      createdAt: Date.now()
    });
    saveHistory();
    renderHistory();
    els.historyIssue.value = "";
    els.historyNumber.value = "";
  } catch (err) {
    alert(err.message || "新增历史记录失败");
  }
}

function removeHistoryRecord(idx) {
  if (idx < 0 || idx >= historyRecords.length) return;
  historyRecords.splice(idx, 1);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  if (!historyRecords.length) return;
  const ok = confirm("确定清空全部历史记录吗？");
  if (!ok) return;
  historyRecords = [];
  saveHistory();
  renderHistory();
}

function run() {
  try {
    const config = buildConfig();
    const list = filterNumbers(allNumbers(), config);
    els.count.textContent = String(list.length);
    els.result.value = list.join(", ");
    lastRunRawFilters = captureRawFilters();
    if (isMobileViewport()) switchMobileView("result");
  } catch (err) {
    alert(err.message || "输入格式有误，请检查后重试。");
  }
}

function rerunOnCurrentResult() {
  try {
    const source = parseCandidates(els.result.value);
    if (source.length === 0) {
      throw new Error("当前结果为空，请先点击“开始筛选”生成结果");
    }
    if (!lastRunRawFilters) {
      throw new Error("请先点击“开始筛选”，再进行二次筛选");
    }

    const currentRaw = captureRawFilters();
    const incrementRaw = buildIncrementRawFilters(lastRunRawFilters, currentRaw);
    if (!hasIncrementCondition(incrementRaw)) {
      throw new Error("你还没有新增筛选条件，请先加条件再点二次筛选");
    }
    const config = buildConfigFromRaw(incrementRaw);
    const list = filterNumbers(source, config);
    els.count.textContent = String(list.length);
    els.result.value = list.join(", ");
    lastRunRawFilters = currentRaw;
    if (isMobileViewport()) switchMobileView("result");
  } catch (err) {
    alert(err.message || "二次筛选失败，请检查输入。");
  }
}

function reset() {
  excludedDigitsByButtons.clear();
  renderExcludeDigitButtons();
  els.includeDigits.value = "";
  els.excludeSums.value = "";
  els.includeSumTails.value = "";
  els.excludeSumTails.value = "";
  els.sumMin.value = "";
  els.sumMax.value = "";
  els.spanMin.value = "";
  els.spanMax.value = "";
  els.patternType.value = "all";
  els.playMode.value = "direct";
  els.consecutiveType.value = "all";
  els.excludePair.checked = false;
  els.excludeTriplet.checked = false;
  els.danmaDigits.value = "";
  els.killDigits.value = "";
  els.oddCounts.value = "";
  els.bigCounts.value = "";
  els.routes012.value = "";
  els.posBInclude.value = "";
  els.posSInclude.value = "";
  els.posGInclude.value = "";
  els.posBExclude.value = "";
  els.posSExclude.value = "";
  els.posGExclude.value = "";
  refreshAllQuickPickers();
  els.count.textContent = "0";
  els.result.value = "";
  lastRunRawFilters = null;
  alert("已重置所有筛选条件和结果");
}

function clearResultOnly() {
  els.count.textContent = "0";
  els.result.value = "";
  lastRunRawFilters = null;
  alert("已清空结果，可在当前条件下重新筛选");
}

if (els.runBtn) els.runBtn.addEventListener("click", run);
if (els.rerunBtn) els.rerunBtn.addEventListener("click", rerunOnCurrentResult);
if (els.clearResultBtn) els.clearResultBtn.addEventListener("click", clearResultOnly);
if (els.resetBtn) els.resetBtn.addEventListener("click", reset);
if (els.showResultViewBtn) {
  els.showResultViewBtn.addEventListener("click", () => switchMobileView("result"));
}
if (els.showFilterViewBtn) {
  els.showFilterViewBtn.addEventListener("click", () => switchMobileView("filter"));
}
if (els.addHistoryBtn) els.addHistoryBtn.addEventListener("click", addHistoryRecord);
if (els.clearHistoryBtn) els.clearHistoryBtn.addEventListener("click", clearHistory);
if (els.excludeDigitsButtons) {
  els.excludeDigitsButtons.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const digitText = target.dataset.digit;
    if (digitText === undefined) return;
    const digit = Number(digitText);
    if (excludedDigitsByButtons.has(digit)) {
      excludedDigitsByButtons.delete(digit);
    } else {
      excludedDigitsByButtons.add(digit);
    }
    renderExcludeDigitButtons();
  });
}
if (els.historyList) {
  els.historyList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const idxText = target.dataset.removeIdx;
    if (idxText === undefined) return;
    removeHistoryRecord(Number(idxText));
  });
}

historyRecords = loadHistory().sort((a, b) => Number(b.issue) - Number(a.issue));
setupQuickPickers();
refreshAllQuickPickers();
renderExcludeDigitButtons();
renderHistory();
if (isMobileViewport()) {
  switchMobileView("filter");
}
