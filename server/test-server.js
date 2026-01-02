const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint without Firebase
app.post('/api/notify-sps', async (req, res) => {
  try {
    const { requestId, transportType, suburb, pickupLatitude, pickupLongitude } = req.body;
    
    console.log('Received notification request:', {
      requestId,
      transportType,
      suburb,
      pickupLatitude,
      pickupLongitude
    });

    // Simulate SP filtering (replace with real logic later)
    const mockResult = {
      success: true,
      notified: 2,
      total: 5,
      message: 'Test notification sent'
    };

    res.json(mockResult);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Test FCM server running on port ${PORT}`);
});

module.exports = app;