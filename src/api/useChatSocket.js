import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { getToken } from "../auth/AuthUtils";

const DEFAULT_HTTP_URL = "http://localhost:8080";
const DEFAULT_SOCKJS_PATH = "/chat";

function parseSocketMessage(message) {
  try {
    return JSON.parse(message.body);
  } catch (error) {
    console.error("Unable to parse websocket payload", error, message.body);
    return null;
  }
}

export default function useChatSocket(userName, onMessageReceived) {
  const clientRef = useRef(null);
  const onMessageReceivedRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!userName) {
      return undefined;
    }

    const baseHttpUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_HTTP_URL;
    const sockJsPath = import.meta.env.VITE_SOCKJS_PATH ?? DEFAULT_SOCKJS_PATH;
    const token = getToken();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseHttpUrl}${sockJsPath}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},

      onConnect: () => {
        const handleIncoming = (message) => {
          const body = parseSocketMessage(message);

          if (!body) {
            return;
          }

          onMessageReceivedRef.current?.(body);
        };

        client.subscribe("/user/queue/messages", handleIncoming);
      },

      onStompError: (frame) => {
        console.error("Broker error:", frame);
      },

      onWebSocketError: (event) => {
        console.error("WebSocket connection error:", event);
      },

      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [userName]);

  return clientRef;
}
