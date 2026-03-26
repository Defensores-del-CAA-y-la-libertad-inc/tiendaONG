import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../admin.css';

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-container">
      <div className={`admin-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <img 
            src="https://defensorescaa.org/assets/logo-DavfNbZk.png" 
            alt="Defensores CAA Logo" 
            style={{ width: '100%', maxWidth: '140px', display: 'block', margin: '0 auto' }} 
          />
        </div>
        
        {currentUser && (
          <div style={{ padding: '0 1.5rem 1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            ID: {currentUser.email}
          </div>
        )}

        <nav className="admin-nav">
          <Link to="/admin" className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            📊 Dashboard
          </Link>
          <Link to="/admin/productos" className={`admin-nav-link ${isActive('/admin/productos') ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            📦 Productos
          </Link>
          <Link to="/admin/ordenes" className={`admin-nav-link ${isActive('/admin/ordenes') ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            🧾 Órdenes
          </Link>
          <Link to="/admin/usuarios" className={`admin-nav-link ${isActive('/admin/usuarios') ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            🛡️ Usuarios
          </Link>
          <Link to="/admin/auditoria" className={`admin-nav-link ${isActive('/admin/auditoria') ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            📖 Auditoría / Registros
          </Link>
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link to="/" className="admin-nav-link" style={{ opacity: 0.6 }}>
               ← Tienda Pública
            </Link>
            <button 
              onClick={handleLogout} 
              className="admin-nav-link" 
              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: '1px solid var(--admin-accent)', color: 'var(--admin-accent)', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 'bold' }}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={toggleSidebar}
              style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="admin-mobile-toggle"
            >
              ☰
            </button>
            <h2 className="admin-title-responsive">Panel de Administración</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>Defensores de la CAA</span>
            <div style={{ width: '35px', height: '35px', background: 'var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
              {currentUser?.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
