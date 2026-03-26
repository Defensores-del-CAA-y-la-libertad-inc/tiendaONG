const { Shippo } = require('shippo');

const getShippo = () => {
    const token = process.env.SHIPPO_API_TOKEN || 'shippo_dev_placeholder';
    // La nueva SDK v2.x se inicializa con una clase y el campo apiKeyHeader
    return new Shippo({ apiKeyHeader: token });
};

exports.calculateRates = async (req, res) => {
  try {
    const { zipcode, cartItems } = req.body;
    
    if (!zipcode) {
      return res.status(400).json({ error: 'Zipcode is required for calculation' });
    }

    // REGLA DE PESO SOLICITADA: Hasta 3 artículos = 1 libra (16 oz), Más de 3 = 2 libras (32 oz)
    const totalItems = Array.isArray(cartItems) ? cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0) : 1;
    const totalWeight = totalItems <= 3 ? 16 : 32; // Onzas

    // Si no hay Token Real de Shippo, usamos el Sandbox / Simulación del servidor
    if (!process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_API_TOKEN === 'shippo_dev_placeholder') {
      console.log('Using simulated shipping rates (No Shippo Token found in .env)');
      
      // Simular un retraso de red
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Calculamos un costo base de envío según la distancia al zip y peso 
      // (Algoritmo mock para la app hasta que pongan el token de pago)
      const baseCost = (totalWeight / 16) * 1.5; // $1.5 por libra base
      
      // Devolver tarifas super-económicas con descuentos de ONG simulados
      return res.json([
        { id: 'rate_usps_ground', provider: 'USPS', service: 'Ground Advantage', timeframe: '3-5 días hábiles', cost: Number((4.50 + baseCost).toFixed(2)) },
        { id: 'rate_ups_2nd_day', provider: 'UPS', service: 'Priority Mail 2-Day', timeframe: '2 días hábiles', cost: Number((9.50 + baseCost).toFixed(2)) },
        { id: 'rate_dhl_express', provider: 'FedEx', service: 'Standard Overnight', timeframe: '24 horas hábiles', cost: Number((19.90 + baseCost).toFixed(2)) },
      ]);
    }

    // --- CÓDIGO DE PRODUCCIÓN CUANDO SHIPPO ESTÉ CONFIGURADO ---
    // La dirección de envío del almacén de la ONG (Miami)
    const addressFrom = {
      name: "Defensores CAA Fulfillment",
      company: "Centro de Apoyo",
      street1: "123 NW 12th Ave",
      city: "Miami",
      state: "FL",
      zip: "33128",
      country: "US",
      validate: true
    };

    // La dirección destino (solo ZIP y US para cotizar rápidamente)
    const addressTo = {
      country: "US",
      zip: zipcode
    };

    const parcel = {
      length: "10",
      width: "8",
      height: "4",
      distanceUnit: "in",
      weight: totalWeight.toString(),
      massUnit: "oz"
    };

    // Shippo se comunica con USPS, UPS, etc.
    const shippo = getShippo();
    // La nueva SDK usa plural 'shipments' y camelCase para los campos
    const shipment = await shippo.shipments.create({
      addressFrom: addressFrom,
      addressTo: addressTo,
      parcels: [parcel]
      // async: false ya se maneja por defecto en la SDK síncrona de Speakeasy si se pide
    });

    // Filtramos y transformamos las tarifas devueltas a un formato amigable para el frontend
    // Nota: La nueva SDK usa camelCase en la respuesta (objectId, estimatedDays)
    const rates = shipment.rates || [];
    if (rates.length === 0) {
       return res.status(400).json({ error: 'No se encontraron transportistas para este Zipcode' });
    }

    // Tomamos las opciones y enviamos las más baratas y representativas
    const mappedRates = rates.slice(0, 4).map(rate => ({
      id: rate.objectId,
      provider: rate.provider,
      service: rate.servicelevel?.name || 'Standard',
      timeframe: rate.estimatedDays ? `${rate.estimatedDays} días estimados` : 'Sujeto al portador',
      cost: Number(rate.amount)
    }));

    return res.json(mappedRates);

  } catch (error) {
    console.error('Error calculando tarifas de envío Shippo:', error);
    res.status(500).json({ error: 'Internal Server Error fetching shipping rates.' });
  }
};

