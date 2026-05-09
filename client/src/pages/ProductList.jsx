import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../api';
import TypeBadge from '../components/TypeBadge';
import { fallbackImg } from '../components/fallbackImg';

const PAGE_SIZE = 50;
const TYPES = ['', 'wet', 'dry', 'raw', 'treat', 'milk', 'other'];

export default function ProductList() {
  const navigate = useNavigate();
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4 gap-2">
        <button onClick={() => navigate('/')} className="text-indigo-500 text-sm font-medium">‹ Cats</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">Products</h1>
        <Link to="/products/new" className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          + New
        </Link>
      </div>

      <input
        type="text"
        value={query}
        onChange={e => changeQuery(e.target.value)}
        placeholder="Search brand or product…"
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-3">
        {TYPES.map(t => (
          <button
            key={t || 'all'}
            onClick={() => changeType(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              type === t
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {loading ? 'Loading…' : `${data.total.toLocaleString()} product${data.total === 1 ? '' : 's'}`}
      </p>

      <ul className="space-y-2">
        {data.products.map(p => (
          <li key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Link to={`/products/${p.id}/edit`} className="flex items-start gap-3 px-3 py-3 hover:bg-gray-50">
              <img
                src={p.image_url || fallbackImg(p.brand)}
                alt=""
                className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                onError={e => { e.target.src = fallbackImg(p.brand); }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm leading-tight truncate">
                  {p.product || p.brand}
                </p>
                {p.product && p.brand && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{p.brand}</p>
                )}
                <div className="mt-1.5">
                  <TypeBadge type={p.type || 'other'} small />
                </div>
              </div>
              <button
                onClick={e => remove(p, e)}
                disabled={deleting === p.id}
                aria-label="Delete"
                className="text-gray-300 hover:text-red-400 text-lg leading-none disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && data.products.length === 0 && (
        <p className="text-gray-400 text-center py-8 text-sm">No products match.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
