import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
    //   const { message } = await req.json(); // Get data from client request
  
      // Simulating API processing (e.g., calling an external API)
      console.log("Message received:");
  
      return Response.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
      console.error("Error:", error);
      return Response.json({ success: false, error: "Failed to send message" }, { status: 500 });
    }
  }