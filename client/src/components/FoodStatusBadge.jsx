// Read-only current-verdict badge. Status changes now happen by logging a
// check-in (see FoodList) — the event log is the single source of truth, so
// the old tap-to-cycle behavior was removed to avoid desyncing it.
const STYLES = {
  loved: 'bg-sage-soft/60 text-sage border-sage/40',
  liked: 'bg-cocoa-soft/60 text-espresso-soft border-cocoa/40',
  disliked: 'bg-terracotta-soft/60 text-terracotta border-terracotta/40',
  bored: 'bg-dusk-soft/60 text-dusk border-dusk/40',
  awaiting: 'bg-saffron-soft/60 text-saffron border-saffron/40',
};

const LABELS = {
  loved: '😻 Loved',
  liked: '🐱 Liked',
  disliked: '😿 Disliked',
  bored: '🥱 Bored',
  awaiting: '⏳ Awaiting Verdict',
};

export default function FoodStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-bold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

export { LABELS };
