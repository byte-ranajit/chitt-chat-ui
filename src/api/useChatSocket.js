import { useEffect, useRef } from "react";

export default function useChatSocket(username, onMessageReceived) {
  const stompClient = useRef(null);

  useEffect(() => {
    if (!username) {
      return undefined;
    }

    let isCancelled = false;

    const connect = async () => {
      try {
        const sockJsModuleName = "sockjs-client";
        const stompModuleName = "stompjs";

        const [{ default: SockJS }, stompModule] = await Promise.all([
          import(/* @vite-ignore */ sockJsModuleName),
          import(/* @vite-ignore */ stompModuleName),
        ]);

        if (isCancelled) {
          return;
        }

        const Stomp = stompModule.default ?? stompModule;
        const socket = new SockJS("http://localhost:8080/chat");
        const client = Stomp.over(socket);

        stompClient.current = client;

        client.connect({}, () => {
          client.subscribe(`/user/${username}/queue/messages`, (msg) => {
            const message = JSON.parse(msg.body);
            onMessageReceived(message);
          });
        });
      } catch (error) {
        console.error(
          "Unable to initialize chat socket. Ensure dependencies are installed.",
          error,
        );
      }
    };

    connect();

    return () => {
      isCancelled = true;
      stompClient.current?.disconnect?.();
    };
  }, [username, onMessageReceived]);

  return stompClient;
}
