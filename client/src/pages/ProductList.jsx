import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProducts, deleteProduct } from '../api';
import TypeBadge from '../components/TypeBadge';
import { fallbackImg } from '../components/fallbackImg';
import CatMascot from '../components/CatMascot';

const PAGE_SIZE = 50;
const TYPES = ['', 'wet', 'dry', 'raw', 'treat', 'milk', 'other'];

export default function ProductList() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ products: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const debounceRef = useRef(null);

  function load() {
    setLoading(true);
    getProducts({ q: query, type, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 200);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, page]);

  function changeQuery(v) { setQuery(v); setPage(0); }
  function changeType(v) { setType(v); setPage(0); }

  async function remove(p, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${p.product || p.brand}"?`)) return;
    setDeleting(p.id);
    try {
      await deleteProduct(p.id);
      load();
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);
  const emptyCatalog = !loading && data.products.length === 0 && !query && !type;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5 gap-2">
        <h1 className="text-3xl font-extrabold text-espresso flex items-center gap-2">
          <span>🍽️</span>
          <span>Foods</span>
        </h1>
        <Link
          to="/products/new"
          className="bg-tabby text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-tabby/90 transition-colors shadow-sm"
        >
          + New food
        </Link>
      </div>

      <input
        type="text"
        value={query}
        onChange={e => changeQuery(e.target.value)}
        placeholder="Search brand or product…"
        className="w-full px-4 py-3 text-base border border-cocoa/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent mb-3 bg-cream-soft"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-3">
        {TYPES.map(t => (
          <button
            key={t || 'all'}
            onClick={() => changeType(t)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              type === t
                ? 'bg-tabby text-white shadow-sm'
                : 'bg-card text-espresso-soft border border-cocoa/40 hover:bg-cream-soft'
            }`}
          >
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <p className="text-xs text-cocoa font-bold mb-3">
        {loading ? 'Loading…' : `${data.total.toLocaleString()} food${data.total === 1 ? '' : 's'}`}
      </p>

      {emptyCatalog ? (
        <div className="flex flex-col items-center text-center pt-6 pb-4">
          <CatMascot size={160} />
          <p className="text-lg font-bold text-espresso mt-2">No foods yet —</p>
          <p className="text-cocoa text-sm mb-6">curate your own catalog of cat treats!</p>
          <Link
            to="/products/new"
            className="bg-tabby text-white px-6 py-3 rounded-2xl font-bold hover:bg-tabby/90 transition-colors shadow-sm"
          >
            + Add your first food
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.products.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
              className="bg-card rounded-2xl shadow-sm border border-cocoa/20 overflow-hidden"
            >
              <Link to={`/products/${p.id}/edit`} className="flex items-start gap-3 px-3 py-3 hover:bg-cream-soft transition-colors">
                <img
                  src={p.image_url || fallbackImg(p.brand)}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover bg-cocoa-soft shrink-0"
                  onError={e => { e.target.src = fallbackImg(p.brand); }}
                />
                <div className="flex-1 min-w-0">
                  {p.brand && (
                    <p className="text-base font-extrabold text-tabby uppercase tracking-wide truncate">{p.brand}</p>
                  )}
                  {p.product && (
                    <p className={`leading-snug truncate ${p.brand ? 'text-sm text-espresso-soft mt-0.5' : 'text-base font-bold text-espresso'}`}>
                      {p.product}
                    </p>
                  )}
                  <div className="mt-1.5">
                    <TypeBadge type={p.type || 'other'} small />
                  </div>
                </div>
                <button
                  onClick={e => remove(p, e)}
                  disabled={deleting === p.id}
                  aria-label="Delete"
                  className="text-cocoa hover:text-terracotta text-lg leading-none disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 transition-colors"
                >
                  ×
                </button>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}

      {!loading && !emptyCatalog && data.products.length === 0 && (
        <p className="text-cocoa text-center py-8 text-sm">No foods match.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-card border border-cocoa/40 disabled:opacity-40 hover:bg-cream-soft transition-colors"
          >
            ‹ Prev
          </button>
          <span className="text-xs font-bold text-cocoa">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-card border border-cocoa/40 disabled:opacity-40 hover:bg-cream-soft transition-colors"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
