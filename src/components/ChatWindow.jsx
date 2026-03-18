import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useChatSocket from "../api/useChatSocket";
import authApi from "../api/authApi";
import { sendMessage as persistMessage } from "../api/chatApi";

function normalizeMessage(message) {
  return {
    ...message,
    sender: message.sender ?? "",
    receiver: message.receiver ?? "",
    content: message.content ?? "",
  };
}

function messageKey(message) {
  if (message.id) {
    return `id:${message.id}`;
  }

  return `tmp:${message.sender}:${message.receiver}:${message.content}:${message.createdAt ?? ""}`;
}

function ChatWindow({ currentUser, selectedUser }) {
  const [messagesByUser, setMessagesByUser] = useState({});
  const [draft, setDraft] = useState("");
  const endOfMessagesRef = useRef(null);
  const selectedUserRef = useRef(selectedUser);

  const messages = useMemo(() => {
    if (!selectedUser) {
      return [];
    }

    return messagesByUser[selectedUser] ?? [];
  }, [messagesByUser, selectedUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const appendMessage = useCallback((conversationUser, incomingMessage) => {
    const normalizedIncoming = normalizeMessage(incomingMessage);

    setMessagesByUser((prev) => {
      const existing = prev[conversationUser] ?? [];
      const alreadyExists = existing.some(
        (msg) => messageKey(msg) === messageKey(normalizedIncoming),
      );

      if (alreadyExists) {
        return prev;
      }

      return {
        ...prev,
        [conversationUser]: [...existing, normalizedIncoming],
      };
    });
  }, []);

  const loadConversation = useCallback(async () => {
    if (!selectedUser || !currentUser) {
      return;
    }

    try {
      const res = await authApi.get(
        `/messages/conversation?sender=${encodeURIComponent(currentUser)}&receiver=${encodeURIComponent(selectedUser)}`,
      );

      const loadedMessages = Array.isArray(res.data)
        ? res.data.map(normalizeMessage)
        : [];

      setMessagesByUser((prev) => ({
        ...prev,
        [selectedUser]: loadedMessages,
      }));
    } catch (error) {
      console.error("Unable to load messages", error);
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !currentUser) {
      return;
    }

    const initialLoadId = window.setTimeout(() => {
      loadConversation();
    }, 0);

    return () => {
      window.clearTimeout(initialLoadId);
    };
  }, [currentUser, loadConversation, selectedUser]);

  const onMessageReceived = useCallback(
    (message) => {
      const activeUser = selectedUserRef.current;

      if (!activeUser) {
        return;
      }

      const isForActiveConversation =
        (message.sender === activeUser && message.receiver === currentUser) ||
        (message.sender === currentUser && message.receiver === activeUser);

      if (isForActiveConversation) {
        appendMessage(activeUser, message);
      }
    },
    [appendMessage, currentUser],
  );

  useChatSocket(currentUser, onMessageReceived);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = draft.trim();

    if (!trimmed || !selectedUser || !currentUser) {
      return;
    }

    const messagePayload = {
      sender: currentUser,
      receiver: selectedUser,
      content: trimmed,
    };

    try {
      const savedMessage = await persistMessage(messagePayload);
      appendMessage(selectedUser, savedMessage ?? messagePayload);
      setDraft("");
    } catch (error) {
      console.error("Unable to send message", error);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4">
      <h3 className="mb-3 text-lg font-semibold">
        {selectedUser ? `Chat with ${selectedUser}` : "Select a user to start"}
      </h3>

      <div className="mb-4 h-[400px] overflow-y-auto rounded border border-gray-700 p-3">
        {messages.map((msg, i) => (
          <div
            key={msg.id ?? `${msg.sender}-${msg.receiver}-${i}`}
            className={`mb-2 flex ${msg.sender === currentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded px-3 py-2 ${
                msg.sender === currentUser ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              <p className="text-xs text-gray-200">{msg.sender}</p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2"
          placeholder="Type message..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="rounded bg-green-600 px-4 py-2 font-medium hover:bg-green-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
