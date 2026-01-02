// Simplified Cloudflare Worker using Firebase REST API

// Use HTTP v1 API with service account key directly
async function getAccessToken() {
  const serviceAccount = {
    "type": "service_account",
    "project_id": "rides911-7c105",
    "private_key_id": "8f18bd47031feb22edfa5cd58003b2d01f83860f",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1dXe1iVI6i5Wj\nmt5NI0Bu6SbzUeF0B7EQTfDI3rgCmI1J9Kke2X4J6HhzblEB/+MlLLymkvZnOHAj\nqd/GIdFMbp4Jwn68Qy2oqWfIJcUBShC/3kbTVQwC5o1FcSg2CWVS1AcQubqMJYwA\n4ZTX8m0wE6h9Sy13QqsuIvwqFrCapqeKr+xAwZpNtlPvyU2hFoHIlbaGnPo3nFIY\njYNu2uWdIvPXxPmd93/WMujHNCgt3nykcnn5ThObigx7OTGh807gBm5DkHUcuSMI\nkqbJr1dHyHMFvDUoESyW3CVok2spWVwkiBz5KYgXRAlmTKR57S3oTJGNRda5y53m\nhGIKEKE/AgMBAAECggEAVpBTKyb3MzajjAi1Q9ctRbuz+R92jgOdVEnaM/kLjzF3\nNXChvTXECrX7wBVAT9PiaDmPRWeWZGdoF5tSRRKc5flfKwi9rNHfVjZ6a+CYuqS6\nmM1QvEA2GqwheJ8ir6SL0ZeUR0ZS18iRoVn7x4i+zdCS8DKM3ffP8ZJ++RUZ6qwI\nBipOFk2vTaVSA7KcRvYib34mDWBpPxSKQIYR/ZdqKObxwVC5biMrdeas7L8LtPcd\ndH+CWL8urp+ZOkprGMttaTkPvLTv8nFSpGjhCPAOmrkg0vK0CDEEGkAmmXDkd1+K\nOIxtUoh13nojNvAdbzLDn0t/Uw3BRVbkA9v1ezIMAQKBgQDkUZ/oPZd4tlElplfo\nW18YvLg/Mmdfxs/HzSZi2eKwKkccdkCBK2pt3HdpMB5NRokKK8rYb0B5h7otOlyw\n/8RmkzdueAi9Ojt7rZkPzWXYMgSmI0lPO7+ZbrAvX34YVRuYoYfp3HVUbUzN6HhE\nx5f4Um60OMs9ZGY1ELSzvD0hUQKBgQDLdXDMuEJ0KwJmSWezaK1gWnfiqlz76y78\nXZxt2YskahJi+TXn0W66QNrrH8PnDhcyLgCIcrhh5AGXxSeo9ZXVQ9jAd+fHSKu6\nkUBK2hVsIX4jQSR+uffcbp8+7m0enjshYczLW6yIxAmPdlWl7OToZtcQLM5H8vA0\n/zYwFGF1jwKBgCyZjUUOkwIvixZxsgZfounwI4Wk0PCyo3ACMRdqPI/xEkcLCnqx\nAm9He8P+dEzgFHD6MPuqb8vNqZ6gIe8pZzIqW8+mfv6H24rDVHzzwItE6geSKQXj\nRAAy0RPP8Y/LQELGewhB2mGNoE0wth2pZ5RIdfuahIkPja+b/dCGWuKhAoGAMiZe\niXeZmbzIOKI7V3Oj2K40AsDvboEH8di5KDKJI46pvY+kA+IRowM9cts/lIJaoVnJ\nc9ijLi3fXqOQJQtzxT+V+8sSbIKzIaeP62NaCG8xAkuaTUpVmBYEVqS6bOOfu5i5\nvB56prN7j8shTWbY/ZfrxubkacOuBcIqfytm4m0CgYEAwORsosbudqRlwfJksxO3\nEAd7pv2yqj9tLZNYK3XIxkusFBqA7zuV/qxeco7Qw4aSO7m0bw3i5qhsTSMt5zSp\n4yppUNXSSpM1IBY8GQlbPwTXf6grfvPM1R/XCuVN+XKJb+6YB9WY7p3VTdwUpW57\nnV61cMsW8ZOcyKKwPg11C1o=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@rides911-7c105.iam.gserviceaccount.com"
  };
  
  // Use Google's OAuth endpoint with service account
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await createJWT(serviceAccount)
    })
  });
  
  const data = await response.json();
  return data.access_token;
}

