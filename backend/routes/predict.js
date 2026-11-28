const express = require('express');
const router = express.Router();

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

function buildPredictionMeta(score, location, time) {
  if (score >= 75) {
    return {
      status: 'CRITICAL RISK — High Street-Crime Alert',
      advice: `High crime exposure predicted in ${location} around ${time}. Avoid isolated side streets, keep phones and valuables concealed, and stick to well-lit main arteries.`,
    };
  }
  if (score >= 45) {
    return {
      status: 'MODERATE RISK — Elevated Vigilance',
      advice: `Moderate street-crime exposure in ${location} around ${time}. Remain alert at traffic signals, commercial intersections, and poorly lit turns.`,
    };
  }
  return {
    status: 'LOW RISK — Standard Caution',
    advice: `Relatively low incident risk predicted in ${location} around ${time}. Maintain standard urban awareness while traveling.`,
  };
}

router.post('/', async (req, res) => {
  try {
    const location = String(req.body?.location || '').trim();
    const time = String(req.body?.time || '').trim();

    if (!location || !time) {
      return res.status(400).json({
        success: false,
        message: 'Both location and time are required for risk prediction.',
      });
    }

    // 1. Forward the request to the Python Microservice
    const aiResponse = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, time }),
      signal: AbortSignal.timeout(6000),
    });

    if (!aiResponse.ok) {
      throw new Error(`Python AI responded with status ${aiResponse.status}`);
    }

    // 2. Parse the real Machine Learning prediction
    const aiData = await aiResponse.json();
    const score = Math.max(5, Math.min(99, Math.round(Number(aiData.ai_risk_score) || 50)));
    const meta = buildPredictionMeta(score, location, time);

    // 3. Send complete structured telemetry back to the React frontend
    res.json({
      success: true,
      riskScore: score,
      status: aiData.status || meta.status,
      location,
      time,
      advice: aiData.advice || meta.advice,
      message: aiData.model_used || 'ML Spatial-Temporal Model',
    });
  } catch (error) {
    console.error('Microservice Connection Error:', error.message);
    res.status(503).json({
      success: false,
      message: 'AI Engine is currently offline.',
    });
  }
});

module.exports = router;