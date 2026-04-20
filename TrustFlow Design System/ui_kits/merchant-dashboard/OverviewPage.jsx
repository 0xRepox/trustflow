// TrustFlow — OverviewPage

function OverviewPage({ setPage }) {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#C9893A', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>{'{MERCHANT DASHBOARD}'}</p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Overview</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Earned (USDC)" value="$1,204.50" sub="Lifetime claimed" />
        <StatCard label="Active Streams" value="12" sub="Currently streaming" />
        <StatCard label="Open Disputes" value="2" sub="Requires attention" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <NavCard label="Manage Plans" sub="3 plans created" onClick={() => setPage('plans')} />
        <NavCard label="View Streams" sub="12 total streams" onClick={() => setPage('streams')} />
        <NavCard label="Dispute Inbox" sub="2 open disputes" onClick={() => setPage('disputes')} />
      </div>
    </div>
  );
}

Object.assign(window, { OverviewPage });
