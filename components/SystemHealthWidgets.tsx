"use client";

import React from "react";
import type { SystemMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Thermometer,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Circular Gauge Component
// ---------------------------------------------------------------------------

function CircularGauge({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-background-alt)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ animation: "gauge-fill 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-heading text-sm font-bold"
            style={{ color }}
          >
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <span className="text-[0.6875rem] font-body text-text-tertiary uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Linear Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({
  value,
  max = 100,
  color,
  height = 6,
}: {
  value: number;
  max?: number;
  color: string;
  height?: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div
      className="progress-track w-full"
      style={{ height }}
    >
      <div
        className="progress-fill"
        style={{
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Format Helpers
// ---------------------------------------------------------------------------

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} GB/s`;
  return `${Math.round(mbps)} MB/s`;
}

function formatNetworkRate(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB/s`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB/s`;
  return `${(bytes / 1000).toFixed(0)} KB/s`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return "var(--color-critical)";
  if (percentage >= 75) return "var(--color-severity-high)";
  if (percentage >= 60) return "var(--color-warning)";
  return "var(--color-primary)";
}

// ---------------------------------------------------------------------------
// System Health Widgets Panel
// ---------------------------------------------------------------------------

interface SystemHealthWidgetsProps {
  metrics: SystemMetrics | null;
}

export default function SystemHealthWidgets({ metrics }: SystemHealthWidgetsProps) {
  if (!metrics) {
    return (
      <div className="metrics-grid grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body flex flex-col gap-3">
              <div className="h-4 bg-background-alt rounded w-1/2" />
              <div className="h-20 bg-background-alt rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cpuUsage = metrics.cpu.usage;
  const memUsage = Math.round((metrics.memory.used / metrics.memory.total) * 100);
  const diskUsage = Math.round((metrics.disk.used / metrics.disk.total) * 100);

  return (
    <div className="space-y-3">
      {/* Server Info Bar */}
      <div className="card">
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <div>
              <span className="font-heading text-sm font-bold text-text-primary">
                {metrics.hostname}
              </span>
              <span className="text-text-tertiary text-xs ml-2 font-mono">
                {metrics.distro}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary font-mono">
            <span>Kernel: {metrics.kernel}</span>
            <span className="text-primary font-bold">
              ↑ {formatUptime(metrics.uptime)}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid grid grid-cols-2 gap-3">
        {/* CPU Widget */}
        <div className="card animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-text-primary">CPU</h3>
                  <p className="text-[0.625rem] text-text-tertiary font-mono">
                    {metrics.cpu.cores} cores
                  </p>
                </div>
              </div>
              <CircularGauge
                value={cpuUsage}
                color={getUsageColor(cpuUsage)}
                label="Usage"
                size={64}
                strokeWidth={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Thermometer size={12} />
                  Temperature
                </span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    metrics.cpu.temperature > 70
                      ? "text-error"
                      : metrics.cpu.temperature > 55
                        ? "text-warning"
                        : "text-success"
                  )}
                >
                  {metrics.cpu.temperature}°C
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Activity size={12} />
                  Load Avg
                </span>
                <span className="font-mono text-text-primary">
                  {metrics.loadAverage.join(" / ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Widget */}
        <div className="card animate-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                  <MemoryStick size={16} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-text-primary">Memory</h3>
                  <p className="text-[0.625rem] text-text-tertiary font-mono">
                    {formatBytes(metrics.memory.total)}
                  </p>
                </div>
              </div>
              <CircularGauge
                value={memUsage}
                color={getUsageColor(memUsage)}
                label="Used"
                size={64}
                strokeWidth={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Used</span>
                <span className="font-mono text-text-primary">
                  {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
                </span>
              </div>
              <ProgressBar value={memUsage} color={getUsageColor(memUsage)} />
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Swap</span>
                <span className="font-mono text-text-primary">
                  {formatBytes(metrics.memory.swapUsed)} / {formatBytes(metrics.memory.swapTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disk Widget */}
        <div className="card animate-slide-up" style={{ animationDelay: "160ms" }}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                  <HardDrive size={16} className="text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-text-primary">NVMe Disk</h3>
                  <p className="text-[0.625rem] text-text-tertiary font-mono truncate max-w-[120px]">
                    {metrics.disk.type}
                  </p>
                </div>
              </div>
              <CircularGauge
                value={diskUsage}
                color={getUsageColor(diskUsage)}
                label="Used"
                size={64}
                strokeWidth={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Read</span>
                <span className="font-mono text-primary font-bold">
                  {formatSpeed(metrics.disk.readSpeed)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Write</span>
                <span className="font-mono text-[#8b5cf6] font-bold">
                  {formatSpeed(metrics.disk.writeSpeed)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">IOPS</span>
                <span className="font-mono text-text-primary">
                  {metrics.disk.iops.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Widget */}
        <div className="card animate-slide-up" style={{ animationDelay: "240ms" }}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                  <Network size={16} className="text-[#10b981]" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-text-primary">Network</h3>
                  <p className="text-[0.625rem] text-text-tertiary font-mono">
                    {metrics.network.interface}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">↓ Inbound</span>
                <span className="font-mono text-success font-bold">
                  {formatNetworkRate(metrics.network.bytesIn)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">↑ Outbound</span>
                <span className="font-mono text-primary font-bold">
                  {formatNetworkRate(metrics.network.bytesOut)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Active Conns</span>
                <span className="font-mono text-text-primary font-bold">
                  {metrics.network.connections}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
