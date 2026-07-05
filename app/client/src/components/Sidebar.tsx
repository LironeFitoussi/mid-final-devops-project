const NAV = [
  { icon: '📊', label: 'Dashboard', active: true },
  { icon: '🖼️', label: 'Content' },
  { icon: '🏷️', label: 'Categories' },
  { icon: '📁', label: 'Media Library' },
  { icon: '👥', label: 'Authors' },
  { icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ version }: { version: string }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">🗿</span>
        <div>
          <div className="brand-name">MemeForge</div>
          <div className="brand-sub">Content Studio</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((item) => (
          <a key={item.label} className={`nav-item${item.active ? ' active' : ''}`} href="#">
            <span>{item.icon}</span> {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="env-pill">
          <span className="dot" /> <span>{version}</span>
        </div>
      </div>
    </aside>
  );
}
