// ============================================================================
// POST /api/analyze-logs
// Backend API route that processes log snippets and system metrics through
// the AI diagnostic engine and returns structured remediation responses.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { analyzeLogs } from "@/lib/diagnostics";
import type { AnalyzeLogsRequest, AnalyzeLogsResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body: AnalyzeLogsRequest = await request.json();

    // Validate incoming payload
    if (!body.logs || !Array.isArray(body.logs) || body.logs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: 'logs' must be a non-empty array of LogEntry objects.",
        },
        { status: 400 }
      );
    }

    // Simulate LLM inference latency (realistic API call timing)
    const simulatedLatency = Math.floor(Math.random() * 400) + 200;
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

    // Run diagnostic analysis
    const diagnostic = analyzeLogs(body.logs, body.metrics);

    const processingTime = Math.round(performance.now() - startTime);

    const response: AnalyzeLogsResponse = {
      success: true,
      diagnostic,
      processing_time_ms: processingTime,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);

    console.error("[/api/analyze-logs] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during log analysis.",
        processing_time_ms: processingTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler — returns API health status and endpoint documentation
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "/api/analyze-logs",
    method: "POST",
    description:
      "Analyzes server log entries and system metrics to produce AI-powered diagnostic results with root cause analysis and remediation commands.",
    schema: {
      request: {
        logs: "LogEntry[] — Array of log entries with id, timestamp, level, source, message, pid",
        metrics: "Partial<SystemMetrics> — Optional system metrics (CPU, memory, disk, network)",
      },
      response: {
        success: "boolean",
        diagnostic: {
          root_cause: "string — Detailed explanation of the failure",
          severity: "LOW | MEDIUM | HIGH | CRITICAL",
          remediation_command: "string — CLI command to resolve the issue",
          affected_service: "string — Service identifier affected",
          confidence: "number — Confidence score 0-1",
          timestamp: "string — ISO 8601 analysis timestamp",
          analysis_id: "string — Unique diagnostic ID",
        },
        processing_time_ms: "number",
      },
    },
  });
}
