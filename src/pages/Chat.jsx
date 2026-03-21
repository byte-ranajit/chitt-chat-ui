import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { getUserName } from "../auth/AuthUtils";

function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(() => getUserName());

  useEffect(() => {
    const refreshCurrentUser = () => {
      setCurrentUserName(getUserName());
    };

    refreshCurrentUser();

    window.addEventListener("storage", refreshCurrentUser);
    window.addEventListener("focus", refreshCurrentUser);
    document.addEventListener("visibilitychange", refreshCurrentUser);

    return () => {
      window.removeEventListener("storage", refreshCurrentUser);
      window.removeEventListener("focus", refreshCurrentUser);
      document.removeEventListener("visibilitychange", refreshCurrentUser);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar onSelectUser={setSelectedUser} />
      <ChatWindow
        currentUser={currentUserName}
        selectedUser={selectedUser?.userName ?? null}
      />
    </div>
  );
}

export default Chat;
