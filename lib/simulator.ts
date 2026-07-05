// ============================================================================
// Simulated server log generator & system metrics engine
// Produces realistic Linux server telemetry for the dashboard
// ============================================================================

import type { LogEntry, LogLevel, SystemMetrics, ProcessInfo } from "./types";

let logCounter = 0;

function generateId(): string {
  return `log_${Date.now()}_${++logCounter}`;
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Realistic log message templates
// ---------------------------------------------------------------------------

const LOG_TEMPLATES: Array<{
  level: LogLevel;
  source: string;
  messages: string[];
  weight: number;
}> = [
  {
    level: "INFO",
    source: "pm2",
    messages: [
      "Process api-server [0] restarted successfully",
      "PM2 daemon spawned — pid: 2847",
      "App [web-frontend] online — pid: 3201 — uptime: 4h 22m",
      "Process list loaded from dump file",
      "Log rotation triggered for /var/log/pm2/api-server-out.log",
      "Watching enabled for process worker-queue [3]",
    ],
    weight: 30,
  },
  {
    level: "INFO",
    source: "systemd",
    messages: [
      "Started PostgreSQL RDBMS — listening on port 5432",
      "nginx.service: Main process exited, code=exited, status=0/SUCCESS",
      "Redis server v7.2.4 ready to accept connections on port 6379",
      "cron.service: Succeeded — next trigger: 2026-07-06 00:00:00 UTC",
      "docker.service: Unit entered 'active' (running) state",
      "NetworkManager[892]: <info> device (eth0): Activation successful",
    ],
    weight: 25,
  },
  {
    level: "WARN",
    source: "node",
    messages: [
      "MaxListenersExceededWarning: Possible EventEmitter memory leak detected — 11 close listeners added to [Socket]",
      "DeprecationWarning: Buffer() is deprecated due to security and usability issues — use Buffer.alloc() instead",
      "ExperimentalWarning: The Fetch API is an experimental feature — behavior may change in future releases",
      "High heap utilization detected — heap_used: 1.2GB / heap_total: 1.4GB (85.7%)",
      "Connection pool nearing capacity — 48/50 active connections to PostgreSQL",
    ],
    weight: 15,
  },
  {
    level: "ERROR",
    source: "pm2",
    messages: [
      "Process api-server [0] exited with code 1 — signal: SIGKILL — restart_time: 14",
      "Error: ECONNREFUSED 127.0.0.1:5432 — PostgreSQL connection refused after 3 retries",
      "Script /opt/apps/api/dist/index.js threw uncaught Error: Cannot find module '@prisma/client'",
      "FATAL: worker-queue [3] — Unhandled rejection: TypeError: Cannot read properties of undefined (reading 'id')",
      "Process api-server exceeded memory limit (1536MB) — triggering automatic restart",
    ],
    weight: 18,
  },
  {
    level: "ERROR",
    source: "kernel",
    messages: [
      "[UFW BLOCK] IN=eth0 OUT= SRC=185.220.101.45 DST=10.0.0.4 PROTO=TCP DPT=22 — brute force attempt",
      "Out of memory: Killed process 4821 (node) — total-vm:2,097,152kB, anon-rss:1,572,864kB",
      "EXT4-fs error (device nvme0n1p2): ext4_lookup:1855: inode #393217: comm node: unlinked inode in dir",
      "BTRFS warning: device fsid 7c3e...: devid 1 io_error count 47",
    ],
    weight: 8,
  },
  {
    level: "FATAL",
    source: "pm2",
    messages: [
      "CRITICAL: api-server [0] has reached max restart count (15) — entering 'errored' state permanently",
      "PANIC: All worker processes crashed simultaneously — service mesh is down",
      "FATAL: Database migration failed mid-transaction — schema in inconsistent state — manual rollback required",
    ],
    weight: 3,
  },
  {
    level: "DEBUG",
    source: "nginx",
    messages: [
      '10.0.0.1 - - "GET /api/v1/health HTTP/1.1" 200 42 "-" "kube-probe/1.28"',
      '10.0.0.1 - - "POST /api/v1/ingest HTTP/1.1" 201 156 rt=0.012',
      "upstream response time: 0.045s — cached: miss — backend: api-server:3000",
      '10.0.0.1 - - "GET /api/v1/metrics HTTP/1.1" 200 2048 rt=0.003',
    ],
    weight: 20,
  },
];

function weightedRandomTemplate() {
  const totalWeight = LOG_TEMPLATES.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  for (const template of LOG_TEMPLATES) {
    random -= template.weight;
    if (random <= 0) return template;
  }
  return LOG_TEMPLATES[0];
}

/**
 * Generate a single realistic log entry
 */
export function generateLogEntry(): LogEntry {
  const template = weightedRandomTemplate();
  const message =
    template.messages[Math.floor(Math.random() * template.messages.length)];

  return {
    id: generateId(),
    timestamp: formatTimestamp(),
    level: template.level,
    source: template.source,
    message,
    pid: Math.floor(Math.random() * 30000) + 1000,
  };
}

/**
 * Generate a batch of log entries
 */
export function generateLogBatch(count: number = 5): LogEntry[] {
  return Array.from({ length: count }, () => generateLogEntry());
}

// ---------------------------------------------------------------------------
// System Metrics Simulation — fluctuating realistic values
// ---------------------------------------------------------------------------

let metricsState = {
  cpuBase: 35,
  memBase: 62,
  diskBase: 58,
  netInBase: 12500000,
  netOutBase: 8900000,
  uptimeStart: Date.now(),
};

/**
 * Generate current system metrics snapshot with realistic fluctuations
 */
export function generateSystemMetrics(): SystemMetrics {
  // Simulate occasional spikes
  const isSpike = Math.random() < 0.12;
  const spikeMultiplier = isSpike ? randomBetween(1.5, 2.2) : 1;

  const cpuUsage = Math.min(
    100,
    metricsState.cpuBase * spikeMultiplier + randomBetween(-8, 8)
  );
  const memUsed =
    metricsState.memBase * spikeMultiplier + randomBetween(-5, 5);

  // Slowly drift baselines
  metricsState.cpuBase += randomBetween(-0.5, 0.5);
  metricsState.cpuBase = Math.max(15, Math.min(75, metricsState.cpuBase));
  metricsState.memBase += randomBetween(-0.3, 0.3);
  metricsState.memBase = Math.max(40, Math.min(85, metricsState.memBase));

  const uptimeSeconds = Math.floor((Date.now() - metricsState.uptimeStart) / 1000) + 864000;

  return {
    cpu: {
      usage: Math.round(cpuUsage * 10) / 10,
      cores: 8,
      temperature: Math.round((48 + randomBetween(-5, 15)) * 10) / 10,
      model: "AMD EPYC 7763 64-Core Processor",
    },
    memory: {
      total: 32768,
      used: Math.round((32768 * memUsed) / 100),
      available: Math.round((32768 * (100 - memUsed)) / 100),
      swapUsed: Math.round(randomBetween(128, 512)),
      swapTotal: 8192,
    },
    disk: {
      total: 512000,
      used: Math.round((512000 * metricsState.diskBase) / 100),
      readSpeed: Math.round(randomBetween(150, 3200)),
      writeSpeed: Math.round(randomBetween(100, 2800)),
      iops: Math.round(randomBetween(15000, 450000)),
      type: "NVMe SSD (Samsung 990 PRO)",
    },
    network: {
      bytesIn: Math.round(
        metricsState.netInBase + randomBetween(-2000000, 5000000)
      ),
      bytesOut: Math.round(
        metricsState.netOutBase + randomBetween(-1500000, 3000000)
      ),
      connections: Math.round(randomBetween(120, 890)),
      interface: "eth0 (10Gbit)",
    },
    uptime: uptimeSeconds,
    loadAverage: [
      Math.round(randomBetween(0.5, 4.2) * 100) / 100,
      Math.round(randomBetween(0.8, 3.8) * 100) / 100,
      Math.round(randomBetween(1.0, 3.5) * 100) / 100,
    ],
    hostname: "prod-infra-node-01",
    kernel: "6.8.12-200.fc40.x86_64",
    distro: "Fedora Server 40",
  };
}

// ---------------------------------------------------------------------------
// PM2 Process List Simulation
// ---------------------------------------------------------------------------

export function generateProcessList(): ProcessInfo[] {
  const processes: ProcessInfo[] = [
    {
      pid: 3201,
      name: "api-server",
      cpu: randomBetween(5, 45),
      memory: randomBetween(180, 420),
      status: Math.random() > 0.15 ? "online" : "errored",
      uptime: "4h 22m",
      restarts: Math.floor(randomBetween(0, 14)),
    },
    {
      pid: 3245,
      name: "web-frontend",
      cpu: randomBetween(2, 25),
      memory: randomBetween(120, 280),
      status: "online",
      uptime: "12h 05m",
      restarts: 0,
    },
    {
      pid: 3302,
      name: "worker-queue",
      cpu: randomBetween(10, 65),
      memory: randomBetween(200, 600),
      status: Math.random() > 0.2 ? "online" : "restarting",
      uptime: "2h 48m",
      restarts: Math.floor(randomBetween(0, 8)),
    },
    {
      pid: 3350,
      name: "cron-scheduler",
      cpu: randomBetween(0.5, 8),
      memory: randomBetween(60, 150),
      status: "online",
      uptime: "24h 00m",
      restarts: 0,
    },
    {
      pid: 3401,
      name: "websocket-gateway",
      cpu: randomBetween(3, 30),
      memory: randomBetween(100, 350),
      status: Math.random() > 0.1 ? "online" : "stopped",
      uptime: "8h 12m",
      restarts: Math.floor(randomBetween(0, 3)),
    },
  ];

  return processes;
}
