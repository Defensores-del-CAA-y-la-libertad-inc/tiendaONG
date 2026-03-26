const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

// Define API endpoint to calculate live shipping rates based on cart items & destination ZIP
router.post('/rates', shippingController.calculateRates);

// Admin endpoints for buying labels
router.post('/admin-rates', shippingController.getActualRates);
router.post('/admin-buy', shippingController.buyLabel);

module.exports = router;
