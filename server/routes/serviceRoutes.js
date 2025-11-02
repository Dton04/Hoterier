const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const serviceController = require('../controllers/serviceController');

// API: Get all services
router.get('/', serviceController.getServices);

// API: Get service by ID
router.get('/:id', serviceController.getServiceById);

// API: Create new service
router.post('/', protect, admin, serviceController.createService);

// API: Update service
router.put('/:id', protect, admin, serviceController.updateService);

// API: Delete service
router.delete('/:id', protect, admin, serviceController.deleteService);

// API: Get services by hotel
router.get('/hotel/:hotelId', serviceController.getServicesByHotel);

// API: Toggle service availability
router.patch('/:id/toggle', protect, admin, serviceController.toggleServiceAvailability);

// API: Get service categories
router.get('/categories', serviceController.getServiceCategories);

module.exports = router;