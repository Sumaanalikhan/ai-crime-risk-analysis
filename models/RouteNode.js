const mongoose = require('mongoose');

// This schema holds the intersection points used for Prem's Dijkstra routing
const routeNodeSchema = new mongoose.Schema({
    nodeId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    latitude: { 
        type: Number, 
        required: true 
    },
    longitude: { 
        type: Number, 
        required: true 
    },
    connectedNodes: [{
        nodeId: String,
        distance: Number,   // Base distance to the next node
        safetyWeight: Number // Dijkstra uses this to calculate the safest path
    }]
});

module.exports = mongoose.model('RouteNode', routeNodeSchema);