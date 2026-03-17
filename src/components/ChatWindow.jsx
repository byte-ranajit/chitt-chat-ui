import { useCallback, useEffect, useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { getInbox } from "../api/chatApi.js";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";

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

    const uniqueConversation = Array.from(
      new Map(
        conversation.map((msg) => {
          const fallbackKey = [msg.sender, msg.receiver, msg.content, msg.createdAt].join("|");
          return [msg.id ?? fallbackKey, msg];
        })
      ).values()
    ).sort((a, b) => {
      const dateA = Date.parse(a.createdAt ?? a.timestamp ?? "");
      const dateB = Date.parse(b.createdAt ?? b.timestamp ?? "");

      if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
        return dateA - dateB;
      }

      if (typeof a.id === "number" && typeof b.id === "number") {
        return a.id - b.id;
      }

      return 0;
    });

    const formatted = uniqueConversation.map((msg) => ({
      ...msg,
      isMe: msg.sender === currentUserName,
    }));

    setMessages(formatted);
  }, [selectedUserName, currentUserName]);

  useEffect(() => {
    const initialFetchId = setTimeout(() => {
      fetchConversation();
    }, 0);

    const pollingId = setInterval(fetchConversation, 5000);

    return () => {
      clearTimeout(initialFetchId);
      clearInterval(pollingId);
    };
  }, [fetchConversation]);

  if (!selectedUser) {
    return <div className="w-3/4 flex items-center justify-center">Select chat</div>;
  }

  return (
    <div className="w-3/4 flex flex-col">
      <div className="p-4 bg-gray-800 border-b">{selectedUserName}</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
      </div>

      <ChatInput selectedUser={selectedUser} setMessages={setMessages} />
    </div>
  );
}

export default ChatWindow;
