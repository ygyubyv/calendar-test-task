export interface Interval {
  bt: number;
  et: number;
}

export type WeekDay = "mo" | "tu" | "we" | "th" | "fr" | "sa" | "su";
export type WeekSchedule = Record<WeekDay, Interval[]>;
