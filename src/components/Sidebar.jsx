import { useEffect, useState } from "react";
import {getUser} from "../auth/AuthUtils.js";

function Sidebar({ onSelectUser }) {

  const [users, setUsers] = useState([]);
    useEffect(() => {
    getUser().then(res => setUsers(res.data));
  }, []);

  return (
    <div className="w-1/4 bg-gray-800 border-r border-gray-700">

      <div className="p-4 text-lg font-semibold border-b border-gray-700">
        Chats
      </div>

      <div className="overflow-y-auto h-full">
        {users.map(user => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-700"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              {user.username[0].toUpperCase()}
            </div>

            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-400">Tap to chat</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Sidebar;