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
    const proteinHitsThisMonth = monthlyLogs.filter(function (entry) {
      return !!entry.proteinOnTarget;
    }).length;

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
        key: "proteinOnTarget",
        label: "Protein",
        hit: !!log.proteinOnTarget,
        detail: `${proteinHitsThisMonth} monthly hit days`,
      },
      {
        key: "sleepHours",
        label: "Sleep",
        hit: Number(log.sleepHours || 0) >= Number(goals.sleepMinimum || 0),
        detail: `${Number(log.sleepHours || 0)} / ${Number(goals.sleepMinimum || 0)} h`,
      },
    ];

    if (goals.waterDaily) {
      rules.push({
        key: "waterTargetMet",
        label: "Water",
        hit: !!log.waterTargetMet,
        detail: log.waterTargetMet ? "met" : "missed",
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

    const counters = {
      Workout: { hits: 0, total: 0 },
      Steps: { hits: 0, total: 0 },
      Calories: { hits: 0, total: 0 },
      Protein: { hits: 0, total: 0 },
      Sleep: { hits: 0, total: 0 },
    };

    if (goals.waterDaily) {
      counters.Water = { hits: 0, total: 0 };
    }

    entries.forEach(function (entry) {
      const evaluation = evaluateDailyLog(entry, goals, logs);
      evaluation.results.forEach(function (result) {
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
    if (weeklyAdherence.percentage >= 80 && monthlyAdherence.percentage >= 75) {
      return "On track";
    }

    if (weeklyAdherence.percentage >= 60 || monthlyAdherence.percentage >= 60) {
      return "Slightly off track";
    }

    if (todayEvaluation.total === 0) {
      return "On track";
    }

    return "Off track";
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
      monthlyProteinHits: countHits(currentMonthEntries, "proteinOnTarget"),
    };
  }

  window.HealthTrackerCalculations = {
    buildSummary,
    evaluateDailyLog,
    getTodayISODate,
  };
})();
