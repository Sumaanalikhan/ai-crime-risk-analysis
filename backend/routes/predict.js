const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { location, time } = req.body;

    // 1. Forward the request to your new Python Microservice on Port 8000
    const aiResponse = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, time })
    });

    if (!aiResponse.ok) throw new Error("Python AI did not respond properly");
    
    // 2. Parse the real Machine Learning prediction
    const aiData = await aiResponse.json();

    // 3. Send the AI's math back to the React frontend
    res.json({
      success: true,
      riskScore: aiData.ai_risk_score,
      message: aiData.model_used
    });

  } catch (error) {
    console.error("Microservice Connection Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "AI Engine is currently offline.",
      riskScore: 50 // Fallback score if Python is turned off
    });
  }
});

module.exports = router;  