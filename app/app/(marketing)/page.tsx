"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WalletButton } from "@/components/WalletButton";
import s from "./landing.module.css";

const MONTHLY_RATE = 9.0;
const PER_SECOND = MONTHLY_RATE / (30 * 24 * 60 * 60);

function fmtElapsed(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const ss = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

interface LedgerEntry { label: string; amt: string; warn?: boolean }

const COMPARE_ROWS = [
  { criterion: "Transaction fee", hint: "per charge", legacy: "2.9% + $0.30", modern: "~$0.01 gas" },
  { criterion: "Refund on cancel", hint: "for unused time", legacy: "5–10 business days", modern: "< 1 second" },
  { criterion: "Chargeback risk", hint: "merchant exposure", legacy: "$20 fee + reversal", modern: "Impossible by design" },
  { criterion: "Viable monthly price", hint: "fees eat margin", legacy: "~$5.00 minimum", modern: "$0.01 minimum" },
  { criterion: "Billing granularity", hint: "resolution", legacy: "Monthly cycle", modern: "Per-second" },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const [streamed, setStreamed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [statTotal, setStatTotal] = useState(48932.17);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { label: "00:00 · init", amt: "+ allowance" },
    { label: "00:00 · deposit", amt: "+ 2.10" },
  ]);
  const elapsedRef = useRef(0);
  const streamedRef = useRef(0);
  const statRef = useRef(48932.17);


  useEffect(() => {
    const id = setInterval(() => {
      elapsedRef.current += 0.1;
      streamedRef.current += PER_SECOND * 0.1;
      statRef.current += PER_SECOND * 0.1 * 7;

      setElapsed(elapsedRef.current);
      setStreamed(streamedRef.current);
      setStatTotal(statRef.current);

      const sec = Math.floor(elapsedRef.current);
      if (sec > 0 && sec % 30 === 0) {
        const label = `${fmtElapsed(elapsedRef.current)} · tick`;
        const amt = `+ ${(PER_SECOND * 30).toFixed(6)}`;
        setLedger((prev) => [{ label, amt }, ...prev].slice(0, 5));
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(`.${s.reveal}`);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(s.revealed); }),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function handleChangeRate() {
    const label = `${fmtElapsed(elapsedRef.current)} · rate ↑`;
    setLedger((prev) => [{ label, amt: "$12 / mo" }, ...prev].slice(0, 5));
  }

  function handleCancel() {
    const label = `${fmtElapsed(elapsedRef.current)} · cancel`;
    const refund = (2.10 - streamedRef.current).toFixed(6);
    setLedger((prev) => [{ label, amt: `refund ${refund}`, warn: true }, ...prev].slice(0, 5));
    elapsedRef.current = 0;
    streamedRef.current = 0;
    setElapsed(0);
    setStreamed(0);
    setTimeout(() => {
      setLedger([
        { label: "00:00 · init", amt: "+ allowance" },
        { label: "00:00 · deposit", amt: "+ 2.10" },
      ]);
    }, 800);
  }

  return (
    <div className={s.bg}>
      <div className={s.wrap}>

        {/* Nav */}
        <nav className={s.nav}>
          <Link href="/" className={s.brand}>
            <span className={s.dot} />
            TrustFlow
          </Link>
          <ul className={s.navLinks}>
            <li><a href="#how" className={s.navLink}>How it works</a></li>
            <li><a href="#compare" className={s.navLink}>Why Arc</a></li>
            <li><a href="#integrate" className={s.navLink}>Integrate</a></li>
            <li><Link href="/docs" className={s.navLink}>Docs</Link></li>
            <li><Link href="/dashboard" className={s.navCta}>Launch app →</Link></li>
          </ul>
        </nav>

        {/* Hero */}
        <section className={s.hero}>
          <span className={s.tag}>Live on Arc Testnet · Chain 5042002</span>

          <h1 className={s.heroTitle}>
            Subscriptions that settle every second,<br />
            <span className={s.heroAccent}>not every 30 days.</span>
          </h1>

          <p className={s.heroSub}>
            A subscription protocol built on <strong>Arc</strong> that replaces 30-day billing cycles with
            continuous USDC streams. Subscribers pay only for time consumed. Merchants receive revenue every second.
            Cancel at 13 seconds? You get refunded for the other 2,591,987.
          </p>

          <div className={s.heroCtas}>
            <Link href="/dashboard" className={`${s.btn} ${s.btnPrimary}`}>
              Start streaming <span className={s.arr}>→</span>
            </Link>
            <a href="#how" className={`${s.btn} ${s.btnGhost}`}>See how it works</a>
          </div>

          {/* Live counter stage */}
          <div className={s.counterStage}>
            <div className={s.termHeader}>
              <div className={s.dots}>
                <span /><span /><span />
              </div>
              <div>stream · 0x7A3f…9E2c → 0xC8B1…44aA</div>
              <div className={s.liveLabel}>LIVE</div>
            </div>
            <div className={s.counterBody}>
              <div className={s.counterMain}>
                <div className={s.counterLabel}>Streamed this session</div>
                <div className={s.counterValue}>
                  <span>{streamed.toFixed(6)}</span>
                  <span className={s.currency}>USDC</span>
                </div>
                <div className={s.counterSub}>
                  <span>Rate: <strong>$9.00 / mo</strong></span>
                  <span>Elapsed: <strong>{fmtElapsed(elapsed)}</strong></span>
                  <span>Gas/tick: <strong>$0.01</strong></span>
                </div>
              </div>
              <div className={s.counterSide}>
                <div className={s.ledger}>
                  {ledger.map((e, i) => (
                    <div key={i} className={s.ledgerEntry}>
                      <span>{e.label}</span>
                      <span className={e.warn ? s.ledgerWarn : s.ledgerAmt}>{e.amt}</span>
                    </div>
                  ))}
                </div>
                <div className={s.counterActions}>
                  <button className={s.counterBtn} onClick={handleChangeRate}>change rate</button>
                  <button className={`${s.counterBtn} ${s.counterBtnCancel}`} onClick={handleCancel}>cancel · refund</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section id="compare" className={s.section}>
          <div className={s.sectionLabel}>// 01 · The math</div>
          <h2 className={s.sectionTitle}>
            Payment processors got greedy. <em>We got precise.</em>
          </h2>
          <p className={s.sectionIntro}>
            Every number below is a real constraint of how each rail operates today. TrustFlow doesn&apos;t beat Stripe by a little.
            It removes the failure modes entirely.
          </p>

          <div className={`${s.compare} ${s.reveal}`}>
            <div className={s.compareRow}>
              <div className={`${s.compareCell} ${s.compareHead}`}>Criterion</div>
              <div className={`${s.compareCell} ${s.compareHead}`}>Stripe / Traditional</div>
              <div className={`${s.compareCell} ${s.compareHead} ${s.winner}`}>TrustFlow on Arc</div>
            </div>
            {COMPARE_ROWS.map(({ criterion, hint, legacy, modern }) => (
              <div key={criterion} className={s.compareRow}>
                <div className={s.compareCell}>
                  <span className={s.criterion}>{criterion}</span>
                  <span className={s.hint}>{hint}</span>
                </div>
                <div className={`${s.compareCell} ${s.loser}`}>
                  <span className={s.val}>{legacy}</span>
                </div>
                <div className={`${s.compareCell} ${s.winner}`}>
                  <span className={s.val}>{modern}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={s.section}>
          <div className={s.sectionLabel}>// 02 · Mechanics</div>
          <h2 className={s.sectionTitle}>Four steps. <em>Zero middlemen.</em></h2>
          <p className={s.sectionIntro}>
            Every operation happens onchain on Arc. No payment processor. No hidden batch windows.
            No &ldquo;we&apos;ll get back to you in 5–7 business days.&rdquo;
          </p>

          <div className={s.steps}>
            <div className={`${s.step} ${s.reveal}`}>
              <div className={s.stepNum}>STEP / 01</div>
              <div className={s.stepBody}>
                <h3>Merchant defines the plan.</h3>
                <p>Set the rate, grace period, and cancellation terms. The plan lives as a single onchain record anyone can subscribe to.</p>
              </div>
              <pre className={s.stepCode}><span className={s.comment}>// one transaction, one source of truth</span>{"\n"}<span className={s.kw}>PlanRegistry</span>.createPlan({"{"}{"\n"}{"  "}name:      <span className={s.str}>&quot;Pro API&quot;</span>,{"\n"}{"  "}rate:      <span className={s.val}>9_000000</span>, <span className={s.comment}>// $9/mo in 6-dec USDC</span>{"\n"}{"  "}grace:     <span className={s.val}>86400</span>,   <span className={s.comment}>// 1 day</span>{"\n"}{"  "}dispute:   <span className={s.str}>&quot;agent+panel&quot;</span>{"\n"}{"}"})
</pre>
            </div>

            <div className={`${s.step} ${s.reveal}`}>
              <div className={s.stepNum}>STEP / 02</div>
              <div className={s.stepBody}>
                <h3>Subscriber opens a stream.</h3>
                <p>Approve a bounded USDC allowance. Deposit a small buffer (1 week is typical). The stream begins ticking in the same block.</p>
              </div>
              <pre className={s.stepCode}><span className={s.comment}>// 2 txs · ~$0.02 total gas on Arc</span>{"\n"}<span className={s.kw}>USDC</span>.approve(streamManager, buffer){"\n"}<span className={s.kw}>StreamManager</span>.createStream(planId, buffer){"\n"}<span className={s.comment}>// → streamId · status: STREAMING</span>
</pre>
            </div>

            <div className={`${s.step} ${s.reveal}`}>
              <div className={s.stepNum}>STEP / 03</div>
              <div className={s.stepBody}>
                <h3>Value flows, per second.</h3>
                <p>No cron job. No off-chain scheduler. Consumed balance is computed on-demand from <code>(rate × elapsed)</code>. Merchant can claim accrued revenue anytime.</p>
              </div>
              <pre className={s.stepCode}><span className={s.comment}>// merchant claims what&apos;s earned so far</span>{"\n"}<span className={s.kw}>StreamManager</span>.claim(streamId){"\n"}<span className={s.comment}>// → transfers accrued USDC to merchant</span>{"\n"}<span className={s.comment}>// → stream continues uninterrupted</span>
</pre>
            </div>

            <div className={`${s.step} ${s.reveal}`}>
              <div className={s.stepNum}>STEP / 04</div>
              <div className={s.stepBody}>
                <h3>Cancel. Refund. Sub-second.</h3>
                <p>Subscriber hits cancel. Unused buffer returns to their wallet in the same transaction. Arc&apos;s deterministic finality means the refund is final before the next heartbeat.</p>
              </div>
              <pre className={s.stepCode}><span className={s.comment}>// one call · final in &lt; 1 second</span>{"\n"}<span className={s.kw}>StreamManager</span>.cancel(streamId){"\n"}<span className={s.comment}>// → consumed stays with merchant</span>{"\n"}<span className={s.comment}>// → unused returns to subscriber</span>
</pre>
            </div>
          </div>
        </section>

        {/* API / Integration */}
        <section id="integrate" className={s.section}>
          <div className={s.sectionLabel}>// 03 · Integration</div>
          <h2 className={s.sectionTitle}>Gate any endpoint. <em>One request.</em></h2>
          <p className={s.sectionIntro}>
            Drop this into any backend. Returns <code>active: true</code> when the caller has a live stream.
            No SDK. No webhook setup. No auth server.
          </p>

          <div className={`${s.apiCard} ${s.reveal}`}>
            <div className={s.termHeader}>
              <div className={s.dots}><span /><span /><span /></div>
              <div>curl · terminal</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4A6F8C" }}>HTTP/1.1</div>
            </div>
            <pre className={s.apiTerminal}><span className={s.apiPrompt}>$</span> curl https://api.trustflow.xyz/check \{"\n"}    <span className={s.apiParam}>-d</span> <span className={s.apiString}>&quot;planId=42&quot;</span> \{"\n"}    <span className={s.apiParam}>-d</span> <span className={s.apiString}>&quot;address=0xC8B1...44aA&quot;</span>{"\n\n"}<span className={s.apiComment}># ← response</span>{"\n"}{"{"}{"\n"}  <span className={s.apiKey}>&quot;active&quot;</span>: <span className={s.apiString}>true</span>,{"\n"}  <span className={s.apiKey}>&quot;streamId&quot;</span>: <span className={s.apiString}>&quot;0x3e…b7&quot;</span>,{"\n"}  <span className={s.apiKey}>&quot;rate&quot;</span>: <span className={s.apiString}>&quot;9000000&quot;</span>, <span className={s.apiComment}>// per month</span>{"\n"}  <span className={s.apiKey}>&quot;consumed&quot;</span>: <span className={s.apiString}>&quot;412336&quot;</span>,{"\n"}  <span className={s.apiKey}>&quot;remaining&quot;</span>: <span className={s.apiString}>&quot;8587664&quot;</span>,{"\n"}  <span className={s.apiKey}>&quot;canceledAt&quot;</span>: <span className={s.apiString}>null</span>{"\n"}{"}"}</pre>
          </div>

          {/* Stats */}
          <div className={`${s.stats} ${s.reveal}`}>
            <div className={s.stat}>
              <div className={`${s.statNum} ${s.live}`}>
                {statTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={s.statLabel}>USDC streamed · testnet</div>
            </div>
            <div className={s.stat}>
              <div className={s.statNum}>1.3s</div>
              <div className={s.statLabel}>Avg. cancel → refund</div>
            </div>
            <div className={s.stat}>
              <div className={s.statNum}>$0.01</div>
              <div className={s.statLabel}>Cost per stream op</div>
            </div>
            <div className={s.stat}>
              <div className={s.statNum}>0</div>
              <div className={s.statLabel}>Chargebacks. Ever.</div>
            </div>
          </div>
        </section>

        {/* CTA block */}
        <section className={s.section}>
          <div className={`${s.ctaBlock} ${s.reveal}`}>
            <h2>Built for <em>builders</em>.<br />Open for testnet.</h2>
            <p>
              Contracts are verified on arcscan. Faucet-friendly. Bug reports welcome.
              Ship a subscription in an afternoon, not a sprint.
            </p>
            <div className={s.ctaBtns}>
              <WalletButton />
              <Link href="/docs" className={`${s.btn} ${s.btnGhost}`}>Read the docs</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div>TrustFlow · Built on Arc · Testnet</div>
          <div>
            <Link href="https://github.com" className={s.footerLink}>GitHub</Link>
            <Link href="/docs" className={s.footerLink}>Docs</Link>
            <Link href="https://twitter.com" className={s.footerLink}>Twitter</Link>
            <Link href="https://discord.com" className={s.footerLink}>Discord</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
