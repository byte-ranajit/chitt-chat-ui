import { useCallback, useEffect, useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { getInbox } from "../api/chatApi.js";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";

const getMessageKey = (msg) =>
  msg.id ?? [msg.sender, msg.receiver, msg.content, msg.createdAt ?? msg.timestamp].join("|");

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
  Array.from(new Map(conversation.map((msg) => [getMessageKey(msg), msg])).values())
    .sort(sortByDateOrId)
    .map((msg) => ({
      ...msg,
      isMe: msg.sender === currentUserName,
    }));

function ChatWindow({ selectedUser }) {
  const [messages, setMessages] = useState([]);

  const currentUser = getUser();
  const currentUserName = getUserName(currentUser);
  const selectedUserName = selectedUser?.userName ?? selectedUser?.username;

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
        (msg.receiver === currentUserName && msg.sender === selectedUserName)
    );

    setMessages(normalizeConversation(conversation, currentUserName));
  }, [selectedUserName, currentUserName]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchConversation();
    });
  }, [fetchConversation]);

  useEffect(() => {
    if (!currentUserName) return;

    const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
    const socket = new WebSocket(`${wsUrl}/messages/${currentUserName}`);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (!selectedUserName) return;

        const belongsToOpenConversation =
          (payload.sender === currentUserName && payload.receiver === selectedUserName) ||
          (payload.receiver === currentUserName && payload.sender === selectedUserName);

        if (!belongsToOpenConversation) return;

        setMessages((prev) => normalizeConversation([...prev, payload], currentUserName));
      } catch (error) {
        console.error("Unable to parse incoming websocket payload", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket connection error", error);
    };

    return () => {
      socket.close();
    };
  }, [currentUserName, selectedUserName]);

  if (!selectedUser) {
    return <div className="w-3/4 flex items-center justify-center">Select chat</div>;
  }

  return (
    <div className="w-3/4 flex flex-col">
      <div className="p-4 bg-gray-800 border-b">{selectedUserName}</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={getMessageKey(msg)} message={msg} />
        ))}
      </div>

      <ChatInput selectedUser={selectedUser} setMessages={setMessages} />
    </div>
  );
}

export default ChatWindow;
