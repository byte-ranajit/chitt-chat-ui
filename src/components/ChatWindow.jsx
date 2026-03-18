import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { getInbox } from "../api/chatApi.js";
import { createStompClient } from "../services/stompClient.js";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";

const getMessageKey = (msg) =>
  msg.id ??
  [msg.sender, msg.receiver, msg.content, msg.createdAt ?? msg.timestamp].join(
    "|",
  );

const sortByDateOrId = (a, b) => {
  const dateA = Date.parse(a.createdAt ?? a.timestamp ?? "");
  const dateB = Date.parse(b.createdAt ?? b.timestamp ?? "");

  if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
    return dateA - dateB;
  }

  if (typeof a.id === "number" && typeof b.id === "number") {
    return a.id - b.id;
  }

  return 0;
};

const normalizeConversation = (conversation, currentUserName) =>
  Array.from(
    new Map(conversation.map((msg) => [getMessageKey(msg), msg])).values(),
  )
    .sort(sortByDateOrId)
    .map((msg) => ({
      ...msg,
      isMe: msg.sender === currentUserName,
    }));

function ChatWindow({ selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const stompClientRef = useRef(null);

  const currentUser = getUser();
  const currentUserName = getUserName(currentUser);
  const selectedUserName = selectedUser?.userName ?? selectedUser?.userName;

  const stompEndpoint = useMemo(
    () => import.meta.env.VITE_STOMP_ENDPOINT ?? "http://localhost:8080/chat",
    [],
  );
  const subscribeDestination = useMemo(
    () =>
      import.meta.env.VITE_STOMP_SUBSCRIBE_DESTINATION ?? "/user/queue/messages",
    [],
  );
  const sendDestination = useMemo(
    () => import.meta.env.VITE_STOMP_SEND_DESTINATION ?? "/app/chat.send",
    [],
  );

  const isMessageInConversation = useCallback(
    (msg) =>
      Boolean(selectedUserName) &&
      ((msg.sender === currentUserName && msg.receiver === selectedUserName) ||
        (msg.receiver === currentUserName && msg.sender === selectedUserName)),
    [selectedUserName, currentUserName],
  );

  const fetchConversation = useCallback(async () => {
    if (!selectedUserName || !currentUserName) {
      setMessages([]);
      return;
    }

    const [currentUserInbox, selectedUserInbox] = await Promise.all([
      getInbox(currentUserName),
      getInbox(selectedUserName),
    ]);

    const conversation = [...currentUserInbox, ...selectedUserInbox].filter(
      (msg) =>
        (msg.sender === currentUserName && msg.receiver === selectedUserName) ||
        (msg.receiver === currentUserName && msg.sender === selectedUserName),
    );

    setMessages(normalizeConversation(conversation, currentUserName));
  }, [selectedUserName, currentUserName]);

  const sendRealtimeMessage = useCallback(
    (message) => {
      if (!stompClientRef.current) {
        throw new Error("STOMP client is not initialized");
      }

      stompClientRef.current.send({
        destination: sendDestination,
        body: message,
      });
    },
    [sendDestination],
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchConversation();
    });
  }, [fetchConversation]);

  useEffect(() => {
    if (!currentUserName) return;

    const client = createStompClient({
      endpoint: stompEndpoint,
      subscribeDestination,
      onConnectionChange: setIsRealtimeConnected,
      onMessage: (payload) => {
        const message = payload?.data ?? payload?.message ?? payload;

        if (!message || typeof message !== "object") {
          return;
        }

        if (isMessageInConversation(message)) {
          setMessages((prev) =>
            normalizeConversation([...prev, message], currentUserName),
          );
        }

        fetchConversation();
      },
      onError: (error) => {
        console.error("STOMP connection error", error);
      },
    });

    stompClientRef.current = client;

    return () => {
      stompClientRef.current = null;
      setIsRealtimeConnected(false);
      client.disconnect();
    };
  }, [
    currentUserName,
    stompEndpoint,
    subscribeDestination,
    isMessageInConversation,
    fetchConversation,
  ]);

  useEffect(() => {
    if (!selectedUserName || !currentUserName || isRealtimeConnected) {
      return;
    }

    const pollIntervalMs =
      Number(import.meta.env.VITE_CHAT_POLL_INTERVAL_MS) || 2000;

    const intervalId = setInterval(() => {
      fetchConversation();
    }, pollIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRealtimeConnected, selectedUserName, currentUserName, fetchConversation]);

  if (!selectedUser) {
    return (
      <div className="w-3/4 flex items-center justify-center">Select chat</div>
    );
  }

  return (
    <div className="w-3/4 flex flex-col">
      <div className="p-4 bg-gray-800 border-b">{selectedUserName}</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={getMessageKey(msg)} message={msg} />
        ))}
      </div>

      <ChatInput
        selectedUser={selectedUser}
        setMessages={setMessages}
        sendRealtimeMessage={sendRealtimeMessage}
      />
    </div>
  );
}

export default ChatWindow;
