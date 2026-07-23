import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseAbiItem, type Abi, type Address, type Hash } from "viem";
import type { AgentClients } from "./client.js";
import type { AgentConfig } from "./config.js";

const execFileAsync = promisify(execFile);

/**
 * A contract write, described once in a form both backends can consume.
 * `signature` is human-readable ("createStream(uint256,uint128)") so it maps
 * directly onto `circle wallet execute`, and viem parses it just as easily.
 */
export interface WriteCall {
  contract: Address;
  signature: string;
  args: readonly (bigint | string | boolean)[];
  /** Native value to send, if any (USDC on Arc). Circle only. */
  value?: bigint;
}

export interface Executor {
  readonly address: Address;
  execute(call: WriteCall): Promise<Hash>;
}

/** Raw-key signer via viem. For local dev and tests — the agent holds the key. */
export class ViemExecutor implements Executor {
  constructor(private readonly clients: AgentClients) {
    if (!clients.walletClient) throw new Error("ViemExecutor needs a wallet client (set AGENT_PRIVATE_KEY)");
  }

  get address(): Address {
    return this.clients.address;
  }

  async execute(call: WriteCall): Promise<Hash> {
    const item = parseAbiItem(`function ${call.signature}`);
    const functionName = call.signature.slice(0, call.signature.indexOf("("));
    return this.clients.walletClient!.writeContract({
      address: call.contract,
      abi: [item] as Abi,
      functionName,
      args: [...call.args],
      account: this.clients.walletClient!.account!,
      chain: this.clients.walletClient!.chain,
    });
  }
}

/**
 * Circle Agent Wallet signer. The MPC key shares never touch this process — we
 * shell out to Circle CLI, which enforces the wallet's spending policies before
 * anything is submitted. That policy layer is what makes it safe to hand the
 * agent a budget: it can only spend within limits the user set.
 */
export class CircleExecutor implements Executor {
  constructor(
    readonly address: Address,
    private readonly chain: string,
    private readonly rpcUrl: string,
  ) {}

  async execute(call: WriteCall): Promise<Hash> {
    const args = buildExecuteArgs(call, this.address, this.chain, this.rpcUrl);
    const { stdout } = await execFileAsync("circle", args);
    return parseTxHash(stdout);
  }
}

/** Pick the signer the config asks for. */
export function createExecutor(config: AgentConfig, clients: AgentClients): Executor {
  if (config.walletMode === "circle") {
    return new CircleExecutor(config.circleWalletAddress!, config.circleChain, config.rpcUrl);
  }
  return new ViemExecutor(clients);
}

/** Stringify one argument the way Circle CLI expects it on the command line. */
export function circleArg(a: bigint | string | boolean): string {
  if (typeof a === "bigint") return a.toString();
  if (typeof a === "boolean") return a ? "true" : "false";
  return a;
}

/**
 * Assemble the full `circle wallet execute` argument vector. Kept pure and
 * exported so it can be asserted without a live wallet — the live path can't be
 * exercised in CI, so the encoding is where a mistake would hide.
 */
export function buildExecuteArgs(call: WriteCall, address: Address, chain: string, rpcUrl: string): string[] {
  const args = [
    "wallet",
    "execute",
    call.signature,
    ...call.args.map(circleArg),
    "--contract",
    call.contract,
    "--address",
    address,
    "--chain",
    chain,
    "--rpc-url",
    rpcUrl,
  ];
  if (call.value !== undefined) args.push("--amount", call.value.toString());
  return args;
}

/** Pull the transaction hash out of Circle CLI output. */
export function parseTxHash(stdout: string): Hash {
  const match = stdout.match(/0x[0-9a-fA-F]{64}/);
  if (!match) throw new Error(`no transaction hash in Circle CLI output: ${stdout.slice(0, 200)}`);
  return match[0] as Hash;
}
