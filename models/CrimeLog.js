const mongoose = require('mongoose');

const crimeLogSchema = new mongoose.Schema({
    crimeType: { 
        type: String, 
        required: true 
    }, // e.g., "Mobile Snatching", "Robbery"
    zone: { 
        type: String, 
        required: true 
    }, // e.g., "Orangi Town", "Landhi"
    latitude: { 
        type: Number, 
        required: true 
    },
    longitude: { 
        type: Number, 
        required: true 
    },
    riskScore: { 
        type: Number, 
        default: 0 
    }, // Tuaseen's ML model will update this number
    dateReported: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

module.exports = mongoose.model('CrimeLog', crimeLogSchema);