import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import CatList from './pages/CatList';
import CatForm from './pages/CatForm';
import CatDetail from './pages/CatDetail';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import Stats from './pages/Stats';
import BottomTabBar from './components/BottomTabBar';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function PageWrap({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrap><CatList /></PageWrap>} />
        <Route path="/cats/new" element={<PageWrap><CatForm /></PageWrap>} />
        <Route path="/cats/:id" element={<PageWrap><CatDetail /></PageWrap>} />
        <Route path="/cats/:id/edit" element={<PageWrap><CatForm /></PageWrap>} />
        <Route path="/products" element={<PageWrap><ProductList /></PageWrap>} />
        <Route path="/products/new" element={<PageWrap><ProductForm /></PageWrap>} />
        <Route path="/products/:id/edit" element={<PageWrap><ProductForm /></PageWrap>} />
        <Route path="/stats" element={<PageWrap><Stats /></PageWrap>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream pb-24">
        <AnimatedRoutes />
        <BottomTabBar />
      </div>
    </BrowserRouter>
  );
}
