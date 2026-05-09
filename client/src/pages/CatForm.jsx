import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCat, createCat, updateCat } from '../api';

export default function CatForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', breed: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) getCat(id).then(cat => setForm({ name: cat.name, breed: cat.breed || '', notes: cat.notes || '' }));
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateCat(id, form);
        navigate(`/cats/${id}`);
      } else {
        const cat = await createCat(form);
        navigate(`/cats/${cat.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-indigo-500 text-sm font-medium">‹ Back</button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Cat' : 'New Cat'}</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-400">*</span></label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            placeholder="e.g. Luna"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input
            value={form.breed}
            onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            placeholder="e.g. Siamese"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base resize-none"
            placeholder="Any special dietary needs…"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-base"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Cat'}
        </button>
      </form>
    </div>
  );
}
