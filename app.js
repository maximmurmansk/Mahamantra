/* ---------- глобальные переменные ---------- */
let beads = 1,
  rounds = 1,
  introVisible = true, // интро будет показано сразу
  speed = 4.5,
  isLight = true;

/* ---------- быстрые ссылки на DOM ---------- */
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

/* каждый полный цикл анимации одного слова */
function onIter() {
  if (introVisible) return; // пока интро видно — счёт не идёт
  if (++beads > 108) {
    // 108 бусин → новый круг
    beads = 1;
    rounds++;
    showIntro();
  }
  updateCounter();
}

/* «прицепить» onIter к первому <span> */
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
  console.log("Hook attached to:", first);
}

/* ---------- intro ON/OFF ---------- */
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
  }, 10000); // 10 секунд показ
}

/* ---------- скорость анимации ---------- */
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
    /* force-reflow */ s.offsetHeight;
    s.style.animation = "waviy var(--speed) infinite";
    s.style.animationDelay = `calc(var(--step)*${s.dataset.i})`;
  });
  hook(); // повторно цепляем счётчик
}

/* кнопки скорости */
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

/* ---------- переключение темы ---------- */
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

/* ---------- масштаб шрифта ---------- */
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

/* автоскрытие панели «A±» */
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

/* ---------- смена языка ---------- */
document.getElementById("langSel").onchange = (e) => {
  const lang = e.target.value;
  console.log("Switching to language:", lang); // Debug log
  render(lang); // Call render with the selected language
};

/* ---------- загрузка переводов ---------- */
let tr = null; // сюда придёт объект {ru:{maha,pancha}, …}
async function loadTranslations() {
  try {
    const r = await fetch("translations.json");
    tr = r.ok
      ? await r.json()
      : {
          ru: {
            maha: "Харе Кришна Харе Кришна Кришна Кришна Харе Харе Харе Рама Харе Рама Рама Рама Харе Харе",
            pancha:
              "Джая Шри Кришна Чайтанья Прабху Нитьянанда Шри Адвайта Гададхара Шривасади Гаура Бхакта Вринда",
          },
        };
    console.log("Translations loaded:", tr);
    render("ru"); // Initial render with Russian
  } catch (e) {
    console.error("Failed to load translations:", e);
    tr = {
      ru: {
        maha: "Харе Кришна Харе Кришна Кришна Кришна Харе Харе Харе Рама Харе Рама Рама Рама Харе Харе",
        pancha:
          "Джая Шри Кришна Чайтанья Прабху Нитьянанда Шри Адвайта Гададхара Шривасади Гаура Бхакта Вринда",
      },
    };
    render("ru");
  }
}

/* ---------- рендер мантры ---------- */
function render(lang = "ru") {
  if (!tr) {
    setTimeout(() => render(lang), 100);
    return;
  }

  const rec = tr[lang] || tr.ru;
  const mahaStr = typeof rec === "string" ? rec : rec.maha || tr.ru.maha;
  /* ---- маха-мантра (4 слова строка) ---- */
  const words = mahaStr.trim().split(/\s+/);
  waviy.innerHTML = words
    .map(
      (w, i) =>
        `${i % 4 ? "&nbsp;" : ""}
           <span style="--i:${(i % 16) + 1}"
                 data-i="${(i % 16) + 1}">
             ${w}
           </span>` +
        ((i + 1) % 4 === 0 && i !== words.length - 1 ? "<br>" : ""),
    )
    .join("");

  /* ---------- PANCHA-таттва: распределение + «караван» волны ---------- */
  const panchaStr = (rec.pancha || tr.ru.pancha || "").trim();
  if (!panchaStr) return; // нет текста — выходим

  // 1. Делим на строки по количеству слов: 4-2-3-4
  const limits = [4, 2, 3, 4];
  const panchaWords = panchaStr.split(/\s+/).filter(Boolean);
  const rows = [];
  let r = 0,
    line = [];

  for (let i = 0; i < panchaWords.length; i++) {
    line.push(panchaWords[i]);
    if (line.length === limits[r] || i === panchaWords.length - 1) {
      rows.push(line.join(" "));
      line = [];
      r++;
      if (r >= limits.length) break;
    }
  }

  const totalWords = panchaWords.length;
  const STEP = 10 / totalWords;

  // 3. Строим HTML
  let idx = 0;
  const makeLine = (text) =>
    text
      .split(/\s+/)
      .map((word) => {
        const delay = (idx * STEP).toFixed(3);
        idx++;
        return `<span class="w" style="
          animation-delay:${delay}s;
          animation-duration:10s;">${word}</span>`;
      })
      .join(" ");

  // 4. Вставляем строки внутрь #intro
  intro.innerHTML = rows
    .map(makeLine)
    .map((line) => `<div>${line}</div>`)
    .join("");

  // 5. Обновляем CSS-переменную
  document.documentElement.style.setProperty(
    "--introSlot",
    STEP.toFixed(3) + "s",
  );
}
/* ---------- старт ---------- */
loadTranslations();
setSpeed(false);
showIntro();

/* «сторож» анимации */
setInterval(() => {
  const f = waviy.querySelector("#first");
  if (
    !f ||
    (getComputedStyle(f).animationPlayState === "paused" && !introVisible)
  )
    resetWave();
}, 5000);
