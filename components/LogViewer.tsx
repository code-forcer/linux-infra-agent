"use client";

import React, { useRef, useEffect } from "react";
import type { LogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollText, Pause, Play, Trash2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Log Level Badge
// ---------------------------------------------------------------------------

function LogLevelBadge({ level }: { level: string }) {
  const badgeClass = {
    INFO: "log-badge-info",
    DEBUG: "log-badge-debug",
    WARN: "log-badge-warn",
    ERROR: "log-badge-error",
    FATAL: "log-badge-fatal",
  }[level] || "log-badge-debug";

  return <span className={cn("log-badge", badgeClass)}>{level}</span>;
}

// ---------------------------------------------------------------------------
// Source Badge
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: string }) {
  const colorMap: Record<string, string> = {
    pm2: "text-primary bg-primary/8",
    systemd: "text-[#8b5cf6] bg-[#8b5cf6]/8",
    node: "text-[#10b981] bg-[#10b981]/8",
    kernel: "text-error bg-error/8",
    nginx: "text-[#f59e0b] bg-[#f59e0b]/8",
  };

  const classes = colorMap[source] || "text-text-tertiary bg-background-alt";

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[0.625rem] font-mono font-bold",
        classes
      )}
    >
      {source}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Format timestamp to readable short format
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "--:--:--";
  }
}

// ---------------------------------------------------------------------------
// Log Viewer Panel
// ---------------------------------------------------------------------------

interface LogViewerProps {
  logs: LogEntry[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
}

export default function LogViewer({
  logs,
  isPaused,
  onTogglePause,
  onClear,
}: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolled = useRef(false);

  // Auto-scroll to bottom when new logs arrive (unless user scrolled up)
  useEffect(() => {
    if (!isPaused && !isUserScrolled.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isUserScrolled.current = scrollHeight - scrollTop - clientHeight > 60;
  };

  const errorCount = logs.filter(
    (l) => l.level === "ERROR" || l.level === "FATAL"
  ).length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <ScrollText size={14} className="text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-text-primary">
              Log Stream
            </h2>
            <p className="text-[0.625rem] text-text-tertiary">
              {logs.length} entries
              {errorCount > 0 && (
                <span className="text-error ml-1 font-bold">
                  · {errorCount} errors
                </span>
              )}
              {warnCount > 0 && (
                <span className="text-warning ml-1 font-bold">
                  · {warnCount} warnings
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isPaused && (
            <span className="text-[0.625rem] text-warning font-bold uppercase tracking-wider mr-1">
              Paused
            </span>
          )}
          <button
            id="toggle-log-pause"
            onClick={onTogglePause}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200",
              isPaused
                ? "bg-warning/10 text-warning hover:bg-warning/20"
                : "bg-surface-hover text-text-tertiary hover:text-text-secondary hover:bg-background-alt"
            )}
            title={isPaused ? "Resume log stream" : "Pause log stream"}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            id="clear-logs"
            onClick={onClear}
            className="w-7 h-7 rounded-md flex items-center justify-center bg-surface-hover text-text-tertiary hover:text-error hover:bg-error/10 transition-all duration-200"
            title="Clear all logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ maxHeight: "520px" }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary text-sm py-12">
            <div className="text-center">
              <ScrollText size={32} className="mx-auto mb-2 opacity-30" />
              <p>Waiting for log entries…</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  "px-4 py-2 flex items-start gap-3 hover:bg-surface-hover transition-colors duration-150 text-xs",
                  log.level === "FATAL" && "bg-critical-bg/30",
                  log.level === "ERROR" && "bg-error-bg/20",
                  index === logs.length - 1 && "animate-slide-up"
                )}
              >
                {/* Timestamp */}
                <span className="font-mono text-text-tertiary whitespace-nowrap flex-shrink-0 pt-0.5 tabular-nums">
                  {formatTime(log.timestamp)}
                </span>

                {/* Level Badge */}
                <div className="flex-shrink-0 pt-0.5">
                  <LogLevelBadge level={log.level} />
                </div>

                {/* Source */}
                <div className="flex-shrink-0 pt-0.5">
                  <SourceBadge source={log.source} />
                </div>

                {/* Message */}
                <p
                  className={cn(
                    "font-mono text-[0.75rem] leading-relaxed break-all min-w-0",
                    log.level === "ERROR" || log.level === "FATAL"
                      ? "text-text-primary font-medium"
                      : "text-text-secondary"
                  )}
                >
                  {log.message}
                </p>

                {/* PID */}
                {log.pid && (
                  <span className="font-mono text-text-tertiary flex-shrink-0 pt-0.5 tabular-nums">
                    :{log.pid}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
