(function () {
  window.HealthTrackerConstants = {
    STORAGE_KEY: "personal-health-tracker",
    STORAGE_VERSION: 3,
    DEFAULT_PREFERENCES: {
      theme: "light",
    },
    DEFAULT_GOALS: {
      stepsMinimum: 8000,
      sleepMinimum: 7,
      sleepScoreMinimum: 80,
      weeklyWorkoutTarget: 4,
      monthlyCaloriesTarget: 24,
      waterDaily: true,
      weightTrendDirection: "down",
    },
  };
})();
