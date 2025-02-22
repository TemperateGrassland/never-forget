export async function POST(req: Request) {
    try {
      // const { phoneNumber, message } = await req.json(); // Get data from client request
  
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            "messaging_product": "whatsapp",
            "to": "+447816410701",
            "type": "template",
            "template": {
                "name": "reminder",
                "language": {
                    "code": "en_GB",
                    "policy": "deterministic"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "parameter_name": "text",
                                "text": "Mobo"
                            },
                            {
                                "type": "text",
                                "parameter_name": "reminder_1",
                                "text": "Drive to Winslow"
                            },
                            {
                                "type": "text",
                                "parameter_name": "when_1",
                                "text": "Today"
                            },
                            {
                                "type": "text",
                                "parameter_name": "reminder_2",
                                "text": "Take care of Simbi and Chai"
                            },
                            {
                                "type": "text",
                                "parameter_name": "when_2",
                                "text": "Always"
                            },
                            {
                                "type": "text",
                                "parameter_name": "reminder_3",
                                "text": "Get shit together"
                            },
                            {
                                "type": "text",
                                "parameter_name": "when_3",
                                "text": "Maybe tomorrow?"
                            }
                        ]
                    }
                ]
            }
          }
        ),
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