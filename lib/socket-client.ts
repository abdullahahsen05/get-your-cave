import { io, type Socket } from "socket.io-client";

import { SOCKET_EVENTS } from "@/lib/socket/events";

type MessagingSocket = Socket;

let messagingSocket: MessagingSocket | null = null;

export function getMessagingSocket() {
  if (!messagingSocket) {
    messagingSocket = io({
      path: "/socket.io",
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }

  return messagingSocket;
}

export function closeMessagingSocket() {
  messagingSocket?.removeAllListeners();
  messagingSocket?.disconnect();
  messagingSocket = null;
}

export { SOCKET_EVENTS };
