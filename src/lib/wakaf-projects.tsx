export const wakafProjects = {
  "water-pump": {
    title: "Wakaf Water Pump",
    lead: "Contribute towards a community water project and receive the available installation record after review.",
    minimum: 25,
    icon: <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 9C25 20 17 29 17 40a15 15 0 0 0 30 0C47 29 39 20 32 9Z" /><path d="M24 42c2 5 6 7 11 7" /></svg>,
    impact: [
      ["Plan", "Confirm the project scope with an approved local fulfilment partner"],
      ["Carry out", "Complete the water project and capture every required evidence stage"],
      ["Verify", "Review the location and media before delivering the customer report"],
    ],
  },
  quran: {
    title: "Wakaf Quran",
    lead: "Support Quran distribution and keep your dedication connected to the record from request to reviewed proof.",
    minimum: 10,
    icon: <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 17c9-3 17-1 23 5v31c-6-6-14-8-23-5V17Z" /><path d="M55 17c-9-3-17-1-23 5v31c6-6 14-8 23-5V17Z" /><path d="M15 26c5-1 9 0 13 3M49 26c-5-1-9 0-13 3" /></svg>,
    impact: [
      ["Plan", "Confirm the distribution scope with an approved local fulfilment partner"],
      ["Distribute", "Carry out the Quran distribution and capture required evidence"],
      ["Verify", "Review the location and media before delivering the customer report"],
    ],
  },
  "food-for-orphans": {
    title: "Food for Orphans",
    lead: "Contribute towards a coordinated food programme and follow the record through delivery and reviewed proof.",
    minimum: 50,
    icon: <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 51S12 40 12 24c0-7 5-11 11-11 4 0 7 2 9 6 2-4 5-6 9-6 6 0 11 4 11 11 0 16-20 27-20 27Z" /><path d="M21 37c7-4 15-4 22 0" /></svg>,
    impact: [
      ["Plan", "Confirm the food programme scope with an approved local partner"],
      ["Distribute", "Carry out the programme and capture every required evidence stage"],
      ["Verify", "Review the location and media before delivering the customer report"],
    ],
  },
} as const;

export type WakafProjectSlug = keyof typeof wakafProjects;