// Obtener tarifas exactas desde el Panel de Admin
exports.getActualRates = async (req, res) => {
  try {
    const { street1, city, state, zip, orderItems } = req.body;
    if (!street1 || !city || !state || !zip) {
       return res.status(400).json({ error: 'Complete la dirección de envío del cliente para cotizar la etiqueta.' });
    }

    console.log("Iniciando llamada a Shippo v2...");
    
    // Convertir orderItems a un array seguro para el cálculo de peso
    const items = Array.isArray(orderItems) ? orderItems : [];
    const totalItems = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    
    // REGLA DE PESO SOLICITADA: Hasta 3 artículos = 1 libra (16 oz), Más de 3 = 2 libras (32 oz)
    const totalWeight = totalItems <= 3 ? 16 : 32; 
    const lb = totalWeight / 16;
    const baseCost = lb * 1.5;

    // --- FALLBACK PREVENTIVO ---
    // Si no hay Token Real, devolvemos inmediatamente el simulado
    if (!process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_API_TOKEN === 'shippo_dev_placeholder') {
      return res.json([
        { id: 'sim_1', provider: 'USPS', service: 'Ground Advantage (Simulated)', cost: Number((4.99 + baseCost).toFixed(2)) },
        { id: 'sim_2', provider: 'UPS', service: 'Ground (Simulated)', cost: Number((8.99 + baseCost).toFixed(2)) }
      ]);
    }

    try {
      const shippo = getShippo();
      
      const addressFrom = {
        name: "Defensores CAA Fulfillment",
        street1: "123 NW 12th Ave",
        city: "Miami",
        state: "FL",
        zip: "33128",
        country: "US"
      };

      const addressTo = {
        name: "Cliente Final", // Requerido por Shippo v2
        street1,
        city,
        state,
        zip,
        country: "US"
      };

      const parcel = {
        length: "10", width: "8", height: "4", distanceUnit: "in",
        weight: totalWeight.toString(), massUnit: "oz"
      };

      // Intentar crear el shipment (Plural 'shipments' y camelCase en entrada)
      const shipment = await shippo.shipments.create({
        addressFrom: addressFrom,
        addressTo: addressTo,
        parcels: [parcel]
      });

      const rates = shipment.rates || [];
      if (rates.length > 0) {
        const mappedRates = rates.slice(0, 5).map(rate => ({
          id: rate.objectId,
          provider: rate.provider,
          service: rate.servicelevel?.name || 'Standard',
          cost: Number(rate.amount)
        }));
        return res.json(mappedRates);
      }

      // Si llegó aquí pero no hay tasas, fallback silencioso
      throw new Error("No rates returned from carrier");

    } catch (shippoErr) {
      console.warn("Shippo API falló, activando modo de emergencia:", shippoErr.message);
      // MODO EMERGENCIA: Devolver cotizaciones estimadas para no bloquear al Admin
      return res.json([
        { id: `emergency_usps_${Date.now()}`, provider: 'USPS', service: 'Standard (Emergency Rate)', cost: Number((5.50 + baseCost).toFixed(2)) },
        { id: `emergency_ups_${Date.now()}`, provider: 'UPS', service: 'Ground (Emergency Rate)', cost: Number((9.50 + baseCost).toFixed(2)) }
      ]);
    }
  } catch (err) {
      console.error("Error crítico en shipping control:", err);
      res.status(500).json({ error: 'Error interno fatal', details: err.message });
  }
};

// Comprar el Label Final
exports.buyLabel = async (req, res) => {
  try {
    const { rateId } = req.body;
    if (!rateId) return res.status(400).json({ error: 'ID de Tarifa requerido' });

    // Modo Fake si no hay llave real
    if (!process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_API_TOKEN === 'shippo_dev_placeholder' || rateId.startsWith('fake_rate_')) {
      return res.json({ 
        url: 'https://shippo-delivery-east.s3.amazonaws.com/98/92/95/9892955f10b745ebb3e4ec8f029/fakelabel.pdf', 
        tracking_number: `SIM_${Date.now()}`
      });
    }

    const shippo = getShippo();
    // La nueva SDK usa plural 'transactions' y camelCase 'labelFileType'
    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: "PDF"
    });

    // Validar status (usualmente es AllCaps en la API)
    if (transaction.status === 'ERROR') {
      return res.status(400).json({ error: 'Hubo un problema procesando la etiqueta con el portador.', details: transaction.messages });
    }

    return res.json({ 
      url: transaction.labelUrl,
      tracking_number: transaction.trackingNumber,
      tracking_url: transaction.trackingUrlProvider
    });
  } catch(err) {
    console.error("Buy Label Error:", err);
    res.status(500).json({ error: 'No se pudo comprar la etiqueta de envío.', details: err.message });
  }
};
