import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { getUserName } from "../auth/AuthUtils";

function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUserName = useMemo(() => getUserName(), []);

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
