import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useEffect, useRef } from "react";

export default function useChatSocket(username, onMessageReceived) {
  const stompClient = useRef(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/chat");
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect({}, () => {
      stompClient.current.subscribe(
        `/user/${username}/queue/messages`,
        (msg) => {
          const message = JSON.parse(msg.body);
          onMessageReceived(message);
        }
      );
    });

    return () => {
      stompClient.current?.disconnect();
    };
  }, [username]);

  return stompClient;
}