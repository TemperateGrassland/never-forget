import { buildMetaApiRequests } from '@/lib/metaApiService';

export async function GET() {
  try {
    // Generate API request JSON for each user
    const metaRequests = await buildMetaApiRequests();

    console.log("metaRequests:", JSON.stringify(metaRequests, null, 2));

    // Send HTTP requests to Meta API
    const responses = await Promise.all(metaRequests.map(async (request) => {
      const response = await fetch('https://graph.facebook.com/YOUR_VERSION/YOUR_PHONE_ID/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return response.json();
    }));

    return Response.json({ success: true, responses });
  } catch (error) {
    console.error('Cron Job Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DUMMY CRONJOB - uncomment the above when ready

// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(req: NextRequest) {
//   try {
//     const apiUrl = process.env.WHATSAPP_API;

//     if (!apiUrl) {
//       throw new Error('WHATSAPP_API environment variable is not defined.');
//     }

//     const requestBody = process.env.POST_REQUEST_BODY;
    

//     if (!requestBody){
//       throw new Error('POST_REQUEST_BODY environment variable is not defined.');
//     }

//     // Get the meta application access key
//     const accessToken = process.env.WHATSAPP_CRON_SECRET;

//     if (!accessToken){
//       throw new Error('WHATSAPP_CRON_SECRET environment variable is not defined.');
//     }

//     const parsedBody = JSON.parse(requestBody);

//     const response = await fetch(apiUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${accessToken}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(parsedBody),
//     });

//     if (!response.ok) {
//       const errorText = await response.text(); // Capture full error response
//       throw new Error(`Request failed with status ${response.status}: ${errorText}`);
//     }

//     const data = await response.json();
//     console.log('Request successful:', data);

//     return NextResponse.json({ status: 'Success', data });
//   } catch (error) {
    
//     console.error('Error making request:', error);
//     return NextResponse.json({ status: 'Error', message: error.message });
//   }
// }