let tasks = JSON.parse(localStorage.getItem("studyPlannerTasks") || "[]");
let authMode = "login";
let timerType = "focus";
let timerSeconds = 1500;
let timerRunning = false;
let timerId = null;
let completedSessions = 0;

const $ = (id) => document.getElementById(id);
const authScreen = $("authScreen");
const plannerApp = $("plannerApp");
const authForm = $("authForm");
const authMessage = $("authMessage");
const authSubmit = $("authSubmit");
const nameField = $("nameField");
const termsRow = $("termsRow");
const forgotPassword = $("forgotPassword");
const backToLogin = $("backToLogin");
const loginTab = $("loginTab");
const signupTab = $("signupTab");
const themeBtn = $("themeBtn");
const settingsToggle = $("settingsToggle");
const settingsPanel = $("settingsPanel");
const customizeBtn = $("customizeBtn");
const customizePanel = $("customizePanel");
const togglePassword = $("togglePassword");

function saveTasks() {
    localStorage.setItem("studyPlannerTasks", JSON.stringify(tasks));
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";
    const reset = mode === "reset";
    loginTab.hidden = reset;
    signupTab.hidden = reset;
    loginTab.classList.toggle("active", !signup && !reset);
    signupTab.classList.toggle("active", signup);
    nameField.hidden = !signup;
    termsRow.hidden = !signup;
    forgotPassword.hidden = signup || reset;
    backToLogin.hidden = !reset;
    $("authTitle").textContent = signup ? "Create your account" : reset ? "Reset your password" : "Welcome back";
    $("authSubtitle").textContent = signup
        ? "Start building better study habits today."
        : reset ? "Choose a new password for your account." : "Sign in to continue your study journey.";
    $("passwordLabel").textContent = reset ? "New password" : "Password";
    authSubmit.innerHTML = signup ? "Create account <span>→</span>" : reset ? "Reset password <span>→</span>" : "Log in <span>→</span>";
    authMessage.textContent = "";
}

function showPlanner(user) {
    $("profileName").textContent = user.name;
    $("profileEmail").textContent = user.email;
    $("profileAvatar").textContent = user.name.charAt(0).toUpperCase();
    authScreen.hidden = true;
    plannerApp.hidden = false;
    displayTasks();
}

function getAccount() {
    return JSON.parse(localStorage.getItem("studyPlannerAccount") || "null");
}

loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));
forgotPassword.addEventListener("click", () => {
    authForm.reset();
    setAuthMode("reset");
});

togglePassword.addEventListener("click", () => {
    const isVisible = $("authPassword").type === "text";
    $("authPassword").type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Show" : "Hide";
    togglePassword.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
});
backToLogin.addEventListener("click", () => {
    authForm.reset();
    setAuthMode("login");
});

authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("authName").value.trim();
    const email = $("authEmail").value.trim().toLowerCase();
    const password = $("authPassword").value;
    const account = getAccount();

    if (authMode === "signup") {
        if (!name) {
            authMessage.textContent = "Please enter your name.";
            return;
        }
        if (!$("terms").checked) {
            authMessage.textContent = "Please accept the terms to continue.";
            return;
        }
        localStorage.setItem("studyPlannerAccount", JSON.stringify({ name, email, password }));
        showPlanner({ name, email });
    } else if (authMode === "reset") {
        if (!account || account.email !== email) {
            authMessage.textContent = "No account found with this email.";
            return;
        }
        if (password.length < 6) {
            authMessage.textContent = "Password must be at least 6 characters.";
            return;
        }
        localStorage.setItem("studyPlannerAccount", JSON.stringify({ ...account, password }));
        setAuthMode("login");
        authMessage.textContent = "Password reset successfully. Please log in.";
    } else {
        if (!account || account.email !== email || account.password !== password) {
            authMessage.textContent = "That email or password is incorrect.";
            return;
        }
        showPlanner(account);
    }
});

$("logoutBtn").addEventListener("click", () => {
    plannerApp.hidden = true;
    authScreen.hidden = false;
    authForm.reset();
    setAuthMode("login");
});

function displayTasks() {
    const search = $("search").value.toLowerCase();
    const filter = $("filter").value;
    const visible = tasks.filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(search) || task.subject.toLowerCase().includes(search);
        const matchesFilter = filter === "all" || (filter === "pending" && !task.completed) ||
            (filter === "completed" && task.completed) || (filter === "high" && task.priority === "High");
        return matchesSearch && matchesFilter;
    });

    $("taskList").innerHTML = visible.length ? visible.map((task) => `
        <article class="task ${task.completed ? "completed" : ""}">
            <div class="task-header"><strong class="task-title">${escapeHtml(task.title)}</strong><span>${task.completed ? "✅" : "⏳"}</span></div>
            <p class="task-info">Subject: ${escapeHtml(task.subject)}</p>
            <p class="task-info">Due date: ${task.dueDate}</p>
            <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
            <div class="task-buttons">
                <button class="complete-btn" data-action="toggle" data-id="${task.id}">${task.completed ? "Undo" : "Complete"}</button>
                <button class="delete-btn" data-action="delete" data-id="${task.id}">Delete</button>
            </div>
        </article>`).join("") : '<div class="empty">📚 No tasks found!</div>';
    updateStats();
    updateAiSuggestion();
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

