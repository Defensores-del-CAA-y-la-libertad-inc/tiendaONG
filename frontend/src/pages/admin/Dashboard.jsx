import React, { useState, useEffect, useMemo } from 'react';
import API_BASE_URL from '../../config/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const API_ORDERS = `${API_BASE_URL}/api/orders`;
const API_PRODUCTS = `${API_BASE_URL}/api/products`;
const COLORS = ['#1d3a5d', '#ca1224', '#10b981', '#f59e0b', '#8b5cf6'];

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [dateFilter, setDateFilter] = useState('all'); // today, week, month, quarter, year, all, custom
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'revenue', 'orders', 'inventory', 'avgTicket', 'tax'

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch(API_ORDERS),
          fetch(API_PRODUCTS)
        ]);

        if (ordersRes.ok && productsRes.ok) {
          const ordersData = await ordersRes.json();
          const productsData = await productsRes.json();
          
          setOrders(ordersData);
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Error dashboard sync:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (dateFilter === 'week') {
        const pastWeek = new Date(now);
        pastWeek.setDate(now.getDate() - 7);
        return d >= pastWeek && d <= now;
      }
      if (dateFilter === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const orderQuarter = Math.floor(d.getMonth() / 3);
        return orderQuarter === currentQuarter && d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'custom') {
        const start = customRange.start ? new Date(customRange.start) : new Date(0);
        const end = customRange.end ? new Date(customRange.end) : new Date();
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      if (dateFilter === 'month_specific') {
        return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      }
      if (dateFilter === 'quarter_specific') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return q === Number(selectedQuarter) && d.getFullYear() === Number(selectedYear);
      }
      return true;
    });
  }, [orders, dateFilter, customRange, selectedMonth, selectedQuarter, selectedYear]);

  const filteredProducts = useMemo(() => {
    // Usually inventory is not filtered by order dates, but if we wanted to filter by creation date we could.
    // However, the user wants to see current inventory details, so we just use all products.
    // If they want products created in that timeframe, we filter:
    if (dateFilter === 'all') return products;
    const now = new Date();
    return products.filter(p => {
      if (!p.createdAt) return true; // Si no tiene fecha, lo mostramos
      const d = new Date(p.createdAt);
      if (dateFilter === 'today') return d.toDateString() === now.toDateString();
      if (dateFilter === 'week') {
        const pastWeek = new Date(now);
        pastWeek.setDate(now.getDate() - 7);
        return d >= pastWeek && d <= now;
      }
      if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === 'year') return d.getFullYear() === now.getFullYear();
      if (dateFilter === 'custom') {
        const start = customRange.start ? new Date(customRange.start) : new Date(0);
        const end = customRange.end ? new Date(customRange.end) : new Date();
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      if (dateFilter === 'month_specific') {
        return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      }
      if (dateFilter === 'quarter_specific') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return q === Number(selectedQuarter) && d.getFullYear() === Number(selectedYear);
      }
      return true;
    });
  }, [products, dateFilter, customRange, selectedMonth, selectedQuarter, selectedYear]);

  // Derived Stats based on filtered data
  const stats = useMemo(() => {
    let totalRev = 0;
    let totalProvider = 0;
    let totalONG = 0;
    let totalTax = 0;
    let totalStripeFees = 0;
    
    filteredOrders.forEach(o => {
      // EXCLUIR ÓRDENES REEMBOLSADAS O CANCELADAS DE LAS MÉTRICAS FINANCIERAS
      if (o.paymentStatus === 'refunded' || o.status === 'cancelled') return;

      const orderTotal = (Number(o.totalAmount) || 0);
      totalRev += orderTotal;
      totalTax += (Number(o.salesTax) || 0);

      // Calcular comisión de Stripe: 2.2% + $0.25 por transacción
      if (orderTotal > 0) {
        totalStripeFees += (orderTotal * 0.022) + 0.25;
      }
      
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const product = products.find(p => p.id === (item.id || item.productId));
          const quantity = Number(item.quantity) || 1;
          const itemPrice = Number(item.price) || 0;
          
          if (product) {
            if (product.isDocument) {
              totalONG += itemPrice * quantity;
            } else {
              const pProfit = Number(product.providerProfit) || 0;
              const oProfit = Number(product.ongProfit) || 0;
              
              if (pProfit === 0 && oProfit === 0) {
                // Si no hay split definido, todo va a la ONG (a menos que sea shipping)
                totalONG += itemPrice * quantity;
              } else {
                totalProvider += pProfit * quantity;
                totalONG += oProfit * quantity;
              }
            }
          } else if (item.name?.includes('Logística') || item.name?.includes('Shipping')) {
            // El 100% del shipping va al proveedor por reglamentación
            totalProvider += itemPrice * quantity;
          } else {
            // Producto no encontrado, asumimos para la ONG por defecto
            totalONG += itemPrice * quantity;
          }
        });
      }
    });

    const totalOrd = filteredOrders.length;
    const avgT = totalOrd > 0 ? (totalRev / totalOrd) : 0;
    
    const cats = {};
    products.forEach(p => {
      const cat = p.type || p.categoryId || 'Otros';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    const pieData = Object.keys(cats).map(name => ({ name, value: cats[name] }));

    const chartMap = {};
    filteredOrders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      if (!chartMap[dateStr]) chartMap[dateStr] = { ventas: 0, compras: 0 };
      chartMap[dateStr].ventas += (Number(o.totalAmount) || 0);
      chartMap[dateStr].compras += 1;
    });
    
    let chart = Object.keys(chartMap).sort().map(k => ({
      name: k.split('-').slice(1).join('/'),
      ventas: chartMap[k].ventas,
      compras: chartMap[k].compras,
      rawDate: k
    }));

    if (chart.length === 0) {
      chart = [{ name: 'Sin Datos', ventas: 0, compras: 0 }];
    }

    return {
      totalRevenue: totalRev,
      totalProvider,
      totalONG,
      totalTax,
      totalStripeFees,
      totalOrders: totalOrd,
      avgTicket: avgT,
      productCount: products.length,
      filteredProductCount: filteredProducts.length,
      categoryData: pieData.length > 0 ? pieData : [{name: 'Sin Stock', value: 1}],
      recentTransactions: filteredOrders.slice(0, 5),
      chartData: chart
    };
  }, [filteredOrders, products, filteredProducts]);

  const handlePrint = () => {
    window.print();
  };

  const getFilterDesc = () => {
    switch(dateFilter){
      case 'today': return "Hoy";
      case 'week': return "Últimos 7 Días";
      case 'month': return "Este Mes";
      case 'quarter': return "Este Trimestre";
      case 'year': return "Este Año";
      case 'custom': return `Desde ${customRange.start || '?'} hasta ${customRange.end || '?'}`;
      case 'month_specific': {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return `Mes: ${months[selectedMonth]} ${selectedYear}`;
      }
      case 'quarter_specific': return `Trimestre ${selectedQuarter} de ${selectedYear}`;
      default: return "Histórico Completo";
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse" style={{ fontSize: '2rem', marginBottom: '1rem' }}>📡</div>
          <p style={{ color: 'var(--admin-text-muted)' }}>Sincronizando con los servidores de nube de Defensores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="hide-on-print" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--admin-primary)' }}>Resumen Comercial Holístico</h2>
          <p style={{ color: 'var(--admin-text-muted)', margin: '0.5rem 0' }}>Datos extraídos en tiempo real de Firebase Firestore.</p>
        </div>
        
        {/* FILTROS GLOBALES DE DASHBOARD */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--admin-primary)' }}>📅 Filtrar Periodo:</span>
             <select 
               value={dateFilter} 
               onChange={(e) => setDateFilter(e.target.value)}
               style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
             >
               <option value="today">Hoy</option>
               <option value="week">Esta Semana (Últimos 7 días)</option>
               <option value="month">Este Mes</option>
               <option value="quarter">Este Trimestre</option>
               <option value="year">Este Año</option>
               <option value="month_specific">Seleccionar Mes...</option>
               <option value="quarter_specific">Seleccionar Trimestre...</option>
               <option value="all">Histórico Completo</option>
               <option value="custom">Rango Personalizado...</option>
             </select>
          </div>

          {dateFilter === 'month_specific' && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
               <select 
                 value={selectedMonth} 
                 onChange={e => setSelectedMonth(e.target.value)}
                 style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
               >
                 {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                   <option key={i} value={i}>{m}</option>
                 ))}
               </select>
               <select 
                 value={selectedYear} 
                 onChange={e => setSelectedYear(e.target.value)}
                 style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
               >
                 {[2024, 2025, 2026, 2027].map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
               </select>
            </div>
          )}

          {dateFilter === 'quarter_specific' && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
               <select 
                 value={selectedQuarter} 
                 onChange={e => setSelectedQuarter(e.target.value)}
                 style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
               >
                 <option value="1">1er Trimestre (Ene-Mar)</option>
                 <option value="2">2do Trimestre (Abr-Jun)</option>
                 <option value="3">3er Trimestre (Jul-Sep)</option>
                 <option value="4">4to Trimestre (Oct-Dic)</option>
               </select>
               <select 
                 value={selectedYear} 
                 onChange={e => setSelectedYear(e.target.value)}
                 style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
               >
                 {[2024, 2025, 2026, 2027].map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
               </select>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
               <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
               <span style={{ color: '#94a3b8' }}>hasta</span>
               <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Métricas Clave (Modificadas con cursor:pointer para abrir modal) */}
      <div className="admin-stats-grid hide-on-print">
        <div className="admin-stat-card" onClick={() => setActiveModal('revenue')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s', background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)' }} onMouseOver={e => e.currentTarget.style.border='2px solid #10b981'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Ingreso Neto ONG</h4>
          <div className="stat-value" style={{ color: '#10b981' }}>${stats.totalONG.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p style={{ fontSize: '0.8rem', color: '#15803d' }}>📦 Fondos disponibles para la causa</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981' }}>Detalle de Recaudación →</div>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveModal('tax')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s', background: 'linear-gradient(135deg, #fff 0%, #f1f5f9 100%)' }} onMouseOver={e => e.currentTarget.style.border='2px solid #6366f1'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Sales Tax (Pinellas 7%)</h4>
          <div className="stat-value" style={{ color: '#6366f1' }}>${stats.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p style={{ fontSize: '0.8rem', color: '#4338ca' }}>🏛️ Impuestos recaudados para el Condado</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#6366f1' }}>Ver Desglose Fiscal →</div>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveModal('revenue')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s', background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)' }} onMouseOver={e => e.currentTarget.style.border='2px solid #f59e0b'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Pago a Proveedores</h4>
          <div className="stat-value" style={{ color: '#f59e0b' }}>${stats.totalProvider.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p style={{ fontSize: '0.8rem', color: '#9a3412' }}>🚚 Costos de mercancía física</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b' }}>Ver Logística →</div>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveModal('revenue')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.border='2px solid var(--admin-primary)'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Venta Bruta (USD)</h4>
          <div className="stat-value">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--admin-primary)' }}>🟢 Recaudación Total Estimada</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--admin-accent)' }}>Ver Reporte Completo →</div>
        </div>
        
        <div className="admin-stat-card" onClick={() => setActiveModal('orders')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.border='2px solid var(--admin-primary)'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Órdenes Operativas</h4>
          <div className="stat-value">{stats.totalOrders}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>📦 Transacciones procesadas ({getFilterDesc()})</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--admin-accent)' }}>Ver Reporte Completo →</div>
        </div>
        
        <div className="admin-stat-card" onClick={() => setActiveModal('inventory')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.border='2px solid var(--admin-primary)'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Inventario Oficial (Total)</h4>
          <div className="stat-value">{stats.productCount}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>👕 SKU's listados en tienda</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--admin-accent)' }}>Ver Reporte Completo →</div>
        </div>
        
        <div className="admin-stat-card" style={{ border: '2px solid transparent', transition: '0.2s', background: 'linear-gradient(135deg, #fff 0%, #fff1f2 100%)' }} onMouseOver={e => e.currentTarget.style.border='2px solid #ef4444'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Comisión Stripe (Estimada)</h4>
          <div className="stat-value" style={{ color: '#ef4444' }}>${stats.totalStripeFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p style={{ fontSize: '0.8rem', color: '#991b1b' }}>💳 2.2% + $0.25 por transacción</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444' }}>Costo de pasarela de pago</div>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveModal('avgTicket')} style={{ cursor: 'pointer', border: '2px solid transparent', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.border='2px solid var(--admin-primary)'} onMouseOut={e => e.currentTarget.style.border='2px solid transparent'}>
          <h4>Ticket Promedio</h4>
          <div className="stat-value">${stats.avgTicket.toFixed(2)}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>💳 Valor medio por comprador ({getFilterDesc()})</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--admin-accent)' }}>Ver Reporte Completo →</div>
        </div>
      </div>

      {/* DASHBOARD GRANTS HIDDEN ON PRINT */}
      <div className="hide-on-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--admin-primary)' }}>Curva de Ventas del Periodo</h3>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="ventas" stroke="var(--admin-primary)" name="Ventas ($)" strokeWidth={4} dot={{r: 6, fill: 'var(--admin-primary)', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                <Line type="monotone" dataKey="compras" stroke="var(--admin-accent)" name="Cant. Órdenes" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--admin-primary)' }}>Distribución de Stock Global</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
             <div style={{ width: '200px', height: '200px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.categoryData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                      {stats.categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div style={{ flex: 1, paddingLeft: '2rem' }}>
                {stats.categoryData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    <span style={{ color: 'var(--admin-text-muted)', marginLeft: 'auto' }}>{item.value}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* TABLA RECIENTES HIDDEN ON PRINT */}
      <div className="admin-table-container hide-on-print">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--admin-primary)' }}>Registros Recientes del Periodo</h3>
           <a href="/admin/ordenes" style={{ fontSize: '0.85rem', color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 'bold' }}>Ver todo el historial →</a>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Único</th>
              <th>Emisor / Cliente</th>
              <th>Status Pago</th>
              <th>Fecha de Ingreso</th>
              <th>Monto Neto</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentTransactions.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No hay ventas en este periodo.</td></tr>
            ) : stats.recentTransactions.map((trx) => (
              <tr key={trx.id}>
                <td style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>#{trx.id.slice(0, 8)}</td>
                <td style={{ fontWeight: '600' }}>{trx.customerEmail || 'Invitado Web'}</td>
                <td>
                  <span className={`badge ${trx.paymentStatus === 'completed' || trx.paymentStatus === 'Pagado' ? 'badge-success' : 'badge-warning'}`}>
                    {trx.paymentStatus || 'Pendiente'}
                  </span>
                </td>
                <td>{new Date(trx.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: 'bold' }}>${(Number(trx.totalAmount) || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL PARA LOS REPORTES DETALLADOS E IMPRIMIBLES */}
      {/* ========================================================= */}
      {activeModal != null && (
        <div className="order-modal-overlay" onClick={() => setActiveModal(null)} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', maxWidth: '900px', width: '95%', maxHeight: '90vh', padding: '0', overflowX: 'hidden', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            
            <div className="modal-header hide-on-print" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--admin-border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📄</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-primary)' }}>
                  Reporte Detallado: {
                    activeModal === 'revenue' ? 'Ingresos Brutos' : 
                    activeModal === 'orders' ? 'Consolidado de Órdenes' : 
                    activeModal === 'inventory' ? 'Maestro de Inventario' : 
                    activeModal === 'tax' ? 'Reporte de Impuestos de Venta' :
                    'Análisis Ticket Promedio'
                  }
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: '#e2e8f0', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#475569', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

            <div className="printable-area" style={{ padding: '3rem' }}>
              {/* Encabezado del Reporte Oficial para la impresión */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '3px solid var(--admin-accent)', paddingBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--admin-primary)', fontWeight: '800' }}>DEFENSORES CAA</h1>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.9rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>REPORTE GERENCIAL AUTOMATIZADO</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ margin: 0, fontWeight: 'bold' }}>
                     TIPO: {
                      activeModal === 'revenue' ? 'Venta Bruta' : 
                      activeModal === 'orders' ? 'Flujo de Órdenes' : 
                      activeModal === 'inventory' ? 'Inventario Total' : 
                      'Estudio Ticket Promedio'
                     }
                   </p>
                   {activeModal !== 'inventory' && (
                     <p style={{ margin: '0.2rem 0', color: 'var(--admin-text-muted)' }}>Periodo: {getFilterDesc()}</p>
                   )}
                   <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Generado el: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* CONTENIDO DEL REPORTE SEGÚN EL BOTÓN QUE SE HIZO CLICK */}
              
              {/* REPORTE DE VENTAS, ORDENES, TAX O TICKET */}
              {(activeModal === 'revenue' || activeModal === 'orders' || activeModal === 'avgTicket' || activeModal === 'tax') && (
                <>
                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                       <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>TOTAL ÓRDENES</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--admin-primary)' }}>{stats.totalOrders || 0} emitidas</div>
                    </div>
                    {activeModal === 'tax' ? (
                      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #6366f1', flex: 1 }}>
                         <div style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 'bold' }}>TAX RECAUDADO (7%)</div>
                         <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>${Number(stats.totalTax||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      </div>
                    ) : (
                      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                         <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>GANANCIA ONG</div>
                         <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>${Number(stats.totalONG||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      </div>
                    )}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                       <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 'bold' }}>PAGO PROVEEDOR</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>${Number(stats.totalProvider||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                       <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>VENTA BRUTA</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--admin-primary)' }}>${Number(stats.totalRevenue||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#fff' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID Orden</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cliente/Email</th>
                        {activeModal === 'tax' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Base Imponible</th>}
                        {activeModal === 'tax' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax (7%)</th>}
                        {activeModal === 'revenue' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto Proveedor</th>}
                        {activeModal === 'revenue' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Shipping Pagado</th>}
                        {activeModal !== 'tax' && <th style={{ padding: '0.75rem', textAlign: 'center' }}>Items</th>}
                        {activeModal !== 'tax' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto ($)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(!Array.isArray(filteredOrders) || filteredOrders.length === 0) ? (
                        <tr><td colSpan={activeModal === 'revenue' ? 7 : 5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay registros en este periodo de tiempo.</td></tr>
                      ) : filteredOrders.filter(o => o.paymentStatus !== 'refunded' && o.status !== 'cancelled').map((o, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem' }}>{o?.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{o?.id || 'N/A'}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{o?.customerEmail || 'No Asignado'}</td>
                          {activeModal === 'tax' && (
                            <>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${(Number(o?.subtotal)||0).toFixed(2)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#6366f1' }}>${(Number(o?.salesTax)||0).toFixed(2)}</td>
                            </>
                          )}
                          {activeModal !== 'tax' && (
                            <>
                              {activeModal === 'revenue' && (
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#f59e0b' }}>
                                  ${(Array.isArray(o?.items) ? o.items.reduce((acc, item) => {
                                      const p = products.find(prod => prod.id === (item.id || item.productId));
                                      return acc + ((Number(p?.providerProfit) || 0) * (item.quantity || 1));
                                  }, 0) : 0).toFixed(2)}
                                </td>
                              )}
                              {activeModal === 'revenue' && (
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6366f1' }}>
                                  ${(Array.isArray(o?.items) ? o.items.reduce((acc, item) => {
                                      if (item.name?.includes('Logística') || item.name?.includes('Shipping')) {
                                          return acc + (Number(item.price) * (item.quantity || 1));
                                      }
                                      return acc;
                                  }, 0) : 0).toFixed(2)}
                                </td>
                              )}
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{Array.isArray(o?.items) ? o.items.reduce((s,i)=>s+(i?.quantity||1),0) : 0}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>${(Number(o?.totalAmount)||0).toFixed(2)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* REPORTE DE INVENTARIO */}
              {activeModal === 'inventory' && (
                <>
                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                       <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>SKU's REGISTRADOS</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--admin-primary)' }}>{Array.isArray(products) ? products.length : 0} artículos</div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#fff' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre Artículo</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Categoría</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Formato</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Stock Restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!Array.isArray(products) || products.length === 0) ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Inventario vacío.</td></tr>
                      ) : products.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{p?.name || 'S/N'}</td>
                          <td style={{ padding: '0.75rem', color: '#64748b' }}>{p?.categoryId || p?.type || 'General'}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span style={{background: p?.isDocument ? '#e0f2fe' : '#f1f5f9', color: p?.isDocument ? '#0369a1' : '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem'}}>
                              {p?.isDocument ? 'DIGITAL' : 'FÍSICO'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>${(Number(p?.price)||0).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {p?.isDocument ? '∞ Infinito' : (p?.stock || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                <p>FIN DEL REPORTE</p>
                <div style={{ marginTop: '1rem', opacity: 0.5, letterSpacing: '2px', fontWeight: 'bold' }}>DEFENSORES DE LA CAA • DEPARTAMENTO CORPORATIVO</div>
              </div>
            </div>

            <div className="modal-actions hide-on-print" style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc', position: 'sticky', bottom: 0, zIndex: 10 }}>
               <button className="btn" onClick={() => setActiveModal(null)} style={{ border: '1px solid #cbd5e1', background: '#fff', padding: '0.6rem 1.2rem', fontWeight: 'bold' }}>Cerrar Vista</button>
               <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                 <span>🖨️</span> Iniciar Impresión de Reporte
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
