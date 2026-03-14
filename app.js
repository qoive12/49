/**
 * Popping Tok - Core Logic
 */

// --- Data Layer ---
const STORAGE_KEY_HABITS = "popping_tok_habits";
const STORAGE_KEY_USER = "popping_tok_user";

let state = {
  habits: [],
  user: {
    nickname: "성은님",
    totalPoints: 1250,
    currentStreak: 3,
    badges: [],
  },
  currentScreen: "onboarding",
  deleteMode: false,
};

function loadData() {
  const savedHabits = localStorage.getItem(STORAGE_KEY_HABITS);
  const savedUser = localStorage.getItem(STORAGE_KEY_USER);

  if (savedHabits) state.habits = JSON.parse(savedHabits);
  if (savedUser) state.user = JSON.parse(savedUser);

  // Default habits if empty
  if (state.habits.length === 0) {
    state.habits = [
      {
        id: 1,
        name: "아침 물 한잔 마시기",
        category: "food",
        points: 5,
        repeatDays: [1, 2, 3, 4, 5, 6, 0],
        reminderTime: "08:00",
        completedDates: [],
      },
      {
        id: 2,
        name: "15분 독서하기",
        category: "reading",
        points: 10,
        repeatDays: [1, 2, 3, 4, 5],
        reminderTime: "21:00",
        completedDates: [],
      },
      {
        id: 3,
        name: "저녁 스트레칭",
        category: "exercise",
        points: 15,
        repeatDays: [1, 2, 3, 4, 5, 6, 0],
        reminderTime: "22:30",
        completedDates: [],
      },
    ];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(state.habits));
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(state.user));
}

// --- UI Navigation ---
function goTo(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("screen--active"));
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add("screen--active");
    state.currentScreen = screenId;

    // Update bottom nav
    document.querySelectorAll(".bottom-nav__item").forEach((item) => {
      item.classList.remove("bottom-nav__item--active");
      if (item.dataset.screen === screenId) {
        item.classList.add("bottom-nav__item--active");
      }
    });

    renderScreen(screenId);
  }
}

// --- Render Logic ---
function renderScreen(screenId) {
  switch (screenId) {
    case "home":
      renderHome();
      break;
    case "message":
      renderMessage();
      break;
    case "stats":
      renderStats();
      break;
    case "profile":
      renderProfile();
      break;
    case "onboarding":
      renderOnboarding();
      break;
  }
}

function renderOnboarding() {
  const container = document.querySelector(".onboarding__slides");
  const dotsContainer = document.querySelector(".onboarding__dots");
  if (!container) return;

  const slides = [
    {
      emoji: "🌱",
      title: "작은 습관이\n큰 변화를 만들어요",
      desc: "팝핑톡과 함께 매일 조금씩 성장해요",
    },
    {
      emoji: "✨",
      title: "체크하면 팝!\n성취감이 터져요",
      desc: "완료할 때마다 기분 좋은 보상을 받으세요",
    },
    {
      emoji: "🏆",
      title: "포인트를 모아\n나를 응원해요",
      desc: "꾸준한 습관으로 멋진 뱃지를 획득하세요",
    },
  ];

  let currentSlide = 0;

  const updateSlides = () => {
    container.innerHTML = `
      <div class="slide">
        <div class="slide__emoji">${slides[currentSlide].emoji}</div>
        <h2 class="slide__title">${slides[currentSlide].title.replace("\n", "<br>")}</h2>
        <p class="slide__desc">${slides[currentSlide].desc}</p>
      </div>
    `;
    dotsContainer.innerHTML = slides
      .map(
        (_, i) => `
      <div class="onboarding__dot ${i === currentSlide ? "onboarding__dot--active" : ""}"></div>
    `,
      )
      .join("");
  };

  updateSlides();

  const slideInterval = setInterval(() => {
    if (state.currentScreen !== "onboarding") {
      clearInterval(slideInterval);
      return;
    }
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlides();
  }, 3000);
}

