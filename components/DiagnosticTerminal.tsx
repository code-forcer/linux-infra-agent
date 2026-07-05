"use client";

import React, { useRef, useEffect } from "react";
import type { DiagnosticResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Brain,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Fingerprint,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: string }) {
  const classes = {
    LOW: "severity-low",
    MEDIUM: "severity-medium",
    HIGH: "severity-high",
    CRITICAL: "severity-critical",
  }[severity] || "severity-low";

  return (
    <span className={cn("severity-indicator", classes)}>
      {severity === "CRITICAL" && <ShieldAlert size={12} />}
      {severity === "HIGH" && <AlertTriangle size={12} />}
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Diagnostic Entry Component
// ---------------------------------------------------------------------------

function DiagnosticEntry({
  diagnostic,
  index,
}: {
  diagnostic: DiagnosticResult;
  index: number;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagnostic.remediation_command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API isn't available
      const textarea = document.createElement("textarea");
      textarea.value = diagnostic.remediation_command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const timeStr = diagnostic.timestamp
    ? new Date(diagnostic.timestamp).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Timestamp & Severity Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="terminal-muted text-xs font-mono flex items-center gap-1">
          <Clock size={10} />
          {timeStr}
        </span>
        <SeverityBadge severity={diagnostic.severity} />
        {diagnostic.confidence !== undefined && (
          <span className="text-[0.625rem] font-mono text-primary/70 flex items-center gap-0.5">
            <Fingerprint size={10} />
            {Math.round(diagnostic.confidence * 100)}% conf
          </span>
        )}
        {diagnostic.affected_service && (
          <span className="text-[0.625rem] font-mono terminal-muted">
            → {diagnostic.affected_service}
          </span>
        )}
      </div>

      {/* Root Cause */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="terminal-prompt text-xs">▸ ROOT CAUSE</span>
        </div>
        <p className="text-[0.8125rem] leading-relaxed text-[#cbd5e1] pl-3 border-l-2 border-[#334155]">
          {diagnostic.root_cause}
        </p>
      </div>

      {/* Remediation Command */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="terminal-success text-xs">▸ REMEDIATION</span>
        </div>
        <div className="flex items-start gap-2 group">
          <code className="flex-1 text-[0.8125rem] text-[#fbbf24] bg-[#1a1a2e] rounded px-3 py-2 font-mono break-all leading-relaxed border border-[#2d2d44]">
            <span className="terminal-success mr-1">$</span>
            {diagnostic.remediation_command}
          </code>
          <button
            onClick={handleCopy}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
              copied
                ? "bg-[#10b981]/20 text-[#10b981]"
                : "bg-[#334155]/50 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#334155]"
            )}
            title="Copy command"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="my-4 border-t border-[#1e293b]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Diagnostic Terminal
// ---------------------------------------------------------------------------

interface DiagnosticTerminalProps {
  diagnostics: DiagnosticResult[];
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
}

export default function DiagnosticTerminal({
  diagnostics,
  isAnalyzing,
  onTriggerAnalysis,
}: DiagnosticTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [diagnostics]);

  return (
    <div className="terminal-panel flex flex-col h-full">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="flex items-center gap-2">
          <div className="terminal-dot bg-[#ef4444]" />
          <div className="terminal-dot bg-[#f59e0b]" />
          <div className="terminal-dot bg-[#10b981]" />
        </div>
        <div className="flex items-center gap-2 flex-1 ml-3">
          <Brain size={14} className="text-primary" />
          <span className="text-[0.75rem] font-heading font-bold text-[#e2e8f0]">
            AI Diagnostic Engine
          </span>
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-[0.625rem] text-primary font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              Analyzing…
            </span>
          )}
        </div>
        <button
          id="trigger-analysis"
          onClick={onTriggerAnalysis}
          disabled={isAnalyzing}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.6875rem] font-heading font-bold transition-all duration-200",
            isAnalyzing
              ? "bg-[#334155] text-[#64748b] cursor-not-allowed"
              : "bg-primary/20 text-primary hover:bg-primary/30 active:scale-95"
          )}
        >
          <Terminal size={12} />
          {isAnalyzing ? "Processing…" : "Run Analysis"}
        </button>
      </div>

      {/* Terminal Body */}
      <div ref={scrollRef} className="terminal-body flex-1 overflow-y-auto min-h-0">
        {diagnostics.length === 0 && !isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Brain size={40} className="text-[#334155] mb-3" />
            <p className="text-[#64748b] text-sm font-heading font-bold mb-1">
              AI Diagnostic Engine Ready
            </p>
            <p className="text-[#475569] text-xs max-w-xs">
              Click &ldquo;Run Analysis&rdquo; or wait for auto-analysis to begin.
              The engine will analyze incoming log patterns and system metrics to
              identify root causes and suggest remediations.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[0.625rem] font-mono text-[#475569]">
              <span className="terminal-prompt">$</span>
              <span>infrawatch --analyze --mode=auto</span>
              <span className="animate-blink">▌</span>
            </div>
          </div>
        ) : (
          <>
            {/* System initialization messages */}
            {diagnostics.length > 0 && (
              <div className="mb-4 space-y-1 text-xs">
                <p className="terminal-muted">
                  <span className="terminal-success">✓</span> Connected to log
                  ingestion pipeline
                </p>
                <p className="terminal-muted">
                  <span className="terminal-success">✓</span> AI diagnostic
                  model loaded (rule-based inference engine v2.1)
                </p>
                <p className="terminal-muted">
                  <span className="terminal-success">✓</span> System metrics
                  stream active
                </p>
                <div className="my-3 border-t border-[#1e293b]" />
              </div>
            )}

            {/* Diagnostic entries */}
            {diagnostics.map((diag, i) => (
              <DiagnosticEntry
                key={diag.analysis_id || i}
                diagnostic={diag}
                index={i}
              />
            ))}

            {/* Analyzing indicator */}
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-primary animate-pulse-glow">
                <span className="terminal-prompt">$</span>
                <span>Analyzing log patterns…</span>
                <span className="animate-blink">▌</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
