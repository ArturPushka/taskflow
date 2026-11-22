// =====================================
// TASKFLOW
// =====================================

const TASK_KEY = "taskflow_tasks";
const PROJECT_KEY = "taskflow_projects";

function loadData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

let tasks = loadData(TASK_KEY);
let projects = loadData(PROJECT_KEY);

let selectedDate = getDateString(new Date());
let calendarDate = new Date();
let currentDetailsTaskId = null;
let selectedProjectFilter = null;

const $ = id => document.getElementById(id);

const pageNames = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    projects: "Projects",
    calendar: "Calendar",
    statistics: "Statistics",
    settings: "Settings"
};


// =====================================
// DATE FUNCTIONS
// =====================================

function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "No deadline";

    const date = new Date(dateString + "T12:00:00");

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function formatHistoryDate(dateString) {
    return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function isOverdue(task) {
    return Boolean(
        task.date &&
        !task.completed &&
        task.date < getDateString(new Date())
    );
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// =====================================
// TASK DATA COMPATIBILITY
// =====================================

// Older tasks receive default values.
// Their IDs and existing information stay unchanged.

function prepareTasks() {
    let changed = false;

    tasks.forEach(task => {
        if (typeof task.description !== "string") {
            task.description = "";
            changed = true;
        }

        if (!["Low", "Medium", "High"].includes(task.priority)) {
            task.priority = "Medium";
            changed = true;
        }

        if (!Array.isArray(task.history)) {
            task.history = [{
                text: "Task added to TaskFlow",
                date: new Date().toISOString()
            }];
            changed = true;
        }
    });

    if (changed) saveTasks();
}

function addHistory(task, message) {
    if (!Array.isArray(task.history)) {
        task.history = [];
    }

    task.history.unshift({
        text: message,
        date: new Date().toISOString()
    });
}


// =====================================
// SAVE DATA
// =====================================

function saveTasks() {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}

function saveProjects() {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(projects));
}


// =====================================
// NAVIGATION
// =====================================

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const page = $(pageName + "Page");

    if (!page) return;

    page.classList.add("active-page");

    document.querySelectorAll(".menu a").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    $("pageTitle").textContent = pageNames[pageName] || "TaskFlow";

    if (pageName === "dashboard") renderDashboard();
    if (pageName === "tasks") renderTasks();
    if (pageName === "projects") renderProjects();
    if (pageName === "calendar") renderCalendar();
    if (pageName === "statistics") renderStatistics();
}

document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        selectedProjectFilter = null;
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-open-page]").forEach(button => {
    button.addEventListener("click", () => {
        selectedProjectFilter = null;
        showPage(button.dataset.openPage);
    });
});


// =====================================
// TASK CREATION MODAL
// =====================================

function openTaskModal(date = "") {
    $("taskModal").style.display = "flex";

    $("taskName").value = "";
    $("taskDescription").value = "";
    $("taskCategory").value = "Development";
    $("taskPriority").value = "Medium";
    $("taskDate").value = date;

    updateProjectOptions();

    $("taskProject").value = "";

    $("taskName").focus();
}

function closeTaskModal() {
    $("taskModal").style.display = "none";
}

$("addTaskBtn").addEventListener("click", () => openTaskModal());
$("addTaskBtn2").addEventListener("click", () => openTaskModal());

$("quickAddTask").addEventListener("click", () => openTaskModal());

$("quickProjects").addEventListener("click", () => {
    selectedProjectFilter = null;
    showPage("projects");
});

$("calendarAddTask").addEventListener("click", () => {
    openTaskModal(selectedDate);
});

$("closeTaskModal").addEventListener("click", closeTaskModal);
$("cancelTaskBtn").addEventListener("click", closeTaskModal);