function renderMessage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const doneCount = state.habits.filter((h) =>
    h.completedDates.includes(todayStr),
  ).length;
  const total = state.habits.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  const character = document.querySelector(".character");
  if (progress === 100) {
    character.classList.add("character--celebrate");
  } else {
    character.classList.remove("character--celebrate");
  }

  const kpis = document.querySelectorAll(".achievement-card__value");
  if (kpis.length >= 3) {
    kpis[0].innerText = `${Math.round(progress)}%`;
    kpis[1].innerText = `${state.user.currentStreak}일`;
    kpis[2].innerText = `+${doneCount * 10}P`;
  }

  // Update character name/display if needed
  const charDisplay = document.querySelector(".character__display");
  if (charDisplay && progress === 100) {
    charDisplay.classList.add("character--celebrate");
  }
}

function renderStats() {
  const barChart = document.querySelector(".bar-chart");
  if (!barChart) return;

  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const data = [33.3, 100, 60, 40, 25, 10, 5];

  barChart.innerHTML = days
    .map(
      (day, i) => `
    <div class="bar-chart__column">
      <div class="bar-chart__bar">
        <div class="bar-chart__fill ${data[i] >= 100 ? "bar-chart__fill--active" : ""}" style="height: ${data[i]}%;"></div>
      </div>
      <span class="bar-chart__label">${day}</span>
    </div>
  `,
    )
    .join("");

  // Heatmap rendering with 3 weeks window
  const heatmap = document.querySelector(".heatmap");
  if (heatmap) {
    const today = new Date();
    const monthName = today.getMonth() + 1 + "월";

    const monthLabel = document.querySelector(".month-label");
    if (monthLabel) monthLabel.innerText = monthName;

    // 오늘 포함 주를 기준으로 전주 이번주 다음주 (3주)
    // Sunday of previous week
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - 7);

    const cells = [];
    for (let i = 0; i < 21; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const isToday = d.toDateString() === today.toDateString();
        const dateNum = d.getDate();
        let type = "";
        if (dateNum % 7 === 0) type = "heatmap__cell--full";
        else if (dateNum % 3 === 0) type = "heatmap__cell--partial";
        
        cells.push(`<div class="heatmap__cell ${type} ${isToday ? 'heatmap__cell--today' : ''}">${dateNum}</div>`);
    }
    heatmap.innerHTML = cells.join("");
    // Ensure 7 columns grid is maintained in style
  }

  // Habit Rank rendering
  const rankList = document.getElementById("habit-rank-list");
  if (rankList) {
    const sortedHabits = [...state.habits].sort(
      (a, b) => b.completedDates.length - a.completedDates.length,
    );
    rankList.innerHTML = sortedHabits
      .slice(0, 3)
      .map((habit) => {
        const rate = Math.min(
          100,
          Math.round((habit.completedDates.length / 30) * 100),
        ); // Mock rate over 30 days
        return `
        <li class="habit-rank-item">
          <span class="habit-rank-item__name">${habit.name}</span>
          <div class="habit-rank-item__progress">
            <div class="habit-rank-item__fill" style="width: ${rate}%"></div>
          </div>
          <span class="habit-rank-item__value">${rate}%</span>
        </li>
      `;
      })
      .join("");
  }
}

function renderProfile() {
  const pointsVal = document.querySelector(
    ".profile-stat:nth-child(1) .profile-stat__value",
  );
  if (pointsVal)
    pointsVal.innerText = (state.user.totalPoints || 0).toLocaleString();

  const nicknameEl = document.querySelector(".profile-card__nickname");
  if (nicknameEl) nicknameEl.innerText = state.user.nickname;
}

function renderHome() {
  // Update Date
  const dateEl = document.getElementById("home-date");
  if (dateEl) {
    const now = new Date();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    dateEl.innerText = now.toLocaleDateString("ko-KR", options);
  }

  const habitList = document.getElementById("habit-list");
  if (!habitList) return;

  const todayStr = new Date().toISOString().split("T")[0];

  habitList.innerHTML = state.habits
    .map((habit) => {
      const isDone = habit.completedDates.includes(todayStr);
      return `
      <li class="habit-item ${isDone ? "habit-item--done" : ""} ${state.deleteMode ? "habit-item--delete-mode" : ""}" data-id="${habit.id}">
        <div class="habit-item__check">${state.deleteMode ? "" : (isDone ? "✓" : "")}</div>
        <span class="habit-item__name">${habit.name}</span>
        <span class="habit-item__points">+${habit.points}P</span>
      </li>
    `;
    })
    .join("");

  // Update delete button state
  const deleteBtn = document.getElementById("btn-delete-mode");
  if (deleteBtn) {
    deleteBtn.classList.toggle("habit-section__delete-btn--active", state.deleteMode);
    deleteBtn.innerText = state.deleteMode ? "완료" : "삭제"; // 텍스트 토글 추가
  }

  // Update points/progress cards
  updateProgressUI();
}

