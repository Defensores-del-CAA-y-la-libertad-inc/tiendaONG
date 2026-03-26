import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';

const API_URL = `${API_BASE_URL}/api/products`;

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: 'Ropa',
    stock: '',
    description: '',
    image: '',
    hasSizes: true,
    isDocument: false,
    fileUrl: '',
    providerProfit: '',
    ongProfit: '',
    requiresNote: false,
    noteQuestion: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Error fetching products');
      }
    } catch (error) {
      console.error('Error de red al conectar al backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', price: '', type: 'Ropa', stock: '', description: '', 
      image: '', hasSizes: true, isDocument: false, fileUrl: '', 
      providerProfit: '', ongProfit: '', requiresNote: false, noteQuestion: '' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({ 
      name: product.name, 
      price: product.price, 
      type: product.type || product.category || 'Ropa', 
      stock: product.stock, 
      description: product.description || '', 
      image: product.image || '',
      hasSizes: typeof product.hasSizes !== 'undefined' ? product.hasSizes : product.type === 'Ropa',
      isDocument: !!product.isDocument,
      fileUrl: product.fileUrl || '',
      providerProfit: product.providerProfit || '',
      ongProfit: product.ongProfit || '',
      requiresNote: !!product.requiresNote,
      noteQuestion: product.noteQuestion || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo del inventario oficial?')) {
      try {
        const response = await fetch(`${API_URL}/${id}`, { 
          method: 'DELETE',
          headers: { 'x-admin-email': currentUser?.email || 'Desconocido' }
        });
        if (response.ok) {
          setProducts(products.filter(p => p.id !== id));
        } else {
          alert('Error al eliminar en el backend');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const isDocToggle = name === 'isDocument' && checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value,
      ...(isDocToggle ? { hasSizes: false, stock: 9999 } : {})
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("⚠️ El archivo es demasiado grande. Por favor, asegúrate de que sea menor a 10MB.");
      return;
    }
    
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    try {
      const resp = await fetch(`${API_BASE_URL}/api/products/upload`, {
        method: 'POST',
        body: uploadData,
        headers: { 'x-admin-email': currentUser?.email || 'Desconocido' }
      });
      const data = await resp.json();
      if(resp.ok && data.url) {
         setFormData(prev => ({ ...prev, fileUrl: data.url }));
      } else {
         alert('Error subiendo archivo: ' + (data.message || 'Error desconocido') + '\nDetalles: ' + (data.error || 'N/A'));
      }
    } catch(err) {
      console.error(err);
      alert('Error de red al subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.isDocument && !formData.fileUrl) {
      alert("⚠️ Por favor, sube el archivo PDF antes de guardar el documento.");
      return;
    }
    const newProductData = {
      ...formData,
      categoryId: formData.type,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      isDocument: formData.isDocument,
      fileUrl: formData.isDocument ? formData.fileUrl : '',
      providerProfit: parseFloat(formData.providerProfit) || 0,
      ongProfit: parseFloat(formData.ongProfit) || 0
    };

    try {
      let isSuccess = false;

      if (editingProduct) {
        const response = await fetch(`${API_URL}/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-email': currentUser?.email || 'Desconocido'
          },
          body: JSON.stringify(newProductData)
        });
        if (response.ok) {
          isSuccess = true;
          setProducts(products.map(p => p.id === editingProduct.id ? { ...newProductData, id: p.id } : p));
        }
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-email': currentUser?.email || 'Desconocido'
          },
          body: JSON.stringify(newProductData)
        });
        if (response.ok) {
          const returnedProduct = await response.json();
          isSuccess = true;
          setProducts([...products, returnedProduct]);
        }
      }
      
      if(isSuccess) {
        setIsModalOpen(false);
      } else {
        alert("Error al procesar la solicitud en el backend.");
      }
    } catch (error) {
      console.error('Error guardando el artículo', error);
      alert('Error de conexión con el backend: ' + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Catálogo (Mercancía y Documentos)</h2>
        <button className="btn btn-primary" onClick={openAddModal}>+ Añadir Mercancía o Documento</button>
      </div>

      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Sistema</th>
              <th>Nombre del Artículo</th>
              <th>Categoría</th>
              <th>Precio Venta</th>
              <th>Inventario Físico</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Conectando con Servidor Central (Firebase)...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No hay artículos registrados aún.</td></tr>
            ) : products.map((prod) => (
              <tr key={prod.id}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prod.id}</td>
                <td style={{ fontWeight: '500' }}>
                  {prod.name} {prod.isDocument && <span style={{fontSize: '0.7em', padding: '2px 5px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', marginLeft: '5px'}}>DIGITAL</span>}
                </td>
                <td><span className="badge badge-neutral">{prod.type || prod.categoryId || 'General'}</span></td>
                <td>${Number(prod.price).toFixed(2)}</td>
                <td>
                  {prod.isDocument ? (
                     <span style={{ color: 'var(--text-muted)' }}>∞ Infinito</span>
                  ) : (
                     <span style={{color: prod.stock < 20 ? 'var(--primary-red)' : 'inherit', fontWeight: 'bold'}}>{prod.stock} unidades</span>
                  )}
                </td>
                <td>
                  <button onClick={() => openEditModal(prod)} className="btn btn-sm" style={{ marginRight: '0.5rem', border: '1px solid var(--border-color)', background: 'transparent' }}>✏️</button>
                  <button onClick={() => handleDelete(prod.id)} className="btn btn-sm" style={{ color: 'var(--primary-red)', background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="order-modal-overlay">
          <div className="order-modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Producto/Documento' : 'Registrar Nuevo Stock/Documento'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#e0f2fe', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <input 
                  type="checkbox" 
                  name="isDocument" 
                  id="isDocument"
                  checked={formData.isDocument} 
                  onChange={handleFormChange} 
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isDocument" style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: '#0369a1' }}>
                  Es un Documento Digital (PDF, Curso, etc.)
                </label>
              </div>

              {formData.isDocument && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>☁️ Subir Archivo</label>
                  <input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.zip" disabled={isUploading} style={{ marginBottom: '1rem', display: 'block', width: '100%' }} />
                  {/* OPCIÓN 1: SUBIR EL ARCHIVO DIRECTAMENTE */}
                  {formData.fileUrl ? (
                    <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✅ Archivo almacenado: {formData.fileUrl.split('/').pop().slice(0, 30)}...
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', background: '#eef2ff', color: '#4338ca', borderRadius: '8px', border: '1px solid #c7d2fe', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      💡 Sube el archivo aquí <b>O</b> pega un enlace de Drive/Dropbox abajo.
                    </div>
                  )}

                  {/* OPCIÓN 2: PEGAR EL ENLACE MANUALMENTE */}
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Pegar Enlace Manualmente (Ej: Google Drive)</label>
                  <input type="url" name="fileUrl" value={formData.fileUrl} onChange={handleFormChange} placeholder="https://drive.google.com/..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: isUploading ? '#e2e8f0' : 'white' }} readOnly={isUploading} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Título del Producto/Archivo</label>
                <input required type="text" name="name" value={formData.name} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio Venta ($ USD)</label>
                  <input required type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Categoría</label>
                  <select name="type" value={formData.type} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <option value="Ropa">Ropa</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Documentos">Documentos</option>
                  </select>
                </div>
              </div>

              {!formData.isDocument && (
                <>
                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#166534' }}>💰 División de Ganancias</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Proveedor ($)</label>
                        <input type="number" step="0.01" name="providerProfit" value={formData.providerProfit} onChange={handleFormChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #86efac' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>ONG ($)</label>
                        <input type="number" step="0.01" name="ongProfit" value={formData.ongProfit} onChange={handleFormChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #86efac' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Stock en Bodega</label>
                    <input required={!formData.isDocument} type="number" min="0" name="stock" value={formData.stock} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <input type="checkbox" name="hasSizes" id="hasSizes" checked={formData.hasSizes} onChange={handleFormChange} style={{ width: '20px', height: '20px' }} />
                    <label htmlFor="hasSizes" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Requiere selección de talla</label>
                  </div>

                  <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input type="checkbox" name="requiresNote" id="requiresNote" checked={formData.requiresNote} onChange={handleFormChange} style={{ width: '20px', height: '20px' }} />
                      <label htmlFor="requiresNote" style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: '#991b1b' }}>
                        Preguntar info al cliente (Ej: ¿Qué diseño prefieres?)
                      </label>
                    </div>
                    {formData.requiresNote && (
                      <input 
                        type="text" 
                        name="noteQuestion" 
                        value={formData.noteQuestion} 
                        onChange={handleFormChange} 
                        placeholder="Escribe la pregunta aquí..." 
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #f87171' }} 
                      />
                    )}
                  </div>
                </>
              )}

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>📸 Imagen del Producto</label>
                
                {formData.image && (
                  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    <img 
                      src={formData.image} 
                      alt="Vista previa" 
                      style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      style={{ display: 'block', margin: '0.5rem auto', fontSize: '0.75rem', color: 'var(--primary-red)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      Remover imagen
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      setIsUploading(true);
                      const uploadData = new FormData();
                      uploadData.append('file', file);
                      
                      try {
                        const resp = await fetch(`${API_BASE_URL}/api/products/upload`, {
                          method: 'POST',
                          body: uploadData,
                          headers: { 'x-admin-email': currentUser?.email || 'Desconocido' }
                        });
                        const data = await resp.json();
                        if(resp.ok && data.url) {
                           setFormData(prev => ({ ...prev, image: data.url }));
                        } else {
                           alert('Error subiendo imagen: ' + (data.message || 'Error desconocido'));
                        }
                      } catch(err) {
                        console.error(err);
                        alert('Error de red al subir la imagen.');
                      } finally {
                        setIsUploading(false);
                      }
                    }} 
                    accept="image/*" 
                    disabled={isUploading} 
                    style={{ flex: 1, fontSize: '0.85rem' }} 
                  />
                </div>
                
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>O pega una URL externa:</label>
                  <input 
                    type="url" 
                    name="image" 
                    value={formData.image} 
                    onChange={handleFormChange} 
                    placeholder="https://..." 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Descripción</label>
                <textarea rows="3" name="description" value={formData.description} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--border-color)', background: 'transparent' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" disabled={isUploading} className="btn btn-primary">{editingProduct ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageProducts;
