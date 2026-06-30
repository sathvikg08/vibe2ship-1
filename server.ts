import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini client with proper telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// Helper functions for offline/rate-limited fallback operations
const generateLocalChatResponse = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("procrastinat") || lower.includes("start") || lower.includes("struggl") || lower.includes("lazy")) {
    return "Procrastination is often just anxiety about the first step. Let's try the 5-Minute Rule: choose one of your tasks, set a timer for exactly 5 minutes, and commit to working ONLY on it. Once the friction of starting is gone, you'll naturally want to continue! Is there a task you want to try this with?";
  }
  if (lower.includes("deadline") || lower.includes("priorit") || lower.includes("matrix") || lower.includes("schedule")) {
    return "To prioritize your workload right now, let's use the Eisenhower Matrix strategy:\n\n1. Rescue any **Overdue** items first to prevent compounding delays.\n2. Complete tasks due **Today** to maintain momentum.\n3. Schedule or break down complex items.\n\nWhich task should we focus on first?";
  }
  if (lower.includes("hack") || lower.includes("tip") || lower.includes("advice") || lower.includes("focus") || lower.includes("study")) {
    return "Here are my top 3 focus hacks:\n\n1. **The 2-Minute Habit Rule**: If a task takes under 2 minutes, complete it immediately to free up mental space.\n2. **Mono-Tasking**: Hide or close all tabs except the one you need for your active task.\n3. **Postural & Screen-Free Reset**: Stand up, take 3 deep breaths, and drink a glass of water. It resets cognitive load.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("aria")) {
    return "Hello! I'm Aria, your empathetic productivity coach. I'm currently running in offline support mode to ensure zero disruption. How can I help you conquer your goals today?";
  }
  return "I'm currently running in Aria's local offline support mode. I'd love to help you plan or prioritize! Tell me more about what you're working on, or ask me for a focus tip.";
};

function generateLocalPrioritization(tasks: any[], habits: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prioritizedTasks = (tasks || []).map((task) => {
    let localPriority = 5;
    let rationale = "Prioritized based on due date progression.";
    let timeEstimateMinutes = task.timeEstimateMinutes || 30;

    const taskDueDate = new Date(task.dueDate || new Date());
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

    if (task.category === "Work" || task.category === "Finance") {
      localPriority = Math.min(10, localPriority + 1);
    }

    return {
      id: task.id,
      aiPriority: localPriority,
      timeEstimateMinutes,
      rationale: `${rationale} (Note: Offline wisdom applied.)`,
      schedulingSuggestion: "Optimal Slot: Afternoon Focus block"
    };
  });

  return {
    prioritizedTasks,
    overallRecommendations: "Aria Local Wisdom Active: Because your Gemini API quota is fully resting, I have used a high-fidelity local matrix logic to re-rank your commitments. Overdue and today's tasks have been safely promoted first to protect your schedule."
  };
}

function generateLocalRecommendations(tasks: any[] = [], habits: any[] = [], completedCount: number = 0) {
  const recommendations: any[] = [];
  const pendingTasks = (tasks || []).filter((t: any) => t.status === "pending");
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Check for overdue tasks
  const overdueTasks = pendingTasks.filter((t: any) => {
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
  const dueTodayTasks = pendingTasks.filter((t: any) => t.dueDate === todayStr);
  if (dueTodayTasks.length > 0 && recommendations.length < 3) {
    recommendations.push({
      type: "focus_nudge",
      title: "Action Today's Commitments",
      message: `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} scheduled for today. Start with "${dueTodayTasks[0].title}" to build quick momentum.`,
      urgency: "high",
    });
  }

  // 3. Habit streak preservation
  const habitsWithStreaks = (habits || []).filter((h: any) => h.streak > 0);
  if (habitsWithStreaks.length > 0 && recommendations.length < 3) {
    const bestHabit = [...habitsWithStreaks].sort((a, b) => b.streak - a.streak)[0];
    const isDoneToday = bestHabit.history && bestHabit.history.includes(todayStr);

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

  // Fillers
  if (recommendations.length < 3) {
    const highPriorityTasks = pendingTasks.filter((t: any) => (t.aiPriority || 0) >= 8);
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
}

function generateLocalPlan(goal: string, deadline?: string) {
  const cleanGoal = (goal || "").trim();
  return {
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
}

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: Multi-turn Chatbot Proxy
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body || {};
  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Configure chat system instruction and guidelines
    const systemInstruction = `You are Aria, an empathetic, high-intelligence productivity coach and AI companion.
Your goal is to help users conquer procrastination, plan projects, prioritize commitments, and actually complete tasks.
Be supportive, encouraging, but highly actionable.
Instead of giving passive advice, ask guiding questions or suggest breaking things down.
Always reference their current local time when talking about deadlines if they provide it.
Keep your responses relatively concise, scannable (using bullet points), and motivating.`;

    // Format history for @google/genai SDK
    // SDK expects format like:
    // chat = ai.chats.create({ model, config })
    // response = await chat.sendMessage({ message })
    // Since we're doing request-response style HTTP, we can either use ai.chats or generateContent with complete history.
    // Let's use ai.chats by initializing a chat and loading history, or just generateContent with contents array (which is identical and highly robust).
    // Let's map history items to the contents parameter structure:
    // parts: [{ text: "..." }], role: "user" | "model"
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content || "" }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "I couldn't generate a response. Let's try rephrasing!",
    });
  } catch (error: any) {
    console.warn("Chat API error, using local fallback:", error?.message || error);
    const fallbackReply = generateLocalChatResponse(message);
    res.json({
      reply: `[Offline Wisdom Mode] ${fallbackReply}`,
      isFallback: true
    });
  }
});

