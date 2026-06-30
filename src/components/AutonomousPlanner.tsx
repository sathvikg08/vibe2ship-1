import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Calendar,
  Globe,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Loader2,
  Bookmark,
} from "lucide-react";
import { AIPlanResult, Task } from "../types";

interface AutonomousPlannerProps {
  onImportTasks: (tasks: Omit<Task, "id" | "status">[]) => void;
}

export default function AutonomousPlanner({ onImportTasks }: AutonomousPlannerProps) {
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<AIPlanResult | null>(null);
  const [imported, setImported] = useState(false);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsLoading(true);
    setPlanResult(null);
    setImported(false);

    try {
      const response = await fetch("/api/gemini/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, deadline }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();
      setPlanResult(data);
    } catch (error) {
      console.error("Error generating plan:", error);
      
      // Fallback local smart template roadmap
      const cleanGoal = goal.trim();
      const localPlan: AIPlanResult = {
        planTitle: `Action Roadmap: ${cleanGoal}`,
        overview: `Aria Offline Wisdom: The Gemini API is currently resting, so I have synthesized this professional 5-step delivery roadmap locally based on standard agile development and task segmentation guidelines.`,
        subtasks: [
          {
            title: "Define core deliverables and MVP scope",
            description: "Clarify the absolute minimum constraints, eliminate non-essential items, and finalize immediate checklist specifications.",
            durationMinutes: 45,
            dayOffset: 0,
            resources: [
              { title: "Eisenhower Productivity Guide", url: "https://en.wikipedia.org/wiki/First_Things_First_(book)" }
            ]
          },
          {
            title: "Research best practices and gather references",
            description: "Analyze successful implementations or references. Gather templates, code blocks, or UI styles to streamline your builds.",
            durationMinutes: 60,
            dayOffset: 1,
            resources: [
              { title: "Google Search", url: "https://www.google.com" }
            ]
          },
          {
            title: "Draft structural baseline or baseline blueprint",
            description: "Map out the skeleton or structure. Do a low-fidelity iteration to quickly prove the core concept.",
            durationMinutes: 120,
            dayOffset: 2,
            resources: []
          },
          {
            title: "Execute primary build and feature integration",
            description: "Dedicate an intensive, uninterrupted block to construct the primary module or deliverable.",
            durationMinutes: 180,
            dayOffset: 3,
            resources: []
          },
          {
            title: "Perform final testing, polishing, and refinement",
            description: "Conduct cross-scenario tests. Clean spacing, remove console logs, and verify complete delivery criteria.",
            durationMinutes: 60,
            dayOffset: 4,
            resources: []
          }
        ]
      };

      setPlanResult(localPlan);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPlan = () => {
    if (!planResult) return;

    // Convert plan subtasks into actual tasks
    const tasksToImport: Omit<Task, "id" | "status">[] = planResult.subtasks.map((step) => {
      // Calculate target date based on day offset
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + step.dayOffset);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
      const dd = String(targetDate.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      return {
        title: step.title,
        description: step.description,
        dueDate: formattedDate,
        category: "Study", // Default generated goals to study/action
        aiPriority: 8 - step.dayOffset > 1 ? 8 - step.dayOffset : 3, // Initial declining priority as steps get further out
        timeEstimateMinutes: step.durationMinutes,
        scheduledDate: formattedDate,
        resources: step.resources,
      };
    });

    onImportTasks(tasksToImport);
    setImported(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="text-emerald-500 w-5 h-5 animate-pulse" />
            AI Strategic Planner
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Break complex goals down into search-grounded action plans with tutorial links.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGeneratePlan} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider font-mono">
            What is your high-level goal?
          </label>
          <input
            type="text"
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Prep for UX Design Interview, Learn Docker, Launch Newsletter..."
            className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-sm text-gray-800 font-sans transition-all"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider font-mono">
              Target Deadline (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-sm text-gray-800 transition-all cursor-pointer font-mono font-medium"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !goal.trim()}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-gray-850 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  Researching web guides...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Generate Action Plan
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading States Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex flex-col items-center justify-center py-8 text-center"
          >
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-emerald-900 font-sans">
              Aria is searching the web for your goal...
            </p>
            <p className="text-xs text-emerald-700/80 max-w-sm mt-1.5 leading-relaxed font-sans">
              I am retrieving recommended curriculums, checking timelines, and curating actual tutorial links to set up your roadmap.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {planResult && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 border-t border-gray-100 pt-6 space-y-5"
          >
            {/* Strategy Card */}
            <div className="bg-gray-55 px-5 py-4 rounded-xl border border-gray-100 bg-gray-50/30">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 font-sans">
                <Bookmark className="w-4 h-4 text-emerald-500" />
                Plan Overview: {planResult.planTitle}
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {planResult.overview}
              </p>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                Curated Action Steps & Resources
              </h4>
              <div className="relative border-l-2 border-gray-100 ml-3.5 pl-5 space-y-5 py-2">
                {planResult.subtasks.map((step, index) => (
                  <div key={index} className="relative group">
                    {/* Circle badge */}
                    <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-white border-2 border-gray-900 text-[10px] font-bold flex items-center justify-center text-gray-900 font-mono shadow-sm">
                      {index + 1}
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="font-medium text-sm text-gray-900 leading-snug">{step.title}</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                            Day +{step.dayOffset}
                          </span>
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-mono">
                            {step.durationMinutes} mins
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Resources Links Grounded in Google Search */}
                      {step.resources && step.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-0.5">
                          {step.resources.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50/40 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50 transition-colors"
                            >
                              <Globe className="w-3 h-3 text-emerald-500" />
                              {link.title}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action panel */}
            <div className="pt-4 flex justify-end">
              {imported ? (
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4" />
                  Roadmap successfully imported to your schedule!
                </div>
              ) : (
                <button
                  onClick={handleImportPlan}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-emerald-500 shadow-sm"
                >
                  <Plus className="w-4.5 h-4.5" />
                  Import roadmap to Tasks
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
