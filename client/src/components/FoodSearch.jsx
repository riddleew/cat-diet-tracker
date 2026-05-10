import { useState, useEffect, useRef } from 'react';
import { searchFoods, createFood } from '../api';
import TypeBadge from './TypeBadge';
import { fallbackImg } from './fallbackImg';

const STATUS_OPTS = [
  { value: 'liked', label: '👍 Liked', cls: 'bg-green-500 hover:bg-green-600' },
  { value: 'neutral', label: '😐 Neutral', cls: 'bg-gray-400 hover:bg-gray-500' },
  { value: 'disliked', label: '👎 Disliked', cls: 'bg-red-500 hover:bg-red-600' },
];

const TYPE_OPTS = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

export default function FoodSearch({ catId, onAdded }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [manualType, setManualType] = useState('other');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    if (selected) return; // pause autocomplete after selection
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchFoods(query);
        setSuggestions(results);
      } catch (e) { /* ignore */ }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query, selected]);

  function pick(item) {
    setSelected(item);
    setQuery(item.product || item.brand);
    setManualType(item.type || 'other');
    setSuggestions([]);
  }

  function clearSelection() {
    setSelected(null);
    setQuery('');
    setManualType('other');
  }

  async function save(status) {
    setSaving(true);
    try {
      const payload = selected
        ? {
            brand: selected.brand,
            product: selected.product,
            type: manualType,
            image_url: selected.image_url || null,
            product_url: selected.product_url || null,
            status,
          }
        : {
            brand: query.trim(),
            product: null,
            type: manualType,
            image_url: null,
            product_url: null,
            status,
          };
      const food = await createFood(catId, payload);
      onAdded(food);
      clearSelection();
    } finally {
      setSaving(false);
    }
  }

  const showSaveUI = selected || (query.trim() && !suggestions.length);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null); }}
          placeholder="Search a brand or product…"
          className="w-full px-4 py-3 pr-10 text-base border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {query && (
          <button
            onClick={clearSelection}
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {suggestions.map((s, i) => (
            <button
              key={`${s.brand}|${s.product}|${i}`}
              onMouseDown={() => pick(s)}
              className="flex flex-col text-left rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all bg-white"
            >
              <img
                src={s.image_url || fallbackImg(s.brand)}
                alt=""
                className="w-full aspect-square object-cover bg-gray-100"
                onError={e => { e.target.src = fallbackImg(s.brand); }}
              />
              <div className="p-2 w-full">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {s.product || s.brand}
                </p>
                {s.product && s.brand && (
                  <p className="text-xs text-gray-400 truncate">{s.brand}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSaveUI && (
        <div className="mt-3 space-y-2">
          {selected && (
            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
              <img
                src={selected.image_url || fallbackImg(selected.brand)}
                alt=""
                className="w-12 h-12 rounded-lg object-cover bg-white shrink-0"
                onError={e => { e.target.src = fallbackImg(selected.brand); }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {selected.product || selected.brand}
                </p>
                {selected.product && <p className="text-xs text-gray-500 truncate">{selected.brand}</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">Type:</label>
            <select
              value={manualType}
              onChange={e => setManualType(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white capitalize"
            >
              {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            {STATUS_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => save(opt.value)}
                disabled={saving}
                className={`flex-1 py-3 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 ${opt.cls}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
