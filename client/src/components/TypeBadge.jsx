const STYLES = {
  wet: 'bg-blue-100 text-blue-700 border-blue-200',
  dry: 'bg-amber-100 text-amber-700 border-amber-200',
  raw: 'bg-rose-100 text-rose-700 border-rose-200',
  treat: 'bg-purple-100 text-purple-700 border-purple-200',
  milk: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
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
      className={`inline-flex items-center gap-1 ${sizeCls} rounded-full border font-medium capitalize ${cls} ${onClick ? 'cursor-pointer active:opacity-70' : ''}`}
    >
      <span>{ICONS[t]}</span>
      <span>{t}</span>
    </Component>
  );
}
