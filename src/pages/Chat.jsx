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
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <section className="mx-auto flex h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/30 backdrop-blur md:h-[calc(100vh-4rem)]">
        <Sidebar
          onSelectUser={setSelectedUser}
          selectedUserName={selectedUser?.userName ?? null}
          currentUserName={currentUserName}
        />
        <ChatWindow
          currentUser={currentUserName}
          selectedUser={selectedUser?.userName ?? null}
        />
      </section>
    </main>
  );
}

export default Chat;
