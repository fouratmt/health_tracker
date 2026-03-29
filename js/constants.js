(function () {
  window.HealthTrackerConstants = {
    STORAGE_KEY: "personal-health-tracker",
    STORAGE_VERSION: 4,
    DEFAULT_PREFERENCES: {
      theme: "light",
    },
    DEFAULT_GOALS: {
      stepsMinimum: 8000,
      sleepMinimum: "07:00",
      sleepScoreMinimum: 80,
      weeklyWorkoutTarget: 4,
      monthlyCaloriesTarget: 24,
      waterDaily: true,
      noSugarDaily: false,
      weightTrendDirection: "down",
    },
  };
})();
