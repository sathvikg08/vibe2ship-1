import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  TrendingUp,
  Brain,
  Info,
  Sliders,
} from "lucide-react";
import { Task, Habit, Goal } from "./types";
import TaskList from "./components/TaskList";
import AutonomousPlanner from "./components/AutonomousPlanner";
import InteractiveCalendar from "./components/InteractiveCalendar";
import HabitGoalTracker from "./components/HabitGoalTracker";
import RecommendationsPanel from "./components/RecommendationsPanel";
import VoiceChatCompanion from "./components/VoiceChatCompanion";

// Default Initial Seed Data to make the application instantly visual and functional
const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Draft quarterly marketing presentation",
    description: "Format the financial growth chart and review slides with stakeholders. Focus on delivery metrics.",
    dueDate: "2026-06-30", // Today based on metadata
    category: "Work",
    status: "pending",
    aiPriority: 9,
    timeEstimateMinutes: 60,
    aiRationale: "High urgency due to immediate upcoming quarterly review. Requires focused visual edits.",
    scheduledDate: "2026-06-30",
  },
  {
    id: "task-2",
    title: "Prepare for UX Design interview",
    description: "Review portfolio case studies, system design notes, and typical presentation questions.",
    dueDate: "2026-07-02",
    category: "Study",
    status: "pending",
    aiPriority: 7,
    timeEstimateMinutes: 120,
    aiRationale: "Substantial task requiring high energy. Recommend splitting into smaller roadmap segments.",
    scheduledDate: "2026-07-01",
  },
  {
    id: "task-3",
    title: "Pay monthly internet & power bill",
    description: "Submit online payment. Check for autopay enrollment options to save time.",
    dueDate: "2026-06-30",
    category: "Finance",
    status: "pending",
    aiPriority: 8,
    timeEstimateMinutes: 10,
    aiRationale: "Low complexity but high consequence. Do this during a quick 10m break to clear mind space.",
    scheduledDate: "2026-06-30",
  },
  {
    id: "task-4",
    title: "Schedule medical checkup",
    description: "Call practitioner office. Pre-fill vaccination log beforehand.",
    dueDate: "2026-07-05",
    category: "Health",
    status: "completed",
    aiPriority: 4,
    timeEstimateMinutes: 15,
    aiRationale: "Completed. Preventative health milestone achieved.",
    scheduledDate: "2026-07-05",
  }
];

const initialHabits: Habit[] = [
  {
    id: "habit-1",
    title: "Deep work focus session",
    streak: 4,
    frequency: "daily",
    category: "Study",
    history: ["2026-06-29", "2026-06-28", "2026-06-27"],
  },
  {
    id: "habit-2",
    title: "Daily physical exercise",
    streak: 8,
    frequency: "daily",
    category: "Health",
    history: ["2026-06-29", "2026-06-28", "2026-06-27", "2026-06-26"],
  }
];

