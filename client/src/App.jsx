import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CatList from './pages/CatList';
import CatForm from './pages/CatForm';
import CatDetail from './pages/CatDetail';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatList />} />
        <Route path="/cats/new" element={<CatForm />} />
        <Route path="/cats/:id" element={<CatDetail />} />
        <Route path="/cats/:id/edit" element={<CatForm />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
