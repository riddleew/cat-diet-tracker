import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Cats', icon: '🐱', match: (p) => p === '/' || p.startsWith('/cats') },
  { to: '/products', label: 'Foods', icon: '🍽️', match: (p) => p.startsWith('/products') },
  { to: '/stats', label: 'Stats', icon: '📊', match: (p) => p.startsWith('/stats') },
];

// Routes where we hide the bar so forms feel like modal flows.
const HIDDEN_ON = [
  /^\/cats\/new$/,
  /^\/cats\/\d+\/edit$/,
  /^\/products\/new$/,
  /^\/products\/\d+\/edit$/,
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  if (HIDDEN_ON.some(re => re.test(pathname))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-cocoa/30 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto flex">
        {TABS.map(tab => {
          const active = tab.match(pathname);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[60px] transition-colors ${
                active ? 'text-tabby' : 'text-cocoa hover:text-espresso-soft'
              }`}
            >
              <span className="text-2xl leading-none">{tab.icon}</span>
              <span className={`text-xs ${active ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
