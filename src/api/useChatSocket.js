import SockJS from "sockjs-client";
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getToken } from "../auth/AuthUtils";

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

    const socket = new SockJS("http://localhost:8080/chat");
    const token = getToken();

    const client = new Client({
      webSocketFactory: () => socket,
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

        client.subscribe("/user/queue/messages", handleIncoming);
        client.subscribe(`/user/${userName}/queue/messages`, handleIncoming);
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
