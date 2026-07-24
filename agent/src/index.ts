import { loadConfig, DEPLOY_BLOCK } from "./config.js";
import { createClients } from "./client.js";
import { createExecutor } from "./executor.js";
import { HttpHealthCheck } from "./health.js";
import { SubscriberAgent } from "./subscriber.js";

/**
 * Entry point for the autonomous subscriber agent.
 *
 * After the wallet is funded once, no human signs anything: the agent opens its
 * own stream, keeps its own runway topped up, and cancels when its work is done.
 * In production the wallet is a Circle Agent Wallet, so every spend is bounded
 * by the policy the user set.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const clients = createClients(config);
  const executor = createExecutor(config, clients);

  console.log(`agent ${executor.address} (${config.walletMode}) watching plan ${config.planId}`);

  const healthCheck = config.serviceHealthUrl
    ? new HttpHealthCheck(config.serviceHealthUrl, config.serviceHealthTimeoutMs)
    : undefined;
  if (!healthCheck) {
    console.log("no SERVICE_HEALTH_URL configured — the agent will not assess or dispute");
  }

  const agent = new SubscriberAgent(config, clients, executor, DEPLOY_BLOCK, healthCheck);

  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received — stopping agent`);
    agent.stop();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await agent.run();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "agent failed to start");
  process.exitCode = 1;
});
