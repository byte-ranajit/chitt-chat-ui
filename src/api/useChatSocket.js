import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getToken } from "../auth/AuthUtils";

const DEFAULT_WS_URL = "ws://localhost:8080/chat/websocket";

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

    const token = getToken();

    const client = new Client({
      brokerURL: import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL,
      reconnectDelay: 5000,
      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},

      onConnect: () => {
        console.log("Connected to WebSocket");

        const handleIncoming = (message) => {
          const body = parseSocketMessage(message);

          if (!body) {
            return;
          }

          onMessageReceivedRef.current?.(body);
        };

        const subscriptionDestinations = [
          "/user/queue/messages",
          `/user/${userName}/queue/messages`,
          "/topic/messages",
          "/topic/public",
        ];

        subscriptionDestinations.forEach((destination) => {
          client.subscribe(destination, handleIncoming);
        });
      },

      onStompError: (frame) => {
        console.error("Broker error:", frame);
      },

      onWebSocketError: (event) => {
        console.error("WebSocket connection error:", event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [userName]);

  return clientRef;
}
