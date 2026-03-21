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

export default function useChatSocket(
  userName,
  onMessageReceived,
  onConnectionChange,
) {
  const clientRef = useRef(null);
  const onMessageReceivedRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!userName) {
      return undefined;
    }

    const socket = new SockJS("http://localhost:8080/chat");

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
        onConnectionChangeRef.current?.(true);

        const handleIncoming = (message) => {
          const body = parseSocketMessage(message);

        client.subscribe(`/user/${userName}/queue/messages`, (message) => {
          const body = JSON.parse(message.body);
          onMessageReceivedRef.current?.(body);
        });
      },

      onStompError: (frame) => {
        console.error("Broker error:", frame);
        onConnectionChangeRef.current?.(false);
      },

      onWebSocketError: (event) => {
        console.error("WebSocket connection error:", event);
        onConnectionChangeRef.current?.(false);
      },

      onDisconnect: () => {
        onConnectionChangeRef.current?.(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      onConnectionChangeRef.current?.(false);
    };
  }, [userName]);

  return clientRef;
}
