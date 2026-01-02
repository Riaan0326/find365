import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: 'af-south-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export interface ClientRequest {
  'request-id': string;
  'client-name': string;
  'client-phone': string;
  'pickup-address': string;
  'destination-address': string;
  'service-type': string;
  'request-time': string;
  'pickup-lat': number;
  'pickup-lng': number;
  'destination-lat': number;
  'destination-lng': number;
  'status': string;
  'driver-id'?: number;
  'driver-name'?: string;
  'driver-phone'?: string;
  'estimated-price'?: number;
  'final-price'?: number;
  'payment-status'?: string;
  'completion-time'?: string;
  // Legacy compatibility
  fullName?: string;
  phone?: string;
  transportType?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  clickCount?: number;
  createdAt?: string;
  timestamp?: string;
  'client-request-id'?: string;
}

export const database = {
  // Save client request to DynamoDB
  saveClientRequest: async (request: ClientRequest): Promise<void> => {
    try {
      console.log('💾 DynamoDB: Saving client request...');
      
      const command = new PutCommand({
        TableName: 'find365-client-requests',
        Item: request
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: Client request saved successfully - ID: ${request['request-id']}`);
      
    } catch (error) {
      console.error('❌ DynamoDB save error:', error);
      throw error;
    }
  },

  // Get all client requests
  getAllClientRequests: async (): Promise<ClientRequest[]> => {
    try {
      console.log('📊 DynamoDB: Fetching all client requests...');
      
      const command = new ScanCommand({
        TableName: 'find365-client-requests'
      });
      
      const result = await docClient.send(command);
      const requests = result.Items as ClientRequest[] || [];
      
      console.log(`📈 DynamoDB: Retrieved ${requests.length} client requests`);
      return requests;
      
    } catch (error) {
      console.error('❌ DynamoDB fetch error:', error);
      throw error;
    }
  },

  // Update request status
  updateRequestStatus: async (requestId: string, status: string, driverId?: number, driverName?: string, driverPhone?: string): Promise<void> => {
    try {
      console.log(`🔄 DynamoDB: Updating request ${requestId} status to ${status}...`);
      
      let updateExpression = 'SET #status = :status';
      const expressionAttributeNames: any = { '#status': 'status' };
      const expressionAttributeValues: any = { ':status': status };
      
      if (driverId) {
        updateExpression += ', #driverId = :driverId, #driverName = :driverName, #driverPhone = :driverPhone';
        expressionAttributeNames['#driverId'] = 'driver-id';
        expressionAttributeNames['#driverName'] = 'driver-name';
        expressionAttributeNames['#driverPhone'] = 'driver-phone';
        expressionAttributeValues[':driverId'] = driverId;
        expressionAttributeValues[':driverName'] = driverName;
        expressionAttributeValues[':driverPhone'] = driverPhone;
      }
      
      const command = new UpdateCommand({
        TableName: 'find365-client-requests',
        Key: { 'request-id': requestId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: Request ${requestId} status updated to ${status}`);
      
    } catch (error) {
      console.error('❌ DynamoDB update error:', error);
      throw error;
    }
  },

  // Delete client request
  deleteClientRequest: async (requestId: string): Promise<void> => {
    try {
      console.log(`🗑️ DynamoDB: Deleting request ${requestId}...`);
      
      const command = new DeleteCommand({
        TableName: 'find365-client-requests',
        Key: { 'request-id': requestId }
      });
      
      await docClient.send(command);
      console.log(`✅ DynamoDB: Request ${requestId} deleted successfully`);
      
    } catch (error) {
      console.error('❌ DynamoDB delete error:', error);
      throw error;
    }
  }
};

export const saveClientRequest = database.saveClientRequest;
export const getClientRequests = database.getAllClientRequests;

export const serviceTypeMapping = {
  'ride': 'Ride',
  'delivery': 'Delivery', 
  'assistance': 'Assistance',
  'tour': 'Tour'
};