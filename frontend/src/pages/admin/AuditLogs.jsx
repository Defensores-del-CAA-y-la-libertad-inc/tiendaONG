import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Error fetching audit logs');
      }
    } catch (error) {
      console.error('Error de red al conectar al backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>🛡️ Registro de Auditoría y Trazabilidad (Inmutable)</h2>
        <button className="btn btn-sm btn-outline" onClick={fetchLogs}>🔄 Refrescar Registros</button>
      </div>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Esta sección registra de forma automática y permanente cada acción administrativa realizada en la plataforma (Altas, Bajas, Modificaciones). <strong>Estos registros no pueden ser eliminados ni editados bajo ninguna circunstancia.</strong>
      </p>

      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha y Hora (Local)</th>
              <th>Operador (Usuario)</th>
              <th>Acción Realizada</th>
              <th>Detalles / Metadatos</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>Conectando con Servidor de Logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>Aún no hay acciones registradas en el sistema.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} style={{ background: '#f8fafc' }}>
                <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>{log.adminEmail}</td>
                <td>
                  <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    background: log.action.includes('Eliminó') ? '#fee2e2' : (log.action.includes('Creó') ? '#dcfce3' : '#e0f2fe'),
                    color: log.action.includes('Eliminó') ? '#b91c1c' : (log.action.includes('Creó') ? '#15803d' : '#0369a1')
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {log.details}
                  {log.action === 'Eliminó Orden' && log.details.includes('ID Eliminado:') && (
                    <button 
                      onClick={async () => {
                        const orderId = log.details.split('ID Eliminado: ')[1]?.trim();
                        if (orderId && window.confirm(`¿Deseas RESTAURAR la orden ${orderId}?`)) {
                          try {
                            const resp = await fetch(`${API_BASE_URL}/api/orders/${orderId}/restore`, {
                              method: 'POST',
                              headers: { 'x-admin-email': 'Admin Audit Panel' }
                            });
                            if (resp.ok) {
                              alert("✅ Orden restaurada con éxito. Aparecerá de nuevo en Logística.");
                            } else {
                              alert("❌ Error al restaurar (tal vez ya fue restaurada o borrada físicamente).");
                            }
                          } catch(err) {
                            console.error(err);
                          }
                        }
                      }}
                      style={{ marginLeft: '1rem', background: '#dcfce3', border: '1px solid #15803d', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      ↩️ Restaurar Orden
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;
