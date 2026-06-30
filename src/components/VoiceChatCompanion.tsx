import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { ChatMessage, Task, Habit } from "../types";

interface VoiceChatCompanionProps {
  tasks: Task[];
  habits: Habit[];
  onTriggerPrioritize: () => void;
  onAddTask: (task: Omit<Task, "id" | "status">) => void;
}

export default function VoiceChatCompanion({
  tasks,
  habits,
  onTriggerPrioritize,
  onAddTask,
}: VoiceChatCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: "Hi, I'm Aria, your AI productivity partner! 🌟\n\nI'm here to help you stop procrastinating, organize your deadlines, and take actual action. You can chat with me or click the mic to speak. How are you feeling about your commitments today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Set up Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech (Web Speech API)
  const speakText = (text: string) => {
    if (isMuted) return;
    // Cancel any current speaking
    window.speechSynthesis.cancel();
    
    // Clean text from emojis or Markdown markers for better TTS flow
    const cleanText = text
      .replace(/[*_#`~]/g, "")
      .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    
    // Attempt to pick a pleasant English voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Zira"))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Send message to Gemini backend
  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    if (!textToSend) setInput("");

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI Coach");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(data.reply);
    } catch (err: any) {
      console.error(err);
      
      // Smart local coaching responses based on query keywords
      let fallbackText = "I am currently running in offline support mode while my online brain (Gemini API) is resting. Let's focus on completing your highest priority task today!";
      const lowerQuery = queryText.toLowerCase();

      if (lowerQuery.includes("procrastinate") || lowerQuery.includes("start") || lowerQuery.includes("struggl")) {
        fallbackText = "Procrastination is often just anxiety about the first step. Let's try the 5-Minute Rule: choose one of your tasks, set a timer for exactly 5 minutes, and commit to working ONLY on it. Once the friction of starting is gone, you'll naturally want to continue!";
      } else if (lowerQuery.includes("deadline") || lowerQuery.includes("priorit") || lowerQuery.includes("matrix")) {
        fallbackText = "To prioritize your workload right now, let's use the Eisenhower Matrix strategy: \n\n1. Rescue any **Overdue** items first to stop the bleeding.\n2. Complete tasks due **Today** to stay aligned with commitments.\n3. Delegate or reschedule long-term tasks due next week. Which task can we tackle first?";
      } else if (lowerQuery.includes("hack") || lowerQuery.includes("tip") || lowerQuery.includes("advice")) {
        fallbackText = "Here are my top 3 offline focus hacks:\n\n1. **The 2-Minute Habit Rule**: If a micro-action takes under 2 minutes, complete it instantly to clean your focus space.\n2. **Mono-Tasking**: Close all browser tabs except the one you need for your active task.\n3. **Screen-Free Reset**: Stand up, take 3 deep diaphragmatic breaths, and drink a glass of water.";
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: `[Offline Wisdom Mode] ${fallbackText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      speakText(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  // Predefined interactive prompt triggers
  const handlePresetClick = (presetText: string) => {
    handleSend(presetText);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <motion.button
        id="btn-voice-companion-launcher"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gray-900 text-white rounded-full shadow-2xl flex items-center gap-2 hover:bg-gray-800 focus:outline-none transition-colors group cursor-pointer border border-gray-700/50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
        <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-sans text-sm font-medium pr-0 group-hover:pr-1 whitespace-nowrap">
          Talk with Aria
        </span>
      </motion.button>

      {/* Slide-out Companion Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="aria-companion-panel"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-full max-w-md h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50 font-sans"
          >
            {/* Header */}
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold relative shadow-inner">
                  A
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-900"></span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
                    Aria
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono tracking-wider">AI PRODUCTIVITY COACH</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Mute/Unmute Speech Output */}
                <button
                  onClick={() => {
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    if (newMuted) window.speechSynthesis.cancel();
                  }}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title={isMuted ? "Unmute Voice" : "Mute Voice"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line text-sm">{msg.content}</p>
                    <span
                      className={`block text-[9px] mt-1.5 text-right font-mono ${
                        msg.role === "user" ? "text-gray-400" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
                    <div className="flex gap-1.5 items-center py-1 px-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Prompts */}
            {messages.length < 3 && !isLoading && (
              <div className="px-4 py-2 bg-white border-t border-gray-50 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none scroll-smooth">
                <button
                  onClick={() => handlePresetClick("I'm procrastinating on a task, help me get started!")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200/50"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Struggling to start
                </button>
                <button
                  onClick={() => handlePresetClick("Analyze my deadlines and suggest an action plan.")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200/50"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Prioritize Deadlines
                </button>
                <button
                  onClick={() => handlePresetClick("Can you suggest 3 quick focus hacks for today?")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200/50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Focus Hacks
                </button>
              </div>
            )}

            {/* Mic wave animation overlay if active */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-emerald-50 px-4 py-2.5 border-t border-emerald-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-800">Listening to your voice...</span>
                  </div>
                  <div className="flex gap-0.5 items-end h-4">
                    <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.4s_infinite_alternate] h-2"></span>
                    <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.6s_infinite_alternate] h-4"></span>
                    <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.5s_infinite_alternate] h-3"></span>
                    <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.7s_infinite_alternate] h-1"></span>
                    <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.3s_infinite_alternate] h-3.5"></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Footer Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                  isListening
                    ? "bg-rose-50 border-rose-100 text-rose-500 animate-pulse"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-800"
                }`}
                title={isListening ? "Stop listening" : "Start speaking"}
              >
                {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isListening ? "I'm listening..." : "Type or speak a message..."}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-sm bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all font-sans text-gray-800"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all flex items-center justify-center disabled:opacity-40 disabled:hover:bg-gray-900 cursor-pointer border border-gray-800"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
