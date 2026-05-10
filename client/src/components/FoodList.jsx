import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateFood, deleteFood } from '../api';
import FoodStatusBadge, { CYCLE } from './FoodStatusBadge';
import TypeBadge from './TypeBadge';
import { fallbackImg } from './fallbackImg';

const TYPE_OPTS = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

const GROUP_META = {
  awaiting: { label: '⏳ Awaiting Verdict', tone: 'text-saffron' },
  loved: { label: '😻 Loved', tone: 'text-sage' },
  liked: { label: '🐱 Liked', tone: 'text-cocoa' },
  disliked: { label: '😿 Disliked', tone: 'text-terracotta' },
};

export default function FoodList({ catId, foods, setFoods }) {
  const [deleting, setDeleting] = useState(null);
  const [editingType, setEditingType] = useState(null);

  async function cycleStatus(food) {
    const next = CYCLE[food.status];
    if (!next) return;
    const updated = await updateFood(catId, food.id, { ...food, status: next });
    setFoods(prev => prev.map(f => f.id === food.id ? updated : f));
  }

  async function resolveAwaiting(food, status) {
    const updated = await updateFood(catId, food.id, { ...food, status });
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
    return (
      <p className="text-cocoa text-center py-8 text-sm italic">
        No foods tagged yet — what'd you feed them?
      </p>
    );
  }

  const groups = ['awaiting', 'loved', 'liked', 'disliked']
    .map(key => ({ key, foods: foods.filter(f => f.status === key) }))
    .filter(g => g.foods.length > 0);

  return (
    <div className="space-y-5">
      {groups.map(g => (
        <div key={g.key}>
          <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-2.5 ${GROUP_META[g.key].tone}`}>
            {GROUP_META[g.key].label}
          </h3>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {g.foods.map(food => (
                <motion.li
                  key={food.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex items-start gap-3 bg-card rounded-2xl px-3 py-3 shadow-sm border border-cocoa/20"
                >
                  <img
                    src={food.image_url || fallbackImg(food.brand)}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover bg-cocoa-soft shrink-0"
                    onError={e => { e.target.src = fallbackImg(food.brand); }}
                  />
                  <div className="flex-1 min-w-0">
                    {food.brand && (
                      <p className="text-xs font-extrabold text-tabby uppercase tracking-wide truncate">{food.brand}</p>
                    )}
                    <p className="text-sm font-bold text-espresso leading-snug">
                      {food.product_url ? (
                        <a href={food.product_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {food.product || food.brand}
                        </a>
                      ) : (
                        food.product || food.brand
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {editingType === food.id ? (
                        <select
                          autoFocus
                          value={food.type || 'other'}
                          onChange={e => changeType(food, e.target.value)}
                          onBlur={() => setEditingType(null)}
                          className="text-xs border border-cocoa/40 rounded-md px-1 py-0.5 bg-cream-soft capitalize font-semibold"
                        >
                          {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <TypeBadge type={food.type || 'other'} small onClick={() => setEditingType(food.id)} />
                      )}
                      <FoodStatusBadge status={food.status} onClick={() => cycleStatus(food)} />
                      {food.status === 'awaiting' && (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            onClick={() => resolveAwaiting(food, 'loved')}
                            aria-label="Mark as loved"
                            title="Loved"
                            className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-sage/40 bg-sage-soft/40 hover:bg-sage-soft/70 text-3xl leading-none"
                          >
                            😻
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            onClick={() => resolveAwaiting(food, 'liked')}
                            aria-label="Mark as liked"
                            title="Liked"
                            className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-cocoa/40 bg-cocoa-soft/40 hover:bg-cocoa-soft/70 text-3xl leading-none"
                          >
                            🐱
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            onClick={() => resolveAwaiting(food, 'disliked')}
                            aria-label="Mark as disliked"
                            title="Disliked"
                            className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-terracotta/40 bg-terracotta-soft/40 hover:bg-terracotta-soft/70 text-3xl leading-none"
                          >
                            😿
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(food)}
                    disabled={deleting === food.id}
                    aria-label="Delete"
                    className="text-cocoa hover:text-terracotta transition-colors text-lg leading-none disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                  >
                    ×
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ))}
    </div>
  );
}
