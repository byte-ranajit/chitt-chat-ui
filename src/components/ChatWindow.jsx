import { useEffect, useRef, useState } from "react";
import useChatSocket from "../api/useChatSocket";
import authApi from "../api/authApi";
import { sendMessage as persistMessage } from "../api/chatApi";

function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!selectedUser || !currentUser) {
      setMessages([]);
      return;
    }

    authApi
      .get(
        `/messages/conversation?sender=${encodeURIComponent(currentUser)}&receiver=${encodeURIComponent(selectedUser)}`,
      )
      .then((res) => setMessages(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error("Unable to load messages", error);
        setMessages([]);
      });
  }, [currentUser, selectedUser]);

  useChatSocket(currentUser, (message) => {
    if (message.sender === selectedUser || message.receiver === selectedUser) {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) =>
            msg.id &&
            message.id &&
            String(msg.id) === String(message.id),
        );

        if (alreadyExists) {
          return prev;
        }

        return [...prev, message];
      });
    }
  });

  useEffect(() => {
    if (!messagesContainerRef.current) {
      return;
    }

    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (content) => {
    if (!content || !selectedUser || !currentUser) {
      return;
    }

    const messagePayload = {
      sender: currentUser,
      receiver: selectedUser,
      content,
    };

    try {
      const savedMessage = await persistMessage(messagePayload);
      setMessages((prev) => [...prev, savedMessage ?? messagePayload]);
    } catch (error) {
      console.error("Unable to send message", error);
    }
  };

  return (
    <div className="flex-1 p-4">
      <h3 className="mb-3 text-lg font-semibold">
        {selectedUser ? `Chat with ${selectedUser}` : "Select a user to start"}
      </h3>

      <div
        ref={messagesContainerRef}
        className="mb-4 h-[400px] overflow-y-auto rounded border border-gray-700 p-3"
      >
        {messages.map((msg, i) => (
          <div key={msg.id ?? `${msg.sender}-${msg.receiver}-${i}`}>
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
