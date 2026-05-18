import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, deleteProduct } from '../api';
import ImageUploader from '../components/ImageUploader';

const TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

const TEXTURES = [
  { value: 'chunks_in_gravy', label: 'Chunks in Gravy' },
  { value: 'flaked', label: 'Flaked' },
  { value: 'grilled', label: 'Grilled' },
  { value: 'ground', label: 'Ground' },
  { value: 'minced', label: 'Minced' },
  { value: 'morsels', label: 'Morsels' },
  { value: 'mousse', label: 'Mousse' },
  { value: 'pate', label: 'Pâté' },
  { value: 'shredded', label: 'Shredded' },
  { value: 'sliced', label: 'Sliced' },
];

const LIFESTAGES = [
  { value: 'kitten', label: 'Kitten' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' },
  { value: 'all_lifestages', label: 'All Lifestages' },
];

const DIETS = [
  { value: 'chicken_free', label: 'Chicken-Free' },
  { value: 'gluten_free', label: 'Gluten-Free' },
  { value: 'grain_free', label: 'Grain-Free' },
  { value: 'high_fiber', label: 'High Fiber' },
  { value: 'high_protein', label: 'High-Protein' },
  { value: 'human_grade', label: 'Human-Grade' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'limited_ingredient', label: 'Limited Ingredient' },
  { value: 'low_fat', label: 'Low Fat' },
  { value: 'low_glycemic', label: 'Low Glycemic' },
  { value: 'natural', label: 'Natural' },
  { value: 'no_corn_wheat_soy', label: 'No Corn / Wheat / Soy' },
  { value: 'non_gmo', label: 'Non-GMO' },
  { value: 'organic', label: 'Organic' },
  { value: 'pea_free', label: 'Pea-Free' },
  { value: 'plant_based', label: 'Plant Based' },
  { value: 'soy_free', label: 'Soy-Free' },
  { value: 'veterinary_diet', label: 'Veterinary Diet' },
  { value: 'weight_control', label: 'Weight Control' },
  { value: 'with_grain', label: 'With Grain' },
];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const uploaderRef = useRef(null);

  const [form, setForm] = useState({
    brand: '', series: '', product: '', type: 'other',
    image_url: '',
    food_texture: '', lifestage: '', special_diet: [],
    product_urls: [],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      getProduct(id).then(p => setForm({
        brand: p.brand || '',
        series: p.series || '',
        product: p.product || '',
        type: p.type || 'other',
        image_url: p.image_url || '',
        food_texture: p.food_texture || '',
        lifestage: p.lifestage || '',
        special_diet: Array.isArray(p.special_diet) ? p.special_diet : [],
        product_urls: Array.isArray(p.product_urls)
          ? p.product_urls.map(u => ({ url: u.url || '', label: u.label || '' }))
          : [],
      })).catch(() => navigate('/products'));
    }
  }, [id]);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleDiet(value) {
    setForm(f => ({
      ...f,
      special_diet: f.special_diet.includes(value)
        ? f.special_diet.filter(d => d !== value)
        : [...f.special_diet, value],
    }));
  }

  function addProductUrl() {
    setForm(f => ({ ...f, product_urls: [...f.product_urls, { url: '', label: '' }] }));
  }

  function updateProductUrl(i, k, v) {
    setForm(f => ({
      ...f,
      product_urls: f.product_urls.map((u, idx) => idx === i ? { ...u, [k]: v } : u),
    }));
  }

  function removeProductUrl(i) {
    setForm(f => ({ ...f, product_urls: f.product_urls.filter((_, idx) => idx !== i) }));
  }

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
      const product_urls = form.product_urls
        .map(u => ({ url: (u.url || '').trim(), label: (u.label || '').trim() }))
        .filter(u => u.url)
        .map(u => u.label ? u : { url: u.url });
      const payload = { ...form, image_url, product_urls };
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
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">
            Series <span className="text-cocoa text-xs font-semibold">(optional)</span>
          </label>
          <input
            value={form.series}
            onChange={e => update('series', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
            placeholder="e.g. Complete Health"
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
            Food Texture <span className="text-cocoa text-xs font-semibold">(optional)</span>
          </label>
          <select
            value={form.food_texture}
            onChange={e => update('food_texture', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
          >
            <option value="">—</option>
            {TEXTURES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">
            Lifestage <span className="text-cocoa text-xs font-semibold">(optional)</span>
          </label>
          <select
            value={form.lifestage}
            onChange={e => update('lifestage', e.target.value)}
            className="w-full px-4 py-3 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-base bg-cream-soft"
          >
            <option value="">—</option>
            {LIFESTAGES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">
            Special Diet <span className="text-cocoa text-xs font-semibold">(optional, multi-select)</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {DIETS.map(d => {
              const checked = form.special_diet.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDiet(d.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors border ${
                    checked
                      ? 'bg-tabby text-white border-tabby shadow-sm'
                      : 'bg-cream-soft text-espresso-soft border-cocoa/40 hover:bg-card'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-espresso-soft mb-1.5">
            Product Links <span className="text-cocoa text-xs font-semibold">(optional — add multiple to compare deals)</span>
          </label>
          <div className="space-y-2">
            {form.product_urls.map((u, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <input
                    type="url"
                    value={u.url}
                    onChange={e => updateProductUrl(i, 'url', e.target.value)}
                    className="w-full px-3 py-2.5 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-sm bg-cream-soft"
                    placeholder="https://…"
                  />
                  <input
                    type="text"
                    value={u.label}
                    onChange={e => updateProductUrl(i, 'label', e.target.value)}
                    className="w-full px-3 py-2 border border-cocoa/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-tabby focus:border-transparent text-xs bg-cream-soft"
                    placeholder="Label (e.g. Chewy autoship)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeProductUrl(i)}
                  aria-label="Remove link"
                  className="text-cocoa hover:text-terracotta text-lg leading-none min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProductUrl}
              className="w-full py-2.5 bg-cream-soft text-espresso-soft border border-dashed border-cocoa/40 rounded-xl text-sm font-bold hover:bg-card hover:border-tabby hover:text-tabby transition-colors"
            >
              + Add link
            </button>
          </div>
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
