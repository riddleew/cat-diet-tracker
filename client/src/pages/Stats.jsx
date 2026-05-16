import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getStats } from '../api';
import CatMascot from '../components/CatMascot';
import TypeBadge from '../components/TypeBadge';

function Tile({ icon, value, label, color = 'tabby' }) {
  const colorCls = {
    tabby: 'bg-tabby/10 border-tabby/30 text-tabby',
    sage: 'bg-sage-soft/40 border-sage/40 text-sage',
    saffron: 'bg-saffron-soft/40 border-saffron/40 text-saffron',
    dusk: 'bg-dusk-soft/40 border-dusk/40 text-dusk',
  }[color];
  return (
    <div className={`rounded-2xl border p-4 ${colorCls}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-extrabold text-espresso leading-none">{value}</div>
      <div className="text-xs font-bold text-espresso-soft mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-tabby border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { totals, topBrands, perCat } = stats || {};
  const empty = !totals || totals.total_foods === 0;

  if (empty) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-3xl font-extrabold text-espresso flex items-center gap-2 mb-5">
          <span>📊</span>
          <span>Stats</span>
        </h1>
        <div className="flex flex-col items-center text-center pt-6">
          <CatMascot size={180} />
          <p className="text-lg font-bold text-espresso mt-2">Nothing to chart yet —</p>
          <p className="text-cocoa text-sm">tag some foods to see patterns.</p>
        </div>
      </div>
    );
  }

  const maxBrandCount = Math.max(1, ...topBrands.map(b => b.loved_count));

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-4 space-y-6">
      <h1 className="text-3xl font-extrabold text-espresso flex items-center gap-2">
        <span>📊</span>
        <span>Stats</span>
      </h1>

      {/* At a glance */}
      <section>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-cocoa mb-2.5">At a glance</h2>
        <div className="grid grid-cols-2 gap-3">
          <Tile icon="🐱" value={totals.total_cats} label="Cats" color="tabby" />
          <Tile icon="😻" value={totals.total_loved} label="Loved" color="sage" />
          <Tile icon="🥱" value={totals.total_bored} label="Bored" color="dusk" />
          <Tile icon="⏳" value={totals.total_awaiting} label="Awaiting" color="saffron" />
        </div>
      </section>

      {/* Top brands */}
      {topBrands.length > 0 && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-cocoa mb-2.5">Top loved brands</h2>
          <div className="bg-card rounded-2xl border border-cocoa/20 p-4 space-y-3">
            {topBrands.map((b, i) => (
              <motion.div
                key={b.brand}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1 gap-3">
                  <span className="text-sm font-extrabold text-tabby uppercase tracking-wide truncate">{b.brand}</span>
                  <span className="text-sm font-bold text-espresso shrink-0">😻 {b.loved_count}</span>
                </div>
                <div className="h-2 bg-cream-soft rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-sage rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.loved_count / maxBrandCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 + 0.1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Per-cat favorites */}
      {perCat.length > 0 && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-cocoa mb-2.5">Each cat's favorite</h2>
          <ul className="space-y-2">
            {perCat.map((c, i) => (
              <motion.li
                key={c.cat_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-cocoa/20 p-3 flex items-center gap-3"
              >
                {c.cat_image ? (
                  <img src={c.cat_image} alt="" className="w-12 h-12 rounded-full object-cover bg-cocoa-soft shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-cocoa-soft flex items-center justify-center text-2xl shrink-0">🐱</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-espresso truncate">{c.cat_name}</p>
                  {c.top_brand ? (
                    <p className="text-xs text-espresso-soft truncate">
                      Loves <span className="font-bold text-tabby uppercase tracking-wide">{c.top_brand}</span>
                      <span className="text-cocoa"> · {c.top_brand_count}× </span>
                    </p>
                  ) : (
                    <p className="text-xs text-cocoa italic truncate">No loved foods yet</p>
                  )}
                </div>
                {c.top_type && <TypeBadge type={c.top_type} small />}
              </motion.li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
