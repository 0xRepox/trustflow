// TrustFlow — PlansPage

const PLANS_DATA = [
  { id: '1', rate: '$9.99/mo', active: true },
  { id: '2', rate: '$29.99/mo', active: true },
  { id: '3', rate: '$99.00/mo', active: false },
];

function RatePreview({ monthly }) {
  if (!monthly) return null;
  const daily = (monthly / 30).toFixed(2);
  const weekly = (monthly / 4.33).toFixed(2);
  return (
    <div style={{ background: 'rgba(22,47,74,0.6)', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#4A6F8C', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Billing breakdown</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {[['Daily', `$${daily}`], ['Weekly', `$${weekly}`], ['Monthly', `$${monthly.toFixed(2)}`]].map(([l, v]) => (
          <div key={l} style={{ background: '#162F4A', borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#7A9FC4', margin: 0 }}>{l}</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500, color: '#fff', margin: '2px 0 0' }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlansPage() {
  const [monthly, setMonthly] = React.useState('');
  const [grace, setGrace] = React.useState('0');
  const [policy, setPolicy] = React.useState('0');
  const [plans, setPlans] = React.useState(PLANS_DATA);
  const [created, setCreated] = React.useState(false);

  const monthlyNum = parseFloat(monthly) || 0;

  function handleCreate() {
    if (!monthlyNum) return;
    const newPlan = { id: String(plans.length + 1), rate: `$${monthlyNum.toFixed(2)}/mo`, active: true };
    setPlans([...plans, newPlan]);
    setMonthly('');
    setCreated(true);
    setTimeout(() => setCreated(false), 2000);
  }

  function handleDeactivate(id) {
    setPlans(plans.map(p => p.id === id ? { ...p, active: false } : p));
  }

  const inputStyle = {
    width: '100%', background: '#162F4A', border: '1px solid rgba(172,198,233,0.2)',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', display: 'block', marginBottom: 5 };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 28px', letterSpacing: '-0.02em' }}>Plans</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Create form */}
        <div style={{ background: '#0F2236', border: '1px solid rgba(172,198,233,0.12)', borderRadius: 12, padding: 22 }}>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 500, color: '#fff', margin: '0 0 16px' }}>Create plan</p>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Monthly price (USDC)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7A9FC4', fontSize: 13 }}>$</span>
              <input style={{ ...inputStyle, paddingLeft: 22 }} type="number" placeholder="e.g. 29.99" value={monthly} onChange={e => setMonthly(e.target.value)} />
            </div>
          </div>

          <RatePreview monthly={monthlyNum} />

          <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Grace period (days)</label>
              <input style={inputStyle} type="number" placeholder="0" value={grace} onChange={e => setGrace(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dispute policy</label>
              <select style={inputStyle} value={policy} onChange={e => setPolicy(e.target.value)}>
                <option value="0">None</option>
                <option value="1">Arbitration</option>
              </select>
            </div>
          </div>

          <button onClick={handleCreate} disabled={!monthlyNum} style={{
            width: '100%', background: monthlyNum ? '#3898EC' : '#1A3A5C',
            border: 'none', borderRadius: 8, padding: '9px 0',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500,
            color: monthlyNum ? '#fff' : '#4A6F8C', cursor: monthlyNum ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}>Create plan</button>
          {created && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#4CAF7D', marginTop: 8, textAlign: 'center' }}>Plan created!</p>}
        </div>

        {/* Plan list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{
              background: '#0F2236', border: '1px solid rgba(172,198,233,0.12)',
              borderRadius: 12, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: plan.active ? 10 : 0 }}>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500, color: '#fff', margin: 0 }}>Plan #{plan.id}</p>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', margin: '2px 0 0' }}>
                    {plan.rate} · <span style={{ color: plan.active ? '#4CAF7D' : '#4A6F8C' }}>{plan.active ? 'Active' : 'Inactive'}</span>
                  </p>
                </div>
                {plan.active && (
                  <button onClick={() => handleDeactivate(plan.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#E05555',
                  }}>Deactivate</button>
                )}
              </div>
              {plan.active && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#162F4A', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#4A6F8C', flex: 1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    https://app.trustflow.xyz/subscribe/{plan.id}
                  </p>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3898EC', flexShrink: 0 }}>Copy link</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlansPage });
