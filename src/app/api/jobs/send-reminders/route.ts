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