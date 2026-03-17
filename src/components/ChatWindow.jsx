import { useEffect, useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { getInbox } from "../api/chatApi.js";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";

function ChatWindow({ selectedUser }) {
  const [messages, setMessages] = useState([]);
  const currentUser = getUser();
  const currentUserName = getUserName(currentUser);
  const selectedUserName = selectedUser?.userName ?? selectedUser?.username;

  useEffect(() => {
    if (!selectedUserName || !currentUserName) return;

    getInbox(currentUserName).then((data) => {
      const filtered = data.filter(
        (msg) =>
          (msg.sender === currentUserName && msg.receiver === selectedUserName) ||
          (msg.receiver === currentUserName && msg.sender === selectedUserName)
      );

      const formatted = filtered.map((msg) => ({
        ...msg,
        isMe: msg.sender === currentUserName,
      }));

      setMessages(formatted);
    });
  }, [selectedUserName, currentUserName]);

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
