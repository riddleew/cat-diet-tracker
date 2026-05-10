import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCat, deleteCat } from '../api';
import FoodSearch from '../components/FoodSearch';
import FoodList from '../components/FoodList';
import CatMascot from '../components/CatMascot';

export default function CatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cat, setCat] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    getCat(id)
      .then(data => { setCat(data); setFoods(data.foods); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  function onAdded(food) {
    setFoods(prev => [food, ...prev]);
  }

  async function remove() {
    if (!confirm(`Delete ${cat.name}? This removes all their food preferences.`)) return;
    await deleteCat(cat.id);
    navigate('/');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-tabby border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!cat) return null;

  return (
    <div className="max-w-xl mx-auto pb-4">
      {/* Hero */}
      <div className="relative aspect-[4/3] bg-cocoa-soft overflow-hidden">
        {cat.image_url ? (
          <img src={cat.image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CatMascot size={200} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-espresso/90 via-espresso/40 to-transparent" />

        {/* Back chip */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-3 left-3 bg-card/85 backdrop-blur text-espresso px-3 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-card transition-colors"
        >
          ‹ Cats
        </button>

        {/* Overflow menu */}
        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More actions"
            className="w-10 h-10 rounded-full bg-card/85 backdrop-blur text-espresso shadow-sm hover:bg-card transition-colors flex items-center justify-center text-xl font-bold"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-card rounded-xl shadow-lg border border-cocoa/20 overflow-hidden">
              <Link
                to={`/cats/${id}/edit`}
                className="block px-4 py-3 text-sm font-semibold text-espresso hover:bg-cream"
              >
                Edit
              </Link>
              <button
                onClick={remove}
                className="block w-full text-left px-4 py-3 text-sm font-semibold text-terracotta hover:bg-terracotta-soft/30 border-t border-cocoa/20"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="text-3xl font-extrabold text-white drop-shadow">{cat.name}</h1>
          {cat.breed && <p className="text-cream-soft/90 text-sm font-semibold mt-0.5">{cat.breed}</p>}
        </div>
      </div>

      <div className="px-4 pt-5">
        {cat.notes && (
          <p className="text-espresso-soft text-sm mb-4 italic">{cat.notes}</p>
        )}

        <div className="mb-6">
          <FoodSearch catId={id} onAdded={onAdded} />
        </div>

        <h2 className="text-sm font-extrabold uppercase tracking-wider text-cocoa mb-3">🐾 Foods</h2>
        <FoodList catId={id} foods={foods} setFoods={setFoods} />
      </div>
    </div>
  );
}
