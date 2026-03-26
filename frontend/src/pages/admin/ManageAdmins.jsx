import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';

const API_URL = `${API_BASE_URL}/api/admins`;

function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser } = useAuth(); // Para no dejarte eliminarte a ti mismo si es posible
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error Obteniendo directivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (uid, email) => {
    if (email === 'admin@defensorescaa.org' || (currentUser && currentUser.email === email)) {
       alert("Medida de Prevención: No puedes eliminar a la Cuenta Maestra Fundadora ni a ti mismo.");
       return;
    }
    
    if (window.confirm(`¿REVOCAR ACCESO de nivel de Administrador permanente al correo ${email}?`)) {
      try {
        const response = await fetch(`${API_URL}/${uid}`, { method: 'DELETE' });
        if (response.ok) {
          setAdmins(admins.filter(a => a.uid !== uid));
        } else {
          alert('Error emitido por el Backend al revocar en Firebase');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.password.length < 6) {
       alert("Por regulaciones Firebase, las claves maestras deben tener más de 6 caracteres.");
       return;
    }
    
    try {
      // POST create
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchAdmins(); // recargar
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Error al guardar en bóveda. Es posible que el correo ya exista. Detalle: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error dando privilegios', error);
      alert('Falla de red contactando nodo backend.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>⚙️ Gestión de Cuentas Directivas</h2>
        <button className="btn btn-primary" onClick={openAddModal}>+ Conceder Acceso Admin</button>
      </div>

      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Matrícula</th>
              <th>Correo Autorizado</th>
              <th>Rol Organizacional</th>
              <th>Vinculación</th>
              <th>Revocar</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Auditando directivos en Firebase Security...</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Sin administradores listados.</td></tr>
            ) : admins.map((admin) => (
              <tr key={admin.uid}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{admin.uid.slice(0,10)}...</td>
                <td style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>{admin.email}</td>
                <td><span className="badge badge-neutral" style={{ background: '#dbeafe', color: '#1e40af' }}>SuperAdmin</span></td>
                <td>{new Date(admin.creationTime).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(admin.uid, admin.email)} 
                    className="btn btn-sm" 
                    style={{ color: 'var(--primary-red)', background: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer', opacity: (admin.email === 'admin@defensorescaa.org') ? 0.3 : 1 }}>
                    Baja / Expulsar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="order-modal-overlay">
          <div className="order-modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Alta de Usuario (Nivel Admin)</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                &times;
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Escribe las credenciales que se inyectarán en la Bóveda de Firebase para esta persona.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Correo Electrónico (Login ID)</label>
                <input required type="email" name="email" value={formData.email} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} placeholder="ejemplo@defensorescaa.org" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Asignar Contraseña Inicial</label>
                <input required type="password" minLength="6" name="password" value={formData.password} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} placeholder="Mínimo 6 caracteres" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--border-color)', background: 'transparent' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Otorgar Acceso Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAdmins;
