const STORAGE_KEY = "sbti-local-state-v1";

const dimensions = [
  ["S1", "自尊自信"],
  ["S2", "自我清晰度"],
  ["S3", "核心价值"],
  ["E1", "依恋安全感"],
  ["E2", "情感投入度"],
  ["E3", "边界与依赖"],
  ["A1", "世界观倾向"],
  ["A2", "规则与灵活度"],
  ["A3", "人生意义感"],
  ["Ac1", "动机导向"],
  ["Ac2", "决策风格"],
  ["Ac3", "执行模式"],
  ["So1", "社交主动性"],
  ["So2", "人际边界感"],
  ["So3", "表达与真实度"]
];

const questions = QUESTIONS;
const specialQuestions = SPECIAL_QUESTIONS;
const DRUNK_TRIGGER_QUESTION_ID = "drink_gate_q2";

const resultTypes = NORMAL_TYPES.map(({ code, pattern }) => ({
  ...TYPE_LIBRARY[code],
  image: TYPE_IMAGES[code],
  pattern: parsePattern(pattern)
}));

const drunkType = {
  ...TYPE_LIBRARY.DRUNK,
  image: TYPE_IMAGES.DRUNK,
  pattern: []
};

const fallbackType = {
  ...TYPE_LIBRARY.HHHH,
  image: TYPE_IMAGES.HHHH,
  pattern: []
};

const explanations = {
  L: "偏低：这个维度比较省电，通常不会主动抢方向盘。",
  M: "中等：会看对象、场景和当天精神状态灵活切换。",
  H: "偏高：这个维度存在感强，经常参与重大决策。"
};

const state = {
  order: [],
  gateIndex: 0,
  answers: {},
  result: null
};

