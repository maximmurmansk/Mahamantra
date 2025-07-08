/* глобальные переменные */
let beads = 1,
  rounds = 1,
  introVisible = true,
  speed = 6,
  base = 0,
  isLight = true;

const waviy = document.getElementById("waviy"),
  intro = document.getElementById("intro"),
  roundsVal = document.getElementById("roundsVal"),
  beadsVal = document.getElementById("beadsVal"),
  spdText = document.getElementById("spdText"),
  fontCtrl = document.getElementById("fontCtrl"),
  triggerArea = document.getElementById("triggerArea");

/* ---------- счётчик ---------- */
function updateCounter() {
  roundsVal.textContent = rounds;
  beadsVal.textContent = beads;
}

function onIter() {
  if (introVisible) return;
  if (++beads > 108) {
    beads = 1;
    ++rounds;
    showIntro();
  }
  updateCounter();
}
function hook() {
  waviy.querySelectorAll("#first").forEach((e) => e.removeAttribute("id"));
  const first = waviy.querySelector("span");
  if (!first) {
    setTimeout(hook, 100);
    return;
  }
  first.id = "first";
  first.addEventListener("animationiteration", onIter);
}

/* ---------- intro ---------- */
function showIntro() {
  clearTimeout(showIntro.t);
  introVisible = true;
  intro.classList.remove("hidden");
  waviy.classList.add("paused");
  showIntro.t = setTimeout(() => {
    intro.classList.add("hidden");
    waviy.classList.remove("paused");
    introVisible = false;
    resetWave();
    updateCounter();
  }, 10000);
}

/* ---------- скорость ---------- */
function setSpeed(reset) {
  document.documentElement.style.setProperty("--speed", speed + "s");
  document.documentElement.style.setProperty(
    "--step",
    (speed / 16).toFixed(3) + "s",
  );
  spdText.textContent = speed.toFixed(1) + " с";
  if (reset) resetWave();
}
function resetWave() {
  waviy.querySelectorAll("span").forEach((s) => {
    s.style.animation = "none";
    s.offsetHeight;
    s.style.animation = "waviy var(--speed) infinite";
    s.style.animationDelay = `calc(var(--step)*${s.dataset.i})`;
  });
  hook();
}
document.getElementById("dec").onclick = () => {
  if (speed > 2) {
    speed -= 0.5;
    setSpeed(true);
  }
};
document.getElementById("inc").onclick = () => {
  if (speed < 9) {
    speed += 0.5;
    setSpeed(true);
  }
};

/* ---------- тема ---------- */
const sun = document.getElementById("sun");
const moon = document.getElementById("moon");

document.getElementById("theme").onclick = () => {
  const link = document.getElementById("themeStylesheet");
  isLight = !isLight; // переключаем флаг
  link.href = isLight ? "style2.css" : "style.css"; // меняем файл темы

  // правильно прячем / показываем
  sun.classList.toggle("hidden", isLight); // солнце скрыто в светлой
  moon.classList.toggle("hidden", !isLight); // луна скрыта в тёмной

  resetWave(); // перезапуск анимации
};

/* ---------- шрифт ---------- */
function fit(words) {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap;font-family:'Great Vibes',cursive;font-size:16px";
  let max = 0,
    margin = innerWidth < 768 ? 2 : 4;
  for (let i = 0; i < words.length; i += 4) {
    probe.textContent = words.slice(i, i + 4).join(" ");
    document.body.appendChild(probe);
    max = Math.max(max, probe.offsetWidth + margin * 2);
    document.body.removeChild(probe);
  }
  const avail = innerWidth * 0.9,
    scale = avail / max;
  base = Math.max(Math.min(Math.floor(16 * scale * 0.95), 80), 24);
  document.documentElement.style.setProperty("--font-size", base + "px");
}
document.getElementById("fInc").onclick = () => {
  base += 30;
  document.documentElement.style.setProperty("--font-size", base + "px");
  showCtrl();
};
document.getElementById("fDec").onclick = () => {
  if (base > 24) {
    base -= 30;
    document.documentElement.style.setProperty("--font-size", base + "px");
    showCtrl();
  }
};

/* автоскрытие панели масштаба */
let hideT,
  last = 0;
function showCtrl() {
  if (innerWidth < 1024) return;
  const now = performance.now();
  if (now - last < 100) return;
  clearTimeout(hideT);
  fontCtrl.classList.add("active");
  last = now;
  hideT = setTimeout(() => fontCtrl.classList.remove("active"), 4000);
}
triggerArea.onmousemove = showCtrl;
fontCtrl.onmouseenter = () => {
  clearTimeout(hideT);
  fontCtrl.classList.add("active");
};
fontCtrl.onmouseleave = () => {
  hideT = setTimeout(() => fontCtrl.classList.remove("active"), 4000);
};
if (innerWidth >= 1024) {
  fontCtrl.classList.add("active");
  setTimeout(() => fontCtrl.classList.remove("active"), 3000);
}

/* ---------- текст мантры ---------- */
let tr = null;
async function load() {
  try {
    const r = await fetch("translations.json");
    tr = r.ok ? await r.json() : {};
  } catch {
    tr = {
      ru: "Харе Кришна Харе Кришна Кришна Кришна Харе Харе Харе Рама Харе Рама Рама Рама Харе Харе",
    };
  }
  render("ru");
}
function render(lang = "ru") {
  if (!tr) {
    setTimeout(() => render(lang), 100);
    return;
  }
  const words = (tr[lang] || tr.ru).trim().split(/\s+/);
  waviy.innerHTML = words
    .map(
      (w, i) =>
        `<span style="--i:${(i % 16) + 1}" data-i="${(i % 16) + 1}">${w}</span>${(i + 1) % 4 === 0 && i !== words.length - 1 ? "<br>" : ""}`,
    )
    .join("");
  fit(words);
  hook();
}
document.getElementById("langSel").onchange = (e) => render(e.target.value);
window.onresize = () => fit(waviy.textContent.trim().split(/\s+/));

/* ---------- старт ---------- */
load();
setSpeed(false);
showIntro();

/* страж анимации */
setInterval(() => {
  const f = waviy.querySelector("#first");
  if (
    !f ||
    (getComputedStyle(f).animationPlayState === "paused" && !introVisible)
  )
    resetWave();
}, 5000);
