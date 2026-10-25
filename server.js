const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db.js'); // 1. Import the connection function

const app = express();

// 2. Run the connection function
connectDB(); 

// Middleware
app.use(cors());
app.use(express.json());

// Basic Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: "Karachi Crime Risk API is running!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});