// ============================================================================
// Core type definitions for the Linux Infrastructure AI Agent
// ============================================================================

export type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL" | "DEBUG";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  pid?: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    swapUsed: number;
    swapTotal: number;
  };
  disk: {
    total: number;
    used: number;
    readSpeed: number;
    writeSpeed: number;
    iops: number;
    type: string;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
    interface: string;
  };
  uptime: number;
  loadAverage: [number, number, number];
  hostname: string;
  kernel: string;
  distro: string;
}

export interface DiagnosticResult {
  root_cause: string;
  severity: Severity;
  remediation_command: string;
  affected_service?: string;
  confidence?: number;
  timestamp?: string;
  analysis_id?: string;
}

export interface AnalyzeLogsRequest {
  logs: LogEntry[];
  metrics?: Partial<SystemMetrics>;
}

export interface AnalyzeLogsResponse {
  success: boolean;
  diagnostic: DiagnosticResult;
  processing_time_ms: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: "online" | "stopped" | "errored" | "restarting";
  uptime: string;
  restarts: number;
}
