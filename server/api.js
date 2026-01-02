const express = require('express');
const cors = require('cors');
const { notifyRelevantSPs } = require('./fcm-handler');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to notify SPs of new requests
app.post('/api/notify-sps', async (req, res) => {
  console.log('API endpoint hit with data:', req.body);
  try {
    const { requestId, transportType, suburb, pickupLatitude, pickupLongitude } = req.body;
    
    if (!requestId || !transportType || !pickupLatitude || !pickupLongitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Calling notifyRelevantSPs...');
    const result = await notifyRelevantSPs({
      requestId,
      transportType,
      suburb,
      pickupLatitude,
      pickupLongitude
    });
    
    console.log('FCM notification result:', result);
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to update SP FCM token
app.post('/api/update-fcm-token', async (req, res) => {
  try {
    const { spCode, fcmToken } = req.body;
    
    if (!spCode || !fcmToken) {
      return res.status(400).json({ error: 'Missing spCode or fcmToken' });
    }

    // Find SP by sp-code first, then update by driver-id
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    // Find the SP record
    const scanResult = await dynamodb.scan({
      TableName: '911-sp-registration',
      FilterExpression: '#spCode = :spCode',
      ExpressionAttributeNames: {
        '#spCode': 'sp-code'
      },
      ExpressionAttributeValues: {
        ':spCode': spCode
      }
    }).promise();
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      const sp = scanResult.Items[0];
      
      // Update using driver-id as key
      await dynamodb.update({
        TableName: '911-sp-registration',
        Key: { 'driver-id': sp['driver-id'] },
        UpdateExpression: 'SET fcmToken = :token',
        ExpressionAttributeValues: {
          ':token': fcmToken
        }
      }).promise();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`FCM server running on port ${PORT}`);
});

module.exports = app;