function updateProgressUI() {
  const todayStr = new Date().toISOString().split("T")[0];
  const total = state.habits.length;
  const doneCount = state.habits.filter((h) =>
    h.completedDates.includes(todayStr),
  ).length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  // Update progress bar
  const fill = document.querySelector(".progress-bar__fill");
  if (fill) fill.style.width = `${progress}%`;

  const counter = document.querySelector(".progress__counter");
  if (counter) counter.innerText = `${doneCount} / ${total} 완료`;

  const status = document.querySelector(".progress__status");
  if (status) {
    const remaining = total - doneCount;
    status.innerText =
      remaining > 0
        ? `${Math.round(progress)}% · ${remaining}개 남았어요 🔔`
        : "100% · 오늘 목표 달성! 🎉";
  }

  // Update point card
  const totalEl = document.querySelector(".point-card__total");
  if (totalEl)
    totalEl.innerText = `${(state.user.totalPoints || 0).toLocaleString()}P`;
}

// --- Interactions ---
function handleHabitClick(e) {
  const item = e.target.closest(".habit-item");
  if (!item) return;

  const habitId = parseInt(item.dataset.id);

  if (state.deleteMode) {
    if (confirm(`'${item.querySelector(".habit-item__name").innerText}' 습관을 삭제할까요?`)) {
      state.habits = state.habits.filter((h) => h.id !== habitId);
      saveData();
      renderHome();
    }
    return;
  }

  const habit = state.habits.find((h) => h.id === habitId);
  const todayStr = new Date().toISOString().split("T")[0];
  const isDone = habit.completedDates.includes(todayStr);

  if (!isDone) {
    // Mark as done
    habit.completedDates.push(todayStr);
    state.user.totalPoints += habit.points;

    // Core Interaction: Pop
    triggerPopAnimation(item, habit.points);
  } else {
    // Unmark (Optional, but good for UX)
    habit.completedDates = habit.completedDates.filter((d) => d !== todayStr);
    state.user.totalPoints -= habit.points;
  }

  saveData();
  renderHome();

  // Check if all done for the day
  const allDone = state.habits.every((h) =>
    h.completedDates.includes(todayStr),
  );
  if (allDone && !isDone) {
    setTimeout(() => {
      // Show celebration or guide to Screen 2
      alert(
        "오늘의 모든 습관을 완료했습니다! 메시지 탭에서 성과를 확인하세요.",
      );
    }, 600);
  }
}

function triggerPopAnimation(element, points) {
  const rect = element.getBoundingClientRect();
  const checkRect = element
    .querySelector(".habit-item__check")
    .getBoundingClientRect();

  // 1. Float-up points
  const floatText = document.createElement("div");
  floatText.className = "float-up-points";
  floatText.innerText = `+${points}P`;
  floatText.style.left = `${checkRect.left + checkRect.width / 2}px`;
  floatText.style.top = `${checkRect.top}px`;
  document.body.appendChild(floatText);

  setTimeout(() => floatText.remove(), 800);

  // 2. Particles - Now from progress bar fill tip position
  const progressBar = document.querySelector(".progress-bar");
  const fill = document.querySelector(".progress-bar__fill");
  const progRect = progressBar.getBoundingClientRect();
  const fillWidth = fill ? fill.offsetWidth : 0;
  
  // Calculate tip position (right edge of the fill)
  const tipX = progRect.left + fillWidth;
  const centerY = progRect.top + progRect.height / 2;

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.backgroundColor =
      i % 2 === 0 ? "var(--c-primary)" : "var(--c-secondary)";
    p.style.left = `${tipX}px`;
    p.style.top = `${centerY}px`;

    const angle = (i / 10) * Math.PI * 2;
    const dist = 50 + Math.random() * 40;
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 400);
  }
}

