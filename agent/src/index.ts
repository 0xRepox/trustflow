import { loadConfig } from "./config.js";
import { createClients } from "./client.js";
import { SubscriberAgent } from "./subscriber.js";

/**
 * Entry point for the autonomous subscriber agent.
 *
 * After the wallet is funded once, no human signs anything: the agent opens its
 * own stream, keeps its own runway topped up, and cancels when its work is done.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const clients = createClients(config);

  console.log(`agent ${clients.address} watching plan ${config.planId}`);

  const agent = new SubscriberAgent(config, clients);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — stopping agent`);
    agent.stop();
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await agent.run();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "agent failed to start");
  process.exitCode = 1;
});