// Endpoint: Intelligent Task Prioritization
app.post("/api/gemini/prioritize", async (req, res) => {
  const { tasks, habits } = req.body || {};
  try {
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required." });
    }

    const systemInstruction = `You are an elite productivity algorithm. Your task is to analyze a list of user tasks, their due dates, current status, and categories to perform "Intelligent Matrix Prioritization" (Eisenhower Matrix style combined with energy/time forecasting).
You must output a highly optimized, prioritized JSON object containing:
1. Reordered tasks with an assigned 'aiPriority' (value from 1 to 10, where 10 is most critical/immediate).
2. 'timeEstimateMinutes' (suggested realistic duration for each task).
3. 'rationale' (a brief 1-sentence explanation of why it was prioritized this way).
4. 'schedulingSuggestion' (suggested day/time or order of execution).
5. 'overallRecommendations' (a 2-3 sentence strategic advice on how to tackle this list without burnout).

Analyze the list carefully, taking into account imminent deadlines, overdue items, and task complexity.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Here are the current tasks: ${JSON.stringify(tasks)}.
Here are the active habits: ${JSON.stringify(habits || [])}.
Please prioritize them and output structured JSON.`,
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prioritizedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  aiPriority: { type: Type.INTEGER, description: "Score from 1 to 10" },
                  timeEstimateMinutes: { type: Type.INTEGER },
                  rationale: { type: Type.STRING },
                  schedulingSuggestion: { type: Type.STRING }
                },
                required: ["id", "aiPriority", "timeEstimateMinutes", "rationale", "schedulingSuggestion"]
              }
            },
            overallRecommendations: { type: Type.STRING }
          },
          required: ["prioritizedTasks", "overallRecommendations"]
        }
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.warn("Prioritization API error, using local fallback:", error?.message || error);
    const fallbackData = generateLocalPrioritization(tasks, habits);
    res.json(fallbackData);
  }
});

// Endpoint: Autonomous Task Planning & Web-Search Grounded Execution
app.post("/api/gemini/plan", async (req, res) => {
  const { goal, deadline } = req.body || {};
  try {
    if (!goal) {
      return res.status(400).json({ error: "Goal is required." });
    }

    const promptText = `I have a high-level goal: "${goal}".
The deadline is: ${deadline || "Not specified"}.
Please research the web using Google Search to discover the latest best practices, step-by-step methods, and highly-rated online guides/resources for this goal.
Create a comprehensive plan of 5 to 7 concrete, actionable subtasks.
For each subtask, provide:
1. Title
2. Clear description of what to do and what to watch out for
3. Realistic time estimate in minutes
4. Suggested day offset from today (0 for today, 1 for tomorrow, etc.)
5. 1-2 curated resource links with titles based on search results that actually assist the user in completing this step. Include the full valid HTTPS URL.
`;

    const systemInstruction = `You are an Autonomous AI Planning Agent. You search the web to research goals, find actual helpful web tutorials/articles, and draft a structured plan that guarantees success.
You must return your response strictly conforming to the JSON schema. Ensure resource URLs are real, high-quality, and found through Google Search.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: promptText }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            overview: { type: Type.STRING, description: "A summary of your research findings and overall strategic approach." },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  dayOffset: { type: Type.INTEGER },
                  resources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                      },
                      required: ["title", "url"]
                    }
                  }
                },
                required: ["title", "description", "durationMinutes", "dayOffset", "resources"]
              }
            }
          },
          required: ["planTitle", "overview", "subtasks"]
        }
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.warn("Planning API error, using local fallback:", error?.message || error);
    const fallbackData = generateLocalPlan(goal, deadline);
    res.json(fallbackData);
  }
});

// Endpoint: Productivity Coach Recommendations
app.post("/api/gemini/recommendations", async (req, res) => {
  const { tasks, habits, completedCount, localTime } = req.body || {};
  try {
    const promptText = `Analyze my performance data:
- Current active tasks: ${JSON.stringify(tasks || [])}
- Active habits & streaks: ${JSON.stringify(habits || [])}
- Tasks completed today: ${completedCount || 0}
- Current Local Time: ${localTime || new Date().toISOString()}

Provide 3 personalized, highly specific productivity recommendations or "nudges" to help me optimize my focus, avoid slipping up on deadlines, and maintain my habits today.
Do not make them generic. Give exact actions like "Tackle [Task Title] first because it has a tight deadline" or "You have been highly consistent with [Habit Title], maintain your streak by scheduling 15m for it before 6 PM".
`;

    const systemInstruction = `You are a high-performance productivity coach. You analyze task lists and habits to provide 3 distinct, razor-sharp, actionable "nudges" or tips. Format them cleanly as a JSON array of recommendation objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: promptText }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "e.g., 'focus_nudge', 'habit_streak', 'deadline_alert', 'wellbeing_check'" },
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              urgency: { type: Type.STRING, enum: ["high", "medium", "low"] }
            },
            required: ["type", "title", "message", "urgency"]
          }
        },
      },
    });

    const parsedData = JSON.parse(response.text || "[]");
    res.json(parsedData);
  } catch (error: any) {
    console.warn("Recommendations API error, using local fallback:", error?.message || error);
    const fallbackData = generateLocalRecommendations(tasks, habits, completedCount);
    res.json(fallbackData);
  }
});

// Setup Vite development server or production build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
