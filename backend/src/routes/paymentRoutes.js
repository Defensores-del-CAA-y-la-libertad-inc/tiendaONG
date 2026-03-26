const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route to initialize a stripe checkout session from the frontend for physical products
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Route for direct document purchase (bypasses cart/shipping)
router.post('/create-document-checkout', paymentController.createDocumentCheckoutSession);

// Route to process a refund for a physical or document order
router.post('/refund', paymentController.refundOrder);

module.exports = router;
