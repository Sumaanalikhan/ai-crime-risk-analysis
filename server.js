const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db.js'); 

// Import the route files we just created
const mapRoutes = require('./routes/mapRoutes.js');
const navRoutes = require('./routes/navRoutes.js');

const app = express();

connectDB(); 

app.use(cors());
app.use(express.json());

// Tell Express to use the routes
app.use('/api/map', mapRoutes);
app.use('/api/nav', navRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: "Karachi Crime Risk API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});