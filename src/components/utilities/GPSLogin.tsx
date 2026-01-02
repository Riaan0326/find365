import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'af-south-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocumentClient.from(client);

interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

const GPSLogin = {
  // Get current GPS coordinates
  getCurrentPosition: (): Promise<GPSCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GPSCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log(`📍 GPSLogin: GPS coordinates loaded successfully - Lat: ${coords.latitude}, Lng: ${coords.longitude}`);
          resolve(coords);
        },
        (error) => {
          console.log('GPS access denied or failed');
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000
        }
      );
    });
  },

  // Update SP login GPS in DynamoDB
  updateSPLoginGPS: async (driverId: number): Promise<GPSCoordinates> => {
    try {
      console.log(`📍 DynamoDB: Updating GPS for SP driver ${driverId}...`);
      
      // Get GPS coordinates
      const coords = await GPSLogin.getCurrentPosition();
      
      // Update SP record with GPS coordinates
      const command = new UpdateCommand({
        TableName: '911-sp-registration',
        Key: {
          'driver-id': driverId
        },
        UpdateExpression: 'SET lat = :lat, lng = :lng, lastLoginGPS = :timestamp',
        ExpressionAttributeValues: {
          ':lat': coords.latitude,
          ':lng': coords.longitude,
          ':timestamp': new Date().toISOString()
        }
      });
      
      console.log(`🔄 GPSLogin: Updating GPS for SP driver ${driverId}`);
      
      await docClient.send(command);
      console.log(`✅ GPSLogin: GPS coordinates saved to database for SP driver ${driverId}`);
      console.log(`🎯 GPSLogin: Login completed with GPS - Lat: ${coords.latitude}, Lng: ${coords.longitude}`);
      
      return coords;
      
    } catch (error) {
      console.error(`❌ DynamoDB GPS update failed:`, error);
      throw error;
    }
  }
};

export default GPSLogin;