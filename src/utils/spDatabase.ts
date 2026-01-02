import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'af-south-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export interface ServiceProvider {
  'driver-id': number;
  'driver-name': string;
  'driver-phone': string;
  'driver-email': string;
  'vehicle-type': string;
  'vehicle-make': string;
  'vehicle-model': string;
  'vehicle-year': string;
  'vehicle-color': string;
  'license-plate': string;
  'driver-license': string;
  'registration-date': string;
  'status': string;
  'rating': number;
  'total-trips': number;
  'fcmToken'?: string;
  'lat'?: number;
  'lng'?: number;
  'lastLoginGPS'?: string;
  // Legacy compatibility
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  surname?: string;
  serviceTypes?: string[];
  'sp-code'?: string;
}

export const spDatabase = {
  // Register new service provider
  registerServiceProvider: async (serviceProvider: ServiceProvider): Promise<void> => {
    try {
      console.log('💾 DynamoDB: Registering new service provider...');
      
      const command = new PutCommand({
        TableName: 'find365-sp-registration',
        Item: serviceProvider
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: Service provider registered successfully - ID: ${serviceProvider['driver-id']}`);
      
    } catch (error) {
      console.error('❌ DynamoDB registration error:', error);
      throw error;
    }
  },

  // Get all service providers
  getAllServiceProviders: async (): Promise<ServiceProvider[]> => {
    try {
      console.log('📊 DynamoDB: Fetching all service providers...');
      
      const command = new ScanCommand({
        TableName: 'find365-sp-registration'
      });
      
      const result = await docClient.send(command);
      const providers = result.Items as ServiceProvider[] || [];
      
      console.log(`📈 DynamoDB: Retrieved ${providers.length} service providers`);
      return providers;
      
    } catch (error) {
      console.error('❌ DynamoDB fetch error:', error);
      throw error;
    }
  },

  // Get service provider by ID
  getServiceProviderById: async (driverId: number): Promise<ServiceProvider | null> => {
    try {
      console.log(`🔍 DynamoDB: Fetching service provider ${driverId}...`);
      
      const command = new GetCommand({
        TableName: 'find365-sp-registration',
        Key: { 'driver-id': driverId }
      });
      
      const result = await docClient.send(command);
      const provider = result.Item as ServiceProvider || null;
      
      if (provider) {
        console.log(`✅ DynamoDB: Service provider ${driverId} found`);
      } else {
        console.log(`❌ DynamoDB: Service provider ${driverId} not found`);
      }
      
      return provider;
      
    } catch (error) {
      console.error('❌ DynamoDB get error:', error);
      throw error;
    }
  },

  // Update service provider FCM token
  updateFCMToken: async (driverId: number, fcmToken: string): Promise<void> => {
    try {
      console.log(`🔄 DynamoDB: Updating FCM token for driver ${driverId}...`);
      
      const command = new UpdateCommand({
        TableName: 'find365-sp-registration',
        Key: { 'driver-id': driverId },
        UpdateExpression: 'SET fcmToken = :token',
        ExpressionAttributeValues: { ':token': fcmToken }
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: FCM token updated for driver ${driverId}`);
      
    } catch (error) {
      console.error('❌ DynamoDB FCM update error:', error);
      throw error;
    }
  },

  // Update service provider status
  updateServiceProviderStatus: async (driverId: number, status: string): Promise<void> => {
    try {
      console.log(`🔄 DynamoDB: Updating status for driver ${driverId} to ${status}...`);
      
      const command = new UpdateCommand({
        TableName: 'find365-sp-registration',
        Key: { 'driver-id': driverId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status }
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: Status updated for driver ${driverId} to ${status}`);
      
    } catch (error) {
      console.error('❌ DynamoDB status update error:', error);
      throw error;
    }
  },

  // Delete service provider
  deleteServiceProvider: async (driverId: number): Promise<void> => {
    try {
      console.log(`🗑️ DynamoDB: Deleting service provider ${driverId}...`);
      
      const command = new DeleteCommand({
        TableName: 'find365-sp-registration',
        Key: { 'driver-id': driverId }
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: Service provider ${driverId} deleted successfully`);
      
    } catch (error) {
      console.error('❌ DynamoDB delete error:', error);
      throw error;
    }
  }
};

export const saveServiceProvider = spDatabase.registerServiceProvider;
export const validateServiceProvider = async (phone: string, _password: string) => {
  const providers = await spDatabase.getAllServiceProviders();
  return providers.find(p => p['driver-phone'] === phone);
};