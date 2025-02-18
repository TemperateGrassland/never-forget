export async function POST(req: Request) {
    try {
    //   const { phoneNumber, message } = await req.json(); // Get data from client request
  
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber, // Dynamic phone number
            type: "text",
            text: { body: message }, // Dynamic message
          }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(`Error: ${result.error?.message || "Failed to send message"}`);
      }
  
      return Response.json({ success: true, data: result });
    } catch (error) {
      console.error("WhatsApp API Error:", error);
      return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }