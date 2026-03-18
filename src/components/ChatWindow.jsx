import { useEffect, useState } from "react";
import useChatSocket from "../api/useChatSocket";

function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!selectedUser || !currentUser) {
      setMessages([]);
      return;
    }

    fetch(
      `http://localhost:8080/messages/conversation?sender=${currentUser}&receiver=${selectedUser}`,
    )
      .then((res) => res.json())
      .then(setMessages)
      .catch((error) => {
        console.error("Unable to load messages", error);
        setMessages([]);
      });
  }, [currentUser, selectedUser]);

  const stompClient = useChatSocket(currentUser, (message) => {
    if (
      message.sender === selectedUser ||
      message.receiver === selectedUser
    ) {
      setMessages((prev) => [...prev, message]);
    }
  });

  const sendMessage = (content) => {
    if (!content || !selectedUser || !currentUser) {
      return;
    }

    const message = {
      sender: currentUser,
      receiver: selectedUser,
      content,
    };

    setMessages((prev) => [...prev, { ...message, isMe: true }]);

    stompClient.current?.send?.("/app/chat.send", {}, JSON.stringify(message));
  };

  return (
    <div className="flex-1 p-4">
      <h3 className="mb-3 text-lg font-semibold">
        {selectedUser ? `Chat with ${selectedUser}` : "Select a user to start"}
      </h3>

      <div className="mb-4 h-[400px] overflow-y-auto rounded border border-gray-700 p-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.sender}:</b> {msg.content}
          </div>
        ))}
      </div>

      <input
        className="w-full rounded border border-gray-700 bg-gray-800 p-2"
        placeholder="Type message..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage(e.target.value.trim());
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}

export default ChatWindow;
