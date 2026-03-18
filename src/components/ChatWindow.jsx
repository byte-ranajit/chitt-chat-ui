import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useChatSocket from "../api/useChatSocket";
import authApi from "../api/authApi";
import { sendMessage as persistMessage } from "../api/chatApi";

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function asUserName(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return (
      pickFirst(
        value.userName,
        value.username,
        value.name,
        value.sub,
        value.preferred_username,
      ) ?? ""
    );
  }

  return "";
}

function normalizeMessage(message) {
  return {
    ...message,
    id: pickFirst(message.id, message.messageId),
    sender: asUserName(
      pickFirst(
        message.sender,
        message.senderUser,
        message.senderUserName,
        message.senderUsername,
        message.from,
      ),
    ),
    receiver: asUserName(
      pickFirst(
        message.receiver,
        message.receiverUser,
        message.receiverUserName,
        message.receiverUsername,
        message.to,
      ),
    ),
    content:
      pickFirst(
        message.content,
        message.message,
        message.text,
        message.messageContent,
      ) ?? "",
    createdAt: pickFirst(message.createdAt, message.timestamp),
  };
}

function normalizedUser(value) {
  return String(value ?? "").trim().toLowerCase();
}

function userKey(value) {
  return normalizedUser(value);
}

function sameUser(a, b) {
  return userKey(a) !== "" && userKey(a) === userKey(b);
}

function messageKey(message) {
  if (message.id) {
    return `id:${message.id}`;
  }

  return `tmp:${userKey(message.sender)}:${userKey(message.receiver)}:${message.content}:${message.createdAt ?? ""}`;
}

function ChatWindow({ currentUser, selectedUser }) {
  const [messagesByUser, setMessagesByUser] = useState({});
  const [draft, setDraft] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const endOfMessagesRef = useRef(null);
  const selectedUserRef = useRef(selectedUser);

  const selectedUserKey = userKey(selectedUser);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const messages = useMemo(() => {
    if (!selectedUserKey) {
      return [];
    }

    return messagesByUser[selectedUserKey] ?? [];
  }, [messagesByUser, selectedUserKey]);

  const appendMessage = useCallback((conversationUser, incomingMessage) => {
    const normalizedIncoming = normalizeMessage(incomingMessage);
    const conversationKey = userKey(conversationUser);

    if (!conversationKey) {
      return;
    }

    setMessagesByUser((prev) => {
      const existing = prev[conversationKey] ?? [];
      const alreadyExists = existing.some(
        (msg) => messageKey(msg) === messageKey(normalizedIncoming),
      );

      if (alreadyExists) {
        return prev;
      }

      return {
        ...prev,
        [conversationKey]: [...existing, normalizedIncoming],
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
        [selectedUserKey]: loadedMessages,
      }));
    } catch (error) {
      console.error("Unable to load messages", error);
    }
  }, [currentUser, selectedUser, selectedUserKey]);

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


  useEffect(() => {
    if (!selectedUser || !currentUser || isSocketConnected) {
      return;
    }

    const fallbackId = window.setInterval(() => {
      loadConversation();
    }, 4000);

    return () => {
      window.clearInterval(fallbackId);
    };
  }, [currentUser, isSocketConnected, loadConversation, selectedUser]);

  const onMessageReceived = useCallback(
    (incoming) => {
      const message = normalizeMessage(incoming);

      const sentByCurrentUser = sameUser(message.sender, currentUser);
      const receivedByCurrentUser = sameUser(message.receiver, currentUser);

      if (sentByCurrentUser && message.receiver) {
        appendMessage(message.receiver, message);
        return;
      }

      if (receivedByCurrentUser && message.sender) {
        appendMessage(message.sender, message);
        return;
      }

      // Fallback: if we cannot confidently map payload fields, refresh active chat once.
      if (selectedUserRef.current) {
        loadConversation();
      }
    },
    [appendMessage, currentUser, loadConversation],
  );

  useChatSocket(currentUser, onMessageReceived, setIsSocketConnected);

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
            className={`mb-2 flex ${sameUser(msg.sender, currentUser) ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded px-3 py-2 ${
                sameUser(msg.sender, currentUser) ? "bg-green-600" : "bg-gray-700"
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
