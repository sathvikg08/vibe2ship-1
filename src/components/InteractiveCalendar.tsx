import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { Task } from "../types";

interface InteractiveCalendarProps {
  tasks: Task[];
  onRescheduleTask: (taskId: string, newDate: string) => void;
  onAddTaskOnDate: (date: string, title?: string) => void;
}

export default function InteractiveCalendar({
  tasks,
  onRescheduleTask,
  onAddTaskOnDate,
}: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"month" | "week">("month");

  // Custom modal states
  const [selectedTaskToReschedule, setSelectedTaskToReschedule] = useState<Task | null>(null);
  const [selectedDateForNewTask, setSelectedDateForNewTask] = useState<string | null>(null);
  const [customRescheduleDate, setCustomRescheduleDate] = useState("");
  const [newScheduledTaskTitle, setNewScheduledTaskTitle] = useState("");
  const [newScheduledTaskCategory, setNewScheduledTaskCategory] = useState("Work");
  const [newScheduledTaskEst, setNewScheduledTaskEst] = useState(30);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper arrays
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Month navigation
  const handlePrev = () => {
    const prev = new Date(currentDate);
    if (viewType === "month") {
      prev.setMonth(prev.getMonth() - 1);
    } else {
      prev.setDate(prev.getDate() - 7);
    }
    setCurrentDate(prev);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewType === "month") {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateString = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Predefined quick rescheduling choices
  const getQuickRescheduleOptions = (task: Task) => {
    const options = [];
    const base = new Date();

    // Choice 1: Today
    options.push({
      label: "Today",
      dateStr: formatDateString(base),
    });

    // Choice 2: Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(base.getDate() + 1);
    options.push({
      label: "Tomorrow",
      dateStr: formatDateString(tomorrow),
    });

    // Choice 3: In 3 Days
    const in3Days = new Date();
    in3Days.setDate(base.getDate() + 3);
    options.push({
      label: "In 3 Days",
      dateStr: formatDateString(in3Days),
    });

    // Choice 4: Next Monday
    const nextMonday = new Date();
    const currentDay = base.getDay();
    const daysToMonday = currentDay === 0 ? 1 : 8 - currentDay;
    nextMonday.setDate(base.getDate() + daysToMonday);
    options.push({
      label: "Next Monday",
      dateStr: formatDateString(nextMonday),
    });

    return options;
  };

  // Handle actual reschedule submission
  const executeReschedule = (newDateStr: string) => {
    if (!selectedTaskToReschedule) return;
    onRescheduleTask(selectedTaskToReschedule.id, newDateStr);
    setSelectedTaskToReschedule(null);
  };

  // Handle task quick create submission
  const executeAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateForNewTask || !newScheduledTaskTitle.trim()) return;
    
    // Call the parent handler
    onAddTaskOnDate(selectedDateForNewTask, newScheduledTaskTitle.trim());
    
    // Simulate direct dispatching or allow prompt trigger bypass by just closing
    // and passing title
    setSelectedDateForNewTask(null);
    setNewScheduledTaskTitle("");
  };

  // Render Month View
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: Date[] = [];
    
    // Previous month padding days
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDaysCount - i));
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Next month padding days
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    const todayStr = formatDateString(new Date());

    return (
      <div className="grid grid-cols-7 gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
        {days.map((day, index) => {
          const dayStr = formatDateString(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = dayStr === todayStr;
          
          // Filter tasks due or scheduled on this specific day
          const dayTasks = tasks.filter(
            (t) => t.dueDate === dayStr || t.scheduledDate === dayStr
          );

          return (
            <div
              key={index}
              className={`min-h-[115px] bg-white p-3 rounded-xl border border-gray-100 flex flex-col justify-between transition-all group hover:bg-gray-50/50 hover:shadow-xs relative ${
                !isCurrentMonth ? "opacity-35" : ""
              } ${isToday ? "ring-1.5 ring-gray-900/50 shadow-xs" : ""}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-mono font-bold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                    isToday
                      ? "bg-gray-900 text-white font-extrabold shadow-sm"
                      : "text-gray-500 group-hover:text-gray-900"
                  }`}
                >
                  {day.getDate()}
                </span>
                
                {/* Clean inline Quick Add Button */}
                <button
                  onClick={() => setSelectedDateForNewTask(dayStr)}
                  className="p-1 rounded-md text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Schedule a commitment on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[75px] scrollbar-none">
                {dayTasks.map((task) => {
                  const isHigh = (task.aiPriority || 0) >= 8;
                  const isMed = (task.aiPriority || 0) >= 5 && (task.aiPriority || 0) < 8;
                  
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskToReschedule(task);
                        setCustomRescheduleDate(task.dueDate);
                      }}
                      className={`text-[10px] px-2 py-1 rounded-lg border flex items-center justify-between cursor-pointer hover:shadow-sm hover:-translate-y-[1px] transition-all truncate ${
                        task.status === "completed"
                          ? "bg-gray-50 text-gray-400 border-gray-100 line-through"
                          : isHigh
                          ? "bg-rose-50/60 text-rose-800 border-rose-100/70 hover:bg-rose-50"
                          : isMed
                          ? "bg-amber-50/60 text-amber-800 border-amber-100/70 hover:bg-amber-50"
                          : "bg-gray-50 text-gray-700 border-gray-150/70 hover:bg-gray-100"
                      }`}
                      title={`${task.title} (Priority: ${task.aiPriority || "N/A"}) - Click to Reschedule`}
                    >
                      <span className="truncate pr-1 font-medium">{task.title}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const days: Date[] = [];
    const currentDayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    const todayStr = formatDateString(new Date());

    return (
      <div className="grid grid-cols-7 gap-3 min-h-[320px]">
        {days.map((day, index) => {
          const dayStr = formatDateString(day);
          const isToday = dayStr === todayStr;
          const dayTasks = tasks.filter(
            (t) => t.dueDate === dayStr || t.scheduledDate === dayStr
          );

          return (
            <div
              key={index}
              className={`bg-white rounded-xl p-4 border flex flex-col justify-between group hover:shadow-sm transition-all relative ${
                isToday ? "border-gray-900 bg-white ring-1 ring-gray-900/40" : "border-gray-150"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="text-left">
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    {daysOfWeek[index]}
                  </p>
                  <p className={`text-base font-extrabold font-mono mt-0.5 ${isToday ? "text-gray-900" : "text-gray-600"}`}>
                    {day.getDate()}
                  </p>
                </div>
                
                <button
                  onClick={() => setSelectedDateForNewTask(dayStr)}
                  className="p-1 rounded-md text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Schedule a commitment on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none max-h-[190px]">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-10 text-[10px] text-gray-400 text-center italic">
                    Free day
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const isHigh = (task.aiPriority || 0) >= 8;
                    const isMed = (task.aiPriority || 0) >= 5 && (task.aiPriority || 0) < 8;
                    
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskToReschedule(task);
                          setCustomRescheduleDate(task.dueDate);
                        }}
                        className={`text-[10px] px-2.5 py-2 rounded-lg border cursor-pointer hover:shadow-xs hover:-translate-y-[1px] transition-all flex flex-col justify-between h-15 ${
                          task.status === "completed"
                            ? "bg-gray-50 text-gray-400 border-gray-100 line-through"
                            : isHigh
                            ? "bg-rose-50/70 text-rose-800 border-rose-100 hover:bg-rose-50"
                            : isMed
                            ? "bg-amber-50/70 text-amber-800 border-amber-100 hover:bg-amber-50"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                        title={`${task.title} (Priority: ${task.aiPriority || "N/A"}) - Click to Reschedule`}
                      >
                        <span className="font-semibold truncate leading-tight">{task.title}</span>
                        <div className="flex items-center justify-between text-[8px] font-mono mt-1.5 text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.timeEstimateMinutes ? `${task.timeEstimateMinutes}m` : "No est"}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                          }`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
      {/* Calendar header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-gray-900 w-5 h-5 animate-pulse" />
            Interactive Scheduler
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Map deadlines and active focus templates. Click any task to instantly change target date.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week/Month Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-100">
            <button
              onClick={() => setViewType("month")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                viewType === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType("week")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                viewType === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Week
            </button>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-mono font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all cursor-pointer"
            >
              TODAY
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-base text-gray-900 tracking-tight font-sans">
          {viewType === "month"
            ? `${monthNames[month]} ${year}`
            : `Week of ${currentDate.toLocaleDateString([], { month: "short", day: "numeric" })}`}
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-3.5 text-[10px] text-gray-400 font-bold font-sans">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> High Priority
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Med Priority
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal/Low
          </div>
        </div>
      </div>

      {/* Week Headers */}
      {viewType === "month" && (
        <div className="grid grid-cols-7 gap-1 mb-1 font-mono uppercase font-bold text-[10px] tracking-wider text-gray-400 text-center">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      {viewType === "month" ? renderMonthView() : renderWeekView()}

      {/* Modern Rescheduling Dialog Modal */}
      <AnimatePresence>
        {selectedTaskToReschedule && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-150 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold bg-gray-150 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                    Reschedule Event
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight mt-1 truncate max-w-[240px]">
                    {selectedTaskToReschedule.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTaskToReschedule(null)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Choice Buttons */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickRescheduleOptions(selectedTaskToReschedule).map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => executeReschedule(opt.dateStr)}
                      className="bg-gray-50 hover:bg-gray-150 hover:text-gray-900 border border-gray-100 text-gray-700 text-xs py-2 px-3 rounded-lg transition-all text-left font-medium flex items-center justify-between group cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-gray-900 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Selection */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono block">
                  Select Custom Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customRescheduleDate}
                    onChange={(e) => setCustomRescheduleDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer font-mono font-bold"
                  />
                  <button
                    onClick={() => {
                      if (/^\d{4}-\d{2}-\d{2}$/.test(customRescheduleDate)) {
                        executeReschedule(customRescheduleDate);
                      }
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Date Slot Quick Add Modal */}
      <AnimatePresence>
        {selectedDateForNewTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-150 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded uppercase tracking-wider">
                    Schedule New Commitment
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight mt-1">
                    Date Slot: {selectedDateForNewTask}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDateForNewTask(null)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/50 text-[11px] text-emerald-800 leading-normal flex gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Enter a title to schedule a commitment. Close the modal or hit confirm to save.</span>
              </div>

              <form onSubmit={executeAddTask} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                    Commitment Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Conduct prototype walkthrough"
                    value={newScheduledTaskTitle}
                    onChange={(e) => setNewScheduledTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-xs text-gray-800"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDateForNewTask(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Schedule Task
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
