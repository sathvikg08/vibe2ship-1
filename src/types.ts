export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  category: string;
  status: "pending" | "completed";
  aiPriority?: number; // 1 to 10 scale
  aiRationale?: string;
  timeEstimateMinutes?: number;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM
  resources?: { title: string; url: string }[];
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  frequency: "daily" | "weekly";
  category: string;
  history: string[]; // dates when completed: YYYY-MM-DD
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  status: "active" | "completed";
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface Recommendation {
  type: string; // "focus_nudge" | "habit_streak" | "deadline_alert" | "wellbeing_check"
  title: string;
  message: string;
  urgency: "high" | "medium" | "low";
}

export interface AIPlanResult {
  planTitle: string;
  overview: string;
  subtasks: {
    title: string;
    description: string;
    durationMinutes: number;
    dayOffset: number;
    resources: { title: string; url: string }[];
  }[];
}
