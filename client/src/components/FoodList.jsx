import { useState } from 'react';
import { updateFood, deleteFood } from '../api';
import FoodStatusBadge, { CYCLE } from './FoodStatusBadge';
import TypeBadge from './TypeBadge';
import { fallbackImg } from './fallbackImg';

const TYPE_OPTS = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

export default function FoodList({ catId, foods, setFoods }) {
  const [deleting, setDeleting] = useState(null);
  const [editingType, setEditingType] = useState(null);

  async function cycleStatus(food) {
    const next = CYCLE[food.status];
    const updated = await updateFood(catId, food.id, { ...food, status: next });
    setFoods(prev => prev.map(f => f.id === food.id ? updated : f));
  }

  async function changeType(food, type) {
    const updated = await updateFood(catId, food.id, { ...food, type });
    setFoods(prev => prev.map(f => f.id === food.id ? updated : f));
    setEditingType(null);
  }

  async function remove(food) {
    setDeleting(food.id);
    try {
      await deleteFood(catId, food.id);
      setFoods(prev => prev.filter(f => f.id !== food.id));
    } finally {
      setDeleting(null);
    }
  }

  if (!foods.length) {
    return <p className="text-gray-400 text-center py-8 text-sm">No food preferences recorded yet. Search above to add one.</p>;
  }

  const groups = [
    { label: 'Liked', key: 'liked', foods: foods.filter(f => f.status === 'liked') },
    { label: 'Neutral', key: 'neutral', foods: foods.filter(f => f.status === 'neutral') },
    { label: 'Disliked', key: 'disliked', foods: foods.filter(f => f.status === 'disliked') },
  ];

  return (
    <div className="space-y-4">
      {groups.map(g => g.foods.length > 0 && (
        <div key={g.key}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{g.label}</h3>
          <ul className="space-y-2">
            {g.foods.map(food => (
              <li key={food.id} className="flex items-start gap-3 bg-white rounded-xl px-3 py-3 shadow-sm border border-gray-100">
                <img
                  src={food.image_url || fallbackImg(food.brand)}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                  onError={e => { e.target.src = fallbackImg(food.brand); }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm leading-tight">
                        {food.product_url ? (
                          <a href={food.product_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {food.product || food.brand}
                          </a>
                        ) : (
                          food.product || food.brand
                        )}
                      </p>
                      {food.product && food.brand && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{food.brand}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {editingType === food.id ? (
                      <select
                        autoFocus
                        value={food.type || 'other'}
                        onChange={e => changeType(food, e.target.value)}
                        onBlur={() => setEditingType(null)}
                        className="text-xs border border-gray-300 rounded-md px-1 py-0.5 bg-white capitalize"
                      >
                        {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <TypeBadge type={food.type || 'other'} small onClick={() => setEditingType(food.id)} />
                    )}
                    <FoodStatusBadge status={food.status} onClick={() => cycleStatus(food)} />
                  </div>
                </div>
                <button
                  onClick={() => remove(food)}
                  disabled={deleting === food.id}
                  aria-label="Delete"
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
