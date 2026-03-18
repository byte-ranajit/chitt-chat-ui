import { useEffect, useMemo, useState } from "react";
import { getUser } from "../auth/AuthUtils.js";
import { getUsers } from "../api/chatApi";

function Sidebar({ onSelectUser, selectedUserName }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const currentUser = getUser();

    const loadUsers = async () => {
      try {
        const data = await getUsers();
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
      } catch (error) {
        console.error("Unable to load users:", error);
        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.userName.localeCompare(b.userName)),
    [users],
  );

  return (
    <aside className="hidden w-full max-w-sm flex-col border-r border-white/10 bg-slate-950/60 p-5 md:flex">
      <header className="mb-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
        <h1 className="text-lg font-semibold text-white">Chats</h1>
        <p className="mt-1 text-xs text-slate-400">Pick a person to start a conversation.</p>
      </header>

      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Conversations
        </h2>
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200">
          {sortedUsers.length}
        </span>
      </div>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto pr-1">
        {sortedUsers.map((user) => {
          const isActive = selectedUserName === user.userName;

          return (
            <button
              key={user.id ?? user.userName}
              type="button"
              onClick={() => onSelectUser(user)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-indigo-400/60 bg-indigo-500/20"
                  : "border-transparent bg-slate-900/60 hover:border-white/10 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-300 text-sm font-bold text-slate-900">
                  {user.userName?.[0]?.toUpperCase() ?? "U"}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{user.userName}</p>
                  <p className="text-xs text-slate-400">Click to open chat</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default Sidebar;
