# InfraWatch AI — Autonomous Linux Infrastructure Agent & Dashboard

A production-ready, full-stack Next.js 14 (App Router) application that provides real-time Linux server monitoring, AI-powered log diagnostics, and automated infrastructure remediation. Designed for seamless deployment to Vercel.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                              │
│                                                                      │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  System      │  │  Real-Time      │  │  AI Diagnostic           │ │
│  │  Health      │  │  Log Viewer     │  │  Terminal                │ │
│  │  Widgets     │  │  (SSE Stream)   │  │  (Analysis Results)      │ │
│  │  • CPU       │  │  • Color-coded  │  │  • Root Cause Analysis   │ │
│  │  • RAM       │  │  • Auto-scroll  │  │  • Severity Badges       │ │
│  │  • NVMe      │  │  • Pause/Resume │  │  • Remediation Commands  │ │
│  │  • Network   │  │  • Clear        │  │  • Copy to Clipboard     │ │
│  └─────────────┘  └─────────────────┘  └──────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  PM2 Process Table                                               │ │
│  │  • Status Indicators  • CPU/Memory  • Restarts  • Uptime        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────┬──────────────────────────────┬──────────────────────┘
                 │  SSE (EventSource)           │  POST /api/analyze-logs
                 ▼                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER (API Routes)                     │
│                                                                      │
│  ┌─────────────────────────┐  ┌────────────────────────────────────┐ │
│  │  /api/stream-logs       │  │  /api/analyze-logs                 │ │
│  │  (Server-Sent Events)   │  │  (POST — Diagnostic Engine)        │ │
│  │                         │  │                                    │ │
│  │  Streams:               │  │  Receives: LogEntry[] + Metrics    │ │
│  │  • Log entries          │  │  Returns:                          │ │
│  │  • System metrics       │  │  • root_cause (detailed)           │ │
│  │  • Process list         │  │  • severity (LOW→CRITICAL)         │ │
│  │  every 2-5 seconds      │  │  • remediation_command (CLI)       │ │
│  └────────────┬────────────┘  │  • confidence score                │ │
│               │               │  • affected_service                │ │
│               ▼               └────────────────┬───────────────────┘ │
│  ┌─────────────────────────┐                   │                     │
│  │  Simulation Engine      │                   ▼                     │
│  │  (lib/simulator.ts)     │  ┌────────────────────────────────────┐ │
│  │                         │  │  AI Diagnostic Engine              │ │
│  │  • Weighted log gen     │  │  (lib/diagnostics.ts)              │ │
│  │  • Metric fluctuation   │  │                                    │ │
│  │  • Spike simulation     │  │  13 diagnostic rules including:    │ │
│  │  • PM2 process mock     │  │  • OOM Killer detection            │ │
│  └─────────────────────────┘  │  • PM2 crash loop analysis         │ │
│                               │  • DB connection failure           │ │
│                               │  • Missing module detection        │ │
│                               │  • SSH brute force alerts          │ │
│                               │  • Memory leak warnings            │ │
│                               │  • Disk I/O error analysis         │ │
│                               └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Real-Time Log Ingestion Stream
- **Server-Sent Events (SSE)** for zero-latency log delivery
- Simulates realistic Linux server logs from PM2, systemd, kernel, nginx, and Node.js
- Weighted random generation — errors and fatals are rare, info/debug are common
- Color-coded log level badges (INFO, DEBUG, WARN, ERROR, FATAL)
- Source identification badges with per-source coloring
- Pause/Resume/Clear controls with auto-scroll respecting user position
- Buffered to 200 entries to prevent memory bloat

### AI Diagnostic Engine
- Pattern-matching engine with **13 diagnostic rules** covering:
  - **CRITICAL**: OOM kills, PM2 max restart exceeded, service mesh total failure, database migration corruption
  - **HIGH**: PostgreSQL connection refused, missing Node modules, disk I/O errors, memory limit exceeded
  - **MEDIUM**: Connection pool saturation, EventEmitter memory leaks, high V8 heap, SSH brute force
  - **LOW**: Deprecation warnings
- Each diagnosis includes:
  - Detailed **root cause analysis** with evidence citation
  - **Severity classification** (LOW → CRITICAL)
  - Precise **remediation CLI commands** ready to execute
  - **Confidence score** (0.0–1.0)
  - **Affected service** identifier
- Automatic analysis every 25 seconds + manual trigger button

### Interactive Dashboard UI
- **System Health Widgets**: Animated circular SVG gauges for CPU, Memory, NVMe Disk, and Network
- **PM2 Process Table**: Real-time process status with color-coded indicators
- **Server Info Bar**: Hostname, distro, kernel version, uptime
- **Diagnostic Terminal**: Dark-themed terminal UI with copy-to-clipboard remediation commands
- **Responsive Layout**: Two-column grid that collapses on mobile
- **Smooth Animations**: Slide-up entry animations, gauge fills, pulse glows

