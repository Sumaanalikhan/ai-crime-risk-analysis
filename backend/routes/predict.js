const express = require('express');
const router = express.Router();

// @route   POST /api/predict
// @desc    Calculate crime risk score based on location and time
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { location, time } = req.body;

    if (!location || !time) {
      return res.status(400).json({ message: 'Please provide both location and time' });
    }

    // 1. Set a baseline risk score
    let baseRisk = 25; 

    // 2. Time Multiplier (Night time is statistically riskier for street crime)
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 22 || hour <= 4) {
      baseRisk += 35; // Late night (10 PM - 4 AM)
    } else if (hour >= 18 || hour <= 21) {
      baseRisk += 15; // Evening (6 PM - 9 PM)
    }

    // 3. Location Multiplier (Karachi specific mock data for FYP demo)
    const highRiskAreas = ['Lyari', 'Korangi', 'Orangi Town', 'Sohrab Goth', 'Machar Colony'];
    const moderateRiskAreas = ['Gulshan-e-Iqbal', 'North Nazimabad', 'Saddar', 'Tariq Road', 'Johar'];
    const lowRiskAreas = ['DHA', 'Clifton', 'Malir Cantt', 'Bahria Town'];

    // Convert location to uppercase for easier matching
    const searchLocation = location.toUpperCase();

    if (highRiskAreas.some(area => searchLocation.includes(area.toUpperCase()))) {
      baseRisk += 30;
    } else if (moderateRiskAreas.some(area => searchLocation.includes(area.toUpperCase()))) {
      baseRisk += 15;
    } else if (lowRiskAreas.some(area => searchLocation.includes(area.toUpperCase()))) {
      baseRisk -= 10;
    } else {
      // Unknown areas get a slight bump in risk just to be safe
      baseRisk += 5; 
    }

    // 4. Cap the final score between 1 and 100
    const finalScore = Math.max(1, Math.min(100, baseRisk));

    // 5. Generate Dynamic AI Advice based on the score
    let status = 'Safe';
    let advice = 'Standard precautions advised. Area is generally safe at this hour.';
    
    if (finalScore >= 75) {
      status = 'High Risk';
      advice = 'High probability of street crime/snatching. Avoid unnecessary travel, keep phones hidden, and stick to well-lit main arteries like Shahrah-e-Faisal.';
    } else if (finalScore >= 45) {
      status = 'Moderate Risk';
      advice = 'Exercise caution. Mobile snatching incidents are occasionally reported here. Stay alert at traffic signals and avoid empty streets.';
    }

    // Send the calculated data back to the React frontend
    res.json({
      location,
      time,
      riskScore: finalScore,
      status,
      advice
    });

  } catch (err) {
    console.error("🚨 PREDICTION ERROR:", err);
    res.status(500).json({ message: 'Server error during risk prediction' });
  }
});

module.exports = router;