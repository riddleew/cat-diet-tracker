import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCat, createCat, updateCat } from '../api';
import ImageUploader from '../components/ImageUploader';

export default function CatForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const uploaderRef = useRef(null);

  const [form, setForm] = useState({ name: '', breed: '', notes: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      getCat(id).then(cat => setForm({
        name: cat.name,
        breed: cat.breed || '',
        notes: cat.notes || '',
        image_url: cat.image_url || '',
      }));
    }
  }, [id]);

  function setImageUrl(url) {
    setForm(f => ({ ...f, image_url: url }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const image_url = uploaderRef.current
        ? await uploaderRef.current.commitUpload()
        : form.image_url;
      const payload = { ...form, image_url };
      if (isEdit) {
        await updateCat(id, payload);
        navigate(`/cats/${id}`);
      } else {
        const cat = await createCat(payload);
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
        <button
          onClick={() => navigate(-1)}
          className="text-tabby text-sm font-bold hover:underline"
        >
          ‹ Back
        </button>
        <h1 className="text-2xl font-extrabold text-espresso">{isEdit ? 'Edit Cat' : 'New Feline'}</h1>
      </div>

      <form onSubmit={submit} className="bg-card rounded-3xl shadow-sm border border-cocoa/20 p-5 space-y-5">
        {error && <p className="text-terracotta text-sm font-semibold">{error}</p>}

        <ImageUploader
          ref={uploaderRef}
          value={form.image_url}
          onUrl={setImageUrl}
          fallbackKey={form.name}
          shape="round"
          label="Photo"
        />

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">Name <span className="text-terracotta">*</span></label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
            placeholder="e.g. Luna"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">Breed</label>
          <input
            value={form.breed}
            onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
            placeholder="e.g. Siamese"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base resize-none bg-cream-soft"
            placeholder="Any special dietary needs…"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-tabby text-white rounded-2xl font-extrabold hover:bg-tabby/90 transition-colors disabled:opacity-50 text-base shadow-sm"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Cat'}
        </button>
      </form>
    </div>
  );
}