const initialGoals: Goal[] = [
  {
    id: "goal-1",
    title: "Launch React SaaS MVP",
    description: "Complete full-stack feature cycles, configure billing, and publish to production.",
    targetDate: "2026-07-15",
    status: "active",
    subtasks: [
      { id: "sub-1", title: "Refactor core state management engine", completed: true },
      { id: "sub-2", title: "Configure server-side payment hooks", completed: false },
      { id: "sub-3", title: "Perform cross-device mobile testing", completed: false }
    ]
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("ai_companion_tasks");
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("ai_companion_habits");
    return saved ? JSON.parse(saved) : initialHabits;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("ai_companion_goals");
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [coachMessage, setCoachMessage] = useState<string>(
    "I have analyzed your tasks. Running 'AI Matrix Prioritize' will automatically re-sort your tasks based on optimal energy, time estimation, and imminent due dates."
  );

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("ai_companion_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("ai_companion_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("ai_companion_goals", JSON.stringify(goals));
  }, [goals]);

  // Task actions
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "pending" ? "completed" : "pending" }
          : t
      )
    );
  };

  const handleAddTask = (newTaskData: Omit<Task, "id" | "status">) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      status: "pending",
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handlePrioritizeTasks = (updatedTasks: Task[], coachAdvice: string) => {
    setTasks(updatedTasks);
    setCoachMessage(coachAdvice);
  };

  const handleImportTasks = (newTasks: Omit<Task, "id" | "status">[]) => {
    const mappedTasks: Task[] = newTasks.map((t, idx) => ({
      ...t,
      id: `task-imported-${Date.now()}-${idx}`,
      status: "pending",
    }));
    setTasks((prev) => [...prev, ...mappedTasks]);
  };

  const handleRescheduleTask = (taskId: string, newDate: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, dueDate: newDate, scheduledDate: newDate } : t
      )
    );
  };

  const handleAddTaskOnDate = (dateStr: string, taskTitle?: string) => {
    const finalTitle = taskTitle || prompt(`Add a scheduled task for ${dateStr}:`);
    if (finalTitle && finalTitle.trim()) {
      handleAddTask({
        title: finalTitle.trim(),
        description: "Scheduled via interactive calendar.",
        dueDate: dateStr,
        category: "Work",
        timeEstimateMinutes: 30,
        scheduledDate: dateStr,
      });
    }
  };

  // Habit actions
  const handleToggleHabit = (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const isDone = h.history.includes(todayStr);
          let newHistory = [...h.history];
          let newStreak = h.streak;

          if (isDone) {
            newHistory = newHistory.filter((d) => d !== todayStr);
            newStreak = Math.max(0, newStreak - 1);
          } else {
            newHistory.push(todayStr);
            newStreak += 1;
          }

          return { ...h, history: newHistory, streak: newStreak };
        }
        return h;
      })
    );
  };

  const handleAddHabit = (title: string, frequency: "daily" | "weekly", category: string) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title,
      streak: 0,
      frequency,
      category,
      history: [],
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Goal actions
  const handleAddGoal = (title: string, description: string, targetDate: string, subtaskTitles: string[]) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title,
      description,
      targetDate,
      status: "active",
      subtasks: subtaskTitles.map((t, idx) => ({
        id: `subtask-${Date.now()}-${idx}`,
        title: t,
        completed: false,
      })),
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleToggleGoalSubtask = (goalId: string, subtaskId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedSub = g.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          return { ...g, subtasks: updatedSub };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  // Performance calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed" && (t.dueDate === todayStr || t.scheduledDate === todayStr)).length;

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-gray-900 pb-20 selection:bg-emerald-100 selection:text-emerald-900 font-sans antialiased">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 left-0 w-[30rem] h-[30rem] bg-indigo-500/[0.01] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Primary Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Modern Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-sans flex items-center gap-2">
              <Brain className="w-6 h-6 text-gray-900 animate-pulse" />
              Aria Companion
            </h1>
            <p className="text-xs text-gray-400 font-mono tracking-wider uppercase">
              AI-POWERED PROACTIVE ACTION MATRIX
            </p>
          </div>

          {/* Quick Metrics Header Cards */}
          <div className="flex items-center gap-4">
            <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-[10px] font-mono text-gray-400 font-semibold leading-none uppercase">Backlog</p>
                <p className="text-sm font-bold text-gray-900 font-mono mt-1">{pendingCount} commitments</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-xs">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-[10px] font-mono text-gray-400 font-semibold leading-none uppercase">Done Today</p>
                <p className="text-sm font-bold text-gray-900 font-mono mt-1">{completedCount} items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Proactive Advisor Strategic Banner */}
        <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-lg border border-gray-800 flex items-start gap-4">
          <div className="p-2.5 bg-gray-800 border border-gray-750 text-emerald-400 rounded-xl flex-shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-emerald-400 flex items-center gap-1.5 font-sans">
              AI Strategic Insights
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed max-w-5xl font-sans">
              {coachMessage}
            </p>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT AREA: Tasks & Personal Coach (8 Columns on Large screen) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Task Backlog Matrix */}
            <TaskList
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onPrioritizeTasks={handlePrioritizeTasks}
            />

            {/* AI Personal Recommendations Coach Panel */}
            <RecommendationsPanel
              tasks={tasks}
              habits={habits}
              completedCount={completedCount}
            />

          </div>

          {/* RIGHT AREA: Planner, Calendar, Tracker (4 Columns on Large screen) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Habits & Goals Panel */}
            <HabitGoalTracker
              habits={habits}
              goals={goals}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onDeleteHabit={handleDeleteHabit}
              onAddGoal={handleAddGoal}
              onToggleGoalSubtask={handleToggleGoalSubtask}
              onDeleteGoal={handleDeleteGoal}
            />

            {/* Autonomous Strategic Planner */}
            <AutonomousPlanner onImportTasks={handleImportTasks} />

            {/* Interactive Week/Month Calendar */}
            <InteractiveCalendar
              tasks={tasks}
              onRescheduleTask={handleRescheduleTask}
              onAddTaskOnDate={handleAddTaskOnDate}
            />

          </div>
        </div>

      </main>

      {/* Floating Voice/Chatbot Companion Drawer */}
      <VoiceChatCompanion
        tasks={tasks}
        habits={habits}
        onTriggerPrioritize={() => {}}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
