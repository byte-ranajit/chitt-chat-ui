import { useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { sendMessage } from "../api/chatApi.js";
import { normalizeMessage } from "../utils/messageUtils";

function ChatInput({
  selectedUser,
  setMessages,
  sendRealtimeMessage,
  onMessageActivity,
}) {
  const [text, setText] = useState("");
  const currentUser = getUser();

  const handleSend = async () => {
    if (!text.trim()) return;

    const sender = getUserName(currentUser);
    const receiver = selectedUser?.userName ?? selectedUser?.userName;

    if (!sender || !receiver) {
      console.error("Cannot send message: sender or receiver is missing", {
        sender,
        receiver,
        currentUser,
        selectedUser,
      });
      return;
    }

    const newMsg = {
      content: text,
      sender,
      receiver,
    };

    try {
      sendRealtimeMessage(newMsg);

      const optimisticMessage = {
        ...newMsg,
        isMe: true,
        timestamp: new Date().toISOString(),
      };

      onMessageActivity?.(optimisticMessage);

      setMessages((prev) => [
        ...prev,
        optimisticMessage,
      ]);
    } catch (stompError) {
      console.error("Realtime send failed, falling back to REST", stompError);

      const res = await sendMessage(newMsg);
      const normalizedResponse = normalizeMessage(res) ?? {
        ...newMsg,
        timestamp: new Date().toISOString(),
      };

      onMessageActivity?.(normalizedResponse);

      setMessages((prev) => [
        ...prev,
        {
          ...normalizedResponse,
          isMe: true,
        },
      ]);
    }

    setText("");
  };

  return (
    <div className="flex p-3 bg-gray-800">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-2 bg-gray-700 rounded outline-none"
        placeholder="Type a message..."
      />

      <button onClick={handleSend} className="ml-2 px-4 bg-green-600 rounded">
        Send
      </button>
    </div>
  );
}

export default ChatInput;
