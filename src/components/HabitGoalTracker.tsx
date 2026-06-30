import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  Target,
  Plus,
  Trash2,
  Check,
  Zap,
  TrendingUp,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { Habit, Goal } from "../types";

interface HabitGoalTrackerProps {
  habits: Habit[];
  goals: Goal[];
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (title: string, frequency: "daily" | "weekly", category: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onAddGoal: (title: string, description: string, targetDate: string, subtasks: string[]) => void;
  onToggleGoalSubtask: (goalId: string, subtaskId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function HabitGoalTracker({
  habits,
  goals,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onAddGoal,
  onToggleGoalSubtask,
  onDeleteGoal,
}: HabitGoalTrackerProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"habits" | "goals">("habits");

  // New Habit Form
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [habitFreq, setHabitFreq] = useState<"daily" | "weekly">("daily");
  const [habitCategory, setHabitCategory] = useState("Work");

  // New Goal Form
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newGoalSubtaskInput, setNewGoalSubtaskInput] = useState("");
  const [newGoalSubtasks, setNewGoalSubtasks] = useState<string[]>([]);

  const handleAddHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle.trim(), habitFreq, habitCategory);
    setNewHabitTitle("");
  };

  const handleAddSubtaskLocal = () => {
    if (!newGoalSubtaskInput.trim()) return;
    setNewGoalSubtasks((prev) => [...prev, newGoalSubtaskInput.trim()]);
    setNewGoalSubtaskInput("");
  };

