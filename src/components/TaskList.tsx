import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  Plus,
  BookOpen,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Task } from "../types";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, "id" | "status">) => void;
  onDeleteTask: (taskId: string) => void;
  onPrioritizeTasks: (updatedTasks: Task[], coachMessage: string) => void;
}

export default function TaskList({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onPrioritizeTasks,
}: TaskListProps) {
  // Filters & State
  const [activeCategory, setActiveCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed">("pending");
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Quick Add Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState("Work");
  const [newEstimate, setNewEstimate] = useState<number>(30);

  const categories = ["All", "Work", "Personal", "Study", "Finance", "Health"];

  // Toggle Rationale Expansion
  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // Quick Add handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    onAddTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      dueDate: newDueDate,
      category: newCategory,
      timeEstimateMinutes: Number(newEstimate),
      scheduledDate: newDueDate, // Default schedule day to due day
    });

    setNewTitle("");
    setNewDesc("");
    setNewDueDate("");
    setNewEstimate(30);
    setShowAddForm(false);
  };

  // AI-prioritization trigger
  const handleAIPrioritization = async () => {
    setIsPrioritizing(true);
    try {
      const response = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter((t) => t.status === "pending"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to prioritize tasks");
      }

      const data = await response.json();
      
      // Map prioritzation results back into the tasks
      const prioritizedResultsMap = new Map<string, any>();
      data.prioritizedTasks.forEach((p: any) => {
        prioritizedResultsMap.set(p.id, p);
      });

      const updatedTasks = tasks.map((task) => {
        const result = prioritizedResultsMap.get(task.id);
        if (result) {
          return {
            ...task,
            aiPriority: result.aiPriority,
            timeEstimateMinutes: result.timeEstimateMinutes,
            aiRationale: result.rationale,
            // Pre-fill scheduled details if returned
            scheduledTime: result.schedulingSuggestion,
          };
        }
        return task;
      });

      onPrioritizeTasks(updatedTasks, data.overallRecommendations);
    } catch (error) {
      console.error("AI Prioritization error:", error);
      
      // Intelligent Offline Fallback sorting
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const fallbackTasks = tasks.map((task) => {
        if (task.status === "completed") return task;

        let localPriority = 5;
        let rationale = "Prioritized based on standard due date progression.";

        // Calculate deadline proximity
        const taskDueDate = new Date(task.dueDate);
        taskDueDate.setHours(0, 0, 0, 0);
        const diffTime = taskDueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          localPriority = 10;
          rationale = "CRITICAL: Task is overdue! Immediate focus is needed to prevent compounding delays.";
        } else if (diffDays === 0) {
          localPriority = 9;
          rationale = "HIGH: Scheduled or due today. Prioritizing today avoids cascading deadlines.";
        } else if (diffDays === 1) {
          localPriority = 8;
          rationale = "MEDIUM-HIGH: Due tomorrow. Actioning this today builds a solid buffer.";
        } else if (diffDays <= 3) {
          localPriority = 7;
          rationale = "MEDIUM: Due within 3 days. Recommend beginning prep work now.";
        } else {
          localPriority = Math.max(2, 6 - Math.floor(diffDays / 2));
          rationale = "LOW-MEDIUM: Due in several days. Low stress block, perfect for deep research.";
        }

        // Boost priority if category is Work or Finance
        if (task.category === "Work" || task.category === "Finance") {
          localPriority = Math.min(10, localPriority + 1);
        }

        return {
          ...task,
          aiPriority: localPriority,
          aiRationale: `${rationale} (Note: Prioritized via Aria's Offline Wisdom mode.)`,
          scheduledTime: task.scheduledTime || "Optimal Slot: Afternoon Focus Session",
        };
      });

      onPrioritizeTasks(
        fallbackTasks,
        "Aria Local Wisdom Active: Because your Gemini API quota is fully resting, I have used a high-fidelity local matrix logic to re-rank your commitments. Overdue and today's tasks have been safely promoted first to protect your schedule."
      );
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Date Check - Overdue Status helper
  const isOverdue = (dateStr: string, status: string): boolean => {
    if (status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const categoryMatch = activeCategory === "All" || task.category === activeCategory;
    const statusMatch = task.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  // Sort: pending prioritized by aiPriority descending, others by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (statusFilter === "pending") {
      const priorityA = a.aiPriority ?? 0;
      const priorityB = b.aiPriority ?? 0;
      if (priorityB !== priorityA) return priorityB - priorityA;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <CheckSquare className="text-gray-900 w-5 h-5" />
            Productivity Task Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Build your backlog, toggle categories, and run AI Priority Optimization to prevent slipping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick-add form trigger */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gray-150 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer border border-gray-200"
          >
            {showAddForm ? "Cancel" : "Quick Add Task"}
          </button>

          {/* AI Prioritize button */}
          <button
            onClick={handleAIPrioritization}
            disabled={isPrioritizing || tasks.filter((t) => t.status === "pending").length === 0}
            className="bg-gray-900 hover:bg-gray-850 text-white font-semibold text-xs px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border border-gray-800 shadow-sm"
          >
            {isPrioritizing ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="inline-block"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </motion.span>
                Prioritizing Matrix...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                AI Matrix Prioritize
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Add Form Container */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleQuickAdd}
            className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Task Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Draft financial slides"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Due Date</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Description / Subtasks</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Briefly state deliverables, constraints, or subtasks..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Time Estimate (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  required
                  value={newEstimate}
                  onChange={(e) => setNewEstimate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-5 rounded-lg transition-all cursor-pointer shadow-xs border border-emerald-500"
              >
                Add Commitment
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Category Tabs & Status filter Toggle */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toggle pending vs completed */}
        <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-100">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-all ${
              statusFilter === "pending"
                ? "bg-white text-gray-900 shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-all ${
              statusFilter === "completed"
                ? "bg-white text-gray-900 shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Tasks Grid/List */}
      <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1.5 scrollbar-thin">
        {sortedTasks.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 italic">
            No {statusFilter} commitments under "{activeCategory}". Feel free to add some!
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isTaskOverdue = isOverdue(task.dueDate, task.status);
            const isExpanded = expandedTaskId === task.id;
            
            // Priority styling parameters
            const isHigh = (task.aiPriority || 0) >= 8;
            const isMed = (task.aiPriority || 0) >= 5 && (task.aiPriority || 0) < 8;

            return (
              <motion.div
                key={task.id}
                layout
                className={`p-4 bg-white border rounded-xl hover:shadow-xs transition-all ${
                  isTaskOverdue
                    ? "border-rose-200 bg-rose-50/10"
                    : isHigh
                    ? "border-rose-100"
                    : isMed
                    ? "border-amber-100"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Side Information */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="p-1.5 mt-0.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                    >
                      {task.status === "completed" ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Square className="w-5 h-5 hover:border-gray-900 text-gray-300" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`font-semibold text-sm leading-snug truncate ${
                            task.status === "completed" ? "text-gray-400 line-through font-normal" : "text-gray-900 font-sans"
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Category badge */}
                        <span className="text-[9px] font-mono font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                          {task.category}
                        </span>

                        {/* Overdue alert badge */}
                        {isTaskOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] bg-rose-100 text-rose-800 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            <AlertCircle className="w-2.5 h-2.5" /> OVERDUE
                          </span>
                        )}
                      </div>

                      <p className={`text-xs ${task.status === "completed" ? "text-gray-300 line-through" : "text-gray-600 font-sans"}`}>
                        {task.description}
                      </p>

                      {/* Info indicators */}
                      <div className="flex flex-wrap gap-4 text-[10px] font-medium font-mono text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {task.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Est: {task.timeEstimateMinutes || "N/A"}m
                        </span>
                        
                        {/* Priority Badge */}
                        {task.aiPriority !== undefined && (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold ${
                              isHigh
                                ? "bg-rose-100/50 text-rose-700"
                                : isMed
                                ? "bg-amber-100/50 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            AI Matrix: {task.aiPriority}/10
                          </span>
                        )}
                      </div>

                      {/* Display search-grounded resources if present */}
                      {task.resources && task.resources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {task.resources.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/30 transition-all"
                            >
                              <BookOpen className="w-2.5 h-2.5 text-emerald-500" />
                              {link.title}
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side action items */}
                  <div className="flex items-center gap-1">
                    {/* Collapsible details trigger */}
                    {task.aiRationale && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                        title="AI Prioritization Rationale"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded AI Rationale Drawer */}
                <AnimatePresence>
                  {isExpanded && task.aiRationale && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pl-11 pr-4 pt-3 border-t border-gray-50 space-y-1.5 text-xs text-gray-500 leading-relaxed font-sans"
                    >
                      <p className="font-semibold text-gray-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        AI Prioritization Logic
                      </p>
                      <p className="italic text-gray-600 font-sans">"{task.aiRationale}"</p>
                      {task.scheduledTime && (
                        <p className="text-[10px] font-mono text-emerald-700 bg-emerald-50/50 inline-block px-2 py-0.5 rounded-md">
                          Suggestion: {task.scheduledTime}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
