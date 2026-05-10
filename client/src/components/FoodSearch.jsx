import { useState, useEffect, useRef } from 'react';
import { searchFoods, createFood } from '../api';
import { fallbackImg } from './fallbackImg';

const STATUS_OPTS = [
  { value: 'loved', emoji: '😻', text: 'Loved', cls: 'bg-sage hover:bg-sage/90' },
  { value: 'liked', emoji: '🐱', text: 'Liked', cls: 'bg-cocoa hover:bg-cocoa/90' },
  { value: 'disliked', emoji: '😿', text: 'Disliked', cls: 'bg-terracotta hover:bg-terracotta/90' },
  { value: 'awaiting', emoji: '⏳', text: 'Awaiting Verdict', cls: 'bg-saffron hover:bg-saffron/90' },
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
    if (selected) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchFoods(query);
        setSuggestions(results);
      } catch { /* ignore */ }
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
          className="w-full px-4 py-3 pr-10 text-base border border-cocoa/40 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent bg-cream-soft"
        />
        {query && (
          <button
            onClick={clearSelection}
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-cocoa hover:text-espresso text-lg"
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
              className="flex flex-col text-left rounded-2xl overflow-hidden border border-cocoa/30 hover:border-tabby hover:shadow-md transition-all bg-card"
            >
              <img
                src={s.image_url || fallbackImg(s.brand)}
                alt=""
                className="w-full aspect-square object-cover bg-cocoa-soft"
                onError={e => { e.target.src = fallbackImg(s.brand); }}
              />
              <div className="p-2 w-full">
                <p className="text-sm font-bold text-espresso truncate">
                  {s.product || s.brand}
                </p>
                {s.product && s.brand && (
                  <p className="text-xs text-tabby font-bold uppercase tracking-wide truncate">{s.brand}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSaveUI && (
        <div className="mt-3 space-y-2.5">
          {selected && (
            <div className="flex items-center gap-3 bg-tabby/10 rounded-2xl p-3 border border-tabby/30">
              <img
                src={selected.image_url || fallbackImg(selected.brand)}
                alt=""
                className="w-14 h-14 rounded-xl object-cover bg-card shrink-0"
                onError={e => { e.target.src = fallbackImg(selected.brand); }}
              />
              <div className="flex-1 min-w-0">
                {selected.brand && (
                  <p className="text-xs font-extrabold text-tabby uppercase tracking-wide truncate">{selected.brand}</p>
                )}
                <p className="text-sm font-bold text-espresso truncate">
                  {selected.product || selected.brand}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-cocoa font-bold shrink-0">Type:</label>
            <select
              value={manualType}
              onChange={e => setManualType(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-cocoa/40 rounded-lg bg-cream-soft capitalize font-semibold"
            >
              {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => save(opt.value)}
                disabled={saving}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 shadow-sm active:scale-95 ${opt.cls}`}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
