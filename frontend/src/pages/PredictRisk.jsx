const express = require('express');
const router = express.Router();

// @route   POST /api/predict
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { location, time } = req.body;
    
    // Print the incoming request to the backend terminal
    console.log(`\n📡 [PREDICT API] Received Request - Location: "${location}", Time: "${time}"`);

    if (!location || !time) {
      return res.status(400).json({ message: 'Please provide both location and time' });
    }

    let baseRisk = 25; 
    const hour = parseInt(time.split(':')[0]);

    // Time Multiplier
    if (hour >= 22 || hour <= 4) {
      baseRisk += 35; // Late night
    } else if (hour >= 18 || hour <= 21) {
      baseRisk += 15; // Evening
    }

    // Karachi Location Arrays (Simplified for better matching)
    const highRiskAreas = ['LYARI', 'KORANGI', 'ORANGI', 'SOHRAB GOTH', 'MACHAR COLONY', 'SADDAR'];
    const moderateRiskAreas = ['GULSHAN', 'NAZIMABAD', 'TARIQ ROAD', 'JOHAR', 'MALIR'];
    const lowRiskAreas = ['DHA', 'CLIFTON', 'CANTT', 'BAHRIA'];

    // Convert input to uppercase so "dha", "Dha", and "DHA" all match successfully
    const searchLocation = location.toUpperCase();
    let matchedZone = "Unknown Zone";

    // Location Multiplier
    if (highRiskAreas.some(area => searchLocation.includes(area))) {
      baseRisk += 30;
      matchedZone = "High Risk Zone";
    } else if (moderateRiskAreas.some(area => searchLocation.includes(area))) {
      baseRisk += 15;
      matchedZone = "Moderate Risk Zone";
    } else if (lowRiskAreas.some(area => searchLocation.includes(area))) {
      baseRisk -= 10;
      matchedZone = "Low Risk Zone";
    } else {
      baseRisk += 5; // Unknown areas
    }

    // Calculate final score
    const finalScore = Math.max(1, Math.min(100, baseRisk));

    // Print the math logic to the terminal
    console.log(`🧠 [AI LOGIC] Hour: ${hour} | Match: ${matchedZone} | Final Score: ${finalScore}`);

    // Generate Advice
    let status = 'Safe';
    let advice = 'Standard precautions advised. Area is generally safe at this hour.';
    
    if (finalScore >= 75) {
      status = 'High Risk';
      advice = 'High probability of street crime/snatching. Avoid unnecessary travel, keep phones hidden, and stick to well-lit main arteries like Shahrah-e-Faisal.';
    } else if (finalScore >= 45) {
      status = 'Moderate Risk';
      advice = 'Exercise caution. Mobile snatching incidents are occasionally reported here. Stay alert at traffic signals and avoid empty streets.';
    }

    // Send to React
    res.json({ location, time, riskScore: finalScore, status, advice });

  } catch (err) {
    console.error("🚨 PREDICTION ERROR:", err);
    res.status(500).json({ message: 'Server error during risk prediction' });
  }
});

module.exports = router;