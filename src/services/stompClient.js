import { getToken } from "../auth/AuthUtils.js";

const NULL_CHAR = "\u0000";

const toWebSocketUrl = (httpUrl) =>
  httpUrl.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");

const createSockJsUrl = (endpoint) => {
  const serverId = `${Math.floor(Math.random() * 1000)}`.padStart(3, "0");
  const sessionId = Math.random().toString(36).slice(2, 10);
  return `${toWebSocketUrl(endpoint)}/${serverId}/${sessionId}/websocket`;
};

const buildFrame = (command, headers = {}, body = "") => {
  const headerLines = Object.entries(headers).map(
    ([key, value]) => `${key}:${value}`,
  );
  const frame = [command, ...headerLines, "", body].join("\n");
  return `${frame}${NULL_CHAR}`;
};

const parseFrame = (rawFrame) => {
  const [head = "", ...bodyParts] = rawFrame.split("\n\n");
  const [command, ...headerLines] = head.split("\n").filter(Boolean);

  const headers = headerLines.reduce((acc, line) => {
    const [key, ...valueParts] = line.split(":");
    if (!key) return acc;

    acc[key] = valueParts.join(":");
    return acc;
  }, {});

  return {
    command,
    headers,
    body: bodyParts.join("\n\n"),
  };
};

export const createStompClient = ({
  endpoint,
  subscribeDestination,
  connectHeaders = {},
  onConnect,
  onConnectionChange,
  onMessage,
  onError,
  reconnectDelay = 3000,
}) => {
  let socket = null;
  let connected = false;
  let shouldReconnect = true;
  let reconnectTimeout = null;

  const scheduleReconnect = () => {
    if (!shouldReconnect) return;

    reconnectTimeout = window.setTimeout(() => {
      connect();
    }, reconnectDelay);
  };

  const sendSockJsPayload = (frame) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("STOMP client is not connected");
    }

    socket.send(JSON.stringify([frame]));
  };

  const setConnected = (value) => {
    if (connected === value) return;
    connected = value;
    onConnectionChange?.(connected);
  };

  const handleStompFrame = (rawFrame) => {
    const frame = parseFrame(rawFrame);

    if (frame.command === "CONNECTED") {
      setConnected(true);

      sendSockJsPayload(
        buildFrame("SUBSCRIBE", {
          id: "chat-subscription-0",
          destination: subscribeDestination,
        }),
      );

      onConnect?.(frame);
      return;
    }

    if (frame.command === "MESSAGE") {
      try {
        onMessage?.(JSON.parse(frame.body), frame);
      } catch {
        onMessage?.(frame.body, frame);
      }
      return;
    }

    if (frame.command === "ERROR") {
      onError?.(new Error(frame.body || "STOMP server error"), frame);
    }
  };

  const connect = () => {
    try {
      socket = new WebSocket(createSockJsUrl(endpoint));

      socket.onmessage = (event) => {
        const payload = String(event.data);

        if (payload === "o") {
          const authToken = getToken();
          sendSockJsPayload(
            buildFrame("CONNECT", {
              "accept-version": "1.2,1.1,1.0",
              "heart-beat": "10000,10000",
              ...(authToken
                ? {
                    Authorization: `Bearer ${authToken}`,
                    authorization: `Bearer ${authToken}`,
                  }
                : {}),
              ...connectHeaders,
            }),
          );
          return;
        }

        if (payload === "h") {
          return;
        }

        if (payload.startsWith("a")) {
          const frames = JSON.parse(payload.slice(1));
          frames.forEach((rawFrame) => {
            String(rawFrame)
              .split(NULL_CHAR)
              .filter(Boolean)
              .forEach(handleStompFrame);
          });
          return;
        }

        if (payload.startsWith("c")) {
          setConnected(false);
          onError?.(new Error("SockJS connection closed by server"));
        }
      };

      socket.onerror = (event) => {
        onError?.(new Error("STOMP socket error"), event);
      };

      socket.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };
    } catch (error) {
      setConnected(false);
      onError?.(error);
      scheduleReconnect();
    }
  };

  const send = ({ destination, body, headers = {} }) => {
    if (!connected) {
      throw new Error("STOMP client is not connected");
    }

    sendSockJsPayload(
      buildFrame(
        "SEND",
        {
          destination,
          "content-type": "application/json",
          ...headers,
        },
        typeof body === "string" ? body : JSON.stringify(body),
      ),
    );
  };

  const disconnect = () => {
    shouldReconnect = false;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (socket && socket.readyState === WebSocket.OPEN && connected) {
      sendSockJsPayload(buildFrame("DISCONNECT"));
      socket.close();
      return;
    }

    socket?.close();
    setConnected(false);
  };

  connect();

  return {
    disconnect,
    send,
    isConnected: () => connected,
  };
};
