const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const getCats = () => request('/cats');
export const getCat = (id) => request(`/cats/${id}`);
export const createCat = (body) => request('/cats', { method: 'POST', body: JSON.stringify(body) });
export const updateCat = (id, body) => request(`/cats/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteCat = (id) => request(`/cats/${id}`, { method: 'DELETE' });

export const getFoods = (catId) => request(`/cats/${catId}/foods`);
export const createFood = (catId, body) => request(`/cats/${catId}/foods`, { method: 'POST', body: JSON.stringify(body) });
export const updateFood = (catId, id, body) => request(`/cats/${catId}/foods/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteFood = (catId, id) => request(`/cats/${catId}/foods/${id}`, { method: 'DELETE' });

export const logFoodEvent = (catId, id, body) => request(`/cats/${catId}/foods/${id}/events`, { method: 'POST', body: JSON.stringify(body) });
export const getFoodEvents = (catId, id) => request(`/cats/${catId}/foods/${id}/events`);
export const deleteFoodEvent = (catId, id, eventId) => request(`/cats/${catId}/foods/${id}/events/${eventId}`, { method: 'DELETE' });

export const searchFoods = (q) => request(`/search/foods?q=${encodeURIComponent(q)}`);

export const getStats = () => request('/stats');

export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return request(`/products${qs ? `?${qs}` : ''}`);
};
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (body) => request('/products', { method: 'POST', body: JSON.stringify(body) });
export const updateProduct = (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Uploads directly to Vercel Blob storage (server only mints a token).
// This bypasses the serverless function body-size limit, so phone photos work.
import { upload } from '@vercel/blob/client';
export const uploadProductImage = async (file) => {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload/image',
  });
  return { image_url: blob.url };
};
