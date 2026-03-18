import { useCallback, useEffect, useRef, useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { getInbox } from "../api/chatApi.js";
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
  const bottomRef = useRef(null);

  const currentUser = getUser();
  const currentUserName = getUserName(currentUser);
  const selectedUserName = selectedUser?.userName ?? selectedUser?.userName;

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

  useEffect(() => {
    queueMicrotask(() => {
      fetchConversation();
    });
  }, [fetchConversation]);

  useEffect(() => {
    if (!selectedUserName || !currentUserName) return;

    const pollIntervalMs = Number(import.meta.env.VITE_CHAT_POLL_INTERVAL_MS) || 2000;

    const intervalId = setInterval(() => {
      fetchConversation();
    }, pollIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchConversation, selectedUserName, currentUserName]);

  useEffect(() => {
    if (!currentUserName) return;

    const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
    const socket = new WebSocket(`${wsUrl}/messages/${currentUserName}`);

    socket.onmessage = (event) => {
      if (!selectedUserName) return;

      try {
        const payload = JSON.parse(event.data);
        const message = payload?.data ?? payload?.message ?? payload;

        const belongsToOpenConversation =
          (message.sender === currentUserName &&
            message.receiver === selectedUserName) ||
          (message.receiver === currentUserName &&
            message.sender === selectedUserName);

        if (belongsToOpenConversation) {
          setMessages((prev) =>
            normalizeConversation([...prev, message], currentUserName),
          );
        }

        fetchConversation();
      } catch (error) {
        console.error("Unable to parse incoming websocket payload", error);
        fetchConversation();
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket connection error", error);
    };

    return () => {
      socket.close();
    };
  }, [currentUserName, selectedUserName, fetchConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedUserName]);

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
        <div ref={bottomRef} />
      </div>

      <ChatInput selectedUser={selectedUser} setMessages={setMessages} />
    </div>
  );
}

export default ChatWindow;
