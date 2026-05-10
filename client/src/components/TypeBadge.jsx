const STYLES = {
  wet: 'bg-saffron-soft/50 text-espresso border-saffron/40',
  dry: 'bg-tabby-soft/40 text-tabby border-tabby/40',
  raw: 'bg-terracotta-soft/50 text-terracotta border-terracotta/40',
  treat: 'bg-sage-soft/50 text-sage border-sage/40',
  milk: 'bg-cream border-cocoa/40 text-espresso-soft',
  other: 'bg-cocoa-soft/40 text-espresso-soft border-cocoa/40',
};

const ICONS = {
  wet: '🥫',
  dry: '🥣',
  raw: '🥩',
  treat: '🍪',
  milk: '🥛',
  other: '🍽️',
};

export default function TypeBadge({ type, small, onClick }) {
  const t = type || 'other';
  const cls = STYLES[t] || STYLES.other;
  const sizeCls = small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const Component = onClick ? 'button' : 'span';
  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-1 ${sizeCls} rounded-full border font-bold capitalize ${cls} ${onClick ? 'cursor-pointer active:opacity-70' : ''}`}
    >
      <span>{ICONS[t]}</span>
      <span>{t}</span>
    </Component>
  );
}
