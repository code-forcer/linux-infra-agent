"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type {
  LogEntry,
  SystemMetrics,
  ProcessInfo,
  DiagnosticResult,
} from "@/lib/types";
import Header from "@/components/Header";
import SystemHealthWidgets from "@/components/SystemHealthWidgets";
import LogViewer from "@/components/LogViewer";
import DiagnosticTerminal from "@/components/DiagnosticTerminal";
import ProcessTable from "@/components/ProcessTable";

const MAX_LOG_ENTRIES = 200;
const AUTO_ANALYSIS_INTERVAL_MS = 25000;

export default function DashboardPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const logsRef = useRef<LogEntry[]>([]);
  const metricsRef = useRef<SystemMetrics | null>(null);
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // ---------------------------------------------------------------------------
  // Trigger AI Analysis
  // ---------------------------------------------------------------------------
  const triggerAnalysis = useCallback(async () => {
    const currentLogs = logsRef.current;
    const currentMetrics = metricsRef.current;

    if (currentLogs.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      // Take the most recent 20 log entries for analysis
      const recentLogs = currentLogs.slice(-20);

      const response = await fetch("/api/analyze-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: recentLogs,
          metrics: currentMetrics || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.diagnostic) {
          setDiagnostics((prev) => [...prev.slice(-9), data.diagnostic]);
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // ---------------------------------------------------------------------------
  // SSE Connection to Log Stream
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/stream-logs");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener("logs", (event) => {
        if (isPaused) return;
        try {
          const newLogs: LogEntry[] = JSON.parse(event.data);
          setLogs((prev) => {
            const merged = [...prev, ...newLogs];
            return merged.slice(-MAX_LOG_ENTRIES);
          });
        } catch (e) {
          console.error("Failed to parse logs:", e);
        }
      });

      eventSource.addEventListener("metrics", (event) => {
        try {
          const newMetrics: SystemMetrics = JSON.parse(event.data);
          setMetrics(newMetrics);
        } catch (e) {
          console.error("Failed to parse metrics:", e);
        }
      });

      eventSource.addEventListener("processes", (event) => {
        try {
          const newProcesses: ProcessInfo[] = JSON.parse(event.data);
          setProcesses(newProcesses);
        } catch (e) {
          console.error("Failed to parse processes:", e);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isPaused]);

  // ---------------------------------------------------------------------------
  // Auto-analysis Timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Run initial analysis after 8 seconds
    const initialTimer = setTimeout(() => {
      if (logsRef.current.length > 0) {
        triggerAnalysis();
      }
    }, 8000);

    // Set up recurring analysis
    analysisTimerRef.current = setInterval(() => {
      if (logsRef.current.length > 0) {
        triggerAnalysis();
      }
    }, AUTO_ANALYSIS_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
    };
  }, [triggerAnalysis]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const handleTriggerAnalysis = useCallback(() => {
    triggerAnalysis();
  }, [triggerAnalysis]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen">
      <Header isConnected={isConnected} />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="dashboard-grid grid grid-cols-[380px_1fr] gap-5 h-full">
          {/* ================================================================
              LEFT COLUMN — System Health + Process Table
              ================================================================ */}
          <div className="space-y-4 min-w-0">
            <SystemHealthWidgets metrics={metrics} />
            <ProcessTable processes={processes} />
          </div>

          {/* ================================================================
              RIGHT COLUMN — Log Viewer + AI Diagnostic Terminal
              ================================================================ */}
          <div className="space-y-4 min-w-0">
            {/* Log Viewer */}
            <div style={{ minHeight: "320px" }}>
              <LogViewer
                logs={logs}
                isPaused={isPaused}
                onTogglePause={handleTogglePause}
                onClear={handleClearLogs}
              />
            </div>

            {/* AI Diagnostic Terminal */}
            <div style={{ minHeight: "360px" }}>
              <DiagnosticTerminal
                diagnostics={diagnostics}
                isAnalyzing={isAnalyzing}
                onTriggerAnalysis={handleTriggerAnalysis}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-3">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[0.6875rem] text-text-tertiary">
          <div className="flex items-center gap-4">
            <span className="font-heading font-bold">
              InfraWatch AI <span className="text-primary">v1.0.0</span>
            </span>
            <span className="font-mono">
              Diagnostics: {diagnostics.length} analyses
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">
              Logs buffered: {logs.length}/{MAX_LOG_ENTRIES}
            </span>
            <span className="font-mono">
              Auto-analysis: {AUTO_ANALYSIS_INTERVAL_MS / 1000}s
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
