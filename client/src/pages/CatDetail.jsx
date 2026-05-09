import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCat } from '../api';
import FoodSearch from '../components/FoodSearch';
import FoodList from '../components/FoodList';

export default function CatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cat, setCat] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCat(id)
      .then(data => { setCat(data); setFoods(data.foods); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  function onAdded(food) {
    setFoods(prev => [food, ...prev]);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!cat) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/')} className="text-indigo-500 text-sm font-medium">‹ All Cats</button>
        <Link to={`/cats/${id}/edit`} className="ml-auto text-sm text-indigo-500 font-medium">Edit</Link>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{cat.name}</h1>
        {cat.breed && <p className="text-gray-400 text-sm mt-0.5">{cat.breed}</p>}
        {cat.notes && <p className="text-gray-500 text-sm mt-1">{cat.notes}</p>}
      </div>

      <div className="mb-6">
        <FoodSearch catId={id} onAdded={onAdded} />
      </div>

      <FoodList catId={id} foods={foods} setFoods={setFoods} />
    </div>
  );
}
