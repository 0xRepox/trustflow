"use client";

const BASE_URL = "https://trustflowonarc.vercel.app";
const INDEXER_URL = "https://indexer-production-854a.up.railway.app/graphql";

function CodeBlock({ code, lang = "ts" }: { code: string; lang?: string }) {
  return (
    <pre className={`language-${lang} bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 whitespace-pre`}>
      <code>{code}</code>
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Integration Guide</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Gate access to your product based on active TrustFlow subscriptions.
        </p>
      </div>

      <Section title="1. Create a Plan">
        <p className="text-sm text-gray-400">
          Go to <a href="/plans" className="text-blue-400 hover:underline">/plans</a>, set
          a monthly price, and click Create Plan. You'll get a <strong className="text-white">Plan ID</strong> (e.g. <code className="text-blue-300">1</code>).
        </p>
      </Section>

      <Section title="2. Add a Subscribe Button">
        <p className="text-sm text-gray-400">Link your users to the hosted subscribe page:</p>
        <CodeBlock lang="html" code={`<a href="${BASE_URL}/subscribe/YOUR_PLAN_ID">
  Subscribe
</a>`} />
        <p className="text-sm text-gray-400">
          The page handles wallet connection, USDC approval, and stream creation automatically.
        </p>
        <p className="text-sm text-gray-400">
          If a wallet already has an active stream on this exact plan, checkout is blocked —
          they can't double-pay themselves. If they have an active stream on a{" "}
          <strong className="text-white">different</strong> plan of yours, checkout switches
          mode: subscribing cancels that stream (refunding its unused deposit) and starts
          this one, so a subscriber is only ever billed for one of your plans at a time.
        </p>
      </Section>

      <Section title="3. Check Subscription on Your Server">
        <p className="text-sm text-gray-400">
          After a user subscribes, verify their status server-side before granting access.
          Pass their wallet address and your plan ID:
        </p>
        <CodeBlock code={`// Node.js / TypeScript
const res = await fetch("${BASE_URL}/api/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ planId: "1", address: "0xUSER_WALLET" }),
});
const { active, remaining } = await res.json();

if (!active) {
  return res.status(403).json({ error: "No active subscription" });
}

// remaining — USDC micro-units left unconsumed in the deposit`} />
      </Section>

      <Section title="4. Let Subscribers Manage Billing On Your Own Site">
        <p className="text-sm text-gray-400">
          Subscription management — cancel, top-up, dispute — happens on{" "}
          <strong className="text-white">your</strong> site, not TrustFlow's. These are
          plain onchain writes on the <code className="text-blue-300">StreamManager</code> and{" "}
          <code className="text-blue-300">DisputeResolver</code> contracts — call them
          directly from your own UI with wagmi/viem. No TrustFlow backend involved for
          writes; reads come from the same indexer/API you're already using. Subscribers
          never leave your domain.
        </p>
        <CodeBlock code={`// Contract addresses (Arc testnet) — same for every merchant
const ADDRESSES = {
  StreamManager: "0xf576f7aF812298B95bB440d6718A8b1d96d54395",
  DisputeResolver: "0xF87B65f0bFe749b0BDd0834D3a808B04c241714F",
  USDC: "0x3600000000000000000000000000000000000000",
};`} />

        <p className="text-sm text-gray-400 mt-4">
          <strong className="text-white">Cancel</strong> — instantly refunds the
          subscriber's unconsumed deposit, no approval needed:
        </p>
        <CodeBlock code={`await writeContractAsync({
  address: ADDRESSES.StreamManager,
  abi: streamManagerAbi, // needs just "cancel(uint256)"
  functionName: "cancel",
  args: [BigInt(streamId)],
});`} />

        <p className="text-sm text-gray-400 mt-4">
          <strong className="text-white">Top up</strong> — approve USDC, then top up
          (two transactions, standard ERC-20 pattern):
        </p>
        <CodeBlock code={`await writeContractAsync({
  address: ADDRESSES.USDC,
  abi: usdcAbi, // needs just "approve(address,uint256)"
  functionName: "approve",
  args: [ADDRESSES.StreamManager, amountWei],
});
await writeContractAsync({
  address: ADDRESSES.StreamManager,
  abi: streamManagerAbi, // needs just "topUp(uint256,uint256)"
  functionName: "topUp",
  args: [BigInt(streamId), amountWei],
});
// amountWei — USDC micro-units (1,000,000 = 1 USDC)`} />

        <p className="text-sm text-gray-400 mt-4">
          <strong className="text-white">Open a dispute</strong> — freezes the disputed
          amount plus a 1-day-rate bond, refundable if the subscriber's claim is upheld:
        </p>
        <CodeBlock code={`const bondWei = BigInt(Math.floor(
  (Number(plan.ratePerSecond) / 1_000_000) * 86400 * 1_000_000
));

await writeContractAsync({
  address: ADDRESSES.USDC,
  abi: usdcAbi,
  functionName: "approve",
  args: [ADDRESSES.DisputeResolver, amountWei + bondWei],
});
await writeContractAsync({
  address: ADDRESSES.DisputeResolver,
  abi: disputeResolverAbi, // needs just "openDispute(uint256,uint256)"
  functionName: "openDispute",
  args: [BigInt(streamId), amountWei],
});
// merchant then has 7 days to respond before it auto-resolves`} />

        <p className="text-sm text-gray-400 mt-4">
          To find which stream(s) belong to the connected wallet before showing these
          actions, query the indexer for that address (see{" "}
          <em>Direct GraphQL</em> below) or call <code className="text-blue-300">/api/check</code>{" "}
          if you already know the plan ID.
        </p>
      </Section>

      <Section title="API Reference">
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden text-sm">
          <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-2">
            <span className="bg-blue-700 text-blue-200 text-xs px-2 py-0.5 rounded font-mono">POST</span>
            <code className="text-gray-300">/api/check</code>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Body (form-encoded or JSON)</p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="py-1.5 pr-4 font-mono text-blue-300">planId</td>
                    <td className="py-1.5 text-gray-400">string — your Plan ID from the dashboard</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-mono text-blue-300">address</td>
                    <td className="py-1.5 text-gray-400">string — subscriber's wallet address (0x…)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Response</p>
              <CodeBlock lang="json" code={`{
  "active": true,
  "streamId": "3",
  "rate": "9000000",
  "consumed": "412336",
  "remaining": "8587664",
  "canceledAt": null
}`} />
              <p className="text-gray-500 text-xs mt-2">
                consumed / remaining / rate are USDC micro-units (1,000,000 = 1 USDC),
                computed live from onchain state at request time — not a cached snapshot.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Direct GraphQL (Advanced)">
        <p className="text-sm text-gray-400">
          Query the indexer directly for richer data. Endpoint:
        </p>
        <CodeBlock lang="bash" code={`POST ${INDEXER_URL}`} />
        <CodeBlock code={`query {
  streams(where: { planId: "1", payer: "0x...", status: "Active" }, limit: 1) {
    items {
      id deposited claimed consumed status createdAt
    }
  }
}`} />
      </Section>
    </div>
  );
}
