import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: 'af-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'OK', 
          service: 'Find365 Worker',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }

      // Get all service providers
      if (path === '/api/service-providers' && request.method === 'GET') {
        console.log('📊 Worker: Fetching all service providers...');
        
        const command = new ScanCommand({
          TableName: 'find365-sp-registration'
        });
        
        const result = await docClient.send(command);
        const providers = result.Items || [];
        
        console.log(`📈 Worker: Retrieved ${providers.length} service providers`);
        
        return new Response(JSON.stringify({
          success: true,
          data: providers,
          count: providers.length
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }

      // Get all client requests
      if (path === '/api/client-requests' && request.method === 'GET') {
        console.log('📊 Worker: Fetching all client requests...');
        
        const command = new ScanCommand({
          TableName: 'find365-client-requests'
        });
        
        const result = await docClient.send(command);
        const requests = result.Items || [];
        
        console.log(`📈 Worker: Retrieved ${requests.length} client requests`);
        
        return new Response(JSON.stringify({
          success: true,
          data: requests,
          count: requests.length
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }

      // Default 404 response
      return new Response(JSON.stringify({ 
        error: 'Not Found',
        path: path,
        method: request.method
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });

    } catch (error) {
      console.error('❌ Worker Error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }
};