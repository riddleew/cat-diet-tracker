import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCats } from '../api';
import CatMascot from '../components/CatMascot';

export default function CatList() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCats().then(setCats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-tabby border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6 gap-2">
        <h1 className="text-3xl font-extrabold text-espresso flex items-center gap-2">
          <span>🐾</span>
          <span>Your Felines</span>
        </h1>
        {cats.length > 0 && (
          <Link
            to="/cats/new"
            className="bg-tabby text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-tabby/90 transition-colors shrink-0 shadow-sm"
          >
            + Add a feline
          </Link>
        )}
      </div>

      {cats.length === 0 ? (
        <div className="flex flex-col items-center text-center pt-8 pb-6">
          <CatMascot size={200} />
          <p className="text-lg font-bold text-espresso mt-2">No cats yet —</p>
          <p className="text-cocoa text-sm mb-6">let's add your first feline!</p>
          <Link
            to="/cats/new"
            className="bg-tabby text-white px-6 py-3 rounded-2xl font-bold hover:bg-tabby/90 transition-colors shadow-sm"
          >
            + Add a feline
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {cats.map((cat, i) => (
            <motion.li
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
            >
              <Link
                to={`/cats/${cat.id}`}
                className="block relative rounded-3xl overflow-hidden bg-card shadow-sm border border-cocoa/20 hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-cocoa-soft relative">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CatMascot size={140} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-espresso/85 via-espresso/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-2xl font-extrabold truncate drop-shadow">{cat.name}</p>
                      {cat.breed && <p className="text-cream-soft/85 text-sm font-semibold truncate">{cat.breed}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {cat.counts.awaiting > 0 && (
                        <span className="bg-saffron text-espresso px-2.5 py-1 rounded-full text-xs font-extrabold shadow">⏳ {cat.counts.awaiting}</span>
                      )}
                      {cat.counts.loved > 0 && (
                        <span className="bg-sage text-white px-2.5 py-1 rounded-full text-xs font-extrabold shadow">😻 {cat.counts.loved}</span>
                      )}
                      {cat.counts.bored > 0 && (
                        <span className="bg-dusk text-white px-2.5 py-1 rounded-full text-xs font-extrabold shadow">🥱 {cat.counts.bored}</span>
                      )}
                      {cat.counts.disliked > 0 && (
                        <span className="bg-terracotta text-white px-2.5 py-1 rounded-full text-xs font-extrabold shadow">😿 {cat.counts.disliked}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
