/* ---------- глобальные переменные ---------- */
let beads = 1,
  rounds = 1,
  userPaused = false, // «ручная» пауза по клику
  introRestMS = 0, // сколько осталось до конца интро
  guardId = null, // id сторожевого setInterval
  introEndStamp = 0, // абсолютное время, когда интро должно скрыться
  introVisible = true;
let speed = +(localStorage.getItem("mantraSpeed") ?? 4.5);
let curLang = localStorage.getItem("mantraLang") || "ru";

let isLight = true,
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
document.getElementById("langSel").value = curLang;

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
function showIntro() {
  clearTimeout(showIntro.t);
  introVisible = true;
  intro.classList.remove("hidden");
  waviy.classList.add("paused");

  introEndStamp = Date.now() + INTRO_MS; // <- запомнили «дедлайн»
  showIntro.t = setTimeout(hideIntro, INTRO_MS);
}

function hideIntro() {
  intro.classList.add("hidden");
  waviy.classList.remove("paused");
  introVisible = false;
  introRestMS = 0; // сбрасываем остаток
  resetWave();
  updateCounter();
}

function restartIntroTimer() {
  if (userPaused) {
    introRestMS = INTRO_MS;
    clearTimeout(showIntro.t);
    return;
  }

  // обычный рестарт, когда паузы нет
  clearTimeout(showIntro.t);
  introEndStamp = Date.now() + INTRO_MS;
  showIntro.t = setTimeout(hideIntro, INTRO_MS);
}

/* ---------- скорость ---------- */
function setSpeed(reset) {
  document.documentElement.style.setProperty("--speed", speed + "s");
  document.documentElement.style.setProperty(
    "--step",
    (speed / 16).toFixed(3) + "s",
  );
  spdText.textContent = speed.toFixed(1);
  if (reset) resetWave();
}
function resetWave() {
  waviy.querySelectorAll(".w").forEach((s) => {
    /* 1. снимаем анимацию */
    s.style.animation = "none";
    /* 2. форс-перерисовка */
    void s.offsetHeight;
    /* 3. возвращаемся к декларативному CSS  */
    s.style.animation = "";
    s.style.animationDelay = `calc(var(--step) * ${s.dataset.i})`;
  });

  hook(); // заново «цепляем» счётчик на первый <span>
}
document.getElementById("dec").onclick = () => {
  if (speed > 2) {
    speed -= 0.5;
    localStorage.setItem("mantraSpeed", speed); // ← сохраняем
    setSpeed(true);
  }
};

document.getElementById("inc").onclick = () => {
  if (speed < 9) {
    speed += 0.5;
    localStorage.setItem("mantraSpeed", speed); // ← сохраняем
    setSpeed(true);
  }
};

/* ---------- ручная пауза волны ---------- */
function toggleUserPause() {
  userPaused = !userPaused;

  // ===== визуальное состояние (иконка) =====
  document.getElementById("pauseBadge").classList.toggle("hidden", !userPaused);
  document.documentElement.classList.toggle("userPaused", userPaused);

  if (userPaused) {
    /* ============ ПАУЗА ============ */
    // 1. Приостанавливаем таймер интро
    if (introVisible) {
      introRestMS = introEndStamp - Date.now(); // сколько осталось
      clearTimeout(showIntro.t);
    }
    // 2. Останавливаем «сторож»
    stopGuard();
  } else {
    /* ============ ВОЗОБНОВЛЕНИЕ ============ */
    // 1. Возобновляем интро, если оно было на экране
    if (introVisible && introRestMS > 0) {
      introEndStamp = Date.now() + introRestMS;
      showIntro.t = setTimeout(hideIntro, introRestMS);
      introRestMS = 0;
    }
    // 2. Перезапускаем «сторож»
    startGuard();
  }
}

/* ---------- тема ---------- */
const sun = document.getElementById("sun");
const moon = document.getElementById("moon");
document.getElementById("theme").onclick = () => {
  const link = document.getElementById("themeStylesheet");
  isLight = !isLight;
  link.href = isLight ? "style2.css" : "style.css";
  sun.classList.toggle("hidden", isLight);
  moon.classList.toggle("hidden", !isLight);
  //resetWave();
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

// пауза по клику в любом месте, КРОМЕ панели, A± и кнопок
document.addEventListener("click", (e) => {
  const skip = e.target.closest(".panel, .font-ctrl, #langSel, button");
  if (!skip) toggleUserPause();
});

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
  render(curLang);
}

/* ---------- render ---------- */
function render(lang = "ru") {
  const prevIntroHTML = intro.innerHTML;

  const rec = tr[lang] || tr.ru;
  const mahaStr = typeof rec === "string" ? rec : rec.maha || tr.ru.maha;
  const panchaStr =
    typeof rec === "string" ? "" : rec.pancha || tr.ru.pancha || "";

  /* MAHA-мантра */
  const words = mahaStr.trim().split(/\s+/);
  let ids = 0;
  const rowsHTML = [];

  for (let i = 0; i < words.length; i += 4) {
    const rowHTML = words
      .slice(i, i + 4)
      .map((w) => {
        const iVar = (ids % 16) + 1; // 1…16
        ids++;
        return `
          <span class="w"
                style="--i:${iVar}"
                data-i="${iVar}">
            ${w}
          </span>`;
      })
      .join(" ");

    rowsHTML.push(`<div>${rowHTML}</div>`);
  }

  waviy.innerHTML = rowsHTML.join(""); // ← вставляем в документ!
  hook(); // теперь первый <span> уже на месте

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
  curLang = lang;
  localStorage.setItem("mantraLang", lang); // ← сохраняем
  render(lang);
  if (introVisible) restartIntroTimer();
};
/* ---------- старт ---------- */
loadTranslations();
setSpeed(false);
showIntro();
startGuard(); // запуск «сторожа» после первой инициализации

/* сторож */
function startGuard() {
  if (guardId) return; // уже запущен
  guardId = setInterval(() => {
    if (userPaused) return; // во время паузы не трогаем
    const f = waviy.querySelector("#first");
    if (
      !f ||
      (getComputedStyle(f).animationPlayState === "paused" && !introVisible)
    ) {
      resetWave();
    }
  }, 5000);
}

function stopGuard() {
  clearInterval(guardId);
  guardId = null;
}
