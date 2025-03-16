import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";

interface SocketServer extends NetServer {
  io?: ServerIO;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const server = res.socket?.server as SocketServer;

  if (!server.io) {
    const io = new ServerIO(server);
    server.io = io;

    io.on("connection", (socket) => {
      console.log("User connected");

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });
  }

  res.end();
}