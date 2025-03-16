import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ noServer: true });
const clients = new Set();import { WebSocketServer } from "ws";

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

export function broadcastReminder(reminder: any) {
  const message = JSON.stringify({ event: "newReminder", data: reminder });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastReminder(reminder: any) {
  const message = JSON.stringify({ event: "newReminder", data: reminder });
  clients.forEach((client: any) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

export function setupWebSocket(server: any) {
  server.on("upgrade", (req: any, socket: any, head: any) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      clients.add(ws);
      console.log("WebSocket client connected");

      ws.on("close", () => {
        clients.delete(ws);
        console.log("WebSocket client disconnected");
      });
    });
  });
}