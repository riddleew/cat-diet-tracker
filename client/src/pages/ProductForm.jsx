import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, deleteProduct } from '../api';
import ImageUploader from '../components/ImageUploader';

const TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const uploaderRef = useRef(null);

  const [form, setForm] = useState({
    brand: '', product: '', type: 'other',
    image_url: '', product_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      getProduct(id).then(p => setForm({
        brand: p.brand || '',
        product: p.product || '',
        type: p.type || 'other',
        image_url: p.image_url || '',
        product_url: p.product_url || '',
      })).catch(() => navigate('/products'));
    }
  }, [id]);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function remove() {
    if (!confirm(`Delete "${form.product || form.brand}"?`)) return;
    setDeleting(true);
    try {
      await deleteProduct(id);
      navigate('/products');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!form.brand && !form.product) {
      setError('Brand or product is required');
      return;
    }

    setSaving(true);
    try {
      const image_url = uploaderRef.current
        ? await uploaderRef.current.commitUpload()
        : form.image_url;
      const payload = { ...form, image_url };
      if (isEdit) await updateProduct(id, payload);
      else await createProduct(payload);
      navigate('/products');
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
          onClick={() => navigate('/products')}
          className="text-tabby text-sm font-bold hover:underline"
        >
          ‹ Foods
        </button>
        <h1 className="text-2xl font-extrabold text-espresso">{isEdit ? 'Edit Food' : 'New Food'}</h1>
      </div>

      <form onSubmit={submit} className="bg-card rounded-3xl shadow-sm border border-cocoa/20 p-5 space-y-5">
        {error && <p className="text-terracotta text-sm font-semibold">{error}</p>}

        <ImageUploader
          ref={uploaderRef}
          value={form.image_url}
          onUrl={(url) => update('image_url', url)}
          fallbackKey={form.brand}
          shape="square"
          label="Photo"
        />

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">Brand</label>
          <input
            value={form.brand}
            onChange={e => update('brand', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
            placeholder="e.g. Fancy Feast"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">Product</label>
          <input
            value={form.product}
            onChange={e => update('product', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
            placeholder="e.g. Chicken Feast in Gravy"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">Type</label>
          <select
            value={form.type}
            onChange={e => update('type', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft capitalize"
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">
            Product URL <span className="text-cocoa text-xs font-semibold">(optional)</span>
          </label>
          <input
            type="url"
            value={form.product_url}
            onChange={e => update('product_url', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
            placeholder="https://…"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-tabby text-white rounded-2xl font-extrabold hover:bg-tabby/90 transition-colors disabled:opacity-50 text-base shadow-sm"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Food'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="w-full py-3 bg-card text-terracotta border border-terracotta/40 rounded-2xl font-bold hover:bg-terracotta-soft/30 transition-colors disabled:opacity-50 text-base"
          >
            {deleting ? 'Deleting…' : 'Delete Food'}
          </button>
        )}
      </form>
    </div>
  );
}