function updateStats() {
    const completed = tasks.filter((task) => task.completed).length;
    $("totalTasks").textContent = tasks.length;
    $("completedTasks").textContent = completed;
    $("pendingTasks").textContent = tasks.length - completed;
    const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    $("progress").style.width = percent + "%";
    $("progressText").textContent = percent + "% completed";
    $("analyticsText") && ($("analyticsText").textContent = `Total: ${tasks.length} | Completed: ${completed} | Pending: ${tasks.length - completed}`);
}

$("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    tasks.push({
        id: Date.now().toString(),
        title: $("taskTitle").value.trim(),
        subject: $("subject").value.trim(),
        priority: $("priority").value,
        dueDate: $("dueDate").value,
        completed: false
    });
    saveTasks();
    event.target.reset();
    displayTasks();
    updateWeeklyProgress();
});

$("taskList").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === "toggle") {
        tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
    } else {
        tasks = tasks.filter((task) => task.id !== id);
    }
    saveTasks();
    displayTasks();
    updateWeeklyProgress();
});

$("search").addEventListener("input", displayTasks);
$("filter").addEventListener("change", displayTasks);

function updateWeeklyProgress() {
    const week = tasks.filter((task) => {
        const date = new Date(task.dueDate);
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (now.getDay() || 7) + 1);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 7);
        return date >= monday && date < sunday;
    });
    const done = week.filter((task) => task.completed).length;
    const percent = week.length ? Math.round(done / week.length * 100) : 0;
    $("weeklyProgress").style.width = percent + "%";
    $("weeklyProgressText").textContent = percent + "% this week";
}

function updateAiSuggestion() {
    const pending = tasks.filter((task) => !task.completed);
    const high = pending.find((task) => task.priority === "High");
    $("aiSuggestion").textContent = !pending.length
        ? "Excellent work! Add a task to receive your next study suggestion."
        : high ? `Start with "${high.title}" because it is your highest-priority task.`
            : `Focus next on "${pending[0].title}" for 25 minutes, then take a short break.`;
}

$("calendarDate").addEventListener("change", () => {
    const selected = $("calendarDate").value;
    const found = tasks.filter((task) => task.dueDate === selected);
    $("calendarTasks").innerHTML = found.length ? found.map((task) => `<p>${task.completed ? "✅" : "⏳"} <strong>${escapeHtml(task.title)}</strong> - ${escapeHtml(task.subject)}</p>`).join("") : "<p>📚 No tasks for this date.</p>";
});

$("refreshSuggestion").addEventListener("click", updateAiSuggestion);

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    themeBtn.textContent = document.body.classList.contains("dark") ? "☀️ Light mode" : "🌙 Dark mode";
});

settingsToggle.addEventListener("click", () => { settingsPanel.hidden = !settingsPanel.hidden; });
customizeBtn.addEventListener("click", () => { customizePanel.hidden = !customizePanel.hidden; });
document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => {
        document.body.classList.remove("theme-ocean", "theme-sunset", "theme-forest");
        document.body.classList.add("theme-" + button.dataset.theme);
        localStorage.setItem("dashboardTheme", button.dataset.theme);
        document.querySelectorAll(".theme-option").forEach((item) => item.classList.toggle("active", item === button));
    });
});

function renderTimer() {
    const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
    const seconds = String(timerSeconds % 60).padStart(2, "0");
    $("timerDisplay").textContent = `${minutes}:${seconds}`;
    $("timerProgress").style.width = ((1500 - timerSeconds) / (timerType === "focus" ? 1500 : 300) * 100) + "%";
    $("focusMode").textContent = timerType === "focus" ? "Focus time" : "Short break";
    $("focusSession").textContent = "Session " + (completedSessions + 1);
    $("timerStart").textContent = timerRunning ? "⏸ Pause" : "▶ Start focus";
}

$("timerStart").addEventListener("click", () => {
    timerRunning = !timerRunning;
    if (timerRunning) {
        timerId = setInterval(() => {
            timerSeconds--;
            if (timerSeconds <= 0) {
                clearInterval(timerId);
                timerRunning = false;
                if (timerType === "focus") completedSessions++;
                timerType = timerType === "focus" ? "break" : "focus";
                timerSeconds = timerType === "focus" ? 1500 : 300;
                $("focusMessage").textContent = timerType === "focus" ? "Break over. Ready for another session?" : "Great work! Take a short break.";
            }
            renderTimer();
        }, 1000);
    } else clearInterval(timerId);
    renderTimer();
});

$("timerReset").addEventListener("click", () => {
    clearInterval(timerId);
    timerRunning = false;
    timerType = "focus";
    timerSeconds = 1500;
    $("focusMessage").textContent = "Stay focused. You've got this!";
    renderTimer();
});

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️ Light mode";
}
const savedTheme = localStorage.getItem("dashboardTheme") || "ocean";
document.body.classList.add("theme-" + savedTheme);
document.querySelectorAll(".theme-option").forEach((button) => button.classList.toggle("active", button.dataset.theme === savedTheme));
renderTimer();
updateWeeklyProgress();
displayTasks();
updateAnalytics();