// --- Sheet Logic ---
function openAddSheet() {
  document
    .getElementById("add-habit-overlay")
    .classList.add("bottom-sheet-overlay--open");
  document
    .getElementById("add-habit-sheet")
    .classList.add("bottom-sheet--open");
}

function closeAddSheet() {
  document
    .getElementById("add-habit-overlay")
    .classList.remove("bottom-sheet-overlay--open");
  document
    .getElementById("add-habit-sheet")
    .classList.remove("bottom-sheet--open");
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  // Check onboarding
  if (localStorage.getItem("onboarding_done")) {
    goTo("home");
  } else {
    goTo("onboarding");
  }

  // Event Listeners
  document.querySelector(".bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".bottom-nav__item");
    if (btn) goTo(btn.dataset.screen);
  });

  document
    .getElementById("habit-list")
    .addEventListener("click", handleHabitClick);

  document
    .getElementById("btn-add-habit")
    .addEventListener("click", openAddSheet);
  document
    .getElementById("btn-close-sheet")
    .addEventListener("click", closeAddSheet);
  document
    .getElementById("add-habit-overlay")
    .addEventListener("click", closeAddSheet);

  document.getElementById("btn-delete-mode").addEventListener("click", () => {
    state.deleteMode = !state.deleteMode;
    renderHome();
  });

  document.querySelector(".point-card__shop-btn").addEventListener("click", () => {
    alert("포인트 샵은 현재 준비 중입니다! 🎁");
  });

  document.querySelectorAll(".icon-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      alert("설정 및 앱 정보는 다음 업데이트에서 제공될 예정입니다! 🚀");
    });
  });

  document.querySelector(".character__bubble").addEventListener("click", () => {
    const bubbles = [
      "오늘도 정말 잘했어요!\n내일도 같이 해봐요 ☀️",
      "작은 습관이 당신을 만든답니다!\n화이팅! 💪",
      "벌써 이만큼이나 해내셨네요!\n대단해요! 🏆",
      "당신의 노력을 응원해요!\n내일 또 봐요 ✨",
      "습관은 제2의 천성이에요!\n꾸준히 해봐요 🌸",
    ];
    const bubble = document.querySelector(".character__bubble");
    const random = bubbles[Math.floor(Math.random() * bubbles.length)];
    bubble.innerText = random;
  });

  document.getElementById("btn-start").addEventListener("click", () => {
    localStorage.setItem("onboarding_done", "1");
    goTo("home");
  });

  document.getElementById("btn-skip").addEventListener("click", () => {
    localStorage.setItem("onboarding_done", "1");
    goTo("home");
  });

  // Habit Form
  const form = document.getElementById("add-habit-form");
  const nameInput = document.getElementById("habit-name");
  const saveBtn = document.getElementById("btn-save-habit");

  nameInput.addEventListener("input", (e) => {
    const len = e.target.value.length;
    document.getElementById("char-counter").innerText = `${len}/20`;
    saveBtn.classList.toggle("button--disabled", len === 0);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newHabit = {
      id: Date.now(),
      name: nameInput.value,
      category:
        document.querySelector("#category-chips .chip--selected")?.dataset
          .value || "etc",
      points: parseInt(
        document.querySelector("#point-chips .chip--selected")?.dataset.value ||
          "10",
      ),
      repeatDays: Array.from(
        document.querySelectorAll("#day-toggles .day-toggle--selected"),
      ).map((d) => parseInt(d.dataset.day)),
      reminderTime: document.getElementById("reminder-time").value,
      completedDates: [],
    };

    state.habits.push(newHabit);
    saveData();
    renderHome();
    closeAddSheet();
    form.reset();
  });

  // Chips & Toggles
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("chip")) {
      const group = e.target.closest(".chip-group");
      group
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("chip--selected"));
      e.target.classList.add("chip--selected");
    }
    if (e.target.classList.contains("day-toggle")) {
      e.target.classList.toggle("day-toggle--selected");
    }
  });

  // Update date every minute
  setInterval(() => {
    if (state.currentScreen === "home") {
      const dateEl = document.getElementById("home-date");
      if (dateEl) {
        const now = new Date();
        const options = {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        };
        dateEl.innerText = now.toLocaleDateString("ko-KR", options);
      }
    }
  }, 60000);
});
