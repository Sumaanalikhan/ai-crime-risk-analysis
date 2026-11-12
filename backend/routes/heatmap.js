const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const aiResponse = await fetch('http://localhost:8000/heatmap-data');
    if (!aiResponse.ok) throw new Error('Failed to fetch heatmap data from AI service');

    const data = await aiResponse.json();
    res.json({ success: true, zones: data.zones });
  } catch (error) {
    console.error('Heatmap Gateway Error:', error.message);
    res.status(500).json({ success: false, message: 'AI Heatmap service unavailable', zones: [] });
  }
});

module.exports = router;