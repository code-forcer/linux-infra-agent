"use client";

import React from "react";
import type { ProcessInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Layers, RotateCcw } from "lucide-react";

// ---------------------------------------------------------------------------
// Process Status Dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: ProcessInfo["status"] }) {
  const dotClass = {
    online: "status-dot-online",
    stopped: "status-dot-stopped",
    errored: "status-dot-errored",
    restarting: "status-dot-restarting",
  }[status];

  return <span className={cn("status-dot", dotClass)} />;
}

// ---------------------------------------------------------------------------
// Process Table Component
// ---------------------------------------------------------------------------

interface ProcessTableProps {
  processes: ProcessInfo[];
}

export default function ProcessTable({ processes }: ProcessTableProps) {
  if (!processes.length) {
    return (
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="h-4 bg-background-alt rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 bg-background-alt rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const onlineCount = processes.filter((p) => p.status === "online").length;
  const erroredCount = processes.filter(
    (p) => p.status === "errored" || p.status === "stopped"
  ).length;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
            <Layers size={14} className="text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-text-primary">
              PM2 Processes
            </h2>
            <p className="text-[0.625rem] text-text-tertiary">
              <span className="text-success font-bold">{onlineCount} online</span>
              {erroredCount > 0 && (
                <span className="text-error font-bold ml-1">
                  · {erroredCount} down
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-2.5 px-4 font-heading font-bold text-text-tertiary uppercase tracking-wider text-[0.625rem]">
                Process
              </th>
              <th className="text-left py-2.5 px-4 font-heading font-bold text-text-tertiary uppercase tracking-wider text-[0.625rem]">
                Status
              </th>
              <th className="text-right py-2.5 px-4 font-heading font-bold text-text-tertiary uppercase tracking-wider text-[0.625rem]">
                CPU
              </th>
              <th className="text-right py-2.5 px-4 font-heading font-bold text-text-tertiary uppercase tracking-wider text-[0.625rem]">
                Memory
              </th>
              <th className="text-right py-2.5 px-4 font-heading font-bold text-text-tertiary uppercase tracking-wider text-[0.625rem]">
                Restarts
              </th>
              <th className="text-right py-2.5 px-4 font-heading font-bold text-text-tertiary uppercase tracking-wider text-[0.625rem]">
                Uptime
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {processes.map((proc) => (
              <tr
                key={proc.pid}
                className={cn(
                  "hover:bg-surface-hover transition-colors duration-150",
                  proc.status === "errored" && "bg-error-bg/20"
                )}
              >
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-text-primary">
                      {proc.name}
                    </span>
                    <span className="text-text-tertiary font-mono text-[0.625rem]">
                      :{proc.pid}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={proc.status} />
                    <span
                      className={cn(
                        "font-mono font-bold capitalize text-[0.6875rem]",
                        proc.status === "online" && "text-success",
                        proc.status === "errored" && "text-error",
                        proc.status === "stopped" && "text-text-tertiary",
                        proc.status === "restarting" && "text-warning"
                      )}
                    >
                      {proc.status}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums",
                      proc.cpu > 50
                        ? "text-error"
                        : proc.cpu > 30
                          ? "text-warning"
                          : "text-text-primary"
                    )}
                  >
                    {proc.cpu.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span className="font-mono text-text-primary tabular-nums">
                    {proc.memory.toFixed(0)} MB
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={cn(
                      "font-mono tabular-nums inline-flex items-center gap-1",
                      proc.restarts > 5
                        ? "text-error font-bold"
                        : proc.restarts > 0
                          ? "text-warning"
                          : "text-text-tertiary"
                    )}
                  >
                    {proc.restarts > 0 && <RotateCcw size={10} />}
                    {proc.restarts}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span className="font-mono text-text-secondary tabular-nums">
                    {proc.uptime}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
