const CrimeLog = require('../models/CrimeLog'); // Import the blueprint

// This function fetches the crime data for Ayesha's Leaflet map
const getHeatmapData = async (req, res) => {
    try {
        const crimes = await CrimeLog.find({}); // Tell Mongoose to find ALL records
        res.status(200).json({ 
            success: true, 
            count: crimes.length, 
            data: crimes 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getHeatmapData };