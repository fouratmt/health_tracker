(function () {
  const storage = window.HealthTrackerStorage;
  const calculations = window.HealthTrackerCalculations;

  let state = storage.loadState();
  let selectedDate = calculations.getTodayISODate();

  function byId(id) {
    return document.getElementById(id);
  }

  function formatPercentage(value) {
    return `${value}%`;
  }

  function statusClass(status) {
    return `status-${status.toLowerCase().replace(/\s+/g, "-")}`;
  }

  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function normalizeTime(value) {
    return /^\d{2}:\d{2}$/.test(value || "") ? value : null;
  }

  function applyTheme(theme) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    const toggleButton = byId("theme-toggle");

    document.documentElement.dataset.theme = resolvedTheme;

    if (!toggleButton) {
      return;
    }

    const nextLabel = resolvedTheme === "dark" ? "Light mode" : "Dark mode";
    toggleButton.textContent = nextLabel;
    toggleButton.setAttribute("aria-pressed", String(resolvedTheme === "dark"));
    toggleButton.setAttribute("aria-label", `Switch to ${nextLabel.toLowerCase()}`);
    toggleButton.title = `Switch to ${nextLabel.toLowerCase()}`;
  }

  function setFeedback(id, text) {
    byId(id).textContent = text;
    window.setTimeout(function () {
      if (byId(id).textContent === text) {
        byId(id).textContent = "";
      }
    }, 3000);
  }

  function saveAndRender(nextState) {
    state = storage.saveState(nextState);
    render();
  }

  function formatDateLong(dateString) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${dateString}T00:00:00`));
  }

  function formatDateShort(dateString) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(`${dateString}T00:00:00`));
  }

  function describeScoreStatus(hasEntry, hits, total) {
    if (!hasEntry || total === 0) {
      return {
        label: "Awaiting entry",
        className: "muted-chip",
      };
    }

    const percentage = Math.round((hits / total) * 100);

    if (percentage >= 80) {
      return {
        label: "On track",
        className: "status-on-track",
      };
    }

    if (percentage >= 60) {
      return {
        label: "Slightly off track",
        className: "status-slightly-off-track",
      };
    }

    return {
      label: "Off track",
      className: "status-off-track",
    };
  }

  function setToken(id, baseClassName, label, toneClassName) {
    const element = byId(id);
    element.textContent = label;
    element.className = `${baseClassName} ${toneClassName}`;
  }

  function renderCompactList(elementId, items, emptyText) {
    const element = byId(elementId);

    if (!items.length) {
      element.innerHTML = `<li><strong>${emptyText}</strong><span></span></li>`;
      return;
    }

    element.innerHTML = items
      .map(function (item) {
        return `<li><strong>${item.title}</strong><span>${item.detail}</span></li>`;
      })
      .join("");
  }

  function renderBreakdownList(elementId, items, emptyText) {
    const element = byId(elementId);

    if (!items.length) {
      element.innerHTML = `<li><div class="list-row-head"><strong>${emptyText}</strong><span class="list-badge muted-chip">No data</span></div><span></span></li>`;
      return;
    }

    element.innerHTML = items
      .map(function (item) {
        return `
          <li>
            <div class="list-row-head">
              <strong>${item.title}</strong>
              <span class="list-badge ${item.toneClass}">${item.badge}</span>
            </div>
            <span>${item.detail}</span>
          </li>
        `;
      })
      .join("");
  }

  function buildAverage(values) {
    if (!values.length) {
      return null;
    }

    return values.reduce(function (sum, value) {
      return sum + value;
    }, 0) / values.length;
  }

  function getSelectedLog() {
    return state.logs[selectedDate] || null;
  }

  function formatBedtime(value) {
    return value || "Not logged";
  }

  function formatSleepSnapshot(entry) {
    const parts = [];

    if (typeof entry.sleepHours === "number") {
      parts.push(`${entry.sleepHours} h sleep`);
    } else {
      parts.push("No sleep duration");
    }

    if (typeof entry.sleepScore === "number") {
      parts.push(`score ${entry.sleepScore}`);
    }

    if (entry.bedtime) {
      parts.push(`bed ${formatBedtime(entry.bedtime)}`);
    }

    return parts.join(" / ");
  }

  function populateCheckinForm() {
    const form = byId("checkin-form");
    const selectedLog = getSelectedLog();

    form.date.value = selectedDate;
    form.weight.value = selectedLog && selectedLog.weight !== null ? selectedLog.weight : "";
    form.steps.value = selectedLog && selectedLog.steps !== null ? selectedLog.steps : "";
    form.sleepHours.value =
      selectedLog && selectedLog.sleepHours !== null ? selectedLog.sleepHours : "";
    form.sleepScore.value =
      selectedLog && selectedLog.sleepScore !== null ? selectedLog.sleepScore : "";
    form.bedtime.value = selectedLog && selectedLog.bedtime ? selectedLog.bedtime : "";
    form.workoutDone.checked = selectedLog ? !!selectedLog.workoutDone : false;
    form.caloriesOnTarget.checked = selectedLog ? !!selectedLog.caloriesOnTarget : false;
    form.waterTargetMet.checked = selectedLog ? !!selectedLog.waterTargetMet : false;
  }

  function renderCheckinPreview() {
    const selectedLog = getSelectedLog();
    const evaluation = calculations.evaluateDailyLog(selectedLog, state.goals, state.logs);
    const status = describeScoreStatus(!!selectedLog, evaluation.hits, evaluation.total);

    byId("selected-date-title").textContent = formatDateLong(selectedDate);
    byId("selected-date-note").textContent = selectedLog
      ? `Saved entry with ${formatSleepSnapshot(selectedLog)}. Updating the form will overwrite it.`
      : "No saved entry for this date yet.";
    byId("selected-date-score").textContent = `${evaluation.hits} / ${evaluation.total}`;
    setToken("selected-date-status", "status-chip", status.label, status.className);
    setToken(
      "checkin-mode",
      "status-pill",
      selectedLog ? "Editing saved day" : "New day",
      selectedLog ? "status-on-track" : "muted-chip"
    );

    renderBreakdownList(
      "selected-date-breakdown",
      evaluation.results.map(function (result) {
        return {
          title: result.label,
          detail: result.detail,
          badge: result.hit ? "Hit" : "Miss",
          toneClass: result.hit ? "status-on-track" : "status-off-track",
        };
      }),
      "No saved entry"
    );
  }

  function render() {
    applyTheme(state.preferences.theme);

    const summary = calculations.buildSummary(state);
    const selectedSummaryStatus = describeScoreStatus(
      !!summary.todayLog,
      summary.todayEvaluation.hits,
      summary.todayEvaluation.total
    );
    const recentEntries = summary.recentEntries;
    const stepsValues = recentEntries
      .map(function (entry) {
        return Number(entry.steps || 0);
      })
      .filter(function (value) {
        return value > 0;
      });
    const sleepValues = recentEntries
      .map(function (entry) {
        return Number(entry.sleepHours || 0);
      })
      .filter(function (value) {
        return value > 0;
      });
    const sleepScoreValues = recentEntries
      .map(function (entry) {
        return typeof entry.sleepScore === "number" ? entry.sleepScore : null;
      })
      .filter(function (value) {
        return value !== null;
      });
    const weightValues = recentEntries
      .map(function (entry) {
        return typeof entry.weight === "number" ? entry.weight : null;
      })
      .filter(function (value) {
        return value !== null;
      });
    const averageSteps = buildAverage(stepsValues);
    const averageSleep = buildAverage(sleepValues);
    const averageSleepScore = buildAverage(sleepScoreValues);
    const latestBedtimeEntry = recentEntries.find(function (entry) {
      return !!entry.bedtime;
    });

    byId("overall-status").textContent = summary.overallStatus;
    byId("overall-status").className = statusClass(summary.overallStatus);
    byId("status-detail").textContent = summary.todayLog
      ? `${summary.todayEvaluation.hits} of ${summary.todayEvaluation.total} targets hit today.`
      : "No entry for today yet. The fastest path is the check-in tab.";
    setToken("status-chip", "status-chip", summary.overallStatus, statusClass(summary.overallStatus));

    byId("logged-days").textContent = String(summary.loggedDays);
    byId("logged-days-card").textContent = String(summary.loggedDays);
    byId("latest-entry").textContent = summary.latestEntry
      ? formatDateShort(summary.latestEntry.date)
      : "None yet";
    byId("weight-trend-detail").textContent = summary.weightTrend.detail;

    byId("today-score").textContent = `${summary.todayEvaluation.hits} / ${summary.todayEvaluation.total}`;
    byId("today-date").textContent = `${formatDateLong(summary.todayDate)} / ${selectedSummaryStatus.label}`;
    byId("weekly-adherence").textContent = formatPercentage(summary.weeklyAdherence.percentage);
    byId("weekly-detail").textContent = `${summary.weeklyWorkoutCount} / ${state.goals.weeklyWorkoutTarget} workouts`;
    byId("monthly-adherence").textContent = formatPercentage(summary.monthlyAdherence.percentage);
    byId("monthly-detail").textContent = `${summary.monthlyCaloriesHits} / ${state.goals.monthlyCaloriesTarget} calorie days`;
    byId("workout-streak").textContent = `${summary.workoutStreak} day${summary.workoutStreak === 1 ? "" : "s"}`;
    byId("workout-detail").textContent = `Target: ${state.goals.weeklyWorkoutTarget} workouts per week`;
    byId("weight-trend-label").textContent =
      summary.weightTrend.direction.charAt(0).toUpperCase() + summary.weightTrend.direction.slice(1);
    byId("weight-trend-note").textContent = summary.weightTrend.detail;

    renderBreakdownList(
      "today-breakdown",
      summary.todayEvaluation.results.map(function (result) {
        return {
          title: result.label,
          detail: result.detail,
          badge: result.hit ? "Hit" : "Miss",
          toneClass: result.hit ? "status-on-track" : "status-off-track",
        };
      }),
      "No entry for today"
    );

    renderBreakdownList(
      "slipping-metrics",
      summary.slippingMetrics.map(function (metric) {
        return {
          title: metric.label,
          detail: `${metric.percentage}% over the last 14 logged days`,
          badge: metric.percentage < 60 ? "Attention" : "Watch",
          toneClass: metric.percentage < 60 ? "status-off-track" : "status-slightly-off-track",
        };
      }),
      "Not enough history"
    );

    byId("focus-summary").textContent = summary.slippingMetrics.length
      ? `${summary.slippingMetrics[0].label} is the weakest recent signal at ${summary.slippingMetrics[0].percentage}%.`
      : "Start logging consistently to expose drift early.";

    renderCompactList("weekly-goal-board", [
      {
        title: "Workouts this week",
        detail: `${summary.weeklyWorkoutCount} / ${state.goals.weeklyWorkoutTarget}`,
      },
      {
        title: "Calorie target days this month",
        detail: `${summary.monthlyCaloriesHits} / ${state.goals.monthlyCaloriesTarget}`,
      },
      {
        title: "Sleep minimum",
        detail: `${state.goals.sleepMinimum} h / ${state.goals.sleepScoreMinimum}+ score`,
      },
    ], "No pacing data");

    renderCompactList(
      "dashboard-recent-entries",
      recentEntries.slice(0, 4).map(function (entry) {
        return {
          title: formatDateLong(entry.date),
          detail: `${entry.steps || 0} steps / ${formatSleepSnapshot(entry)}`,
        };
      }),
      "No saved entries"
    );

    renderCompactList(
      "trend-summary",
      [
        {
          title: "Weight trend",
          detail: summary.weightTrend.detail,
        },
        {
          title: "Average steps",
          detail: averageSteps !== null ? `${Math.round(averageSteps)} steps` : "No data",
        },
        {
          title: "Average sleep",
          detail: averageSleep !== null ? `${averageSleep.toFixed(1)} hours` : "No data",
        },
        {
          title: "Average sleep score",
          detail: averageSleepScore !== null ? `${averageSleepScore.toFixed(0)} / 100` : "No data",
        },
        {
          title: "Latest weight",
          detail: weightValues.length ? `${weightValues[0].toFixed(1)} kg` : "No data",
        },
        {
          title: "Latest bedtime",
          detail: latestBedtimeEntry ? formatBedtime(latestBedtimeEntry.bedtime) : "No data",
        },
      ],
      "No trend data"
    );

    renderCompactList(
      "recent-entries",
      recentEntries.map(function (entry) {
        return {
          title: formatDateLong(entry.date),
          detail: `${entry.steps || 0} steps / ${formatSleepSnapshot(entry)}`,
        };
      }),
      "No saved entries"
    );

    renderCompactList(
      "consistency-board",
      [
        {
          title: "Weekly adherence",
          detail: formatPercentage(summary.weeklyAdherence.percentage),
        },
        {
          title: "Monthly adherence",
          detail: formatPercentage(summary.monthlyAdherence.percentage),
        },
        {
          title: "Workout pace",
          detail: `${summary.weeklyWorkoutCount} of ${state.goals.weeklyWorkoutTarget} this week`,
        },
        {
          title: "Calorie adherence pace",
          detail: `${summary.monthlyCaloriesHits} of ${state.goals.monthlyCaloriesTarget} days this month`,
        },
        {
          title: "Sleep score target",
          detail: `${state.goals.sleepScoreMinimum}+ when logged`,
        },
        {
          title: "Water tracking",
          detail: state.goals.waterDaily ? "Enabled daily" : "Disabled",
        },
      ],
      "No consistency data"
    );

    populateCheckinForm();
    renderCheckinPreview();

    const goalsForm = byId("goals-form");
    goalsForm.stepsMinimum.value = state.goals.stepsMinimum;
    goalsForm.sleepMinimum.value = state.goals.sleepMinimum;
    goalsForm.sleepScoreMinimum.value = state.goals.sleepScoreMinimum;
    goalsForm.weeklyWorkoutTarget.value = state.goals.weeklyWorkoutTarget;
    goalsForm.monthlyCaloriesTarget.value = state.goals.monthlyCaloriesTarget;
    goalsForm.waterDaily.checked = !!state.goals.waterDaily;
  }

  function handleThemeToggle() {
    const nextTheme = state.preferences.theme === "dark" ? "light" : "dark";

    saveAndRender({
      ...state,
      preferences: {
        ...state.preferences,
        theme: nextTheme,
      },
    });
  }

  function handleCheckinDateChange(event) {
    selectedDate = event.currentTarget.value || calculations.getTodayISODate();
    populateCheckinForm();
    renderCheckinPreview();
  }

  function handleCheckinSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const payload = {
      date: form.date.value,
      weight: normalizeNumber(form.weight.value),
      workoutDone: form.workoutDone.checked,
      steps: normalizeNumber(form.steps.value),
      caloriesOnTarget: form.caloriesOnTarget.checked,
      sleepHours: normalizeNumber(form.sleepHours.value),
      sleepScore: normalizeNumber(form.sleepScore.value),
      bedtime: normalizeTime(form.bedtime.value),
      waterTargetMet: form.waterTargetMet.checked,
    };

    selectedDate = payload.date;

    const nextState = {
      ...state,
      logs: {
        ...state.logs,
        [payload.date]: payload,
      },
    };

    saveAndRender(nextState);
    setFeedback("checkin-feedback", `Saved entry for ${payload.date}`);
  }

  function handleGoalsSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const nextState = {
      ...state,
      goals: {
        ...state.goals,
        stepsMinimum: normalizeNumber(form.stepsMinimum.value) || 0,
        sleepMinimum: normalizeNumber(form.sleepMinimum.value) || 0,
        sleepScoreMinimum: normalizeNumber(form.sleepScoreMinimum.value) || 0,
        weeklyWorkoutTarget: normalizeNumber(form.weeklyWorkoutTarget.value) || 0,
        monthlyCaloriesTarget: normalizeNumber(form.monthlyCaloriesTarget.value) || 0,
        waterDaily: form.waterDaily.checked,
      },
    };

    saveAndRender(nextState);
    setFeedback("goals-feedback", "Goals updated");
  }

  function handleExport() {
    const blob = new Blob([storage.exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "personal-health-tracker-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("data-feedback", "Exported local data");
  }

  function handleImport(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      try {
        state = storage.importState(String(reader.result));
        selectedDate = calculations.getTodayISODate();
        render();
        setFeedback("data-feedback", "Imported data successfully");
      } catch (error) {
        setFeedback("data-feedback", "Import failed: invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  function activateTab(tabId) {
    Array.from(document.querySelectorAll(".tab-bar [data-tab-target]")).forEach(function (button) {
      const isActive = button.dataset.tabTarget === tabId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    Array.from(document.querySelectorAll(".tab-panel")).forEach(function (panel) {
      panel.classList.toggle("is-active", panel.id === `tab-${tabId}`);
    });
  }

  function bindTabs() {
    Array.from(document.querySelectorAll("[data-tab-target]")).forEach(function (button) {
      button.addEventListener("click", function () {
        activateTab(button.dataset.tabTarget);
      });
    });
  }

  function bindForms() {
    byId("checkin-form").addEventListener("submit", handleCheckinSubmit);
    byId("goals-form").addEventListener("submit", handleGoalsSubmit);
    byId("checkin-date").addEventListener("change", handleCheckinDateChange);
    byId("export-data").addEventListener("click", handleExport);
    byId("import-data").addEventListener("change", handleImport);
    byId("theme-toggle").addEventListener("click", handleThemeToggle);
  }

  function start() {
    bindTabs();
    bindForms();
    render();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
