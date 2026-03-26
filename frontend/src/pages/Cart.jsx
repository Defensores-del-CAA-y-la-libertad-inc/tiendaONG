import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

function Cart() {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useContext(CartContext);
  
  const [shippingZip, setShippingZip] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const subtotal = totalAmount;
  
  // Cálculo de Sales Tax oficial para Pinellas County, FL (7%)
  const physicalItems = cart.filter(i => !i.isDocument);
  const physicalSubtotal = physicalItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const salesTax = physicalSubtotal * 0.07;
  const [shippingError, setShippingError] = useState('');

  const calculateShipping = async (e) => {
    e.preventDefault();
    setShippingError('');
    if (!shippingZip || !shippingState || cart.length === 0) return;
    
    setIsCalculating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zipcode: shippingZip, 
          state: shippingState, 
          cartItems: cart 
        })
      });
      
      const data = await response.json();
      if (!response.ok || data.length === 0) {
        setShippingError('⚠️ Los datos no coinciden. Por favor verifica tu Estado y Zip Code.');
        setShippingOptions([]);
        return;
      }
      
      const rates = data.sort((a, b) => a.cost - b.cost);
      setShippingOptions(rates);
      
      if (rates.length > 0) {
        setSelectedShipping({ cost: rates[0].cost, name: `${rates[0].provider} ${rates[0].service}` });
      }
    } catch (error) {
       setShippingError('⚠️ Error al conectar con el servidor de envíos.');
    } finally {
      setIsCalculating(false);
    }
  };

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleCheckout = async () => {
    if (!selectedShipping) {
      alert("Calcula y selecciona tu envío.");
      return;
    }
    if (!email || !email.includes('@')) {
      alert("Ingresa un correo electrónico válido.");
      return;
    }
    if (!firstName || !lastName || !address || !city) {
      alert("Por favor completa todos los campos de nombre y dirección.");
      return;
    }
    if (!agreedToTerms) {
      alert("Debes aceptar los términos y condiciones.");
      return;
    }

    try {
      const itemsConEnvio = [
        ...cart,
        {
          name: `Logística Oficial por ${selectedShipping.name}`,
          price: selectedShipping.cost,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop"
        }
      ];

      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsConEnvio,
          customerEmail: email,
          customerFirstName: firstName,
          customerLastName: lastName,
          shippingAddress: address,
          shippingCity: city,
          shippingState: shippingState,
          shippingZip: shippingZip,
          orderId: orderId,
          salesTax: salesTax
        })
      });

      if (!response.ok) throw new Error('Falló el servidor de pagos');
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Error contactando a Stripe.");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 5%', textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>Tu Carrito está vacío</h2>
        <Link to="/catalogo" className="btn btn-primary">Ver Catálogo</Link>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 5%', minHeight: '80vh' }}>
      <h2 className="section-title">Tu Carrito Oficial</h2>
      
      <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '1.5rem', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', background: 'var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>📦</span>
                </div>
              )}
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-blue)' }}>{item.name}</h3>
                    {item.customerNote && (
                      <div style={{ marginTop: '0.4rem', background: '#fffbeb', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #fde68a', color: '#92400e' }}>
                         <strong>Preferencia:</strong> {item.customerNote}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="cart-quantity-btn" onClick={() => updateQuantity(item.id, item.name, item.customerNote, item.quantity - 1)}>-</span>
                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <span className="cart-quantity-btn" onClick={() => updateQuantity(item.id, item.name, item.customerNote, item.quantity + 1)}>+</span>
                  </div>
                  <button onClick={() => removeFromCart(item.id, item.name, item.customerNote)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)', position: 'sticky', top: '100px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary-blue)', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>Resumen Comercial</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span style={{ fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
          </div>

          {/* COTIZADOR REDISEÑADO */}
          <div style={{ marginTop: '1.5rem', borderTop: '2px dashed var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>🚚 Selección de Envío (USA)</h4>
            
            <form onSubmit={calculateShipping} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <select 
                value={shippingState} 
                onChange={(e) => setShippingState(e.target.value)} 
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'white' }}
              >
                <option value="">Selecciona tu Estado</option>
                {US_STATES.map(st => <option key={st.code} value={st.code}>{st.name} ({st.code})</option>)}
              </select>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Zip Code" 
                  value={shippingZip} 
                  onChange={(e) => setShippingZip(e.target.value.replace(/\D/g, '').slice(0, 5))} 
                  required
                  style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', maxWidth: '140px' }} 
                />
                <button disabled={isCalculating} type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {isCalculating ? '...' : 'Seleccionar tipo de envío'}
                </button>
              </div>
            </form>

            {shippingError && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '500', lineHeight: '1.4' }}>
                {shippingError}
              </div>
            )}

            {shippingOptions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {shippingOptions.map((opt) => (
                  <label key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: selectedShipping?.name.includes(opt.service) ? '#f0f9ff' : 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="radio" checked={selectedShipping?.name.includes(opt.service)} onChange={() => setSelectedShipping({ cost: opt.cost, name: `${opt.provider} ${opt.service}` })} />
                      <span style={{ fontSize: '0.85rem' }}>{opt.provider} ({opt.timeframe})</span>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>${opt.cost.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '2px dashed var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>📧 Correo Electrónico</h4>
            <input 
                type="email" 
                placeholder="tu@correo.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
              />
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '2px dashed var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>👤 Datos Personales</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Nombre" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
              />
              <input 
                type="text" 
                placeholder="Apellidos" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
              />
            </div>
            
            <h4 style={{ marginBottom: '1rem', marginTop: '1rem', fontSize: '0.9rem' }}>🏠 Dirección de Envío</h4>
            <input 
              type="text" 
              placeholder="Dirección (Calle, Número, Apto)" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '0.5rem' }} 
            />
            <input 
              type="text" 
              placeholder="Ciudad" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Sales Tax (7%)</span>
            <span>${salesTax.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0', fontWeight: 'bold', fontSize: '1.2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <span>Total Final</span>
            <span style={{ color: 'var(--primary-blue)' }}>${(subtotal + salesTax + (selectedShipping ? selectedShipping.cost : 0)).toFixed(2)}</span>
          </div>

          <div style={{ background: '#f0f9ff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🕒</span>
            <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 'bold' }}>Nota: Los envíos se realizan de 24 a 48 horas después de su compra.</span>
          </div>

          <label style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
            <span>Acepto que esta es una recaudación de fondos de la ONG.</span>
          </label>

          <button onClick={handleCheckout} className="btn btn-accent" disabled={!agreedToTerms || !selectedShipping} style={{ width: '100%', opacity: (agreedToTerms && selectedShipping) ? 1 : 0.5 }}>
            🔒 Pagar Ahora
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
