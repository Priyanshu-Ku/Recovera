"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Shield, Zap, CheckCircle, AlertTriangle, Terminal, Clock, Search, Bug, Wrench, GitBranch, FileCode } from "lucide-react";

type SimActivity = {
  id: string;
  icon: "clock" | "shield" | "search" | "bug" | "brain" | "wrench" | "git" | "check";
  title: string;
  detail: string;
  color: string;
  time: string;
};

// Staged simulation timeline (delays in ms from dashboard open)
const SIMULATION_STAGES: { delay: number; icon: SimActivity["icon"]; title: string; detail: string; color: string }[] = [
  {
    delay: 5000,
    icon: "clock",
    title: "Initializing AI Agent",
    detail: "Establishing secure connection to production log stream...",
    color: "text-blue-400"
  },
  {
    delay: 15000,
    icon: "shield",
    title: "Monitoring Production",
    detail: "Real-time anomaly detection active. Scanning traffic patterns across all endpoints.",
    color: "text-cyan-400"
  },
  {
    delay: 30000,
    icon: "shield",
    title: "System Health Check",
    detail: "CPU: 12% | Memory: 45% | Latency: 23ms — All metrics within normal parameters.",
    color: "text-emerald-400"
  },
  {
    delay: 45000,
    icon: "shield",
    title: "Log Stream Active",
    detail: "Processing 1,247 log entries. No anomalies detected in the last 30 seconds.",
    color: "text-emerald-400"
  },
  {
    delay: 60000,
    icon: "bug",
    title: "⚠️ Anomaly Detected",
    detail: "Critical spike in error rate detected. ReferenceError: AbortController is not defined — 47 occurrences in last 10s.",
    color: "text-red-400"
  },
  {
    delay: 70000,
    icon: "search",
    title: "Deep Analysis Started",
    detail: "Correlating error fingerprint across stack traces. Scanning src/utils/api.ts for root cause...",
    color: "text-amber-400"
  },
  {
    delay: 85000,
    icon: "brain",
    title: "Root Cause Identified",
    detail: "AbortController is used natively in src/utils/api.ts but production runtime (Node.js v14.17) does not support it. This causes all API timeout handlers to crash.",
    color: "text-purple-400"
  },
  {
    delay: 95000,
    icon: "brain",
    title: "Impact Assessment",
    detail: "Affected: API Layer, Network Requests, User Experience. Severity: CRITICAL. Confidence: 98.7%. Risk of fix: LOW (0.02).",
    color: "text-purple-400"
  },
  {
    delay: 110000,
    icon: "wrench",
    title: "Generating Solution",
    detail: "Strategy: Inject conditional AbortController polyfill at entry point. Validating against codebase structure and dependency tree...",
    color: "text-indigo-400"
  },
  {
    delay: 120000,
    icon: "wrench",
    title: "Patch Validated",
    detail: "Linting: ✓ PASSED | Type Check: ✓ PASSED | Unit Tests: ✓ PASSED | Sandbox Simulation: ✓ PASSED. Patch is safe to deploy.",
    color: "text-emerald-400"
  },
  {
    delay: 135000,
    icon: "git",
    title: "Pull Request Created",
    detail: "fix(autosre): inject AbortController polyfill for Node.js 14 compatibility — Branch: autosre/fix-abortcontroller",
    color: "text-blue-400"
  },
  {
    delay: 140000,
    icon: "check",
    title: "Remediation Complete",
    detail: "Issue resolved autonomously. PR is awaiting human review for final merge approval.",
    color: "text-emerald-400"
  }
];

function getTimeString() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const ICON_MAP: Record<SimActivity["icon"], React.ReactNode> = {
  clock: <Clock className="w-4 h-4 text-blue-400" />,
  shield: <Shield className="w-4 h-4 text-cyan-400" />,
  search: <Search className="w-4 h-4 text-amber-400" />,
  bug: <Bug className="w-4 h-4 text-red-400" />,
  brain: <Brain className="w-4 h-4 text-purple-400" />,
  wrench: <Wrench className="w-4 h-4 text-indigo-400" />,
  git: <GitBranch className="w-4 h-4 text-blue-400" />,
  check: <CheckCircle className="w-4 h-4 text-emerald-400" />
};

export default function AILiveFeed({ repoFullName, onIssueDetected, onPRCreated }: { repoFullName: string; onIssueDetected?: () => void; onPRCreated?: () => void }) {
  const [activities, setActivities] = useState<SimActivity[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>("Initializing...");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const issueTriggeredRef = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any previous simulation
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setActivities([]);
    issueTriggeredRef.current = false;

    // Schedule all simulation stages
    SIMULATION_STAGES.forEach((stage, idx) => {
      const timer = setTimeout(() => {
        const newActivity: SimActivity = {
          id: `sim-${idx}-${Date.now()}`,
          icon: stage.icon,
          title: stage.title,
          detail: stage.detail,
          color: stage.color,
          time: getTimeString()
        };

        setActivities(prev => [newActivity, ...prev]);
        setCurrentPhase(stage.title);

        // Trigger issue callback when anomaly is detected
        if (stage.icon === "bug" && !issueTriggeredRef.current && onIssueDetected) {
          issueTriggeredRef.current = true;
          onIssueDetected();
        }

        // Create a REAL GitHub PR when we reach the PR stage
        if (stage.icon === "git") {
          fetch("/api/simulation/create-pr", { method: "POST" })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.prUrl) {
                // Update the activity entry with the real PR URL
                setActivities(prev => prev.map(a => 
                  a.id === newActivity.id 
                    ? { ...a, detail: `✅ Real PR Created: ${data.prUrl}`, color: "text-emerald-400" }
                    : a
                ));
                if (onPRCreated) onPRCreated();
              } else {
                setActivities(prev => prev.map(a =>
                  a.id === newActivity.id
                    ? { ...a, detail: `⚠️ PR creation failed: ${data.error || "Unknown error"}`, color: "text-red-400" }
                    : a
                ));
              }
            })
            .catch(err => {
              setActivities(prev => prev.map(a =>
                a.id === newActivity.id
                  ? { ...a, detail: `⚠️ PR creation failed: ${err.message}`, color: "text-red-400" }
                  : a
              ));
            });
        }
      }, stage.delay);

      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [repoFullName]); // Only re-run if repo changes

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          AI Agent Activity
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            >
              <Clock className="w-8 h-8 text-blue-500/50" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-400">Connecting to production...</p>
              <p className="text-[10px] text-zinc-600 mt-1">AI agent will begin monitoring shortly</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative pl-6 border-l border-white/5 pb-1"
              >
                <div className="absolute left-[-9px] top-0 bg-black p-1 rounded-full border border-white/5">
                  {ICON_MAP[activity.icon]}
                </div>
                
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold uppercase tracking-tight ${activity.color}`}>
                      {activity.title}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {activity.time}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    {activity.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {currentPhase}
        </span>
        <span className="font-mono">v1.2.0-beta</span>
      </div>
    </div>
  );
}
