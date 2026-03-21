import { useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils.js";
import { sendMessage } from "../api/chatApi.js";

function ChatInput({ selectedUser, setMessages }) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    const currentUser = getUser();
    const sender = getUserName(currentUser);
    const receiver = getUserName(selectedUser);

    if (!sender || !receiver) {
      console.error("Cannot send message: sender or receiver is missing", {
        sender,
        receiver,
        currentUser,
        selectedUser,
      });
      return;
    }

    const messagePayload = {
      content: trimmed,
      sender,
      receiver,
    };

    const savedMessage = await sendMessage(messagePayload);

    setMessages((prev) => [
      ...prev,
      {
        ...savedMessage,
        isMe: true,
      },
    ]);

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
