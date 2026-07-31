/**
 * Toggleable health endpoint for filming the agent's dispute flow.
 *
 *   node demo-health-server.mjs
 *
 * Serves 200 on http://localhost:8099/health until you press Enter, then flips
 * to 503 — which is what SERVICE_HEALTH_URL needs to see for the agent's
 * assessService() to open a dispute on its own. Press Enter again to flip back.
 *
 * Local on purpose: the agent runs locally too, so localhost is reachable, and
 * a real terminal you can flip on camera reads better than a hidden remote
 * toggle. No deps, no deploy.
 */
import { createServer } from "node:http";

const PORT = 8099;
let healthy = true;

createServer((req, res) => {
  if (!req.url?.startsWith("/health")) {
    res.writeHead(404).end();
    return;
  }
  const code = healthy ? 200 : 503;
  console.log(`  ${new Date().toISOString().slice(11, 19)}  GET /health -> ${code}`);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: healthy ? "ok" : "degraded" }));
}).listen(PORT, () => {
  console.log(`health endpoint on http://localhost:${PORT}/health`);
  console.log(`state: HEALTHY (200)  —  press Enter to toggle\n`);
});

process.stdin.on("data", () => {
  healthy = !healthy;
  console.log(`\n>>> state: ${healthy ? "HEALTHY (200)" : "DEGRADED (503)"}\n`);
});
process.stdin.resume();
