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
    id: pickFirst(message?.id, message?.messageId),
    sender: asUserName(
      pickFirst(
        message?.sender,
        message?.senderUser,
        message?.senderUserName,
        message?.senderUsername,
        message?.from,
      ),
    ),
    receiver: asUserName(
      pickFirst(
        message?.receiver,
        message?.receiverUser,
        message?.receiverUserName,
        message?.receiverUsername,
        message?.to,
      ),
    ),
    content:
      pickFirst(
        message?.content,
        message?.message,
        message?.text,
        message?.messageContent,
      ) ?? "",
    createdAt: pickFirst(message?.createdAt, message?.timestamp),
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
  const endOfMessagesRef = useRef(null);
  const selectedUserRef = useRef(selectedUser);

  const selectedUserKey = useMemo(() => userKey(selectedUser), [selectedUser]);

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

    const timeoutId = setTimeout(() => {
      void loadConversation();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentUser, loadConversation, selectedUser]);

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

      if (selectedUserRef.current) {
        loadConversation();
      }
    },
    [appendMessage, currentUser, loadConversation],
  );

  useChatSocket(currentUser, onMessageReceived);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
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
  }, [appendMessage, currentUser, draft, selectedUser]);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-900/40 p-4 md:p-6">
      <header className="mb-4 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          Active conversation
        </p>
        <h3 className="mt-1 text-lg font-semibold text-white">
          {selectedUser ? `@${selectedUser}` : "Select a user to start chatting"}
        </h3>
      </header>

      <div className="mb-4 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3 md:p-4">
        {!selectedUser ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Pick a conversation from the sidebar.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id ?? `${msg.sender}-${msg.receiver}-${i}`}
              className={`mb-3 flex ${sameUser(msg.sender, currentUser) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl border px-4 py-2 shadow-sm md:max-w-[72%] ${
                  sameUser(msg.sender, currentUser)
                    ? "border-indigo-300/20 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                    : "border-white/10 bg-slate-800 text-slate-100"
                }`}
              >
                <p
                  className={`mb-0.5 text-xs ${
                    sameUser(msg.sender, currentUser)
                      ? "text-indigo-100/90"
                      : "text-slate-400"
                  }`}
                >
                  {msg.sender}
                </p>
                <p className="break-words text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 p-2">
        <input
          value={draft}
          className="w-full rounded-xl border border-transparent bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-300/60"
          placeholder={selectedUser ? "Type your message..." : "Select a user to start typing"}
          disabled={!selectedUser}
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
          disabled={!selectedUser || !draft.trim()}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          Send
        </button>
      </div>
    </section>
  );
}

export default ChatWindow;
