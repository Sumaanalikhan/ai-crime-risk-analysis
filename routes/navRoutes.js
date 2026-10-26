const express = require('express');
const router = express.Router();
const { calculateSafeRoute } = require('../controllers/routeController');

// When a POST request hits /safe-route, run the calculateSafeRoute function
router.post('/safe-route', calculateSafeRoute);

module.exports = router;