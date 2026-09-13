(() => {
  "use strict";

  const STORAGE_KEY = "nextmove_goals_v1";
  const THEME_KEY = "nextmove_theme_v1";
  const config = window.NEXTMOVE_CONFIG || {};
  let goals = loadGoals();
  let wizardStep = 1;
  let currentPlan = null;
  let goalModal = null;
  let toast = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    goalModal = new bootstrap.Modal(document.getElementById("goalModal"));
    toast = new bootstrap.Toast(document.getElementById("appToast"), { delay: 2600 });
    applySavedTheme();
    bindGlobalActions();
    bindWizard();
    renderDashboard();
    handleRoute();
    window.addEventListener("hashchange", handleRoute);
  }

  function bindGlobalActions() {
    document.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", () => runAction(el.dataset.action));
    });
  }

  function bindWizard() {
    document.querySelectorAll("[data-fill]").forEach((button) => {
      button.addEventListener("click", () => {
        document.getElementById("goalTitle").value = button.dataset.fill;
      });
    });

    document.getElementById("wizardNext").addEventListener("click", () => {
      if (!validateWizardStep()) return;
      if (wizardStep < 4) {
        wizardStep += 1;
        if (wizardStep === 4) updatePlanPreview();
        renderWizard();
      }
    });

    document.getElementById("wizardBack").addEventListener("click", () => {
      if (wizardStep > 1) {
        wizardStep -= 1;
        renderWizard();
      }
    });

    document.getElementById("goalForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createGoal();
    });
  }

  function runAction(action) {
    switch (action) {
      case "create-goal": openGoalModal(); break;
      case "open-dashboard": location.hash = "app"; break;
      case "back-home": location.hash = "home"; break;
      case "demo": runDemo(); break;
      case "upgrade": upgrade(); break;
      case "theme": toggleTheme(); break;
      case "today-action": completeNextTask(); break;
      default: break;
    }
  }

  function openGoalModal() {
    wizardStep = 1;
    currentPlan = null;
    document.getElementById("goalForm").reset();
    document.getElementById("goalTime").value = "60";
    renderWizard();
    goalModal.show();
  }

  function renderWizard() {
    document.querySelectorAll(".step-panel").forEach((panel) => {
      panel.classList.toggle("active", Number(panel.dataset.step) === wizardStep);
    });

    const back = document.getElementById("wizardBack");
    const next = document.getElementById("wizardNext");
    const create = document.getElementById("wizardCreate");
    back.disabled = wizardStep === 1;
    next.classList.toggle("d-none", wizardStep === 4);
    create.classList.toggle("d-none", wizardStep !== 4);
  }

  function validateWizardStep() {
    if (wizardStep === 1) {
      const title = document.getElementById("goalTitle").value.trim();
      if (!title) {
        showToast("Give your goal a name first.");
        document.getElementById("goalTitle").focus();
        return false;
      }
    }
    return true;
  }

  function updatePlanPreview() {
    const input = readGoalForm();
    currentPlan = buildPlan(input);
    document.getElementById("planPreview").innerHTML = `
      <div class="mini-label">PLAN PREVIEW</div>
      <h3 class="h5 mt-2 mb-3">${escapeHtml(input.title)}</h3>
      <div class="preview-row"><span>Category</span><strong>${escapeHtml(capitalize(input.category))}</strong></div>
      <div class="preview-row"><span>Target</span><strong>${escapeHtml(formatDate(input.deadline))}</strong></div>
      <div class="preview-row"><span>Suggested tasks</span><strong>${currentPlan.tasks.length}</strong></div>
      <div class="preview-row"><span>Estimated total effort</span><strong>${currentPlan.totalMinutes} min</strong></div>
      <div class="preview-row"><span>Next best action</span><strong>${escapeHtml(currentPlan.nextTask.title)}</strong></div>
    `;
  }

  function readGoalForm() {
    return {
      title: document.getElementById("goalTitle").value.trim(),
      category: document.getElementById("goalCategory").value,
      deadline: document.getElementById("goalDeadline").value,
      minutesPerDay: Number(document.getElementById("goalTime").value) || 60,
      budget: Number(document.getElementById("goalBudget").value) || 0
    };
  }

  function buildPlan(input) {
    const template = getTemplate(input.title, input.category);
    const tasks = template.map((task, index) => ({
      id: `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
      title: task.title,
      minutes: task.minutes,
      importance: task.importance,
      impact: task.impact,
      completed: false,
      order: index
    }));

    const deadlineDays = daysUntil(input.deadline);
    const urgencyMultiplier = deadlineDays == null ? 1 : clamp(30 / Math.max(deadlineDays, 1), .5, 4);

    tasks.forEach((task) => {
      const effortPenalty = clamp(task.minutes / Math.max(input.minutesPerDay, 30), .2, 2);
      task.priorityScore = Math.round((task.importance * .35 + task.impact * .40 + urgencyMultiplier * .25) / effortPenalty * 100);
    });

    tasks.sort((a, b) => b.priorityScore - a.priorityScore);
    tasks.forEach((task, index) => task.order = index);

    return {
      tasks,
      totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
      nextTask: tasks[0],
      deadlineDays
    };
  }

  function getTemplate(title, category) {
    const t = title.toLowerCase();

    if (t.includes("job") || t.includes("work") || category === "career") {
      return [
        { title: "Define the exact role or outcome you want", minutes: 15, importance: 9, impact: 8 },
        { title: "Update your resume or portfolio for the goal", minutes: 30, importance: 8, impact: 9 },
        { title: "Find 5 strong opportunities or contacts", minutes: 30, importance: 8, impact: 9 },
        { title: "Complete the first 2 high-quality applications", minutes: 30, importance: 9, impact: 10 },
        { title: "Practice your most likely interview questions", minutes: 25, importance: 7, impact: 8 },
        { title: "Follow up with your highest-potential opportunity", minutes: 15, importance: 8, impact: 8 }
      ];
    }

    if (t.includes("save") || t.includes("money") || t.includes("budget") || category === "money") {
      return [
        { title: "Write down the exact savings target", minutes: 10, importance: 9, impact: 8 },
        { title: "Calculate the monthly amount required", minutes: 10, importance: 9, impact: 9 },
        { title: "List your recurring expenses", minutes: 20, importance: 8, impact: 9 },
        { title: "Choose one expense to reduce this week", minutes: 15, importance: 8, impact: 8 },
        { title: "Set an automatic savings transfer", minutes: 15, importance: 10, impact: 10 },
        { title: "Review progress once per week", minutes: 10, importance: 6, impact: 7 }
      ];
    }

    if (t.includes("exam") || t.includes("study") || t.includes("learn") || category === "education") {
      return [
        { title: "List the topics you need to know", minutes: 15, importance: 9, impact: 8 },
        { title: "Identify your 2 weakest topics", minutes: 15, importance: 9, impact: 9 },
        { title: "Study the first weak topic", minutes: 45, importance: 10, impact: 9 },
        { title: "Test yourself without looking at notes", minutes: 25, importance: 9, impact: 10 },
        { title: "Study the second weak topic", minutes: 45, importance: 9, impact: 9 },
        { title: "Do a timed practice session", minutes: 45, importance: 8, impact: 10 }
      ];
    }

    if (category === "project" || t.includes("build") || t.includes("start") || t.includes("create")) {
      return [
        { title: "Define what a finished version looks like", minutes: 20, importance: 10, impact: 10 },
        { title: "Break the project into 3–6 major parts", minutes: 20, importance: 9, impact: 9 },
        { title: "Choose the smallest useful first version", minutes: 15, importance: 10, impact: 10 },
        { title: "Complete the first working part", minutes: 45, importance: 9, impact: 10 },
        { title: "Test the result and record problems", minutes: 20, importance: 8, impact: 8 },
        { title: "Improve the most important problem", minutes: 45, importance: 9, impact: 9 }
      ];
    }

    return [
      { title: "Define the finished result in one sentence", minutes: 15, importance: 10, impact: 9 },
      { title: "List the 3 biggest things required", minutes: 15, importance: 9, impact: 9 },
      { title: "Start the smallest useful step", minutes: 30, importance: 9, impact: 10 },
      { title: "Complete the next required step", minutes: 30, importance: 8, impact: 9 },
      { title: "Review progress and remove one obstacle", minutes: 20, importance: 8, impact: 8 },
      { title: "Set the next checkpoint", minutes: 10, importance: 7, impact: 7 }
    ];
  }

  function createGoal() {
    const input = readGoalForm();
    if (!input.title || !currentPlan) {
      showToast("Finish the goal setup first.");
      return;
    }

    if (goals.length >= 3) {
      showToast("Free V1 allows 3 active goals. Upgrade later for unlimited goals.");
      return;
    }

    const goal = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      category: input.category,
      deadline: input.deadline,
      minutesPerDay: input.minutesPerDay,
      budget: input.budget,
      createdAt: new Date().toISOString(),
      tasks: currentPlan.tasks,
      progress: 0
    };

    goals.unshift(goal);
    saveGoals();
    goalModal.hide();
    location.hash = "app";
    renderDashboard();
    showToast("Goal created. Your next move is ready.");
  }

  function completeNextTask() {
    const next = getNextTask();
    if (!next) {
      showToast("Create a goal to generate a next action.");
      return;
    }
    next.task.completed = true;
    recalculateProgress(next.goal);
    saveGoals();
    renderDashboard();
    showToast("Nice. NextMove updated your priorities.");
  }

  function getNextTask() {
    let best = null;
    goals.forEach((goal) => {
      goal.tasks.filter((t) => !t.completed).forEach((task) => {
        const score = task.priorityScore || 0;
        if (!best || score > best.score) best = { goal, task, score };
      });
    });
    return best;
  }

  function recalculateProgress(goal) {
    const total = goal.tasks.length;
    const complete = goal.tasks.filter((t) => t.completed).length;
    goal.progress = total ? Math.round((complete / total) * 100) : 0;
  }

  function renderDashboard() {
    const countLabel = document.getElementById("goalCountLabel");
    if (!countLabel) return;
    countLabel.textContent = `${goals.length} goal${goals.length === 1 ? "" : "s"}`;

    const next = getNextTask();
    const headline = document.getElementById("todayHeadline");
    const subline = document.getElementById("todaySubline");
    const btn = document.getElementById("todayActionBtn");

    if (!next) {
      headline.textContent = goals.length ? "All caught up. Nice work." : "Create a goal to get your next move.";
      subline.textContent = goals.length ? "You completed all current tasks." : "Your highest-priority action will appear here.";
      btn.disabled = goals.length > 0;
    } else {
      headline.textContent = next.task.title;
      subline.textContent = `${next.goal.title} • about ${next.task.minutes} minutes`;
      btn.disabled = false;
    }

    const list = document.getElementById("goalList");
    if (!goals.length) {
      list.innerHTML = `<div class="empty-state"><h3 class="h5">No goals yet</h3><p class="text-secondary-custom mb-3">Create your first goal and NextMove will generate a practical plan.</p><button class="btn btn-primary" data-action="create-goal">Create a goal →</button></div>`;
      const emptyBtn = list.querySelector("[data-action=\"create-goal\"]");
      emptyBtn?.addEventListener("click", () => openGoalModal());
    } else {
      list.innerHTML = goals.map(renderGoalItem).join("");
      list.querySelectorAll(".goal-task-check").forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const { goalId, taskId } = event.target.dataset;
          const goal = goals.find((g) => g.id === goalId);
          const task = goal?.tasks.find((t) => t.id === taskId);
          if (!task) return;
          task.completed = event.target.checked;
          recalculateProgress(goal);
          saveGoals();
          renderDashboard();
        });
      });
    }

    const totalTasks = goals.reduce((sum, g) => sum + g.tasks.length, 0);
    const averageProgress = goals.length ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;
    document.getElementById("statGoals").textContent = goals.length;
    document.getElementById("statTasks").textContent = totalTasks;
    document.getElementById("statDone").textContent = `${averageProgress}%`;
    document.getElementById("statStreak").textContent = calculateStreak();
  }

  function renderGoalItem(goal) {
    const remaining = goal.tasks.filter((t) => !t.completed).slice(0, 3);
    return `
      <article class="goal-item">
        <div class="d-flex justify-content-between gap-3">
          <div class="goal-item-main flex-grow-1">
            <div class="goal-bullet" aria-hidden="true">${categoryIcon(goal.category)}</div>
            <div class="flex-grow-1">
              <div class="goal-title">${escapeHtml(goal.title)}</div>
              <div class="goal-meta mt-1">${escapeHtml(capitalize(goal.category))} • ${escapeHtml(formatDate(goal.deadline))}</div>
              <div class="progress progress-slim mt-3"><div class="progress-bar" style="width:${goal.progress}%"></div></div>
              <div class="small text-secondary-custom mt-2">${goal.progress}% complete</div>
            </div>
          </div>
          <button class="btn btn-sm btn-ghost" type="button" onclick="window.NextMove.deleteGoal('${goal.id}')">Delete</button>
        </div>
        <div class="mt-3 pt-3 border-top">
          <div class="mini-label mb-2">NEXT TASKS</div>
          ${remaining.length ? remaining.map((task) => `
            <label class="d-flex align-items-start gap-2 py-2 small">
              <input class="goal-task-check goal-check" type="checkbox" data-goal-id="${goal.id}" data-task-id="${task.id}">
              <span>${escapeHtml(task.title)} <span class="text-secondary-custom">• ${task.minutes}m</span></span>
            </label>`).join("") : `<div class="small text-success fw-semibold">Goal complete 🎉</div>`}
        </div>
      </article>
    `;
  }

  function deleteGoal(id) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    if (!confirm(`Delete “${goal.title}”?`)) return;
    goals = goals.filter((g) => g.id !== id);
    saveGoals();
    renderDashboard();
    showToast("Goal deleted.");
  }

  function runDemo() {
    goals = [
      {
        id: "demo_1",
        title: "Find a job",
        category: "career",
        deadline: futureDate(21),
        minutesPerDay: 60,
        budget: 0,
        createdAt: new Date().toISOString(),
        progress: 33,
        tasks: buildPlan({ title: "Find a job", category: "career", deadline: futureDate(21), minutesPerDay: 60, budget: 0 }).tasks
      },
      {
        id: "demo_2",
        title: "Save $3,000",
        category: "money",
        deadline: futureDate(180),
        minutesPerDay: 30,
        budget: 0,
        createdAt: new Date().toISOString(),
        progress: 50,
        tasks: buildPlan({ title: "Save $3,000", category: "money", deadline: futureDate(180), minutesPerDay: 30, budget: 0 }).tasks
      }
    ];
    goals[0].tasks[0].completed = true;
    goals[0].tasks[1].completed = true;
    goals[1].tasks[0].completed = true;
    goals[1].tasks[1].completed = true;
    recalculateProgress(goals[0]);
    recalculateProgress(goals[1]);
    saveGoals();
    location.hash = "app";
    renderDashboard();
    showToast("Demo data loaded.");
  }

  function upgrade() {
    const url = String(config.STRIPE_PRO_PAYMENT_LINK || "").trim();
    if (!url) {
      showToast("Add your Stripe Payment Link to config.js before taking payments.");
      return;
    }
    window.location.href = url;
  }

  function handleRoute() {
    const app = document.getElementById("app");
    const home = document.querySelector("main#home");
    const footer = document.querySelector("footer");
    const isApp = location.hash === "#app";
    app.classList.toggle("d-none", !isApp);
    home.classList.toggle("d-none", isApp);
    footer.classList.toggle("d-none", isApp);
    if (isApp) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveGoals() { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); }
  function loadGoals() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
  }
  function applySavedTheme() { if (localStorage.getItem(THEME_KEY) === "dark") document.body.classList.add("dark"); }

  function calculateStreak() {
    const completed = goals.reduce((sum, g) => sum + g.tasks.filter((t) => t.completed).length, 0);
    return completed ? Math.min(7, Math.ceil(completed / 2)) : 0;
  }

  function daysUntil(value) {
    if (!value) return null;
    const target = new Date(`${value}T23:59:59`);
    const now = new Date();
    return Math.ceil((target - now) / 86400000);
  }
  function formatDate(value) {
    if (!value) return "No deadline";
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime()) ? "No deadline" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function futureDate(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function capitalize(v) { return v ? v.charAt(0).toUpperCase() + v.slice(1) : "Other"; }
  function categoryIcon(c) { return ({ career: "↗", money: "$", education: "✓", personal: "★", project: "⚙", other: "•" }[c] || "•"); }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
  }

  function showToast(message) {
    document.getElementById("toastBody").textContent = message;
    toast?.show();
  }

  window.NextMove = { deleteGoal };
})();