$("saveTaskBtn").addEventListener("click", () => {
    const name = $("taskName").value.trim();

    if (!name) {
        alert("Please enter a task name.");
        return;
    }

    const task = {
        id: Date.now(),
        name,
        description: $("taskDescription").value.trim(),
        category: $("taskCategory").value,
        priority: $("taskPriority").value,
        projectId: $("taskProject").value
            ? Number($("taskProject").value)
            : null,
        date: $("taskDate").value,
        completed: false,
        history: [{
            text: "Task created",
            date: new Date().toISOString()
        }]
    };

    tasks.unshift(task);

    saveTasks();
    closeTaskModal();
    refreshApp();

    if ($("calendarPage").classList.contains("active-page")) {
        selectedDate = task.date || selectedDate;
        renderCalendar();
    }
});


// =====================================
// PROJECT MODAL
// =====================================

function openProjectModal() {
    $("projectModal").style.display = "flex";
    $("projectName").value = "";
    $("projectDescription").value = "";
    $("projectName").focus();
}

function closeProjectModal() {
    $("projectModal").style.display = "none";
}

$("addProjectBtn").addEventListener("click", openProjectModal);
$("closeProjectModal").addEventListener("click", closeProjectModal);
$("cancelProjectBtn").addEventListener("click", closeProjectModal);

$("saveProjectBtn").addEventListener("click", () => {
    const name = $("projectName").value.trim();

    if (!name) {
        alert("Please enter a project name.");
        return;
    }

    projects.push({
        id: Date.now(),
        name,
        description: $("projectDescription").value.trim()
    });

    saveProjects();
    closeProjectModal();
    refreshApp();
});


// =====================================
// PROJECT OPTIONS
// =====================================

function updateProjectOptions() {
    const options = `
        <option value="">No project</option>
        ${projects.map(project => `
            <option value="${project.id}">
                ${escapeHTML(project.name)}
            </option>
        `).join("")}
    `;

    $("taskProject").innerHTML = options;
    $("detailsProject").innerHTML = options;
}


// =====================================
// TASK ACTIONS
// =====================================

function toggleTask(id) {
    const task = tasks.find(item => String(item.id) === String(id));

    if (!task) return;

    task.completed = !task.completed;

    addHistory(
        task,
        task.completed ? "Task marked as completed" : "Task reopened"
    );

    saveTasks();
    refreshApp();

    if (currentDetailsTaskId !== null &&
        String(currentDetailsTaskId) === String(id)) {
        renderTaskDetails(task);
    }
}

function deleteTask(id) {
    const confirmed = confirm("Delete this task?");

    if (!confirmed) return;

    tasks = tasks.filter(item => String(item.id) !== String(id));

    if (String(currentDetailsTaskId) === String(id)) {
        closeDetailsModal();
    }

    saveTasks();
    refreshApp();
}


// =====================================
// TASK DETAILS
// =====================================

function openTaskDetails(id) {
    const task = tasks.find(item => String(item.id) === String(id));

    if (!task) return;

    currentDetailsTaskId = task.id;

    updateProjectOptions();
    renderTaskDetails(task);

    $("detailsModal").style.display = "flex";
}

function closeDetailsModal() {
    $("detailsModal").style.display = "none";
    currentDetailsTaskId = null;
}

function renderTaskDetails(task) {
    $("detailsHeading").textContent = "Task Details";

    $("detailsName").value = task.name || "";
    $("detailsDescription").value = task.description || "";
    $("detailsCategory").value = task.category || "General";
    $("detailsPriority").value = task.priority || "Medium";
    $("detailsDate").value = task.date || "";

    updateProjectOptions();

    $("detailsProject").value = task.projectId
        ? String(task.projectId)
        : "";

    $("detailsStatusText").textContent = task.completed
        ? "Completed"
        : isOverdue(task)
            ? "Overdue"
            : "In progress";

    $("detailsToggleStatus").textContent = task.completed
        ? "↻ Reopen task"
        : "✓ Mark completed";

    renderTaskHistory(task);
}

function renderTaskHistory(task) {
    const history = Array.isArray(task.history)
        ? task.history
        : [];

    $("taskHistory").innerHTML = history.length
        ? history.map(entry => `
            <div class="history-entry">
                <p>${escapeHTML(entry.text)}</p>
                <small>${formatHistoryDate(entry.date)}</small>
            </div>
        `).join("")
        : '<p class="muted">No activity recorded yet.</p>';
}


