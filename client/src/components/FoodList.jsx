import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateFood, deleteFood, logFoodEvent, getFoodEvents, deleteFoodEvent } from '../api';
import FoodStatusBadge from './FoodStatusBadge';
import TypeBadge from './TypeBadge';
import { fallbackImg } from './fallbackImg';

const TYPE_OPTS = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

const GROUP_META = {
  awaiting: { label: '⏳ Awaiting Verdict', tone: 'text-saffron' },
  loved: { label: '😻 Loved', tone: 'text-sage' },
  liked: { label: '🐱 Liked', tone: 'text-cocoa' },
  bored: { label: '🥱 Bored', tone: 'text-dusk' },
  disliked: { label: '😿 Disliked', tone: 'text-terracotta' },
};

// Quick check-in buttons — one tap logs a dated reaction.
const REACTIONS = [
  { value: 'loved', emoji: '😻', ring: 'border-sage/40 bg-sage-soft/40 hover:bg-sage-soft/70' },
  { value: 'liked', emoji: '🐱', ring: 'border-cocoa/40 bg-cocoa-soft/40 hover:bg-cocoa-soft/70' },
  { value: 'disliked', emoji: '😿', ring: 'border-terracotta/40 bg-terracotta-soft/40 hover:bg-terracotta-soft/70' },
  { value: 'bored', emoji: '🥱', ring: 'border-dusk/40 bg-dusk-soft/40 hover:bg-dusk-soft/70' },
];

const ENDED = {
  'loved-ongoing': { emoji: '😻', text: 'ongoing', cls: 'text-sage' },
  bored: { emoji: '🥱', text: 'then bored', cls: 'text-dusk' },
  disliked: { emoji: '😿', text: 'then disliked', cls: 'text-terracotta' },
  liked: { emoji: '🐱', text: 'then liked', cls: 'text-cocoa' },
};
const REACTION_EMOJI = { loved: '😻', liked: '🐱', disliked: '😿', bored: '🥱' };

function todayIso() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtDays(n) {
  if (n <= 0) return 'today';
  if (n === 1) return '1 day';
  return `${n} days`;
}

