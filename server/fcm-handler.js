const express = require('express');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new DynamoDBClient({
  region: 'af-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

const app = express();
app.use(cors());
app.use(express.json());

// Send FCM notification to all service providers
app.post('/send-notification', async (req, res) => {
  try {
    const { message, title, data } = req.body;
    
    console.log('📱 FCM: Starting notification broadcast...');
    
    // Get all service providers from DynamoDB
    const scanCommand = new ScanCommand({
      TableName: '911-sp-registration',
      ProjectionExpression: '#driverId, fcmToken',
      ExpressionAttributeNames: {
        '#driverId': 'driver-id'
      }
    });
    
    const result = await docClient.send(scanCommand);
    const serviceProviders = result.Items || [];
    
    console.log(`📊 FCM: Found ${serviceProviders.length} service providers`);
    
    // Filter out SPs without FCM tokens
    const validTokens = serviceProviders
      .filter(sp => sp.fcmToken && sp.fcmToken.trim() !== '')
      .map(sp => sp.fcmToken);
    
    console.log(`🎯 FCM: ${validTokens.length} valid FCM tokens found`);
    
    if (validTokens.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No valid FCM tokens found',
        sentCount: 0
      });
    }
    
    // Prepare FCM message
    const fcmMessage = {
      notification: {
        title: title || 'New Client Request',
        body: message || 'A new client request is available'
      },
      data: data || {}
    };
    
    // Send to all tokens
    const response = await admin.messaging().sendEachForMulticast({
      tokens: validTokens,
      ...fcmMessage
    });
    
    console.log(`✅ FCM: Notification sent successfully`);
    console.log(`📈 FCM: Success count: ${response.successCount}`);
    console.log(`❌ FCM: Failure count: ${response.failureCount}`);
    
    res.status(200).json({
      success: true,
      message: 'Notifications sent successfully',
      sentCount: response.successCount,
      failureCount: response.failureCount
    });
    
  } catch (error) {
    console.error('❌ FCM Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'FCM Handler' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 FCM Handler server running on port ${PORT}`);
});