import SockJS from "sockjs-client";
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";

export default function useChatSocket(userName, onMessageReceived) {
  const clientRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/chat");

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,

      onConnect: () => {
        console.log("Connected to WebSocket");

        client.subscribe(`/user/${userName}/queue/messages`, (message) => {
          const body = JSON.parse(message.body);
          onMessageReceived(body);
        });
      },

      onStompError: (frame) => {
        console.error("Broker error:", frame);
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