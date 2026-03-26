import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Si ya estamos autenticados, saltarnos el login automáticamente
  if (currentUser) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Redirigir directo al dashboard principal
      navigate('/admin');
    } catch (err) {
      setError('Las credenciales proporcionadas no están autorizadas en el sistema o son incorrectas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--light-bg)', padding: '2rem' }}>
      
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="https://defensorescaa.org/assets/logo-DavfNbZk.png" alt="Defensores LOGO" style={{ height: '70px', marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--primary-blue)', margin: 0, fontSize: '1.5rem' }}>Acceso Administrativo</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Portal privado para directivos de la ONG.</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Correo Oficial</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="directivo@defensorescaa.org"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Clave Maestra de Acceso</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ marginTop: '1rem', width: '100%', padding: '0.9rem', display: 'flex', justifyContent: 'center' }}>
            {loading ? 'Verificando Nodo...' : '🔐 Iniciar Sesión Blindada'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CREDenciales DEMO DE ACCESO (ADMIN)</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <code style={{ fontSize: '0.8rem', color: 'var(--primary-blue)' }}>admin@defensorescaa.org</code>
            <button 
              onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText('admin@defensorescaa.org'); alert('Correo copiado'); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Copiar Correo">
              📋
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <code style={{ fontSize: '0.8rem', color: 'var(--primary-blue)' }}>ongadmin2026</code>
            <button 
              onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText('ongadmin2026'); alert('Contraseña copiada'); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Copiar Contraseña">
              📋
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500' }}>← Volver a la Tienda Pública</a>
        </div>
      </div>

    </div>
  );
}

export default AdminLogin;
