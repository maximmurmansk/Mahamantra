/* ---------- глобальные переменные ---------- */
let beads = 1,
  rounds = 1,
  introVisible = true,
  speed = 4.5,
  isLight = true,
  introDuration = 9.8;

const INTRO_MS = 10000;

/* ---------- DOM ---------- */
const waviy = document.getElementById("waviy");
const intro = document.getElementById("intro");
const roundsVal = document.getElementById("roundsVal");
const beadsVal = document.getElementById("beadsVal");
const spdText = document.getElementById("spdText");
const fontCtrl = document.getElementById("fontCtrl");
const triggerArea = document.getElementById("triggerArea");

/* ---------- счётчик ---------- */
function updateCounter() {
  roundsVal.textContent = rounds;
  beadsVal.textContent = beads;
}

/* ---------- итерация анимации ---------- */
function onIter() {
  if (introVisible) return;
  if (++beads > 108) {
    beads = 1;
    rounds++;
    showIntro();
  }
  updateCounter();
}

/* ---------- hook ---------- */
function hook() {
  waviy.querySelectorAll("#first").forEach((e) => {
    e.removeEventListener("animationiteration", onIter);
    e.removeAttribute("id");
  });
  const first = waviy.querySelector("span");
  if (!first) {
    setTimeout(hook, 100);
    return;
  }
  first.id = "first";
  first.addEventListener("animationiteration", onIter);
}

/* ---------- intro ---------- */
function hideIntro() {
  intro.classList.add("hidden");
  waviy.classList.remove("paused");
  introVisible = false;
  resetWave();
  updateCounter();
}

function showIntro() {
  clearTimeout(showIntro.t);
  introVisible = true;
  intro.classList.remove("hidden");
  waviy.classList.add("paused");
  showIntro.t = setTimeout(hideIntro, INTRO_MS);
}

function restartIntroTimer() {
  // интро уже на экране: просто заново отсчитываем 10с
  clearTimeout(showIntro.t);
  showIntro.t = setTimeout(hideIntro, INTRO_MS);
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
  isLight = !isLight;
  link.href = isLight ? "style2.css" : "style.css";
  sun.classList.toggle("hidden", isLight);
  moon.classList.toggle("hidden", !isLight);
  resetWave();
};

/* ---------- масштаб ---------- */
function getScale() {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--scale"),
    ) || 1
  );
}
function setScale(v) {
  document.documentElement.style.setProperty(
    "--scale",
    Math.max(0.5, Math.min(v, 3)),
  );
}
document.getElementById("fInc").onclick = () => setScale(getScale() + 0.2);
document.getElementById("fDec").onclick = () => setScale(getScale() - 0.2);

/* ---------- панель A± ---------- */
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

/* ---------- загрузка переводов ---------- */
let tr = null;
async function loadTranslations() {
  try {
    const r = await fetch("translations.json");
    tr = r.ok ? await r.json() : null;
  } catch {}
  if (!tr) {
    tr = {
      ru: {
        maha: "Харе Кришна Харе Кришна Кришна Кришна Харе Харе Харе Рама Харе Рама Рама Рама Харе Харе",
        pancha:
          "Джая Шри Кришна Чайтанья Прабху Нитьянанда Шри Адвайта Гададхара Шривасади Гаура Бхакта Вринда",
      },
    };
  }
  render("ru");
}

/* ---------- render ---------- */
function render(lang = "ru") {
  const prevIntroHTML = intro.innerHTML;

  const rec = tr[lang] || tr.ru;
  const mahaStr = typeof rec === "string" ? rec : rec.maha || tr.ru.maha;
  const panchaStr =
    typeof rec === "string" ? "" : rec.pancha || tr.ru.pancha || "";

  /* MAHA */
  const words = mahaStr.trim().split(/\s+/);
  waviy.innerHTML = words
    .map(
      (w, i) =>
        `${i % 4 ? "&nbsp;" : ""}
         <span style="--i:${(i % 16) + 1}"
               data-i="${(i % 16) + 1}">
           ${w}
         </span>` + ((i + 1) % 4 === 0 && i !== words.length - 1 ? "<br>" : ""),
    )
    .join("");
  hook();

  /* PANCHA */
  if (!panchaStr) return false;

  const limits = [4, 2, 3, 4];
  const ps = panchaStr.split(/\s+/).filter(Boolean);
  const rows = [];
  let r = 0,
    buf = [];
  for (let i = 0; i < ps.length; i++) {
    buf.push(ps[i]);
    if (buf.length === limits[r] || i === ps.length - 1) {
      rows.push(buf.join(" "));
      buf = [];
      r++;
      if (r >= limits.length) break;
    }
  }

  const totalWords = ps.length || 1;
  const slot = introDuration / totalWords;

  let idx = 0;
  const makeLine = (line) =>
    line
      .split(/\s+/)
      .map((w) => {
        const delay = (idx * slot).toFixed(3);
        idx++;
        return `<span class="w" style="animation-delay:${delay}s;animation-duration:${introDuration}s;">${w}</span>`;
      })
      .join(" ");

  intro.innerHTML = rows.map((l) => `<div>${makeLine(l)}</div>`).join("");

  // вернуть, изменилось ли intro
  return intro.innerHTML !== prevIntroHTML;
}

/* ---------- смена языка ---------- */
const langSel = document.getElementById("langSel");

langSel.onchange = (e) => {
  const lang = e.target.value;
  render(lang);
  if (introVisible) restartIntroTimer();
};
/* ---------- старт ---------- */
loadTranslations();
setSpeed(false);
showIntro();

/* сторож */
setInterval(() => {
  const f = waviy.querySelector("#first");
  if (
    !f ||
    (getComputedStyle(f).animationPlayState === "paused" && !introVisible)
  ) {
    resetWave();
  }
}, 5000);
