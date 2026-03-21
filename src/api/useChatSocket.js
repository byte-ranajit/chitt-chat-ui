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
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  useEffect(() => {
    if (!userName) {
      return undefined;
    }

    const baseHttpUrl =
      import.meta.env.VITE_CHAT_HTTP_URL?.trim() || DEFAULT_HTTP_URL;
    const sockJsPath =
      import.meta.env.VITE_CHAT_SOCKJS_PATH?.trim() || DEFAULT_SOCKJS_PATH;
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
        onConnectionChangeRef.current?.(true);

        client.subscribe(`/user/${userName}/queue/messages`, (message) => {
          const parsed = parseSocketMessage(message);

          if (!parsed) {
            return;
          }

          onMessageReceivedRef.current?.(parsed);
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
