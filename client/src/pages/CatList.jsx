import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCats, deleteCat } from '../api';

export default function CatList() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCats().then(setCats).finally(() => setLoading(false));
  }, []);

  async function remove(cat) {
    if (!confirm(`Delete ${cat.name}? This removes all their food preferences.`)) return;
    await deleteCat(cat.id);
    setCats(prev => prev.filter(c => c.id !== cat.id));
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-bold text-gray-900 flex-1 min-w-0 truncate">🐱 Cat Food Tracker</h1>
        <Link to="/products" className="text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors shrink-0">
          Products
        </Link>
        <Link to="/cats/new" className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0">
          + Cat
        </Link>
      </div>

      {cats.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">No cats yet!</p>
          <Link to="/cats/new" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Add your first cat
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {cats.map(cat => (
            <li key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Link to={`/cats/${cat.id}`} className="flex items-center px-4 py-4 gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base truncate">{cat.name}</p>
                  {cat.breed && <p className="text-sm text-gray-400 truncate">{cat.breed}</p>}
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  {cat.counts.liked > 0 && <span className="text-green-600 font-medium">👍 {cat.counts.liked}</span>}
                  {cat.counts.disliked > 0 && <span className="text-red-500 font-medium">👎 {cat.counts.disliked}</span>}
                  {cat.counts.liked === 0 && cat.counts.disliked === 0 && <span className="text-gray-300 text-xs">no foods yet</span>}
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </Link>
              <div className="border-t border-gray-50 flex">
                <Link to={`/cats/${cat.id}/edit`} className="flex-1 py-2 text-center text-sm text-indigo-500 hover:bg-indigo-50 transition-colors">
                  Edit
                </Link>
                <button onClick={() => remove(cat)} className="flex-1 py-2 text-sm text-red-400 hover:bg-red-50 transition-colors border-l border-gray-50">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
