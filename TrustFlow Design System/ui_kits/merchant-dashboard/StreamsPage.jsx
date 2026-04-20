// TrustFlow — StreamsPage

const STREAMS_DATA = [
  { id: '1', payer: '0x1a2b3c4d', status: 'Active',    deposited: 29.99, claimed: 12.50, consumed: 15.20 },
  { id: '2', payer: '0xdeadbeef', status: 'Active',    deposited: 89.97, claimed: 40.00, consumed: 45.00 },
  { id: '3', payer: '0xabcdef12', status: 'Paused',    deposited: 29.99, claimed: 8.00,  consumed: 8.00 },
  { id: '4', payer: '0x99887766', status: 'Cancelled', deposited: 9.99,  claimed: 9.99,  consumed: 9.99 },
  { id: '5', payer: '0x55443322', status: 'Active',    deposited: 99.00, claimed: 30.00, consumed: 38.00 },
];

function StatusBadge({ status }) {
  const styles = {
    Active:    { bg: 'rgba(76,175,125,0.15)',   color: '#4CAF7D' },
    Paused:    { bg: 'rgba(201,137,58,0.15)',    color: '#C9893A' },
    Cancelled: { bg: 'rgba(74,111,140,0.15)',    color: '#7A9FC4' },
  };
  const s = styles[status] || styles.Cancelled;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 9999, padding: '3px 10px',
      fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, fontWeight: 500,
    }}>{status}</span>
  );
}

function StreamsPage() {
  const [claimed, setClaimed] = React.useState({});

  const thStyle = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', fontWeight: 500, padding: '0 12px 12px 0', textAlign: 'left', borderBottom: '1px solid rgba(172,198,233,0.1)' };
  const tdStyle = { fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ACC6E9', padding: '12px 12px 12px 0', borderBottom: '1px solid rgba(172,198,233,0.06)' };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 28px', letterSpacing: '-0.02em' }}>Streams</h1>
      <div style={{ background: '#0F2236', border: '1px solid rgba(172,198,233,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', padding: '0 22px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Stream ID', 'Payer', 'Status', 'Deposited', 'Claimed', 'Claimable', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STREAMS_DATA.map(s => {
                const claimable = (s.consumed - s.claimed).toFixed(2);
                const isClaimed = claimed[s.id];
                return (
                  <tr key={s.id}>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono, monospace', color: '#ACC6E9' }}>#{s.id}</td>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono, monospace', color: '#7A9FC4' }}>{s.payer}…</td>
                    <td style={tdStyle}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle}>{s.deposited.toFixed(2)}</td>
                    <td style={tdStyle}>{s.claimed.toFixed(2)}</td>
                    <td style={{ ...tdStyle, color: '#4CAF7D' }}>{claimable}</td>
                    <td style={tdStyle}>
                      {parseFloat(claimable) > 0 && s.status !== 'Cancelled' && !isClaimed && (
                        <button onClick={() => setClaimed(c => ({ ...c, [s.id]: true }))} style={{
                          background: '#3898EC', border: 'none', borderRadius: 6, padding: '5px 12px',
                          fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, fontWeight: 500,
                          color: '#fff', cursor: 'pointer',
                        }}>Claim</button>
                      )}
                      {isClaimed && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#4CAF7D' }}>Claimed ✓</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StatusBadge, StreamsPage });
