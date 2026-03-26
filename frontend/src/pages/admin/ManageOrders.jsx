import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';

const API_URL = `${API_BASE_URL}/api/orders`;

function ManageOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [shippingForm, setShippingForm] = useState({ name: '', street1: '', city: '', state: '', zip: '' });
  const [isRefunding, setIsRefunding] = useState(null); // ID de la orden procesando refund
  const [labelRates, setLabelRates] = useState([]);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [boughtLabel, setBoughtLabel] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleToggleOrder = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      setLabelRates([]);
      setBoughtLabel(null);
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setShippingForm({ 
          name: order.customerName || '',
          street1: order.shippingAddress || '', 
          city: order.shippingCity || '', 
          state: order.shippingState || '', 
          zip: order.shippingZip || '' 
        });
      }
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteLabel = async (e) => {
    e.preventDefault();
    const order = orders.find(o => o.id === expandedOrderId);
    if (!order) return;

    setIsQuoting(true);
    try {
       const resp = await fetch(`${API_BASE_URL}/api/shipping/admin-rates`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...shippingForm, orderItems: order.items })
       });
       
       if(resp.ok) {
         const data = await resp.json();
         setLabelRates(data);
       } else {
         const errorData = await resp.json();
         const msg = errorData.error || 'No se pudieron obtener cotizaciones.';
         alert(msg);
       }
    } catch(err) {
       console.error(err);
       alert("Error de conexión con el servidor.");
    }
    setIsQuoting(false);
  };

  const handleBuyLabel = async (rateId, cost) => {
    if(!window.confirm(`¿Estás seguro de comprar esta etiqueta por $${cost}?`)) return;
    setIsBuying(true);
    try {
       const resp = await fetch(`${API_BASE_URL}/api/shipping/admin-buy`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ rateId })
       });
       if(resp.ok) {
         const data = await resp.json();
         setBoughtLabel(data);
         alert(`¡Etiqueta comprada! Tracking: ${data.tracking_number}`);
       } else {
         alert('Error procesando la compra.');
       }
    } catch(err) {
       console.error(err);
    }
    setIsBuying(false);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.email || 'Desconocido'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    switch (s) {
      case 'completed':
      case 'pagado': 
        return <span className="badge badge-success">Pagado</span>;
      case 'refunded':
      case 'reembolsado':
        return <span className="badge badge-danger">Reembolsado</span>;
      case 'pending':
      case 'pendiente': 
        return <span className="badge badge-warning">Pendiente</span>;
      case 'failed':
      case 'fallido': 
        return <span className="badge badge-danger">Fallido</span>;
      default: 
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm("🚨 ¿ESTÁS TOTALMENTE SEGURO? Esta acción emitirá un REEMBOLSO TOTAL a través de Stripe y cancelará la orden en el sistema. Esta acción NO se puede deshacer.")) return;
    
    setIsRefunding(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      
      if (response.ok) {
        alert("💰 Reembolso procesado con éxito en Stripe y Firebase.");
        setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: 'refunded', status: 'cancelled' } : o));
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || "No se pudo procesar el reembolso"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error de comunicación con el servidor de pagos.");
    } finally {
      setIsRefunding(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("🗑️ ¿Estás seguro de ELIMINAR permanentemente esta orden? Los datos no se podrán recuperar.")) return;
    try {
      const resp = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': currentUser?.email || 'Desconocido' }
      });
      if (resp.ok) {
        setOrders(orders.filter(o => o.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("🚨 ¡ATENCIÓN! ¿Estás totalmente seguro de ELIMINAR TODAS LAS ÓRDENES? Esta acción es irreversible y se usa solo para limpiar datos de prueba.")) return;
    if (!window.confirm("⚠️ ¿REALMENTE ESTÁS SEGURO? Se borrará TODO el historial de ventas.")) return;
    
    try {
      // Logic for delete all - we iterate through current visible orders and delete them
      for (const order of orders) {
        await fetch(`${API_URL}/${order.id}`, {
          method: 'DELETE',
          headers: { 'x-admin-email': currentUser?.email || 'Desconocido' }
        });
      }
      setOrders([]);
      alert("✅ Todas las órdenes visibles han sido eliminadas.");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error eliminando algunas órdenes.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>📊 Logística de Ventas Reales</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="btn btn-sm btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleDeleteAll}>🗑️ Eliminar Todo (Limpieza)</button>
           <button className="btn btn-sm btn-outline" onClick={fetchOrders}>🔄 Sincronizar Bóveda</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Stripe / Pago</th>
              <th>Estado Logístico</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Consultando registros en Firebase Firestore...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>No se han registrado ventas todavía.</td></tr>
            ) : orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr 
                  style={{ 
                    cursor: 'pointer', 
                    background: expandedOrderId === order.id ? '#f1f5f9' : 'transparent',
                    borderLeft: expandedOrderId === order.id ? '4px solid var(--admin-primary)' : 'none'
                  }} 
                  onClick={() => handleToggleOrder(order.id)}
                >
                  <td style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{order.id.slice(0, 8)}...</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{order.customerName || 'Cliente Web'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{order.customerEmail}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>${(Number(order.totalAmount) || 0).toFixed(2)}</td>
                  <td>{getStatusBadge(order.paymentStatus)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select 
                      value={order.status || 'received'} 
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--admin-border)', fontSize: '0.85rem' }}
                    >
                      <option value="received">Recibida</option>
                      <option value="processing">En Preparación</option>
                      <option value="shipped">Despachada</option>
                      <option value="delivered">Entregada</option>
                    </select>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                        title="Eliminar Orden"
                      >
                        🗑️
                      </button>
                      <button className="btn-add-cart" style={{ padding: '0.3rem 0.6rem', border: 'none' }}>
                        {expandedOrderId === order.id ? 'Cerrar' : 'Ver Detalles'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr>
                    <td colSpan="7" style={{ padding: '0', background: '#f8fafc' }}>
                      <div className="order-expanded-details animate-fade-in" style={{ padding: '2rem', borderBottom: '2px solid var(--admin-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--admin-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>📋 Artículos de la Orden</h4>
                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                                  <th>Producto</th>
                                  <th>Cant.</th>
                                  <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items?.map((item, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '0.5rem 0' }}>
                                      <div style={{ fontWeight: '500' }}>{item.name}</div>
                                      {item.customerNote && (
                                        <div style={{ fontSize: '0.8rem', color: '#92400e', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a', marginTop: '4px', display: 'inline-block' }}>
                                          <strong>Nota/Elección:</strong> {item.customerNote}
                                        </div>
                                      )}
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', textAlign: 'right' }}>
                              <p style={{ margin: '0.2rem 0' }}>Subtotal: ${(order.subtotal || 0).toFixed(2)}</p>
                              <p style={{ margin: '0.2rem 0' }}>Tax: ${(Number(order.salesTax) || 0).toFixed(2)}</p>
                              <h4 style={{ margin: '0.5rem 0', color: 'var(--admin-primary)' }}>Total Pagado: ${Number(order.totalAmount).toFixed(2)}</h4>
                              
                              {order.paymentStatus !== 'refunded' && (
                                <button 
                                  onClick={() => handleRefund(order.id)} 
                                  disabled={isRefunding === order.id}
                                  style={{ 
                                    marginTop: '1rem', 
                                    width: '100%', 
                                    padding: '0.6rem', 
                                    background: '#fff1f2', 
                                    border: '1px solid #fecaca', 
                                    color: '#dc2626', 
                                    borderRadius: '8px', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  {isRefunding === order.id ? 'Procesando Reembolso...' : '💸 Emitir Reembolso Total'}
                                </button>
                              )}
                              
                              {order.paymentStatus === 'refunded' && (
                                <div style={{ marginTop: '1rem', color: '#dc2626', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                  ORDEN REEMBOLSADA 🔒
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--admin-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>👤 Información del Cliente</h4>
                              <p style={{ margin: '0.3rem 0' }}><strong>Nombre:</strong> {order.customerName}</p>
                              <p style={{ margin: '0.3rem 0' }}><strong>Email:</strong> {order.customerEmail}</p>

                              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--admin-primary)' }}>📍 Dirección de Envío</h4>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>{order.shippingAddress || 'N/A'}</p>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>{order.shippingCity || 'N/A'}, {order.shippingState || ''} {order.shippingZip || ''}</p>
                              <p style={{ margin: '0.3rem 0', color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}><strong>Teléfono:</strong> {order.customerPhone || 'Desconocido'}</p>
                            </div>

                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--admin-border)' }}>
                              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📦</span> Logística Shippo</h4>
                              {!boughtLabel ? (
                                <>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input type="text" placeholder="Nombre Destinatario" value={shippingForm.name} onChange={(e)=>setShippingForm({...shippingForm, name: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}/>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                      <input type="text" placeholder="Dirección" value={shippingForm.street1} onChange={(e)=>setShippingForm({...shippingForm, street1: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}/>
                                    <input type="text" placeholder="Ciudad" value={shippingForm.city} onChange={(e)=>setShippingForm({...shippingForm, city: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}/>
                                    <input type="text" placeholder="Estado" value={shippingForm.state} onChange={(e)=>setShippingForm({...shippingForm, state: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}/>
                                    <input type="text" placeholder="Zip" value={shippingForm.zip} onChange={(e)=>setShippingForm({...shippingForm, zip: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}/>
                                    </div>
                                  </div>
                                  <button onClick={handleQuoteLabel} className="btn btn-primary" disabled={isQuoting} style={{ width: '100%' }}>{isQuoting ? 'Calculando...' : 'Cotizar Etiqueta'}</button>
                                  
                                  {labelRates.length > 0 && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      {labelRates.map(rate => (
                                        <div key={rate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '4px' }}>
                                          <span>{rate.provider} (${rate.cost.toFixed(2)})</span>
                                          <button onClick={() => handleBuyLabel(rate.id, rate.cost)} disabled={isBuying} className="btn-add-cart" style={{ padding: '0.2rem 0.5rem' }}>Comprar</button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div style={{ background: '#dcfce3', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                                  <p style={{ margin: '0 0 0.5rem 0', color: '#166534', fontWeight: 'bold' }}>✅ Etiqueta Comprada</p>
                                  <a href={boughtLabel.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>Descargar PDF</a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <button className="btn btn-sm" onClick={handlePrint} style={{ border: '1px solid var(--admin-border)', background: 'white' }}>🖨️ Imprimir Ticket Completo</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageOrders;