  const handleRemoveSubtaskLocal = (index: number) => {
    setNewGoalSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalDate) return;
    onAddGoal(newGoalTitle.trim(), newGoalDesc.trim(), newGoalDate, newGoalSubtasks);
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalDate("");
    setNewGoalSubtasks([]);
    setShowAddGoalModal(false);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex flex-col max-h-[320px] overflow-y-auto scrollbar-thin">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("habits")}
            className={`text-xs font-semibold tracking-tight pb-1 cursor-pointer relative transition-all ${
              activeTab === "habits" ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Habit Streams
            {activeTab === "habits" && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`text-xs font-semibold tracking-tight pb-1 cursor-pointer relative transition-all ${
              activeTab === "goals" ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Milestone Goals
            {activeTab === "goals" && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
              />
            )}
          </button>
        </div>

        {activeTab === "goals" && (
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="inline-flex items-center gap-1 text-[9px] font-bold bg-gray-900 hover:bg-gray-800 text-white px-2 py-0.5 rounded-md cursor-pointer transition-colors uppercase tracking-wider"
          >
            <Plus className="w-2.5 h-2.5" />
            Add Goal
          </button>
        )}
      </div>

      {/* Habits Tab Content */}
      <div className="flex-1 flex flex-col justify-between">
        {activeTab === "habits" ? (
          <div className="space-y-2">
            {/* Quick Add Habit */}
            <form onSubmit={handleAddHabitSubmit} className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
              <input
                type="text"
                required
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="Form a new habit (e.g. Code daily...)"
                className="flex-1 px-2 py-0.5 text-[11px] bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
              />
              <select
                value={habitFreq}
                onChange={(e: any) => setHabitFreq(e.target.value)}
                className="bg-white border border-gray-200 text-[10px] px-1 py-0.5 rounded-md focus:outline-none text-gray-700 cursor-pointer font-medium"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <select
                value={habitCategory}
                onChange={(e: any) => setHabitCategory(e.target.value)}
                className="bg-white border border-gray-200 text-[10px] px-1 py-0.5 rounded-md focus:outline-none text-gray-700 cursor-pointer font-medium"
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Study">Study</option>
                <option value="Fitness">Fitness</option>
              </select>
              <button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white px-2 py-0.5 text-[10px] font-semibold rounded-md flex items-center gap-0.5 cursor-pointer transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                Track
              </button>
            </form>

            {/* List of Habits */}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-none pr-1">
              {habits.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-gray-400 italic">
                  No habits tracked yet. Start building streaks!
                </div>
              ) : (
                habits.map((habit) => {
                  const isCompletedToday = habit.history.includes(todayStr);

                  return (
                    <motion.div
                      key={habit.id}
                      layout
                      className="p-1.5 px-2 bg-white border border-gray-100 rounded-lg flex items-center justify-between gap-2 group hover:border-gray-200 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleHabit(habit.id)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                            isCompletedToday
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                              : "bg-gray-50 border-gray-200 hover:border-gray-900 text-transparent hover:text-gray-400"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>

                        <div>
                          <p className={`text-[11px] font-medium leading-tight ${isCompletedToday ? "text-gray-400 line-through" : "text-gray-900"}`}>
                            {habit.title}
                          </p>
                          <span className="text-[8px] text-gray-400 uppercase tracking-wider font-mono font-bold block mt-0.5">
                            {habit.frequency} • {habit.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Streak Badge */}
                        <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100/50 text-amber-700 px-1 py-0.2 rounded text-[9px] font-bold font-mono">
                          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>{habit.streak}d</span>
                        </div>

                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="p-0.5 text-gray-300 hover:text-rose-600 rounded hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Goals Tab Content */
          <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-none pr-1">
            {goals.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 italic">
                No milestone goals added yet. Create a big-picture project!
              </div>
            ) : (
              goals.map((goal) => {
                // Calculate percentage
                const total = goal.subtasks.length;
                const completed = goal.subtasks.filter((s) => s.completed).length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <motion.div
                    key={goal.id}
                    layout
                    className="p-3 bg-white border border-gray-100 rounded-xl space-y-2 group hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-emerald-500" />
                          {goal.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{goal.description}</p>
                        <span className="text-[9px] text-gray-400 font-mono block mt-1">
                          Target Date: {goal.targetDate}
                        </span>
                      </div>

                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1 text-gray-300 hover:text-rose-600 rounded hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                        <span>Progress</span>
                        <span>{percentage}% ({completed}/{total})</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="bg-emerald-500 h-full rounded-full shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Checklists */}
                    {total > 0 && (
                      <div className="border-t border-gray-50 pt-2 space-y-1">
                        {goal.subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => onToggleGoalSubtask(goal.id, sub.id)}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 cursor-pointer group/item py-0.5"
                          >
                            {sub.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-gray-300 group-hover/item:text-gray-400" />
                            )}
                            <span className={`flex-1 truncate ${sub.completed ? "text-gray-400 line-through font-normal" : "text-gray-700"}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Create Goal Modal overlay */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-50 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base tracking-tight flex items-center gap-1.5">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Create Big Milestone Goal
                </h3>
                <button
                  onClick={() => setShowAddGoalModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-sm font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAddGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 font-mono uppercase tracking-wider">Goal Title</label>
                  <input
                    type="text"
                    required
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Complete Portfolio Website"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 font-mono uppercase tracking-wider">Goal Description</label>
                  <textarea
                    value={newGoalDesc}
                    onChange={(e) => setNewGoalDesc(e.target.value)}
                    placeholder="e.g. Gather 3 projects, polish copy, write case studies..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 font-mono uppercase tracking-wider">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm cursor-pointer"
                  />
                </div>

                {/* Subtask additions */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 font-mono uppercase tracking-wider">Milestone Checklist</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGoalSubtaskInput}
                      onChange={(e) => setNewGoalSubtaskInput(e.target.value)}
                      placeholder="Add a step (e.g. Purchase domain)"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtaskLocal}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Local subtask rendering */}
                  {newGoalSubtasks.length > 0 && (
                    <div className="mt-2.5 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-150 max-h-24 overflow-y-auto">
                      {newGoalSubtasks.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-xs font-medium text-gray-600">
                          <span className="truncate">• {sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtaskLocal(idx)}
                            className="text-rose-500 hover:text-rose-700 hover:underline text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Save Big Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
