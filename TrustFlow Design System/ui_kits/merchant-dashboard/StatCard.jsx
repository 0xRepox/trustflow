// TrustFlow — StatCard + NavCard components

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#0F2236', border: '1px solid rgba(172,198,233,0.12)',
      borderRadius: 12, padding: '20px 22px',
    }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', margin: 0 }}>{label}</p>
      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 600, color: '#fff', margin: '6px 0 0', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#4A6F8C', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function NavCard({ label, sub, onClick, active }) {
  return (
    <div onClick={onClick} style={{
      background: '#0F2236',
      border: `1px solid ${active ? 'rgba(56,152,236,0.4)' : 'rgba(172,198,233,0.12)'}`,
      borderRadius: 12, padding: '20px 22px', cursor: 'pointer',
      transition: 'border-color 0.15s',
      boxShadow: active ? '0 0 20px rgba(56,152,236,0.08)' : 'none',
    }}>
      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 500, color: '#fff', margin: 0 }}>{label}</p>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7A9FC4', marginTop: 4 }}>{sub}</p>
    </div>
  );
}

Object.assign(window, { StatCard, NavCard });
