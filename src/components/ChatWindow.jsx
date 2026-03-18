import { useEffect, useState } from "react";;
import useChatSocket from "../api/useChatSocket";
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

function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);

  // ✅ Load only once
  useEffect(() => {
    if (!selectedUser) return;

    fetch(
      `http://localhost:8080/messages/conversation?sender=${currentUser}&receiver=${selectedUser}`
    )
      .then((res) => res.json())
      .then(setMessages);
  }, [selectedUser]);

  // ✅ WebSocket
  const stompClient = useChatSocket(currentUser, (message) => {
    if (
      message.sender === selectedUser ||
      message.receiver === selectedUser
    ) {
      setMessages((prev) => [...prev, message]);
    }
  });

  // ✅ Send message (Optimistic UI)
  const sendMessage = (content) => {
    const message = {
      sender: currentUser,
      receiver: selectedUser,
      content,
    };

    // instant UI update
    setMessages((prev) => [...prev, { ...message, isMe: true }]);

    stompClient.current.send(
      "/app/chat.send",
      {},
      JSON.stringify(message)
    );
  };

  return (
    <div>
      <h3>{selectedUser}</h3>

      <div style={{ height: "400px", overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.sender}:</b> {msg.content}
          </div>
        ))}
      </div>

      <input
        placeholder="Type message..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage(e.target.value);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}

export default ChatWindow;