### Design System
- **Background**: `#f4f4f4` — Clean, light, modern
- **Primary Accent**: `#0ea4ff` — Vibrant professional blue
- **Typography**: Ubuntu (headings) + Lato (body) via Google Fonts
- **Monospace**: JetBrains Mono / Fira Code for code and metrics
- Custom scrollbars, severity badges, status dots, progress bars
- All white/clean panels — no dark backgrounds on interface elements

---

## 📁 Project Structure

```
linux-infra-agent/
├── app/
│   ├── api/
│   │   ├── analyze-logs/
│   │   │   └── route.ts          # POST — AI diagnostic analysis endpoint
│   │   └── stream-logs/
│   │       └── route.ts          # GET — SSE streaming endpoint
│   ├── globals.css               # Design system (Tailwind v4 @theme)
│   ├── layout.tsx                # Root layout with Ubuntu/Lato fonts
│   └── page.tsx                  # Main dashboard page (orchestrator)
├── components/
│   ├── DiagnosticTerminal.tsx    # AI analysis terminal with copy support
│   ├── Header.tsx                # Sticky header with connection status
│   ├── LogViewer.tsx             # Real-time log feed with controls
│   ├── ProcessTable.tsx          # PM2 process list table
│   └── SystemHealthWidgets.tsx   # CPU/RAM/Disk/Network gauges
├── lib/
│   ├── diagnostics.ts            # AI diagnostic rule engine (13 rules)
│   ├── simulator.ts              # Log & metrics simulation engine
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # clsx + tailwind-merge utility
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── next.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.17
- **npm** ≥ 9

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd linux-infra-agent

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🌐 Deployment to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 3: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects the Next.js framework
5. Click **Deploy**

### Vercel Configuration

No special configuration is needed. The project works with Vercel's defaults:

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Node.js Version**: 18.x or 20.x
- **Serverless Functions**: API routes auto-deploy as Vercel Functions
- **Edge Runtime**: Not required (uses Node.js runtime for SSE)

### Environment Variables (Optional)

If connecting to a real LLM API in the future:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for real LLM inference | Not required (uses built-in engine) |
| `LOG_SOURCE` | `simulated` or `journalctl` | `simulated` |

---

## 🔌 API Reference

### `POST /api/analyze-logs`

Analyzes log entries and system metrics to produce AI-powered diagnostics.

**Request Body:**
```json
{
  "logs": [
    {
      "id": "log_1720209600_1",
      "timestamp": "2026-07-05T20:00:00.000Z",
      "level": "ERROR",
      "source": "pm2",
      "message": "Process api-server [0] exited with code 1",
      "pid": 3201
    }
  ],
  "metrics": {
    "cpu": { "usage": 78.5, "cores": 8 },
    "memory": { "total": 32768, "used": 28000 }
  }
}
```

**Response:**
```json
{
  "success": true,
  "diagnostic": {
    "root_cause": "Detailed explanation of the failure architecture.",
    "severity": "CRITICAL",
    "remediation_command": "sudo systemctl restart pm2-root",
    "affected_service": "pm2/api-server",
    "confidence": 0.91,
    "timestamp": "2026-07-05T20:00:01.234Z",
    "analysis_id": "diag_1720209601_abc123"
  },
  "processing_time_ms": 342
}
```

### `GET /api/analyze-logs`

Returns API health status and schema documentation.

### `GET /api/stream-logs`

Server-Sent Events stream delivering real-time data:

| Event Type | Payload | Interval |
|-----------|---------|----------|
| `logs` | `LogEntry[]` | ~2 seconds |
| `metrics` | `SystemMetrics` | ~3 seconds |
| `processes` | `ProcessInfo[]` | ~5 seconds |

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Full-stack React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS v4** | Utility-first CSS with @theme design tokens |
| **Lucide React** | Beautiful SVG icon library |
| **Server-Sent Events** | Real-time streaming without WebSockets |
| **clsx + tailwind-merge** | Conditional class name composition |

---

## 🏛 Architecture Decisions

1. **SSE over WebSockets**: Server-Sent Events are simpler for unidirectional server→client streaming, require no additional packages, and work seamlessly with Vercel's serverless functions.

2. **Rule-Based Diagnostic Engine**: Uses pattern matching instead of actual LLM calls to ensure zero external dependencies and predictable behavior. The rule engine can be swapped for real LLM calls by modifying `lib/diagnostics.ts`.

3. **Simulation Engine**: Generates realistic server telemetry with weighted probabilities, metric drift, and spike simulation — closely mimicking production Fedora/Ubuntu server behavior.

4. **Component Architecture**: Each UI panel is a self-contained component with its own types, reducing coupling and enabling independent testing.

5. **Design Token System**: All colors, spacing, shadows, and radii are defined as Tailwind v4 `@theme` tokens for consistent theming.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
