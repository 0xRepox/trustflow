// TrustFlow — Nav component
// Shared by all dashboard screens

function Nav({ page, setPage }) {
  const links = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Plans' },
    { id: 'streams', label: 'Streams' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'docs', label: 'Docs' },
  ];
  return (
    <nav style={{
      borderBottom: '1px solid rgba(172,198,233,0.12)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="../../assets/icon.svg" style={{ height: 22, width: 22 }} />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>TrustFlow</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 400,
              color: page === l.id ? '#fff' : '#7A9FC4',
              padding: '6px 12px', borderRadius: 6,
              background: page === l.id ? 'rgba(172,198,233,0.08)' : 'transparent',
              transition: 'color 0.15s',
            }}>{l.label}</button>
          ))}
        </div>
      </div>
      <button style={{
        background: '#162F4A', border: '1px solid rgba(172,198,233,0.2)',
        borderRadius: 8, padding: '6px 14px',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 500,
        color: '#ACC6E9', cursor: 'pointer',
      }}>0x1a2b…ef12</button>
    </nav>
  );
}

Object.assign(window, { Nav });