async function createJWT(serviceAccount) {
  // Simplified JWT - in production use proper JWT library
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  
  // Return unsigned JWT for now - proper signing requires crypto implementation
  return `${header}.${payload}.signature`;
}

async function sendFCMNotification(requestData) {
  try {
    console.log('Sending FCM notification for:', requestData.transportType);
    
    // Hardcode your FCM token for testing
    const testToken = 'e1-qveAz77RNOt79i45PIp:APA91bFgkd4EhqpNo3XQN5bCizbx-7jP0dLwV7iUX3CoK7Hzdr1MbQpNShGEGOUyIz6WTjKjx6Rkn3Yc-wDxOR0VH1Uz3E6yrAQIUGsiRtDWfayz5jhDFNw';
    
    const message = {
      message: {
        token: testToken,
        notification: {
          title: 'New Request Available',
          body: `Service: Ride Request\nType: Car\nSuburb: ${requestData.suburb}\nCity: Pretoria\nDistance: 2.3km`
        }
      }
    };
    
    // Use legacy FCM API with server key
    const legacyMessage = {
      to: testToken,
      notification: {
        title: 'New Request Available',
        body: `Service: Ride Request\nType: Car\nSuburb: ${requestData.suburb}\nCity: Pretoria\nDistance: 2.3km`
      }
    };
    
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': 'key=AAAAyNxKhQs:APA91bEQvMxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQsyNxKhQs', // Your server key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(legacyMessage)
    });
    
    console.log('FCM response status:', response.status);
    const result = await response.text();
    console.log('FCM response:', result);
    
    if (response.ok) {
      return {
        success: true,
        notified: 1,
        total: 1,
        message: `FCM notification sent for ${requestData.transportType} in ${requestData.suburb}`
      };
    } else {
      return {
        success: false,
        notified: 0,
        total: 0,
        error: `FCM failed: ${result}`
      };
    }
  } catch (error) {
    console.error('FCM error:', error);
    return {
      success: false,
      notified: 0,
      total: 0,
      error: error.message
    };
  }
}

export default {
  async fetch(request, env, ctx) {
    console.log('Worker started');
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    console.log('Request URL:', url.pathname);

    // Notify SPs endpoint
    if (request.method === 'POST' && url.pathname === '/api/notify-sps') {
      try {
        console.log('Processing notify-sps request');
        const body = await request.json();
        console.log('Request body:', body);
        
        const { requestId, transportType, suburb, pickupLatitude, pickupLongitude } = body;
        
        if (!requestId || !transportType || !pickupLatitude || !pickupLongitude) {
          console.log('Missing required fields');
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Send FCM notification using REST API
        const result = await sendFCMNotification({
          requestId,
          transportType,
          suburb,
          pickupLatitude,
          pickupLongitude
        });
        
        console.log('FCM result:', result);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Error in notify-sps:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Update FCM token endpoint
    if (request.method === 'POST' && url.pathname === '/api/update-fcm-token') {
      try {
        console.log('Processing update-fcm-token request');
        const { spCode, fcmToken } = await request.json();
        
        if (!spCode || !fcmToken) {
          return new Response(JSON.stringify({ error: 'Missing spCode or fcmToken' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('FCM token update for:', spCode);
        
        // For now, just return success
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error in update-fcm-token:', error);
        return new Response(JSON.stringify({ error: 'Failed to update FCM token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('Route not found:', url.pathname);
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};