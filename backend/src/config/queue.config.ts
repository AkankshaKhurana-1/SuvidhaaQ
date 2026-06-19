export const queueConfig = {
  // Default estimated consultation time per patient in minutes
  defaultConsultationTimeMin: 15,

  // Maximum allowed patients in a single doctor's active queue
  maxQueueSize: 50,

  // Weights used by the priority engine to calculate patient priority scores
  priorityWeights: {
    // Weight for medical severity (e.g., Triage level 1-5)
    severity: 10,
    // Weight for appointment status (having a scheduled appointment vs walk-in)
    hasAppointment: 5,
    // Weight for wait duration (to prevent starvation, increase priority over time)
    waitDurationMin: 0.1,
    // Weight for patient age (e.g., elderly patients prioritized)
    elderlyAgeThreshold: 65,
    elderlyPriorityBonus: 3,
  },

  // Refresh interval for live queue updates in milliseconds
  liveUpdateIntervalMs: 5000,
};
