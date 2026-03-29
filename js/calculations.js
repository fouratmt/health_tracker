(function () {
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toLocalDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function getTodayISODate() {
    return toLocalDateKey(new Date());
  }

  function parseISODate(dateString) {
    return new Date(`${dateString}T00:00:00`);
  }

  function getWeekStart(dateString) {
    const date = parseISODate(dateString);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  function getMonthKey(dateString) {
    return dateString.slice(0, 7);
  }

  function differenceInDays(laterDateString, earlierDateString) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((parseISODate(laterDateString) - parseISODate(earlierDateString)) / msPerDay);
  }

  function sortLogs(logs) {
    return Object.values(logs).sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
  }

  function parseDurationToMinutes(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.round(value * 60);
    }

    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);

    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);

      if (minutes >= 60) {
        return null;
      }

      return (hours * 60) + minutes;
    }

    const normalizedNumber = Number(trimmed.replace(",", "."));
    return Number.isFinite(normalizedNumber) ? Math.round(normalizedNumber * 60) : null;
  }

  function formatDurationFromMinutes(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
      return null;
    }

    const roundedMinutes = Math.round(totalMinutes);
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    return `${pad(hours)}:${pad(minutes)}`;
  }

  function formatDurationValue(value) {
    const totalMinutes = parseDurationToMinutes(value);
    return totalMinutes === null ? null : formatDurationFromMinutes(totalMinutes);
  }

  function evaluateDailyLog(log, goals, logs) {
    if (!log) {
      return {
        hits: 0,
        total: 0,
        results: [],
      };
    }

    const monthKey = getMonthKey(log.date);
    const monthlyLogs = sortLogs(logs).filter(function (entry) {
      return getMonthKey(entry.date) === monthKey;
    });
    const caloriesHitsThisMonth = monthlyLogs.filter(function (entry) {
      return !!entry.caloriesOnTarget;
    }).length;
    const sleepMinutes = parseDurationToMinutes(log.sleepHours);
    const sleepMinimumMinutes = parseDurationToMinutes(goals.sleepMinimum) || 0;

    const rules = [
      {
        key: "workoutDone",
        label: "Workout",
        hit: !!log.workoutDone,
        detail: log.workoutDone ? "done" : "missed",
      },
      {
        key: "steps",
        label: "Steps",
        hit: Number(log.steps || 0) >= Number(goals.stepsMinimum || 0),
        detail: `${Number(log.steps || 0)} / ${Number(goals.stepsMinimum || 0)}`,
      },
      {
        key: "caloriesOnTarget",
        label: "Calories",
        hit: !!log.caloriesOnTarget,
        detail: `${caloriesHitsThisMonth} monthly hit days`,
      },
      {
        key: "sleepHours",
        label: "Sleep",
        hit: sleepMinutes !== null && sleepMinutes >= sleepMinimumMinutes,
        detail: `${formatDurationValue(log.sleepHours) || "Not logged"} / ${formatDurationValue(goals.sleepMinimum) || "00:00"}`,
      },
    ];

    if (typeof log.sleepScore === "number" && !Number.isNaN(log.sleepScore)) {
      rules.push({
        key: "sleepScore",
        label: "Sleep score",
        hit: Number(log.sleepScore || 0) >= Number(goals.sleepScoreMinimum || 0),
        detail: `${Number(log.sleepScore || 0)} / ${Number(goals.sleepScoreMinimum || 0)}`,
      });
    }

    if (goals.waterDaily) {
      rules.push({
        key: "waterTargetMet",
        label: "Water",
        hit: !!log.waterTargetMet,
        detail: log.waterTargetMet ? "met" : "missed",
      });
    }

    if (goals.noSugarDaily) {
      rules.push({
        key: "noSugarIntake",
        label: "No sugar",
        hit: !!log.noSugarIntake,
        detail: log.noSugarIntake ? "avoided" : "consumed",
      });
    }

    const hits = rules.filter(function (rule) {
      return rule.hit;
    }).length;

    return {
      hits,
      total: rules.length,
      results: rules,
    };
  }

  function calculateStreak(logs, predicate) {
    const entries = sortLogs(logs).slice().reverse();
    let streak = 0;
    let previousDate = null;

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];

      if (previousDate !== null && differenceInDays(previousDate, entry.date) !== 1) {
        break;
      }

      if (predicate(entry)) {
        streak += 1;
        previousDate = entry.date;
      } else {
        break;
      }
    }

    return streak;
  }

  function calculatePeriodAdherence(logs, goals, predicate) {
    const entries = sortLogs(logs).filter(predicate);
    let hits = 0;
    let total = 0;

    entries.forEach(function (entry) {
      const evaluation = evaluateDailyLog(entry, goals, logs);
      hits += evaluation.hits;
      total += evaluation.total;
    });

    return {
      hits,
      total,
      percentage: total === 0 ? 0 : Math.round((hits / total) * 100),
    };
  }

  function countHits(entries, key) {
    return entries.filter(function (entry) {
      return !!entry[key];
    }).length;
  }

  function calculateWeightTrend(logs) {
    const entries = sortLogs(logs).filter(function (entry) {
      return typeof entry.weight === "number" && !Number.isNaN(entry.weight);
    });

    if (entries.length < 2) {
      return {
        direction: "flat",
        detail: "Need at least two weigh-ins",
      };
    }

    const first = entries[0].weight;
    const last = entries[entries.length - 1].weight;

    if (last < first) {
      return {
        direction: "down",
        detail: `${first.toFixed(1)} kg to ${last.toFixed(1)} kg`,
      };
    }

    if (last > first) {
      return {
        direction: "up",
        detail: `${first.toFixed(1)} kg to ${last.toFixed(1)} kg`,
      };
    }

    return {
      direction: "flat",
      detail: `${last.toFixed(1)} kg stable`,
    };
  }

  function calculateSlippingMetrics(logs, goals) {
    const entries = sortLogs(logs).slice(-14);

    if (!entries.length) {
      return [];
    }

    const counters = {};

    entries.forEach(function (entry) {
      const evaluation = evaluateDailyLog(entry, goals, logs);
      evaluation.results.forEach(function (result) {
        if (!counters[result.label]) {
          counters[result.label] = { hits: 0, total: 0 };
        }

        counters[result.label].hits += result.hit ? 1 : 0;
        counters[result.label].total += 1;
      });
    });

    return Object.keys(counters)
      .map(function (label) {
        const item = counters[label];
        const percentage = item.total === 0 ? 0 : Math.round((item.hits / item.total) * 100);
        return {
          label,
          percentage,
        };
      })
      .sort(function (a, b) {
        return a.percentage - b.percentage;
      })
      .slice(0, 3);
  }

  function deriveOverallStatus(todayEvaluation, weeklyAdherence, monthlyAdherence) {
    if (weeklyAdherence.total === 0 && monthlyAdherence.total === 0) {
      return "Slightly off track";
    }

    if (weeklyAdherence.percentage >= 80 && monthlyAdherence.percentage >= 80) {
      return "On track";
    }

    if (weeklyAdherence.percentage < 60 && monthlyAdherence.percentage < 60) {
      return "Off track";
    }

    return "Slightly off track";
  }

  function buildSummary(state) {
    const todayDate = getTodayISODate();
    const todayDateValue = parseISODate(todayDate);
    const allEntries = sortLogs(state.logs);
    const todayLog = state.logs[todayDate] || null;
    const todayEvaluation = evaluateDailyLog(todayLog, state.goals, state.logs);
    const weekStart = getWeekStart(todayDate);
    const monthKey = getMonthKey(todayDate);
    const currentWeekEntries = allEntries.filter(function (entry) {
      const entryDate = parseISODate(entry.date);
      return entryDate >= weekStart && entryDate <= todayDateValue;
    });
    const currentMonthEntries = allEntries.filter(function (entry) {
      const entryDate = parseISODate(entry.date);
      return getMonthKey(entry.date) === monthKey && entryDate <= todayDateValue;
    });

    const weeklyAdherence = calculatePeriodAdherence(state.logs, state.goals, function (entry) {
      const entryDate = parseISODate(entry.date);
      return entryDate >= weekStart && entryDate <= todayDateValue;
    });

    const monthlyAdherence = calculatePeriodAdherence(state.logs, state.goals, function (entry) {
      const entryDate = parseISODate(entry.date);
      return getMonthKey(entry.date) === monthKey && entryDate <= todayDateValue;
    });

    const overallStatus = deriveOverallStatus(todayEvaluation, weeklyAdherence, monthlyAdherence);
    const weightTrend = calculateWeightTrend(state.logs);
    const latestEntry = allEntries.length ? allEntries[allEntries.length - 1] : null;

    return {
      todayDate,
      todayLog,
      todayEvaluation,
      weeklyAdherence,
      monthlyAdherence,
      overallStatus,
      workoutStreak: calculateStreak(state.logs, function (entry) {
        return !!entry.workoutDone;
      }),
      slippingMetrics: calculateSlippingMetrics(state.logs, state.goals),
      weightTrend,
      recentEntries: allEntries.slice(-7).reverse(),
      latestEntry,
      loggedDays: allEntries.length,
      weeklyWorkoutCount: countHits(currentWeekEntries, "workoutDone"),
      monthlyCaloriesHits: countHits(currentMonthEntries, "caloriesOnTarget"),
    };
  }

  window.HealthTrackerCalculations = {
    buildSummary,
    evaluateDailyLog,
    formatDurationFromMinutes,
    formatDurationValue,
    getTodayISODate,
    parseDurationToMinutes,
  };
})();