const els = {
  intro: document.querySelector("#introScreen"),
  test: document.querySelector("#testScreen"),
  result: document.querySelector("#resultScreen"),
  form: document.querySelector("#quizForm"),
  progressFill: document.querySelector("#progressFill"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector(".progress-bar"),
  hint: document.querySelector("#hintText"),
  submit: document.querySelector("#submitBtn"),
  resume: document.querySelector("#resumeBtn")
};

function parsePattern(pattern) {
  return pattern.replace(/-/g, "").split("");
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function visibleQuestions() {
  const base = state.order.map(id => questions.find(item => item.id === id));
  const insertAt = Math.min(state.gateIndex, base.length);
  const visible = [
    ...base.slice(0, insertAt),
    specialQuestions[0],
    ...base.slice(insertAt)
  ];
  const gateIndex = visible.findIndex(item => item.id === specialQuestions[0].id);
  if (gateIndex !== -1 && state.answers[specialQuestions[0].id] === 3) {
    visible.splice(gateIndex + 1, 0, specialQuestions[1]);
  }
  return visible;
}

function show(screen) {
  [els.intro, els.test, els.result].forEach(el => el.classList.remove("is-active"));
  screen.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function start(fresh = true) {
  if (fresh || !state.order.length) {
    state.order = shuffle(questions).map(item => item.id);
    state.gateIndex = Math.floor(Math.random() * state.order.length) + 1;
    state.answers = {};
    state.result = null;
  }
  renderQuestions();
  updateProgress();
  saveState();
  show(els.test);
}

function renderQuestions() {
  els.form.innerHTML = visibleQuestions().map((item, index) => {
    const options = item.options.map((option, optionIndex) => {
      const checked = state.answers[item.id] === option.value ? "checked" : "";
      const code = ["A", "B", "C", "D"][optionIndex];
      return `
        <label class="option">
          <input type="radio" name="${item.id}" value="${option.value}" ${checked}>
          <span>${code}. ${option.label}</span>
        </label>
      `;
    }).join("");
    return `
      <fieldset class="question">
        <legend>
          <span class="question-meta"><span>第 ${index + 1} 题</span><span>${item.special ? "补充题" : "维度已隐藏"}</span></span>
          <span>${item.text}</span>
        </legend>
        <div class="options">${options}</div>
      </fieldset>
    `;
  }).join("");
}

function updateProgress() {
  const countable = visibleQuestions();
  const done = countable.filter(item => state.answers[item.id] !== undefined).length;
  const total = countable.length;
  const percent = Math.round((done / total) * 100);
  els.progressFill.style.width = `${percent}%`;
  els.progressText.textContent = `${done} / ${total}`;
  els.progressBar.setAttribute("aria-valuenow", String(done));
  els.progressBar.setAttribute("aria-valuemax", String(total));
  els.submit.disabled = done !== total;
  els.hint.textContent = done === total ? "题做完了。现在可以提交电子魂魄。" : "全选完才会放行。";
}

function levelFromScore(score) {
  if (score <= 3) return "L";
  if (score === 4) return "M";
  return "H";
}

function computeResult() {
  if (state.answers[DRUNK_TRIGGER_QUESTION_ID] === 2) {
    return {
      type: drunkType,
      levels: Object.fromEntries(dimensions.map(([key]) => [key, "M"])),
      scores: Object.fromEntries(dimensions.map(([key]) => [key, 4])),
      similarity: 100,
      exact: 15,
      special: true,
      mode: "hidden"
    };
  }

  const scores = Object.fromEntries(dimensions.map(([key]) => [key, 0]));
  questions.forEach(item => {
    scores[item.dim] += Number(state.answers[item.id] || 0);
  });
  const levels = Object.fromEntries(dimensions.map(([key]) => [key, levelFromScore(scores[key])]));
  const userVector = dimensions.map(([key]) => levels[key]);

  const ranked = resultTypes.map(item => {
    let distance = 0;
    let exact = 0;
    item.pattern.forEach((level, index) => {
      const diff = Math.abs(levelValue(userVector[index]) - levelValue(level));
      distance += diff;
      if (diff === 0) exact += 1;
    });
    return {
      type: item,
      distance,
      exact,
      similarity: Math.max(0, Math.round((1 - distance / 30) * 100))
    };
  }).sort((a, b) => a.distance - b.distance || b.exact - a.exact);

  if (ranked[0].similarity < 60) {
    return {
      type: fallbackType,
      distance: ranked[0].distance,
      exact: ranked[0].exact,
      similarity: ranked[0].similarity,
      levels,
      scores,
      special: true,
      mode: "fallback"
    };
  }

  return { ...ranked[0], levels, scores, special: false };
}

function levelValue(level) {
  return { L: 1, M: 2, H: 3 }[level];
}

function renderResult() {
  const result = computeResult();
  state.result = result;
  saveState();

  document.querySelector("#resultKicker").textContent = result.mode === "hidden"
    ? "隐藏人格已激活"
    : result.mode === "fallback"
      ? "系统强制兜底"
      : "你的主类型";
  document.querySelector("#resultTitle").textContent = `${result.type.code}（${result.type.cn}）`;
  document.querySelector("#matchBadge").textContent = `匹配度 ${result.similarity}% · 命中 ${result.exact}/15 维`;
  document.querySelector("#resultDesc").textContent = result.type.desc;
  document.querySelector("#posterCaption").textContent = result.type.intro || "怎么样，被系统拿捏了吧？";
  const image = document.querySelector("#resultImage");
  image.src = result.type.image;
  image.alt = `${result.type.code}（${result.type.cn}）人格图`;

  document.querySelector("#scoreGrid").innerHTML = dimensions.map(([key, name]) => {
    const level = result.levels[key];
    return `
      <article class="score-item">
        <strong><span>${key} ${name}</span><span>${level} / ${result.scores[key]}分</span></strong>
        <p>${explanations[level]}</p>
      </article>
    `;
  }).join("");

  show(els.result);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    order: state.order,
    gateIndex: state.gateIndex,
    answers: state.answers
  }));
  els.resume.hidden = !state.order.length;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.order)) return;
    state.order = saved.order;
    state.gateIndex = Number.isInteger(saved.gateIndex) ? saved.gateIndex : 0;
    state.answers = saved.answers || {};
    els.resume.hidden = false;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function copyResult() {
  if (!state.result) return;
  const text = `我的 SBTI 是 ${state.result.type.code}（${state.result.type.cn}），匹配度 ${state.result.similarity}%。${state.result.type.desc}`;
  navigator.clipboard.writeText(text).then(() => {
    document.querySelector("#copyBtn").textContent = "已复制";
    setTimeout(() => {
      document.querySelector("#copyBtn").textContent = "复制结果";
    }, 1200);
  });
}

els.form.addEventListener("change", event => {
  if (!event.target.matches("input[type='radio']")) return;
  state.answers[event.target.name] = Number(event.target.value);
  if (event.target.name === specialQuestions[0].id) {
    if (state.answers[specialQuestions[0].id] !== 3) {
      delete state.answers[specialQuestions[1].id];
    }
    renderQuestions();
  }
  updateProgress();
  saveState();
});

document.querySelector("#startBtn").addEventListener("click", () => start(true));
document.querySelector("#resumeBtn").addEventListener("click", () => start(false));
document.querySelector("#homeBtn").addEventListener("click", () => show(els.intro));
document.querySelector("#submitBtn").addEventListener("click", renderResult);
document.querySelector("#restartBtn").addEventListener("click", () => start(true));
document.querySelector("#copyBtn").addEventListener("click", copyResult);

loadState();
