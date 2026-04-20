// TrustFlow — SubscribePage (public checkout)

function SubscribePage() {
  const [months, setMonths] = React.useState(1);
  const [step, setStep] = React.useState('idle'); // idle | approving | subscribing | done

  const monthlyPrice = 29.99;
  const ratePerSec = 0.000011;
  const deposit = (monthlyPrice * months).toFixed(2);
  const balance = 94.50;
  const hasBalance = balance >= monthlyPrice * months;

  function handleSubscribe() {
    setStep('approving');
    setTimeout(() => setStep('subscribing'), 1500);
    setTimeout(() => setStep('done'), 3000);
  }

  const btnLabel = {
    idle: `Subscribe · $${deposit} USDC`,
    approving: 'Step 1/2: Approving USDC…',
    subscribing: 'Step 2/2: Creating stream…',
    done: 'Subscribed!',
  }[step];

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          background: '#0F2236', border: '1px solid rgba(76,175,125,0.4)',
          borderRadius: 16, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center',
          boxShadow: '0 0 32px rgba(76,175,125,0.08)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, color: '#4CAF7D' }}>✓</div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>Subscribed!</h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#7A9FC4', margin: '0 0 16px', lineHeight: 1.6 }}>
            Your stream is live. You're being charged <span style={{ color: '#fff' }}>${ratePerSec.toFixed(6)} USDC/s</span> and can cancel anytime.
          </p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#4A6F8C' }}>Stream ID: 42</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        background: '#0F2236', border: '1px solid rgba(172,198,233,0.12)',
        borderRadius: 16, padding: '32px 28px', maxWidth: 400, width: '100%',
        boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#4A6F8C', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Subscription Plan #2</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>${monthlyPrice}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: '#7A9FC4' }}>/mo</span>
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', margin: '0 0 20px' }}>
          Billed per-second · ${ratePerSec.toFixed(6)} USDC/s · Cancel anytime
        </p>

        <div style={{ borderTop: '1px solid rgba(172,198,233,0.1)', margin: '0 0 20px' }} />

        {/* Billing details */}
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500, color: '#fff', margin: '0 0 10px' }}>Billing details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[['Daily', `$${(monthlyPrice/30).toFixed(2)}`], ['Monthly', `$${monthlyPrice}`]].map(([l, v]) => (
            <div key={l} style={{ background: '#162F4A', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', margin: 0 }}>{l}</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 500, color: '#fff', margin: '3px 0 0' }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Deposit selector */}
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500, color: '#fff', margin: '0 0 8px' }}>
          Initial deposit <span style={{ fontWeight: 400, color: '#7A9FC4' }}>(months upfront)</span>
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[1, 3, 6].map(m => (
            <button key={m} onClick={() => setMonths(m)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500,
              background: months === m ? '#3898EC' : '#162F4A',
              color: months === m ? '#fff' : '#ACC6E9',
              transition: 'all 0.15s',
            }}>{m}mo</button>
          ))}
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', margin: '0 0 20px' }}>
          Deposit: <span style={{ color: '#fff', fontWeight: 500 }}>${deposit} USDC</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: hasBalance ? '#4CAF7D' : '#E05555' }}>
            (balance: ${balance.toFixed(2)})
          </span>
        </p>

        {/* CTA */}
        <button onClick={handleSubscribe} disabled={step !== 'idle'} style={{
          width: '100%', background: '#3898EC', border: 'none', borderRadius: 12,
          padding: '13px 0', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 500,
          color: '#fff', cursor: step === 'idle' ? 'pointer' : 'default',
          opacity: step !== 'idle' ? 0.7 : 1, transition: 'all 0.15s',
          marginBottom: 16,
        }}>{btnLabel}</button>

        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#4A6F8C', textAlign: 'center', margin: 0 }}>
          Powered by TrustFlow · funds stream per-second onchain
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { SubscribePage });