export default function FoodList({ catId, foods, setFoods }) {
  const [deleting, setDeleting] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [busy, setBusy] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set());
  const [eventsByFood, setEventsByFood] = useState({});
  const [checkInDate, setCheckInDate] = useState({});

  const applyFood = (updated) =>
    setFoods(prev => prev.map(f => (f.id === updated.id ? updated : f)));

  function setFoodBusy(id, on) {
    setBusy(prev => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function logReaction(food, reaction) {
    setFoodBusy(food.id, true);
    try {
      const occurred_on = checkInDate[food.id] || todayIso();
      const updated = await logFoodEvent(catId, food.id, { reaction, occurred_on });
      applyFood(updated);
      // Refresh the open history panel so it reflects the new check-in.
      if (expanded.has(food.id)) {
        const refreshed = await getFoodEvents(catId, food.id);
        setEventsByFood(prev => ({ ...prev, [food.id]: refreshed }));
      }
    } finally {
      setFoodBusy(food.id, false);
    }
  }

  async function toggleHistory(food) {
    const open = expanded.has(food.id);
    setExpanded(prev => {
      const next = new Set(prev);
      if (open) next.delete(food.id); else next.add(food.id);
      return next;
    });
    if (!open && !eventsByFood[food.id]) {
      const events = await getFoodEvents(catId, food.id);
      setEventsByFood(prev => ({ ...prev, [food.id]: events }));
    }
  }

  async function removeEvent(food, eventId) {
    const updated = await deleteFoodEvent(catId, food.id, eventId);
    applyFood(updated);
    setEventsByFood(prev => ({
      ...prev,
      [food.id]: (prev[food.id] || []).filter(e => e.id !== eventId),
    }));
  }

  async function changeType(food, type) {
    const updated = await updateFood(catId, food.id, { ...food, type });
    applyFood(updated);
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

  const groups = ['awaiting', 'loved', 'liked', 'bored', 'disliked']
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
              {g.foods.map(food => {
                const streak = food.streak;
                const onStreak = streak && streak.currentLovedStreak >= 1;
                const hasHistory = streak && (streak.runs.length > 0 || food.status !== 'awaiting');
                const isOpen = expanded.has(food.id);
                const isBusy = busy.has(food.id);
                const events = eventsByFood[food.id];
                const maxRun = streak ? Math.max(1, ...streak.runs.map(r => r.count)) : 1;
                return (
                  <motion.li
                    key={food.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-card rounded-2xl px-3 py-3 shadow-sm border border-cocoa/20"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={food.image_url || fallbackImg(food.brand)}
                        alt=""
                        className="w-24 h-24 rounded-xl object-cover bg-cocoa-soft shrink-0"
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
                          <FoodStatusBadge status={food.status} />
                          {onStreak && (
                            <button
                              onClick={() => toggleHistory(food)}
                              title="Tap for streak history"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-sage/40 bg-sage-soft/50 text-sage text-sm font-bold active:opacity-70"
                            >
                              😻 ×{streak.currentLovedStreak} · {fmtDays(streak.streakDays)}
                            </button>
                          )}
                          {!onStreak && hasHistory && (
                            <button
                              onClick={() => toggleHistory(food)}
                              className="text-xs font-bold text-cocoa hover:text-espresso-soft underline underline-offset-2"
                            >
                              {isOpen ? 'hide history' : 'history'}
                            </button>
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
                    </div>

                    {/* Quick check-in: one tap logs a dated reaction. */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap pl-[68px]">
                      {REACTIONS.map(r => (
                        <motion.button
                          key={r.value}
                          whileTap={{ scale: 0.85 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                          onClick={() => logReaction(food, r.value)}
                          disabled={isBusy}
                          aria-label={`Log ${r.value}`}
                          title={`Log "${r.value}"`}
                          className={`inline-flex items-center justify-center w-11 h-11 rounded-full border text-2xl leading-none disabled:opacity-40 ${r.ring}`}
                        >
                          {r.emoji}
                        </motion.button>
                      ))}
                      <input
                        type="date"
                        max={todayIso()}
                        value={checkInDate[food.id] || todayIso()}
                        onChange={e => setCheckInDate(prev => ({ ...prev, [food.id]: e.target.value }))}
                        title="Backdate this check-in"
                        className="text-xs border border-cocoa/40 rounded-md px-1.5 py-1 bg-cream-soft text-espresso-soft font-semibold"
                      />
                    </div>

                    {streak?.rotationHint && (
                      <div className="mt-3 ml-[68px] rounded-xl border border-saffron/40 bg-saffron-soft/40 px-3 py-2 text-xs text-espresso-soft leading-snug">
                        Loved this ×{streak.rotationHint.count} over {fmtDays(streak.rotationHint.spanDays)},
                        {' '}bored {fmtDays(streak.rotationHint.daysSinceBored)} ago — cats often come back,
                        {' '}try rotating it in again. 🔄
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="history"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="overflow-hidden ml-[68px]"
                        >
                          <div className="mt-3 space-y-3 border-t border-cocoa/20 pt-3">
                            {streak && streak.runs.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[11px] font-extrabold uppercase tracking-wider text-cocoa">Loved streaks</p>
                                {streak.runs.map((run, i) => {
                                  const end = ENDED[run.endedBy] || ENDED['loved-ongoing'];
                                  return (
                                    <div key={i} className="text-xs text-espresso-soft">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold">
                                          {fmtDate(run.start)} → {run.endedBy === 'loved-ongoing' ? 'now' : fmtDate(run.end)}
                                        </span>
                                        <span className={`font-semibold ${end.cls}`}>
                                          ×{run.count} · {fmtDays(run.spanDays)} {end.emoji} {end.text}
                                        </span>
                                      </div>
                                      <div className="h-2 bg-cream-soft rounded-full overflow-hidden mt-1">
                                        <motion.div
                                          className="h-full bg-sage rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(run.count / maxRun) * 100}%` }}
                                          transition={{ duration: 0.4, ease: 'easeOut' }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="space-y-1">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider text-cocoa">Check-in log</p>
                              {!events ? (
                                <p className="text-xs text-cocoa italic">Loading…</p>
                              ) : events.length === 0 ? (
                                <p className="text-xs text-cocoa italic">No check-ins yet.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {events.map(ev => (
                                    <li key={ev.id} className="flex items-center justify-between gap-2 text-xs text-espresso-soft">
                                      <span>
                                        <span className="mr-1">{REACTION_EMOJI[ev.reaction]}</span>
                                        <span className="font-semibold">{fmtDate(ev.occurred_on)}</span>
                                        {ev.notes && <span className="text-cocoa"> — {ev.notes}</span>}
                                      </span>
                                      <button
                                        onClick={() => removeEvent(food, ev.id)}
                                        aria-label="Delete check-in"
                                        title="Delete this check-in"
                                        className="text-cocoa hover:text-terracotta leading-none px-1"
                                      >
                                        ×
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      ))}
    </div>
  );
}
