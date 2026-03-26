import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Contexts
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Public Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Documents from './pages/Documents';
import Cart from './pages/Cart';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import ProductDetail from './pages/ProductDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import ManageAdmins from './pages/admin/ManageAdmins';
import AuditLogs from './pages/admin/AuditLogs';
import AdminLogin from './pages/admin/AdminLogin';

import './index.css';

// Componente para forzar el scroll al inicio en cada cambio de página
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout wrapping the public pages to include Navbar
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ minHeight: '80vh' }}>
      {children}
    </main>
    <Footer />
  </>
);

// Escudo Blindado (Protected Route) para bloquear accesos al Panel
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Si no hay un admin validado, expulsa a la persona y lo manda a poner la clave
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si tiene pase, lo deja pasar a la infraestructura
  return children;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
          {/* Rutas 100% Públicas */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/catalogo" element={<PublicLayout><Catalog /></PublicLayout>} />
          <Route path="/documentos" element={<PublicLayout><Documents /></PublicLayout>} />
          <Route path="/producto/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
          <Route path="/carrito" element={<PublicLayout><Cart /></PublicLayout>} />
          <Route path="/success" element={<PublicLayout><Success /></PublicLayout>} />
          <Route path="/cancel" element={<PublicLayout><Cancel /></PublicLayout>} />
          <Route path="/legal/terminos" element={<PublicLayout><Terms /></PublicLayout>} />
          <Route path="/legal/privacidad" element={<PublicLayout><Privacy /></PublicLayout>} />

          {/* Rutas Blindadas (Administración) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<ManageProducts />} />
            <Route path="ordenes" element={<ManageOrders />} />
            <Route path="usuarios" element={<ManageAdmins />} />
            <Route path="auditoria" element={<AuditLogs />} />
          </Route>
        </Routes>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
