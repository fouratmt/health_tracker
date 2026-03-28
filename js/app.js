(function () {
  const storage = window.HealthTrackerStorage;
  const calculations = window.HealthTrackerCalculations;

  let state = storage.loadState();

  function byId(id) {
    return document.getElementById(id);
  }

  function setFeedback(id, text) {
    byId(id).textContent = text;
    window.setTimeout(function () {
      if (byId(id).textContent === text) {
        byId(id).textContent = "";
      }
    }, 3000);
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

  function saveAndRender(nextState) {
    state = storage.saveState(nextState);
    render();
  }

  function renderSummaryList(elementId, items, emptyText) {
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

  function render() {
    const summary = calculations.buildSummary(state);
    const overall = byId("overall-status");
    overall.textContent = summary.overallStatus;
    overall.className = statusClass(summary.overallStatus);

    byId("status-detail").textContent = summary.todayLog
      ? `${summary.todayEvaluation.hits} of ${summary.todayEvaluation.total} targets hit today.`
      : "No entry for today yet.";
    byId("today-score").textContent = `${summary.todayEvaluation.hits} / ${summary.todayEvaluation.total}`;
    byId("today-date").textContent = summary.todayDate;
    byId("weekly-adherence").textContent = formatPercentage(summary.weeklyAdherence.percentage);
    byId("weekly-detail").textContent = `${summary.weeklyAdherence.hits} hits / ${summary.weeklyAdherence.total} checks`;
    byId("monthly-adherence").textContent = formatPercentage(summary.monthlyAdherence.percentage);
    byId("monthly-detail").textContent = `${summary.monthlyAdherence.hits} hits / ${summary.monthlyAdherence.total} checks`;
    byId("workout-streak").textContent = `${summary.workoutStreak} day${summary.workoutStreak === 1 ? "" : "s"}`;

    renderSummaryList(
      "today-breakdown",
      summary.todayEvaluation.results.map(function (result) {
        return {
          title: `${result.label}: ${result.hit ? "hit" : "miss"}`,
          detail: result.detail,
        };
      }),
      "No entry for today"
    );

    renderSummaryList(
      "slipping-metrics",
      summary.slippingMetrics.map(function (metric) {
        return {
          title: metric.label,
          detail: `${metric.percentage}% over the last 14 logged days`,
        };
      }),
      "Not enough history"
    );

    const stepsValues = summary.recentEntries
      .map(function (entry) {
        return Number(entry.steps || 0);
      })
      .filter(function (value) {
        return value > 0;
      });
    const sleepValues = summary.recentEntries
      .map(function (entry) {
        return Number(entry.sleepHours || 0);
      })
      .filter(function (value) {
        return value > 0;
      });
    const avgSteps = stepsValues.length
      ? Math.round(stepsValues.reduce(function (sum, value) {
          return sum + value;
        }, 0) / stepsValues.length)
      : 0;
    const avgSleep = sleepValues.length
      ? (sleepValues.reduce(function (sum, value) {
          return sum + value;
        }, 0) / sleepValues.length).toFixed(1)
      : "0.0";

    renderSummaryList(
      "trend-summary",
      [
        {
          title: "Weight trend",
          detail: summary.weightTrend.detail,
        },
        {
          title: "Average steps",
          detail: avgSteps ? `${avgSteps} steps` : "No data",
        },
        {
          title: "Average sleep",
          detail: sleepValues.length ? `${avgSleep} hours` : "No data",
        },
      ],
      "No trend data"
    );

    renderSummaryList(
      "recent-entries",
      summary.recentEntries.map(function (entry) {
        return {
          title: entry.date,
          detail: `${entry.steps || 0} steps, ${entry.sleepHours || 0} h sleep`,
        };
      }),
      "No saved entries"
    );

    byId("checkin-date").value = summary.todayDate;

    const goalsForm = byId("goals-form");
    goalsForm.stepsMinimum.value = state.goals.stepsMinimum;
    goalsForm.sleepMinimum.value = state.goals.sleepMinimum;
    goalsForm.weeklyWorkoutTarget.value = state.goals.weeklyWorkoutTarget;
    goalsForm.monthlyCaloriesTarget.value = state.goals.monthlyCaloriesTarget;
    goalsForm.monthlyProteinTarget.value = state.goals.monthlyProteinTarget;
    goalsForm.waterDaily.checked = !!state.goals.waterDaily;
  }

  function handleCheckinSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const payload = {
      date: form.date.value,
      weight: normalizeNumber(form.weight.value),
      workoutDone: form.workoutDone.checked,
      steps: normalizeNumber(form.steps.value) || 0,
      caloriesOnTarget: form.caloriesOnTarget.checked,
      proteinOnTarget: form.proteinOnTarget.checked,
      sleepHours: normalizeNumber(form.sleepHours.value) || 0,
      waterTargetMet: form.waterTargetMet.checked,
    };

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
        weeklyWorkoutTarget: normalizeNumber(form.weeklyWorkoutTarget.value) || 0,
        monthlyCaloriesTarget: normalizeNumber(form.monthlyCaloriesTarget.value) || 0,
        monthlyProteinTarget: normalizeNumber(form.monthlyProteinTarget.value) || 0,
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
        render();
        setFeedback("data-feedback", "Imported data successfully");
      } catch (error) {
        setFeedback("data-feedback", "Import failed: invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  function bindTabs() {
    const buttons = Array.from(document.querySelectorAll("[data-tab-target]"));
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.remove("is-active");
        });
        button.classList.add("is-active");

        Array.from(document.querySelectorAll(".tab-panel")).forEach(function (panel) {
          panel.classList.remove("is-active");
        });
        byId(`tab-${button.dataset.tabTarget}`).classList.add("is-active");
      });
    });
  }

  function bindForms() {
    byId("checkin-form").addEventListener("submit", handleCheckinSubmit);
    byId("goals-form").addEventListener("submit", handleGoalsSubmit);
    byId("export-data").addEventListener("click", handleExport);
    byId("import-data").addEventListener("change", handleImport);
  }

  function start() {
    bindTabs();
    bindForms();
    render();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
