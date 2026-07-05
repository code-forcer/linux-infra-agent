// ============================================================================
// AI Diagnostic Engine — analyzes log patterns & system metrics to produce
// structured root-cause analysis with remediation commands.
// ============================================================================

import type {
  LogEntry,
  DiagnosticResult,
  Severity,
  SystemMetrics,
} from "./types";

/**
 * Pattern-matching diagnostic rules that simulate LLM-grade analysis.
 * Each rule has a pattern matcher, severity classification, and remediation.
 */
interface DiagnosticRule {
  id: string;
  name: string;
  match: (logs: LogEntry[], metrics?: Partial<SystemMetrics>) => boolean;
  severity: Severity;
  diagnose: (logs: LogEntry[], metrics?: Partial<SystemMetrics>) => DiagnosticResult;
}

const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  // ---- CRITICAL rules ----
  {
    id: "oom-killer",
    name: "Out of Memory Kill",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.toLowerCase().includes("out of memory") ||
          l.message.toLowerCase().includes("killed process")
      ),
    severity: "CRITICAL",
    diagnose: (logs) => {
      const oomLog = logs.find(
        (l) =>
          l.message.toLowerCase().includes("out of memory") ||
          l.message.toLowerCase().includes("killed process")
      );
      return {
        root_cause: `Linux OOM Killer has terminated a process due to memory exhaustion. The kernel detected that available memory (including swap) was insufficient to satisfy allocation requests. The offending process was consuming excessive RSS memory, likely due to a memory leak in the Node.js application heap (unbounded cache, circular references in closures, or EventEmitter listener accumulation). Log evidence: "${oomLog?.message || "OOM event detected"}"`,
        severity: "CRITICAL",
        remediation_command:
          "sudo systemctl restart pm2-root && sudo sysctl -w vm.overcommit_memory=2 && sudo sh -c 'echo 1 > /proc/sys/vm/drop_caches'",
        affected_service: "pm2/api-server",
        confidence: 0.94,
      };
    },
  },
  {
    id: "max-restart-exceeded",
    name: "PM2 Max Restart Exceeded",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.toLowerCase().includes("max restart count") ||
          l.message.toLowerCase().includes("errored") && l.level === "FATAL"
      ),
    severity: "CRITICAL",
    diagnose: () => ({
      root_cause:
        "PM2 process has exceeded its maximum restart threshold (15 restarts) and has entered a permanent 'errored' state. This cascade failure indicates a persistent crash loop, typically caused by: (1) missing runtime dependency (e.g., @prisma/client not installed after deployment), (2) port conflict with another process, or (3) corrupted node_modules directory after a failed npm install. The process will not auto-recover without manual intervention.",
      severity: "CRITICAL",
      remediation_command:
        "cd /opt/apps/api && npm ci --production && pm2 delete api-server && pm2 start ecosystem.config.js --only api-server",
      affected_service: "pm2/api-server",
      confidence: 0.91,
    }),
  },
  {
    id: "all-workers-crashed",
    name: "Service Mesh Total Failure",
    match: (logs) =>
      logs.some((l) => l.message.toLowerCase().includes("all worker processes crashed")),
    severity: "CRITICAL",
    diagnose: () => ({
      root_cause:
        "All PM2 worker processes have crashed simultaneously, indicating a systemic failure affecting the entire service mesh. This is typically caused by a shared dependency failure (e.g., database connection pool exhaustion, DNS resolution failure, or a corrupted shared module). The cascading nature suggests a single root cause propagating across all worker instances.",
      severity: "CRITICAL",
      remediation_command:
        "pm2 kill && sudo systemctl restart postgresql redis-server nginx && sleep 5 && pm2 resurrect",
      affected_service: "pm2/all-workers",
      confidence: 0.88,
    }),
  },

  // ---- HIGH rules ----
  {
    id: "db-connection-refused",
    name: "Database Connection Failure",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.includes("ECONNREFUSED") &&
          (l.message.includes("5432") || l.message.includes("PostgreSQL"))
      ),
    severity: "HIGH",
    diagnose: (logs) => {
      const errLog = logs.find((l) => l.message.includes("ECONNREFUSED"));
      return {
        root_cause: `PostgreSQL database connection refused at 127.0.0.1:5432. The database server is either: (1) not running — crashed or failed to start after host reboot, (2) has exhausted its max_connections limit (default: 100), or (3) pg_hba.conf rejects the connection from the application's IP/user. Multiple application processes are failing with ECONNREFUSED, creating a cascading failure across the API layer. Evidence: "${errLog?.message || "Connection refused"}"`,
        severity: "HIGH",
        remediation_command:
          "sudo systemctl restart postgresql && sleep 3 && sudo -u postgres psql -c 'SELECT count(*) FROM pg_stat_activity;' && pm2 restart api-server",
        affected_service: "postgresql/api-server",
        confidence: 0.92,
      };
    },
  },
  {
    id: "missing-module",
    name: "Missing Node Module",
    match: (logs) =>
      logs.some((l) => l.message.includes("Cannot find module")),
    severity: "HIGH",
    diagnose: (logs) => {
      const errLog = logs.find((l) => l.message.includes("Cannot find module"));
      const moduleMatch = errLog?.message.match(
        /Cannot find module '([^']+)'/
      );
      const moduleName = moduleMatch?.[1] || "unknown";
      return {
        root_cause: `Node.js application failed to load required module '${moduleName}'. This typically occurs after a deployment where 'npm install' succeeded but post-install scripts (e.g., Prisma generate) were not executed, or the deployment pipeline used --production flag which pruned devDependencies that include build tools needed at runtime.`,
        severity: "HIGH",
        remediation_command: `cd /opt/apps/api && npm install ${moduleName} && npx prisma generate 2>/dev/null; pm2 restart api-server`,
        affected_service: "pm2/api-server",
        confidence: 0.89,
      };
    },
  },
  {
    id: "disk-io-error",
    name: "Disk I/O Errors",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.toLowerCase().includes("io_error") ||
          l.message.toLowerCase().includes("ext4-fs error")
      ),
    severity: "HIGH",
    diagnose: () => ({
      root_cause:
        "Filesystem I/O errors detected on the NVMe storage device (nvme0n1p2). The ext4 filesystem has reported inode lookup failures, indicating possible sector-level corruption or early-stage drive failure. Continued operation risks data loss. The BTRFS warning about I/O error counts suggests the drive's internal error correction is being overwhelmed.",
      severity: "HIGH",
      remediation_command:
        "sudo smartctl -a /dev/nvme0n1 && sudo fsck -n /dev/nvme0n1p2 && sudo dmesg | grep -i 'nvme\\|error' | tail -20",
      affected_service: "storage/nvme0n1",
      confidence: 0.85,
    }),
  },
  {
    id: "memory-exceeded",
    name: "Process Memory Limit Exceeded",
    match: (logs) =>
      logs.some((l) => l.message.toLowerCase().includes("exceeded memory limit")),
    severity: "HIGH",
    diagnose: () => ({
      root_cause:
        "A PM2-managed process has exceeded its configured memory limit (1536MB), triggering an automatic restart. This indicates either: (1) a memory leak in the application (growing heap due to accumulated closures, caches, or unreleased database connections), or (2) the memory limit is set too low for the current workload. Repeated occurrences suggest a genuine leak rather than a configuration issue.",
      severity: "HIGH",
      remediation_command:
        "pm2 restart api-server --max-memory-restart 2048M && node --expose-gc -e 'global.gc()' 2>/dev/null; pm2 logs api-server --lines 50",
      affected_service: "pm2/api-server",
      confidence: 0.87,
    }),
  },

  // ---- MEDIUM rules ----
  {
    id: "connection-pool-saturation",
    name: "Connection Pool Near Capacity",
    match: (logs) =>
      logs.some((l) => l.message.toLowerCase().includes("pool nearing capacity")),
    severity: "MEDIUM",
    diagnose: (logs) => {
      const warnLog = logs.find((l) =>
        l.message.toLowerCase().includes("pool nearing capacity")
      );
      return {
        root_cause: `Database connection pool is at 96% capacity (48/50 active connections). Under continued load, new requests will queue and eventually timeout. This is caused by: (1) slow queries holding connections longer than expected, (2) connection leaks from unclosed transactions, or (3) increased traffic volume. Evidence: "${warnLog?.message || "Pool saturation detected"}"`,
        severity: "MEDIUM",
        remediation_command:
          "sudo -u postgres psql -c \"SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;\"",
        affected_service: "postgresql/connection-pool",
        confidence: 0.83,
      };
    },
  },
  {
    id: "memory-leak-warning",
    name: "EventEmitter Memory Leak",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.includes("MaxListenersExceededWarning") ||
          l.message.includes("memory leak detected")
      ),
    severity: "MEDIUM",
    diagnose: () => ({
      root_cause:
        "Node.js EventEmitter has exceeded the default listener limit (10), with 11+ listeners attached to a Socket instance. This is a strong indicator of a memory leak — likely caused by repeatedly adding event handlers in a loop or within a recurring function call without removing previous listeners. If left unchecked, this will lead to memory exhaustion and an eventual OOM kill.",
      severity: "MEDIUM",
      remediation_command:
        "node -e \"process.setMaxListeners(20)\" && pm2 restart api-server --node-args='--trace-warnings' && pm2 logs api-server --lines 30 | grep -i 'listener\\|leak'",
      affected_service: "pm2/api-server",
      confidence: 0.81,
    }),
  },
  {
    id: "high-heap-utilization",
    name: "High V8 Heap Usage",
    match: (logs) =>
      logs.some((l) => l.message.toLowerCase().includes("high heap utilization")),
    severity: "MEDIUM",
    diagnose: () => ({
      root_cause:
        "V8 heap utilization is at 85.7% (1.2GB / 1.4GB). The garbage collector is under pressure and frequent GC pauses are likely degrading application latency (increased p99 response times). This often precedes an OOM condition if the growth trend continues.",
      severity: "MEDIUM",
      remediation_command:
        "pm2 restart api-server --node-args='--max-old-space-size=2048 --expose-gc' && pm2 monit",
      affected_service: "pm2/api-server",
      confidence: 0.79,
    }),
  },
  {
    id: "brute-force-ssh",
    name: "SSH Brute Force Attempt",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.includes("brute force") ||
          (l.message.includes("UFW BLOCK") && l.message.includes("DPT=22"))
      ),
    severity: "MEDIUM",
    diagnose: (logs) => {
      const attackLog = logs.find(
        (l) => l.message.includes("UFW BLOCK") || l.message.includes("brute force")
      );
      const srcMatch = attackLog?.message.match(/SRC=([0-9.]+)/);
      const srcIp = srcMatch?.[1] || "unknown";
      return {
        root_cause: `UFW firewall blocked an SSH brute-force attempt from ${srcIp} targeting port 22. While the firewall is correctly blocking these, persistent attacks from this IP suggest it should be permanently banned. Consider implementing rate limiting with fail2ban if not already configured.`,
        severity: "MEDIUM",
        remediation_command: `sudo fail2ban-client set sshd banip ${srcIp} && sudo ufw deny from ${srcIp} to any && echo "Banned ${srcIp}"`,
        affected_service: "security/sshd",
        confidence: 0.95,
      };
    },
  },

  // ---- LOW rules ----
  {
    id: "deprecation-warning",
    name: "Deprecation Warning",
    match: (logs) =>
      logs.some((l) => l.message.includes("DeprecationWarning")),
    severity: "LOW",
    diagnose: () => ({
      root_cause:
        "Node.js runtime has emitted a deprecation warning for Buffer() constructor usage. While not immediately impactful, deprecated APIs may be removed in future Node.js major versions. The application or one of its dependencies is using the legacy Buffer() constructor instead of the safer Buffer.alloc() or Buffer.from() alternatives.",
      severity: "LOW",
      remediation_command:
        "grep -rn 'new Buffer(' /opt/apps/api/src/ || grep -rn 'Buffer(' /opt/apps/api/src/ | head -20",
      affected_service: "pm2/api-server",
      confidence: 0.97,
    }),
  },
  {
    id: "db-migration-failure",
    name: "Database Migration Failure",
    match: (logs) =>
      logs.some(
        (l) =>
          l.message.toLowerCase().includes("migration failed") ||
          l.message.toLowerCase().includes("schema in inconsistent")
      ),
    severity: "CRITICAL",
    diagnose: () => ({
      root_cause:
        "Database schema migration failed mid-transaction, leaving the database in an inconsistent state. A partially applied migration means some tables/columns exist while others don't, causing runtime errors across all API endpoints that interact with the affected tables. This requires immediate manual intervention to either complete or rollback the migration.",
      severity: "CRITICAL",
      remediation_command:
        "cd /opt/apps/api && npx prisma migrate resolve --rolled-back $(npx prisma migrate status 2>&1 | grep 'Failed' | awk '{print $NF}') && npx prisma migrate deploy",
      affected_service: "postgresql/migrations",
      confidence: 0.86,
    }),
  },
];

