import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, uploadProductImage } from '../api';
import { fallbackImg } from '../components/fallbackImg';

const TYPES = ['wet', 'dry', 'raw', 'treat', 'milk', 'other'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    brand: '', product: '', type: 'other',
    image_url: '', product_url: '', barcode: '',
  });
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      getProduct(id).then(p => setForm({
        brand: p.brand || '',
        product: p.product || '',
        type: p.type || 'other',
        image_url: p.image_url || '',
        product_url: p.product_url || '',
        barcode: p.barcode || '',
      })).catch(() => navigate('/products'));
    }
  }, [id]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    update('image_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      let payload = { ...form };

      if (pendingFile) {
        setUploading(true);
        try {
          const { image_url } = await uploadProductImage(pendingFile);
          payload.image_url = image_url;
        } finally {
          setUploading(false);
        }
      }

      if (isEdit) await updateProduct(id, payload);
      else await createProduct(payload);
      navigate('/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const displayImage = previewUrl || form.image_url;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/products')} className="text-indigo-500 text-sm font-medium">‹ Products</button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={displayImage || fallbackImg(form.brand)}
              alt=""
              className="w-32 h-32 rounded-2xl object-cover bg-gray-100 border border-gray-200"
              onError={e => { e.target.src = fallbackImg(form.brand); }}
            />
            {displayImage && (
              <button
                type="button"
                onClick={clearImage}
                aria-label="Remove image"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-red-500 flex items-center justify-center text-sm"
              >
                ×
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
            id="product-image-input"
          />
          <label
            htmlFor="product-image-input"
            className="cursor-pointer bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors min-h-[44px] flex items-center"
          >
            📷 {displayImage ? 'Change Photo' : 'Take or Choose Photo'}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input
            value={form.brand}
            onChange={e => update('brand', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            placeholder="e.g. Fancy Feast"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <input
            value={form.product}
            onChange={e => update('product', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            placeholder="e.g. Chicken Feast in Gravy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => update('type', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base bg-white capitalize"
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product URL <span className="text-gray-400 text-xs">(optional)</span></label>
          <input
            type="url"
            value={form.product_url}
            onChange={e => update('product_url', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            placeholder="https://…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode <span className="text-gray-400 text-xs">(optional)</span></label>
          <input
            value={form.barcode}
            onChange={e => update('barcode', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
            placeholder="UPC/EAN"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-base"
        >
          {uploading ? 'Uploading photo…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}
