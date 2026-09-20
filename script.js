let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");

const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");

const search = document.getElementById("search");
const filter = document.getElementById("filter");

const themeBtn = document.getElementById("themeBtn");

const calendarDate = document.getElementById("calendarDate");
const calendarTasks = document.getElementById("calendarTasks");

const weeklyProgress = document.getElementById("weeklyProgress");
const weeklyProgressText = document.getElementById("weeklyProgressText");


// ADD TASK
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const priority = document.getElementById("priority").value;
    const dueDate = document.getElementById("dueDate").value;

    const newTask = {
        id: Date.now(),
        title: title,
        subject: subject,
        priority: priority,
        dueDate: dueDate,
        completed: false
    };

    tasks.push(newTask);

    saveTasks();

    taskForm.reset();

    displayTasks();
    displayCalendarTasks();
    updateWeeklyProgress();
});


// SAVE TASKS
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


// DISPLAY TASKS
function displayTasks() {

    const searchText = search.value.toLowerCase();
    const filterValue = filter.value;

    let filteredTasks = tasks.filter(function (task) {

        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            task.subject.toLowerCase().includes(searchText);

        let matchesFilter = true;

        if (filterValue === "pending") {
            matchesFilter = !task.completed;
        }

        if (filterValue === "completed") {
            matchesFilter = task.completed;
        }

        if (filterValue === "high") {
            matchesFilter = task.priority === "High";
        }

        return matchesSearch && matchesFilter;
    });

    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty">
                📚 No tasks found!
            </div>
        `;

        updateStats();
        return;
    }

    filteredTasks.forEach(function (task) {

        const taskElement = document.createElement("div");

        taskElement.className =
            "task " + (task.completed ? "completed" : "");

        taskElement.innerHTML = `
            <div class="task-header">

                <div class="task-title">
                    ${task.title}
                </div>

                <div>
                    ${task.completed ? "✅" : "⏳"}
                </div>

            </div>

            <div class="task-info">
                Subject: ${task.subject}
            </div>

            <div class="task-info">
                Due Date: ${task.dueDate}
            </div>

            <span class="priority ${task.priority.toLowerCase()}">
                ${task.priority}
            </span>

            <div class="task-buttons">

                <button
                    class="complete-btn"
                    onclick="toggleTask(${task.id})">
                    ${task.completed ? "Undo" : "Complete"}
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </div>
        `;

        taskList.appendChild(taskElement);
    });

    updateStats();
}


// COMPLETE / UNDO
function toggleTask(id) {

    tasks = tasks.map(function (task) {

        if (task.id === id) {
            task.completed = !task.completed;
        }

        return task;
    });

    saveTasks();

    displayTasks();
    displayCalendarTasks();
    updateWeeklyProgress();
}


// DELETE
function deleteTask(id) {

    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });

    saveTasks();

    displayTasks();
    displayCalendarTasks();
    updateWeeklyProgress();
}


// UPDATE STATS
function updateStats() {

    const total = tasks.length;

    const completed =
        tasks.filter(function (task) {
            return task.completed;
        }).length;

    const pending = total - completed;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;

    let percentage = 0;

    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    progress.style.width = percentage + "%";

    progressText.textContent =
        percentage + "% Completed";
}


// SEARCH
search.addEventListener("input", displayTasks);


// FILTER
filter.addEventListener("change", displayTasks);


// DARK MODE
themeBtn.addEventListener("click", function () {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeBtn.textContent = "☀️ Light Mode";
    } else {
        themeBtn.textContent = "🌙 Dark Mode";
    }
});


// CALENDAR
function displayCalendarTasks() {

    const selectedDate = calendarDate.value;

    if (!selectedDate) {
        calendarTasks.innerHTML = "";
        return;
    }

    const dateTasks = tasks.filter(function (task) {
        return task.dueDate === selectedDate;
    });

    calendarTasks.innerHTML = "";

    if (dateTasks.length === 0) {

        calendarTasks.innerHTML =
            "<p>📚 No tasks for this date.</p>";

        return;
    }

    dateTasks.forEach(function (task) {

        const taskElement = document.createElement("div");

        taskElement.innerHTML = `
            <p>
                ${task.completed ? "✅" : "⏳"}
                <strong>${task.title}</strong>
                - ${task.subject}
            </p>
        `;

        calendarTasks.appendChild(taskElement);
    });
}


// CALENDAR DATE CHANGE
calendarDate.addEventListener(
    "change",
    displayCalendarTasks
);


// WEEKLY PROGRESS
function updateWeeklyProgress() {

    const today = new Date();

    const day = today.getDay();

    const monday = new Date(today);

    monday.setDate(
        today.getDate() - (day === 0 ? 6 : day - 1)
    );

    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);

    sunday.setDate(monday.getDate() + 6);

    sunday.setHours(23, 59, 59, 999);

    const weekTasks = tasks.filter(function (task) {

        const taskDate = new Date(task.dueDate);

        return taskDate >= monday && taskDate <= sunday;
    });

    const completed = weekTasks.filter(function (task) {
        return task.completed;
    }).length;

    const total = weekTasks.length;

    let percentage = 0;

    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    weeklyProgress.style.width = percentage + "%";

    weeklyProgressText.textContent =
        percentage + "% This Week";
}
// REMINDERS
function updateReminder() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const reminderTasks = tasks.filter(function (task) {

        const [year, month, day] = task.dueDate.split("-").map(Number);
        const taskDate = new Date(year, month - 1, day);

        return !task.completed && taskDate <= tomorrow;
    });

    if (reminderTasks.length === 0) {

        document.getElementById("reminderText").textContent =
            "✅ No pending reminders.";

        return;
    }

    document.getElementById("reminderText").textContent =
        "🔔 You have " + reminderTasks.length +
        " pending task(s) due today or tomorrow.";
}
// STUDY ANALYTICS
function updateAnalytics() {

    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return task.completed;
    }).length;

    const pending = total - completed;

    document.getElementById("analyticsText").textContent =
        "📚 Total: " + total +
        " | ✅ Completed: " + completed +
        " | ⏳ Pending: " + pending;
}
// AUTHENTICATION
const authScreen = document.getElementById("authScreen");
const plannerApp = document.getElementById("plannerApp");
const authForm = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const nameField = document.getElementById("nameField");
const termsRow = document.getElementById("termsRow");
const forgotPassword = document.getElementById("forgotPassword");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileAvatar = document.getElementById("profileAvatar");
const logoutBtn = document.getElementById("logoutBtn");
let authMode = "login";

function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";
    loginTab.classList.toggle("active", !isSignup);
    signupTab.classList.toggle("active", isSignup);
    loginTab.setAttribute("aria-selected", String(!isSignup));
    signupTab.setAttribute("aria-selected", String(isSignup));
    nameField.hidden = !isSignup;
    termsRow.hidden = !isSignup;
    forgotPassword.hidden = isSignup;
    authTitle.textContent = isSignup ? "Create your account" : "Welcome back";
    authSubtitle.textContent = isSignup
        ? "Start building better study habits today."
        : "Sign in to continue your study journey.";
    authSubmit.innerHTML = isSignup
        ? "Create account <span>→</span>"
        : "Log in <span>→</span>";
    authMessage.textContent = "";
}

function showPlanner() {
    const account = JSON.parse(localStorage.getItem("studyPlannerAccount"));

    if (!account || !account.email) {
        authMessage.textContent = "Please create an account or log in first.";
        return;
    }

    const displayName = account.name || account.email.split("@")[0];
    profileName.textContent = displayName;
    profileEmail.textContent = account.email;
    profileAvatar.textContent = displayName.charAt(0).toUpperCase();
    authScreen.hidden = true;
    plannerApp.hidden = false;
}

loginTab.addEventListener("click", function () {
    setAuthMode("login");
});

signupTab.addEventListener("click", function () {
    setAuthMode("signup");
});

forgotPassword.addEventListener("click", function () {
    authMessage.textContent = "Password reset is not available in this demo.";
});

authForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("authName").value.trim();
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const password = document.getElementById("authPassword").value;
    const savedAccount = JSON.parse(localStorage.getItem("studyPlannerAccount"));

    if (authMode === "signup") {
        if (name === "") {
            authMessage.textContent = "Please enter your name.";
            return;
        }
        if (!document.getElementById("terms").checked) {
            authMessage.textContent = "Please accept the terms to continue.";
            return;
        }
        localStorage.setItem("studyPlannerAccount", JSON.stringify({
            name: name,
            email: email,
            password: password
        }));
    } else if (!savedAccount || savedAccount.email !== email || savedAccount.password !== password) {
        authMessage.textContent = "That email or password is incorrect.";
        return;
    }

    localStorage.setItem("userEmail", email);
    showPlanner();
});

logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("userEmail");
    plannerApp.hidden = true;
    authScreen.hidden = false;
    authForm.reset();
    setAuthMode("login");
});

// START
displayTasks();
updateWeeklyProgress();
updateReminder();
updateAnalytics();