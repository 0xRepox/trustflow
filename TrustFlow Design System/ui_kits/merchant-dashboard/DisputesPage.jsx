// TrustFlow — DisputesPage

const DISPUTES_DATA = [
  { id: '1', streamId: '3', subscriber: '0xabcdef12', frozen: 8.00, status: 'Open' },
  { id: '2', streamId: '1', subscriber: '0x1a2b3c4d', frozen: 4.50, status: 'Open' },
  { id: '3', streamId: '2', subscriber: '0xdeadbeef', frozen: 15.00, status: 'Responded' },
  { id: '4', streamId: '4', subscriber: '0x99887766', frozen: 9.99, status: 'Settled', verdict: 'Merchant' },
];

function DisputeCard({ dispute, onRespond, onSettle }) {
  const [evidence, setEvidence] = React.useState('');

  const borderColor = {
    Open: 'rgba(201,137,58,0.3)',
    Responded: 'rgba(56,152,236,0.2)',
    Settled: 'rgba(172,198,233,0.08)',
  }[dispute.status];

  const badgeStyle = {
    Open:      { bg: 'rgba(201,137,58,0.18)', color: '#C9893A' },
    Responded: { bg: 'rgba(56,152,236,0.15)', color: '#3898EC' },
    Settled:   { bg: 'rgba(74,111,140,0.15)', color: '#7A9FC4' },
  }[dispute.status];

  return (
    <div style={{
      background: '#0F2236', border: `1px solid ${borderColor}`,
      borderRadius: 12, padding: '16px 18px',
      opacity: dispute.status === 'Settled' ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ACC6E9', margin: 0 }}>
          Dispute #{dispute.id} · Stream #{dispute.streamId}
        </p>
        <span style={{
          background: badgeStyle.bg, color: badgeStyle.color,
          borderRadius: 9999, padding: '3px 10px',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, fontWeight: 500,
        }}>
          {dispute.status === 'Responded' ? 'Awaiting Arbitration' : dispute.status}
        </span>
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', margin: '0 0 12px' }}>
        Subscriber: {dispute.subscriber}… · Frozen: {dispute.frozen.toFixed(2)} USDC
      </p>
      {dispute.status === 'Open' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Evidence (hashed onchain)"
            value={evidence}
            onChange={e => setEvidence(e.target.value)}
            style={{
              flex: 1, background: '#162F4A', border: '1px solid rgba(172,198,233,0.18)',
              borderRadius: 8, padding: '7px 10px',
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#fff', outline: 'none',
            }}
          />
          <button onClick={() => evidence && onRespond(dispute.id)} style={{
            background: '#3898EC', border: 'none', borderRadius: 8, padding: '7px 14px',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 500,
            color: '#fff', cursor: 'pointer', flexShrink: 0,
          }}>Respond</button>
          <button onClick={() => onSettle(dispute.id)} style={{
            background: '#162F4A', border: '1px solid rgba(172,198,233,0.18)',
            borderRadius: 8, padding: '7px 14px',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 500,
            color: '#ACC6E9', cursor: 'pointer', flexShrink: 0,
          }}>Default Settle</button>
        </div>
      )}
      {dispute.status === 'Settled' && dispute.verdict && (
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#4A6F8C', margin: 0 }}>
          Verdict: {dispute.verdict}
        </p>
      )}
    </div>
  );
}

function DisputesPage() {
  const [disputes, setDisputes] = React.useState(DISPUTES_DATA);

  function respond(id) {
    setDisputes(d => d.map(x => x.id === id ? { ...x, status: 'Responded' } : x));
  }
  function settle(id) {
    setDisputes(d => d.map(x => x.id === id ? { ...x, status: 'Settled', verdict: 'Subscriber' } : x));
  }

  const open = disputes.filter(d => d.status === 'Open');
  const responded = disputes.filter(d => d.status === 'Responded');
  const settled = disputes.filter(d => d.status === 'Settled');

  const sectionLabel = (text, color) => (
    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 500, color, margin: '0 0 10px' }}>{text}</p>
  );

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 28px', letterSpacing: '-0.02em' }}>Disputes</h1>
      {open.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {sectionLabel(`Open (${open.length})`, '#C9893A')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {open.map(d => <DisputeCard key={d.id} dispute={d} onRespond={respond} onSettle={settle} />)}
          </div>
        </div>
      )}
      {responded.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {sectionLabel(`Responded (${responded.length})`, '#3898EC')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {responded.map(d => <DisputeCard key={d.id} dispute={d} onRespond={respond} onSettle={settle} />)}
          </div>
        </div>
      )}
      {settled.length > 0 && (
        <div>
          {sectionLabel(`Settled (${settled.length})`, '#7A9FC4')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {settled.map(d => <DisputeCard key={d.id} dispute={d} onRespond={respond} onSettle={settle} />)}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DisputeCard, DisputesPage });
