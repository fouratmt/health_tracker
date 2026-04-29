(function () {
  const storage = window.HealthTrackerStorage;
  const calculations = window.HealthTrackerCalculations;
  const MARKER_GROUP_ORDER = ["Sleep", "Eat", "Move"];
  const INSTALL_PROMPT_SESSION_KEY = "personal-health-tracker-install-dismissed";

  let state = storage.loadState();
  let selectedDate = calculations.getTodayISODate();
  let deferredInstallPrompt = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function formatPercentage(value) {
    return `${value}%`;
  }

  function statusClass(status) {
    return `status-${status.toLowerCase().replace(/\s+/g, "-")}`;
  }

  function overallStatusClass(status) {
    return `overall-status-text overall-${status.toLowerCase().replace(/\s+/g, "-")}`;
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

  function normalizeDuration(value) {
    return calculations.formatDurationValue(value);
  }

  function applyTheme(theme) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    const toggleButton = byId("theme-toggle");
    const themeColor = document.querySelector('meta[name="theme-color"]');

    document.documentElement.dataset.theme = resolvedTheme;

    if (themeColor) {
      themeColor.setAttribute("content", resolvedTheme === "dark" ? "#030712" : "#f7fafc");
    }

    if (!toggleButton) {
      return;
    }

    const nextLabel = resolvedTheme === "dark" ? "Light mode" : "Dark mode";
    toggleButton.textContent = nextLabel;
    toggleButton.setAttribute("aria-pressed", String(resolvedTheme === "dark"));
    toggleButton.setAttribute("aria-label", `Switch to ${nextLabel.toLowerCase()}`);
    toggleButton.title = `Switch to ${nextLabel.toLowerCase()}`;
  }

  function isStandaloneApp() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.navigator.standalone === true
    );
  }

  function detectBrowser() {
    const ua = window.navigator.userAgent.toLowerCase();

    if (ua.includes("firefox") || ua.includes("fxios")) {
      return "firefox";
    }

    if (
      ua.includes("safari") &&
      !ua.includes("chrome") &&
      !ua.includes("crios") &&
      !ua.includes("chromium") &&
      !ua.includes("edg")
    ) {
      return "safari";
    }

    return "chromium";
  }

  function getInstallPromptCopy() {
    const browser = detectBrowser();

    if (deferredInstallPrompt) {
      return {
        title: "Install Health Tracker",
        detail: "Use the browser install prompt to keep the app one tap away and available offline.",
        action: "Install",
      };
    }

    if (browser === "safari") {
      return {
        title: "Add Health Tracker to Home Screen",
        detail: "In Safari, use Share, then Add to Home Screen. The app will open full-screen after it is added.",
        action: "Got it",
      };
    }

    if (browser === "firefox") {
      return {
        title: "Add Health Tracker to your device",
        detail: "In Firefox, open the browser menu and choose Install or Add to Home screen when that option is available.",
        action: "Got it",
      };
    }

    return {
      title: "Install Health Tracker",
      detail: "Open the browser menu and choose Install app if the install button is not shown automatically.",
      action: "Got it",
    };
  }

  function shouldOfferInstall() {
    return !isStandaloneApp() && window.sessionStorage.getItem(INSTALL_PROMPT_SESSION_KEY) !== "true";
  }

  function updateInstallPromptCopy() {
    const copy = getInstallPromptCopy();

    byId("install-prompt-title").textContent = copy.title;
    byId("install-prompt-detail").textContent = copy.detail;
    byId("install-prompt-action").textContent = copy.action;
  }

  function showInstallPrompt(force) {
    const prompt = byId("install-prompt");
    const installButton = byId("install-app");

    if (!prompt || !installButton || isStandaloneApp()) {
      return;
    }

    updateInstallPromptCopy();
    installButton.hidden = false;

    if (force || shouldOfferInstall()) {
      prompt.hidden = false;
    }
  }

  function hideInstallPrompt() {
    byId("install-prompt").hidden = true;
  }

  async function handleInstallAction() {
    if (!deferredInstallPrompt) {
      window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, "true");
      hideInstallPrompt();
      return;
    }

    deferredInstallPrompt.prompt();

    try {
      const choice = await deferredInstallPrompt.userChoice;
      if (choice && choice.outcome === "accepted") {
        hideInstallPrompt();
      }
    } catch (error) {
      hideInstallPrompt();
    }

    deferredInstallPrompt = null;
  }

  function bindPwaInstallPrompt() {
    const installButton = byId("install-app");
    const installAction = byId("install-prompt-action");
    const dismissButton = byId("install-prompt-dismiss");

    if (isStandaloneApp()) {
      installButton.hidden = true;
      hideInstallPrompt();
      return;
    }

    installButton.addEventListener("click", function () {
      showInstallPrompt(true);
    });

    installAction.addEventListener("click", handleInstallAction);

    dismissButton.addEventListener("click", function () {
      window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, "true");
      hideInstallPrompt();
    });

    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      showInstallPrompt(false);
    });

    window.addEventListener("appinstalled", function () {
      deferredInstallPrompt = null;
      hideInstallPrompt();
      installButton.hidden = true;
    });

    window.setTimeout(function () {
      showInstallPrompt(false);
    }, 1000);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").catch(function () {});
    });
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

  function parseISODate(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || "");

    if (!match) {
      return null;
    }

    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  function formatDateLong(dateString) {
    const date = parseISODate(dateString);

    if (!date) {
      return "Unknown date";
    }

    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function formatDateShort(dateString) {
    const date = parseISODate(dateString);

    if (!date) {
      return "Unknown date";
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function formatWeekday(dateString) {
    const date = parseISODate(dateString);

    if (!date) {
      return "Unknown day";
    }

    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      timeZone: "UTC",
    }).format(date);
  }

  function formatMonthShort(dateString) {
    const date = parseISODate(dateString);

    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      timeZone: "UTC",
    }).format(date);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toISODate(date) {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }

  function shiftISODate(dateString, dayOffset) {
    const date = parseISODate(dateString) || parseISODate(calculations.getTodayISODate());
    date.setUTCDate(date.getUTCDate() + dayOffset);
    return toISODate(date);
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

  function shouldRenderGrouped(items) {
    return items.length > 0 && items.every(function (item) {
      return typeof item.group === "string" && item.group.length > 0;
    });
  }

  function groupSortIndex(group) {
    const index = MARKER_GROUP_ORDER.indexOf(group);
    return index === -1 ? MARKER_GROUP_ORDER.length : index;
  }

  function buildGroupedListMarkup(items, renderItem) {
    const groupedItems = items.reduce(function (groups, item) {
      const group = item.group;

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(item);
      return groups;
    }, {});

    return Object.keys(groupedItems)
      .sort(function (left, right) {
        return groupSortIndex(left) - groupSortIndex(right);
      })
      .map(function (group) {
        return `
          <li class="summary-group-row">
            <div class="summary-group-head">
              <span class="summary-group-pill summary-group-pill-${group.toLowerCase()}">${group}</span>
            </div>
          </li>
          ${groupedItems[group].map(renderItem).join("")}
        `;
      })
      .join("");
  }

  function chunkItems(items, size) {
    const chunks = [];

    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  }

  function summarizeEvaluationGroups(results) {
    return MARKER_GROUP_ORDER.reduce(function (groups, group) {
      groups[group] = {
        group,
        hits: 0,
        total: 0,
        results: [],
      };
      return groups;
    }, {});
  }

  function collectEvaluationGroups(results) {
    const groups = summarizeEvaluationGroups(results);

    results.forEach(function (result) {
      const group = result.group || calculations.getMetricGroup(result.key);

      if (!groups[group]) {
        groups[group] = {
          group,
          hits: 0,
          total: 0,
          results: [],
        };
      }

      groups[group].results.push(result);
      groups[group].total += 1;
      groups[group].hits += result.hit ? 1 : 0;
    });

    return groups;
  }

  function formatGroupScore(groupSummary, hasLog) {
    if (!hasLog || groupSummary.total === 0) {
      return "No entry";
    }

    return `${groupSummary.hits} / ${groupSummary.total}`;
  }

  function buildDashboardGroupCards(summary) {
    const todayGroups = collectEvaluationGroups(summary.todayEvaluation.results);
    const hasTodayLog = !!summary.todayLog;
    const sleepFocus = summary.slippingMetrics.find(function (metric) {
      return metric.group === "Sleep";
    });

    return [
      {
        group: "Sleep",
        title: "Recovery markers",
        value: formatGroupScore(todayGroups.Sleep, hasTodayLog),
        caption: hasTodayLog ? "Hit today" : "Awaiting today",
        note: hasTodayLog
          ? formatSleepSnapshot(summary.todayLog)
          : "Log duration and score to evaluate recovery.",
        items: [
          {
            title: "Target",
            detail: `${calculations.formatDurationValue(state.goals.sleepMinimum) || "00:00"} / ${state.goals.sleepScoreMinimum}+ score`,
          },
          {
            title: "Recent focus",
            detail: sleepFocus ? `${sleepFocus.label} is slipping` : "Sleep markers look stable",
          },
        ],
      },
      {
        group: "Eat",
        title: "Nutrition markers",
        value: formatGroupScore(todayGroups.Eat, hasTodayLog),
        caption: hasTodayLog ? "Hit today" : "Awaiting today",
        note: hasTodayLog
          ? todayGroups.Eat.results.map(function (result) {
              return `${result.label}: ${result.hit ? "hit" : "miss"}`;
            }).join(" / ")
          : "Calories, water, and no sugar are waiting for today's check-in.",
        items: [
          {
            title: "Calories month",
            detail: `${summary.monthlyCaloriesHits} / ${state.goals.monthlyCaloriesTarget}`,
          },
          {
            title: "Daily rule",
            detail: "Water around 2 L and no sugar are always scored",
          },
        ],
      },
      {
        group: "Move",
        title: "Activity markers",
        value: formatGroupScore(todayGroups.Move, hasTodayLog),
        caption: hasTodayLog ? "Hit today" : "Awaiting today",
        note: hasTodayLog
          ? todayGroups.Move.results.map(function (result) {
              return `${result.label}: ${result.hit ? "hit" : "miss"}`;
            }).join(" / ")
          : "Weight, steps, and workouts are waiting for today's check-in.",
        items: [
          {
            title: "Workout pace",
            detail: `${summary.weeklyWorkoutCount} / ${state.goals.weeklyWorkoutTarget} this week`,
          },
          {
            title: "Steps floor",
            detail: `${state.goals.stepsMinimum}+ daily`,
          },
          {
            title: "Weight trend",
            detail: summary.weightTrend.detail,
          },
        ],
      },
    ];
  }

  function buildHeatmapMonthLabels(weekStarts) {
    let previousMonthKey = "";

    return weekStarts.map(function (weekStart) {
      const monthKey = weekStart.slice(0, 7);
      const label = monthKey !== previousMonthKey ? formatMonthShort(weekStart) : "";
      previousMonthKey = monthKey;
      return label;
    });
  }

  function formatStreakLabel(streak) {
    if (!streak) {
      return "No streak";
    }

    return `${streak} day${streak === 1 ? "" : "s"}`;
  }

  function formatHeatmapCoverage(marker) {
    if (!marker.trackedDays) {
      return "No logged days";
    }

    return `${marker.hitCount} hits / ${marker.trackedDays} logged days`;
  }

  function heatmapStatusLabel(status) {
    if (status === "hit") {
      return "Hit";
    }

    if (status === "miss") {
      return "Miss";
    }

    if (status === "future") {
      return "Future";
    }

    return "No entry";
  }

  function renderMarkerStreakMap(summary) {
    const element = byId("marker-streak-map");
    const streakMap = summary.markerStreakMap;
    const monthLabels = buildHeatmapMonthLabels(streakMap.weekStarts);
    const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

    element.innerHTML = streakMap.markers
      .map(function (marker) {
        const weeks = chunkItems(marker.cells, 7);

        return `
          <article class="marker-heatmap-panel marker-panel marker-panel-${marker.group.toLowerCase()}">
            <div class="marker-heatmap-head">
              <div class="marker-heatmap-title">
                <span class="summary-group-pill summary-group-pill-${marker.group.toLowerCase()}">${marker.group}</span>
                <strong>${marker.label}</strong>
              </div>
              <div class="marker-heatmap-metrics">
                <strong>${formatStreakLabel(marker.streak)}</strong>
                <span>${formatHeatmapCoverage(marker)}</span>
              </div>
            </div>
            <div class="marker-heatmap-months">
              ${monthLabels.map(function (label) {
                return `<span>${label}</span>`;
              }).join("")}
            </div>
            <div class="marker-heatmap-board">
              <div class="marker-heatmap-weekdays">
                ${weekdayLabels.map(function (label) {
                  return `<span>${label}</span>`;
                }).join("")}
              </div>
              <div class="marker-heatmap-grid">
                ${weeks.map(function (week) {
                  return `
                    <div class="marker-heatmap-week">
                      ${week.map(function (cell) {
                        return `<span class="heatmap-cell heatmap-cell-${cell.status}" title="${marker.label} / ${cell.date} / ${heatmapStatusLabel(cell.status)}"></span>`;
                      }).join("")}
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderDashboardGroupCards(summary) {
    const element = byId("dashboard-marker-groups");
    const cards = buildDashboardGroupCards(summary);

    element.innerHTML = cards
      .map(function (card) {
        return `
          <article class="card marker-panel marker-panel-${card.group.toLowerCase()} dashboard-group-card">
            <div class="marker-panel-head">
              <p class="label">${card.group}</p>
              <strong>${card.title}</strong>
              <span class="muted">${card.note}</span>
            </div>
            <div class="dashboard-group-score">
              <strong>${card.value}</strong>
              <span class="muted">${card.caption}</span>
            </div>
            <ul class="summary-list compact-list dashboard-group-list">
              ${card.items.map(function (item) {
                return `<li><strong>${item.title}</strong><span>${item.detail}</span></li>`;
              }).join("")}
            </ul>
          </article>
        `;
      })
      .join("");
  }

  function renderCompactList(elementId, items, emptyText) {
    const element = byId(elementId);

    if (!items.length) {
      element.innerHTML = `<li><strong>${emptyText}</strong><span></span></li>`;
      return;
    }

    if (shouldRenderGrouped(items)) {
      element.innerHTML = buildGroupedListMarkup(items, function (item) {
        return `<li><strong>${item.title}</strong><span>${item.detail}</span></li>`;
      });
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

    if (shouldRenderGrouped(items)) {
      element.innerHTML = buildGroupedListMarkup(items, function (item) {
        return `
          <li>
            <div class="list-row-head">
              <strong>${item.title}</strong>
              <span class="list-badge ${item.toneClass}">${item.badge}</span>
            </div>
            <span>${item.detail}</span>
          </li>
        `;
      });
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

  function renderTrendCards(elementId, items) {
    const element = byId(elementId);

    if (!items.length) {
      element.innerHTML = `<article class="trend-card trend-card-neutral"><p class="label">Trends</p><strong>No data</strong><span class="muted">Need more history to draw movement.</span></article>`;
      return;
    }

    element.innerHTML = items
      .map(function (item) {
        return `
          <article class="trend-card trend-card-${item.tone}">
            <div class="trend-card-head">
              <p class="label">${item.title}</p>
              <span class="trend-chip ${item.toneClass}">${item.directionLabel}</span>
            </div>
            <strong>${item.valueLabel}</strong>
            <span>${item.deltaLabel}</span>
            <small>${item.supportingLabel}</small>
          </article>
        `;
      })
      .join("");
  }

  function formatSignedNumber(value, digits) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}${Math.abs(value).toFixed(digits)}`;
  }

  function formatSignedDuration(value) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    const formatted = calculations.formatDurationFromMinutes(Math.abs(value));
    return formatted ? `${sign}${formatted}` : "No data";
  }

  function trendToneClass(tone) {
    if (tone === "positive") {
      return "status-on-track";
    }

    if (tone === "negative") {
      return "status-off-track";
    }

    return "muted-chip";
  }

  function trendDirectionLabel(trend) {
    if (!trend.previous) {
      return "Building";
    }

    if (trend.direction === "up") {
      return "Up";
    }

    if (trend.direction === "down") {
      return "Down";
    }

    return "Stable";
  }

  function buildTrendCards(summary) {
    const weightTrend = summary.metricTrends.weight;
    const stepsTrend = summary.metricTrends.steps;
    const sleepDurationTrend = summary.metricTrends.sleepDuration;
    const sleepScoreTrend = summary.metricTrends.sleepScore;

    return [
      {
        title: "Weight movement",
        tone: weightTrend.tone,
        toneClass: trendToneClass(weightTrend.tone),
        directionLabel: trendDirectionLabel(weightTrend),
        valueLabel: weightTrend.latest ? `${weightTrend.latest.value.toFixed(1)} kg` : "No data",
        deltaLabel: weightTrend.previous
          ? `${formatSignedNumber(weightTrend.delta, 1)} kg vs prior weigh-in`
          : "Need two weigh-ins",
        supportingLabel: weightTrend.previous
          ? `Previous ${weightTrend.previous.value.toFixed(1)} kg on ${formatDateShort(weightTrend.previous.date)}`
          : "Start logging weight to expose movement",
      },
      {
        title: "Steps change",
        tone: stepsTrend.tone,
        toneClass: trendToneClass(stepsTrend.tone),
        directionLabel: trendDirectionLabel(stepsTrend),
        valueLabel: stepsTrend.latest ? `${Math.round(stepsTrend.latest.value)} steps` : "No data",
        deltaLabel: stepsTrend.previous
          ? `${formatSignedNumber(stepsTrend.delta, 0)} vs prior log`
          : "Need two step logs",
        supportingLabel: stepsTrend.previous
          ? `Previous ${Math.round(stepsTrend.previous.value)} on ${formatDateShort(stepsTrend.previous.date)}`
          : "Track steps consistently for a movement read",
      },
      {
        title: "Sleep duration",
        tone: sleepDurationTrend.tone,
        toneClass: trendToneClass(sleepDurationTrend.tone),
        directionLabel: trendDirectionLabel(sleepDurationTrend),
        valueLabel: sleepDurationTrend.latest
          ? calculations.formatDurationFromMinutes(sleepDurationTrend.latest.value)
          : "No data",
        deltaLabel: sleepDurationTrend.previous
          ? `${formatSignedDuration(sleepDurationTrend.delta)} vs prior sleep log`
          : "Need two sleep logs",
        supportingLabel: sleepDurationTrend.previous
          ? `Previous ${calculations.formatDurationFromMinutes(sleepDurationTrend.previous.value)} on ${formatDateShort(sleepDurationTrend.previous.date)}`
          : "Sleep duration trend builds as logs accumulate",
      },
      {
        title: "Sleep score",
        tone: sleepScoreTrend.tone,
        toneClass: trendToneClass(sleepScoreTrend.tone),
        directionLabel: trendDirectionLabel(sleepScoreTrend),
        valueLabel: sleepScoreTrend.latest ? `${Math.round(sleepScoreTrend.latest.value)} / 100` : "No data",
        deltaLabel: sleepScoreTrend.previous
          ? `${formatSignedNumber(sleepScoreTrend.delta, 0)} vs prior score`
          : "Need two scored nights",
        supportingLabel: sleepScoreTrend.previous
          ? `Previous ${Math.round(sleepScoreTrend.previous.value)} on ${formatDateShort(sleepScoreTrend.previous.date)}`
          : "Sleep score trend appears once scores repeat",
      },
    ];
  }

  function getSelectedLog() {
    return state.logs[selectedDate] || null;
  }

  function getCheckinDateValue() {
    const dateInput = byId("checkin-date");
    return (dateInput && dateInput.value) || selectedDate || calculations.getTodayISODate();
  }

  function formatBedtime(value) {
    return value || "Not logged";
  }

  function formatSleepSnapshot(entry) {
    const parts = [];
    const sleepDuration = calculations.formatDurationValue(entry.sleepHours);

    if (sleepDuration) {
      parts.push(`${sleepDuration} sleep`);
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
    const dateInput = byId("checkin-date");
    const selectedLog = getSelectedLog();
    const deleteButton = byId("delete-entry");

    dateInput.value = selectedDate;
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
    form.noSugarIntake.checked = selectedLog ? !!selectedLog.noSugarIntake : false;
    byId("selected-date-weekday").textContent = formatWeekday(selectedDate);
    deleteButton.disabled = !selectedLog;
    deleteButton.setAttribute("aria-disabled", String(!selectedLog));
  }

  function setSelectedDate(nextDate) {
    selectedDate = nextDate || calculations.getTodayISODate();
    populateCheckinForm();
    renderCheckinPreview();
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
          group: result.group,
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
    byId("overall-status").textContent = summary.overallStatus;
    byId("overall-status").className = overallStatusClass(summary.overallStatus);
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
    renderDashboardGroupCards(summary);

    renderBreakdownList(
      "today-breakdown",
      summary.todayEvaluation.results.map(function (result) {
        return {
          title: result.label,
          detail: result.detail,
          badge: result.hit ? "Hit" : "Miss",
          toneClass: result.hit ? "status-on-track" : "status-off-track",
          group: result.group,
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
          group: metric.group,
        };
      }),
      "Not enough history"
    );

    byId("focus-summary").textContent = summary.slippingMetrics.length
      ? `${summary.slippingMetrics[0].label} is the weakest recent signal at ${summary.slippingMetrics[0].percentage}%.`
      : "Start logging consistently to expose drift early.";

    renderCompactList("weekly-goal-board", [
      {
        group: calculations.getMetricGroup("sleepHours"),
        title: "Sleep minimum",
        detail: `${calculations.formatDurationValue(state.goals.sleepMinimum) || "00:00"} / ${state.goals.sleepScoreMinimum}+ score`,
      },
      {
        group: calculations.getMetricGroup("caloriesOnTarget"),
        title: "Calorie target days this month",
        detail: `${summary.monthlyCaloriesHits} / ${state.goals.monthlyCaloriesTarget}`,
      },
      {
        group: calculations.getMetricGroup("workoutDone"),
        title: "Workouts this week",
        detail: `${summary.weeklyWorkoutCount} / ${state.goals.weeklyWorkoutTarget}`,
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

    renderMarkerStreakMap(summary);
    renderTrendCards("trend-summary", buildTrendCards(summary));

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
          title: "Water rule",
          detail: "Always scored / around 2 L for the day",
        },
        {
          title: "No sugar rule",
          detail: "Always scored / sugar-free day",
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
    setSelectedDate(event.currentTarget.value || calculations.getTodayISODate());
  }

  function shiftSelectedDate(dayOffset) {
    setSelectedDate(shiftISODate(getCheckinDateValue(), dayOffset));
  }

  function openTodayCheckin() {
    activateTab("checkin");
    setSelectedDate(calculations.getTodayISODate());
  }

  function handleDeleteEntry() {
    if (!getSelectedLog()) {
      return;
    }

    const nextLogs = {
      ...state.logs,
    };

    delete nextLogs[selectedDate];

    saveAndRender({
      ...state,
      logs: nextLogs,
    });
    setFeedback("checkin-feedback", `Deleted entry for ${selectedDate}`);
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
      sleepHours: normalizeDuration(form.sleepHours.value),
      sleepScore: normalizeNumber(form.sleepScore.value),
      bedtime: normalizeTime(form.bedtime.value),
      waterTargetMet: form.waterTargetMet.checked,
      noSugarIntake: form.noSugarIntake.checked,
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
        sleepMinimum: normalizeDuration(form.sleepMinimum.value) || "00:00",
        sleepScoreMinimum: normalizeNumber(form.sleepScoreMinimum.value) || 0,
        weeklyWorkoutTarget: normalizeNumber(form.weeklyWorkoutTarget.value) || 0,
        monthlyCaloriesTarget: normalizeNumber(form.monthlyCaloriesTarget.value) || 0,
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
        if (button.dataset.resetDate === "today" && button.dataset.tabTarget === "checkin") {
          openTodayCheckin();
          return;
        }

        activateTab(button.dataset.tabTarget);
      });
    });
  }

  function bindForms() {
    byId("checkin-form").addEventListener("submit", handleCheckinSubmit);
    byId("goals-form").addEventListener("submit", handleGoalsSubmit);
    byId("checkin-date").addEventListener("input", handleCheckinDateChange);
    byId("checkin-date").addEventListener("change", handleCheckinDateChange);
    byId("checkin-prev-day").addEventListener("click", function (event) {
      event.preventDefault();
      shiftSelectedDate(-1);
    });
    byId("checkin-next-day").addEventListener("click", function (event) {
      event.preventDefault();
      shiftSelectedDate(1);
    });
    byId("delete-entry").addEventListener("click", handleDeleteEntry);
    byId("export-data").addEventListener("click", handleExport);
    byId("import-data").addEventListener("change", handleImport);
    byId("theme-toggle").addEventListener("click", handleThemeToggle);
  }

  function start() {
    bindTabs();
    bindForms();
    bindPwaInstallPrompt();
    registerServiceWorker();
    render();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
