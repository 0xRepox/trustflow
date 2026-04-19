"use client";

const BASE_URL = "https://app-omega-two-83.vercel.app";
const INDEXER_URL = "https://trustflow-production.up.railway.app/graphql";

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
      </Section>

      <Section title="3. Check Subscription on Your Server">
        <p className="text-sm text-gray-400">
          After a user subscribes, verify their status server-side before granting access.
          Pass their wallet address and your plan ID:
        </p>
        <CodeBlock code={`// Node.js / TypeScript
const res = await fetch(
  "${BASE_URL}/api/check-subscription?planId=1&address=0xUSER_WALLET"
);
const { active, stream } = await res.json();

if (!active) {
  return res.status(403).json({ error: "No active subscription" });
}

// stream.remaining — USDC left in deposit
// stream.createdAt  — Unix timestamp of subscription start`} />
      </Section>

      <Section title="API Reference">
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden text-sm">
          <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-2">
            <span className="bg-green-700 text-green-200 text-xs px-2 py-0.5 rounded font-mono">GET</span>
            <code className="text-gray-300">/api/check-subscription</code>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Query params</p>
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
  "stream": {
    "id": "3",
    "planId": "1",
    "deposited": 29.99,
    "consumed": 1.23,
    "remaining": 28.76,
    "createdAt": 1713484800
  }
}`} />
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
