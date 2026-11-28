const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected successfully!'))
  .catch((err) => console.log('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/heatmap', require('./routes/heatmap'));

// Health Check Route
app.get('/api/health', async (req, res) => {
  const aiUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  let aiStatus = 'offline';
  try {
    const ping = await fetch(`${aiUrl}/heatmap-data`, { signal: AbortSignal.timeout(2500) });
    if (ping.ok) aiStatus = 'online';
  } catch {
    aiStatus = 'offline';
  }

  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiService: aiStatus,
  });
});

// Basic Test Route
app.get('/', (req, res) => {
  res.send('CrimeGuard API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});