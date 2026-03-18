import { useEffect, useState } from "react";
import { getUser } from "../auth/AuthUtils.js";
import { getInbox, getUsers } from "../api/chatApi";

const getMessageTime = (message) =>
  Date.parse(message?.createdAt ?? message?.timestamp ?? "") || 0;

function Sidebar({
  onSelectUser,
  latestMessagesByUser,
  currentUserName,
  onInitialMessagesLoaded,
}) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const currentUser = getUser();

    const loadUsers = async () => {
      try {
        const [data, inbox] = await Promise.all([
          getUsers(),
          currentUser?.userName ? getInbox(currentUser.userName) : Promise.resolve([]),
        ]);
        console.log("Fetched users:", data);
        const normalizedUsers = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        const filteredUsers = currentUser?.userName
          ? normalizedUsers.filter(
              (user) => user.userName !== currentUser.userName,
            )
          : normalizedUsers;

        setUsers(filteredUsers);

        if (Array.isArray(inbox)) {
          const initialLatestMessages = inbox.reduce((acc, message) => {
            if (!message || typeof message !== "object") {
              return acc;
            }

            const counterpartUserName =
              message.sender === currentUser?.userName
                ? message.receiver
                : message.sender;

            if (!counterpartUserName) {
              return acc;
            }

            const existingMessage = acc[counterpartUserName];
            if (
              !existingMessage ||
              getMessageTime(message) >= getMessageTime(existingMessage)
            ) {
              acc[counterpartUserName] = message;
            }

            return acc;
          }, {});

          onInitialMessagesLoaded((prev) => ({
            ...initialLatestMessages,
            ...prev,
          }));
        }
      } catch (error) {
        console.error("Unable to load users:", error);
        setUsers([]);
      }
    };

    loadUsers();
  }, [onInitialMessagesLoaded]);

  const sortedUsers = [...users].sort((firstUser, secondUser) => {
    const firstLatestMessage = latestMessagesByUser[firstUser.userName];
    const secondLatestMessage = latestMessagesByUser[secondUser.userName];

    return getMessageTime(secondLatestMessage) - getMessageTime(firstLatestMessage);
  });

  return (
    <div className="w-1/4 bg-gray-800 border-r border-gray-700">
      <div className="p-4 text-lg font-semibold border-b border-gray-700">
        Chats
      </div>

      <div className="overflow-y-auto h-full">
        {sortedUsers.map((user) => {
          const latestMessage = latestMessagesByUser[user.userName];
          const latestMessagePreview = latestMessage
            ? `${latestMessage.sender === currentUserName ? "You: " : ""}${latestMessage.content}`
            : "Tap to chat";

          return (
            <div
              key={user.id ?? user.userName}
              role="button"
              tabIndex={0}
              onClick={() => onSelectUser(user)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectUser(user);
                }
              }}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                {user.userName?.[0]?.toUpperCase() ?? "U"}
              </div>

              <div className="min-w-0">
                <div className="font-medium">{user.userName}</div>
                <div className="text-sm text-gray-400 truncate max-w-[180px]">
                  {latestMessagePreview}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
