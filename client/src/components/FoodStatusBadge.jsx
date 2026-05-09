const STYLES = {
  liked: 'bg-green-100 text-green-800 border-green-300',
  disliked: 'bg-red-100 text-red-800 border-red-300',
  neutral: 'bg-gray-100 text-gray-700 border-gray-300',
};

const LABELS = { liked: '👍 Liked', disliked: '👎 Disliked', neutral: '😐 Neutral' };
const CYCLE = { liked: 'neutral', neutral: 'disliked', disliked: 'liked' };

export default function FoodStatusBadge({ status, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Tap to change status"
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-medium transition-opacity active:opacity-70 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </button>
  );
}

export { CYCLE };