// Save changes from details modal

$("saveDetailsBtn").addEventListener("click", () => {
    const task = tasks.find(
        item => String(item.id) === String(currentDetailsTaskId)
    );

    if (!task) return;

    const newName = $("detailsName").value.trim();

    if (!newName) {
        alert("Task name cannot be empty.");
        return;
    }

    const newDescription = $("detailsDescription").value.trim();
    const newCategory = $("detailsCategory").value;
    const newPriority = $("detailsPriority").value;
    const newDate = $("detailsDate").value;
    const newProjectId = $("detailsProject").value
        ? Number($("detailsProject").value)
        : null;

    const changes = [];

    if (task.name !== newName) {
        changes.push("Task name updated");
    }

    if ((task.description || "") !== newDescription) {
        changes.push("Description updated");
    }

    if ((task.category || "General") !== newCategory) {
        changes.push("Category changed to " + newCategory);
    }

    if ((task.priority || "Medium") !== newPriority) {
        changes.push("Priority changed to " + newPriority);
    }

    if ((task.date || "") !== newDate) {
        changes.push("Deadline updated");
    }

    if (String(task.projectId || "") !== String(newProjectId || "")) {
        changes.push("Project assignment updated");
    }

    task.name = newName;
    task.description = newDescription;
    task.category = newCategory;
    task.priority = newPriority;
    task.date = newDate;
    task.projectId = newProjectId;

    changes.forEach(change => addHistory(task, change));

    if (changes.length) {
        saveTasks();
        refreshApp();
        renderTaskDetails(task);
        alert("Task changes saved!");
    } else {
        alert("No changes to save.");
    }
});


// Toggle task status inside details

$("detailsToggleStatus").addEventListener("click", () => {
    const task = tasks.find(
        item => String(item.id) === String(currentDetailsTaskId)
    );

    if (!task) return;

    task.completed = !task.completed;

    addHistory(
        task,
        task.completed ? "Task marked as completed" : "Task reopened"
    );

    saveTasks();
    refreshApp();
    renderTaskDetails(task);
});


// Delete task from details

$("detailsDeleteTask").addEventListener("click", () => {
    if (currentDetailsTaskId === null) return;

    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    tasks = tasks.filter(
        task => String(task.id) !== String(currentDetailsTaskId)
    );

    saveTasks();
    closeDetailsModal();
    refreshApp();
});

$("closeDetailsModal").addEventListener("click", closeDetailsModal);
$("cancelDetailsBtn").addEventListener("click", closeDetailsModal);


// =====================================
// GLOBAL TASK BUTTON HANDLING
// =====================================

document.addEventListener("click", event => {
    const completeButton = event.target.closest("[data-complete]");
    const deleteButton = event.target.closest("[data-delete]");
    const detailsButton = event.target.closest("[data-open-task]");

    if (completeButton) {
        toggleTask(completeButton.dataset.complete);
    }

    if (deleteButton) {
        deleteTask(deleteButton.dataset.delete);
    }

    if (detailsButton) {
        openTaskDetails(detailsButton.dataset.openTask);
    }
});


// =====================================
// TASK HTML
// =====================================

function taskHTML(task) {
    const project = projects.find(
        item => String(item.id) === String(task.projectId)
    );

    let status = "";

    if (task.completed) {
        status = "Completed";
    } else if (isOverdue(task)) {
        status = "Overdue";
    } else {
        status = "In progress";
    }

    const priority = task.priority || "Medium";
    const priorityClass = "priority-" + priority.toLowerCase();

    return `
        <div class="task ${task.completed ? "done" : ""}">
            <div class="task-info">
                <button
                    class="task-name-button"
                    data-open-task="${escapeHTML(task.id)}">
                    ${escapeHTML(task.name)}
                </button>

                <small>
                    ${escapeHTML(task.category || "General")}
                    · ${formatDate(task.date)}
                    ${project ? " · " + escapeHTML(project.name) : ""}
                </small>

                <span class="priority-badge ${priorityClass}">
                    ${priority} priority
                </span>

                ${isOverdue(task)
                    ? '<span class="overdue-label">Overdue</span>'
                    : ""}
            </div>

            <div class="task-actions">
                <span class="tag">${status}</span>

                <button
                    class="task-details-button"
                    data-open-task="${escapeHTML(task.id)}">
                    Details
                </button>

                <button
                    class="complete-button"
                    data-complete="${escapeHTML(task.id)}">
                    ${task.completed ? "Undo" : "✓"}
                </button>

                <button
                    class="delete-button"
                    data-delete="${escapeHTML(task.id)}">
                    ✕
                </button>
            </div>
        </div>
    `;
}


