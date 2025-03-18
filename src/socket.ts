import { WebSocketServer } from "ws";
import { Reminder } from "@/types";

const wss = new WebSocketServer({ port: 4000 }); // Start WebSocket server
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("WebSocket client connected");

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket client disconnected");
  });
});

export function broadcastReminder(reminder: Reminder) {
  const message = JSON.stringify({ event: "newReminder", data: reminder });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log("sending new reminder via websocket...")
      client.send(message);
    }
  });
}