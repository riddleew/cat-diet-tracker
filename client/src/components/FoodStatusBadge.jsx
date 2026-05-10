const STYLES = {
  loved: 'bg-sage-soft/60 text-sage border-sage/40',
  liked: 'bg-cocoa-soft/60 text-espresso-soft border-cocoa/40',
  disliked: 'bg-terracotta-soft/60 text-terracotta border-terracotta/40',
  awaiting: 'bg-saffron-soft/60 text-saffron border-saffron/40',
};

const LABELS = {
  loved: '😻 Loved',
  liked: '🐱 Liked',
  disliked: '😿 Disliked',
  awaiting: '⏳ Awaiting Verdict',
};
const CYCLE = { loved: 'liked', liked: 'disliked', disliked: 'loved' };

export default function FoodStatusBadge({ status, onClick }) {
  const clickable = status in CYCLE;
  return (
    <button
      onClick={onClick}
      title={clickable ? 'Tap to change status' : 'Awaiting verdict'}
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-bold transition-opacity active:opacity-70 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </button>
  );
}

export { CYCLE };