// =====================================
// DASHBOARD ANIMATION
// =====================================

function animateDashboardNumber(element, target) {
    if (!element) return;

    const start = Number(element.dataset.currentValue || 0);
    const duration = 550;
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        element.textContent = Math.round(
            start + (target - start) * eased
        );

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            element.dataset.currentValue = String(target);
        }
    }

    requestAnimationFrame(frame);
}


// =====================================
// DASHBOARD
// =====================================

function renderDashboard() {
    const completed = tasks.filter(task => task.completed).length;
    const overdue = tasks.filter(isOverdue).length;
    const active = tasks.length - completed;

    animateDashboardNumber($("totalTasks"), tasks.length);
    animateDashboardNumber($("completedTasks"), completed);
    animateDashboardNumber($("progressTasks"), active);
    animateDashboardNumber($("overdueTasks"), overdue);

    const hour = new Date().getHours();

    const greeting = hour < 12
        ? "Good morning"
        : hour < 18
            ? "Good afternoon"
            : "Good evening";

    $("welcomeTitle").textContent = `${greeting} 👋`;

    $("welcomeSubtitle").textContent = tasks.length
        ? "A little progress every day adds up. Keep going."
        : "Your next achievement starts with one small task.";

    const rate = tasks.length
        ? Math.round(completed / tasks.length * 100)
        : 0;

    $("dailyProgressPercent").textContent = rate + "%";
    $("dailyProgressFill").style.width = rate + "%";

    $("dailyProgressText").textContent = tasks.length
        ? (rate === 100
            ? "All tasks completed. Excellent work!"
            : "Keep your momentum going.")
        : "Start by creating your first task.";

    $("dailyCompletedText").textContent = `${completed} completed`;
    $("dailyRemainingText").textContent = `${active} remaining`;

    const recentTasks = tasks.slice(0, 5);

    $("dashboardTaskList").innerHTML = recentTasks.length
        ? recentTasks.map(taskHTML).join("")
        : '<div class="empty-message">No tasks yet. Create your first task!</div>';

    const upcoming = tasks
        .filter(task => task.date && !task.completed)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);

    $("upcomingList").innerHTML = upcoming.length
        ? upcoming.map(task => `
            <div class="upcoming-item">
                <div>
                    <button
                        class="task-name-button"
                        data-open-task="${escapeHTML(task.id)}">
                        ${escapeHTML(task.name)}
                    </button>
                    <small>${formatDate(task.date)}</small>
                </div>

                <span class="${isOverdue(task) ? "overdue-label" : "tag"}">
                    ${isOverdue(task) ? "Overdue" : "Upcoming"}
                </span>
            </div>
        `).join("")
        : '<div class="empty-message">No upcoming deadlines.</div>';
}


// =====================================
// ALL TASKS
// =====================================

function renderTasks() {
    const search = $("taskSearch").value.toLowerCase();
    const filter = $("taskFilter").value;

    let filtered = tasks.filter(task =>
        task.name.toLowerCase().includes(search)
    );

    if (selectedProjectFilter !== null) {
        filtered = filtered.filter(
            task => String(task.projectId) === String(selectedProjectFilter)
        );
    }

    if (filter === "active") {
        filtered = filtered.filter(task => !task.completed);
    }

    if (filter === "completed") {
        filtered = filtered.filter(task => task.completed);
    }

    if (filter === "overdue") {
        filtered = filtered.filter(isOverdue);
    }

    $("allTaskList").innerHTML = filtered.length
        ? filtered.map(taskHTML).join("")
        : '<div class="empty-message">No matching tasks found.</div>';
}

