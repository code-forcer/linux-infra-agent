// ============================================================================
// GET /api/stream-logs
// Server-Sent Events endpoint that streams simulated log entries and
// system metrics to the frontend dashboard in real-time.
// ============================================================================

import { generateLogBatch, generateSystemMetrics, generateProcessList } from "@/lib/simulator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isActive = true;

      const sendEvent = (eventType: string, data: unknown) => {
        if (!isActive) return;
        try {
          const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          isActive = false;
        }
      };

      // Send initial system state
      sendEvent("metrics", generateSystemMetrics());
      sendEvent("processes", generateProcessList());
      sendEvent("logs", generateLogBatch(8));

      // Stream new logs every 1.5-3 seconds
      const logInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(logInterval);
          return;
        }
        const batchSize = Math.floor(Math.random() * 3) + 1;
        sendEvent("logs", generateLogBatch(batchSize));
      }, 2000);

      // Update metrics every 3 seconds
      const metricsInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(metricsInterval);
          return;
        }
        sendEvent("metrics", generateSystemMetrics());
      }, 3000);

      // Update process list every 5 seconds
      const processInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(processInterval);
          return;
        }
        sendEvent("processes", generateProcessList());
      }, 5000);

      // Auto-close after 10 minutes to prevent stale connections
      setTimeout(() => {
        isActive = false;
        clearInterval(logInterval);
        clearInterval(metricsInterval);
        clearInterval(processInterval);
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      }, 600000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
