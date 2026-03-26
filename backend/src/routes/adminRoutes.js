const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.post('/login', adminController.loginAdmin);
router.delete('/:uid', adminController.deleteAdmin);

module.exports = router;