$("taskSearch").addEventListener("input", renderTasks);

$("taskFilter").addEventListener("change", renderTasks);


// =====================================
// PROJECTS
// =====================================

function renderProjects() {
    $("totalProjects").textContent = projects.length;

    const projectTaskCount = tasks.filter(task => task.projectId).length;

    $("projectTasks").textContent = projectTaskCount;

    if (!projects.length) {
        $("projectsList").innerHTML =
            '<div class="empty-message">No projects yet. Create your first project!</div>';
        return;
    }

    $("projectsList").innerHTML = projects.map(project => {
        const projectTasks = tasks.filter(
            task => String(task.projectId) === String(project.id)
        );

        const completed = projectTasks.filter(
            task => task.completed
        ).length;

        const progress = projectTasks.length
            ? Math.round(completed / projectTasks.length * 100)
            : 0;

        return `
            <div class="project-card">
                <div class="project-icon">▣</div>

                <h3>${escapeHTML(project.name)}</h3>

                <p>${escapeHTML(project.description || "No description")}</p>

                <div class="progress-info">
                    <span>${completed} of ${projectTasks.length} completed</span>
                    <span>${progress}%</span>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>

                <div class="project-bottom">
                    <button data-view-project="${project.id}">View tasks</button>
                    <button class="project-delete" data-delete-project="${project.id}">Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view-project]");
    const deleteButton = event.target.closest("[data-delete-project]");

    if (viewButton) {
        selectedProjectFilter = viewButton.dataset.viewProject;

        $("taskSearch").value = "";
        $("taskFilter").value = "all";

        showPage("tasks");
    }

    if (deleteButton) {
        const confirmed = confirm(
            "Delete this project? Its tasks will remain in your task list."
        );

        if (!confirmed) return;

        const projectId = deleteButton.dataset.deleteProject;

        projects = projects.filter(
            project => String(project.id) !== String(projectId)
        );

        tasks.forEach(task => {
            if (String(task.projectId) === String(projectId)) {
                task.projectId = null;
                addHistory(task, "Project assignment removed");
            }
        });

        saveProjects();
        saveTasks();
        refreshApp();
    }
});


// =====================================
// CALENDAR
// =====================================

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    $("calendarMonth").textContent = calendarDate.toLocaleDateString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

    const weekdays = [
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    ];

    const firstDay = new Date(year, month, 1);

    const startingDay = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = weekdays.map(day => `
        <div class="calendar-weekday">${day}</div>
    `).join("");

    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = getDateString(
            new Date(year, month, day)
        );

        const dayTasks = tasks.filter(task => task.date === date);

        const isToday = date === getDateString(new Date());
        const isSelected = date === selectedDate;

        let classes = "calendar-day";

        if (isToday) classes += " today";
        if (isSelected) classes += " selected";

        const hasOverdue = dayTasks.some(isOverdue);
        const hasCompleted = dayTasks.some(task => task.completed);
        const hasActive = dayTasks.some(task => !task.completed);

        let dots = "";

        if (hasOverdue) {
            dots += '<i class="day-dot red-dot"></i>';
        }

        if (hasCompleted) {
            dots += '<i class="day-dot green-dot"></i>';
        }

        if (hasActive) {
            dots += '<i class="day-dot purple-dot"></i>';
        }

        html += `
            <button class="${classes}" data-date="${date}">
                <span class="day-number">${day}</span>
                <span class="day-dots">${dots}</span>
            </button>
        `;
    }

    $("calendarGrid").innerHTML = html;

    renderSelectedDateTasks();
}


// =====================================
// SELECT CALENDAR DAY
// =====================================

$("calendarGrid").addEventListener("click", event => {
    const dayButton = event.target.closest("[data-date]");

    if (!dayButton) return;

    selectedDate = dayButton.dataset.date;

    renderCalendar();
});


// =====================================
// SELECTED DATE TASKS
// =====================================

function renderSelectedDateTasks() {
    const dayTasks = tasks.filter(
        task => task.date === selectedDate
    );

    const date = new Date(selectedDate + "T12:00:00");

    $("selectedDateTitle").textContent = date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    );

    const completed = dayTasks.filter(
        task => task.completed
    ).length;

    const active = dayTasks.length - completed;

    $("daySummary").innerHTML = `
        <span class="summary-chip">${dayTasks.length} total</span>
        <span class="summary-chip">${completed} completed</span>
        <span class="summary-chip">${active} active</span>
    `;

    if (!dayTasks.length) {
        $("selectedDateTasks").innerHTML = `
            <div class="empty-message">
                No tasks for this day.<br>
                Add a task to plan your day!
            </div>
        `;
        return;
    }

    $("selectedDateTasks").innerHTML = dayTasks.map(task => `
        <div class="calendar-task ${task.completed ? "done" : ""}">
            <button
                class="task-name-button"
                data-open-task="${escapeHTML(task.id)}">
                ${escapeHTML(task.name)}
            </button>

            <small>
                ${escapeHTML(task.category || "General")}
                · ${task.completed ? "Completed" : "In progress"}
            </small>

            <div class="task-actions">
                <button
                    class="task-details-button"
                    data-open-task="${escapeHTML(task.id)}">
                    Details
                </button>

                <button
                    class="complete-button"
                    data-complete="${escapeHTML(task.id)}">
                    ${task.completed ? "Undo" : "✓ Complete"}
                </button>

                <button
                    class="delete-button"
                    data-delete="${escapeHTML(task.id)}">
                    Delete
                </button>
            </div>
        </div>
    `).join("");
}


// =====================================
// CALENDAR NAVIGATION
// =====================================

$("prevMonth").addEventListener("click", () => {
    calendarDate = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() - 1,
        1
    );

    renderCalendar();
});

$("nextMonth").addEventListener("click", () => {
    calendarDate = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        1
    );

    renderCalendar();
});

$("goToday").addEventListener("click", () => {
    calendarDate = new Date();
    selectedDate = getDateString(new Date());

    renderCalendar();
});


// =====================================
// STATISTICS
// =====================================

function renderStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const overdue = tasks.filter(isOverdue).length;

    const rate = total
        ? Math.round(completed / total * 100)
        : 0;

    $("statsTotal").textContent = total;
    $("statsCompleted").textContent = completed;
    $("completionRate").textContent = rate + "%";
    $("statsOverdue").textContent = overdue;

    $("statisticsProgress").style.width = rate + "%";

    $("statisticsCaption").textContent = total
        ? `${completed} of ${total} tasks completed.`
        : "No tasks yet.";
}


// =====================================
// REFRESH APP
// =====================================

function refreshApp() {
    renderDashboard();
    renderTasks();
    renderProjects();
    renderStatistics();
    updateProjectOptions();

    if ($("calendarPage").classList.contains("active-page")) {
        renderCalendar();
    }
}


// =====================================
// SETTINGS
// =====================================

$("clearDataBtn").addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure? This will permanently delete all tasks and projects saved in this browser."
    );

    if (!confirmed) return;

    tasks = [];
    projects = [];

    saveTasks();
    saveProjects();

    refreshApp();
    showPage("dashboard");
});


// =====================================
// CLOSE MODALS OUTSIDE
// =====================================

$("taskModal").addEventListener("click", event => {
    if (event.target === $("taskModal")) {
        closeTaskModal();
    }
});

$("projectModal").addEventListener("click", event => {
    if (event.target === $("projectModal")) {
        closeProjectModal();
    }
});

$("detailsModal").addEventListener("click", event => {
    if (event.target === $("detailsModal")) {
        closeDetailsModal();
    }
});


// =====================================
// KEYBOARD SHORTCUTS
// =====================================

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeTaskModal();
        closeProjectModal();
        closeDetailsModal();
    }
});


// =====================================
// INITIALIZE APP
// =====================================

prepareTasks();

$("todayLabel").textContent = new Date().toLocaleDateString(
    "en-US",
    {
        weekday: "long",
        month: "long",
        day: "numeric"
    }
);

refreshApp();
renderCalendar();
showPage("dashboard");