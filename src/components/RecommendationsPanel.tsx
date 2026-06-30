import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  RefreshCw,
  Bell,
  CheckCircle,
  Clock,
  Heart,
  Loader2,
} from "lucide-react";
import { Recommendation, Task, Habit } from "../types";

interface RecommendationsPanelProps {
  tasks: Task[];
  habits: Habit[];
  completedCount: number;
}

// Helper to generate highly personalized local recommendations based on current state
const generateLocalRecommendations = (tasks: Task[], habits: Habit[], completedCount: number): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Check for overdue tasks
  const overdueTasks = pendingTasks.filter((t) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  if (overdueTasks.length > 0) {
    recommendations.push({
      type: "deadline_alert",
      title: `Rescue Overdue Task${overdueTasks.length > 1 ? "s" : ""}`,
      message: `"${overdueTasks[0].title}" is past its due date. Commit a focused 15-minute chunk right now to make partial progress.`,
      urgency: "high",
    });
  }

  // 2. Check for tasks due today
  const dueTodayTasks = pendingTasks.filter((t) => t.dueDate === todayStr);
  if (dueTodayTasks.length > 0 && recommendations.length < 3) {
    recommendations.push({
      type: "focus_nudge",
      title: "Action Today's Commitments",
      message: `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} scheduled for today. Start with "${dueTodayTasks[0].title}" to build quick momentum.`,
      urgency: "high",
    });
  }

  // 3. Habit streak preservation
  const habitsWithStreaks = habits.filter((h) => h.streak > 0);
  if (habitsWithStreaks.length > 0 && recommendations.length < 3) {
    const bestHabit = [...habitsWithStreaks].sort((a, b) => b.streak - a.streak)[0];
    const isDoneToday = bestHabit.history.includes(todayStr);

    if (!isDoneToday) {
      recommendations.push({
        type: "habit_streak",
        title: `Protect Your ${bestHabit.streak}-Day Streak!`,
        message: `You have an active streak for "${bestHabit.title}". Prioritize performing this habit today to lock in your discipline.`,
        urgency: "medium",
      });
    }
  }

  // 4. Wellbeing / Break check
  if (completedCount >= 2 && recommendations.length < 3) {
    recommendations.push({
      type: "wellbeing_check",
      title: "Mental Refueling Session",
      message: `Excellent! You've accomplished ${completedCount} items today. Step away for a quick screen-free stretch to keep your focus sustainable.`,
      urgency: "low",
    });
  }

  // Fillers to always guarantee 3 high quality recommendations
  if (recommendations.length < 3) {
    const highPriorityTasks = pendingTasks.filter((t) => (t.aiPriority || 0) >= 8);
    if (highPriorityTasks.length > 0) {
      recommendations.push({
        type: "focus_nudge",
        title: "Tackle Your High-Priority Core",
        message: `"${highPriorityTasks[0].title}" is flagged as highly critical. Schedule it for your peak energy period today.`,
        urgency: "medium",
      });
    }
  }

  if (recommendations.length < 3) {
    recommendations.push({
      type: "focus_nudge",
      title: "Apply the 2-Minute Habit Rule",
      message: "If a task takes under 2 minutes, complete it immediately. It reduces micro-stress and unburdens your focus backlog.",
      urgency: "low",
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      type: "wellbeing_check",
      title: "Pace Yourself Steadily",
      message: "A quick glass of water and dynamic posture resets can boost logical clarity by up to 15%. Take care of your instrument.",
      urgency: "low",
    });
  }

  return recommendations.slice(0, 3);
};

export default function RecommendationsPanel({
  tasks,
  habits,
  completedCount,
}: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() =>
    generateLocalRecommendations(tasks, habits, completedCount)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [usingAI, setUsingAI] = useState(false);

  // Sync with state changes gracefully using smart offline generator by default
  useEffect(() => {
    if (!usingAI) {
      setRecommendations(generateLocalRecommendations(tasks, habits, completedCount));
    }
  }, [tasks, habits, completedCount, usingAI]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setQuotaExceeded(false);
    try {
      const localTime = new Date().toISOString();
      const response = await fetch("/api/gemini/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter((t) => t.status === "pending"),
          habits,
          completedCount,
          localTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load recommendations");
      }

      const data = await response.json();
      setRecommendations(data);
      setUsingAI(true);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      setQuotaExceeded(true);
      setUsingAI(false);
      // Fallback immediately to high-quality local insights
      setRecommendations(generateLocalRecommendations(tasks, habits, completedCount));
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "deadline_alert":
        return <Bell className="w-4 h-4 text-rose-500" />;
      case "habit_streak":
        return <CheckCircle className="w-4 h-4 text-amber-500" />;
      case "wellbeing_check":
        return <Heart className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-rose-50/70 border-rose-100 text-rose-950 shadow-xs";
      case "medium":
        return "bg-amber-50/70 border-amber-100 text-amber-950 shadow-xs";
      default:
        return "bg-gray-50/70 border-gray-100 text-gray-950 shadow-xs";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-gray-900">AI Personal Coach</h2>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider">
                {usingAI ? "GEMINI INTELLIGENCE ACTIVE" : "LOCAL SYNTHESIZED WISDOM"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quotaExceeded && (
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 font-medium px-2 py-1 rounded-lg">
                Daily API Limit Reached
              </span>
            )}
            <button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-40 cursor-pointer border border-transparent hover:border-gray-100 flex items-center gap-1 text-xs"
              title="Refresh Coach insights"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
              <span className="font-semibold text-[11px]">Ask AI Coach</span>
            </button>
          </div>
        </div>

        {quotaExceeded && (
          <div className="mb-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-900 leading-relaxed">
            The Gemini API is currently resting. To ensure zero disruption, Aria has seamlessly switched to high-fidelity, rule-based productivity engines.
          </div>
        )}

        {/* Coach Nudges / Recommendations */}
        <div className="space-y-3">
          {isLoading && recommendations.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
              <p className="text-xs text-gray-400 italic">Analyzing schedule templates...</p>
            </div>
          ) : (
            recommendations.slice(0, 3).map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3.5 rounded-xl border flex gap-3 transition-colors ${getUrgencyStyles(
                  rec.urgency
                )}`}
              >
                <div className="flex-shrink-0 mt-0.5">{getIcon(rec.type)}</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5 font-sans">
                    {rec.title}
                    {rec.urgency === "high" && (
                      <span className="text-[8px] bg-rose-100 text-rose-800 font-mono font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        CRITICAL
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed font-sans">
                    {rec.message}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-mono text-gray-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          {completedCount} completed today
        </span>
        <span>Supports Pomodoro Mode</span>
      </div>
    </div>
  );
}
