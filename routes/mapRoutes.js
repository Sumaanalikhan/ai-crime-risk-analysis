const express = require('express');
const router = express.Router();
const { getHeatmapData } = require('../controllers/riskController');

// When a GET request hits /heatmap, run the getHeatmapData function
router.get('/heatmap', getHeatmapData);

module.exports = router;