/**
 * Default diagnostic for when no specific pattern matches
 */
function defaultDiagnostic(logs: LogEntry[], metrics?: Partial<SystemMetrics>): DiagnosticResult {
  const errorCount = logs.filter(
    (l) => l.level === "ERROR" || l.level === "FATAL"
  ).length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;

  const cpuNote =
    metrics?.cpu && metrics.cpu.usage > 80
      ? ` CPU utilization is elevated at ${metrics.cpu.usage}% — consider scaling horizontally.`
      : "";
  const memNote =
    metrics?.memory && metrics.memory.used / metrics.memory.total > 0.85
      ? ` Memory usage is at ${Math.round((metrics.memory.used / metrics.memory.total) * 100)}% — monitor for potential OOM conditions.`
      : "";

  let severity: Severity = "LOW";
  if (errorCount > 3) severity = "CRITICAL";
  else if (errorCount > 1) severity = "HIGH";
  else if (warnCount > 2) severity = "MEDIUM";

  return {
    root_cause: `Log analysis detected ${errorCount} error(s) and ${warnCount} warning(s) in the current window. No specific failure pattern matched, but elevated error rates indicate system instability. Sources affected: ${[...new Set(logs.map((l) => l.source))].join(", ")}.${cpuNote}${memNote} Recommend monitoring for pattern escalation.`,
    severity,
    remediation_command:
      "journalctl -u pm2-root --since '10 minutes ago' --no-pager | tail -50 && pm2 status && df -h && free -h",
    affected_service: "system/general",
    confidence: 0.65,
  };
}

/**
 * Main diagnostic analysis function — evaluates logs against all rules
 * and returns the highest-severity matching diagnostic.
 */
export function analyzeLogs(
  logs: LogEntry[],
  metrics?: Partial<SystemMetrics>
): DiagnosticResult {
  const severityOrder: Record<Severity, number> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
  };

  let bestMatch: DiagnosticResult | null = null;
  let bestSeverity = -1;

  for (const rule of DIAGNOSTIC_RULES) {
    if (rule.match(logs, metrics)) {
      const result = rule.diagnose(logs, metrics);
      const severityRank = severityOrder[result.severity];
      if (severityRank > bestSeverity) {
        bestSeverity = severityRank;
        bestMatch = result;
      }
    }
  }

  const diagnostic = bestMatch || defaultDiagnostic(logs, metrics);

  return {
    ...diagnostic,
    timestamp: new Date().toISOString(),
    analysis_id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  };
}
